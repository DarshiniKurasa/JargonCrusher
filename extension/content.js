chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showLoading") {
    showOverlay(request.text, true);
  } else if (request.action === "showResult") {
    updateOverlay(request.data);
  }
});

let overlay = null;

function showOverlay(originalText, isLoading) {
  if (overlay) {
    overlay.remove();
  }

  overlay = document.createElement('div');
  overlay.id = 'jargon-crusher-overlay';
  overlay.innerHTML = `
    <div class="jc-header">
      <div class="jc-title">🔨 Jargon Crusher</div>
      <button class="jc-close">×</button>
    </div>
    <div class="jc-content">
      ${isLoading ? '<div class="jc-loader">Analyzing text...</div>' : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('.jc-close').addEventListener('click', () => {
    overlay.remove();
    overlay = null;
  });
}

function updateOverlay(data) {
  if (!overlay) return;

  const content = overlay.querySelector('.jc-content');
  
  const shareText = `This post scored ${data.fluff_score}% corporate jargon via JargonCrusher.ai`;

  content.innerHTML = `
    <div class="jc-score">
      <span>Fluff Score: <strong style="color: ${data.fluff_score > 50 ? 'red' : 'green'}">${data.fluff_score}%</strong></span>
      <span class="jc-density">Buzzword Density: ${data.buzzword_density}%</span>
    </div>
    
    ${data.tone ? `
    <div style="margin-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #718096; font-weight: bold;">
      Tone: <span style="color: #4a5568;">${data.tone}</span>
    </div>` : ''}

    <div class="jc-section">
      <strong style="text-transform: uppercase; font-size: 11px; color: #718096; letter-spacing: 0.05em;">Original</strong>
      <p style="font-style: italic; color: #718096; border-left: 3px solid #e2e8f0; padding-left: 10px; margin: 6px 0 12px 0;">"${data.originalText || originalText}"</p>
    </div>

    <div style="border-top: 1px solid #e2e8f0; margin: 12px 0;"></div>

    <div class="jc-section">
      <strong style="text-transform: uppercase; font-size: 11px; color: #718096; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">Crushed</strong>
      
      ${data.fluff_score < 10 ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        <strong style="display: block; margin-bottom: 4px; color: #14532d;">Verdict: No corporate jargon detected</strong>
        This post is mostly ${data.tone ? data.tone.toLowerCase() : 'clear'} and already written clearly.
      </div>
      ` : ''}

      <div style="margin-bottom: 12px;">
        <strong>Meaning:</strong>
        <p>${data.meaning}</p>
      </div>

      ${data.key_points && data.key_points.length > 0 ? `
      <div style="margin-bottom: 12px;">
        <strong>Key points:</strong>
        <ul style="list-style: none; padding: 0; margin: 4px 0;">
          ${data.key_points.map(pt => `<li>• ${pt}</li>`).join('')}
        </ul>
      </div>` : ''}

      ${data.jargon_words && data.jargon_words.length > 0 ? `
      <div>
        <strong>Jargon detected:</strong>
        <ul style="list-style: none; padding: 0; margin: 4px 0;">
          ${data.jargon_words.map(w => `<li>• ${w}</li>`).join('')}
        </ul>
      </div>` : ''}
    </div>
    
    <button class="jc-share-btn" data-share="${shareText}">Copy Share Card</button>
  `;

  overlay.querySelector('.jc-share-btn').addEventListener('click', (e) => {
    navigator.clipboard.writeText(e.target.dataset.share);
    e.target.textContent = "Copied!";
    setTimeout(() => {
      e.target.textContent = "Copy Share Card";
    }, 2000);
  });
}
