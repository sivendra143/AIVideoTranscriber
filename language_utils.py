"""
Language detection and handling utilities for VideoTranscriber application.
"""

import re
import json
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

# Set seed for consistent language detection
DetectorFactory.seed = 0

# Language names mapping
LANGUAGE_NAMES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'ru': 'Russian',
    'zh-cn': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'pl': 'Polish',
    'sv': 'Swedish',
    'vi': 'Vietnamese',
    'th': 'Thai'
}

def detect_language(text):
    """
    Detect the language of a text.
    
    Args:
        text (str): Text to detect language from
        
    Returns:
        dict: Language code and name
    """
    if not text or len(text.strip()) < 10:
        return {'code': 'en', 'name': 'English', 'confidence': 1.0}
    
    try:
        # Clean text for better detection
        clean_text = re.sub(r'[^\w\s]', '', text[:1000])
        
        # Detect language
        lang_code = detect(clean_text)
        
        # Map language code to name
        lang_name = LANGUAGE_NAMES.get(lang_code, 'Unknown')
        
        return {
            'code': lang_code,
            'name': lang_name,
            'confidence': 0.9  # langdetect doesn't provide confidence scores
        }
    except LangDetectException as e:
        print(f"Language detection error: {str(e)}")
        return {'code': 'en', 'name': 'English', 'confidence': 0.5}

def get_response_in_language(text, target_language):
    """
    Get a response in the target language.
    
    Args:
        text (str): Text to translate
        target_language (str): Target language code
        
    Returns:
        str: Translated text
    """
    # If target language is English, return as is
    if target_language == 'en':
        return text
    
    # For now, we'll use a simple approach of adding a note about the language
    # In a production system, this would use a translation API
    language_name = LANGUAGE_NAMES.get(target_language, target_language)
    
    return f"{text}\n\n[Note: This response would be translated to {language_name} in a production system.]"

def store_language_preference(user_id, language_code):
    """
    Store a user's language preference.
    
    Args:
        user_id (str): User ID
        language_code (str): Language code
    """
    # In a production system, this would store to a database
    # For now, we'll just print a message
    print(f"Storing language preference for user {user_id}: {language_code}")

def get_language_preference(user_id):
    """
    Get a user's language preference.
    
    Args:
        user_id (str): User ID
        
    Returns:
        str: Language code or None if not found
    """
    # In a production system, this would retrieve from a database
    # For now, we'll just return None
    return None

