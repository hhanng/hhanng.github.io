const $ = id => document.getElementById(id);

let selectedTone = 'Professional';

// ── API Key ──────────────────────────────────────────────────────────────────
(function initKey() {
  const saved = localStorage.getItem('geminiKey');
  if (saved) {
    $('apiKey').value = saved;
    $('apiStatus').textContent = '✓ Saved';
  }
})();

$('apiKey').addEventListener('change', () => {
  const val = $('apiKey').value.trim();
  if (val) {
    localStorage.setItem('geminiKey', val);
    $('apiStatus').textContent = '✓ Saved';
  }
});

// ── Tone Tabs ────────────────────────────────────────────────────────────────
document.getElementById('toneTabs').addEventListener('click', e => {
  if (!e.target.classList.contains('tone-btn')) return;
  document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  selectedTone = e.target.dataset.tone;
});

// ── Gemini Call ───────────────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

// ── Generate ─────────────────────────────────────────────────────────────────
$('generateBtn').addEventListener('click', async () => {
  const apiKey = $('apiKey').value.trim();
  const recruiterName = $('recruiterName').value.trim();
  const companyName   = $('companyName').value.trim();
  const roleName      = $('roleName').value.trim();
  const yourName      = $('yourName').value.trim();
  const achievement   = $('achievement').value.trim();

  // Validation
  $('formError').classList.add('hidden');
  if (!apiKey) { showError('Please enter your Gemini API key at the top.'); return; }
  if (!recruiterName || !companyName || !roleName || !yourName || !achievement) {
    showError('Please fill in all fields before generating.');
    return;
  }

  setLoading(true);

  const prompt = `You are a cold email writing expert helping a student or early-career professional get recruiter replies.

Write exactly 3 distinct cold email variants for reaching out to a recruiter.
Each email MUST be under 150 words. Each must have a unique angle.

Details:
- Recruiter's name: ${recruiterName}
- Company: ${companyName}
- Role: ${roleName}
- My name: ${yourName}
- My achievement: ${achievement}
- Tone: ${selectedTone}

The tones:
- Professional: Polished, confident, concise. Minimal filler.
- Friendly: Warm, conversational, shows genuine enthusiasm. Not over the top.
- Bold: Direct, punchy opener that hooks immediately. Takes a small risk.

Respond ONLY with valid JSON (no markdown fences, no extra text):
{
  "emails": [
    {
      "variant": "Variant 1 – [angle name]",
      "subject": "Subject line here",
      "body": "Email body here"
    },
    {
      "variant": "Variant 2 – [angle name]",
      "subject": "Subject line here",
      "body": "Email body here"
    },
    {
      "variant": "Variant 3 – [angle name]",
      "subject": "Subject line here",
      "body": "Email body here"
    }
  ]
}`;

  try {
    const raw = await callGemini(apiKey, prompt);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    renderEmails(parsed.emails || []);
  } catch (err) {
    showError('Generation failed: ' + err.message + '. Check your API key and try again.');
  } finally {
    setLoading(false);
  }
});

// ── Render Emails ─────────────────────────────────────────────────────────────
function renderEmails(emails) {
  if (!emails.length) {
    showError('No emails returned. Please try again.');
    return;
  }

  $('emptyState').classList.add('hidden');
  $('emailsWrap').classList.remove('hidden');

  $('emailCards').innerHTML = emails.map((email, i) => {
    const wordCount = countWords(email.body);
    const isOk = wordCount <= 150;
    return `
      <div class="email-card" id="emailCard${i}">
        <div class="email-card-header">
          <span class="email-variant-label">${escHtml(email.variant)}</span>
          <span class="word-badge ${isOk ? 'ok' : 'over'}" id="wordBadge${i}">${wordCount} words ${isOk ? '✓' : '↑ over 150'}</span>
        </div>
        <div class="email-subject-row">
          <span class="subject-label">Subject:</span>
          <span class="subject-text">${escHtml(email.subject)}</span>
        </div>
        <div class="email-body" id="emailBody${i}">${escHtml(email.body)}</div>
        <button class="copy-btn" id="copyBtn${i}" onclick="copyEmail(${i}, ${JSON.stringify(escHtml(email.subject))}, ${JSON.stringify(escHtml(email.body))})">
          📋 Copy Email
        </button>
      </div>
    `;
  }).join('');
}

// ── Copy Email ────────────────────────────────────────────────────────────────
function copyEmail(i, subject, body) {
  const text = `Subject: ${subject}\n\n${body}`;
  navigator.clipboard.writeText(unescHtml(text)).then(() => {
    const btn = $(`copyBtn${i}`);
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy Email';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function setLoading(on) {
  $('generateBtn').disabled = on;
  $('generateBtnText').textContent = on ? 'Generating…' : 'Generate 3 Email Variants ✨';
  $('generateSpinner').classList.toggle('hidden', !on);
}

function showError(msg) {
  $('formError').textContent = msg;
  $('formError').classList.remove('hidden');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function unescHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}
