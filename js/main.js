/* ─── Nav: glass effect on scroll ──────────────────────────── */
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
}, { passive: true });

/* ─── Hamburger toggle ───────────────────────────────────────── */
hamburger.addEventListener('click', () => {
  const open = nav.classList.toggle('nav--open');
  hamburger.setAttribute('aria-expanded', open);
  hamburger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
});

/* Close menu when a nav link is clicked */
navLinks.addEventListener('click', e => {
  if (e.target.matches('a')) {
    nav.classList.remove('nav--open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation menu');
  }
});

/* Close menu on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
    nav.classList.remove('nav--open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation menu');
    hamburger.focus();
  }
});

/* ─── Scroll reveal (IntersectionObserver) ───────────────────── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
} else {
  /* Reduced motion: show everything immediately, no JS transition */
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}

/* ─── FlakeHound terminal demo ─────────────────────────────────
   Tells the real pipeline story, step by step:
   1. context — CI just finished a test run, JUnit XML is on disk
   2. the flakehound command is typed character by character
   3. spinner: reading the JUnit XML history
   4. confirmed ingest summary
   5. spinner: scoring / isolating / clustering
   6. the report prints line by line, pausing between verdict groups
   Reduced motion → the finished output renders instantly.        */

const TERM_SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/* Step types:
   comment — dim line printed instantly (context, not typed)
   cmd     — typed character by character after a "$ " prompt
   spin    — transient spinner line; disappears when the step ends
   line    — printed line (pause = extra ms before it appears)     */
const TERM_SCRIPT = [
  { type: 'comment', text: '# CI test run just finished — the runner saved its results as JUnit XML' },
  { type: 'cmd',     text: 'npx flakehound analyze --input "test-results/**/*.xml"' },
  { type: 'spin',    text: ' reading JUnit XML run history…', frames: 14 },
  { type: 'line',    text: '✓ ingested 4 XML files — a history of 12 runs of the test suite', cls: 't-green' },
  { type: 'line',    text: '' },
  { type: 'spin',    text: ' scoring flakiness · isolating regressions · clustering failures by root cause…', frames: 18 },
  { type: 'line',    text: 'Regressions (1) — broken code, not flaky', cls: 't-red' },
  { type: 'line',    text: '  ✗ shop.spec.ts > payment — failing in 100% of runs since commit bbb2222', cls: 't-red' },
  { type: 'line',    text: '      passed before that commit → this is a hard regression, someone broke it', cls: 't-dim' },
  { type: 'line',    text: '' },
  { type: 'line',    text: 'Flaky tests (1) — quarantine candidates', cls: 't-yellow', pause: 300 },
  { type: 'line',    text: '  ~ shop.spec.ts > checkout — passed AND failed on the same commit', cls: 't-yellow' },
  { type: 'line',    text: '      same code, different result → genuinely flaky, not a regression', cls: 't-dim' },
  { type: 'line',    text: '' },
  { type: 'line',    text: 'Failure clusters — 5 failures share just 2 root causes', cls: 't-cyan', pause: 300 },
  { type: 'line',    text: '  1. [7a7c1180] ×3  AssertionError: cart total ≠ charged amount' },
  { type: 'line',    text: '  2. [a8a64e2d] ×2  TimeoutError: waiting for locator(\'#pay-button\')' },
  { type: 'line',    text: '      → fix 2 bugs, not 5 failures', cls: 't-dim' },
  { type: 'line',    text: '' },
  { type: 'line',    text: 'CI gate: 1 NEW regression → exit 1 (build fails once, when the bug lands)', cls: 't-red', pause: 380 },
  { type: 'line',    text: '         known regressions & flaky tests never re-fail the build', cls: 't-dim' }
];

const CARET = '<span class="t-caret"></span>';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function termStepHtml(step) {
  const safe = escapeHtml(step.text);
  if (step.type === 'comment') return `<span class="t-dim">${safe}</span>`;
  if (step.type === 'cmd')     return `<span class="t-green">$</span> <span class="t-cyan">${safe}</span>`;
  return step.cls ? `<span class="${step.cls}">${safe}</span>` : safe;
}

function renderTerminalInstant(code) {
  code.innerHTML = TERM_SCRIPT
    .filter(s => s.type !== 'spin')
    .map(termStepHtml)
    .join('\n');
}

function runTerminal(code, onDone) {
  let cancelled = false;
  let doneHtml = '';

  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function step(i) {
    if (cancelled) return;
    if (i >= TERM_SCRIPT.length) {
      code.innerHTML = doneHtml;   /* drop the caret */
      onDone();
      return;
    }
    const s = TERM_SCRIPT[i];

    if (s.type === 'comment') {
      doneHtml += termStepHtml(s) + '\n';
      code.innerHTML = doneHtml + CARET;
      later(() => step(i + 1), 500);

    } else if (s.type === 'cmd') {
      typeCmd(0);
      function typeCmd(c) {
        if (cancelled) return;
        const typed = escapeHtml(s.text.slice(0, c));
        code.innerHTML = doneHtml +
          `<span class="t-green">$</span> <span class="t-cyan">${typed}</span>${CARET}`;
        if (c < s.text.length) {
          later(() => typeCmd(c + 1), 22 + Math.random() * 40);
        } else {
          doneHtml += termStepHtml(s) + '\n';
          later(() => step(i + 1), 340);
        }
      }

    } else if (s.type === 'spin') {
      spin(0);
      function spin(frame) {
        if (cancelled) return;
        const f = TERM_SPINNER_FRAMES[frame % TERM_SPINNER_FRAMES.length];
        code.innerHTML = doneHtml +
          `<span class="t-cyan">${f}</span><span class="t-dim">${escapeHtml(s.text)}</span>`;
        if (frame < s.frames) {
          later(() => spin(frame + 1), 75);
        } else {
          later(() => step(i + 1), 100);   /* spinner line vanishes */
        }
      }

    } else {  /* line */
      later(() => {
        if (cancelled) return;
        doneHtml += termStepHtml(s) + '\n';
        code.innerHTML = doneHtml + CARET;
        step(i + 1);
      }, (s.pause || 0) + (s.text === '' ? 40 : 95));
    }
  }

  step(0);

  return () => { cancelled = true; timers.forEach(clearTimeout); };
}

const terminalOutput = document.getElementById('terminal-output');
const terminalReplay = document.getElementById('terminal-replay');

if (terminalOutput) {
  const code = terminalOutput.querySelector('code');

  if (prefersReducedMotion) {
    renderTerminalInstant(code);
  } else {
    let cancelRun = null;

    const start = () => {
      if (cancelRun) cancelRun();
      terminalReplay.hidden = true;
      cancelRun = runTerminal(code, () => { terminalReplay.hidden = false; });
    };

    const termObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          termObserver.unobserve(entry.target);
          start();
        }
      });
    }, { threshold: 0.35 });
    termObserver.observe(terminalOutput);

    terminalReplay.addEventListener('click', start);
  }
}

/* ─── Cursor-tracking glow on cards ──────────────────────────── */
if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  const glowCards = document.querySelectorAll('.project-card, .feature-card, .timeline__card');
  glowCards.forEach(card => {
    card.classList.add('glow-card');
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

/* ─── Back to top ────────────────────────────────────────────── */
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.hidden = window.scrollY < window.innerHeight;
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}

/* ─── Scrollspy — highlight the nav link for the visible section ── */
const spyTargets = ['about', 'flakehound', 'projects', 'why-me', 'contact']
  .map(id => document.getElementById(id))
  .filter(Boolean);

const spyLinks = new Map(
  [...document.querySelectorAll('.nav__link')].map(a => [a.getAttribute('href').slice(1), a])
);

const spyObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const link = spyLinks.get(entry.target.id);
    if (!link) return;
    if (entry.isIntersecting) {
      spyLinks.forEach(l => l.classList.remove('nav__link--active'));
      link.classList.add('nav__link--active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

spyTargets.forEach(s => spyObserver.observe(s));

/* ─── Smooth-scroll for anchor links (supports nav height offset) */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const navH  = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 64;
    const top   = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
});
