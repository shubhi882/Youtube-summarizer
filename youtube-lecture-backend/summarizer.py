from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import requests
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
import re
from collections import Counter

# Download NLTK resources if not already downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)

def get_youtube_transcript(youtube_url):
    """Get transcript from YouTube video using multiple methods"""
    video_id = extract_video_id(youtube_url)
    if not video_id:
        return "Invalid YouTube URL."
    
    # Method 1: Try to get transcript using youtube_transcript_api
    transcript = get_transcript_from_api(video_id)
    if transcript:
        return transcript
    
    # Method 2: Try to get transcript from YouTube's timedtext API
    transcript = get_transcript_from_timedtext(video_id)
    if transcript:
        return transcript
    
    # Method 3: Try to get auto-generated captions
    transcript = get_auto_captions(video_id)
    if transcript:
        return transcript
    
    # Method 4: Try to extract from video description
    transcript = get_transcript_from_description(video_id)
    if transcript:
        return transcript
    
    # Fallback: Generate a message about no transcript
    return generate_fallback_message(video_id)

def extract_video_id(youtube_url):
    """Extract video ID from YouTube URL"""
    try:
        if 'youtu.be' in youtube_url:
            return youtube_url.split('/')[-1].split('?')[0]
        else:
            return youtube_url.split('v=')[1].split('&')[0]
    except Exception:
        return None

def get_transcript_from_api(video_id):
    """Get transcript using youtube_transcript_api"""
    try:
        # Try to get transcript in English first
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
        formatter = TextFormatter()
        return formatter.format_transcript(transcript_list)
    except NoTranscriptFound:
        try:
            # Try to get transcript in any language and translate it
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = transcript_list.find_transcript(['en'])
            if not transcript:
                # Get the first available transcript and translate it
                transcript = next(iter(transcript_list._transcripts.values()))
                transcript = transcript.translate('en')
            return formatter.format_transcript(transcript.fetch())
        except Exception as e:
            print(f"Error getting transcript via API: {e}")
            return None
    except Exception as e:
        print(f"Error getting transcript via API: {e}")
        return None

def get_transcript_from_timedtext(video_id):
    """Get transcript from YouTube's timedtext API"""
    try:
        # Get video info to find caption tracks
        response = requests.get(f"https://www.youtube.com/watch?v={video_id}")
        if response.status_code != 200:
            return None
        
        # Look for caption tracks in the response
        html = response.text
        caption_tracks = re.findall(r'"captionTracks":\[(.+?)\]', html)
        if not caption_tracks:
            return None
        
        # Extract the first caption track URL
        caption_track = caption_tracks[0]
        base_url = re.findall(r'"baseUrl":"(.+?)"', caption_track)
        if not base_url:
            return None
        
        # Clean up the URL
        caption_url = base_url[0].replace('\\u0026', '&')
        
        # Get the captions
        caption_response = requests.get(caption_url)
        if caption_response.status_code != 200:
            return None
        
        # Parse the XML
        text = caption_response.text
        # Extract text from XML (simple regex approach)
        caption_texts = re.findall(r'<text[^>]*>([^<]+)</text>', text)
        if not caption_texts:
            return None
        
        return ' '.join(caption_texts)
    except Exception as e:
        print(f"Error getting transcript from timedtext: {e}")
        return None

def get_auto_captions(video_id):
    """Try to get auto-generated captions"""
    try:
        # Specifically request auto-generated captions
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'a.en'])
        formatter = TextFormatter()
        return formatter.format_transcript(transcript_list)
    except Exception as e:
        print(f"Error getting auto captions: {e}")
        return None

def get_transcript_from_description(video_id):
    """Try to extract transcript from video description"""
    try:
        # Get video info
        response = requests.get(f"https://www.youtube.com/watch?v={video_id}")
        if response.status_code != 200:
            return None
        
        # Extract description
        html = response.text
        description_match = re.search(r'"description":\{"simpleText":"(.+?)"\}', html)
        if not description_match:
            return None
        
        description = description_match.group(1).replace('\\n', '\n')
        
        # Check if description is long enough to potentially contain a transcript
        if len(description) < 200:
            return None
        
        # Look for transcript indicators
        transcript_indicators = [
            'transcript:', 'transcript', 'lecture notes:', 'lecture transcript:',
            'video transcript:', 'full text:', 'text version:'
        ]
        
        for indicator in transcript_indicators:
            index = description.lower().find(indicator)
            if index != -1:
                # Extract text after the indicator
                return description[index + len(indicator):].strip()
        
        return None
    except Exception as e:
        print(f"Error getting transcript from description: {e}")
        return None

def generate_fallback_message(video_id):
    """Generate a fallback message when no transcript is available"""
    try:
        # Get video info
        response = requests.get(f"https://www.youtube.com/watch?v={video_id}")
        if response.status_code != 200:
            return "No transcript available for this video."
        
        # Extract title and channel
        html = response.text
        title_match = re.search(r'"title":"(.+?)"', html)
        channel_match = re.search(r'"ownerChannelName":"(.+?)"', html)
        
        title = title_match.group(1) if title_match else "Unknown Title"
        channel = channel_match.group(1) if channel_match else "Unknown Channel"
        
        # Create fallback message
        fallback = f"[No transcript available for this video: \"{title}\" by {channel}]\n\n"
        fallback += "This video does not have captions or a transcript available. "
        fallback += "To get a proper summary, please try a different video with captions enabled."
        
        return fallback
    except Exception as e:
        print(f"Error generating fallback: {e}")
        return "No transcript available for this video."

# Summarize text using extractive summarization with NLTK
def summarize_text(text, num_sentences=10):
    if not text:
        return "No text to summarize."
    
    # Tokenize the text into sentences
    sentences = sent_tokenize(text)
    
    # If there are fewer sentences than requested, return all sentences
    if len(sentences) <= num_sentences:
        return text
    
    # Calculate sentence scores based on word frequency
    stop_words = set(stopwords.words('english'))
    word_frequencies = {}
    
    for sentence in sentences:
        for word in nltk.word_tokenize(sentence.lower()):
            if word not in stop_words and word.isalnum():
                if word not in word_frequencies:
                    word_frequencies[word] = 1
                else:
                    word_frequencies[word] += 1
    
    # Normalize word frequencies
    max_frequency = max(word_frequencies.values()) if word_frequencies else 1
    for word in word_frequencies:
        word_frequencies[word] = word_frequencies[word] / max_frequency
    
    # Calculate sentence scores
    sentence_scores = {}
    for i, sentence in enumerate(sentences):
        for word in nltk.word_tokenize(sentence.lower()):
            if word in word_frequencies:
                if i not in sentence_scores:
                    sentence_scores[i] = word_frequencies[word]
                else:
                    sentence_scores[i] += word_frequencies[word]
    
    # Get the top sentences
    top_sentences = sorted(sentence_scores.items(), key=lambda x: x[1], reverse=True)[:num_sentences]
    top_sentences = sorted(top_sentences, key=lambda x: x[0])  # Sort by original order
    
    # Combine the top sentences
    summary = ' '.join([sentences[i] for i, _ in top_sentences])
    return summary

# Translate text using LibreTranslate API
def translate_text(text, target_lang):
    if not text or target_lang == 'en':
        return text
    
    try:
        response = requests.post('https://libretranslate.com/translate', json={
            'q': text,
            'source': 'en',
            'target': target_lang,
            'format': 'text'
        })
        
        if response.status_code != 200:
            print(f"Translation API error: {response.status_code}")
            return text
            
        data = response.json()
        if 'translatedText' in data:
            return data['translatedText']
        else:
            print(f"Unexpected translation API response: {data}")
            return text
    except Exception as e:
        print(f"Translation error: {e}")
        return text
