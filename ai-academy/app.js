/* AI Academy App — Beginner-friendly, gamified, no build required */

const APP_VERSION = "2025.08";
const STORAGE_KEY = "aiAcademyProgress.v1";
const CURRICULUM_PATH = "./data/curriculum.json";

/** -------------------------- State & Persistence -------------------------- */
function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultProgress();
  try {
    const parsed = JSON.parse(raw);
    return {
      ...createDefaultProgress(),
      ...parsed,
    };
  } catch {
    return createDefaultProgress();
  }
}

function createDefaultProgress() {
  return {
    username: "Learner",
    xp: 0,
    level: 1,
    completedLessonIds: [],
    quizResultsByLessonId: {}, // { [lessonId]: { scorePercent, dateISO } }
    badges: {}, // { badgeId: dateISO }
    streakDays: 0,
    lastActiveISO: null,
    moduleCompletions: {}, // { [moduleId]: dateISO }
  };
}

function saveProgress(progress) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10); // YYYY-MM-DD

  if (progress.lastActiveISO) {
    const lastKey = progress.lastActiveISO.slice(0, 10);
    if (lastKey !== todayKey) {
      const lastDate = new Date(progress.lastActiveISO);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      progress.streakDays = diffDays === 1 ? progress.streakDays + 1 : 1;
      if (progress.streakDays === 3) unlockBadge(progress, "streak3");
      if (progress.streakDays === 7) unlockBadge(progress, "streak7");
    }
  } else {
    progress.streakDays = 1;
  }

  progress.lastActiveISO = today.toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/** ------------------------------- Gamification ------------------------------ */
function addXp(progress, amount) {
  const previousLevel = progress.level;
  progress.xp += amount;
  progress.level = calculateLevel(progress.xp);
  if (progress.level > previousLevel) {
    showToast(`Level up! You reached Level ${progress.level} 🎉`);
  }
}

function calculateLevel(totalXp) {
  // Simple XP curve: Level n at ~ n^2 * 100 xp
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level++;
  return level;
}

function xpForLevel(lvl) {
  return (lvl - 1) * (lvl - 1) * 100;
}

function progressWithinLevel(totalXp, level) {
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  const within = Math.max(0, Math.min(end - start, totalXp - start));
  const percent = end === start ? 1 : within / (end - start);
  return { within, percent };
}

function unlockBadge(progress, badgeId) {
  if (progress.badges[badgeId]) return; // already unlocked
  progress.badges[badgeId] = new Date().toISOString();
  showToast(`Badge unlocked: ${badgeMeta[badgeId].icon} ${badgeMeta[badgeId].name}`);
}

const badgeMeta = {
  firstLesson: { id: "firstLesson", name: "First Steps", icon: "🪜", desc: "Complete your first lesson." },
  firstQuiz: { id: "firstQuiz", name: "Quiz Taker", icon: "📝", desc: "Complete your first quiz." },
  quiz80: { id: "quiz80", name: "Quiz Whiz", icon: "🧠", desc: "Score 80%+ on any quiz." },
  perfection: { id: "perfection", name: "Perfectionist", icon: "🏆", desc: "Score 100% on any quiz." },
  streak3: { id: "streak3", name: "On a Roll", icon: "🔥", desc: "Maintain a 3-day learning streak." },
  streak7: { id: "streak7", name: "Dedicated", icon: "💎", desc: "Maintain a 7-day learning streak." },
  moduleFinisher: { id: "moduleFinisher", name: "Explorer", icon: "🧭", desc: "Finish a full module." },
};

/** ------------------------------- DOM Helpers ------------------------------- */
function $(selector) { return document.querySelector(selector); }
function createElement(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

function showToast(message) {
  const container = $("#toast");
  const item = createElement(`
    <div class="max-w-md w-full px-4 py-3 mb-2 rounded-xl bg-slate-900 text-white shadow-lg border border-slate-800">
      <div class="text-sm">${message}</div>
    </div>
  `);
  container.appendChild(item);
  container.classList.remove("hidden");
  setTimeout(() => {
    item.classList.add("opacity-0", "transition", "duration-500");
    setTimeout(() => {
      item.remove();
      if (!container.children.length) container.classList.add("hidden");
    }, 500);
  }, 2200);
}

function setActiveNav(route) {
  document.querySelectorAll('#main-nav button').forEach(btn => {
    const isActive = btn.dataset.route === route;
    btn.classList.toggle('bg-slate-900/90', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('hover:bg-slate-100', !isActive);
  });
}

function updateHud(progress) {
  $("#hud-level").textContent = progress.level;
  $("#hud-xp").textContent = progress.xp;
  const { percent } = progressWithinLevel(progress.xp, progress.level);
  $("#hud-xp-bar").style.width = `${Math.round(percent * 100)}%`;
  $("#hud-streak").textContent = `${progress.streakDays} 🔥`;
}

/** --------------------------------- Router --------------------------------- */
const routes = {
  dashboard: renderDashboard,
  catalog: renderCatalog,
  achievements: renderAchievements,
  profile: renderProfile,
  lesson: renderLessonView, // special: expects state { moduleId, lessonId }
};

function navigate(route, state) {
  setActiveNav(route);
  currentRoute = { route, state };
  routes[route](state);
}

let currentRoute = { route: 'dashboard', state: null };
let appProgress = loadProgress();
let curriculum = null;

async function init() {
  document.getElementById("year").textContent = String(new Date().getFullYear());
  document.getElementById("app-version").textContent = APP_VERSION;

  document.querySelectorAll('#main-nav button').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });

  try {
    const res = await fetch(CURRICULUM_PATH);
    curriculum = await res.json();
  } catch (err) {
    console.error("Failed to load curriculum", err);
    $("#view").innerHTML = `<div class="p-6 rounded-xl bg-red-50 border border-red-200 text-red-800">Failed to load curriculum. Please reload.</div>`;
    return;
  }

  saveProgress(appProgress); // ensures streak and timestamps are set
  updateHud(appProgress);
  navigate('dashboard');
}

/** ------------------------------- Renderers -------------------------------- */
function renderDashboard() {
  const totalLessons = curriculum.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completed = appProgress.completedLessonIds.length;
  const completionPercent = Math.round((completed / Math.max(1, totalLessons)) * 100);

  $("#view").innerHTML = `
    <section class="grid md:grid-cols-3 gap-4">
      <div class="col-span-2 space-y-4">
        <div class="p-5 rounded-xl bg-white border border-slate-200">
          <h2 class="text-lg font-semibold mb-2">Welcome back, ${escapeHtml(appProgress.username)} 👋</h2>
          <p class="text-sm text-slate-600">Continue your beginner-friendly journey into AI. Earn XP by reading lessons and completing quizzes.</p>
          <div class="mt-4 flex flex-wrap gap-3">
            <button id="cta-continue" class="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">Continue learning</button>
            <button id="cta-catalog" class="px-4 py-2 rounded-lg bg-slate-100 font-medium hover:bg-slate-200 text-slate-800">Browse catalog</button>
          </div>
        </div>
        <div class="p-5 rounded-xl bg-white border border-slate-200">
          <h3 class="font-semibold mb-2">Your progress</h3>
          <div class="flex items-center gap-3">
            <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-2 bg-primary-500" style="width: ${completionPercent}%"></div>
            </div>
            <div class="text-sm text-slate-600">${completed}/${totalLessons} lessons (${completionPercent}%)</div>
          </div>
        </div>
        <div class="p-5 rounded-xl bg-white border border-slate-200">
          <h3 class="font-semibold mb-3">Daily challenge</h3>
          <p class="text-sm text-slate-600 mb-3">Spend 10 minutes exploring the "Prompting Basics" module. Try writing one prompt using the "role, task, constraints" structure.</p>
          <button id="go-prompting" class="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800">Open module</button>
        </div>
      </div>
      <aside class="space-y-4">
        <div class="p-5 rounded-xl bg-white border border-slate-200">
          <h3 class="font-semibold mb-3">Badges</h3>
          <div class="grid grid-cols-4 gap-2" id="badge-grid"></div>
        </div>
        <div class="p-5 rounded-xl bg-white border border-slate-200">
          <h3 class="font-semibold mb-2">Leaderboard</h3>
          <p class="text-sm text-slate-600 mb-3">Global leaderboard coming soon.</p>
          <div class="flex items-center justify-between text-sm">
            <div class="font-medium">${escapeHtml(appProgress.username)}</div>
            <div class="text-slate-600">${appProgress.xp} XP</div>
          </div>
        </div>
      </aside>
    </section>
  `;

  // badge grid
  const grid = document.getElementById("badge-grid");
  Object.values(badgeMeta).forEach(meta => {
    const unlocked = Boolean(appProgress.badges[meta.id]);
    const tile = createElement(`
      <div class="aspect-square rounded-lg border text-center grid place-content-center text-xl ${unlocked ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 text-slate-400'}">
        <div>${meta.icon}</div>
      </div>
    `);
    tile.title = `${meta.name} — ${meta.desc}`;
    grid.appendChild(tile);
  });

  document.getElementById("cta-catalog").addEventListener('click', () => navigate('catalog'));
  document.getElementById("cta-continue").addEventListener('click', () => goToNextUnfinishedLesson());
  document.getElementById("go-prompting").addEventListener('click', () => navigateToModuleId('prompting-basics'));
}

function renderCatalog() {
  $("#view").innerHTML = `
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Catalog</h2>
      </div>
      <div class="grid md:grid-cols-2 gap-4" id="module-grid"></div>
    </section>
  `;

  const grid = document.getElementById("module-grid");
  curriculum.modules.forEach(mod => {
    const total = mod.lessons.length;
    const done = mod.lessons.filter(l => appProgress.completedLessonIds.includes(l.id)).length;
    const percent = Math.round((done / Math.max(1, total)) * 100);
    const card = createElement(`
      <article class="p-5 rounded-xl bg-white border border-slate-200 flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold">${mod.title}</h3>
            <p class="text-sm text-slate-600">${mod.subtitle}</p>
          </div>
          <span class="px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-600">${percent}%</span>
        </div>
        <div class="flex gap-2 flex-wrap">
          ${mod.tags.map(t => `<span class=\"px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs\">${t}</span>`).join("")}
        </div>
        <div class="flex items-center justify-between mt-2">
          <div class="text-sm text-slate-600">${total} lessons</div>
          <button class="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700" data-module="${mod.id}">Open</button>
        </div>
      </article>
    `);
    card.querySelector('button').addEventListener('click', () => navigate('lesson', { moduleId: mod.id, lessonId: mod.lessons[0].id }));
    grid.appendChild(card);
  });
}

function renderLessonView(state) {
  const { moduleId, lessonId } = state;
  const mod = curriculum.modules.find(m => m.id === moduleId) || curriculum.modules[0];
  const idx = mod.lessons.findIndex(l => l.id === lessonId);
  const lesson = mod.lessons[idx >= 0 ? idx : 0];

  const sidebar = mod.lessons.map((l, i) => `
    <button class="w-full text-left px-3 py-2 rounded-lg ${l.id === lesson.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}" data-lesson="${l.id}">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">${l.title}</span>
        ${appProgress.completedLessonIds.includes(l.id) ? '<span class="text-xs">✅</span>' : ''}
      </div>
      <div class="text-xs ${l.id === lesson.id ? 'text-slate-300' : 'text-slate-500'}">${l.duration}</div>
    </button>
  `).join("");

  $("#view").innerHTML = `
    <section class="grid md:grid-cols-[260px,1fr] gap-4">
      <aside class="p-3 rounded-xl bg-white border border-slate-200 h-fit sticky top-20">
        <h3 class="font-semibold mb-2">${mod.title}</h3>
        <div class="flex flex-col gap-1" id="lesson-list">${sidebar}</div>
      </aside>
      <article class="p-5 rounded-xl bg-white border border-slate-200">
        <div class="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 class="text-lg font-semibold">${lesson.title}</h2>
            <p class="text-sm text-slate-600">${lesson.duration} • Beginner</p>
          </div>
          <button id="back-to-catalog" class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium hover:bg-slate-200">All modules</button>
        </div>
        <div class="prose prose-slate max-w-none">${lesson.contentHtml}</div>
        <div class="mt-5 flex flex-wrap gap-3">
          <button id="mark-done" class="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700">Mark as read (+50 XP)</button>
          ${lesson.quiz ? '<button id="take-quiz" class="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">Take quiz</button>' : ''}
        </div>
      </article>
    </section>
  `;

  // events
  document.getElementById('back-to-catalog').addEventListener('click', () => navigate('catalog'));
  document.getElementById('lesson-list').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => navigate('lesson', { moduleId: mod.id, lessonId: btn.dataset.lesson }));
  });

  document.getElementById('mark-done').addEventListener('click', () => {
    if (!appProgress.completedLessonIds.includes(lesson.id)) {
      appProgress.completedLessonIds.push(lesson.id);
      addXp(appProgress, 50);
      unlockBadge(appProgress, 'firstLesson');
      checkModuleCompletion(mod);
      saveProgress(appProgress);
      updateHud(appProgress);
      showToast('Lesson completed! +50 XP');
      navigate('lesson', { moduleId: mod.id, lessonId: lesson.id });
    } else {
      showToast('Already completed.');
    }
  });

  if (lesson.quiz) {
    document.getElementById('take-quiz').addEventListener('click', () => openQuiz(mod, lesson));
  }
}

function checkModuleCompletion(module) {
  const allDone = module.lessons.every(l => appProgress.completedLessonIds.includes(l.id));
  if (allDone && !appProgress.moduleCompletions[module.id]) {
    appProgress.moduleCompletions[module.id] = new Date().toISOString();
    unlockBadge(appProgress, 'moduleFinisher');
    addXp(appProgress, 150);
    showToast(`Module completed: ${module.title} +150 XP`);
  }
}

function openQuiz(module, lesson) {
  const container = createElement(`
    <div class="fixed inset-0 z-50 grid place-items-center p-4">
      <div class="absolute inset-0 bg-slate-900/60"></div>
      <div class="relative w-full max-w-2xl p-5 rounded-xl bg-white border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">Quiz: ${lesson.title}</h3>
          <button id="quiz-close" class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-sm hover:bg-slate-200">Close</button>
        </div>
        <form id="quiz-form" class="space-y-4 max-h-[60vh] overflow-auto pr-1">
          ${lesson.quiz.questions.map((q, qi) => `
            <fieldset class="p-3 rounded-lg border border-slate-200">
              <legend class="font-medium">Q${qi + 1}. ${q.text}</legend>
              <div class="mt-2 space-y-2">
                ${q.options.map((opt, oi) => `
                  <label class="flex items-start gap-2 text-sm">
                    <input type="radio" name="q${qi}" value="${oi}" class="mt-1" required />
                    <span>${opt.label}</span>
                  </label>
                `).join("")}
              </div>
            </fieldset>
          `).join("")}
          <div class="pt-2">
            <button class="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">Submit</button>
          </div>
        </form>
      </div>
    </div>
  `);

  document.body.appendChild(container);
  container.querySelector('#quiz-close').addEventListener('click', () => container.remove());
  container.querySelector('#quiz-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    let correct = 0;
    lesson.quiz.questions.forEach((q, qi) => {
      const selected = new FormData(form).get(`q${qi}`);
      const selectedIndex = Number(selected);
      if (q.options[selectedIndex]?.isCorrect) correct++;
    });
    const percent = Math.round((correct / lesson.quiz.questions.length) * 100);
    appProgress.quizResultsByLessonId[lesson.id] = { scorePercent: percent, dateISO: new Date().toISOString() };
    unlockBadge(appProgress, 'firstQuiz');
    if (percent >= 80) unlockBadge(appProgress, 'quiz80');
    if (percent === 100) unlockBadge(appProgress, 'perfection');
    const xpEarned = Math.round(percent / 10) * 10; // 0-100 -> 0-100 XP
    addXp(appProgress, xpEarned);
    saveProgress(appProgress);
    updateHud(appProgress);
    showToast(`Quiz scored ${percent}% +${xpEarned} XP`);
    container.remove();
    navigate('lesson', { moduleId: module.id, lessonId: lesson.id });
  });
}

function renderAchievements() {
  const unlockedIds = new Set(Object.keys(appProgress.badges));
  $("#view").innerHTML = `
    <section class="space-y-4">
      <h2 class="text-xl font-semibold">Achievements</h2>
      <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        ${Object.values(badgeMeta).map(meta => `
          <div class="p-4 rounded-xl border ${unlockedIds.has(meta.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}">
            <div class="text-2xl">${meta.icon}</div>
            <div class="font-semibold mt-1">${meta.name}</div>
            <div class="text-sm text-slate-600">${meta.desc}</div>
            ${unlockedIds.has(meta.id) ? `<div class=\"text-xs mt-1 text-emerald-700\">Unlocked ${new Date(appProgress.badges[meta.id]).toLocaleDateString()}</div>` : `<div class=\"text-xs mt-1 text-slate-500\">Locked</div>`}
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderProfile() {
  $("#view").innerHTML = `
    <section class="space-y-4">
      <h2 class="text-xl font-semibold">Profile</h2>
      <div class="p-5 rounded-xl bg-white border border-slate-200 space-y-4 max-w-xl">
        <div>
          <label class="block text-sm font-medium mb-1">Display name</label>
          <input id="name-input" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value="${escapeHtml(appProgress.username)}" />
        </div>
        <div class="flex items-center gap-3">
          <button id="save-profile" class="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800">Save</button>
          <button id="reset-progress" class="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700">Reset progress</button>
        </div>
      </div>
    </section>
  `;

  document.getElementById('save-profile').addEventListener('click', () => {
    const input = document.getElementById('name-input');
    appProgress.username = input.value.trim() || 'Learner';
    saveProgress(appProgress);
    showToast('Profile saved');
    navigate('dashboard');
  });

  document.getElementById('reset-progress').addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      appProgress = createDefaultProgress();
      saveProgress(appProgress);
      updateHud(appProgress);
      showToast('Progress reset');
      navigate('dashboard');
    }
  });
}

/** ------------------------------ Navigation ------------------------------- */
function goToNextUnfinishedLesson() {
  for (const mod of curriculum.modules) {
    for (const l of mod.lessons) {
      if (!appProgress.completedLessonIds.includes(l.id)) {
        navigate('lesson', { moduleId: mod.id, lessonId: l.id });
        return;
      }
    }
  }
  navigate('catalog');
}

function navigateToModuleId(moduleId) {
  const mod = curriculum.modules.find(m => m.id === moduleId) || curriculum.modules[0];
  navigate('lesson', { moduleId: mod.id, lessonId: mod.lessons[0].id });
}

/** ------------------------------- Utilities -------------------------------- */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Start
window.addEventListener('DOMContentLoaded', init);