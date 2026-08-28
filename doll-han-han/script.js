/* ============================================================
   Doll Han Han — cursor-reactive doll + on-page modals
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- elements ---------- */
  var doll    = document.getElementById('doll');
  var dollImg = document.getElementById('dollImg');
  var pupilL  = document.getElementById('pupilL');
  var pupilR  = document.getElementById('pupilR');
  var rootCS  = getComputedStyle(document.documentElement);

  /* ---------- cursor-reactive doll ---------- */
  var SENS = 0.022;                 // px offset -> deg
  var cur  = { rx: 0, ry: 0, px: 0, py: 0 };
  var tgt  = { rx: 0, ry: 0, px: 0, py: 0 };
  var lastMove = 0;
  var idleT = 0;

  function eyePx(varName, axis, rect) {
    var pct = parseFloat(rootCS.getPropertyValue('--eye-' + varName)) / 100;
    return axis === 'x' ? rect.left + rect.width * pct : rect.top + rect.height * pct;
  }

  function setTargetsFromCursor(cx, cy) {
    var r = doll.getBoundingClientRect();
    var ox = cx - (r.left + r.width / 2);
    var oy = cy - (r.top + r.height / 2);
    tgt.ry = clamp(ox * SENS, -8, 8);
    tgt.rx = clamp(-oy * SENS, -6, 6);

    var maxR = clamp(r.height * 0.008, 3, 6);
    var elx = eyePx('l-x', 'x', r), ely = eyePx('l-y', 'y', r);
    var erx = eyePx('r-x', 'x', r), ery = eyePx('r-y', 'y', r);
    var al = Math.atan2(cy - ely, cx - elx);
    var ar = Math.atan2(cy - ery, cx - erx);
    tgt.px = { l: Math.cos(al) * maxR, r: Math.cos(ar) * maxR };
    tgt.py = { l: Math.sin(al) * maxR, r: Math.sin(ar) * maxR };
  }

  function setTargetsIdle(dt) {
    idleT += dt;
    var r = doll.getBoundingClientRect();
    var maxR = clamp(r.height * 0.008, 3, 6);
    tgt.ry = Math.sin(idleT * 0.7) * 4.5;
    tgt.rx = Math.sin(idleT * 1.4) * 2.6;          // sin(2t) -> figure-8
    var a = idleT * 0.8;
    tgt.px = { l: Math.cos(a) * maxR * 0.7, r: Math.cos(a) * maxR * 0.7 };
    tgt.py = { l: Math.sin(a * 2) * maxR * 0.7, r: Math.sin(a * 2) * maxR * 0.7 };
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var prevTs = 0;
  function frame(ts) {
    var dt = Math.min((ts - prevTs) / 1000, 0.05) || 0;
    prevTs = ts;

    if (coarse || performance.now() - lastMove > 2500) {
      setTargetsIdle(dt);
    }

    var k = 0.12;
    cur.rx = lerp(cur.rx, tgt.rx, k);
    cur.ry = lerp(cur.ry, tgt.ry, k);
    cur.px = {
      l: lerp(cur.px.l || 0, (tgt.px.l || 0), k),
      r: lerp(cur.px.r || 0, (tgt.px.r || 0), k)
    };
    cur.py = {
      l: lerp(cur.py.l || 0, (tgt.py.l || 0), k),
      r: lerp(cur.py.r || 0, (tgt.py.r || 0), k)
    };

    dollImg.style.transform =
      'perspective(800px) rotateX(' + cur.rx.toFixed(2) + 'deg) rotateY(' + cur.ry.toFixed(2) + 'deg)';
    pupilL.style.transform =
      'translate(calc(-50% + ' + cur.px.l.toFixed(2) + 'px), calc(-50% + ' + cur.py.l.toFixed(2) + 'px))';
    pupilR.style.transform =
      'translate(calc(-50% + ' + cur.px.r.toFixed(2) + 'px), calc(-50% + ' + cur.py.r.toFixed(2) + 'px))';

    requestAnimationFrame(frame);
  }

  if (!reduce) {
    cur.px = { l: 0, r: 0 };
    cur.py = { l: 0, r: 0 };
    tgt.px = { l: 0, r: 0 };
    tgt.py = { l: 0, r: 0 };
    window.addEventListener('mousemove', function (e) {
      lastMove = performance.now();
      setTargetsFromCursor(e.clientX, e.clientY);
    }, { passive: true });
    requestAnimationFrame(frame);
  }

  /* ---------- modals ---------- */
  var PROJECTS = [
    { name: 'AI Email Drafter', desc: 'Draft polished emails instantly using Gemini AI.',
      href: 'https://hhanng.github.io/ai_email_drafter.jsx/' },
    { name: 'AI Playlist Roaster', desc: 'Connects to Spotify and lets Gemini AI roast your music taste in Gen-Z slang.',
      href: 'https://spotify-roaster.streamlit.app/' },
    { name: 'Condensate', desc: 'Webcam hand-tracking + mic blow-detection demo that fogs the screen like a mirror — blow to fog it, pinch to wipe it clear.',
      href: 'https://hhanng.github.io/condensate/' },
    { name: 'Reminder-Bot', desc: 'Telegram bot that sets reminders and syncs with Google Calendar.',
      href: 'https://hhanng.github.io/reminder-bot' },
    { name: 'Prompt Engineering Coach', desc: 'Evaluate, improve, and learn prompt techniques with score bars and side-by-side rewrites.',
      href: 'https://hhanng.github.io/100-ai-agents/dev-ai-tools/agent-03-prompt-coach/' },
    { name: 'Algorithm Explainer', desc: 'Understand any algorithm with analogies, visual traces, Big O, and a quiz.',
      href: 'https://hhanng.github.io/100-ai-agents/study-cs-tools/agent-12-algorithm-explainer/' }
  ];

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var MODALS = {
    projects: {
      title: 'Projects',
      body: function () {
        var cards = PROJECTS.map(function (p) {
          return '<a class="pcard" href="' + p.href + '" target="_blank" rel="noopener">' +
                 '<span class="pcard__top"><span class="pcard__name">' + esc(p.name) + '</span>' +
                 '<span class="pcard__go">Launch &rarr;</span></span>' +
                 '<p class="pcard__desc">' + esc(p.desc) + '</p></a>';
        }).join('');
        return '<div class="plist">' + cards + '</div>' +
               '<a class="pmore" href="https://hhanng.github.io" target="_blank" rel="noopener">View all 120+ projects &rarr;</a>';
      }
    },
    contact: {
      title: 'Contact',
      body: function () {
        return '<div class="clist">' +
          '<a class="clink" href="mailto:ngvuhhan07@gmail.com">&#9993;&nbsp; ngvuhhan07@gmail.com</a>' +
          '<a class="clink" href="https://github.com/hhanng" target="_blank" rel="noopener">&#9740;&nbsp; github.com/hhanng</a>' +
          '<a class="clink" href="https://www.linkedin.com/in/hanhanhazel" target="_blank" rel="noopener">in&nbsp;&nbsp; linkedin.com/in/hanhanhazel</a>' +
          '</div>' +
          '<p class="cnote">CS student at Dallas College (GPA 3.87/4.0) — open to internships and freelance web / branding work.</p>';
      }
    }
  };

  var modal   = document.getElementById('modal');
  var mTitle  = document.getElementById('modalTitle');
  var mBody   = document.getElementById('modalBody');
  var lastFocus = null;

  function openModal(name) {
    var m = MODALS[name];
    if (!m) return;
    lastFocus = document.activeElement;
    mTitle.textContent = m.title;
    mBody.innerHTML = m.body();
    modal.hidden = false;
    var x = modal.querySelector('.modal__x');
    if (x) x.focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    mBody.innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn.getAttribute('data-modal')); });
  });
  modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
