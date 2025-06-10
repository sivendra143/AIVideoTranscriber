from flask import Blueprint, request, jsonify, current_app, send_from_directory, abort
import os
from datetime import datetime
import json
from werkzeug.utils import secure_filename

video_bp = Blueprint('video', __name__)

from pytube import YouTube

@video_bp.route('/api/analyze_youtube', methods=['POST'])
def analyze_youtube():
    data = request.get_json()
    youtube_url = data.get('url')
    if not youtube_url:
        return jsonify({'error': 'No URL provided'}), 400
    try:
        yt = YouTube(youtube_url)
        return jsonify({
            'title': yt.title,
            'author': yt.author,
            'length': yt.length,
            'description': yt.description[:200] if yt.description else ''
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_video_metadata():
    """Helper function to get video metadata from storage."""
    try:
        meta_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'videos_meta.json')
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        current_app.logger.error(f"Error reading video metadata: {e}")
        return {}

def save_video_metadata(metadata):
    """Helper function to save video metadata to storage."""
    try:
        meta_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'videos_meta.json')
        with open(meta_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        return True
    except Exception as e:
        current_app.logger.error(f"Error saving video metadata: {e}")
        return False

@video_bp.route('/api/videos', methods=['GET'])
def get_videos():
    """Get list of all processed videos with metadata."""
    try:
        metadata = get_video_metadata()
        videos = []
        for video_id, data in metadata.items():
            video_info = {
                'id': video_id,
                'title': data.get('title', 'Untitled'),
                'upload_date': data.get('upload_date'),
                'duration': data.get('duration'),
                'thumbnail': url_for('video.get_thumbnail', video_id=video_id, _external=True) if data.get('has_thumbnail') else None
            }
            videos.append(video_info)
        return jsonify(videos)
    except Exception as e:
        current_app.logger.error(f"Error getting videos: {e}")
        return jsonify({"error": "Failed to retrieve videos"}), 500

@video_bp.route('/api/videos/<video_id>', methods=['GET'])
def get_video(video_id):
    """Get detailed information about a specific video."""
    try:
        metadata = get_video_metadata()
        if video_id not in metadata:
            return jsonify({"error": "Video not found"}), 404
            
        video_data = metadata[video_id]
        response = {
            'id': video_id,
            'title': video_data.get('title', 'Untitled'),
            'upload_date': video_data.get('upload_date'),
            'duration': video_data.get('duration'),
            'transcript_available': video_data.get('transcript_available', False),
            'transcript': video_data.get('transcript', '')[:500] + '...' if video_data.get('transcript') else None,
            'metadata': video_data.get('metadata', {})
        }
        
        if video_data.get('has_thumbnail'):
            response['thumbnail'] = url_for('video.get_thumbnail', video_id=video_id, _external=True)
            
        return jsonify(response)
    except Exception as e:
        current_app.logger.error(f"Error getting video {video_id}: {e}")
        return jsonify({"error": "Failed to retrieve video details"}), 500

@video_bp.route('/api/videos/<video_id>/thumbnail', methods=['GET'])
def get_thumbnail(video_id):
    """Serve video thumbnail."""
    try:
        thumb_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'thumbnails')
        os.makedirs(thumb_path, exist_ok=True)
        return send_from_directory(thumb_path, f"{video_id}.jpg")
    except FileNotFoundError:
        abort(404)
    except Exception as e:
        current_app.logger.error(f"Error serving thumbnail for {video_id}: {e}")
        abort(500)

@video_bp.route('/api/videos/upload', methods=['POST'])
def upload_video():
    """Handle video file upload and processing."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
        try:
            # Generate unique ID for the video
            video_id = f"vid_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            filename = secure_filename(f"{video_id}_{file.filename}")
            
            # Save the uploaded file
            os.makedirs(current_app.config['VIDEO_FOLDER'], exist_ok=True)
            filepath = os.path.join(current_app.config['VIDEO_FOLDER'], filename)
            file.save(filepath)
            
            # Extract basic metadata
            metadata = get_video_metadata()
            metadata[video_id] = {
                'id': video_id,
                'title': os.path.splitext(file.filename)[0],
                'filename': filename,
                'original_name': file.filename,
                'upload_date': datetime.now().isoformat(),
                'size': os.path.getsize(filepath),
                'mimetype': file.mimetype,
                'processed': False,
                'has_thumbnail': False,
                'transcript_available': False,
                'language': 'en',
                'language_name': 'English',
                'metadata': {}
            }
            
            # Save metadata
            save_video_metadata(metadata)
            
            # In a production environment, you would queue this for background processing
            # process_video.delay(video_id, filepath)
            
            return jsonify({
                "id": video_id,
                "status": "uploaded",
                "message": "Video uploaded successfully"
            }), 201
            
        except Exception as e:
            current_app.logger.error(f"Error uploading video: {e}")
            return jsonify({"error": "Failed to process video"}), 500
    
    return jsonify({"error": "File type not allowed"}), 400

@video_bp.route('/api/videos/analyze', methods=['POST'])
def analyze_all_videos():
    """Analyze all unprocessed videos."""
    try:
        metadata = get_video_metadata()
        unprocessed = [vid for vid, data in metadata.items() if not data.get('processed', False)]
        
        if not unprocessed:
            return jsonify({"message": "All videos have been processed"}), 200
            
        # In a production environment, you would queue this for background processing
        # for video_id in unprocessed:
        #     process_video.delay(video_id)
            
        return jsonify({
            "message": f"Started processing {len(unprocessed)} videos",
            "videos_queued": unprocessed
        }), 202
        
    except Exception as e:
        current_app.logger.error(f"Error analyzing videos: {e}")
        return jsonify({"error": "Failed to start video analysis"}), 500

@video_bp.route('/api/videos/<video_id>/suggestions', methods=['GET'])
def get_suggestions(video_id):
    """Get suggested questions for a video."""
    try:
        metadata = get_video_metadata()
        if video_id not in metadata:
            return jsonify({"error": "Video not found"}), 404
            
        # In a real implementation, you would generate these based on the video content
        suggestions = [
            "What is the main topic of this video?",
            "Can you summarize the key points?",
            "What are the action items mentioned?",
            "What technologies are discussed?",
            "Who is the intended audience for this content?"
        ]
        
        return jsonify({"suggestions": suggestions})
        
    except Exception as e:
        current_app.logger.error(f"Error getting suggestions for {video_id}: {e}")
        return jsonify({"error": "Failed to get suggestions"}), 500

@video_bp.route('/api/ask', methods=['POST'])
def ask_question():
    """Answer a question about a video's content."""
    try:
        data = request.get_json()
        question = data.get('question')
        video_id = data.get('video_id')
        
        if not question or not video_id:
            return jsonify({"error": "Missing question or video_id"}), 400
            
        metadata = get_video_metadata()
        if video_id not in metadata:
            return jsonify({"error": "Video not found"}), 404
            
        # In a real implementation, you would use a language model to generate an answer
        # based on the video's transcript and metadata
        answer = f"This is a sample answer to the question: {question}\n\n" \
                "In a real implementation, this would be generated by analyzing the video's transcript and content."
        
        return jsonify({
            "answer": answer,
            "sources": [
                {"title": "Video Transcript", "relevance": 0.95},
                {"title": "Related Topic: AI", "relevance": 0.87}
            ],
            "suggestions": [
                "Can you elaborate on this point?",
                "What are the key takeaways?",
                "How does this compare to other methods?"
            ]
        })
        
    except Exception as e:
        current_app.logger.error(f"Error answering question: {e}")
        return jsonify({"error": "Failed to process question"}), 500
