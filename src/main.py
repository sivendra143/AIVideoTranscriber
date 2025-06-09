from flask import Flask, render_template, request, session, redirect, url_for, jsonify, send_from_directory, flash
from werkzeug.utils import secure_filename
import os
import json
import threading
from datetime import datetime

app = Flask(__name__, 
            template_folder='../templates',
            static_folder='../static')
app.secret_key = 'videotranscriber_secret_key'
app.config['UPLOAD_FOLDER'] = '../uploads'
app.config['VIDEO_FOLDER'] = '../video_inputs'
app.config['OUTPUT_FOLDER'] = '../video_outputs'
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'mp3', 'wav', 'ogg', 'flac', 'webm'}
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB limit

# Create necessary folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['VIDEO_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    # For demo purposes, we'll simulate having a transcript
    transcript = session.get('transcript', '')
    action_points = session.get('action_points', '')
    detected_language = session.get('detected_language', {'code': 'en', 'name': 'English'})
    return render_template('index.html', transcript=transcript, action_points=action_points, detected_language=detected_language)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    # This is a demo version that doesn't actually transcribe
    # It just simulates the process for UI/UX demonstration
    
    if 'file' not in request.files:
        flash('No file part', 'error')
        return redirect(url_for('index'))
    
    file = request.files['file']
    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('index'))
    
    if file and allowed_file(file.filename):
        # For demo purposes, we'll just simulate processing
        mode = request.form.get('mode', 'script')
        
        # Simulate processing delay
        import time
        time.sleep(2)
        
        # Set demo content
        if mode == 'script':
            session['transcript'] = "This is a demo transcript. The actual transcription functionality requires additional dependencies."
            session['action_points'] = ""
        else:
            session['transcript'] = ""
            session['action_points'] = "1. This is a demo action point.\n2. The actual action points extraction requires additional dependencies."
        
        session['detected_language'] = {'code': 'en', 'name': 'English'}
        session['transcript_file'] = 'demo_transcript.txt'
        
        # If AJAX request, return JSON
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({
                'status': 'success',
                'redirect': url_for('chat')
            })
        
        flash('Transcription completed!', 'success')
        return redirect(url_for('chat'))
    
    flash('Invalid file type', 'error')
    return redirect(url_for('index'))

@app.route('/chat')
def chat():
    transcript = session.get('transcript', '')
    action_points = session.get('action_points', '')
    
    if not transcript and not action_points:
        flash('Please transcribe a video first', 'error')
        return redirect(url_for('index'))
    
    return render_template('chat.html', 
                          transcript=transcript, 
                          action_points=action_points)

@app.route('/ask', methods=['POST'])
def ask():
    # Demo version that doesn't actually use AI
    data = request.get_json()
    question = data.get('question', '')
    
    # Simple demo response
    response = f"This is a demo response to your question: '{question}'. The actual Q&A functionality requires additional dependencies."
    
    suggestions = [
        "What are the main topics discussed?",
        "Can you summarize the key points?",
        "Who was involved in this discussion?"
    ]
    
    return jsonify({
        'response': response,
        'suggestions': suggestions
    })

@app.route('/download_transcript')
def download_transcript():
    # Demo version that creates a simple text file
    transcript = session.get('transcript', '')
    action_points = session.get('action_points', '')
    
    if not transcript and not action_points:
        flash('No transcript available', 'error')
        return redirect(url_for('index'))
    
    # Create a simple text file
    filename = f"transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    
    with open(filepath, 'w') as f:
        if transcript:
            f.write("TRANSCRIPT:\n\n")
            f.write(transcript)
            f.write("\n\n")
        if action_points:
            f.write("ACTION POINTS:\n\n")
            f.write(action_points)
    
    return send_from_directory(app.config['OUTPUT_FOLDER'], filename, as_attachment=True)

@app.route('/video_library')
def video_library():
    # Demo version that doesn't actually list videos
    return render_template('video_library.html', videos=[])

@app.route('/set_language', methods=['POST'])
def set_language():
    language_code = request.form.get('language_code', 'en')
    # In a real app, we would set the language in the session
    return redirect(request.referrer or url_for('index'))

@app.route('/api/languages', methods=['GET'])
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

@app.route('/api/videos', methods=['GET'])
def get_videos():
    # Demo version that returns an empty list
    return jsonify([])

@app.route('/api/videos/<video_id>', methods=['GET'])
def get_video(video_id):
    # Demo version that returns a not found error
    return jsonify({"error": "Video not found"}), 404

