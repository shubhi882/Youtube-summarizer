# YouTube Lecture Summarizer

A comprehensive tool to automatically summarize YouTube lecture videos, making educational content more accessible and efficient for students and learners.

## Overview

The YouTube Lecture Summarizer is a two-part application designed to help students and educators extract key information from educational videos:

1. **Backend API** - A Python-based service that processes YouTube video transcripts and generates intelligent summaries using natural language processing techniques
2. **Browser Extension** - A Chrome extension that seamlessly integrates with YouTube to provide summaries directly on the video page

## Features

- **Automatic Transcript Extraction**: Pulls captions and transcripts from YouTube videos
- **Intelligent Summarization**: Uses NLP algorithms to identify and extract key points and concepts
- **Customizable Summary Length**: Adjust the level of detail in summaries based on your needs
- **Browser Integration**: Access summaries directly while watching videos
- **Topic Identification**: Automatically identifies main topics covered in lectures
- **Support for Educational Content**: Optimized for academic and educational videos
- **Multi-format Summaries**: Provides both bullet-point and paragraph-style summaries

## Tech Stack

### Backend
- **Python**: Core programming language
- **FastAPI**: Web framework for building the API
- **YouTube Transcript API**: For extracting video transcripts
- **NLTK/spaCy**: Natural Language Processing libraries for text analysis
- **Transformers**: Deep learning models for advanced summarization

### Frontend/Extension
- **JavaScript**: Core programming language
- **HTML/CSS**: For extension interface
- **Chrome Extension API**: For browser integration
- **Fetch API**: For communication with backend service

## Installation and Setup

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd youtube-lecture-backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Run the server:
   ```
   python main.py
   ```

### Frontend/Extension Setup

1. Navigate to the extension directory:
   ```
   cd youtube-lecture-summarizer
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to a YouTube lecture or educational video
2. Click on the YouTube Summarizer extension icon in your browser
3. View the automatically generated summary
4. Adjust summary length or format as needed
5. Use the summary to enhance your learning or review key concepts

## Project Structure

```
youtube-summarizer/
├── youtube-lecture-backend/    # Backend API service
│   ├── main.py                 # Main application entry point
│   ├── summarizer.py           # Core summarization logic
│   └── requirements.txt        # Python dependencies
│
└── youtube-lecture-summarizer/ # Frontend browser extension
    ├── manifest.json           # Extension configuration
    ├── popup.html              # Extension popup interface
    ├── popup.js                # Extension logic
    ├── content.js              # Content script for YouTube integration
    ├── background.js           # Background script for extension
    └── icons/                  # Extension icons
```

## Future Improvements

- Support for multiple languages
- Advanced summarization algorithms using more sophisticated NLP models
- User accounts to save and organize summaries
- Integration with learning management systems
- Support for additional video platforms beyond YouTube
- Mobile application version

## Contact

Amulya Bharti J - bhartiamulya0902@gmail.com


