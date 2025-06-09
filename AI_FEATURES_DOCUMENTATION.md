# VideoTranscriber AI Features Documentation

## Overview

The VideoTranscriber application has been enhanced with advanced AI features to provide a more intelligent and personalized user experience. These features include:

1. **Video Content Auto-Detection**: Automatically analyzes video content to identify topics and classify the content type.
2. **Dynamic Chatbot Prompt Generation**: Generates context-aware, personalized prompt suggestions based on the video content.
3. **Advanced Entity Recognition**: Identifies people, organizations, locations, and dates mentioned in the video.
4. **Temporal Analysis**: Provides insights into different sections of the video (beginning, middle, end).
5. **User Interaction History Analysis**: Adapts suggestions based on previous user questions and interactions.

## Feature Details

### 1. Video Content Auto-Detection

The content auto-detection module uses advanced Natural Language Processing (NLP) techniques to analyze video transcripts and identify the content type and main topics.

#### Technologies Used:
- **Whisper AI**: For high-quality video transcription
- **BERTopic**: For topic modeling and extraction
- **SentenceTransformer**: For generating text embeddings
- **UMAP & HDBSCAN**: For dimensionality reduction and clustering

#### Content Classification:
The system can classify videos into the following categories:
- Business Meeting
- Technical Tutorial
- Educational Lecture
- Product Demo
- Interview
- (Fallback to generic classification if none of the above)

#### How to Use:
1. Upload a video file or provide a YouTube URL
2. The system will automatically transcribe and analyze the content
3. View the detected content type and confidence score in the chat interface

### 2. Dynamic Chatbot Prompt Generation

The prompt generation system creates intelligent, context-aware suggestions based on the detected content type and extracted topics.

#### Features:
- **Domain-Specific Prompts**: Tailored suggestions based on content type (e.g., action items for business meetings, implementation details for technical tutorials)
- **Temporal Prompts**: Questions about different parts of the video (beginning, middle, end)
- **Entity-Based Prompts**: Questions about people, organizations, locations, and dates mentioned
- **Personalized Suggestions**: Adapts to user interaction history

#### Prompt Categories:
- **Business Meeting**: Action items, summary, participants, follow-up
- **Technical Tutorial**: Concepts, implementation, prerequisites, applications
- **Educational Lecture**: Main concepts, examples, connections, further study
- **Product Demo**: Features, comparison, use cases, pricing
- **Interview**: Insights, background, opinions, takeaways

### 3. Entity Recognition

The system automatically identifies and extracts key entities mentioned in the video transcript.

#### Entity Types:
- **People**: Names of individuals mentioned
- **Organizations**: Companies, institutions, and other organizations
- **Locations**: Geographic places and locations
- **Dates**: Temporal references and important dates

#### How It Works:
The entity recognition system uses pattern matching and contextual analysis to identify entities in the transcript. In a production environment, this would be enhanced with Named Entity Recognition (NER) models.

### 4. User Interaction Analysis

The system tracks user questions and interactions to provide more relevant suggestions over time.

#### Features:
- Stores recent user questions in session history
- Analyzes question patterns to identify user interests
- Generates new suggestions based on interaction history
- Adapts to the user's focus areas within the content

## Technical Implementation

### Core Modules:

1. **content_detection.py**: Implements video content analysis and topic extraction
   ```python
   # Example usage
   results = analyze_video_content(video_url)
   print(f"Content type: {results['classification']['primary_domain']}")
   print(f"Confidence: {results['classification']['confidence']}")
   ```

2. **prompt_generator.py**: Implements dynamic prompt generation
   ```python
   # Example usage
   suggestions = generate_dynamic_suggestions(
       domain="business_meeting",
       transcript=transcript_text,
       user_history=previous_questions,
       count=5
   )
   ```

### Integration with Flask Application:

The AI features are integrated into the Flask application through:
- YouTube URL analysis endpoint (`/detect_content`)
- File upload and transcription endpoint (`/transcribe`)
- Chat interaction endpoint (`/ask`)

## Usage Examples

### Analyzing a YouTube Video:
1. Go to the home page
2. Enter a YouTube URL in the input field
3. Click "Analyze Video"
4. View the detected content type, transcript preview, and suggested questions
5. Click "Continue to Chat" to interact with the content

### Uploading a Video File:
1. Go to the home page
2. Drag and drop a video file or click "Browse Files"
3. Select the desired mode (Transcript or Action Items)
4. Click "Transcribe Video"
5. View the transcript and suggested questions in the chat interface

### Interacting with the Content:
1. In the chat interface, view the content-based suggestions
2. Click on a suggestion or type your own question
3. View the response and new suggested questions
4. Continue the conversation with follow-up questions

## Limitations and Future Improvements

### Current Limitations:
- Demo version uses simulated responses rather than actual AI-generated answers
- Entity recognition uses simple pattern matching rather than advanced NER
- Content classification is limited to five predefined categories
- No support for multi-language content analysis

### Planned Improvements:
- Integration with more advanced language models for Q&A
- Enhanced entity recognition with transformer-based NER models
- Expanded content classification with more categories and subcategories
- Multi-language support for transcription and analysis
- Sentiment analysis for emotional context understanding
- Visual content analysis for video frames and scenes

## Troubleshooting

### Common Issues:
- **Content detection not working**: Ensure the required dependencies are installed
- **No suggestions appearing**: Check if the transcript was successfully generated
- **Classification confidence is low**: The video content may be ambiguous or not match predefined categories
- **Entity recognition missing entities**: The current implementation uses simple pattern matching and may miss some entities

### Support:
For additional support or to report issues, please contact the development team.

---

This documentation provides an overview of the AI features added to the VideoTranscriber application. For more detailed technical information, please refer to the source code and comments in the respective modules.

