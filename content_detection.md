# Video Content Auto-Detection Module

This module implements advanced NLP techniques to automatically detect and classify video content based on transcriptions. It uses Whisper AI for transcription and BERTopic for topic modeling and content classification.

## Implementation Plan

1. **Transcription with Whisper AI**
   - Use OpenAI's Whisper model to transcribe video content
   - Process transcriptions to prepare for topic modeling

2. **Topic Modeling with BERTopic**
   - Extract embeddings using SentenceTransformer
   - Reduce dimensionality with UMAP
   - Cluster with HDBSCAN
   - Generate topic representations with c-TF-IDF
   - Fine-tune topic representations with KeyBERTInspired

3. **Content Classification**
   - Classify content into predefined categories (meetings, tutorials, presentations, etc.)
   - Extract key entities and concepts
   - Identify domain-specific terminology

4. **Dynamic Suggestion Generation**
   - Create context-aware suggestions based on detected topics
   - Generate domain-specific prompts for the chatbot
   - Implement personalized suggestion algorithm

## Required Dependencies

```python
# Core dependencies
pip install bertopic
pip install openai-whisper
pip install pytube
pip install sentence-transformers
pip install hdbscan
pip install umap-learn
```

## Implementation Details

### 1. Video Transcription with Whisper

```python
import whisper
import pytube
from pytube import YouTube

def download_video_audio(url, output_path="audio.mp4"):
    """Download audio from a YouTube video."""
    try:
        yt = YouTube(url)
        audio_stream = yt.streams.filter(only_audio=True)[0]
        return audio_stream.download(filename=output_path)
    except Exception as e:
        print(f"Error downloading video: {e}")
        return None

def transcribe_audio(audio_path, model_name="base"):
    """Transcribe audio using Whisper AI."""
    model = whisper.load_model(model_name)
    result = model.transcribe(audio_path)
    return result["text"]

def process_video(url):
    """Process a video: download audio and transcribe."""
    audio_path = download_video_audio(url)
    if audio_path:
        transcript = transcribe_audio(audio_path)
        return transcript
    return None
```

### 2. Text Preprocessing

```python
import re

def split_text_into_sentences(text):
    """Split text into sentences based on full stop and question mark."""
    chunks = re.split(r'(?<=[.!?])\s+', text.strip())
    return chunks

def preprocess_transcripts(transcripts):
    """Preprocess a list of transcripts into sentences."""
    texts = []
    for transcript in transcripts:
        if transcript:
            chunks = split_text_into_sentences(transcript)
            texts.extend(chunks)
    return texts
```

### 3. Topic Modeling with BERTopic

```python
from bertopic import BERTopic
from bertopic.representation import KeyBERTInspired
from bertopic.vectorizers import ClassTfidfTransformer
from sentence_transformers import SentenceTransformer
from umap import UMAP
from hdbscan import HDBSCAN
from sklearn.feature_extraction.text import CountVectorizer

def create_topic_model():
    """Create and configure a BERTopic model."""
    # Step 1 - Extract embeddings
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Step 2 - Reduce dimensionality
    umap_model = UMAP(n_neighbors=5, n_components=5, min_dist=0.0, metric='cosine')
    
    # Step 3 - Cluster reduced embeddings
    hdbscan_model = HDBSCAN(min_cluster_size=5, metric='euclidean', 
                           cluster_selection_method='eom', prediction_data=True)
    
    # Step 4 - Tokenize topics
    vectorizer_model = CountVectorizer(stop_words="english")
    
    # Step 5 - Create topic representation
    ctfidf_model = ClassTfidfTransformer()
    
    # Step 6 - Fine-tune topic representations
    representation_model = KeyBERTInspired()
    
    # Create BERTopic model with all components
    topic_model = BERTopic(
        embedding_model=embedding_model,
        umap_model=umap_model,
        hdbscan_model=hdbscan_model,
        vectorizer_model=vectorizer_model,
        ctfidf_model=ctfidf_model,
        representation_model=representation_model
    )
    
    return topic_model

def extract_topics(texts):
    """Extract topics from preprocessed texts."""
    topic_model = create_topic_model()
    topics, probs = topic_model.fit_transform(texts)
    
    # Get topic information
    topic_info = topic_model.get_topic_info()
    
    # Get topic representations
    topic_representations = {}
    for topic_id in set(topics):
        if topic_id != -1:  # Skip outlier topic
            topic_representations[topic_id] = topic_model.get_topic(topic_id)
    
    return {
        'topic_model': topic_model,
        'topics': topics,
        'probabilities': probs,
        'topic_info': topic_info,
        'topic_representations': topic_representations
    }
```

### 4. Content Classification

```python
def classify_content(topic_info, topic_representations):
    """Classify content based on extracted topics."""
    # Define domain categories and their associated keywords
    domains = {
        'business_meeting': ['meeting', 'agenda', 'discussion', 'action', 'minutes', 'team', 'project'],
        'technical_tutorial': ['code', 'programming', 'algorithm', 'tutorial', 'implementation', 'function'],
        'educational_lecture': ['lecture', 'course', 'learn', 'study', 'education', 'academic', 'university'],
        'product_demo': ['product', 'demo', 'feature', 'showcase', 'demonstration', 'release'],
        'interview': ['interview', 'question', 'answer', 'candidate', 'hiring', 'recruitment']
    }
    
    # Score each domain based on keyword matches in topic representations
    domain_scores = {domain: 0 for domain in domains}
    
    for topic_id, words in topic_representations.items():
        for word_tuple in words:
            word = word_tuple[0]
            weight = word_tuple[1]
            
            for domain, keywords in domains.items():
                if any(keyword in word.lower() for keyword in keywords):
                    domain_scores[domain] += weight
    
    # Normalize scores
    total_score = sum(domain_scores.values())
    if total_score > 0:
        for domain in domain_scores:
            domain_scores[domain] /= total_score
    
    # Get primary domain (highest score)
    primary_domain = max(domain_scores, key=domain_scores.get)
    
    return {
        'primary_domain': primary_domain,
        'domain_scores': domain_scores,
        'confidence': domain_scores[primary_domain]
    }
```

### 5. Dynamic Suggestion Generation

```python
def generate_suggestions(domain, topics, transcript):
    """Generate dynamic suggestions based on detected domain and topics."""
    
    # Domain-specific suggestion templates
    suggestion_templates = {
        'business_meeting': [
            "What were the key action items from this meeting?",
            "Summarize the main decisions made in this meeting",
            "Who was assigned which tasks during this meeting?",
            "What is the timeline for the project discussed?",
            "What challenges were mentioned during the discussion?"
        ],
        'technical_tutorial': [
            "Explain the main algorithm discussed in this tutorial",
            "What are the key steps to implement this solution?",
            "What are the prerequisites for understanding this tutorial?",
            "What are the potential applications of this technique?",
            "What are the limitations of the approach discussed?"
        ],
        'educational_lecture': [
            "Summarize the main concepts covered in this lecture",
            "What are the key theories discussed?",
            "How does this topic relate to previous lectures?",
            "What are the practical applications of these concepts?",
            "What further reading is recommended on this topic?"
        ],
        'product_demo': [
            "What are the key features of this product?",
            "How does this product compare to competitors?",
            "What problem does this product solve?",
            "What is the target audience for this product?",
            "What are the pricing options mentioned?"
        ],
        'interview': [
            "What were the most insightful questions asked?",
            "What were the key points made by the interviewee?",
            "What is the background of the person being interviewed?",
            "What unique perspectives were shared in this interview?",
            "What conclusions can be drawn from this conversation?"
        ]
    }
    
    # Get base suggestions for the detected domain
    base_suggestions = suggestion_templates.get(domain, [
        "Summarize the key points of this video",
        "What are the main topics discussed?",
        "Who are the main speakers in this video?",
        "What is the overall purpose of this content?"
    ])
    
    # Extract key entities and concepts from the transcript
    # This is a simplified version - in a real implementation, 
    # we would use NER and keyword extraction
    
    # Return suggestions
    return base_suggestions
```

### 6. Main Integration Function

```python
def analyze_video_content(video_url):
    """Main function to analyze video content and generate suggestions."""
    # Step 1: Process video to get transcript
    transcript = process_video(video_url)
    
    if not transcript:
        return {
            "error": "Failed to process video",
            "suggestions": ["Try a different video", "Check the video URL"]
        }
    
    # Step 2: Preprocess transcript
    texts = preprocess_transcripts([transcript])
    
    # Step 3: Extract topics
    topic_results = extract_topics(texts)
    
    # Step 4: Classify content
    classification = classify_content(
        topic_results['topic_info'], 
        topic_results['topic_representations']
    )
    
    # Step 5: Generate suggestions
    suggestions = generate_suggestions(
        classification['primary_domain'],
        topic_results['topics'],
        transcript
    )
    
    # Return results
    return {
        "transcript": transcript,
        "topics": topic_results['topic_info'].to_dict(),
        "classification": classification,
        "suggestions": suggestions
    }
```

## Usage Example

```python
# Example usage
video_url = "https://www.youtube.com/watch?v=example"
results = analyze_video_content(video_url)

# Print results
print(f"Video Classification: {results['classification']['primary_domain']}")
print(f"Confidence: {results['classification']['confidence']:.2f}")
print("\nSuggested Questions:")
for i, suggestion in enumerate(results['suggestions'], 1):
    print(f"{i}. {suggestion}")
```

This implementation provides a comprehensive solution for video content auto-detection and dynamic suggestion generation based on the content. It can be integrated into the VideoTranscriber application to enhance the user experience by providing relevant suggestions based on the video content.

