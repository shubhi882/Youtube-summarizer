from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from summarizer import get_youtube_transcript, summarize_text, translate_text
import uvicorn
import requests
from fastapi import Query

app = FastAPI()

# Add CORS middleware to allow requests from Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (including Chrome extension)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

class SummarizeRequest(BaseModel):
    youtube_url: str
    target_lang: str = 'en'  # Default to English

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = 'en'  # Default to English

class VideoRequest(BaseModel):
    url: str

@app.post("/summarize")
async def summarize_endpoint(req: SummarizeRequest):
    # Try to get transcript
    transcript = get_youtube_transcript(req.youtube_url)
    if transcript:
        summary = summarize_text(transcript)
        translated_summary = summary
        if req.target_lang and req.target_lang != 'en':
            try:
                resp = requests.post('https://libretranslate.com/translate', json={
                    'q': summary,
                    'source': 'en',
                    'target': req.target_lang,
                    'format': 'text'
                })
                data = resp.json()
                translated_summary = data.get('translatedText', summary)
            except Exception:
                pass
        return {
            'summary': summary,
            'translated_summary': translated_summary,
            'mode': 'transcript'
        }
    # If no transcript is available, return a clear error message
    return JSONResponse({'error': 'No transcript available for this video. This summarizer only works with videos that have captions/transcripts.'}, status_code=404)

# Translation endpoint
@app.post("/translate")
async def translate_endpoint(req: TranslateRequest):
    try:
        translated_text = translate_text(req.text, req.target_lang)
        return {
            'translated_text': translated_text
        }
    except Exception as e:
        return JSONResponse({'error': f'Translation failed: {str(e)}'}, status_code=500)

@app.get("/get_transcript")
async def get_transcript_endpoint(video_id: str = Query(..., description="YouTube video ID")):
    """Get transcript for a YouTube video by its ID"""
    try:
        # Construct a YouTube URL from the video ID
        url = f"https://www.youtube.com/watch?v={video_id}"
        transcript = get_youtube_transcript(url)
        
        if not transcript or transcript.startswith("[No transcript available"):
            return {"transcript": None, "error": "No transcript available for this video"}
        
        return {"transcript": transcript, "error": None}
    except Exception as e:
        return {"transcript": None, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
