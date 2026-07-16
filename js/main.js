/* ─── Nav: glass effect on scroll ──────────────────────────── */
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

const scrollProgress = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  if (scrollProgress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  }
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

/* Section titles join the reveal system and get an animated underline */
document.querySelectorAll('.section__title').forEach(t => t.classList.add('reveal', 'reveal--title'));

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
   1. context - CI just finished a test run, JUnit XML is on disk
   2. the flakehound command is typed character by character
   3. spinner: reading the JUnit XML history
   4. confirmed ingest summary
   5. spinner: scoring / isolating / clustering
   6. the report prints line by line, pausing between verdict groups
   Reduced motion → the finished output renders instantly.        */

const TERM_SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const TERM_SCRIPTS = {
  analyze: [
    { type: 'comment', text: '# CI test run just finished - the runner saved its results as JUnit XML' },
    { type: 'cmd',     text: 'npx flakehound analyze --input "test-results/**/*.xml"' },
    { type: 'spin',    text: ' reading JUnit XML run history…', frames: 14 },
    { type: 'line',    text: '✓ ingested 4 XML files - a history of 12 runs of the test suite', cls: 't-green' },
    { type: 'line',    text: '' },
    { type: 'spin',    text: ' scoring flakiness · isolating regressions · clustering failures by root cause…', frames: 18 },
    { type: 'line',    text: 'Regressions (1) - broken code, not flaky', cls: 't-red' },
    { type: 'line',    text: '  ✗ shop.spec.ts > payment - failing in 100% of runs since commit bbb2222', cls: 't-red' },
    { type: 'line',    text: '      passed before that commit → this is a hard regression, someone broke it', cls: 't-dim' },
    { type: 'line',    text: '' },
    { type: 'line',    text: 'Flaky tests (1) - quarantine candidates', cls: 't-yellow', pause: 300 },
    { type: 'line',    text: '  ~ shop.spec.ts > checkout - passed AND failed on the same commit', cls: 't-yellow' },
    { type: 'line',    text: '      same code, different result → genuinely flaky, not a regression', cls: 't-dim' },
    { type: 'line',    text: '' },
    { type: 'line',    text: 'Failure clusters - 5 failures share just 2 root causes', cls: 't-cyan', pause: 300 },
    { type: 'line',    text: '  1. [7a7c1180] ×3  AssertionError: cart total ≠ charged amount' },
    { type: 'line',    text: '  2. [a8a64e2d] ×2  TimeoutError: waiting for locator(\'#pay-button\')' },
    { type: 'line',    text: '      → fix 2 bugs, not 5 failures', cls: 't-dim' },
    { type: 'line',    text: '' },
    { type: 'line',    text: 'CI gate: 1 NEW regression → exit 1 (build fails once, when the bug lands)', cls: 't-red', pause: 380 },
    { type: 'line',    text: '         known regressions & flaky tests never re-fail the build', cls: 't-dim' }
  ],
  quarantine: [
    { type: 'comment', text: '# Programmatically isolate flaky tests by auto-editing test specs via ts-morph' },
    { type: 'cmd',     text: 'npx flakehound quarantine --consecutive-runs 5 --issue-labels "quarantined"' },
    { type: 'spin',    text: ' checking flakiness signals and current active quarantines…', frames: 12 },
    { type: 'line',    text: '✓ identified 1 flaky test candidate: shop.spec.ts > checkout', cls: 't-yellow' },
    { type: 'spin',    text: ' editing test file AST to add quarantine tags…', frames: 15 },
    { type: 'line',    text: '✓ AST updated: wrapped shop.spec.ts > checkout in a skip tag if quarantined', cls: 't-green' },
    { type: 'spin',    text: ' filing tracking issue in github repository…', frames: 14 },
    { type: 'line',    text: '✓ GitHub Issue #432 opened: "Quarantined: shop.spec.ts > checkout"', cls: 't-cyan' },
    { type: 'line',    text: '  → progress: 0/5 clean runs towards auto-release', cls: 't-dim' },
    { type: 'line',    text: '' },
    { type: 'line',    text: 'Summary: 1 test quarantined. AST edits written. Ready to commit.', cls: 't-green' }
  ],
  gate: [
    { type: 'comment', text: '# Verify test runs in CI; fail ONLY on new regressions, bypass known flakes' },
    { type: 'cmd',     text: 'npx flakehound gate --baseline "flakehound/baseline.json"' },
    { type: 'spin',    text: ' comparing current failures against baseline.json…', frames: 15 },
    { type: 'line',    text: 'Current failures: 5' },
    { type: 'line',    text: '  • AssertionError: cart total ≠ charged amount (Known bug [7a7c1180] - ignored)', cls: 't-dim' },
    { type: 'line',    text: '  • TimeoutError: waiting for locator(\'#pay-button\') (Known bug [a8a64e2d] - ignored)', cls: 't-dim' },
    { type: 'line',    text: '  • AssertionError: expect(title).toBe("Shop") (New Regression! - FAIL)', cls: 't-red' },
    { type: 'line',    text: '' },
    { type: 'line',    text: 'Verdict: 1 NEW regression detected.', cls: 't-red' },
    { type: 'line',    text: '  → Exit code 1 (failing build due to new regression)', cls: 't-red', pause: 200 }
  ]
};

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

function renderTerminalInstant(code, cmdKey = 'analyze') {
  const script = TERM_SCRIPTS[cmdKey] || TERM_SCRIPTS.analyze;
  code.innerHTML = script
    .filter(s => s.type !== 'spin')
    .map(termStepHtml)
    .join('\n');
}

function runTerminal(code, cmdKey = 'analyze', onDone) {
  let cancelled = false;
  let doneHtml = '';

  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const script = TERM_SCRIPTS[cmdKey] || TERM_SCRIPTS.analyze;

  function step(i) {
    if (cancelled) return;
    if (i >= script.length) {
      code.innerHTML = doneHtml;   /* drop the caret */
      onDone();
      return;
    }
    const s = script[i];

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
          later(() => typeCmd(c + 1), 20 + Math.random() * 30);
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
const termCmdButtons = document.querySelectorAll('.term-btn');

if (terminalOutput) {
  const code = terminalOutput.querySelector('code');
  let currentCmd = 'analyze';

  if (prefersReducedMotion) {
    renderTerminalInstant(code, currentCmd);
  } else {
    let cancelRun = null;

    const start = (cmdKey = 'analyze') => {
      if (cancelRun) cancelRun();
      terminalReplay.hidden = true;
      cancelRun = runTerminal(code, cmdKey, () => { terminalReplay.hidden = false; });
    };

    const termObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          termObserver.unobserve(entry.target);
          start(currentCmd);
        }
      });
    }, { threshold: 0.35 });
    termObserver.observe(terminalOutput);

    terminalReplay.addEventListener('click', () => start(currentCmd));

    if (termCmdButtons.length > 0) {
      termCmdButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.classList.contains('term-btn--active')) return;
          termCmdButtons.forEach(b => b.classList.remove('term-btn--active'));
          btn.classList.add('term-btn--active');
          currentCmd = btn.dataset.cmd;
          start(currentCmd);
        });
      });
    }
  }
}

/* ─── FlakeHound cluster chart ─────────────────────────────────
   "23 failures → 4 bugs" - bars grow and the numbers count up the
   first time the chart scrolls into view. Reduced motion → the
   finished state renders instantly, no growth or counting.        */
function countUp(el, to, ms) {
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / ms, 1);
    const eased = 1 - Math.pow(1 - p, 3);          /* easeOutCubic */
    el.textContent = Math.round(eased * to);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = to;
  })(start);
}

const clusterChart = document.querySelector('[data-cluster-chart]');
if (clusterChart) {
  const nums = clusterChart.querySelectorAll('[data-count-to]');

  const settle = () => {
    clusterChart.classList.add('cluster-chart--in');
    nums.forEach(n => { n.textContent = n.dataset.countTo; });
  };

  if (prefersReducedMotion) {
    settle();
  } else {
    const chartObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        chartObserver.unobserve(entry.target);
        clusterChart.classList.add('cluster-chart--in');   /* CSS grows the bars */
        nums.forEach(n => countUp(n, Number(n.dataset.countTo), 1100));
      });
    }, { threshold: 0.35 });
    chartObserver.observe(clusterChart);
  }
}

/* ─── FlakeHound AI hypothesis demo ────────────────────────────
   A cluster's stack trace is "analyzed" by the AI layer: a spinner
   runs, then a one-line root-cause hypothesis types out. Reduced
   motion → the finished hypothesis renders instantly.              */
const AI_HYP_PLAIN =
  'Likely a race condition — #pay-button is enabled only after the async cart ' +
  'total resolves, so the click can land before the button is interactive. ' +
  'Wait on the enabled state.';
const AI_HYP_HTML =
  'Likely a <strong>race condition</strong> — #pay-button is enabled only after ' +
  'the async cart total resolves, so the click can land before the button is ' +
  'interactive. Wait on the enabled state.';
const AI_CURSOR = '<span class="ai-demo__cursor"></span>';
const AI_ANALYZING = ' analyzing 7 failures in this cluster…';

const aiDemo = document.querySelector('[data-ai-demo]');
if (aiDemo) {
  const status  = aiDemo.querySelector('[data-ai-status]');
  const card    = aiDemo.querySelector('[data-ai-card]');
  const text    = aiDemo.querySelector('[data-ai-text]');
  const replay  = aiDemo.querySelector('[data-ai-replay]');

  const settleAi = () => {
    status.className = 'ai-demo__status ai-demo__status--done';
    status.textContent = '✓ hypothesis ready — a hint, not a verdict';
    card.hidden = false;
    text.innerHTML = AI_HYP_HTML;
  };

  function runAiDemo(onDone) {
    let cancelled = false;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    /* reset */
    status.className = 'ai-demo__status';
    status.innerHTML = '';
    card.hidden = true;
    card.classList.remove('ai-demo__card--in');
    text.innerHTML = '';

    let frame = 0;
    const SPIN_TOTAL = 22;
    (function spin() {
      if (cancelled) return;
      const f = TERM_SPINNER_FRAMES[frame % TERM_SPINNER_FRAMES.length];
      status.innerHTML = `<span class="ai-demo__spin">${f}</span>${AI_ANALYZING}`;
      if (frame++ < SPIN_TOTAL) later(spin, 70);
      else reveal();
    })();

    function reveal() {
      if (cancelled) return;
      status.className = 'ai-demo__status ai-demo__status--done';
      status.textContent = '✓ hypothesis ready — a hint, not a verdict';
      card.hidden = false;
      card.classList.add('ai-demo__card--in');
      later(type, 320);
    }

    function type() {
      let i = 0;
      (function tick() {
        if (cancelled) return;
        text.innerHTML = escapeHtml(AI_HYP_PLAIN.slice(0, i)) + AI_CURSOR;
        if (i++ < AI_HYP_PLAIN.length) later(tick, 16 + Math.random() * 26);
        else { text.innerHTML = AI_HYP_HTML; onDone(); }
      })();
    }

    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }

  if (prefersReducedMotion) {
    settleAi();
  } else {
    let cancelAi = null;
    const startAi = () => {
      if (cancelAi) cancelAi();
      replay.hidden = true;
      cancelAi = runAiDemo(() => { replay.hidden = false; });
    };

    const aiObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        aiObserver.unobserve(entry.target);
        startAi();
      });
    }, { threshold: 0.4 });
    aiObserver.observe(aiDemo);

    replay.addEventListener('click', startAi);
  }
}

/* ─── Skill inspector ─────────────────────────────────────────
   Click a skill chip → a terminal-style panel "runs"
   > inspect('Skill') and prints WHY it's good + PROOF I've used it. */

const SKILL_INFO = {
  'TypeScript':          { why: 'types catch whole bug classes at compile time - refactoring with confidence, APIs that document themselves', proof: 'FlakeHound is strict-mode TS end to end · daily language at Kissterra' },
  'Playwright':          { why: 'auto-waiting assertions retry until the UI settles - flakiness engineered away, one API for 3 browser engines', proof: '234 tests in NexusQA · E2E suites at Kissterra · even this site was screenshot-verified with it' },
  'Node.js':             { why: 'one language across tests, tooling, and servers - no context switching, massive ecosystem', proof: 'FlakeHound CLI ships on Node 20+ · NexusQA and Job Dashboard backends' },
  'React':               { why: 'declarative components make UI state predictable - and testable', proof: 'Job Dashboard frontend · EduCare on React 19' },
  'Next.js':             { why: 'SSR, API routes, and file routing - a full-stack app in one coherent framework', proof: 'EduCare runs on Next.js 15 with JWT auth and MongoDB' },
  'Claude AI':           { why: 'best-in-class reasoning over code and language, reliable structured output for real product features', proof: 'FlakeHound\'s hypothesis layer · NexusQA integration' },
  'Ollama':              { why: 'local models mean privacy, zero cost, and offline operation - the right default for sensitive data', proof: 'FlakeHound\'s first-choice AI provider; Claude API is the fallback' },
  'GitHub Actions':      { why: 'CI that lives next to the code - matrix builds, marketplace actions, zero infra to babysit', proof: 'FlakeHound is itself a Marketplace action · tag-driven npm releases with provenance' },
  'MongoDB':             { why: 'flexible documents fit evolving product data without migration pain', proof: 'EduCare\'s student cases, activities, and timetables via Mongoose' },
  'Python':              { why: 'the fastest path from idea to working script - and the pytest ecosystem is superb', proof: 'production-quality Python alongside TypeScript at Kissterra' },
  'Express':             { why: 'a minimal, explicit HTTP layer - you see exactly what every route does', proof: 'NexusQA\'s backend API' },
  'Vitest':              { why: 'fast, ESM-native unit testing with a Jest-compatible API - instant feedback loops', proof: '227 unit tests guarding FlakeHound\'s deterministic core' },
  'Jest':                { why: 'batteries-included testing - mocks, snapshots, and coverage out of the box', proof: 'EduCare\'s suite with React Testing Library' },
  'Allure':              { why: 'test reports stakeholders can actually read - history, trends, and failure triage', proof: 'NexusQA\'s reporting pipeline' },
  'Claude Code':         { why: 'an agent that edits, runs, and verifies inside your repo - not autocomplete, a colleague', proof: 'this entire site: planned, built, tested, and deployed with it - every change human-reviewed' },
  'Claude API':          { why: 'strong tool use and structured output - dependable enough to build product features on', proof: 'FlakeHound and NexusQA integrations' },
  'Prompt Engineering':  { why: 'prompts are specifications: full context, exact constraints, explicit do-nots, no invented facts', proof: 'reproducible AI behavior across all my AI-powered projects' },
  'Agentic Loops':       { why: 'generate → run → observe → refine - verification closes the loop, not vibes', proof: 'every UI change here was screenshot-verified at 3 viewport widths before shipping' },
  'Cursor':              { why: 'AI pair-programming in the editor - test authoring and refactors at conversation speed', proof: 'daily automation workflow at Kissterra' },
  'MCP':                 { why: 'a standard protocol wiring AI agents to real tools - git, browsers, databases', proof: 'MCP-Git for automated PR creation in my day job' },
  'Groq / Llama':        { why: 'near-instant open-model inference with a generous free tier - great for creative generation', proof: 'QuestForge\'s AI-generated quest scenes (~14,400 free requests/day)' },
  'LLM Integration':     { why: 'pluggable providers, graceful degradation, zero blind trust in model output', proof: 'FlakeHound\'s HypothesisProvider interface - Ollama or Claude behind one contract' },
  'AI-assisted Testing': { why: 'AI drafts, tests verify - speed without surrendering correctness', proof: 'how I work every day, at Kissterra and in the open' },
  'ts-morph':            { why: 'programmatic AST edits that preserve formatting - refactor code the way a careful human would, never with regex', proof: 'FlakeHound\'s quarantine tags tests via surgical ts-morph edits, reviewable in a PR' },
  'JUnit XML':           { why: 'the one test-result format every runner and CI already emits - integrate everything, write zero plugins', proof: 'FlakeHound\'s only input: Jest, Playwright, pytest, and JUnit all speak it' }
};

document.querySelectorAll('[data-inspect]').forEach(cloud => {
  const panelId = `skill-inspector-${cloud.dataset.inspect}`;

  /* Build the inspector panel right after the cloud */
  const panel = document.createElement('div');
  panel.className = 'skill-inspector';
  panel.id = panelId;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Skill details');
  panel.hidden = true;
  cloud.insertAdjacentElement('afterend', panel);

  let activeBtn = null;

  const close = () => {
    panel.hidden = true;
    if (activeBtn) {
      activeBtn.classList.remove('skill-tag--active');
      activeBtn.setAttribute('aria-expanded', 'false');
      activeBtn = null;
    }
  };

  /* Progressive enhancement: only chips with an entry become buttons */
  cloud.querySelectorAll('.skill-tag').forEach(li => {
    const name = li.textContent.trim();
    const info = SKILL_INFO[name];
    if (!info) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'skill-tag skill-tag--btn';
    btn.textContent = name;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', panelId);
    li.replaceChildren(btn);
    li.classList.remove('skill-tag');

    btn.addEventListener('click', () => {
      if (activeBtn === btn) { close(); return; }
      close();
      activeBtn = btn;
      btn.classList.add('skill-tag--active');
      btn.setAttribute('aria-expanded', 'true');
      panel.innerHTML =
        `<p class="si__cmd">&gt; inspect(<span class="si__name">'${name}'</span>)</p>` +
        `<p class="si__row"><span class="si__label si__label--why">why</span>${info.why}</p>` +
        `<p class="si__row"><span class="si__label si__label--proof">proof</span>${info.proof}</p>`;
      panel.hidden = false;
      /* restart the entrance animation */
      panel.classList.remove('skill-inspector--in');
      void panel.offsetWidth;
      panel.classList.add('skill-inspector--in');
    });
  });

  /* Escape closes the panel */
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  cloud.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
});

/* ─── Whole-card click-through (project cards) ───────────────
   Tapping anywhere on a card opens its primary destination.
   Inner links/buttons keep their own behavior.                  */
document.querySelectorAll('[data-href]').forEach(card => {
  card.addEventListener('click', e => {
    /* real links, buttons, and the architecture panel keep their own behavior */
    if (e.target.closest('a, button, .project-card__arch')) return;
    window.open(card.dataset.href, '_blank', 'noopener');
  });
});

/* ─── Architecture diagram toggles ───────────────────────────
   Accordion: opening one closes the others, and while any panel
   is open the grid top-aligns so the sibling card in the same
   row keeps its natural height instead of stretching.          */
const archToggles = [...document.querySelectorAll('.arch-toggle')];
const projectsGrid = document.querySelector('.projects__grid');

function setArchOpen(btn, open) {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  panel.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
  btn.textContent = open ? 'Architecture ⌃' : 'Architecture ⌄';
  if (open) {
    panel.classList.remove('project-card__arch--in');
    void panel.offsetWidth;
    panel.classList.add('project-card__arch--in');
  }
}

archToggles.forEach(btn => {
  btn.addEventListener('click', () => {
    const opening = document.getElementById(btn.getAttribute('aria-controls')).hidden;
    archToggles.forEach(other => { if (other !== btn) setArchOpen(other, false); });
    setArchOpen(btn, opening);
    if (projectsGrid) {
      projectsGrid.classList.toggle('projects__grid--arch-open', opening);
    }
  });
});

/* ─── Cursor-tracking glow + subtle 3D tilt on cards ─────────── */
if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  const glowCards = document.querySelectorAll('.project-card, .feature-card, .timeline__card');
  glowCards.forEach(card => {
    card.classList.add('glow-card');
    const tilts = card.classList.contains('project-card');
    if (tilts) card.classList.add('tilt');

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      if (tilts) {
        const rx = ((y / rect.height) - 0.5) * -3;   /* max ±1.5deg each way */
        const ry = ((x / rect.width)  - 0.5) *  3;
        card.style.transform =
          `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
      }
    });

    if (tilts) {
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    }
  });
}

/* ─── Copy email to clipboard ────────────────────────────────── */
const copyEmailBtn = document.getElementById('copy-email');
if (copyEmailBtn) {
  if (!navigator.clipboard) {
    copyEmailBtn.hidden = true;   /* no clipboard API - the mailto CTA remains */
  } else {
    copyEmailBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('mayageva11@gmail.com');
        copyEmailBtn.textContent = 'Copied ✓';
        copyEmailBtn.classList.add('contact__copy--done');
        setTimeout(() => {
          copyEmailBtn.textContent = 'Copy';
          copyEmailBtn.classList.remove('contact__copy--done');
        }, 2000);
      } catch {
        /* clipboard permission denied - leave the button as-is */
      }
    });
  }
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

/* ─── Scrollspy - highlight the nav link for the visible section ── */
const spyTargets = ['about', 'flakehound', 'projects', 'ai', 'why-me', 'contact']
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

/* ─── Projects Filter ────────────────────────────────────────── */
const filterButtons = document.querySelectorAll('.projects__filter-btn');
const projectCards  = document.querySelectorAll('.project-card');

if (filterButtons.length > 0 && projectCards.length > 0) {
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Toggle active classes
      filterButtons.forEach(b => b.classList.remove('projects__filter-btn--active'));
      btn.classList.add('projects__filter-btn--active');

      projectCards.forEach(card => {
        // Close any open architectures to keep things clean
        const archToggle = card.querySelector('.arch-toggle');
        const archPanel = card.querySelector('.project-card__arch');
        if (archToggle && archToggle.getAttribute('aria-expanded') === 'true') {
          archToggle.setAttribute('aria-expanded', 'false');
          archToggle.textContent = 'Architecture ⌄';
          if (archPanel) archPanel.hidden = true;
        }

        const tagsStr = card.dataset.tags || '';
        const tags = tagsStr.split(' ');
        
        if (filter === 'all' || tags.includes(filter)) {
          card.classList.remove('project-card--hidden');
          card.classList.remove('project-card--visible');
          // Force layout reflow to restart animation
          void card.offsetWidth;
          card.classList.add('project-card--visible');
        } else {
          card.classList.add('project-card--hidden');
          card.classList.remove('project-card--visible');
        }
      });

      // Reset grid architecture state to closed since we closed them all
      const grid = document.querySelector('.projects__grid');
      if (grid) {
        grid.classList.remove('projects__grid--arch-open');
      }
    });
  });
}

/* ─── Sandbox Dashboard Logic ────────────────────────────────── */
(function() {
  const switchBtns = document.querySelectorAll('.sandbox-switch-btn');
  const panels     = document.querySelectorAll('.sandbox-panel');
  const browserUrl = document.getElementById('browser-url');
  const demoCaption = document.getElementById('demo-caption');

  if (switchBtns.length === 0) return;

  // 1. Switcher between Image Screenshot and Interactive Sandbox
  switchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;

      // Toggle switch button active class
      switchBtns.forEach(b => {
        b.classList.remove('sandbox-switch-btn--active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('sandbox-switch-btn--active');
      btn.setAttribute('aria-selected', 'true');

      // Toggle panel visibility
      panels.forEach(p => {
        if (p.id === `panel-${mode}`) {
          p.removeAttribute('hidden');
        } else {
          p.setAttribute('hidden', '');
        }
      });

      // Update URL and caption contextual information
      if (mode === 'sandbox') {
        if (browserUrl) browserUrl.textContent = 'mayageva11.github.io/flakehound/sandbox';
        if (demoCaption) demoCaption.innerHTML = '🕹️ Simulated interactive dashboard — click options on the left to test!';
      } else {
        if (browserUrl) browserUrl.textContent = 'mayageva11.github.io/flakehound';
        if (demoCaption) demoCaption.innerHTML = 'One self-contained HTML file - click to open the live dashboard ↗';
      }
    });
  });

  // 2. Sandbox Sidebar View Switching
  const navBtns = document.querySelectorAll('.sandbox-nav-btn');
  const views   = document.querySelectorAll('.sandbox-view');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view;

      navBtns.forEach(b => b.classList.remove('sandbox-nav-btn--active'));
      btn.classList.add('sandbox-nav-btn--active');

      views.forEach(v => {
        if (v.id === `view-${viewId}`) {
          v.removeAttribute('hidden');
        } else {
          v.setAttribute('hidden', '');
        }
      });
    });
  });

  // 3. Accordion expanding logic
  const accTriggers = document.querySelectorAll('.s-acc-trigger');
  accTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.closest('.s-acc-item');
      const contentId = trigger.getAttribute('aria-controls');
      const content = document.getElementById(contentId);
      const isOpen = parent.classList.contains('s-acc-item--open');

      // Close all other accordion items for clean accordion behavior
      document.querySelectorAll('.s-acc-item').forEach(item => {
        item.classList.remove('s-acc-item--open');
        const trig = item.querySelector('.s-acc-trigger');
        if (trig) {
          trig.setAttribute('aria-expanded', 'false');
          const panel = document.getElementById(trig.getAttribute('aria-controls'));
          if (panel) panel.setAttribute('hidden', '');
        }
      });

      // Toggle this item
      if (!isOpen) {
        parent.classList.add('s-acc-item--open');
        trigger.setAttribute('aria-expanded', 'true');
        if (content) content.removeAttribute('hidden');
      }
    });
  });

  // 4. AI Hypothesis Generator Logic
  const aiHypotheses = {
    price: "Likely a rounding bug or coupon application mismatch. The checkout cart payload computed the sum correctly, but the charge request did not apply the 10% discount state. Verify coupon handler.",
    payment: "Playwright click command fired before locator('#pay-button') became interactive. Payment processing loader was rendering and overlaying the button. Add an explicit wait for button enablement.",
    network: "Gateway 502 returned from POST /api/checkout. Occurs during high matrix test concurrency due to connection pool starvation in mock DB. Mitigate by limiting parallel worker pool in playwright.config.",
    receipt: "Receipt page layout shift hides the receipt-total. The verification assertion triggered before the receipt rendering animation finished. Add a waitForSelector or assert on transitionend."
  };

  const aiGenButtons = document.querySelectorAll('.s-ai-gen-btn');
  aiGenButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cluster = btn.dataset.cluster;
      const box = btn.closest('.s-ai-box');
      const result = box.querySelector('.s-ai-result');
      const spinner = box.querySelector('.s-ai-spinner');
      const textEl = box.querySelector('.s-ai-text');

      btn.disabled = true;
      btn.textContent = 'Generating...';
      result.removeAttribute('hidden');
      spinner.removeAttribute('hidden');
      textEl.textContent = '';

      // Simulate API lag
      setTimeout(() => {
        spinner.setAttribute('hidden', '');
        const hypothesisText = aiHypotheses[cluster] || 'No hypothesis found.';
        
        // Typewriter animation
        let i = 0;
        btn.textContent = 'Hypothesis Ready';
        
        function tick() {
          textEl.textContent = hypothesisText.slice(0, i) + '█';
          if (i++ < hypothesisText.length) {
            setTimeout(tick, 10 + Math.random() * 15);
          } else {
            textEl.textContent = hypothesisText;
          }
        }
        tick();

      }, 1000);
    });
  });

  // 5. Quarantine Board Toggle Logic
  const qBtn = document.getElementById('btn-quarantine-checkout');
  if (qBtn) {
    let isQuar = false;
    qBtn.addEventListener('click', () => {
      const item = qBtn.closest('.sandbox-q-item');
      const badge = item.querySelector('.badge');
      const desc = item.querySelector('.sandbox-q-desc');

      qBtn.disabled = true;

      if (!isQuar) {
        qBtn.textContent = '📦 Writing AST...';
        setTimeout(() => {
          qBtn.textContent = '🚀 Opening GitHub Issue...';
          setTimeout(() => {
            qBtn.disabled = false;
            qBtn.textContent = 'Release from Quarantine';
            qBtn.className = 'btn btn--outline s-q-btn';
            
            badge.textContent = 'QUARANTINED';
            badge.className = 'badge badge--purple';
            desc.innerHTML = 'Test is quarantined in <code>shop.spec.ts</code>. GitHub Issue #432 opened. Progress: <strong>0/5 clean runs</strong> to auto-release.';
            isQuar = true;
          }, 600);
        }, 600);
      } else {
        qBtn.textContent = '📦 Rewriting AST...';
        setTimeout(() => {
          qBtn.disabled = false;
          qBtn.textContent = 'Quarantine Test';
          qBtn.className = 'btn btn--primary s-q-btn';
          
          badge.textContent = 'FLAKY';
          badge.className = 'badge badge--yellow';
          desc.textContent = 'Passed and failed on identical commit hashes. Candidate for AST quarantine.';
          isQuar = false;
        }, 800);
      }
    });
  }

  // 6. Config Playground Logic
  const cfgAi = document.getElementById('cfg-ai');
  const cfgQuarantine = document.getElementById('cfg-quarantine');
  const cfgGate = document.getElementById('cfg-gate');
  const cfgThreshold = document.getElementById('cfg-threshold');
  const cfgThresholdVal = document.getElementById('cfg-threshold-val');
  const codeBlock = document.getElementById('config-code-block');

  function updateConfigCode() {
    if (!codeBlock) return;

    const aiVal = cfgAi ? cfgAi.checked : true;
    const quarVal = cfgQuarantine ? cfgQuarantine.checked : true;
    const gateVal = cfgGate ? cfgGate.checked : true;
    const threshVal = cfgThreshold ? Number(cfgThreshold.value).toFixed(2) : '0.80';

    if (cfgThresholdVal) cfgThresholdVal.textContent = threshVal;

    const code = `import { defineConfig } from 'flakehound';

export default defineConfig({
  input: 'test-results/**/*.xml',
  similarityThreshold: ${threshVal},
  ai: {
    enabled: ${aiVal},
    provider: 'ollama', // fallback: 'claude'
  },
  quarantine: {
    enabled: ${quarVal},
    consecutiveRunsToRelease: 5,
  },
  gate: {
    failOn: '${gateVal ? 'new-regressions' : 'any-failures'}',
  }
});`;

    codeBlock.textContent = code;
  }

  // Bind change listeners to config playground controls
  [cfgAi, cfgQuarantine, cfgGate].forEach(el => {
    if (el) el.addEventListener('change', updateConfigCode);
  });
  if (cfgThreshold) {
    cfgThreshold.addEventListener('input', updateConfigCode);
  }

  // Initial render of config code
  updateConfigCode();
})();
