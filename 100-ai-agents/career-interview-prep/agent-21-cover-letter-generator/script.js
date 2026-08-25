let selectedTone = 'Professional';

const apiKeyInput = document.getElementById('apiKey');
const apiSaved = document.getElementById('apiSaved');
const generateBtn = document.getElementById('generateBtn');
const errorBox = document.getElementById('errorBox');
const outputPlaceholder = document.getElementById('outputPlaceholder');
const outputContent = document.getElementById('outputContent');
const loadingState = document.getElementById('loadingState');
const letterBody = document.getElementById('letterBody');
const wordCount = document.getElementById('wordCount');
const kwChips = document.getElementById('kwChips');
const copyBtn = document.getElementById('copyBtn');

const saved = localStorage.getItem('geminiKey');
if (saved) {
  apiKeyInput.value = saved;
  apiSaved.classList.remove('hidden');
}

apiKeyInput.addEventListener('input', () => {
  const v = apiKeyInput.value.trim();
  if (v) {
    localStorage.setItem('geminiKey', v);
    apiSaved.classList.remove('hidden');
  } else {
    apiSaved.classList.add('hidden');
  }
});

document.getElementById('toneTabs').addEventListener('click', e => {
  const btn = e.target.closest('.tone-btn');
  if (!btn) return;
  document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedTone = btn.dataset.tone;
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

function extractKeywords(jd) {
  const stopWords = new Set([
    'the','and','for','are','with','you','will','have','that','this','your',
    'our','from','they','been','can','but','not','all','its','who','may','also',
    'any','was','has','more','their','than','which','would','one','about','we',
    'or','to','in','of','a','an','is','as','on','at','by','it','be','do','so',
    'if','up','no','my','we','he','she','his','her','us','them','me',
  ]);
  const words = jd.toLowerCase()
    .replace(/[^a-z0-9+#.\- ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([w]) => w);
}

function findMatchedKeywords(keywords, letterText) {
  const lowerLetter = letterText.toLowerCase();
  return keywords.filter(kw => lowerLetter.includes(kw));
}

function highlightKeywords(text, keywords) {
  if (!keywords.length) return escHtml(text);
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  return escHtml(text).replace(pattern, '<mark>$1</mark>');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

generateBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const company = document.getElementById('company').value.trim();
  const role = document.getElementById('role').value.trim();
  const jobDesc = document.getElementById('jobDesc').value.trim();
  const background = document.getElementById('background').value.trim();

  errorBox.classList.add('hidden');

  if (!apiKey) { showError('Please enter your Gemini API key.'); return; }
  if (!company) { showError('Please enter the company name.'); return; }
  if (!role) { showError('Please enter the role or position.'); return; }
  if (!jobDesc) { showError('Please paste the job description.'); return; }
  if (!background) { showError('Please enter your background and skills.'); return; }

  setLoading(true);

  const prompt = `Write a ${selectedTone.toLowerCase()}, human-sounding cover letter for the following application. It must be exactly 3 paragraphs and sound like a real person wrote it — not a template.

Company: ${company}
Role: ${role}
Tone: ${selectedTone}

Job Description:
${jobDesc}

Applicant's Background:
${background}

Instructions:
- Paragraph 1: Express genuine interest in the specific role and company. Reference something specific from the job description.
- Paragraph 2: Highlight 2-3 relevant skills or experiences from the background that directly match the JD. Be specific and include real-sounding achievements.
- Paragraph 3: Close confidently, express enthusiasm for next steps.
- Do NOT use generic filler phrases like "I am writing to apply for" or "I believe I am the perfect candidate."
- Sound ${selectedTone === 'Concise' ? 'brief and punchy — keep each paragraph to 2-3 sentences' : selectedTone === 'Enthusiastic' ? 'warm, energetic, and genuinely excited' : 'professional, confident, and thoughtful'}.
- Do not include a subject line or salutation. Start directly with the letter body.
- Return ONLY the cover letter text, no extra commentary.`;

  try {
    const result = await callGemini(apiKey, prompt);
    const trimmed = result.trim();

    const jdKeywords = extractKeywords(jobDesc);
    const matched = findMatchedKeywords(jdKeywords, trimmed);

    letterBody.innerHTML = highlightKeywords(trimmed, matched);
    wordCount.textContent = `${countWords(trimmed)} words`;

    kwChips.innerHTML = matched.length
      ? matched.map(kw => `<span class="kw-chip">${escHtml(kw)}</span>`).join('')
      : '<span style="color:var(--ink-faint);font-size:0.83rem">No keyword matches found.</span>';

    outputPlaceholder.classList.add('hidden');
    loadingState.classList.add('hidden');
    outputContent.classList.remove('hidden');

    copyBtn._letterText = trimmed;
  } catch (err) {
    setLoading(false);
    showError('Generation failed: ' + err.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<span class="btn-icon">✨</span> Generate Cover Letter';
    loadingState.classList.add('hidden');
  }
});

copyBtn.addEventListener('click', async () => {
  const text = copyBtn._letterText || letterBody.innerText;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy Letter';
      copyBtn.classList.remove('copied');
    }, 2000);
  } catch {
    copyBtn.textContent = 'Copy failed';
  }
});

function setLoading(on) {
  if (on) {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="btn-icon">⏳</span> Generating…';
    outputPlaceholder.classList.add('hidden');
    outputContent.classList.add('hidden');
    loadingState.classList.remove('hidden');
  } else {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<span class="btn-icon">✨</span> Generate Cover Letter';
    loadingState.classList.add('hidden');
  }
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}
