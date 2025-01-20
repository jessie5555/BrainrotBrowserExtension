// Log to confirm content script is loaded
console.log("Brainrot content script loaded!");

/*global chrome*/

// Function to preprocess content (remove problematic characters, excessive whitespace, etc.)
function preprocessContent(content) {
    // Remove excessive newlines and whitespace
    content = content.replace(/\s+/g, " ").trim();

    // Replace unsupported or unexpected characters
    content = content.replace(/[^\w\s.,!?\"'-]/g, "");

    return content;
}

// Function to split content into smaller chunks
function splitContent(content, chunkSize = 150) {
    const regex = new RegExp(`.{1,${chunkSize}}(\s|$)`, "g");
    return content.match(regex) || [];
}

// Function to process chunks in a queue for TTS
function speakChunks(chunks) {
    const synth = window.speechSynthesis;

    function speakNextChunk(index) {
        if (index >= chunks.length) {
            console.log("All chunks spoken.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = "en-US";

        utterance.onstart = () => {
            console.log(`Speaking chunk ${index + 1}/${chunks.length}:`, chunks[index]);
            // Update caption text
            const caption = document.querySelector("#brainrot-caption");
            if (caption) caption.textContent = chunks[index];
        };

        utterance.onend = () => {
            console.log(`Finished chunk ${index + 1}/${chunks.length}`);
            speakNextChunk(index + 1); // Speak the next chunk
        };

        utterance.onerror = (error) => {
            console.error("TTS error:", error);
            speakNextChunk(index + 1); // Skip to the next chunk
        };

        synth.speak(utterance);
    }

    synth.cancel(); // Stop any ongoing speech
    speakNextChunk(0);
}

// Function to create the video overlay with captions and TTS
function createOverlayWithCaptions(content) {
    if (document.querySelector("#brainrot-overlay")) {
        console.warn("Overlay already exists!");
        return;
    }

    // Create overlay container
    const overlay = document.createElement("div");
    overlay.id = "brainrot-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.flexDirection = "column";

    // Add video element
    const video = document.createElement("video");
    video.src = chrome.runtime.getURL("minecraft.mp4");
    video.style.width = "80%";
    video.style.borderRadius = "10px";
    video.autoplay = true;
    video.loop = true;
    video.muted = true; // Mute the video sound
    overlay.appendChild(video);

    // Add captions
    const caption = document.createElement("div");
    caption.id = "brainrot-caption";
    caption.style.position = "absolute";
    caption.style.bottom = "50%"; // Move the captions up
    caption.style.width = "80%";
    caption.style.color = "white"; // Change font color
    caption.style.padding = "10px";
    caption.style.fontSize = "30px"; // Increase font size
    caption.style.fontFamily = "'Komika Axis', sans-serif"; // Change font family
    caption.style.textAlign = "center";
    caption.style.overflow = "hidden";
    caption.style.textShadow = "-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black"; // Add black border to text
    overlay.appendChild(caption);

    // Preprocess and split content
    const processedContent = preprocessContent(content);
    const chunks = splitContent(processedContent, 150);

    // Start TTS with captions
    speakChunks(chunks);

    // Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.position = "absolute";
    closeButton.style.top = "20px";
    closeButton.style.right = "20px";
    closeButton.style.padding = "10px 20px";
    closeButton.style.backgroundColor = "red";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "5px";
    closeButton.style.cursor = "pointer";
    closeButton.addEventListener("click", () => {
        document.body.removeChild(overlay);
        window.speechSynthesis.cancel(); // Stop TTS when overlay is closed
    });
    overlay.appendChild(closeButton);

    // Add overlay to the DOM
    document.body.appendChild(overlay);
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extractContent") {
        console.log("Message received in content script: extractContent");

        // Extract content from the page
        const content = document.querySelector("article")?.innerText || document.body.innerText;
        console.log("Extracted content:", content);

        sendResponse({ content });
    } else if (message.action === "triggerOverlay" && message.content) {
        console.log("Message received in content script: triggerOverlay");
        createOverlayWithCaptions(message.content); // Pass content to the overlay
        sendResponse({ success: true });
    }

    return true; // Ensures the response is asynchronous
});
