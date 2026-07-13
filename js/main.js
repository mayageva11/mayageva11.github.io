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
   A realistic CLI run in three acts:
   1. the command is typed character by character
   2. a braille spinner "analyzes" the run history
   3. the report prints line by line, pausing between verdict groups
   Reduced motion → the finished output renders instantly.        */

const TERM_COMMAND = 'npx flakehound analyze';

const TERM_SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const TERM_SPINNER_TEXT = ' analyzing 12 runs across 4 files…';

/* pause: extra delay (ms) before the line prints — breathing room between groups */
const TERM_REPORT = [
  { text: 'flakehound — 12 test runs across 4 files, 3 tests analyzed', cls: 't-dim' },
  { text: '' },
  { text: 'Regressions (1)', cls: 't-red', pause: 260 },
  { text: '  ✗ shop.spec.ts > payment — broken since bbb2222', cls: 't-red' },
  { text: '      failing in 100% of the last 3 run(s) since commit bbb2222; passed before it', cls: 't-dim' },
  { text: '' },
  { text: 'Flaky tests — quarantine candidates (1)', cls: 't-yellow', pause: 260 },
  { text: '  ~ shop.spec.ts > checkout — score 1.00 (medium confidence)', cls: 't-yellow' },
  { text: '      1 pass↔fail transition(s) on the same commit', cls: 't-dim' },
  { text: '' },
  { text: 'Failure clusters (2) — ranked by impact', cls: 't-cyan', pause: 260 },
  { text: '  1. [7a7c11808d52] 3 occurrence(s) across 1 test(s)' },
  { text: '      AssertionError: expected cart total to equal charged amount', cls: 't-dim' },
  { text: '  2. [a8a64e2d45ec] 2 occurrence(s) across 1 test(s)' },
  { text: '      TimeoutError: Timeout exceeded waiting for locator(\'#pay-button\')', cls: 't-dim' },
  { text: '' },
  { text: 'CI gate: 1 new, 0 known, 0 resolved regression(s)', cls: 't-red', pause: 380 },
  { text: '' },
  { text: '$ echo $?  →  1   # build fails once, when the bug lands', cls: 't-green', pause: 300 }
];

const CARET = '<span class="t-caret"></span>';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function termLineHtml({ text, cls }) {
  const safe = escapeHtml(text);
  return cls ? `<span class="${cls}">${safe}</span>` : safe;
}

function renderTerminalInstant(code) {
  const cmd = `<span class="t-green">$</span> <span class="t-cyan">${escapeHtml(TERM_COMMAND)}</span>\n`;
  code.innerHTML = cmd + TERM_REPORT.map(termLineHtml).join('\n');
}

function runTerminal(code, onDone) {
  let cancelled = false;
  let doneHtml = '';

  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  /* Act 1 — type the command with human-ish jitter */
  function typeCommand(i) {
    if (cancelled) return;
    const typed = escapeHtml(TERM_COMMAND.slice(0, i));
    code.innerHTML = `<span class="t-green">$</span> <span class="t-cyan">${typed}</span>${CARET}`;
    if (i < TERM_COMMAND.length) {
      later(() => typeCommand(i + 1), 26 + Math.random() * 44);
    } else {
      doneHtml = `<span class="t-green">$</span> <span class="t-cyan">${escapeHtml(TERM_COMMAND)}</span>\n`;
      later(spin.bind(null, 0), 320);
    }
  }

  /* Act 2 — spinner while "analyzing" */
  function spin(frame) {
    if (cancelled) return;
    const f = TERM_SPINNER_FRAMES[frame % TERM_SPINNER_FRAMES.length];
    code.innerHTML = doneHtml +
      `<span class="t-cyan">${f}</span><span class="t-dim">${escapeHtml(TERM_SPINNER_TEXT)}</span>`;
    if (frame < 16) {
      later(() => spin(frame + 1), 75);
    } else {
      later(() => printReport(0), 120);
    }
  }

  /* Act 3 — the report prints line by line */
  function printReport(i) {
    if (cancelled) return;
    if (i >= TERM_REPORT.length) {
      code.innerHTML = doneHtml;   /* drop the caret */
      onDone();
      return;
    }
    const line = TERM_REPORT[i];
    doneHtml += termLineHtml(line) + '\n';
    code.innerHTML = doneHtml + CARET;
    later(() => printReport(i + 1), (line.pause || 0) + (line.text === '' ? 40 : 85));
  }

  typeCommand(0);

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

/* ─── Scrollspy — highlight the nav link for the visible section ── */
const spyTargets = ['about', 'projects', 'contact']
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
