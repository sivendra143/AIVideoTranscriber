# VideoTranscriber Enhanced

An advanced video transcription and analysis tool with multi-language support, natural video understanding, context-aware suggestions, and interactive onboarding.

## Features

### Multi-language Support
- Automatic language detection for transcripts
- Support for multiple languages in the user interface
- Language-aware responses to questions

### Natural Video Understanding
- Automatic monitoring of video files placed in the `./video_inputs/` folder
- Transcription of video content with high accuracy
- Extraction of key points, action items, and context from videos
- Integration of video knowledge into the chatbot system

### Context-Aware Suggestions
- Intelligent suggestion of follow-up questions based on transcript content
- Dynamic generation of related topics derived from all available content
- Personalized suggestions based on conversation history

### Interactive Onboarding
- Step-by-step animated guidance for new users
- Engaging welcome modal with visual explanations
- Contextual help available throughout the application

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/VideoTranscriber.git
cd VideoTranscriber
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Access the application in your browser at `http://localhost:5000`

## Directory Structure

```
VideoTranscriber/
├── app.py                  # Main Flask application
├── transcript_to_pdf.py    # PDF generation module
├── language_utils.py       # Language detection and handling
├── video_monitor.py        # Video file monitoring
├── video_analyzer.py       # Video content analysis
├── knowledge_base.py       # Knowledge storage and retrieval
├── suggestion_engine.py    # Context-aware suggestion generation
├── static/                 # Static assets
│   ├── style.css           # Main stylesheet
│   ├── onboarding.js       # Onboarding animations
│   └── ...
├── templates/              # HTML templates
│   ├── base.html           # Base template
│   ├── index.html          # Home page
│   ├── chat_new.html       # Chat interface
│   ├── video_library.html  # Video library
│   ├── welcome_modal.html  # Welcome modal component
│   └── ...
├── uploads/                # Temporary storage for uploaded files
├── transcripts/            # Storage for generated transcripts
├── analysis/               # Storage for content analysis
└── video_inputs/           # Directory for automatic video processing
```

## Usage

### Transcribing Videos

1. Upload a video file through the web interface, or
2. Place a video file in the `./video_inputs/` folder for automatic processing

### Chatting with Transcripts

1. After transcription, navigate to the Chat interface
2. Ask questions about the transcript content
3. Use suggested follow-up questions for deeper exploration

### Video Library

1. Access all processed videos in the Video Library
2. View transcripts, analysis, and interact with content
3. Filter videos by language or search for specific content

## Configuration

The application can be configured through environment variables:

- `FLASK_SECRET_KEY`: Secret key for Flask session (default: 'dev-secret-key-123')
- `FLASK_DEBUG`: Enable debug mode (default: True)
- `UPLOAD_FOLDER`: Path for uploaded files (default: 'uploads')
- `MAX_CONTENT_LENGTH`: Maximum upload size in bytes (default: 100MB)

## Requirements

- Python 3.8+
- Flask
- Whisper (for transcription)
- NLTK (for natural language processing)
- FFmpeg (for video processing)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI Whisper for transcription capabilities
- NLTK for natural language processing
- Flask for the web framework

