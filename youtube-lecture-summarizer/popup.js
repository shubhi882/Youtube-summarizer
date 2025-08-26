document.addEventListener("DOMContentLoaded", function() {
    const summarizeBtn = document.getElementById("summarize-btn");
    const translateBtn = document.getElementById("translate-btn");
    const downloadPdfBtn = document.getElementById("download-pdf-btn");
    const summarySection = document.getElementById("summary-section");
    const summaryTextarea = document.getElementById("summary");
    const languageSelect = document.getElementById("language-select");
    const loader = document.getElementById("loader");
    const errorDiv = document.getElementById("error");

    let currentSummary = "";

    summarizeBtn.onclick = async function() {
        errorDiv.textContent = "";
        loader.style.display = "block";
        summarySection.style.display = "none";
        summaryTextarea.value = "";
        
        chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
            const url = tabs[0].url;
            const targetLang = languageSelect.value || 'en';
            
            // Validate URL is a YouTube video
            if (!url.includes('youtube.com/watch') && !url.includes('youtu.be/')) {
                loader.style.display = "none";
                errorDiv.textContent = "Please navigate to a YouTube video first.";
                return;
            }
            
            try {
                // Try transcript-based summarization
                const response = await fetch('http://localhost:8000/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ youtube_url: url, target_lang: targetLang })
                });
                
                const data = await response.json();
                
                if (response.status === 200) {
                    // Success - show summary
                    currentSummary = data.summary;
                    summaryTextarea.value = data.translated_summary || data.summary;
                    loader.style.display = "none";
                    summarySection.style.display = "block";
                } else {
                    // Error - show error message
                    loader.style.display = "none";
                    errorDiv.textContent = data.error || "Failed to summarize: No transcript available for this video.";
                }
            } catch (e) {
                // Network or other error
                loader.style.display = "none";
                errorDiv.textContent = 'Failed to connect to backend server. Make sure the backend is running at http://localhost:8000.';
                console.error('Error:', e);
            }
        });
    };

    // Polyfill for EventSource with POST (since standard EventSource only supports GET)
    // Uses fetch and ReadableStream for chunked events
    function EventSourcePolyfill(url, options) {
        const controller = new AbortController();
        const listeners = {};
        fetch(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.payload || undefined,
            signal: controller.signal
        }).then(response => {
            const reader = response.body.getReader();
            let buffer = '';
            function read() {
                reader.read().then(({ done, value }) => {
                    if (done) return;
                    buffer += new TextDecoder().decode(value);
                    let parts = buffer.split('\n\n');
                    buffer = parts.pop();
                    for (const part of parts) {
                        if (part.startsWith('data: ')) {
                            const data = part.slice(6);
                            if (listeners.message) listeners.message({ data });
                        }
                    }
                    read();
                });
            }
            read();
        });
        this.onmessage = null;
        this.onerror = null;
        listeners.message = (e) => { if (this.onmessage) this.onmessage(e); };
        this.close = () => controller.abort();
    }


    // Set up the Copy Summary button functionality
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.onclick = function() {
            if (summaryTextarea.value) {
                navigator.clipboard.writeText(summaryTextarea.value)
                    .then(() => {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => { copyBtn.textContent = 'Copy Summary'; }, 1500);
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                        errorDiv.textContent = 'Failed to copy to clipboard. Please try again.';
                    });
            } else {
                errorDiv.textContent = 'No summary to copy yet.';
            }
        };
    }

// Helper to chunk text for summarization API
function chunkText(text, maxLen) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + maxLen));
        i += maxLen;
    }
    return chunks;
}


    translateBtn.onclick = async function() {
        errorDiv.textContent = "";
        loader.style.display = "block";
        const targetLang = languageSelect.value;
        const translated = await translateText(summaryTextarea.value, targetLang);
        summaryTextarea.value = translated;
        loader.style.display = "none";
    };

    downloadPdfBtn.onclick = function() {
        downloadAsPDF(summaryTextarea.value);
    };
});

// Real summarization using Hugging Face Inference API (facebook/bart-large-cnn)
async function summarizeText(text) {
    try {
        const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: text })
        });
        if (!response.ok) throw new Error('Summarization API error');
        const data = await response.json();
        if (Array.isArray(data) && data[0] && data[0].summary_text) {
            return data[0].summary_text;
        } else if (data.error) {
            return '[Summarization error: ' + data.error + ']';
        }
        return '[Summarization failed: Unexpected API response]';
    } catch (e) {
        return '[Summarization failed: ' + e.message + ']';
    }
}

// Translation using backend server to avoid API limitations
async function translateText(text, targetLang) {
    try {
        // Use our backend for translation instead of direct API call
        const response = await fetch('http://localhost:8000/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                target_lang: targetLang
            })
        });
        
        if (!response.ok) throw new Error(`Translation API error: ${response.status}`);
        
        const data = await response.json();
        if (data.translated_text) {
            return data.translated_text;
        } else if (data.error) {
            return '[Translation error: ' + data.error + ']';
        }
        return '[Translation failed: Unexpected API response]';
    } catch (e) {
        console.error('Translation error:', e);
        return '[Translation failed: ' + e.message + ']';
    }
}

// Download summary as a text file
function downloadAsPDF(text) {
    try {
        // Get the current tab's title to use as the filename
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const videoTitle = tabs[0].title.replace(' - YouTube', '');
            
            // Format the content
            const formattedContent = `YouTube Lecture Summary

Video: ${videoTitle}
Generated: ${new Date().toLocaleDateString()}

${text}`;
            
            // Create a blob and download link
            const blob = new Blob([formattedContent], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            
            // Create download link and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = `YouTube_Summary_${videoTitle.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}.txt`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        });
    } catch (e) {
        console.error('Error creating text file:', e);
        alert('Failed to download summary. Please try again.');
    }
}
