from flask import Flask, render_template, request, session, redirect, url_for, jsonify, send_from_directory, flash
from werkzeug.utils import secure_filename
import os
import json
import threading
import requests
from typing import Dict, Any, Optional
from pytube import YouTube
import tempfile
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Direct import implementation
import importlib.util

# Direct SQLAlchemy import
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

# LM Studio Configuration
LM_STUDIO_API_URL = "http://localhost:1234/v1/chat/completions"  # Default LM Studio API URL
LM_STUDIO_HEADERS = {
    "Content-Type": "application/json"
}

def query_lm_studio(messages: list, model: str = None, temperature: float = 0.7, max_tokens: int = 500) -> Optional[Dict[str, Any]]:
    """
    Query the LM Studio API with the given messages and return the response.
    """
    payload = {
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False
    }
    
    if model:
        payload["model"] = model
    
    try:
        response = requests.post(
            LM_STUDIO_API_URL,
            headers=LM_STUDIO_HEADERS,
            json=payload,
            timeout=60  # 60 seconds timeout
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error querying LM Studio: {e}")
        return None

from datetime import datetime
from routes.language_routes import language_bp
from routes.video_routes import video_bp

# Feature flags for optional dependencies
CONTENT_DETECTION_AVAILABLE = False
PROMPT_GENERATOR_AVAILABLE = False
WHISPER_AVAILABLE = False

# Import the content detection module with detailed error handling
try:
    from content_detection import analyze_video_content, preprocess_transcripts, extract_topics, classify_content, generate_suggestions
    CONTENT_DETECTION_AVAILABLE = True
except ImportError as e:
    print(f"Content detection module not available: {e}")
    print("Advanced content analysis features will be disabled.")
except Exception as e:
    print(f"Error initializing content detection: {e}")
    print("Advanced content analysis features will be disabled.")

# Import the prompt generator module
try:
    from prompt_generator import generate_dynamic_suggestions, PromptGenerator
    PROMPT_GENERATOR_AVAILABLE = True
except ImportError as e:
    print(f"Prompt generator module not available: {e}")
    print("Dynamic prompt generation features will be disabled.")

# Check for Whisper availability
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError as e:
    print(f"Whisper not available: {e}")
    print("Audio transcription features will be disabled.")

app = Flask(__name__)
# Use environment variable for secret key in production
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_please_change_in_production')

# Ensure required directories exist
os.makedirs('uploads', exist_ok=True)
os.makedirs('video_inputs', exist_ok=True)
os.makedirs('video_outputs', exist_ok=True)

# Configuration
app.config.update(
    UPLOAD_FOLDER=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads'),
    VIDEO_FOLDER=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'video_inputs'),
    OUTPUT_FOLDER=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'video_outputs'),
    ALLOWED_EXTENSIONS={'mp4', 'avi', 'mov', 'mp3', 'wav', 'ogg', 'flac', 'webm'},
    MAX_CONTENT_LENGTH=500 * 1024 * 1024,  # 500MB max file size
    FEATURES={
        'transcription': True,
        'content_analysis': CONTENT_DETECTION_AVAILABLE,
        'content_detection': CONTENT_DETECTION_AVAILABLE,  # For backward compatibility
        'prompt_generation': PROMPT_GENERATOR_AVAILABLE,
        'prompt_generator': PROMPT_GENERATOR_AVAILABLE,  # For backward compatibility
        'whisper': WHISPER_AVAILABLE
    },
)

# Register blueprints
app.register_blueprint(language_bp)
app.register_blueprint(video_bp)

# Create necessary folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['VIDEO_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Define Video model directly in app.py
class Video(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    duration = db.Column(db.Integer)
    source = db.Column(db.String(50))  # 'upload', 'youtube', 'drive'
    source_url = db.Column(db.String(500))
    file_path = db.Column(db.String(500))
    transcript = db.Column(db.Text)
    analysis = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return render_template('youtube_form.html')

@app.route('/upload')
def upload():
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
        
        # Generate content-based suggestions if available
        if CONTENT_DETECTION_AVAILABLE:
            try:
                # In a real implementation, we would analyze the actual video
                # For demo purposes, we'll just use the transcript to generate suggestions
                transcript = session.get('transcript', '')
                texts = preprocess_transcripts([transcript])
                
                # Extract topics
                topic_results = extract_topics(texts)
                
                # Classify content
                classification = classify_content(
                    topic_results['topic_info'], 
                    topic_results['topic_representations']
                )
                
                # Generate suggestions using the advanced prompt generator if available
                if PROMPT_GENERATOR_AVAILABLE:
                    suggestions = generate_dynamic_suggestions(
                        domain=classification['primary_domain'],
                        transcript=transcript,
                        topics=topic_results['topics'],
                        count=5
                    )
                else:
                    # Fall back to basic suggestion generator
                    suggestions = generate_suggestions(
                        classification['primary_domain'],
                        topic_results['topics'],
                        transcript
                    )
                
                # Store in session
                session['content_classification'] = classification
                session['content_suggestions'] = suggestions
                
            except Exception as e:
                print(f"Error in content detection: {e}")
                # Fallback suggestions
                session['content_suggestions'] = [
                    "What are the main topics discussed?",
                    "Can you summarize the key points?",
                    "Who was involved in this discussion?"
                ]
        else:
            # Fallback suggestions
            session['content_suggestions'] = [
                "What are the main topics discussed?",
                "Can you summarize the key points?",
                "Who was involved in this discussion?"
            ]
        
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

@app.route('/detect_content', methods=['POST'])
def detect_content():
    """Endpoint for detecting content from a YouTube URL"""
    if not CONTENT_DETECTION_AVAILABLE:
        return jsonify({
            'status': 'error',
            'message': 'Content detection module not available'
        })
    
    data = request.get_json()
    video_url = data.get('video_url', '')
    
    if not video_url:
        return jsonify({
            'status': 'error',
            'message': 'No video URL provided'
        })
    
    try:
        # For demo purposes, we'll simulate the analysis
        # In a real implementation, we would use the analyze_video_content function
        
        # Simulate processing delay
        import time
        time.sleep(3)
        
        # Demo transcript for different content types
        content_types = {
            'business_meeting': {
                'transcript': """
                Welcome to our quarterly business meeting. Today, we'll be discussing our Q3 results and planning for Q4.
                
                John Smith from the Sales department will present the sales figures, followed by Jane Doe from Marketing
                who will discuss our new campaign launching in October 2023. We also have a special guest, 
                Michael Johnson from Johnson Consulting Group, who will share insights on market trends.
                
                Our company, Acme Corporation, has seen a 15% growth in the New York region, but we're still
                struggling in the Chicago area. We need to address this before our annual meeting in December 15th, 2023.
                
                Let's start with the action items from our last meeting. Sarah was supposed to follow up with the
                client in Boston, and David was tasked with preparing the budget proposal for the new project.
                """,
                'confidence': 0.92
            },
            'technical_tutorial': {
                'transcript': """
                In this tutorial, we'll learn how to implement a machine learning algorithm for image classification.
                
                First, we need to import the necessary libraries: TensorFlow, NumPy, and Matplotlib. Then we'll
                prepare our dataset by normalizing the pixel values and splitting it into training and testing sets.
                
                The core of our implementation is a convolutional neural network with three layers. The first layer
                has 32 filters, the second has 64 filters, and the final layer is a fully connected layer with
                softmax activation for classification.
                
                Let's go through the code step by step and explain each part in detail. Pay attention to the
                hyperparameters as they significantly affect the model's performance.
                """,
                'confidence': 0.88
            },
            'educational_lecture': {
                'transcript': """
                Today's lecture will cover the fundamental principles of quantum mechanics and its applications
                in modern physics.
                
                We'll start with the historical context, discussing the experiments that led to the development
                of quantum theory, including the double-slit experiment and the photoelectric effect.
                
                Then we'll explore the mathematical framework, focusing on wave functions, the Schrödinger equation,
                and the Heisenberg uncertainty principle. These concepts form the foundation of quantum mechanics.
                
                In the second half of the lecture, we'll discuss practical applications in various fields,
                from quantum computing to quantum cryptography and quantum sensors.
                
                For next week's lecture, please read chapters 5 and 6 from the textbook, which cover quantum
                entanglement and quantum field theory.
                """,
                'confidence': 0.85
            },
            'product_demo': {
                'transcript': """
                Today I'm excited to show you our new software platform, ProductX, which revolutionizes
                project management for remote teams.
                
                The key features include real-time collaboration, AI-powered task prioritization, and
                integrated time tracking. Let me demonstrate how easy it is to set up a new project.
                
                As you can see, our interface is much more intuitive than competing products like ProjectY
                and TaskMaster. We've focused on simplicity without sacrificing functionality.
                
                ProductX is available in three tiers: Basic at $9.99 per month, Professional at $19.99,
                and Enterprise with custom pricing. All plans come with a 14-day free trial, no credit card required.
                
                For companies with more than 50 users, we offer special volume discounts and dedicated support.
                """,
                'confidence': 0.90
            },
            'interview': {
                'transcript': """
                Host: Welcome to Tech Insights. Today we're joined by Dr. Jane Smith, CTO of Future Technologies.
                Jane, thank you for being here.
                
                Jane: Thanks for having me. I'm excited to discuss the future of artificial intelligence.
                
                Host: You recently published a controversial paper suggesting that AGI might be achieved within the next decade.
                Can you elaborate on that prediction?
                
                Jane: Certainly. Based on the exponential progress we're seeing in large language models and reinforcement
                learning, I believe we're approaching a breakthrough. However, I want to emphasize that my timeline is more
                optimistic than most of my colleagues.
                
                Host: What are the ethical implications we should be considering?
                
                Jane: That's a critical question. We need robust governance frameworks before these systems are deployed.
                My team at Future Technologies is collaborating with ethicists and policymakers to develop guidelines.
                """,
                'confidence': 0.87
            }
        }
        
        # Randomly select a content type for demo purposes
        import random
        content_type = random.choice(list(content_types.keys()))
        content_data = content_types[content_type]
        
        transcript = content_data['transcript']
        
        # Demo classification
        classification = {
            'primary_domain': content_type,
            'confidence': content_data['confidence']
        }
        
        # Generate suggestions using the advanced prompt generator if available
        if PROMPT_GENERATOR_AVAILABLE:
            suggestions = generate_dynamic_suggestions(
                domain=content_type,
                transcript=transcript,
                count=5
            )
        else:
            # Demo suggestions (fallback)
            suggestions = [
                "What are the main topics discussed?",
                "Can you summarize the key points?",
                "Who was involved in this discussion?",
                "What were the most important insights?",
                "What conclusions can be drawn from this content?"
            ]
        
        # Store in session
        session['transcript'] = transcript
        session['content_classification'] = classification
        session['content_suggestions'] = suggestions
        
        return jsonify({
            'status': 'success',
            'transcript': transcript,
            'classification': classification['primary_domain'],
            'confidence': classification['confidence'],
            'suggestions': suggestions
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error analyzing video: {str(e)}'
        })

@app.route('/api/videos/youtube', methods=['POST'])
def analyze_youtube_video():
    data = request.json
    youtube_url = data.get('url')
    
    if not youtube_url:
        return jsonify({'error': 'Missing YouTube URL'}), 400
    
    try:
        # Download YouTube video
        yt = YouTube(youtube_url)
        stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        stream.download(output_path=tempfile.gettempdir(), filename=temp_file.name)
        
        # Process video using existing pipeline
        result = process_video(temp_file.name)
        
        # Save to database
        video = Video(
            title=yt.title,
            description=yt.description,
            duration=yt.length,
            source='youtube',
            source_url=youtube_url,
            file_path=temp_file.name,
            analysis=result
        )
        db.session.add(video)
        db.session.commit()
        
        return jsonify({
            'message': 'YouTube video processed successfully',
            'video_id': video.id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/videos/drive', methods=['POST'])
def analyze_drive_video():
    data = request.json
    drive_url = data.get('url')
    
    if not drive_url:
        return jsonify({'error': 'Missing Google Drive URL'}), 400
    
    try:
        # Extract file ID from URL
        file_id = drive_url.split('/d/')[1].split('/')[0]
        direct_download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        
        # Download file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        response = requests.get(direct_download_url, stream=True)
        
        with open(temp_file.name, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Process video
        result = process_video(temp_file.name)
        
        # Save to database
        video = Video(
            title=f"Google Drive Video {file_id[:8]}",
            source='google_drive',
            source_url=drive_url,
            file_path=temp_file.name,
            analysis=result
        )
        db.session.add(video)
        db.session.commit()
        
        return jsonify({
            'message': 'Google Drive video processed successfully',
            'video_id': video.id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat')
def chat():
    transcript = session.get('transcript', '')
    action_points = session.get('action_points', '')
    
    if not transcript and not action_points:
        flash('Please transcribe a video first', 'error')
        return redirect(url_for('index'))
    
    # Get content suggestions if available
    suggestions = session.get('content_suggestions', [
        "What are the main topics discussed?",
        "Can you summarize the key points?",
        "Who was involved in this discussion?"
    ])
    
    # Get content classification if available
    classification = session.get('content_classification', {
        'primary_domain': 'unknown',
        'confidence': 0.0
    })
    
    # Calculate transcript length safely
    transcript_length = len(transcript) if isinstance(transcript, (str, list, dict)) else 0
    
    return render_template('chat.html', 
                          transcript=transcript, 
                          action_points=action_points,
                          suggestions=suggestions,
                          classification=classification,
                          transcript_length=transcript_length,
                          filename=session.get('filename', 'Untitled'))

@app.route('/ask', methods=['POST'])
def ask():
    # Add CORS headers
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    # Handle preflight request
    if request.method == 'OPTIONS':
        return ('', 204, response_headers)
    
    try:
        # Demo version that doesn't actually use AI
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No JSON data received'
            }), 400, response_headers
            
        question = data.get('question', '')
        if not question:
            return jsonify({
                'error': 'No question provided'
            }), 400, response_headers
        
        # Get the transcript from session
        transcript = session.get('transcript', '')
        
        # Prepare the prompt for the LLM
        system_prompt = """You are a helpful AI assistant that answers questions about video transcripts. 
        Provide clear, concise, and accurate responses based on the transcript content. 
        If the question cannot be answered from the transcript, say so."""
        
        # Format the messages for the chat completion
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Transcript: {transcript}\n\nQuestion: {question}"}
        ]
        
        # Query LM Studio
        llm_response = query_lm_studio(messages=messages)
        
        if llm_response and 'choices' in llm_response and len(llm_response['choices']) > 0:
            response = llm_response['choices'][0]['message']['content']
        else:
            response = f"I'm sorry, I couldn't process your question. Please try again later."
            print(f"LM Studio API error or no response: {llm_response}")
        
        # Get content suggestions from session
        suggestions = session.get('content_suggestions', [
            "What are the main topics discussed?",
            "Can you summarize the key points?",
            "Who was involved in this discussion?"
        ])
    
        # Store the question in user history for future personalization
        user_history = session.get('user_history', [])
        user_history.append(question)
        session['user_history'] = user_history[-5:]  # Keep only the last 5 questions
        
        # Generate new suggestions based on user history if prompt generator is available
        if PROMPT_GENERATOR_AVAILABLE and 'content_classification' in session:
            try:
                # Generate new personalized suggestions
                new_suggestions = generate_dynamic_suggestions(
                    domain=session['content_classification']['primary_domain'],
                    transcript=session.get('transcript', ''),
                    user_history=user_history,
                    count=5
                )
                
                # Update suggestions in response
                suggestions = new_suggestions
                
                # Update session
                session['content_suggestions'] = suggestions
            except Exception as e:
                print(f"Error generating new suggestions: {e}")
        
        return jsonify({
            'response': response,
            'suggestions': suggestions
        }), 200, response_headers
        
    except Exception as e:
        print(f"Error in /ask endpoint: {str(e)}")
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500, response_headers

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
