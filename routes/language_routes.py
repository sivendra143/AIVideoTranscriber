from flask import Blueprint, request, session, redirect, url_for, jsonify

language_bp = Blueprint('language', __name__)

@language_bp.route('/api/languages', methods=['GET'])
def get_languages():
    # Demo list of languages
    languages = [
        {"code": "en", "name": "English"},
        {"code": "es", "name": "Spanish"},
        {"code": "fr", "name": "French"},
        {"code": "de", "name": "German"},
        {"code": "zh", "name": "Chinese"},
        {"code": "ja", "name": "Japanese"}
    ]
    return jsonify(languages)

