# VideoTranscriber Enhanced - Usage Guide

This guide provides detailed instructions on how to use the enhanced VideoTranscriber application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Transcribing Videos](#transcribing-videos)
3. [Using the Chat Interface](#using-the-chat-interface)
4. [Video Library](#video-library)
5. [Multi-language Support](#multi-language-support)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

## Getting Started

When you first access the application, you'll be greeted with a welcome modal that provides an overview of the main features. Follow the step-by-step guide to familiarize yourself with the application.

### Navigation

The main navigation menu provides access to:
- **Home**: Upload and transcribe videos
- **Video Library**: Access all processed videos
- **Chat**: Interact with transcripts through natural language

## Transcribing Videos

There are two ways to transcribe videos:

### Method 1: Web Interface Upload

1. Navigate to the Home page
2. Click on the upload area or drag and drop a video file
3. Wait for the transcription process to complete
4. You'll be redirected to the Chat interface when done

### Method 2: Automatic Folder Monitoring

1. Place video files in the `./video_inputs/` folder
2. The system will automatically detect and process new videos
3. Access the processed videos in the Video Library

## Using the Chat Interface

The Chat interface allows you to interact with your transcripts through natural language.

### Asking Questions

1. Type your question in the input field
2. Click "Send" or press Enter
3. The AI will provide an answer based on the transcript content

### Using Suggestions

The system provides context-aware suggestions to help you explore the content:

1. Look for suggestion buttons below the chat input
2. Click on a suggestion to automatically fill the input field
3. Send the question to get an answer

### Viewing Transcript

The full transcript is available in the sidebar for reference. You can:
- Scroll through the transcript
- Search for specific terms
- View automatically extracted action points

## Video Library

The Video Library provides access to all processed videos.

### Browsing Videos

1. Navigate to the Video Library
2. Browse through the list of videos
3. Use the search bar to find specific videos
4. Filter videos by language using the dropdown

### Video Details

Click on any video card to access:
- Full transcript
- Analysis (key points, action items, topics)
- Q&A interface specific to that video

### Analyzing Videos

If videos haven't been analyzed yet:
1. Click the "Analyze All" button
2. Wait for the analysis to complete
3. Access the analysis results in the video details

## Multi-language Support

The application supports multiple languages for both content and interface.

### Language Detection

When uploading a video, the system automatically detects the language of the content.

### Changing Interface Language

1. Click on the language selector in the header
2. Choose your preferred language
3. The interface will update to reflect your choice

### Language-aware Responses

When asking questions, the system will respond in the detected language of the transcript or your selected interface language.

## Advanced Features

### PDF Generation

To generate a PDF of the transcript:
1. Navigate to the Chat interface
2. Click on the "Generate PDF" button
3. Wait for the PDF to be generated
4. Download the PDF when ready

### Video Analysis

The system automatically analyzes video content to extract:
- Key points
- Action items
- Main topics
- Context for questions

### Knowledge Base

The application maintains a knowledge base of all processed videos, allowing for:
- Cross-video questions
- Content comparison
- Contextual suggestions

## Troubleshooting

### Transcription Issues

If transcription fails:
1. Check that the video file format is supported (MP4, AVI, MOV, etc.)
2. Ensure the video has an audio track
3. Try reducing the file size if it's very large
4. Check the application logs for specific errors

### Chat Not Working

If the chat interface is not responding:
1. Ensure a transcript has been successfully generated
2. Check if the LM Studio API is running (if using local model)
3. Try refreshing the page

### Video Not Appearing in Library

If uploaded videos don't appear in the library:
1. Check that the transcription process completed successfully
2. Verify that the video file was placed in the correct folder
3. Try manually refreshing the Video Library page

### Language Detection Issues

If language detection is incorrect:
1. Ensure the audio quality is good
2. Try manually selecting the correct language
3. Consider providing a longer audio sample for better detection

For additional help, click the help button (question mark icon) in the header to access the guided tour for any page.

