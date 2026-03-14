import { getFluffScore } from './logic/detector.js';

document.getElementById('crush-btn').addEventListener('click', async () => {
  const text = document.getElementById('jargon-input').value.trim();
  if (!text) return;

  const btn = document.getElementById('crush-btn');
  const resultContainer = document.getElementById('result-container');
  const loading = document.getElementById('loading');

  btn.disabled = true;
  loading.classList.remove('hidden');
  resultContainer.classList.add('hidden');

  try {
    const cleanedText = text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/#[a-zA-Z0-9_]+/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .trim();

    const { fluffScore, buzzwordDensity, topOffenders } = getFluffScore(cleanedText);

    let finalData = {
      fluff_score: fluffScore,
      buzzword_density: buzzwordDensity,
      meaning: "Error connecting to the Jargon Crusher API. Make sure the local server is running.",
      key_points: [],
      jargon_words: topOffenders,
      tone: "clear",
      original_text: text
    };

    try {
      const response = await fetch("https://jargon-crusher.vercel.app/api/crush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText })
      });
      
      if (response.ok) {
        const apiData = await response.json();
        finalData = { ...apiData, buzzword_density: buzzwordDensity, original_text: text, fluff_score: Math.max(fluffScore, apiData.fluff_score || 0) };
      }
    } catch (err) {
      console.error("API Error", err);
    }

    renderResult(finalData);

  } catch (err) {
    console.error(err);
  } finally {
    btn.disabled = false;
    loading.classList.add('hidden');
    resultContainer.classList.remove('hidden');
  }
});

function renderResult(data) {
  const container = document.getElementById('result-container');
  
  const shareText = `This post scored ${data.fluff_score}% corporate jargon via JargonCrusher.ai`;

  container.innerHTML = `
    <div class="score-row">
      <span>Fluff Score: <strong style="color: ${data.fluff_score > 50 ? 'red' : 'green'}">${data.fluff_score}%</strong></span>
      <span class="density">Buzzword Density: ${data.buzzword_density}%</span>
    </div>
    
    ${data.tone ? `
    <div style="margin-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #718096; font-weight: bold;">
      Tone: <span style="color: #4a5568;">${data.tone}</span>
    </div>` : ''}

    <div class="section">
      <strong style="text-transform: uppercase; font-size: 11px; color: #718096; letter-spacing: 0.05em;">Original</strong>
      <p style="font-style: italic; color: #718096; border-left: 3px solid #e2e8f0; padding-left: 10px; margin: 6px 0 12px 0;">"${data.original_text}"</p>
    </div>

    <div style="border-top: 1px solid #e2e8f0; margin: 12px 0;"></div>

    <div class="section">
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
    
    <button id="share-btn" data-share="${shareText}">Copy Share Card</button>
  `;

  document.getElementById('share-btn').addEventListener('click', (e) => {
    navigator.clipboard.writeText(e.target.dataset.share);
    e.target.textContent = "Copied!";
    setTimeout(() => { e.target.textContent = "Copy Share Card"; }, 2000);
  });
}
