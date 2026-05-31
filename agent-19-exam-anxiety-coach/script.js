// ── TAB SWITCHING ──
function switchTab(tabId, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + tabId).classList.add('active');
  if (tabId !== 'breathing' && breathInterval) stopBreathing();
}

// ── BREATHING ──
let breathInterval = null;
let breathTimer = null;
let cycleCount = 0;
let currentSecond = 0;

const PHASES = [
  { name: 'Inhale', id: 'phase-in',    duration: 4, circleClass: 'inhale' },
  { name: 'Hold',   id: 'phase-hold1', duration: 4, circleClass: 'hold'   },
  { name: 'Exhale', id: 'phase-out',   duration: 4, circleClass: 'exhale' },
  { name: 'Hold',   id: 'phase-hold2', duration: 4, circleClass: 'hold-out' },
];

let phaseIndex = 0;
let secondInPhase = 0;

function startBreathing() {
  cycleCount = 0;
  phaseIndex = 0;
  secondInPhase = 0;
  document.getElementById('breathStartBtn').style.display = 'none';
  document.getElementById('breathStopBtn').style.display = 'inline-block';
  runPhase();
  breathInterval = setInterval(tick, 1000);
}

function tick() {
  secondInPhase++;
  const phase = PHASES[phaseIndex];
  const remaining = phase.duration - secondInPhase;

  if (remaining >= 0) {
    document.getElementById('breathCount').textContent = remaining === 0 ? '' : remaining;
  }

  if (secondInPhase >= phase.duration) {
    secondInPhase = 0;
    phaseIndex = (phaseIndex + 1) % PHASES.length;
    if (phaseIndex === 0) {
      cycleCount++;
      document.getElementById('cycleCount').textContent = `Cycles completed: ${cycleCount}`;
    }
    runPhase();
  }
}

function runPhase() {
  const phase = PHASES[phaseIndex];
  const circle = document.getElementById('breathCircle');
  const label = document.getElementById('breathLabel');
  const count = document.getElementById('breathCount');

  circle.className = 'breath-circle ' + phase.circleClass;
  label.textContent = phase.name;
  count.textContent = phase.duration;

  document.querySelectorAll('.phase-step').forEach(el => el.classList.remove('active'));
  document.getElementById(phase.id).classList.add('active');
}

function stopBreathing() {
  clearInterval(breathInterval);
  breathInterval = null;
  phaseIndex = 0;
  secondInPhase = 0;

  const circle = document.getElementById('breathCircle');
  circle.className = 'breath-circle';
  document.getElementById('breathLabel').textContent = 'Press Start';
  document.getElementById('breathCount').textContent = '';
  document.querySelectorAll('.phase-step').forEach(el => el.classList.remove('active'));

  document.getElementById('breathStartBtn').style.display = 'inline-block';
  document.getElementById('breathStopBtn').style.display = 'none';
}

// ── THOUGHT REFRAMING ──
const reframePatterns = [
  {
    keywords: ['fail', 'failing', 'failed', 'flunk'],
    reframe: "Failure is information, not a verdict. You've prepared, and even a hard result teaches you something. One exam doesn't define your intelligence or your future."
  },
  {
    keywords: ['blank', 'forget', 'remember', 'memory', 'forgot'],
    reframe: "Your brain has stored more than you realize. If you blank, take a slow breath, skip the question, and return to it. The answer often comes when the pressure drops."
  },
  {
    keywords: ['stupid', 'dumb', 'smart', 'intelligent', 'capable', 'good enough'],
    reframe: "Intelligence is built, not fixed. The fact that you're preparing and caring about this proves you have what it takes. You are more capable than your anxiety is telling you."
  },
  {
    keywords: ['time', 'run out', 'slow', 'too much', 'finish'],
    reframe: "You can work systematically. Answer what you know first, then return to harder questions. Pacing comes with practice, and you've been practicing."
  },
  {
    keywords: ['everyone', 'others', 'class', 'classmates', 'people', 'compare'],
    reframe: "You only see other people's confidence, not their anxiety. Everyone is focused on their own performance — and so should you. Your journey is your own."
  },
  {
    keywords: ['study', 'prepared', 'ready', 'enough', 'haven'],
    reframe: "You've done what you could with the time you had. Extra worrying now uses energy you need for the exam itself. Trust the preparation you've already done."
  },
  {
    keywords: ['panic', 'anxious', 'nervous', 'scared', 'fear', 'worried', 'stress'],
    reframe: "Nervousness means you care — and caring is a strength. Your body is energized. Take three slow breaths: that energy becomes focus when you let it."
  },
  {
    keywords: ['disappoint', 'parents', 'family', 'teacher', 'professor', 'expectations'],
    reframe: "The people who matter most want you to try your best — not be perfect. You showing up and doing your best is already something to be proud of."
  },
];

const defaultReframe = "That thought is your anxiety talking, not reality. Challenge it: is it 100% certain? Almost never. You've handled hard things before, and you can handle this too. You are prepared, capable, and enough.";

function reframeCustom() {
  const input = document.getElementById('customThought').value.trim().toLowerCase();
  if (!input) return;

  const resultEl = document.getElementById('customResult');
  let reframe = defaultReframe;

  for (const pattern of reframePatterns) {
    if (pattern.keywords.some(kw => input.includes(kw))) {
      reframe = pattern.reframe;
      break;
    }
  }

  resultEl.textContent = reframe;
  resultEl.style.display = 'block';
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('customThought');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') reframeCustom();
    });
  }
});

// ── PEP TALK ──
const pepTemplates = [
  (exam, studied, strength) => `You're about to walk into your ${exam}, and here's what I need you to know: you are more ready than you feel right now.\n\nYou've studied ${studied} — that knowledge is in your head, stored and waiting. And ${strength}? That's your anchor. When the questions get tough, remember that you already know this.\n\nAnxiety is just your brain revving the engine. Channel it. Breathe. Start with what you know. You've done hard things before, and this is just one more. Go show that exam exactly what you're made of. 🌸`,

  (exam, studied, strength) => `Let's be real for a second: you wouldn't be feeling nervous if you didn't care. And caring? That's already half the battle won.\n\nFor your ${exam}, you've put in the work on ${studied}. Your knowledge of ${strength} alone could carry you through some of the toughest questions. Trust that.\n\nWhen you sit down, take one deep breath, read slowly, and trust your instincts. You've got this. Not because it's easy — but because you've prepared, and you're capable. Now go prove it. 💪`,

  (exam, studied, strength) => `Here's a truth your anxious brain doesn't want you to hear: you are ready.\n\nYou studied ${studied}. You know ${strength} well. That is real preparation, and no amount of last-minute panic can take that away from you.\n\nFor your ${exam}, I want you to walk in like the student who put in the work — because that's exactly who you are. Take a breath. Start. One question at a time. You've earned this moment. Make it count. ✨`,
];

function generatePepTalk() {
  const exam = document.getElementById('pepExam').value.trim() || 'your upcoming exam';
  const studied = document.getElementById('pepStudied').value.trim() || 'the key topics';
  const strength = document.getElementById('pepStrength').value.trim() || 'your strongest subject';

  const emojis = ['💪', '🌟', '🌸', '✨', '🎯', '🔥', '🦋'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  const template = pepTemplates[Math.floor(Math.random() * pepTemplates.length)];
  const message = template(exam, studied, strength);

  document.getElementById('pepEmoji').textContent = emoji;
  document.getElementById('pepMessage').innerHTML = message.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  document.getElementById('pepForm').style.display = 'none';
  document.getElementById('pepResult').style.display = 'block';
}

function regeneratePep() {
  document.getElementById('pepForm').style.display = 'block';
  document.getElementById('pepResult').style.display = 'none';
}

// ── CHECKLIST ──
function toggleCheck(item) {
  item.classList.toggle('checked');
  updateChecklistProgress();
}

function updateChecklistProgress() {
  const items = document.querySelectorAll('.check-item');
  const checked = document.querySelectorAll('.check-item.checked').length;
  const total = items.length;
  const pct = (checked / total) * 100;

  document.getElementById('checkProgFill').style.width = pct + '%';
  document.getElementById('checkProgLabel').textContent = `${checked} / ${total} done`;

  const allDone = document.getElementById('allDoneMsg');
  if (checked === total) {
    allDone.style.display = 'flex';
  } else {
    allDone.style.display = 'none';
  }
}

function resetChecklist() {
  document.querySelectorAll('.check-item').forEach(item => item.classList.remove('checked'));
  document.getElementById('allDoneMsg').style.display = 'none';
  updateChecklistProgress();
}
