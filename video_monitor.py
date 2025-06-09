"""
Video Monitor Module for VideoTranscriber application.

This module monitors a directory for new video files and automatically processes them.
"""

import os
import time
import threading
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import whisper
from transcript_to_pdf import create_pdf
from language_utils import detect_language
from datetime import datetime
import json
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("video_monitor.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("VideoMonitor")

# Global variables
VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v']
AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a']
SUPPORTED_EXTENSIONS = VIDEO_EXTENSIONS + AUDIO_EXTENSIONS

# Load whisper model (shared with main app)
model = None  # Will be initialized when needed

class VideoProcessor:
    """Handles the processing of video files."""
    
    def __init__(self, input_dir, output_dir, processed_dir, model_name="base"):
        """
        Initialize the video processor.
        
        Args:
            input_dir (str): Directory to monitor for new videos
            output_dir (str): Directory to save transcripts and PDFs
            processed_dir (str): Directory to move processed videos to
            model_name (str): Whisper model name to use
        """
        self.input_dir = os.path.abspath(input_dir)
        self.output_dir = os.path.abspath(output_dir)
        self.processed_dir = os.path.abspath(processed_dir)
        self.model_name = model_name
        self.model = None
        
        # Create directories if they don't exist
        for directory in [self.input_dir, self.output_dir, self.processed_dir]:
            os.makedirs(directory, exist_ok=True)
        
        logger.info(f"VideoProcessor initialized with input_dir={input_dir}, output_dir={output_dir}")
    
    def load_model(self):
        """Load the Whisper model if not already loaded."""
        global model
        if model is None:
            logger.info(f"Loading Whisper model: {self.model_name}")
            model = whisper.load_model(self.model_name)
        self.model = model
    
    def is_supported_file(self, filepath):
        """Check if the file is a supported video or audio file."""
        _, ext = os.path.splitext(filepath.lower())
        return ext in SUPPORTED_EXTENSIONS
    
    def process_file(self, filepath):
        """
        Process a video file: transcribe, analyze, and generate outputs.
        
        Args:
            filepath (str): Path to the video file
            
        Returns:
            dict: Processing results
        """
        try:
            logger.info(f"Processing file: {filepath}")
            
            # Load model if needed
            if self.model is None:
                self.load_model()
            
            # Get base filename without extension
            filename = os.path.basename(filepath)
            base_name = os.path.splitext(filename)[0]
            
            # Transcribe the audio
            logger.info(f"Transcribing: {filename}")
            result = self.model.transcribe(filepath)
            transcript = result["text"]
            
            # Detect language
            detected_language = detect_language(transcript)
            language_code = detected_language['code']
            language_name = detected_language['name']
            logger.info(f"Detected language: {language_name} ({language_code})")
            
            # Save transcript to file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            transcript_filename = f"{base_name}_{timestamp}.txt"
            transcript_path = os.path.join(self.output_dir, transcript_filename)
            
            with open(transcript_path, 'w', encoding='utf-8') as f:
                f.write(transcript)
            logger.info(f"Transcript saved to: {transcript_path}")
            
            # Generate PDF with analysis
            pdf_filename = f"{base_name}_{timestamp}.pdf"
            pdf_path = os.path.join(self.output_dir, pdf_filename)
            
            try:
                pdf_path = create_pdf(
                    transcript_text=transcript,
                    output_filename=pdf_path,
                    title=f"Transcript: {base_name}",
                    analyze_content=True
                )
                logger.info(f"PDF generated at: {pdf_path}")
            except Exception as e:
                logger.error(f"Error generating PDF: {str(e)}")
                pdf_path = None
            
            # Save metadata
            metadata = {
                "original_file": filename,
                "transcript_file": transcript_filename,
                "pdf_file": pdf_filename if pdf_path else None,
                "processed_date": datetime.now().isoformat(),
                "language": {
                    "code": language_code,
                    "name": language_name
                },
                "transcript_length": len(transcript),
                "word_count": len(transcript.split())
            }
            
            metadata_filename = f"{base_name}_{timestamp}.json"
            metadata_path = os.path.join(self.output_dir, metadata_filename)
            
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2)
            logger.info(f"Metadata saved to: {metadata_path}")
            
            # Move original file to processed directory
            processed_path = os.path.join(self.processed_dir, filename)
            shutil.move(filepath, processed_path)
            logger.info(f"Moved original file to: {processed_path}")
            
            return {
                "success": True,
                "transcript_path": transcript_path,
                "pdf_path": pdf_path,
                "metadata_path": metadata_path,
                "language": detected_language
            }
            
        except Exception as e:
            logger.error(f"Error processing file {filepath}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "error": str(e),
                "file": filepath
            }


class VideoEventHandler(FileSystemEventHandler):
    """Handles file system events for video files."""
    
    def __init__(self, processor):
        """
        Initialize the event handler.
        
        Args:
            processor (VideoProcessor): The video processor to use
        """
        self.processor = processor
        self.processing_files = set()  # Track files being processed
    
    def on_created(self, event):
        """
        Handle file creation events.
        
        Args:
            event: The file system event
        """
        if event.is_directory:
            return
            
        filepath = event.src_path
        
        # Check if it's a supported file and not already being processed
        if self.processor.is_supported_file(filepath) and filepath not in self.processing_files:
            logger.info(f"New file detected: {filepath}")
            
            # Wait a moment to ensure the file is fully written
            # This is important for network file systems or large files
            time.sleep(2)
            
            # Process in a separate thread to avoid blocking the observer
            self.processing_files.add(filepath)
            threading.Thread(target=self._process_file, args=(filepath,)).start()
    
    def _process_file(self, filepath):
        """
        Process a file in a separate thread.
        
        Args:
            filepath (str): Path to the file to process
        """
        try:
            # Check if file still exists (it might have been moved or deleted)
            if not os.path.exists(filepath):
                logger.warning(f"File no longer exists: {filepath}")
                self.processing_files.remove(filepath)
                return
                
            # Check if file is still being written to
            initial_size = os.path.getsize(filepath)
            time.sleep(2)  # Wait a bit
            if os.path.getsize(filepath) != initial_size:
                logger.info(f"File {filepath} is still being written to. Will process later.")
                self.processing_files.remove(filepath)
                return
                
            # Process the file
            self.processor.process_file(filepath)
            
        except Exception as e:
            logger.error(f"Error in _process_file for {filepath}: {str(e)}")
        finally:
            # Remove from processing set
            if filepath in self.processing_files:
                self.processing_files.remove(filepath)


class VideoMonitor:
    """Monitors a directory for new video files."""
    
    def __init__(self, input_dir="video_inputs", output_dir="video_outputs", processed_dir="video_processed", model_name="base"):
        """
        Initialize the video monitor.
        
        Args:
            input_dir (str): Directory to monitor for new videos
            output_dir (str): Directory to save transcripts and PDFs
            processed_dir (str): Directory to move processed videos to
            model_name (str): Whisper model name to use
        """
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.processed_dir = processed_dir
        self.model_name = model_name
        
        # Create processor
        self.processor = VideoProcessor(input_dir, output_dir, processed_dir, model_name)
        
        # Create observer
        self.event_handler = VideoEventHandler(self.processor)
        self.observer = Observer()
        
        logger.info(f"VideoMonitor initialized with input_dir={input_dir}")
    
    def start(self):
        """Start monitoring the directory."""
        # Process any existing files first
        self._process_existing_files()
        
        # Start watching for new files
        self.observer.schedule(self.event_handler, self.input_dir, recursive=False)
        self.observer.start()
        logger.info(f"Started monitoring directory: {self.input_dir}")
    
    def stop(self):
        """Stop monitoring the directory."""
        self.observer.stop()
        self.observer.join()
        logger.info("Stopped monitoring directory")
    
    def _process_existing_files(self):
        """Process any existing files in the input directory."""
        logger.info(f"Checking for existing files in {self.input_dir}")
        for filename in os.listdir(self.input_dir):
            filepath = os.path.join(self.input_dir, filename)
            if os.path.isfile(filepath) and self.processor.is_supported_file(filepath):
                logger.info(f"Found existing file: {filepath}")
                threading.Thread(target=self.processor.process_file, args=(filepath,)).start()


def start_monitor(input_dir="video_inputs", output_dir="video_outputs", processed_dir="video_processed", model_name="base"):
    """
    Start monitoring a directory for new video files.
    
    Args:
        input_dir (str): Directory to monitor for new videos
        output_dir (str): Directory to save transcripts and PDFs
        processed_dir (str): Directory to move processed videos to
        model_name (str): Whisper model name to use
        
    Returns:
        VideoMonitor: The monitor instance
    """
    monitor = VideoMonitor(input_dir, output_dir, processed_dir, model_name)
    monitor.start()
    return monitor


if __name__ == "__main__":
    # When run directly, start monitoring
    logger.info("Starting video monitor as standalone process")
    monitor = start_monitor()
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received. Stopping monitor.")
        monitor.stop()

