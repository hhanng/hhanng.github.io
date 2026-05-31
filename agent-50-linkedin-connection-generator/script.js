/* =============================================
   LinkedIn Connection Message Generator
   Agent #50 — Milestone · Gemini-powered
   ============================================= */

'use strict';

// ── GEMINI API ─────────────────────────────────
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

// ── MESSAGE TYPES ──────────────────────────────
const MESSAGE_TYPES = [
  {
    key: 'connection',
    label: 'Connection Request',
    emoji: '🤝',
    limit: 300,
    tips: [
      { icon: '📏', text: 'Keep under 300 characters — LinkedIn hard limit for connection notes.' },
      { icon: '🎯', text: 'Mention one specific thing you know about them.' },
      { icon: '🚫', text: 'Never paste a generic message — people can tell.' },
      { icon: '✅', text: 'End with a low-pressure CTA, not a meeting request.' },
    ],
  },
  {
    key: 'followup',
    label: 'Follow-Up After No Reply',
    emoji: '💬',
    limit: null,
    tips: [
      { icon: '⏰', text: 'Wait at least 1–2 weeks before following up.' },
      { icon: '🔄', text: 'Reference your original message briefly.' },
      { icon: '💡', text: 'Add something new — a question, article, or insight.' },
      { icon: '🤲', text: 'Give them an easy out — keep the tone warm, not desperate.' },
    ],
  },
  {
    key: 'thankyou',
    label: 'Thank You After Call',
    emoji: '🌸',
    limit: null,
    tips: [
      { icon: '⚡', text: 'Send within 24 hours while the call is fresh.' },
      { icon: '📝', text: 'Reference 1-2 specific things they said.' },
      { icon: '🔗', text: 'Share a relevant resource if they mentioned an interest.' },
      { icon: '🚀', text: 'Close with a concrete next step if appropriate.' },
    ],
  },
  {
    key: 'referral',
    label: 'Referral Ask',
    emoji: '⭐',
    limit: null,
    tips: [
      { icon: '🤝', text: 'Only ask after you\'ve had at least one real conversation.' },
      { icon: '📋', text: 'Make it easy — include the exact role and a resume link.' },
      { icon: '💬', text: 'Explain why you\'re a strong fit in 1–2 sentences.' },
      { icon: '🎁', text: 'Make it optional — let them say no gracefully.' },
    ],
  },
];

const typeMap = {};
MESSAGE_TYPES.forEach(t => typeMap[t.key] = t);

// ── STATE ──────────────────────────────────────
let activeType = 'connection';
let isGenerating = false;

// ── DOM REFS ───────────────────────────────────
const $ = id => document.getElementById(id);

const apiInput     = $('api-key');
const generateBtn  = $('generate-btn');
const panelRight   = $('panel-right');
const toastWrap    = $('toast-wrap');

// ── PERSIST API KEY ────────────────────────────
const STORAGE_KEY = 'linkedin-gen-apikey';
apiInput.value = localStorage.getItem(STORAGE_KEY) || '';
apiInput.addEventListener('input', () => {
  localStorage.setItem(STORAGE_KEY, apiInput.value.trim());
});

// ── TAB BUTTONS ────────────────────────────────
MESSAGE_TYPES.forEach(type => {
  const btn = document.createElement('button');
  btn.className = 'tab-btn' + (type.key === activeType ? ' active' : '');
  btn.type = 'button';
  btn.dataset.type = type.key;
  btn.innerHTML = `${type.emoji}<br>${type.label}`;
  btn.addEventListener('click', () => selectType(type.key));
  $('tabs-container').appendChild(btn);
});

function selectType(key) {
  activeType = key;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === key);
  });
}

// ── HOW FOUND OPTIONS ──────────────────────────
const HOW_FOUND_OPTIONS = [
  { value: 'saw your post',       label: 'Saw your LinkedIn post' },
  { value: 'mutual connection',   label: 'Mutual connection / referral' },
  { value: 'alumni network',      label: 'Alumni network (same school)' },
  { value: 'cold outreach',       label: 'Cold outreach / found online' },
  { value: 'met at an event',     label: 'Met at an event / conference' },
];

const howSelect = $('how-found');
HOW_FOUND_OPTIONS.forEach(opt => {
  const option = document.createElement('option');
  option.value = opt.value;
  option.textContent = opt.label;
  howSelect.appendChild(option);
});

// ── GENERATE ───────────────────────────────────
$('generate-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (isGenerating) return;

  const apiKey      = apiInput.value.trim();
  const theirName   = $('their-name').value.trim();
  const theirRole   = $('their-role').value.trim();
  const howFound    = $('how-found').value;
  const yourName    = $('your-name').value.trim();
  const yourGoal    = $('your-goal').value;
  const specificThing = $('specific-thing').value.trim();

  // Validation
  if (!apiKey)    { toast('Please enter your Gemini API key', 'error'); return; }
  if (!theirName) { toast('Enter their name', 'error'); return; }
  if (!theirRole) { toast('Enter their role / company', 'error'); return; }
  if (!yourName)  { toast('Enter your name', 'error'); return; }

  const type = typeMap[activeType];
  isGenerating = true;
  generateBtn.classList.add('generating');
  generateBtn.disabled = true;

  showSkeleton();

  try {
    const prompt = buildPrompt(type, {
      theirName, theirRole, howFound, yourName, yourGoal, specificThing
    });

    const raw = await callGemini(apiKey, prompt);
    const variants = parseVariants(raw);

    if (!variants.length) throw new Error('No messages were generated. Try again.');

    showResults(type, variants);
  } catch (err) {
    showError(err.message || 'Something went wrong. Check your API key and try again.');
  } finally {
    isGenerating = false;
    generateBtn.classList.remove('generating');
    generateBtn.disabled = false;
  }
});

// ── PROMPT BUILDER ─────────────────────────────
function buildPrompt(type, ctx) {
  const goalMap = {
    'internship':    'land a software engineering internship',
    'networking':    'expand my professional network in tech',
    'mentorship':    'find a mentor in the industry',
    'job-referral':  'get a referral for a full-time role at their company',
  };
  const goalText = goalMap[ctx.yourGoal] || ctx.yourGoal;

  const specificLine = ctx.specificThing
    ? `One specific thing I know/admire about them: "${ctx.specificThing}"`
    : 'I don\'t have a specific detail — make it feel genuine based on context.';

  const limitNote = type.limit
    ? `CRITICAL: Each message MUST be under ${type.limit} characters (LinkedIn hard limit). Count carefully.`
    : 'Keep each message concise and professional.';

  return `You are an expert LinkedIn networking coach. Generate exactly 3 distinct "${type.label}" messages.

CONTEXT:
- Message type: ${type.label}
- Their name: ${ctx.theirName}
- Their role/company: ${ctx.theirRole}
- How I found them: ${ctx.howFound}
- My name: ${ctx.yourName}
- My goal: ${goalText}
- ${specificLine}

${limitNote}

REQUIREMENTS:
- Generate exactly 3 variants labeled VARIANT 1, VARIANT 2, VARIANT 3
- Each variant should have a DISTINCT tone: one warm/personal, one professional/direct, one creative/memorable
- Use their first name only
- Don't use hollow phrases like "I hope this message finds you well" or "I'm reaching out because..."
- Sound like a real human, not a template
- Each variant on a new section, clearly separated

FORMAT — use EXACTLY this structure:
VARIANT 1
[message text here]

VARIANT 2
[message text here]

VARIANT 3
[message text here]`;
}

// ── PARSE RESPONSE ─────────────────────────────
function parseVariants(raw) {
  const variants = [];
  const regex = /VARIANT\s+\d+\s*\n([\s\S]*?)(?=VARIANT\s+\d+|$)/gi;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const text = match[1].trim();
    if (text) variants.push(text);
  }

  // Fallback: split on double newlines if regex fails
  if (!variants.length) {
    const parts = raw.split(/\n\n+/).filter(p => p.trim().length > 20);
    return parts.slice(0, 3);
  }

  return variants.slice(0, 3);
}

// ── RENDER STATES ──────────────────────────────
function showSkeleton() {
  panelRight.innerHTML = `
    <div class="skeleton-wrap">
      ${[1,2,3].map(() => `
        <div class="skeleton-card">
          <div class="skeleton-header">
            <div class="skel" style="height:16px;width:80px;"></div>
            <div class="skel" style="height:16px;width:50px;margin-left:auto;"></div>
          </div>
          <div class="skeleton-body">
            <div class="skel" style="height:13px;width:100%;"></div>
            <div class="skel" style="height:13px;width:88%;"></div>
            <div class="skel" style="height:13px;width:72%;"></div>
            <div class="skel" style="height:13px;width:55%;"></div>
          </div>
        </div>`).join('')}
    </div>`;
}

function showError(msg) {
  panelRight.innerHTML = `
    <div class="error-state">
      <span style="font-size:1.5rem;flex-shrink:0">⚠️</span>
      <div>
        <div style="margin-bottom:4px">Generation failed</div>
        <div style="font-weight:400;font-size:0.82rem;opacity:0.85">${escHtml(msg)}</div>
      </div>
    </div>`;
}

function showResults(type, variants) {
  const tipsHtml = type.tips.map(t => `
    <div class="tip-item">
      <span class="tip-icon">${t.icon}</span>
      <span>${t.text}</span>
    </div>`).join('');

  const variantLabels = ['Warm & Personal', 'Professional & Direct', 'Creative & Memorable'];

  const variantsHtml = variants.map((text, i) => {
    const charCount = text.length;
    const overLimit = type.limit && charCount > type.limit;
    const charClass = overLimit ? 'char-count over-limit' : 'char-count';
    const charBadge = type.limit
      ? `<span class="${charClass}">${charCount} / ${type.limit}</span>`
      : `<span class="${charClass}">${charCount} chars</span>`;

    return `
      <div class="variant-card">
        <div class="variant-header">
          <div class="variant-label">
            <span>${['✨','💎','🚀'][i]}</span>
            Variant ${i + 1} — ${variantLabels[i] || ''}
          </div>
          <div class="variant-meta">
            ${charBadge}
            <button class="copy-btn" data-idx="${i}" onclick="copyVariant(this, ${i})">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy
            </button>
          </div>
        </div>
        <div class="variant-body" id="variant-text-${i}">${escHtml(text)}</div>
      </div>`;
  }).join('');

  panelRight.innerHTML = `
    <div class="results-header">
      <h2>${type.emoji} ${type.label}</h2>
      <span class="result-type-badge">3 variants generated</span>
    </div>

    <div class="variants-grid">
      ${variantsHtml}
    </div>

    <div class="tips-panel">
      <div class="tips-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        Best practices for ${type.label}
      </div>
      <div class="tips-grid">${tipsHtml}</div>
    </div>`;
}

// ── COPY ───────────────────────────────────────
function copyVariant(btn, idx) {
  const textEl = document.getElementById(`variant-text-${idx}`);
  if (!textEl) return;
  const text = textEl.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Copied!`;
    toast('Message copied to clipboard!', 'success');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copy`;
    }, 2200);
  }).catch(() => toast('Could not copy — try manually', 'error'));
}

// Make copyVariant globally available (called from inline onclick)
window.copyVariant = copyVariant;

// ── TOAST ──────────────────────────────────────
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ` ${type}` : '');
  el.textContent = msg;
  toastWrap.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── HELPERS ────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
