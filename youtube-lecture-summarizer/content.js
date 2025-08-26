// Global variables for the side panel
let summaryPanel = null;
let summaryContent = null;
let isProcessing = false;
let currentSummary = "";
let currentLanguage = "en";

// Create and inject the side panel for summaries
function createSummaryPanel() {
    if (summaryPanel) {
        // If panel exists but is hidden, make it visible
        if (summaryPanel.style.display === 'none') {
            summaryPanel.style.display = 'flex';
        }
        return summaryPanel;
    }
    
    // Create the panel container
    summaryPanel = document.createElement('div');
    summaryPanel.id = 'yt-lecture-summary-panel';
    summaryPanel.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        width: 300px;
        max-height: 80vh;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: Arial, sans-serif;
        transition: all 0.3s ease;
    `;
    
    // Store initial position for dragging
    summaryPanel.dataset.initialX = '20px';
    summaryPanel.dataset.initialY = '70px';
    
    // Create the header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 12px 16px;
        background-color: #c4302b;
        color: white;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
    `;
    
    // Create title container
    const titleContainer = document.createElement('div');
    titleContainer.textContent = 'YouTube Lecture Summary';
    titleContainer.style.cssText = `
        flex-grow: 1;
        user-select: none;
    `;
    header.appendChild(titleContainer);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        align-items: center;
    `;
    
    // Add minimize/maximize button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '−';
    toggleBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 10px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    toggleBtn.title = 'Minimize/Maximize';
    toggleBtn.onclick = function(e) {
        e.stopPropagation(); // Prevent dragging when clicking the button
        if (summaryContent.style.display === 'none') {
            summaryContent.style.display = 'block';
            toggleBtn.textContent = '−';
        } else {
            summaryContent.style.display = 'none';
            toggleBtn.textContent = '+';
        }
    };
    buttonContainer.appendChild(toggleBtn);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 10px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtn.title = 'Close';
    closeBtn.onclick = function(e) {
        e.stopPropagation(); // Prevent dragging when clicking the button
        summaryPanel.style.display = 'none';
    };
    buttonContainer.appendChild(closeBtn);
    
    header.appendChild(buttonContainer);
    
    // Create content area
    summaryContent = document.createElement('div');
    summaryContent.style.cssText = `
        padding: 16px;
        overflow-y: auto;
        flex-grow: 1;
        font-size: 14px;
        line-height: 1.5;
    `;
    summaryContent.textContent = 'Click the extension icon to summarize this lecture.';
    
    // Create controls area
    const controls = document.createElement('div');
    controls.style.cssText = `
        padding: 12px 16px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
    `;
    
    // Add summarize button
    const summarizeBtn = document.createElement('button');
    summarizeBtn.textContent = 'Summarize';
    summarizeBtn.style.cssText = `
        background-color: #c4302b;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
    `;
    summarizeBtn.onclick = function() {
        if (!isProcessing) {
            summarizeCurrentVideo();
        }
    };
    
    // Add language selector
    const langSelect = document.createElement('select');
    langSelect.id = 'yt-summary-lang-select';
    langSelect.style.cssText = `
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ccc;
    `;
    
    // Add language options
    const languages = [
        {code: 'en', name: 'English'},
        {code: 'hi', name: 'Hindi'},
        {code: 'es', name: 'Spanish'},
        {code: 'fr', name: 'French'},
        {code: 'de', name: 'German'}
    ];
    
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        langSelect.appendChild(option);
    });
    
    controls.appendChild(langSelect);
    controls.appendChild(summarizeBtn);
    
    // Assemble the panel
    summaryPanel.appendChild(header);
    summaryPanel.appendChild(summaryContent);
    summaryPanel.appendChild(controls);
    
    // Make the panel draggable
    makeDraggable(summaryPanel, header);
    
    // Add to the page
    document.body.appendChild(summaryPanel);
    return summaryPanel;
}

// Make an element draggable
function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    
    handle.onmousedown = dragMouseDown;
    
    // Add a visual indicator when hovering over the drag handle
    handle.onmouseover = function() {
        if (!isDragging) {
            handle.style.cursor = 'move';
            handle.title = 'Drag to move';
        }
    };
    
    function dragMouseDown(e) {
        // Ignore if clicking on a button
        if (e.target.tagName === 'BUTTON') return;
        
        e = e || window.event;
        e.preventDefault();
        
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Get current element position
        const rect = element.getBoundingClientRect();
        
        // Set dragging state
        isDragging = true;
        handle.style.cursor = 'grabbing';
        
        // Add visual feedback during dragging
        element.style.opacity = '0.9';
        element.style.transition = 'none'; // Disable transitions during drag
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Calculate new position
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        // Ensure the panel stays within the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const panelWidth = element.offsetWidth;
        const panelHeight = element.offsetHeight;
        
        // Keep at least 50px of the panel visible on each edge
        const minLeft = -panelWidth + 50;
        const maxLeft = viewportWidth - 50;
        const minTop = 0;
        const maxTop = viewportHeight - 50;
        
        // Apply boundaries
        const boundedLeft = Math.min(Math.max(newLeft, minLeft), maxLeft);
        const boundedTop = Math.min(Math.max(newTop, minTop), maxTop);
        
        // Set the element's new position
        element.style.top = boundedTop + 'px';
        element.style.left = boundedLeft + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        
        // Save position for persistence
        element.dataset.lastLeft = boundedLeft + 'px';
        element.dataset.lastTop = boundedTop + 'px';
    }
    
    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
        
        // Reset visual state
        isDragging = false;
        handle.style.cursor = 'move';
        element.style.opacity = '1';
        element.style.transition = 'opacity 0.3s ease'; // Restore transitions
        
        // Store position in localStorage for persistence across page loads
        try {
            localStorage.setItem('ytSummaryPanelPosition', JSON.stringify({
                left: element.style.left,
                top: element.style.top
            }));
        } catch (e) {
            console.log('Could not save panel position');
        }
    }
    
    // Try to restore previous position
    try {
        const savedPosition = localStorage.getItem('ytSummaryPanelPosition');
        if (savedPosition) {
            const position = JSON.parse(savedPosition);
            element.style.top = position.top;
            element.style.left = position.left;
            element.style.right = 'auto';
        }
    } catch (e) {
        console.log('Could not restore panel position');
    }
}

// Summarize the current video
async function summarizeCurrentVideo() {
    if (!summaryPanel) createSummaryPanel();
    
    isProcessing = true;
    summaryContent.innerHTML = '<div style="color: #c4302b;">Processing... Please wait while we summarize the lecture.</div>';
    
    try {
        // First, try to extract transcript directly from the page
        const transcript = await getYouTubeTranscript();
        if (!transcript || transcript.includes("Transcript not found")) {
            summaryContent.innerHTML = `<div style="color: red;">No transcript available for this video. This summarizer only works with videos that have captions/transcripts.</div>`;
            isProcessing = false;
            return;
        }
        
        // Get the selected language
        const targetLang = document.getElementById('yt-summary-lang-select').value || 'en';
        
        // Create a better summary from the transcript
        const simpleSummary = createSimpleSummary(transcript);
        
        // Display processing message for translation
        if (targetLang !== 'en') {
            summaryContent.innerHTML = '<div style="color: #c4302b;">Translating summary... Please wait.</div>';
        }
        
        // Translate the summary if needed
        const translatedSummary = targetLang !== 'en' ? 
            await translateText(simpleSummary, targetLang) : 
            simpleSummary;
        
        // Display the summary
        const videoTitle = document.title.replace(' - YouTube', '');
        summaryContent.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>Summary:</strong>
            </div>
            <div style="white-space: pre-wrap;">${translatedSummary}</div>
            <div style="margin-top: 15px;">
                <button id="yt-summary-copy-btn" style="background-color: #c4302b; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-right: 5px; cursor: pointer;">Copy</button>
                <button id="yt-summary-pdf-btn" style="background-color: #c4302b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Save as Text</button>
                <button id="yt-summary-translate-btn" style="background-color: #c4302b; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-left: 5px; cursor: pointer;">Translate</button>
            </div>
        `;
        
        // Store the original summary for later use
        summaryPanel.dataset.originalSummary = simpleSummary;
        
        // Add copy functionality
        document.getElementById('yt-summary-copy-btn').onclick = function() {
            navigator.clipboard.writeText(translatedSummary)
                .then(() => {
                    this.textContent = 'Copied!';
                    setTimeout(() => { this.textContent = 'Copy'; }, 1500);
                });
        };
        
        // Add text file download functionality
        document.getElementById('yt-summary-pdf-btn').onclick = function() {
            // Create a text file for download
            const blob = new Blob([`YouTube Lecture Summary

Video: ${videoTitle}
Generated: ${new Date().toLocaleDateString()}
Language: ${document.getElementById('yt-summary-lang-select').options[document.getElementById('yt-summary-lang-select').selectedIndex].text}

${translatedSummary}`], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            
            // Create a download link and click it
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
        };
        
        // Add translate functionality
        document.getElementById('yt-summary-translate-btn').onclick = async function() {
            const langSelect = document.getElementById('yt-summary-lang-select');
            const newLang = langSelect.value;
            const originalSummary = summaryPanel.dataset.originalSummary || simpleSummary;
            
            // Show processing message
            summaryContent.innerHTML = '<div style="color: #c4302b;">Translating summary... Please wait.</div>';
            
            try {
                // Translate to the selected language
                const newTranslation = await translateText(originalSummary, newLang);
                
                // Update the display
                summaryContent.innerHTML = `
                    <div style="margin-bottom: 10px;">
                        <strong>Summary:</strong>
                    </div>
                    <div style="white-space: pre-wrap;">${newTranslation}</div>
                    <div style="margin-top: 15px;">
                        <button id="yt-summary-copy-btn" style="background-color: #c4302b; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-right: 5px; cursor: pointer;">Copy</button>
                        <button id="yt-summary-pdf-btn" style="background-color: #c4302b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Save as Text</button>
                        <button id="yt-summary-translate-btn" style="background-color: #c4302b; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-left: 5px; cursor: pointer;">Translate</button>
                    </div>
                `;
                
                // Reattach event handlers
                document.getElementById('yt-summary-copy-btn').onclick = function() {
                    navigator.clipboard.writeText(newTranslation)
                        .then(() => {
                            this.textContent = 'Copied!';
                            setTimeout(() => { this.textContent = 'Copy'; }, 1500);
                        });
                };
                
                document.getElementById('yt-summary-pdf-btn').onclick = document.getElementById('yt-summary-pdf-btn').onclick;
                document.getElementById('yt-summary-translate-btn').onclick = document.getElementById('yt-summary-translate-btn').onclick;
                
            } catch (e) {
                summaryContent.innerHTML = `<div style="color: red;">Translation failed. Please try again.</div>`;
                console.error('Translation error:', e);
            }
        };
    } catch (e) {
        summaryContent.innerHTML = `<div style="color: red;">Failed to summarize video. Please try again later.</div>`;
        console.error('Error:', e);
    } finally {
        isProcessing = false;
    }
}

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
            return urlObj.pathname.substring(1);
        }
    } catch (e) {
        console.error('Error extracting video ID:', e);
    }
    return null;
}

// Function to show error messages in the panel
function showError(message) {
    if (summaryContent) {
        summaryContent.innerHTML = `<div style="color: red; padding: 15px;">${message}</div>`;
    }
}

// Function to show success messages in the panel
function showSuccess(message) {
    if (summaryContent) {
        summaryContent.innerHTML = `<div style="color: green; padding: 15px;">${message}</div>`;
    }
}

// These functions are not used in the current implementation
// They're kept here for reference but not called anywhere
async function translateSummary() {
    if (!currentSummary) return;
    
    // Get selected language
    const langSelect = document.getElementById('language-select');
    const targetLang = langSelect.value;
    
    // Skip if already in the target language
    if (targetLang === currentLanguage) return;
    
    // Show processing message
    summaryContent.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Translating to ${langSelect.options[langSelect.selectedIndex].text}...</p>
        </div>
    `;
    
    try {
        // Translate the summary
        const translatedText = await translateText(currentSummary, targetLang);
        
        // Update the display
        summaryContent.innerHTML = `
            <div class="summary-text">${translatedText}</div>
            <div class="summary-actions">
                <select id="language-select" class="language-dropdown">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="ar">Arabic</option>
                    <option value="hi">Hindi</option>
                </select>
                <button id="translate-btn" class="action-button">Translate</button>
                <button id="copy-btn" class="action-button">Copy</button>
                <button id="download-btn" class="action-button">Download</button>
            </div>
        `;
        
        // Set the selected language in the dropdown
        document.getElementById('language-select').value = targetLang;
        
        // Add event listeners to buttons
        document.getElementById('translate-btn').addEventListener('click', translateSummary);
        document.getElementById('copy-btn').addEventListener('click', copySummary);
        document.getElementById('download-btn').addEventListener('click', downloadSummary);
        
        // Update current language
        currentLanguage = targetLang;
    } catch (error) {
        console.error('Translation error:', error);
        showError('Translation failed. Please try again.');
    }
}

// Create a better summary from transcript text
function createSimpleSummary(text) {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    // If there are fewer than 10 sentences, return the whole text
    if (sentences.length <= 10) {
        return text;
    }
    
    // Calculate sentence scores based on word frequency
    const wordFrequencies = {};
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'in', 'to', 'that', 'it', 'of', 'from', 'this', 'with', 'for', 'as', 'at', 'by', 'was', 'were'];
    
    // Count word frequencies
    sentences.forEach(sentence => {
        // Simple tokenization by splitting on spaces and removing punctuation
        const words = sentence.toLowerCase().split(/\s+/).map(word => word.replace(/[^a-z0-9]/g, ''));
        
        words.forEach(word => {
            if (word && !stopWords.includes(word)) {
                wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
            }
        });
    });
    
    // Score sentences based on word frequency
    const sentenceScores = sentences.map(sentence => {
        let score = 0;
        const words = sentence.toLowerCase().split(/\s+/).map(word => word.replace(/[^a-z0-9]/g, ''));
        
        words.forEach(word => {
            if (wordFrequencies[word]) {
                score += wordFrequencies[word];
            }
        });
        
        // Normalize by sentence length to avoid favoring long sentences too much
        return { sentence, score: score / (words.length || 1) };
    });
    
    // Get top sentences (about 30% of the original, minimum 5, maximum 15)
    const numSentences = Math.min(Math.max(Math.ceil(sentences.length * 0.3), 5), 15);
    
    // Sort by score and take top sentences
    const topSentences = [...sentenceScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, numSentences)
        .map(item => item.sentence);
    
    // Also include first and last sentence for context if they're not already included
    if (!topSentences.includes(sentences[0])) {
        topSentences.unshift(sentences[0]);
    }
    
    if (!topSentences.includes(sentences[sentences.length - 1]) && sentences.length > 1) {
        topSentences.push(sentences[sentences.length - 1]);
    }
    
    // Sort back to original order
    const orderedSentences = topSentences
        .map(sentence => ({ sentence, index: sentences.indexOf(sentence) }))
        .sort((a, b) => a.index - b.index)
        .map(item => item.sentence);
    
    return orderedSentences.join(' ');
}

// Translate text to the selected language
async function translateText(text, targetLang) {
    if (!text || targetLang === 'en') {
        return text; // No translation needed
    }
    
    // Split text into chunks of 400 characters, trying to break at sentence boundaries
    const chunks = splitTextIntoChunks(text, 400);
    let translatedText = '';
    
    try {
        // Translate each chunk separately
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            // Show progress if there are multiple chunks
            if (chunks.length > 1 && summaryContent) {
                summaryContent.innerHTML = `<div style="color: #c4302b;">Translating... (${i+1}/${chunks.length})</div>`;
            }
            
            // Use a free translation API
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${targetLang}`);
            const data = await response.json();
            
            if (data && data.responseData && data.responseData.translatedText) {
                translatedText += data.responseData.translatedText + ' ';
            } else {
                // If translation failed, keep the original chunk
                translatedText += chunk + ' ';
            }
            
            // Add a small delay between requests to avoid rate limiting
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        return translatedText.trim();
    } catch (e) {
        console.error('Translation error:', e);
        return text; // Return original on error
    }
}

// Helper function to split text into chunks, trying to break at sentence boundaries
function splitTextIntoChunks(text, maxChunkSize) {
    // First try to split by sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
        // If a single sentence is longer than the max chunk size, we'll need to split it
        if (sentence.length > maxChunkSize) {
            // If the current chunk is not empty, add it to chunks
            if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = '';
            }
            
            // Split the long sentence by words
            let words = sentence.split(/\s+/);
            let wordChunk = '';
            
            for (const word of words) {
                if ((wordChunk + ' ' + word).length <= maxChunkSize) {
                    wordChunk += (wordChunk ? ' ' : '') + word;
                } else {
                    if (wordChunk) chunks.push(wordChunk);
                    wordChunk = word;
                }
            }
            
            if (wordChunk) chunks.push(wordChunk);
        } 
        // If adding this sentence would exceed the chunk size, start a new chunk
        else if ((currentChunk + sentence).length > maxChunkSize) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } 
        // Otherwise, add the sentence to the current chunk
        else {
            currentChunk += currentChunk ? sentence : sentence;
        }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}

// Extract transcript from YouTube video using multiple methods
async function getYouTubeTranscript() {
    // Method 1: Try to get transcript from existing transcript panel
    let transcript = await getTranscriptFromPanel();
    if (transcript) return transcript;
    
    // Method 2: Try to open transcript panel and get transcript
    transcript = await getTranscriptByOpeningPanel();
    if (transcript) return transcript;
    
    // Method 3: Try to extract from YouTube's API data
    transcript = await getTranscriptFromYouTubeAPI();
    if (transcript) return transcript;
    
    // Method 4: Try to extract from auto-generated captions
    transcript = await getTranscriptFromCaptions();
    if (transcript) return transcript;
    
    // Method 5: Try to extract from video description if it contains a transcript
    transcript = await getTranscriptFromDescription();
    if (transcript) return transcript;
    
    // Fallback: Generate a summary from video title and metadata
    return await generateFallbackContent();
}

// Method 1: Get transcript from existing panel
async function getTranscriptFromPanel() {
    const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
    if (segments.length === 0) return null;
    
    let transcript = '';
    segments.forEach(seg => {
        const text = seg.querySelector('.segment-text');
        if (text) transcript += text.innerText + ' ';
    });
    
    return transcript.trim().length > 0 ? transcript.trim() : null;
}

// Method 2: Try to open transcript panel and get transcript
async function getTranscriptByOpeningPanel() {
    // Find the more actions button
    const moreActionsBtn = document.querySelector('button.ytp-button[aria-label="More actions"]');
    if (!moreActionsBtn) return null;
    
    // Click more actions
    moreActionsBtn.click();
    await new Promise(res => setTimeout(res, 500));
    
    // Find and click Show transcript option
    const menuItems = Array.from(document.querySelectorAll('.ytp-menuitem'));
    const transcriptItem = menuItems.find(item => {
        const label = item.querySelector('.ytp-menuitem-label');
        return label && label.textContent.includes('transcript');
    });
    
    if (!transcriptItem) {
        // Close the menu
        document.body.click();
        return null;
    }
    
    transcriptItem.click();
    await new Promise(res => setTimeout(res, 1000));
    
    // Now try to get the transcript
    return getTranscriptFromPanel();
}

// Method 3: Try to extract from YouTube's API data
async function getTranscriptFromYouTubeAPI() {
    try {
        // Extract video ID from URL
        const url = window.location.href;
        const videoId = url.split('v=')[1]?.split('&')[0];
        if (!videoId) return null;
        
        // Get transcript using our backend API
        const response = await fetch(`http://localhost:8000/get_transcript?video_id=${videoId}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.transcript || null;
    } catch (e) {
        console.error('Error getting transcript from API:', e);
        return null;
    }
}

// Method 4: Try to extract from auto-generated captions
async function getTranscriptFromCaptions() {
    // Look for caption tracks in the video player
    const captionTracks = window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) return null;
    
    try {
        // Get the first available caption track
        const captionTrack = captionTracks[0];
        const captionUrl = captionTrack.baseUrl;
        
        // Fetch the captions
        const response = await fetch(captionUrl);
        if (!response.ok) return null;
        
        const text = await response.text();
        
        // Parse the XML response
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        
        // Extract text from XML
        const textElements = xmlDoc.getElementsByTagName('text');
        let transcript = '';
        
        for (let i = 0; i < textElements.length; i++) {
            transcript += textElements[i].textContent + ' ';
        }
        
        return transcript.trim();
    } catch (e) {
        console.error('Error getting captions:', e);
        return null;
    }
}

// Method 5: Try to extract from video description
async function getTranscriptFromDescription() {
    // Get the description
    const description = document.querySelector('#description-inline-expander')?.textContent || '';
    
    // Check if description is long enough to potentially contain a transcript
    if (description.length < 200) return null;
    
    // Look for transcript indicators in the description
    const transcriptIndicators = [
        'transcript:', 'transcript', 'lecture notes:', 'lecture transcript:',
        'video transcript:', 'full text:', 'text version:'
    ];
    
    for (const indicator of transcriptIndicators) {
        const index = description.toLowerCase().indexOf(indicator);
        if (index !== -1) {
            // Extract text after the indicator
            return description.substring(index + indicator.length).trim();
        }
    }
    
    return null;
}

// Generate fallback content when no transcript is available
async function generateFallbackContent() {
    // Get video title and channel name
    const title = document.querySelector('h1.ytd-watch-metadata')?.textContent || '';
    const channel = document.querySelector('#channel-name')?.textContent || '';
    const description = document.querySelector('#description-inline-expander')?.textContent || '';
    
    // Create a fallback message
    let fallback = `[No transcript available for this video: "${title}" by ${channel.trim()}]\n\n`;
    
    // Add a summary based on title and description
    fallback += 'Based on the video title and description, this appears to be ';
    
    // Determine video type from title
    if (title.toLowerCase().includes('lecture') || title.toLowerCase().includes('course')) {
        fallback += 'an educational lecture ';
    } else if (title.toLowerCase().includes('tutorial') || title.toLowerCase().includes('how to')) {
        fallback += 'a tutorial ';
    } else if (title.toLowerCase().includes('review')) {
        fallback += 'a review ';
    } else {
        fallback += 'a video ';
    }
    
    // Add topic from title
    const topics = extractTopicsFromTitle(title);
    if (topics.length > 0) {
        fallback += `about ${topics.join(', ')}. `;
    } else {
        fallback += 'on an unidentified topic. ';
    }
    
    // Add a note about using captions
    fallback += '\n\nTo get a proper summary, please ensure the video has captions enabled. ';
    fallback += 'You can check by clicking the CC button in the YouTube player.';
    
    return fallback;
}

// Helper function to extract potential topics from the title
function extractTopicsFromTitle(title) {
    // Remove common words and punctuation
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const words = cleanTitle.split(/\s+/);
    
    // Filter out common words
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like', 'through', 'over', 'before', 'after', 'between', 'under', 'during', 'without', 'lecture', 'tutorial', 'video', 'part', 'episode', 'series', 'how', 'what', 'why', 'when', 'where', 'who'];
    
    const significantWords = words.filter(word => 
        word.length > 3 && !commonWords.includes(word)
    );
    
    // Return up to 3 significant words
    return significantWords.slice(0, 3);
}

// Listen for messages from the extension popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTranscript") {
        getYouTubeTranscript().then(transcript => {
            sendResponse({ transcript });
        });
        return true; // Keep the message channel open for async response
    } else if (request.action === "showSummaryPanel") {
        createSummaryPanel();
        sendResponse({ success: true });
        return true;
    } else if (request.action === "summarizeVideo") {
        summarizeCurrentVideo();
        sendResponse({ success: true });
        return true;
    }
});

// Initialize the panel when the page loads
window.addEventListener('load', function() {
    // Only create the panel on YouTube video pages
    if (window.location.href.includes('youtube.com/watch')) {
        setTimeout(() => {
            createSummaryPanel();
        }, 1500); // Wait a bit for the page to fully load
    }
});
