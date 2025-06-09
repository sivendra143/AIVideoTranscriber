"""
Suggestion Engine Module for VideoTranscriber application.

This module provides context-aware suggestions based on transcript content,
user questions, and conversation history.
"""

import re
import json
import random
from collections import Counter
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("suggestion_engine.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("SuggestionEngine")

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

class SuggestionEngine:
    """Generates context-aware suggestions for user questions."""
    
    def __init__(self):
        """Initialize the suggestion engine."""
        self.stop_words = set(stopwords.words('english'))
        
        # Common question patterns
        self.question_templates = {
            'what': [
                "What is {topic}?",
                "What are the key points about {topic}?",
                "What does {topic} mean in this context?",
                "What was discussed about {topic}?",
                "What are the implications of {topic}?"
            ],
            'how': [
                "How does {topic} work?",
                "How is {topic} implemented?",
                "How will {topic} affect the outcome?",
                "How was {topic} addressed?",
                "How can {topic} be improved?"
            ],
            'why': [
                "Why is {topic} important?",
                "Why was {topic} mentioned?",
                "Why should we consider {topic}?",
                "Why did {topic} happen?",
                "Why is {topic} relevant?"
            ],
            'when': [
                "When will {topic} be implemented?",
                "When was {topic} discussed?",
                "When is the deadline for {topic}?",
                "When should {topic} be addressed?",
                "When did {topic} first appear?"
            ],
            'who': [
                "Who is responsible for {topic}?",
                "Who mentioned {topic}?",
                "Who will implement {topic}?",
                "Who is affected by {topic}?",
                "Who should be involved with {topic}?"
            ],
            'action': [
                "What are the next steps for {topic}?",
                "What actions were decided for {topic}?",
                "What should be done about {topic}?",
                "How should we proceed with {topic}?",
                "What is the action plan for {topic}?"
            ],
            'summary': [
                "Can you summarize the key points about {topic}?",
                "What are the main takeaways about {topic}?",
                "What is the overview of {topic}?",
                "Can you provide a brief summary of {topic}?",
                "What is the essence of {topic}?"
            ]
        }
        
        # Follow-up patterns based on answer types
        self.followup_patterns = {
            'definition': [
                "Can you explain {topic} in simpler terms?",
                "What are some examples of {topic}?",
                "How is {topic} different from {related_topic}?",
                "What are the key components of {topic}?"
            ],
            'process': [
                "What are the steps involved in {topic}?",
                "What comes after {topic}?",
                "What are potential obstacles in {topic}?",
                "How long does {topic} typically take?"
            ],
            'comparison': [
                "What are the advantages of {topic} over {related_topic}?",
                "How does {topic} compare to {related_topic}?",
                "What are the pros and cons of {topic}?",
                "Which is better: {topic} or {related_topic}?"
            ],
            'decision': [
                "What factors influenced the decision about {topic}?",
                "Who made the final decision on {topic}?",
                "What alternatives to {topic} were considered?",
                "What are the implications of the decision on {topic}?"
            ],
            'action_item': [
                "Who is responsible for {topic}?",
                "What is the deadline for {topic}?",
                "What resources are needed for {topic}?",
                "What are the success criteria for {topic}?"
            ]
        }
        
        logger.info("SuggestionEngine initialized")
    
    def extract_topics(self, text):
        """
        Extract main topics from text.
        
        Args:
            text (str): Text to extract topics from
            
        Returns:
            list: List of topics
        """
        if not text or len(text.strip()) < 10:
            return []
        
        # Tokenize and remove stop words
        tokens = word_tokenize(text.lower())
        filtered_tokens = [token for token in tokens if token.isalnum() and token not in self.stop_words and len(token) > 2]
        
        # Get most common words
        word_freq = Counter(filtered_tokens)
        topics = [word for word, _ in word_freq.most_common(10)]
        
        return topics
    
    def extract_entities(self, text):
        """
        Extract named entities from text.
        
        Args:
            text (str): Text to extract entities from
            
        Returns:
            list: List of entities
        """
        # This is a simplified version without proper NER
        # In a production system, use a proper NER model
        
        # Look for capitalized words that might be names or organizations
        words = re.findall(r'\b[A-Z][a-z]+\b', text)
        
        # Remove duplicates and limit to top 5
        entities = list(set(words))[:5]
        
        return entities
    
    def generate_suggestions_from_transcript(self, transcript, count=5):
        """
        Generate suggestions based on transcript content.
        
        Args:
            transcript (str): Transcript text
            count (int): Number of suggestions to generate
            
        Returns:
            list: List of suggested questions
        """
        if not transcript or len(transcript.strip()) < 50:
            return self._get_generic_suggestions()
        
        # Extract topics
        topics = self.extract_topics(transcript)
        
        # Extract entities
        entities = self.extract_entities(transcript)
        
        # Combine topics and entities
        all_topics = topics + entities
        
        # Generate suggestions
        suggestions = []
        
        # Add summary suggestion
        suggestions.append("Can you summarize the key points of this transcript?")
        
        # Add action items suggestion
        suggestions.append("What are the main action items mentioned?")
        
        # Add topic-specific suggestions
        for topic in all_topics[:5]:  # Limit to top 5 topics
            # Select a random question type
            question_type = random.choice(list(self.question_templates.keys()))
            
            # Select a random template for that type
            template = random.choice(self.question_templates[question_type])
            
            # Format the template with the topic
            suggestion = template.format(topic=topic)
            
            suggestions.append(suggestion)
        
        # Ensure we have enough suggestions
        while len(suggestions) < count:
            suggestions.append(random.choice(self._get_generic_suggestions()))
        
        # Remove duplicates and limit to requested count
        unique_suggestions = list(dict.fromkeys(suggestions))
        
        return unique_suggestions[:count]
    
    def generate_suggestions_from_question(self, question, answer=None, count=3):
        """
        Generate follow-up suggestions based on a question and optional answer.
        
        Args:
            question (str): User's question
            answer (str, optional): Answer to the question
            count (int): Number of suggestions to generate
            
        Returns:
            list: List of suggested follow-up questions
        """
        if not question or len(question.strip()) < 5:
            return self._get_generic_suggestions()
        
        # Extract topics from question
        question_topics = self.extract_topics(question)
        
        # Extract topics from answer if available
        answer_topics = self.extract_topics(answer) if answer else []
        
        # Combine topics, prioritizing those from the answer
        all_topics = answer_topics + [t for t in question_topics if t not in answer_topics]
        
        # If no topics found, return generic suggestions
        if not all_topics:
            return self._get_generic_suggestions()
        
        # Determine question type
        question_lower = question.lower()
        question_type = None
        
        if 'what' in question_lower:
            question_type = 'what'
        elif 'how' in question_lower:
            question_type = 'how'
        elif 'why' in question_lower:
            question_type = 'why'
        elif 'when' in question_lower:
            question_type = 'when'
        elif 'who' in question_lower:
            question_type = 'who'
        
        # Generate suggestions
        suggestions = []
        
        # Add follow-up based on answer type if available
        if answer:
            answer_type = self._determine_answer_type(answer)
            
            if answer_type and answer_type in self.followup_patterns:
                # Get main topic
                main_topic = all_topics[0] if all_topics else "this"
                
                # Get related topic if available
                related_topic = all_topics[1] if len(all_topics) > 1 else "alternatives"
                
                # Select a random template
                template = random.choice(self.followup_patterns[answer_type])
                
                # Format the template
                suggestion = template.format(topic=main_topic, related_topic=related_topic)
                
                suggestions.append(suggestion)
        
        # Add suggestions based on question type
        if question_type:
            # Avoid the same question type
            other_types = [t for t in self.question_templates.keys() if t != question_type]
            
            # Select 2 random types
            selected_types = random.sample(other_types, min(2, len(other_types)))
            
            for topic in all_topics[:2]:  # Use top 2 topics
                for q_type in selected_types:
                    template = random.choice(self.question_templates[q_type])
                    suggestion = template.format(topic=topic)
                    suggestions.append(suggestion)
        
        # Add generic suggestions if needed
        while len(suggestions) < count:
            suggestions.append(random.choice(self._get_generic_suggestions()))
        
        # Remove duplicates and limit to requested count
        unique_suggestions = list(dict.fromkeys(suggestions))
        
        return unique_suggestions[:count]
    
    def generate_suggestions_from_conversation(self, conversation_history, count=3):
        """
        Generate suggestions based on conversation history.
        
        Args:
            conversation_history (list): List of conversation messages
            count (int): Number of suggestions to generate
            
        Returns:
            list: List of suggested questions
        """
        if not conversation_history:
            return self._get_generic_suggestions()
        
        # Extract all text from conversation
        all_text = " ".join([msg.get('content', '') for msg in conversation_history])
        
        # Extract topics
        topics = self.extract_topics(all_text)
        
        # Get the most recent question and answer
        recent_question = None
        recent_answer = None
        
        for i in range(len(conversation_history) - 1, -1, -1):
            msg = conversation_history[i]
            if msg.get('role') == 'user':
                recent_question = msg.get('content', '')
                break
        
        if recent_question and i < len(conversation_history) - 1:
            recent_answer = conversation_history[i + 1].get('content', '')
        
        # Generate suggestions
        suggestions = []
        
        # Add suggestions based on recent question and answer
        if recent_question and recent_answer:
            follow_ups = self.generate_suggestions_from_question(recent_question, recent_answer, 2)
            suggestions.extend(follow_ups)
        
        # Add suggestions based on topics
        for topic in topics[:3]:  # Use top 3 topics
            # Select a random question type
            question_type = random.choice(list(self.question_templates.keys()))
            
            # Select a random template for that type
            template = random.choice(self.question_templates[question_type])
            
            # Format the template with the topic
            suggestion = template.format(topic=topic)
            
            suggestions.append(suggestion)
        
        # Add summary suggestion
        suggestions.append("Can you summarize what we've discussed so far?")
        
        # Ensure we have enough suggestions
        while len(suggestions) < count:
            suggestions.append(random.choice(self._get_generic_suggestions()))
        
        # Remove duplicates and limit to requested count
        unique_suggestions = list(dict.fromkeys(suggestions))
        
        return unique_suggestions[:count]
    
    def _determine_answer_type(self, answer):
        """
        Determine the type of answer.
        
        Args:
            answer (str): Answer text
            
        Returns:
            str: Answer type
        """
        answer_lower = answer.lower()
        
        # Check for definition
        if re.search(r'is defined as|refers to|means|is a|is an|is the', answer_lower):
            return 'definition'
        
        # Check for process
        if re.search(r'steps|process|procedure|first|then|next|finally|stages', answer_lower):
            return 'process'
        
        # Check for comparison
        if re.search(r'compared to|versus|better than|worse than|advantages|disadvantages', answer_lower):
            return 'comparison'
        
        # Check for decision
        if re.search(r'decided|decision|chose|selected|determined|concluded', answer_lower):
            return 'decision'
        
        # Check for action item
        if re.search(r'task|action item|to-do|assigned|responsible|deadline', answer_lower):
            return 'action_item'
        
        # Default
        return 'definition'
    
    def _get_generic_suggestions(self):
        """
        Get generic suggestions.
        
        Returns:
            list: List of generic suggestions
        """
        return [
            "What are the main topics discussed?",
            "What are the key action items?",
            "Can you summarize the main points?",
            "Who are the key people mentioned?",
            "What decisions were made?",
            "What are the next steps?",
            "What is the timeline for implementation?",
            "What are the potential challenges?",
            "What resources are needed?",
            "How does this relate to previous discussions?"
        ]


# Singleton instance
_suggestion_engine = None

def get_suggestion_engine():
    """
    Get the singleton suggestion engine instance.
    
    Returns:
        SuggestionEngine: The suggestion engine instance
    """
    global _suggestion_engine
    if _suggestion_engine is None:
        _suggestion_engine = SuggestionEngine()
    return _suggestion_engine


if __name__ == "__main__":
    # When run directly, test the suggestion engine
    engine = get_suggestion_engine()
    
    # Test transcript suggestions
    test_transcript = """
    In today's meeting, we discussed the new product launch scheduled for next month.
    John from Marketing presented the campaign strategy, which includes social media ads and email marketing.
    Sarah raised concerns about the timeline, suggesting we might need to delay by two weeks.
    The team agreed to revisit the schedule next week after getting feedback from the development team.
    Action items: 1) John to finalize marketing materials by Friday, 2) Sarah to check with development team about readiness,
    3) Everyone to review the launch document and provide feedback by Monday.
    """
    
    print("Suggestions from transcript:")
    suggestions = engine.generate_suggestions_from_transcript(test_transcript)
    for i, suggestion in enumerate(suggestions, 1):
        print(f"{i}. {suggestion}")
    
    print("\nSuggestions from question:")
    test_question = "What is the timeline for the product launch?"
    test_answer = "The product launch is currently scheduled for next month, but there are discussions about potentially delaying it by two weeks due to concerns raised by Sarah. The team will revisit the schedule next week after getting feedback from the development team."
    suggestions = engine.generate_suggestions_from_question(test_question, test_answer)
    for i, suggestion in enumerate(suggestions, 1):
        print(f"{i}. {suggestion}")

