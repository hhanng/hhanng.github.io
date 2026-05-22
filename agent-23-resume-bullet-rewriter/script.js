let selectedLevel = 'Student';
let rewrittenBullets = [];

const apiKeyInput = document.getElementById('apiKey');
const apiSaved = document.getElementById('apiSaved');
const rewriteBtn = document.getElementById('rewriteBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const errorBox = document.getElementById('errorBox');
const resultsArea = document.getElementById('resultsArea');

const saved = localStorage.getItem('geminiKey');
if (saved) { apiKeyInput.value = saved; apiSaved.classList.remove('hidden'); }

apiKeyInput.addEventListener('input', () => {
  const v = apiKeyInput.value.trim();
  if (v) { localStorage.setItem('geminiKey', v); apiSaved.classList.remove('hidden'); }
  else apiSaved.classList.add('hidden');
});

document.getElementById('levelTabs').addEventListener('click', e => {
  const btn = e.target.closest('.level-btn');
  if (!btn) return;
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedLevel = btn.dataset.level;
});

async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

rewriteBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const context = document.getElementById('context').value.trim();
  const bulletsRaw = document.getElementById('bullets').value.trim();

  errorBox.classList.add('hidden');
  copyAllBtn.classList.add('hidden');
  rewrittenBullets = [];

  if (!apiKey) { showError('Please enter your Gemini API key.'); return; }
  if (!bulletsRaw) { showError('Please enter at least one bullet point.'); return; }

  const bullets = bulletsRaw.split('\n').map(b => b.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  if (!bullets.length) { showError('No valid bullet points found.'); return; }

  rewriteBtn.disabled = true;
  rewriteBtn.innerHTML = '<span>⏳</span> Rewriting…';
  resultsArea.innerHTML = '';

  const loadingEl = document.createElement('div');
  loadingEl.className = 'loading-card';
  loadingEl.innerHTML = `<div class="spinner"></div><p>Rewriting ${bullets.length} bullet${bullets.length > 1 ? 's' : ''}…</p>`;
  resultsArea.appendChild(loadingEl);

  const prompt = `You are an expert resume writer. Rewrite the following resume bullet points for a ${selectedLevel}-level ${context || 'professional'}.

For EACH bullet, provide exactly 3 improved versions. Each version must:
- Start with a strong action verb
- Include a specific metric or quantified impact (make a reasonable estimate if none given)
- Include relevant ATS keywords for the role/industry
- Be concise (under 20 words ideally)
- Sound natural and specific, not generic

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "results": [
    {
      "original": "the original bullet text",
      "options": [
        {
          "text": "Improved bullet option 1",
          "why": "One-liner explaining what makes it better"
        },
        {
          "text": "Improved bullet option 2",
          "why": "One-liner explaining what makes it better"
        },
        {
          "text": "Improved bullet option 3",
          "why": "One-liner explaining what makes it better"
        }
      ]
    }
  ]
}

Bullets to rewrite:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}`;

  try {
    const raw = await callGemini(apiKey, prompt);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const results = parsed.results || [];

    resultsArea.innerHTML = '';

    if (!results.length) {
      showError('No results returned. Please try again.');
      return;
    }

    const header = document.createElement('div');
    header.className = 'results-header';
    header.innerHTML = `<span class="results-count">${results.length} bullet${results.length > 1 ? 's' : ''} rewritten</span>`;
    resultsArea.appendChild(header);

    results.forEach((item, idx) => {
      rewrittenBullets.push(item.options?.[0]?.text || '');
      const card = buildBulletCard(item, idx);
      resultsArea.appendChild(card);
    });

    copyAllBtn.classList.remove('hidden');
  } catch (err) {
    resultsArea.innerHTML = '';
    showError('Rewrite failed: ' + err.message);
  } finally {
    rewriteBtn.disabled = false;
    rewriteBtn.innerHTML = '<span>✨</span> Rewrite Bullets';
  }
});

function buildBulletCard(item, idx) {
  const card = document.createElement('div');
  card.className = 'bullet-result-card';

  const options = item.options || [];
  const optionsHtml = options.map((opt, i) => `
    <div class="improved-option">
      <div class="option-num">Option ${i + 1}</div>
      <div class="option-text">${escHtml(opt.text || '')}</div>
      <div class="option-why">${escHtml(opt.why || '')}</div>
      <button class="btn-copy-option" data-text="${escAttr(opt.text || '')}">Copy</button>
    </div>
  `).join('');

  card.innerHTML = `
    <div class="bullet-card-layout">
      <div class="original-col">
        <div class="col-label original-label">Original</div>
        <div class="original-text">${escHtml(item.original || '')}</div>
      </div>
      <div class="improved-col">
        <div class="col-label improved-label">Improved Options</div>
        ${optionsHtml}
      </div>
    </div>
  `;

  card.querySelectorAll('.btn-copy-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.text;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      } catch { btn.textContent = 'Failed'; }
    });
  });

  return card;
}

copyAllBtn.addEventListener('click', async () => {
  const text = rewrittenBullets.filter(Boolean).map(b => `• ${b}`).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    copyAllBtn.textContent = '✓ Copied All!';
    copyAllBtn.classList.add('copied');
    setTimeout(() => { copyAllBtn.textContent = 'Copy All Best'; copyAllBtn.classList.remove('copied'); }, 2500);
  } catch { copyAllBtn.textContent = 'Copy failed'; }
});

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
