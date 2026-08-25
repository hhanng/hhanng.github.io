let apiKey = '';
let config = { role: 'Software Engineer', stage: 'Phone Screen', difficulty: 'Entry Level' };
let messages = [];
let questionCount = 0;
let sessionEnded = false;

const apiKeyInput = document.getElementById('apiKey');
const apiSaved = document.getElementById('apiSaved');

const saved = localStorage.getItem('geminiKey');
if (saved) { apiKeyInput.value = saved; apiKey = saved; apiSaved.classList.remove('hidden'); }

apiKeyInput.addEventListener('input', () => {
  apiKey = apiKeyInput.value.trim();
  if (apiKey) { localStorage.setItem('geminiKey', apiKey); apiSaved.classList.remove('hidden'); }
  else apiSaved.classList.add('hidden');
});

function setupPills(containerId, configKey) {
  document.getElementById(containerId).addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    document.querySelectorAll(`#${containerId} .pill`).forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    config[configKey] = btn.dataset.val;
  });
}
setupPills('roleOptions', 'role');
setupPills('stageOptions', 'stage');
setupPills('diffOptions', 'difficulty');

document.getElementById('startBtn').addEventListener('click', async () => {
  apiKey = apiKeyInput.value.trim();
  if (!apiKey) { showSetupError('Please enter your Gemini API key.'); return; }
  localStorage.setItem('geminiKey', apiKey);
  hideSetupError();
  document.getElementById('chatTitle').textContent = `${config.role} · ${config.stage}`;
  messages = [];
  questionCount = 0;
  sessionEnded = false;
  document.getElementById('chatBody').innerHTML = '';
  document.getElementById('userInput').value = '';
  showScreen('screenChat');
  await sendInterviewerMessage(null, true);
});

document.getElementById('exitBtn').addEventListener('click', () => {
  if (confirm('Exit this session?')) showScreen('screenSetup');
});

document.getElementById('sendBtn').addEventListener('click', handleSend);
document.getElementById('userInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
});

async function handleSend() {
  if (sessionEnded) return;
  const text = document.getElementById('userInput').value.trim();
  if (!text) return;
  document.getElementById('userInput').value = '';
  appendBubble('user', text);
  messages.push({ role: 'user', text });
  questionCount++;
  updateProgress();
  await sendInterviewerMessage(text, false);
}

async function sendInterviewerMessage(userAnswer, isFirst) {
  setInputDisabled(true);
  showChatLoading(true);

  const systemPrompt = `You are a professional HR interviewer conducting a ${config.stage} interview for a ${config.role} role. Difficulty: ${config.difficulty}.

Rules:
- If this is the opening message (no user answer yet): Write a warm, brief welcome (1-2 sentences) and ask your first interview question.
- If the user just answered a question AND it's question ${questionCount} out of 5: Give 1-2 sentences of brief, specific feedback on their answer (what was good or what to add), then ask the next question. Separate feedback from the next question with a line break.
- If this is after question 5 (questionCount >= 5): Give a short closing statement only — no more questions. Say the interview is complete and they'll receive feedback shortly.
- Keep questions relevant to ${config.role} at ${config.difficulty} level and ${config.stage} stage.
- Sound warm but professional. Don't be robotic.
- Never number the questions aloud.`;

  const history = messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.text}`).join('\n\n');
  const fullPrompt = isFirst
    ? `${systemPrompt}\n\nThis is the start of the interview. Write your welcome message and first question.`
    : `${systemPrompt}\n\nConversation so far:\n${history}\n\nThe candidate just answered. This is their answer number ${questionCount} of 5. Respond appropriately.`;

  try {
    const reply = await callGemini(apiKey, fullPrompt);
    showChatLoading(false);

    if (!isFirst && questionCount <= 5) {
      const parts = splitFeedbackAndQuestion(reply);
      if (parts.feedback) appendBubble('feedback', parts.feedback);
      if (parts.question) appendBubble('interviewer', parts.question);
      else appendBubble('interviewer', reply);
    } else {
      appendBubble('interviewer', reply);
    }

    messages.push({ role: 'interviewer', text: reply });

    if (questionCount >= 5) {
      sessionEnded = true;
      setInputDisabled(true);
      document.getElementById('chatFooter').style.opacity = '0.5';
      document.getElementById('chatFooter').style.pointerEvents = 'none';
      setTimeout(buildReport, 1800);
    } else {
      setInputDisabled(false);
      document.getElementById('userInput').focus();
    }
  } catch (err) {
    showChatLoading(false);
    appendBubble('interviewer', 'Sorry, I ran into an error: ' + err.message);
    setInputDisabled(false);
  }
}

function splitFeedbackAndQuestion(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length <= 1) return { feedback: null, question: text };
  const midpoint = Math.floor(lines.length / 2);
  const feedback = lines.slice(0, midpoint).join(' ');
  const question = lines.slice(midpoint).join(' ');
  return { feedback, question };
}

function appendBubble(type, text) {
  const body = document.getElementById('chatBody');
  const row = document.createElement('div');
  row.className = `bubble-row ${type === 'user' ? 'user' : 'interviewer'}`;

  if (type === 'feedback') {
    const bubble = document.createElement('div');
    bubble.className = 'bubble feedback';
    bubble.style.maxWidth = '88%';
    bubble.style.margin = '0 auto';
    bubble.textContent = text;
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
    return;
  }

  const avatar = document.createElement('div');
  avatar.className = `bubble-avatar ${type === 'user' ? 'usr' : 'iv'}`;
  avatar.textContent = type === 'user' ? '🙋' : '🧑‍💼';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${type}`;
  bubble.textContent = text;

  row.appendChild(avatar);
  row.appendChild(bubble);
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}

function showChatLoading(on) {
  let el = document.getElementById('chatLoading');
  if (!el) return;
  el.classList.toggle('hidden', !on);
  if (on) document.getElementById('chatBody').scrollTop = document.getElementById('chatBody').scrollHeight;
}

function setInputDisabled(on) {
  document.getElementById('userInput').disabled = on;
  document.getElementById('sendBtn').disabled = on;
}

function updateProgress() {
  const q = Math.min(questionCount, 5);
  document.getElementById('progressLabel').textContent = `Question ${q} of 5`;
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.remove('done', 'active');
    if (i < q - 1) dot.classList.add('done');
    else if (i === q - 1) dot.classList.add('active');
  });
}

async function buildReport() {
  showScreen('screenReport');
  document.getElementById('reportLoading').classList.remove('hidden');
  document.getElementById('reportContent').classList.add('hidden');

  const transcript = messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.text}`).join('\n\n');
  const prompt = `You are an expert interview coach. A candidate just completed a ${config.stage} interview for ${config.role} at ${config.difficulty} level.

Here is the full interview transcript:
${transcript}

Evaluate the candidate's performance and return ONLY valid JSON (no markdown, no explanation):
{
  "score": 7,
  "verdict": "A short encouraging verdict in 5-8 words",
  "summary": "1 sentence overall assessment",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Area 1", "Area 2", "Area 3"],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

  try {
    const raw = await callGemini(apiKey, prompt);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const report = JSON.parse(cleaned);

    document.getElementById('scoreNum').textContent = report.score || '—';
    document.getElementById('scoreVerdict').textContent = report.verdict || 'Interview Complete';
    document.getElementById('scoreSub').textContent = report.summary || '';
    document.getElementById('strengthsList').innerHTML = (report.strengths || []).map(s => `<li>${escHtml(s)}</li>`).join('');
    document.getElementById('improveList').innerHTML = (report.improvements || []).map(s => `<li>${escHtml(s)}</li>`).join('');
    document.getElementById('tipsList').innerHTML = (report.tips || []).map(s => `<li>${escHtml(s)}</li>`).join('');
  } catch (err) {
    document.getElementById('scoreNum').textContent = '—';
    document.getElementById('scoreVerdict').textContent = 'Session Complete';
    document.getElementById('scoreSub').textContent = 'Review your transcript above for insights.';
    document.getElementById('strengthsList').innerHTML = '<li>Session completed successfully</li>';
    document.getElementById('improveList').innerHTML = '<li>Could not generate detailed report</li>';
    document.getElementById('tipsList').innerHTML = '<li>Review your answers and try again</li>';
  }

  document.getElementById('reportLoading').classList.add('hidden');
  document.getElementById('reportContent').classList.remove('hidden');
}

document.getElementById('newSessionBtn').addEventListener('click', () => {
  document.getElementById('chatFooter').style.opacity = '';
  document.getElementById('chatFooter').style.pointerEvents = '';
  showScreen('screenSetup');
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

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showSetupError(msg) {
  const el = document.getElementById('setupError');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideSetupError() { document.getElementById('setupError').classList.add('hidden'); }

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
