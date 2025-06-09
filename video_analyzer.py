"""
Video Analysis Module for VideoTranscriber application.

This module provides advanced analysis of video transcripts, extracting
action points, key topics, and contextual information.
"""

import os
import json
import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.probability import FreqDist
from collections import Counter
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("video_analyzer.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("VideoAnalyzer")

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

class VideoAnalyzer:
    """Analyzes video transcripts to extract meaningful information."""
    
    def __init__(self):
        """Initialize the video analyzer."""
        self.stop_words = set(stopwords.words('english'))
        
        # Action verbs that might indicate action items
        self.action_verbs = [
            'need', 'must', 'should', 'will', 'going to', 'plan to', 
            'decide', 'agree', 'propose', 'suggest', 'recommend', 'action',
            'task', 'todo', 'assign', 'deadline', 'due', 'follow up',
            'implement', 'create', 'develop', 'build', 'design', 'prepare',
            'schedule', 'organize', 'coordinate', 'review', 'update',
            'complete', 'finish', 'deliver', 'submit', 'send', 'share'
        ]
        
        # Phrases that might indicate important context
        self.context_phrases = [
            'important to note', 'keep in mind', 'remember that',
            'context', 'background', 'history', 'previously', 
            'in summary', 'to summarize', 'in conclusion',
            'key point', 'main idea', 'critical', 'crucial',
            'essential', 'fundamental', 'significant'
        ]
        
        logger.info("VideoAnalyzer initialized")
    
    def analyze_transcript(self, transcript_text):
        """
        Analyze a transcript to extract key information.
        
        Args:
            transcript_text (str): The transcript text to analyze
            
        Returns:
            dict: Analysis results including action points, key topics, etc.
        """
        if not transcript_text or len(transcript_text.strip()) < 10:
            return {
                'action_items': [],
                'key_points': [],
                'topics': [],
                'context': [],
                'summary': "Transcript too short for meaningful analysis."
            }
        
        try:
            # Tokenize into sentences
            sentences = sent_tokenize(transcript_text)
            
            # Extract action items
            action_items = self._extract_action_items(sentences)
            
            # Extract key points
            key_points = self._extract_key_points(transcript_text, sentences)
            
            # Extract topics
            topics = self._extract_topics(transcript_text)
            
            # Extract contextual information
            context = self._extract_context(sentences)
            
            # Generate summary
            summary = self._generate_summary(transcript_text, topics, action_items)
            
            return {
                'action_items': action_items,
                'key_points': key_points,
                'topics': topics,
                'context': context,
                'summary': summary
            }
            
        except Exception as e:
            logger.error(f"Error analyzing transcript: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                'action_items': [],
                'key_points': [],
                'topics': [],
                'context': [],
                'summary': f"Error analyzing transcript: {str(e)}"
            }
    
    def _extract_action_items(self, sentences):
        """
        Extract action items from sentences.
        
        Args:
            sentences (list): List of sentences
            
        Returns:
            list: Action items
        """
        action_items = []
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            
            # Check if sentence contains action verbs
            if any(verb in sentence_lower for verb in self.action_verbs):
                # Clean up the sentence
                clean_sentence = re.sub(r'\s+', ' ', sentence).strip()
                
                # Only include meaningful sentences
                if len(clean_sentence.split()) > 3:
                    action_items.append(clean_sentence)
        
        # Remove duplicates while preserving order
        action_items = list(dict.fromkeys(action_items))
        
        # Limit to top 15 action items
        return action_items[:15]
    
    def _extract_key_points(self, transcript_text, sentences):
        """
        Extract key points from the transcript.
        
        Args:
            transcript_text (str): Full transcript text
            sentences (list): List of sentences
            
        Returns:
            list: Key points
        """
        # Tokenize and remove stop words
        words = word_tokenize(transcript_text.lower())
        filtered_words = [word for word in words if word.isalnum() and word not in self.stop_words]
        
        # Get word frequencies
        word_freq = Counter(filtered_words)
        common_words = word_freq.most_common(20)
        
        # Find sentences containing key terms
        key_points = []
        for sentence in sentences:
            # Check if sentence contains any of the common important words
            sentence_words = set(word_tokenize(sentence.lower()))
            if any(word in sentence_words for word, _ in common_words[:10]):
                clean_sentence = re.sub(r'\s+', ' ', sentence).strip()
                if len(clean_sentence.split()) > 5:  # Only include meaningful sentences
                    key_points.append(clean_sentence)
        
        # Remove duplicates while preserving order
        key_points = list(dict.fromkeys(key_points))
        
        # Limit to top 15 key points
        return key_points[:15]
    
    def _extract_topics(self, transcript_text):
        """
        Extract main topics from the transcript.
        
        Args:
            transcript_text (str): Full transcript text
            
        Returns:
            list: Main topics
        """
        # Tokenize and tag parts of speech
        tokens = word_tokenize(transcript_text.lower())
        pos_tags = nltk.pos_tag(tokens)
        
        # Extract nouns (potential topics)
        nouns = [word for word, pos in pos_tags if pos.startswith('NN') and word not in self.stop_words]
        
        # Get most common nouns
        noun_freq = Counter(nouns)
        topics = [word for word, _ in noun_freq.most_common(10)]
        
        # Capitalize topics
        topics = [topic.capitalize() for topic in topics]
        
        return topics
    
    def _extract_context(self, sentences):
        """
        Extract contextual information from sentences.
        
        Args:
            sentences (list): List of sentences
            
        Returns:
            list: Contextual information
        """
        context = []
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            
            # Check if sentence contains context phrases
            if any(phrase in sentence_lower for phrase in self.context_phrases):
                clean_sentence = re.sub(r'\s+', ' ', sentence).strip()
                if len(clean_sentence.split()) > 5:  # Only include meaningful sentences
                    context.append(clean_sentence)
        
        # Remove duplicates while preserving order
        context = list(dict.fromkeys(context))
        
        # Limit to top 10 context items
        return context[:10]
    
    def _generate_summary(self, transcript_text, topics, action_items):
        """
        Generate a brief summary of the transcript.
        
        Args:
            transcript_text (str): Full transcript text
            topics (list): Extracted topics
            action_items (list): Extracted action items
            
        Returns:
            str: Summary
        """
        # Get word count
        word_count = len(transcript_text.split())
        
        # Create summary
        summary = f"This transcript contains {word_count} words"
        
        if topics:
            topic_str = ", ".join(topics[:5])
            summary += f" and discusses topics including {topic_str}"
        
        if action_items:
            summary += f". It contains {len(action_items)} action items or tasks"
        
        summary += "."
        
        return summary


def analyze_transcript_file(transcript_path, output_path=None):
    """
    Analyze a transcript file and save the results.
    
    Args:
        transcript_path (str): Path to the transcript file
        output_path (str, optional): Path to save the analysis results
        
    Returns:
        dict: Analysis results
    """
    try:
        # Read transcript
        with open(transcript_path, 'r', encoding='utf-8') as f:
            transcript_text = f.read()
        
        # Analyze transcript
        analyzer = VideoAnalyzer()
        results = analyzer.analyze_transcript(transcript_text)
        
        # Save results if output path is provided
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2)
            logger.info(f"Analysis results saved to: {output_path}")
        
        return results
        
    except Exception as e:
        logger.error(f"Error analyzing transcript file {transcript_path}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            'error': str(e),
            'file': transcript_path
        }


def analyze_all_transcripts(transcripts_dir="transcripts", output_dir="analysis"):
    """
    Analyze all transcript files in a directory.
    
    Args:
        transcripts_dir (str): Directory containing transcript files
        output_dir (str): Directory to save analysis results
        
    Returns:
        dict: Mapping of transcript files to analysis results
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    results = {}
    
    # Get all transcript files
    transcript_files = [f for f in os.listdir(transcripts_dir) if f.endswith('.txt')]
    
    for filename in transcript_files:
        transcript_path = os.path.join(transcripts_dir, filename)
        output_path = os.path.join(output_dir, f"{os.path.splitext(filename)[0]}_analysis.json")
        
        # Skip if analysis already exists and is newer than transcript
        if os.path.exists(output_path) and os.path.getmtime(output_path) > os.path.getmtime(transcript_path):
            logger.info(f"Skipping {filename} - analysis already exists")
            continue
        
        # Analyze transcript
        logger.info(f"Analyzing transcript: {filename}")
        result = analyze_transcript_file(transcript_path, output_path)
        results[filename] = result
    
    return results


if __name__ == "__main__":
    # When run directly, analyze all transcripts
    logger.info("Starting transcript analysis")
    results = analyze_all_transcripts()
    logger.info(f"Analyzed {len(results)} transcripts")

