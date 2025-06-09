"""
Dynamic Chatbot Prompt Generation Module

This module implements advanced techniques to generate dynamic, context-aware
prompts for the chatbot based on video content analysis. It uses the content
classification from the content detection module to create personalized and
relevant prompt suggestions.
"""

import re
import random
from datetime import datetime

# Domain-specific prompt templates
DOMAIN_TEMPLATES = {
    'business_meeting': {
        'action_items': [
            "What action items were assigned in this meeting?",
            "List all the tasks that were delegated during this meeting.",
            "What are the next steps mentioned in this meeting?",
            "Who was assigned which responsibilities in this meeting?",
            "What deadlines were mentioned for the action items?"
        ],
        'summary': [
            "Can you summarize the key points discussed in this meeting?",
            "What were the main topics covered in this business meeting?",
            "Provide a brief summary of the meeting outcomes.",
            "What decisions were made during this meeting?",
            "What were the major conclusions from this meeting?"
        ],
        'participants': [
            "Who were the key participants in this meeting?",
            "What role did each person play in the meeting?",
            "Who led the discussion on each topic?",
            "Which stakeholders were mentioned but not present?",
            "Who had the most speaking time during this meeting?"
        ],
        'follow_up': [
            "What follow-up meetings were scheduled?",
            "What issues were postponed for future discussion?",
            "What topics need further research before the next meeting?",
            "What dependencies were identified that might affect progress?",
            "What risks or concerns were raised that need monitoring?"
        ]
    },
    'technical_tutorial': {
        'concepts': [
            "What are the key concepts explained in this tutorial?",
            "Explain the main technical principles covered in this video.",
            "What are the fundamental ideas presented in this tutorial?",
            "What technical problems does this tutorial solve?",
            "What are the core algorithms or methods discussed?"
        ],
        'implementation': [
            "How would you implement the solution described in this tutorial?",
            "What are the steps to reproduce this technical approach?",
            "What code examples were provided in this tutorial?",
            "What tools or libraries are needed to implement this solution?",
            "What are the potential pitfalls in implementing this approach?"
        ],
        'prerequisites': [
            "What prerequisites are needed to understand this tutorial?",
            "What background knowledge is assumed in this technical video?",
            "What skills would someone need before attempting this tutorial?",
            "What related technologies should I learn first?",
            "Is this tutorial suitable for beginners or more advanced users?"
        ],
        'applications': [
            "What are the practical applications of this technique?",
            "In what scenarios would this technical approach be useful?",
            "How can this technology be applied in real-world projects?",
            "What industries could benefit from this technical solution?",
            "What problems can be solved using this approach?"
        ]
    },
    'educational_lecture': {
        'main_concepts': [
            "What are the main concepts covered in this lecture?",
            "Summarize the key theories discussed in this educational video.",
            "What are the fundamental principles explained in this lecture?",
            "What is the central thesis of this educational content?",
            "What are the most important ideas presented by the lecturer?"
        ],
        'examples': [
            "What examples were used to illustrate the concepts?",
            "How did the lecturer demonstrate the practical applications?",
            "What case studies were mentioned in this lecture?",
            "What analogies or metaphors were used to explain complex ideas?",
            "What real-world scenarios were referenced in this lecture?"
        ],
        'connections': [
            "How does this topic connect to previous lectures or concepts?",
            "What is the relationship between this lecture and the broader field?",
            "How does this lecture build on foundational knowledge?",
            "What interdisciplinary connections were made in this lecture?",
            "How does this topic relate to current research or developments?"
        ],
        'further_study': [
            "What further reading was recommended on this topic?",
            "What additional resources should I explore to learn more?",
            "What follow-up topics should I study next?",
            "What research papers or books were referenced?",
            "What advanced concepts build upon this lecture material?"
        ]
    },
    'product_demo': {
        'features': [
            "What are the key features of this product?",
            "What capabilities does this product offer?",
            "What are the main selling points highlighted in this demo?",
            "What makes this product unique according to the presentation?",
            "What functionality was showcased in this product demonstration?"
        ],
        'comparison': [
            "How does this product compare to competitors?",
            "What advantages does this product have over alternatives?",
            "What limitations or disadvantages were mentioned?",
            "How does this product fit into the existing market?",
            "What differentiates this product from similar offerings?"
        ],
        'use_cases': [
            "What problem does this product solve?",
            "What are the intended use cases for this product?",
            "Who is the target audience for this product?",
            "What industries or sectors would benefit most from this product?",
            "What specific scenarios was this product designed for?"
        ],
        'pricing': [
            "What pricing options were mentioned for this product?",
            "What subscription models or payment plans are available?",
            "Is there a free trial or freemium version of this product?",
            "What is the cost structure for different features or tiers?",
            "Are there any special offers or discounts mentioned?"
        ]
    },
    'interview': {
        'insights': [
            "What were the most insightful questions asked in this interview?",
            "What were the most interesting responses from the interviewee?",
            "What unique perspectives were shared in this conversation?",
            "What surprising revelations came up during this interview?",
            "What thought-provoking ideas were discussed?"
        ],
        'background': [
            "What is the background of the person being interviewed?",
            "What qualifications or expertise does the interviewee have?",
            "What career path or journey did the interviewee describe?",
            "What formative experiences shaped the interviewee's perspective?",
            "What organizations or projects has the interviewee been involved with?"
        ],
        'opinions': [
            "What strong opinions did the interviewee express?",
            "What controversial statements were made during the interview?",
            "What predictions or forecasts did the interviewee make?",
            "What criticisms or concerns did the interviewee raise?",
            "What solutions or recommendations did the interviewee propose?"
        ],
        'takeaways': [
            "What are the key takeaways from this interview?",
            "What conclusions can be drawn from this conversation?",
            "What lessons can be learned from the interviewee's experience?",
            "What actionable advice did the interviewee offer?",
            "What broader implications do the interviewee's insights have?"
        ]
    }
}

# Generic prompt templates for unknown content types
GENERIC_TEMPLATES = {
    'summary': [
        "Summarize the key points of this video.",
        "What are the main topics discussed in this content?",
        "What is the overall purpose of this video?",
        "What is the central message of this content?",
        "What are the most important ideas presented in this video?"
    ],
    'speakers': [
        "Who are the main speakers in this video?",
        "What are the roles or positions of the people speaking?",
        "Who has the most speaking time in this video?",
        "Are there any guest appearances or special contributors?",
        "What is the relationship between the different speakers?"
    ],
    'structure': [
        "How is this video structured or organized?",
        "What is the format of this content (e.g., presentation, discussion, demonstration)?",
        "How does the video progress from beginning to end?",
        "What are the different sections or segments of this video?",
        "Is there a clear introduction, body, and conclusion?"
    ],
    'audience': [
        "Who is the intended audience for this content?",
        "What level of knowledge is assumed of the viewers?",
        "Is this content aimed at beginners or experts?",
        "What background would be helpful to understand this content?",
        "How accessible is this content to a general audience?"
    ]
}

# Temporal prompt templates
TEMPORAL_TEMPLATES = {
    'beginning': [
        "What was discussed in the first part of the video?",
        "Summarize the introduction of this content.",
        "What topics were established at the beginning?",
        "How did the video start and what context was provided?",
        "What was the opening statement or premise?"
    ],
    'middle': [
        "What key points were covered in the middle section?",
        "How did the discussion evolve in the main part of the video?",
        "What was the most substantial part of the middle section?",
        "What supporting evidence or examples were provided in the main content?",
        "What challenges or problems were addressed in the central part?"
    ],
    'end': [
        "How did the video conclude?",
        "What final points or summary was given at the end?",
        "What call to action or next steps were mentioned in the conclusion?",
        "What were the closing remarks?",
        "What lasting impression did the ending leave?"
    ]
}

# Entity-based prompt templates
ENTITY_TEMPLATES = {
    'people': [
        "Who are the people mentioned in this video?",
        "What roles do the mentioned individuals play?",
        "How are the different people connected to each other?",
        "Which people were referenced most frequently?",
        "What experts or authorities were cited?"
    ],
    'organizations': [
        "What organizations or companies were mentioned?",
        "What is the relationship between the different organizations discussed?",
        "How are the mentioned organizations relevant to the topic?",
        "What role do these organizations play in the context discussed?",
        "Which organization was the primary focus of the discussion?"
    ],
    'locations': [
        "What locations or places were mentioned in this video?",
        "How are the different locations relevant to the topic?",
        "What geographical context is important to understand this content?",
        "Were any regional differences or characteristics discussed?",
        "How do the mentioned locations relate to each other?"
    ],
    'dates': [
        "What important dates or time periods were mentioned?",
        "What is the chronology of events discussed in this video?",
        "How does the timeline presented relate to the main topic?",
        "What historical context is relevant to understand this content?",
        "What future dates or deadlines were mentioned?"
    ]
}

class PromptGenerator:
    """
    A class to generate dynamic, context-aware prompts for the chatbot
    based on video content analysis.
    """
    
    def __init__(self, domain=None, transcript=None, topics=None, user_history=None):
        """
        Initialize the PromptGenerator with content information.
        
        Args:
            domain (str): The primary domain/classification of the content
            transcript (str): The transcript text of the video
            topics (list): List of topics extracted from the content
            user_history (list): Previous user interactions
        """
        self.domain = domain if domain else "unknown"
        self.transcript = transcript if transcript else ""
        self.topics = topics if topics else []
        self.user_history = user_history if user_history else []
        
        # Clean domain name for template lookup
        self.clean_domain = self._clean_domain_name(domain)
    
    def _clean_domain_name(self, domain):
        """Clean domain name for template lookup"""
        if not domain:
            return "unknown"
        
        # Convert domain_name to lowercase and replace spaces with underscores
        return domain.lower().replace(' ', '_')
    
    def _extract_entities(self, text):
        """
        Simple entity extraction from transcript.
        In a real implementation, this would use NER.
        """
        entities = {
            'people': [],
            'organizations': [],
            'locations': [],
            'dates': []
        }
        
        # Simple regex patterns for demonstration
        # Names (capitalized words)
        name_pattern = r'\b[A-Z][a-z]+ [A-Z][a-z]+\b'
        entities['people'] = list(set(re.findall(name_pattern, text)))
        
        # Organizations (capitalized words ending with common suffixes)
        org_pattern = r'\b[A-Z][a-z]+ (?:Inc|LLC|Ltd|Corporation|Company|Group|Association)\b'
        entities['organizations'] = list(set(re.findall(org_pattern, text)))
        
        # Locations (common place indicators)
        loc_pattern = r'\b(?:in|at|from|to) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b'
        loc_matches = re.findall(loc_pattern, text)
        entities['locations'] = list(set([match for match in loc_matches if match not in entities['people']]))
        
        # Dates (simple date patterns)
        date_pattern = r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b'
        entities['dates'] = list(set(re.findall(date_pattern, text)))
        
        return entities
    
    def _get_domain_templates(self):
        """Get templates for the specific domain"""
        if self.clean_domain in DOMAIN_TEMPLATES:
            return DOMAIN_TEMPLATES[self.clean_domain]
        return {}
    
    def _get_transcript_length(self):
        """Get the length category of the transcript"""
        if not self.transcript:
            return "unknown"
        
        length = len(self.transcript)
        if length < 1000:
            return "short"
        elif length < 5000:
            return "medium"
        else:
            return "long"
    
    def _get_time_of_day(self):
        """Get the current time of day"""
        hour = datetime.now().hour
        if 5 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        elif 17 <= hour < 22:
            return "evening"
        else:
            return "night"
    
    def generate_domain_specific_prompts(self, count=3):
        """
        Generate domain-specific prompts based on content classification.
        
        Args:
            count (int): Number of prompts to generate
            
        Returns:
            list: List of generated prompts
        """
        prompts = []
        
        # Get domain-specific templates
        domain_templates = self._get_domain_templates()
        
        if domain_templates:
            # Select prompts from each category in the domain
            for category, templates in domain_templates.items():
                if templates:
                    prompts.append(random.choice(templates))
                    
                    # Break if we have enough prompts
                    if len(prompts) >= count:
                        break
        
        # If we don't have enough domain-specific prompts, add generic ones
        while len(prompts) < count:
            category = random.choice(list(GENERIC_TEMPLATES.keys()))
            templates = GENERIC_TEMPLATES[category]
            prompt = random.choice(templates)
            
            # Avoid duplicates
            if prompt not in prompts:
                prompts.append(prompt)
        
        return prompts
    
    def generate_temporal_prompts(self, count=2):
        """
        Generate prompts related to different parts of the video.
        
        Args:
            count (int): Number of prompts to generate
            
        Returns:
            list: List of generated prompts
        """
        prompts = []
        
        # Only generate temporal prompts for medium or long transcripts
        transcript_length = self._get_transcript_length()
        if transcript_length in ["medium", "long"]:
            # Select temporal sections to focus on
            sections = random.sample(list(TEMPORAL_TEMPLATES.keys()), min(count, len(TEMPORAL_TEMPLATES)))
            
            for section in sections:
                templates = TEMPORAL_TEMPLATES[section]
                prompts.append(random.choice(templates))
        
        return prompts
    
    def generate_entity_based_prompts(self, count=2):
        """
        Generate prompts based on entities mentioned in the transcript.
        
        Args:
            count (int): Number of prompts to generate
            
        Returns:
            list: List of generated prompts
        """
        prompts = []
        
        if self.transcript:
            # Extract entities from transcript
            entities = self._extract_entities(self.transcript)
            
            # Generate prompts for entity types that have entries
            for entity_type, entity_list in entities.items():
                if entity_list and entity_type in ENTITY_TEMPLATES:
                    templates = ENTITY_TEMPLATES[entity_type]
                    prompts.append(random.choice(templates))
                    
                    # Break if we have enough prompts
                    if len(prompts) >= count:
                        break
        
        return prompts
    
    def generate_personalized_prompts(self, count=5):
        """
        Generate personalized prompts based on user history and time of day.
        
        Args:
            count (int): Number of prompts to generate
            
        Returns:
            list: List of generated prompts
        """
        # Get time of day for personalization
        time_of_day = self._get_time_of_day()
        
        # Generate domain-specific prompts
        domain_prompts = self.generate_domain_specific_prompts(count=3)
        
        # Generate temporal prompts
        temporal_prompts = self.generate_temporal_prompts(count=1)
        
        # Generate entity-based prompts
        entity_prompts = self.generate_entity_based_prompts(count=1)
        
        # Combine all prompts
        all_prompts = domain_prompts + temporal_prompts + entity_prompts
        
        # If we have more prompts than requested, select a random subset
        if len(all_prompts) > count:
            all_prompts = random.sample(all_prompts, count)
        
        return all_prompts

def generate_dynamic_suggestions(domain, transcript=None, topics=None, user_history=None, count=5):
    """
    Generate dynamic suggestions based on detected domain and topics.
    
    Args:
        domain (str): The primary domain/classification of the content
        transcript (str): The transcript text of the video
        topics (list): List of topics extracted from the content
        user_history (list): Previous user interactions
        count (int): Number of suggestions to generate
        
    Returns:
        list: List of generated suggestions
    """
    # Create prompt generator
    generator = PromptGenerator(domain, transcript, topics, user_history)
    
    # Generate personalized prompts
    suggestions = generator.generate_personalized_prompts(count=count)
    
    return suggestions

# Example usage
if __name__ == "__main__":
    # Example transcript
    transcript = """
    Welcome to our quarterly business meeting. Today, we'll be discussing our Q3 results and planning for Q4.
    
    John Smith from the Sales department will present the sales figures, followed by Jane Doe from Marketing
    who will discuss our new campaign launching in October 2023. We also have a special guest, 
    Michael Johnson from Johnson Consulting Group, who will share insights on market trends.
    
    Our company, Acme Corporation, has seen a 15% growth in the New York region, but we're still
    struggling in the Chicago area. We need to address this before our annual meeting in December 15th, 2023.
    
    Let's start with the action items from our last meeting. Sarah was supposed to follow up with the
    client in Boston, and David was tasked with preparing the budget proposal for the new project.
    """
    
    # Generate suggestions
    suggestions = generate_dynamic_suggestions(
        domain="business_meeting",
        transcript=transcript,
        count=5
    )
    
    print("Generated Suggestions:")
    for i, suggestion in enumerate(suggestions, 1):
        print(f"{i}. {suggestion}")

