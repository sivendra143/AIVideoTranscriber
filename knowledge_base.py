"""
Knowledge Base Module for VideoTranscriber application.

This module manages a knowledge base of video transcripts and their analyses,
providing context-aware responses and suggestions.
"""

import os
import json
import re
import logging
from datetime import datetime
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from collections import Counter
import math

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("knowledge_base.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("KnowledgeBase")

class KnowledgeBase:
    """Manages a knowledge base of video transcripts and analyses."""
    
    def __init__(self, transcripts_dir="transcripts", analysis_dir="analysis", video_outputs_dir="video_outputs"):
        """
        Initialize the knowledge base.
        
        Args:
            transcripts_dir (str): Directory containing transcript files
            analysis_dir (str): Directory containing analysis files
            video_outputs_dir (str): Directory containing video output files
        """
        self.transcripts_dir = transcripts_dir
        self.analysis_dir = analysis_dir
        self.video_outputs_dir = video_outputs_dir
        
        # Create directories if they don't exist
        for directory in [self.transcripts_dir, self.analysis_dir, self.video_outputs_dir]:
            os.makedirs(directory, exist_ok=True)
        
        # Initialize NLTK resources
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('punkt')
            nltk.download('stopwords')
        
        self.stop_words = set(stopwords.words('english'))
        
        # Load knowledge base
        self.knowledge = self._load_knowledge()
        
        logger.info(f"KnowledgeBase initialized with {len(self.knowledge)} entries")
    
    def _load_knowledge(self):
        """
        Load knowledge from transcript and analysis files.
        
        Returns:
            dict: Knowledge base entries
        """
        knowledge = {}
        
        # Get all transcript files
        transcript_files = [f for f in os.listdir(self.transcripts_dir) if f.endswith('.txt')]
        
        for filename in transcript_files:
            transcript_id = os.path.splitext(filename)[0]
            transcript_path = os.path.join(self.transcripts_dir, filename)
            
            # Check for analysis file
            analysis_path = os.path.join(self.analysis_dir, f"{transcript_id}_analysis.json")
            
            entry = {
                'id': transcript_id,
                'transcript_path': transcript_path,
                'analysis_path': analysis_path if os.path.exists(analysis_path) else None,
                'metadata': None,
                'transcript': None,
                'analysis': None,
                'last_accessed': None,
                'vector': None  # For similarity calculations
            }
            
            # Check for metadata file
            metadata_path = os.path.join(self.video_outputs_dir, f"{transcript_id}.json")
            if os.path.exists(metadata_path):
                try:
                    with open(metadata_path, 'r', encoding='utf-8') as f:
                        entry['metadata'] = json.load(f)
                except Exception as e:
                    logger.error(f"Error loading metadata from {metadata_path}: {str(e)}")
            
            knowledge[transcript_id] = entry
        
        return knowledge
    
    def refresh(self):
        """Refresh the knowledge base with any new files."""
        self.knowledge = self._load_knowledge()
        logger.info(f"Knowledge base refreshed with {len(self.knowledge)} entries")
    
    def get_transcript(self, transcript_id):
        """
        Get a transcript by ID.
        
        Args:
            transcript_id (str): ID of the transcript
            
        Returns:
            str: Transcript text or None if not found
        """
        if transcript_id not in self.knowledge:
            return None
        
        entry = self.knowledge[transcript_id]
        
        # Load transcript if not already loaded
        if entry['transcript'] is None:
            try:
                with open(entry['transcript_path'], 'r', encoding='utf-8') as f:
                    entry['transcript'] = f.read()
                entry['last_accessed'] = datetime.now()
            except Exception as e:
                logger.error(f"Error loading transcript {transcript_id}: {str(e)}")
                return None
        
        return entry['transcript']
    
    def get_analysis(self, transcript_id):
        """
        Get analysis for a transcript by ID.
        
        Args:
            transcript_id (str): ID of the transcript
            
        Returns:
            dict: Analysis data or None if not found
        """
        if transcript_id not in self.knowledge:
            return None
        
        entry = self.knowledge[transcript_id]
        
        # Check if analysis exists
        if entry['analysis_path'] is None:
            return None
        
        # Load analysis if not already loaded
        if entry['analysis'] is None:
            try:
                with open(entry['analysis_path'], 'r', encoding='utf-8') as f:
                    entry['analysis'] = json.load(f)
                entry['last_accessed'] = datetime.now()
            except Exception as e:
                logger.error(f"Error loading analysis for {transcript_id}: {str(e)}")
                return None
        
        return entry['analysis']
    
    def get_all_transcripts(self):
        """
        Get a list of all transcript IDs.
        
        Returns:
            list: List of transcript IDs
        """
        return list(self.knowledge.keys())
    
    def get_transcript_metadata(self, transcript_id):
        """
        Get metadata for a transcript by ID.
        
        Args:
            transcript_id (str): ID of the transcript
            
        Returns:
            dict: Metadata or None if not found
        """
        if transcript_id not in self.knowledge:
            return None
        
        return self.knowledge[transcript_id]['metadata']
    
    def search_transcripts(self, query, limit=5):
        """
        Search transcripts for a query.
        
        Args:
            query (str): Search query
            limit (int): Maximum number of results to return
            
        Returns:
            list: List of matching transcript IDs with relevance scores
        """
        if not query or len(query.strip()) < 2:
            return []
        
        query = query.lower()
        query_terms = [term for term in word_tokenize(query) if term.isalnum() and term not in self.stop_words]
        
        if not query_terms:
            return []
        
        # Calculate TF-IDF for query terms in each transcript
        results = []
        
        for transcript_id, entry in self.knowledge.items():
            # Load transcript if needed
            transcript = self.get_transcript(transcript_id)
            if not transcript:
                continue
            
            # Calculate relevance score
            score = self._calculate_relevance(transcript, query_terms)
            
            if score > 0:
                results.append({
                    'id': transcript_id,
                    'score': score,
                    'metadata': entry['metadata']
                })
        
        # Sort by relevance score
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # Return top results
        return results[:limit]
    
    def _calculate_relevance(self, text, query_terms):
        """
        Calculate relevance score of text for query terms.
        
        Args:
            text (str): Text to search in
            query_terms (list): List of query terms
            
        Returns:
            float: Relevance score
        """
        text_lower = text.lower()
        
        # Simple term frequency scoring
        score = 0
        for term in query_terms:
            term_count = text_lower.count(term)
            if term_count > 0:
                # Log term frequency to prevent bias towards longer documents
                score += (1 + math.log10(term_count))
        
        return score
    
    def get_context_for_question(self, question, transcript_id=None):
        """
        Get relevant context for a question.
        
        Args:
            question (str): The question to get context for
            transcript_id (str, optional): Specific transcript ID to use
            
        Returns:
            dict: Context information
        """
        question = question.lower()
        question_terms = [term for term in word_tokenize(question) if term.isalnum() and term not in self.stop_words]
        
        context = {
            'transcripts': [],
            'action_items': [],
            'key_points': [],
            'topics': []
        }
        
        # If transcript_id is provided, only use that transcript
        if transcript_id:
            if transcript_id in self.knowledge:
                transcript = self.get_transcript(transcript_id)
                analysis = self.get_analysis(transcript_id)
                
                if transcript:
                    context['transcripts'].append({
                        'id': transcript_id,
                        'text': transcript[:1000],  # First 1000 chars
                        'metadata': self.knowledge[transcript_id]['metadata']
                    })
                
                if analysis:
                    context['action_items'].extend(analysis.get('action_items', [])[:5])
                    context['key_points'].extend(analysis.get('key_points', [])[:5])
                    context['topics'].extend(analysis.get('topics', [])[:5])
            
            return context
        
        # Otherwise, search all transcripts
        relevant_transcripts = self.search_transcripts(question, limit=3)
        
        for result in relevant_transcripts:
            transcript_id = result['id']
            transcript = self.get_transcript(transcript_id)
            analysis = self.get_analysis(transcript_id)
            
            if transcript:
                context['transcripts'].append({
                    'id': transcript_id,
                    'text': transcript[:1000],  # First 1000 chars
                    'metadata': self.knowledge[transcript_id]['metadata']
                })
            
            if analysis:
                context['action_items'].extend(analysis.get('action_items', [])[:3])
                context['key_points'].extend(analysis.get('key_points', [])[:3])
                context['topics'].extend(analysis.get('topics', [])[:3])
        
        # Remove duplicates
        context['action_items'] = list(dict.fromkeys(context['action_items']))[:5]
        context['key_points'] = list(dict.fromkeys(context['key_points']))[:5]
        context['topics'] = list(dict.fromkeys(context['topics']))[:5]
        
        return context
    
    def generate_suggestions(self, question, transcript_id=None):
        """
        Generate follow-up suggestions based on a question.
        
        Args:
            question (str): The question to generate suggestions for
            transcript_id (str, optional): Specific transcript ID to use
            
        Returns:
            list: Suggested follow-up questions
        """
        # Get context for the question
        context = self.get_context_for_question(question, transcript_id)
        
        suggestions = []
        
        # Add topic-based suggestions
        for topic in context['topics']:
            suggestions.append(f"Tell me more about {topic}")
        
        # Add action item suggestions
        if context['action_items']:
            suggestions.append("What are the main action items?")
            suggestions.append("Who is responsible for the action items?")
        
        # Add key point suggestions
        if context['key_points']:
            suggestions.append("What are the key points discussed?")
            suggestions.append("Can you summarize the main ideas?")
        
        # Add transcript-specific suggestions
        for transcript in context['transcripts']:
            metadata = transcript.get('metadata')
            if metadata:
                title = metadata.get('original_file', '').replace('_', ' ').split('.')[0]
                if title:
                    suggestions.append(f"What is the main topic of {title}?")
        
        # Add general suggestions
        general_suggestions = [
            "What are the main conclusions?",
            "Are there any important deadlines mentioned?",
            "Who are the key people involved?",
            "What decisions were made?",
            "What are the next steps?"
        ]
        
        # Combine and deduplicate suggestions
        all_suggestions = suggestions + general_suggestions
        unique_suggestions = list(dict.fromkeys(all_suggestions))
        
        # Limit to 5 suggestions
        return unique_suggestions[:5]


# Singleton instance
_knowledge_base = None

def get_knowledge_base():
    """
    Get the singleton knowledge base instance.
    
    Returns:
        KnowledgeBase: The knowledge base instance
    """
    global _knowledge_base
    if _knowledge_base is None:
        _knowledge_base = KnowledgeBase()
    return _knowledge_base


if __name__ == "__main__":
    # When run directly, initialize and test the knowledge base
    kb = get_knowledge_base()
    print(f"Loaded {len(kb.get_all_transcripts())} transcripts")
    
    # Test search
    if kb.get_all_transcripts():
        test_query = "meeting action items"
        results = kb.search_transcripts(test_query)
        print(f"Search results for '{test_query}':")
        for result in results:
            print(f"- {result['id']} (score: {result['score']})")
        
        # Test suggestions
        suggestions = kb.generate_suggestions(test_query)
        print("Suggested follow-up questions:")
        for suggestion in suggestions:
            print(f"- {suggestion}")

