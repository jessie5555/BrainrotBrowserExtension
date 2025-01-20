import React, { useState } from 'react';
import './App.css';

/*global chrome*/
function App() {
    const [content, setContent] = useState("");

    const playContent = (text) => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        synth.speak(utterance);
    };

    const handleBrainrotClick = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "extractContent" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error:", chrome.runtime.lastError.message);
                } else if (response?.content) {
                    console.log("Extracted Content:", response.content);
                    // Trigger the overlay with the extracted content
                    chrome.tabs.sendMessage(tabs[0].id, { action: "triggerOverlay", content: response.content });
                } else {
                    console.warn("No response received from content script.");
                }
            });
        });
    };

    return (
        <div className="App">
            <h1>Brainrot Mode</h1>
            <p>Click the button to extract content:</p>
            <button onClick={handleBrainrotClick}>Activate Brainrot</button>
            {content && (
                <div style={{ marginTop: "20px", textAlign: "left", overflowY: "scroll", maxHeight: "200px", border: "1px solid #ccc", padding: "10px" }}>
                    <h2>Extracted Content:</h2>
                    <p>{content}</p>
                </div>
            )}
        </div>
    );
}

export default App;
