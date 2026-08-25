window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('gemini_api_key');
  if (saved) {
    document.getElementById('apiKey').value = saved;
    document.getElementById('apiStatus').textContent = '✓ Key loaded';
  }
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
  let text = data.candidates[0].content.parts[0].text;
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(text);
}

async function generateTopics() {
  const subject = document.getElementById('subject').value.trim();
  const paperType = document.getElementById('paperType').value;
  const difficulty = document.getElementById('difficulty').value;
  const apiKey = getApiKey();

  if (!subject) { alert('Please enter a subject or course name.'); return; }
  if (!apiKey) { alert('Please enter your Gemini API key.'); return; }

  const btn = document.getElementById('generateBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const resultsArea = document.getElementById('resultsArea');

  btn.disabled = true;
  btnText.textContent = 'Generating…';
  btnSpinner.classList.add('active');

  resultsArea.innerHTML = `
    <div class="loading-area">
      <div class="big-spinner"></div>
      <div class="loading-text">Brainstorming 6 unique research topics…</div>
    </div>`;

  const prompt = `You are an academic writing coach helping a ${difficulty} student write a ${paperType} paper for their ${subject} course.

Generate exactly 6 unique, compelling research topics. For each topic provide:
- A clear, specific title
- One-sentence thesis statement
- Exactly 3 key arguments (concise phrases)
- A brief paper outline with: intro hook, 3 body point summaries, and a conclusion hint

Return ONLY valid JSON in this exact format:
{
  "topics": [
    {
      "title": "Topic title here",
      "thesis": "One-sentence thesis statement here.",
      "arguments": ["Argument 1", "Argument 2", "Argument 3"],
      "outline": {
        "intro": "Opening hook / angle for the introduction",
        "body1": "First body section focus",
        "body2": "Second body section focus",
        "body3": "Third body section focus",
        "conclusion": "Conclusion direction / call to action"
      }
    }
  ]
}
Return only JSON, no markdown fences.`;

  try {
    const data = await callGemini(apiKey, prompt);
    renderTopics(data.topics, subject, paperType, difficulty, resultsArea);
  } catch (e) {
    resultsArea.innerHTML = `<div class="error-msg">Error: ${escHtml(e.message)}</div>`;
  }

  btn.disabled = false;
  btnText.textContent = 'Generate 6 Topics';
  btnSpinner.classList.remove('active');
}

function renderTopics(topics, subject, paperType, difficulty, container) {
  if (!topics || !topics.length) {
    container.innerHTML = '<div class="error-msg">No topics returned. Please try again.</div>';
    return;
  }

  const typeLabel = { argumentative: 'Argumentative', analytical: 'Analytical', informative: 'Informative' };
  const diffLabel = { 'high school': 'High School', undergraduate: 'Undergrad', graduate: 'Graduate' };

  const cards = topics.map((t, i) => `
    <div class="topic-card" id="card-${i}">
      <div class="topic-header" onclick="toggleCard(${i})">
        <div class="topic-num">${i + 1}</div>
        <div class="topic-title">${escHtml(t.title)}</div>
        <div class="topic-toggle" id="toggle-${i}">▼</div>
      </div>
      <div class="topic-body" id="body-${i}">
        <div class="section-label">Thesis</div>
        <div class="thesis-text">${escHtml(t.thesis)}</div>

        <div class="section-label">Key Arguments</div>
        <ul class="args-list">
          ${(t.arguments || []).map(a => `
            <li><div class="arg-dot"></div><span>${escHtml(a)}</span></li>
          `).join('')}
        </ul>

        <div class="section-label">Paper Outline</div>
        <div class="outline-box">
          <div class="outline-row"><span class="outline-part">Intro</span><span>${escHtml(t.outline?.intro || '')}</span></div>
          <div class="outline-row"><span class="outline-part">Body 1</span><span>${escHtml(t.outline?.body1 || '')}</span></div>
          <div class="outline-row"><span class="outline-part">Body 2</span><span>${escHtml(t.outline?.body2 || '')}</span></div>
          <div class="outline-row"><span class="outline-part">Body 3</span><span>${escHtml(t.outline?.body3 || '')}</span></div>
          <div class="outline-row"><span class="outline-part">Conclusion</span><span>${escHtml(t.outline?.conclusion || '')}</span></div>
        </div>

        <div class="card-footer">
          <button class="btn-copy" onclick="copyTopic(${i})" id="copy-${i}">
            📋 Copy Topic
          </button>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="topics-header">
      <h2>6 Research Topics for <em>${escHtml(subject)}</em></h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span class="badge">${escHtml(typeLabel[paperType] || paperType)}</span>
        <span class="badge">${escHtml(diffLabel[difficulty] || difficulty)}</span>
      </div>
    </div>
    <div class="topics-grid">${cards}</div>
  `;

  toggleCard(0);

  window._topicsData = topics;
}

function toggleCard(i) {
  const body = document.getElementById(`body-${i}`);
  const toggle = document.getElementById(`toggle-${i}`);
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  toggle.classList.toggle('open', !isOpen);
}

function copyTopic(i) {
  const t = window._topicsData?.[i];
  if (!t) return;
  const text = [
    `RESEARCH TOPIC ${i + 1}: ${t.title}`,
    '',
    `THESIS: ${t.thesis}`,
    '',
    'KEY ARGUMENTS:',
    ...(t.arguments || []).map((a, j) => `  ${j + 1}. ${a}`),
    '',
    'OUTLINE:',
    `  Introduction: ${t.outline?.intro || ''}`,
    `  Body 1: ${t.outline?.body1 || ''}`,
    `  Body 2: ${t.outline?.body2 || ''}`,
    `  Body 3: ${t.outline?.body3 || ''}`,
    `  Conclusion: ${t.outline?.conclusion || ''}`,
  ].join('\n');

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(`copy-${i}`);
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy Topic';
      btn.classList.remove('copied');
    }, 2000);
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
