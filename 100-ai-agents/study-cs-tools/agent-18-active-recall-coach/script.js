let session = {
  questions: [],
  current: 0,
  ratings: [],
  weakIndices: [],
  isRedrill: false
};

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('gemini_api_key');
  if (saved) {
    document.getElementById('apiKey').value = saved;
    document.getElementById('apiStatus').textContent = '✓ Key loaded';
  }

  const ta = document.getElementById('notesInput');
  ta.addEventListener('input', () => {
    document.getElementById('charCount').textContent = ta.value.length.toLocaleString() + ' characters';
  });
});

function saveApiKey() {
  const key = document.getElementById('apiKey').value.trim();
  if (!key) return;
  localStorage.setItem('gemini_api_key', key);
  const status = document.getElementById('apiStatus');
  status.textContent = '✓ Saved!';
  setTimeout(() => { status.textContent = ''; }, 2000);
}

function getApiKey() {
  return localStorage.getItem('gemini_api_key') || document.getElementById('apiKey').value.trim();
}

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

function showStep(id) {
  document.querySelectorAll('.step-panel').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function generateQuestions() {
  const notes = document.getElementById('notesInput').value.trim();
  const apiKey = getApiKey();

  if (!notes || notes.length < 30) {
    alert('Please paste some study notes first (at least a few sentences).');
    return;
  }
  if (!apiKey) {
    alert('Please enter your Gemini API key.');
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  document.getElementById('genBtnText').textContent = 'Generating…';
  document.getElementById('genSpinner').classList.add('active');

  showStep('stepLoading');

  const prompt = `You are an expert study coach using the active recall method. Read the following study notes and generate 8-10 high-quality recall questions that test genuine understanding (not just memorization of facts).

Study Notes:
"""
${notes}
"""

Return ONLY a valid JSON array in this exact format (no markdown, no extra text):
[
  {
    "question": "The full question text",
    "answer": "A clear, comprehensive model answer in 2-4 sentences"
  }
]

Make questions varied: include conceptual understanding, application, comparison, and explanation questions. Do not include trivial yes/no questions.`;

  try {
    let raw = await callGemini(apiKey, prompt);
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const questions = JSON.parse(raw);

    session.questions = questions;
    session.current = 0;
    session.ratings = new Array(questions.length).fill(null);
    session.weakIndices = [];
    session.isRedrill = false;

    showFlashcard(0);
  } catch (e) {
    showStep('stepNotes');
    const area = document.getElementById('appRoot');
    const old = document.getElementById('errorMsg');
    if (old) old.remove();
    const err = document.createElement('div');
    err.id = 'errorMsg';
    err.className = 'error-msg';
    err.textContent = 'Error: ' + e.message;
    area.appendChild(err);
  }

  btn.disabled = false;
  document.getElementById('genBtnText').textContent = 'Generate Questions';
  document.getElementById('genSpinner').classList.remove('active');
}

function showFlashcard(index) {
  const q = session.questions[index];
  if (!q) return;

  const total = session.questions.length;
  const pct = (index / total) * 100;

  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = `${index + 1} / ${total}`;
  document.getElementById('cardNum').textContent = `Card ${index + 1} of ${total}`;
  document.getElementById('questionText').textContent = q.question;
  document.getElementById('userAnswer').value = '';
  document.getElementById('modelAnswer').style.display = 'none';
  document.getElementById('modelText').textContent = '';
  document.getElementById('answerSection').style.display = 'block';

  showStep('stepFlashcard');
}

function revealAnswer() {
  const q = session.questions[session.current];
  document.getElementById('modelText').textContent = q.answer;
  document.getElementById('modelAnswer').style.display = 'block';
  document.getElementById('answerSection').querySelector('button').style.display = 'none';
}

function rateCard(rating) {
  session.ratings[session.current] = rating;

  if (rating === 'needs') {
    session.weakIndices.push(session.current);
  }

  const next = session.current + 1;
  if (next < session.questions.length) {
    session.current = next;
    showFlashcard(next);
  } else {
    showSummary();
  }
}

function showSummary() {
  const total = session.questions.length;
  const got = session.ratings.filter(r => r === 'got').length;
  const needs = session.ratings.filter(r => r === 'needs').length;
  const pct = Math.round((got / total) * 100);

  document.getElementById('progressFill').style.width = '100%';
  document.getElementById('progressLabel').textContent = `${total} / ${total}`;

  const scoreRow = document.getElementById('scoreRow');
  scoreRow.innerHTML = `
    <div class="score-stat">
      <div class="score-num green">${got}</div>
      <div class="score-stat-label">Got It</div>
    </div>
    <div class="score-stat">
      <div class="score-num red">${needs}</div>
      <div class="score-stat-label">Needs Work</div>
    </div>
    <div class="score-stat">
      <div class="score-num" style="color:var(--pink-dark)">${total}</div>
      <div class="score-stat-label">Total Cards</div>
    </div>
  `;

  setTimeout(() => {
    document.getElementById('scoreBarFill').style.width = pct + '%';
  }, 100);
  document.getElementById('scorePct').textContent = pct + '%';

  const weakSection = document.getElementById('weakTopicsSection');
  const weakList = document.getElementById('weakList');
  const redrillBtn = document.getElementById('redrill-btn');

  if (session.weakIndices.length > 0) {
    weakList.innerHTML = session.weakIndices.map(i => `
      <div class="weak-item">${escHtml(session.questions[i].question)}</div>
    `).join('');
    weakSection.style.display = 'block';
    redrillBtn.style.display = 'inline-flex';
  } else {
    weakSection.style.display = 'none';
    redrillBtn.style.display = 'none';
  }

  showStep('stepSummary');
}

function redrillWeak() {
  const weakQs = session.weakIndices.map(i => session.questions[i]);
  session.questions = weakQs;
  session.current = 0;
  session.ratings = new Array(weakQs.length).fill(null);
  session.weakIndices = [];
  session.isRedrill = true;

  document.getElementById('stepSummary').querySelector('.summary-title').textContent = 'Re-drill: Weak Cards';
  document.getElementById('stepSummary').querySelector('.summary-icon').textContent = '💪';

  showFlashcard(0);
}

function startOver() {
  session = { questions: [], current: 0, ratings: [], weakIndices: [], isRedrill: false };
  document.getElementById('notesInput').value = '';
  document.getElementById('charCount').textContent = '0 characters';
  const old = document.getElementById('errorMsg');
  if (old) old.remove();
  document.getElementById('scoreBarFill').style.width = '0%';
  showStep('stepNotes');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
