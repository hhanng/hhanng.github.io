const $ = id => document.getElementById(id);

let selectedYear = 'Freshman';

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

// ── Year Tabs ────────────────────────────────────────────────────────────────
$('yearTabs').addEventListener('click', e => {
  if (!e.target.classList.contains('year-btn')) return;
  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  selectedYear = e.target.dataset.year;
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

// ── Analyze ───────────────────────────────────────────────────────────────────
$('analyzeBtn').addEventListener('click', async () => {
  const apiKey  = $('apiKey').value.trim();
  const jdText  = $('jdText').value.trim();
  const skills  = $('skillsText').value.trim();

  $('formError').classList.add('hidden');

  if (!apiKey)  { showError('Please enter your Gemini API key at the top.'); return; }
  if (!jdText)  { showError('Please paste a job description.'); return; }
  if (!skills)  { showError('Please describe your skills and experience.'); return; }

  setLoading(true);

  const prompt = `You are a career advisor helping a ${selectedYear} student evaluate a job description.

Job Description:
${jdText}

Candidate's Skills & Experience:
${skills}

Candidate Year/Level: ${selectedYear}

Analyze the fit and return ONLY valid JSON with this exact structure (no markdown fences, no extra text):

{
  "match_score": 72,
  "must_have_keywords": ["Python", "REST APIs", "Git"],
  "nice_to_have_keywords": ["Docker", "Kubernetes"],
  "your_gaps": ["AWS", "SQL", "3+ years experience"],
  "your_strengths": ["Python", "React", "strong GPA"],
  "verdict": "Apply with Cover Letter",
  "verdict_reason": "You meet the core technical requirements but lack cloud experience. A strong cover letter addressing your eagerness to learn AWS will help.",
  "resume_tips": [
    "Add any AWS or cloud project — even a free-tier personal project counts.",
    "Quantify your Python projects with metrics (e.g., '40% faster processing').",
    "Mention any team collaboration or agile/scrum experience."
  ]
}

Rules:
- match_score: integer 0–100 reflecting realistic fit given year/level
- verdict must be exactly one of: "Apply Now", "Apply with Cover Letter", "Skill Up First"
- resume_tips: exactly 3 actionable, specific items
- must_have_keywords and nice_to_have_keywords: only skills/keywords actually in the JD
- your_gaps: requirements in the JD that the candidate is missing
- your_strengths: candidate skills that match what the JD asks for
- Return ONLY valid JSON, nothing else`;

  try {
    const raw = await callGemini(apiKey, prompt);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      showRawFallback(raw);
      return;
    }

    renderResults(parsed);
  } catch (err) {
    showError('Analysis failed: ' + err.message + '. Check your API key and try again.');
  } finally {
    setLoading(false);
  }
});

// ── Render Results ────────────────────────────────────────────────────────────
function renderResults(d) {
  $('emptyState').classList.add('hidden');
  $('rawFallback').classList.add('hidden');
  $('resultsWrap').classList.remove('hidden');

  // Score ring
  const score = Math.max(0, Math.min(100, parseInt(d.match_score) || 0));
  const circumference = 2 * Math.PI * 52; // 326.7
  const offset = circumference - (score / 100) * circumference;

  const ring = $('ringFill');
  ring.style.strokeDashoffset = circumference; // reset
  ring.className = 'ring-fill';

  setTimeout(() => {
    ring.style.strokeDashoffset = offset;
    if (score >= 80) ring.classList.add('green');
    else if (score >= 60) ring.classList.add('yellow');
    else ring.classList.add('red');
  }, 50);

  $('scoreNumber').textContent = score;

  let scoreTitle, scoreDescText;
  if (score >= 80) {
    scoreTitle = 'Strong Match';
    scoreDescText = 'You\'re a solid fit for this role. Apply confidently.';
  } else if (score >= 60) {
    scoreTitle = 'Moderate Match';
    scoreDescText = 'You meet many requirements. A strong application can close the gap.';
  } else {
    scoreTitle = 'Weak Match';
    scoreDescText = 'You\'re missing several key requirements. Consider upskilling first.';
  }
  $('scoreTitle').textContent = scoreTitle;
  $('scoreDesc').textContent = scoreDescText;

  // Verdict
  const verdict = d.verdict || '';
  const verdictBox = $('verdictBox');
  verdictBox.className = 'verdict-box';

  let icon, cssClass;
  if (verdict === 'Apply Now') {
    icon = '✅'; cssClass = 'apply-now';
  } else if (verdict === 'Apply with Cover Letter') {
    icon = '⚠️'; cssClass = 'apply-cover';
  } else {
    icon = '❌'; cssClass = 'skill-up';
  }

  verdictBox.classList.add(cssClass);
  $('verdictIcon').textContent = icon;
  $('verdictLabel').textContent = verdict || 'Verdict';
  $('verdictReason').textContent = d.verdict_reason || '';

  // Keywords
  renderChips('mustHaveChips', d.must_have_keywords, 'green');
  renderChips('niceToHaveChips', d.nice_to_have_keywords, 'blue');
  renderChips('gapChips', d.your_gaps, 'red');
  renderChips('strengthChips', d.your_strengths, 'pink');

  // Resume tips
  const tipsList = $('resumeTipsList');
  const tips = d.resume_tips || [];
  if (tips.length) {
    tipsList.innerHTML = tips.map(t => `<li>${escHtml(t)}</li>`).join('');
  } else {
    tipsList.innerHTML = '<li>No specific tips available — review the gaps above.</li>';
  }
}

function renderChips(containerId, items, colorClass) {
  const el = $(containerId);
  if (!items || !items.length) {
    el.innerHTML = '<span class="chip empty">None identified</span>';
    return;
  }
  el.innerHTML = items.map(item =>
    `<span class="chip ${colorClass}">${escHtml(item)}</span>`
  ).join('');
}

// ── Raw Fallback ───────────────────────────────────────────────────────────────
function showRawFallback(raw) {
  $('emptyState').classList.add('hidden');
  $('resultsWrap').classList.add('hidden');
  $('rawText').textContent = raw;
  $('rawFallback').classList.remove('hidden');
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function setLoading(on) {
  $('analyzeBtn').disabled = on;
  $('analyzeBtnText').textContent = on ? 'Analyzing…' : 'Analyze JD ✨';
  $('analyzeSpinner').classList.toggle('hidden', !on);
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
