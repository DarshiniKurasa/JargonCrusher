import { getFluffScore, getBuzzwordDensity } from './logic/detector.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "crush-jargon",
    title: "Crush Jargon",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "crush-jargon" && info.selectionText) {
    const text = info.selectionText;
    
    // Send initial loading state to content script
    chrome.tabs.sendMessage(tab.id, {
      action: "showLoading",
      text: text
    });

    // Preprocessing
    const cleanedText = text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/#[a-zA-Z0-9_]+/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .trim();

    const { fluffScore, buzzwordDensity, topOffenders } = getFluffScore(cleanedText);
    
    // Layer 3: API logic - Always fetch to get tone & summary
    try {
      const response = await fetch("https://jargon-crusher.vercel.app/api/crush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: cleanedText })
      });
      
      if (response.ok) {
        const result = await response.json();
        chrome.tabs.sendMessage(tab.id, {
          action: "showResult",
          data: { ...result, buzzword_density: buzzwordDensity, originalText: text, fluff_score: Math.max(fluffScore, result.fluff_score || 0) }
        });
        return;
      }
    } catch (err) {
      console.error("API Error", err);
    } 

    // API Error Fallback
    chrome.tabs.sendMessage(tab.id, {
      action: "showResult",
      data: {
        meaning: "Error connecting to the Jargon Crusher API. Make sure the local server is running.",
        key_points: [],
        jargon_words: topOffenders,
        fluff_score: fluffScore,
        buzzword_density: buzzwordDensity,
        tone: "clear",
        originalText: text
      }
    });
  }
});
