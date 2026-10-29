import { AnatomyViewer } from "./viewer.js";
import { SYSTEMS, LESSONS, QUIZ, organInfo } from "./content.js";
import {
  titleCase as title,
  escapeHTML as esc,
  searchConcepts,
  resolveConcept,
} from "./catalog.js";
const $ = (selector) => document.querySelector(selector);
const panel = $("#panel-content");
const systemMap = new Map(SYSTEMS.map((s) => [s.id, s]));
let viewer,
  catalog,
  mode = "explore",
  currentConcept = null,
  currentSystem = null,
  tour = null,
  tourStep = 0,
  quizIndex = 0,
  quizScore = 0,
  quizAnswer = null,
  toastTimer;
const eye =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
const eyeOff =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10 6a13 13 0 0 1 12 6s-1 1.7-3 3M6 6c-3 2-4 6-4 6s3.6 6 10 6c2 0 4-.7 5-1.4"/></svg>';
const art =
  '<div class="intro-art" aria-hidden="true"><svg viewBox="0 0 160 100"><path d="M70 20c-3-12 20-12 20 0s-3 14-10 14-10-3-10-14Zm4 15-15 7-9 25m36-32 15 7 9 25M65 42l-2 26 8 5-4 24m28-55 2 26-8 5 4 24M65 53h30M68 62h24M80 36v34"/><path d="M28 50h21m62 0h21M80 0v8M80 82v18" stroke-dasharray="2 4"/><circle cx="26" cy="50" r="2"/><circle cx="134" cy="50" r="2"/></svg></div>';
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 2800);
}
function ready() {
  if (!viewer?.ready) {
    toast("The anatomy is still loading. Please wait a moment.");
    return false;
  }
  return true;
}
function setMode(next) {
  mode = next;
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  $("#clear-selection").hidden = mode !== "explore" || !currentConcept;
  $("#panel-eyebrow").textContent =
    mode === "learn"
      ? "GUIDED LEARNING"
      : mode === "quiz"
        ? "TEST YOUR KNOWLEDGE"
        : currentConcept
          ? "STRUCTURE IN FOCUS"
          : currentSystem
            ? "SYSTEM IN FOCUS"
            : "YOUR FIELD GUIDE";
}
function renderSystems() {
  $("#system-list").innerHTML = SYSTEMS.map((s) => {
    const visible =
      viewer?.systems[s.id].visible ??
      !["integumentary", "cardiovascular"].includes(s.id);
    return `<div class="system-row ${currentSystem === s.id ? "active" : ""}" style="--system-color:${s.color}"><button class="system-select" data-system="${s.id}" aria-label="Explore ${s.name.toLowerCase()} system"><span class="system-dot"></span><span>${s.name}</span></button><button class="system-eye ${visible ? "on" : ""}" data-eye="${s.id}" aria-label="${visible ? "Hide" : "Show"} ${s.name.toLowerCase()} system" aria-pressed="${visible}">${visible ? eye : eyeOff}</button></div>`;
  }).join("");
}
function intro() {
  currentConcept = null;
  currentSystem = null;
  setMode("explore");
  renderSystems();
  panel.innerHTML = `${art}<h2 class="panel-title">Meet your<br>remarkable body.</h2><p class="panel-text">Thousands of structures. Eleven systems. One beautifully connected whole. Where will your curiosity take you?</p><div class="section-label">MAKE YOURSELF AT HOME</div><button class="start-item" data-intro="systems"><span class="step-number">01</span><span><strong>Peel back the layers</strong><small>Explore one body system at a time.</small></span><span class="arrow">↗</span></button><button class="start-item" data-intro="heart"><span class="step-number">02</span><span><strong>Get to the heart of it</strong><small>Select a structure to discover its story.</small></span><span class="arrow">↗</span></button><button class="start-item" data-intro="explode"><span class="step-number">03</span><span><strong>Give things a little space</strong><small>Pull the anatomy apart in 3D.</small></span><span class="arrow">↗</span></button><div class="guide-card"><span class="eyebrow">LET CURIOSITY LEAD</span><h3>Follow a breath.<br>Discover a connection.</h3><button data-tour="breath">Take a guided tour <span>↗</span></button></div><p class="fine-print">An adult male anatomical reference, simplified for exploration. Educational use; not a clinical tool.</p>`;
}
function updateLabels() {
  if (!viewer) return;
  $("#view-direction").textContent = viewer.direction();
  const label = $("#selection-label");
  const pos = viewer.projectedSelection();
  if (pos && pos.visible && currentConcept && mode !== "quiz") {
    label.hidden = false;
    label.textContent = title(currentConcept.name);
    label.style.left =
      Math.max(60, Math.min(pos.x, viewer.canvas.clientWidth - 60)) + "px";
    label.style.top =
      Math.max(150, Math.min(pos.y, viewer.canvas.clientHeight - 210)) + "px";
  } else label.hidden = true;
}
function chooseConcept(id, { focus = false, keepMode = false } = {}) {
  if (!ready()) return;
  const c = viewer.concepts.get(id);
  if (!c) return;
  currentConcept = c;
  currentSystem = null;
  viewer.select(c.meshes);
  if (focus) viewer.focusSelection();
  renderSystems();
  if (!keepMode) {
    setMode("explore");
    renderStructure();
  }
  updateLabels();
  $("#search-results").hidden = true;
  $("#search").value = "";
  $(".sidebar").classList.remove("mobile-open");
  $("#workspace-heading")?.classList.add("selection");
}
function selectQuery(query, options = {}) {
  const c = resolveConcept(catalog.concepts, query);
  if (c) chooseConcept(c.id, options);
  else toast("This structure is not available in this reference atlas.");
}
function badge(system) {
  return `<span class="structure-badge" style="--system-color:${system.color}"><span class="system-dot"></span>${system.name}</span>`;
}
function factList(list) {
  return `<ul class="fact-list">${list.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`;
}
function renderStructure() {
  const c = currentConcept;
  if (!c) return intro();
  const primary =
    c.systems.length === 1
      ? c.systems[0]
      : viewer.meshMeta.get(c.meshes[0]).system;
  const sys = systemMap.get(primary);
  const info = organInfo(c.name, primary);
  $("#panel-eyebrow").textContent = "STRUCTURE IN FOCUS";
  $("#clear-selection").hidden = false;
  panel.innerHTML = `${badge(sys)}<h2 class="panel-title">${esc(title(c.name))}</h2><p class="structure-id">${esc(c.id)} <span>·</span> ${c.meshes.length} mesh ${c.meshes.length === 1 ? "component" : "components"}</p><p class="panel-text">${esc(info.summary)}</p><div class="structure-actions"><button class="action-button primary" data-action="focus">Focus</button><button class="action-button" data-action="isolate">Isolate</button><button class="action-button" data-action="hide">Hide</button></div><div class="section-label">WHAT IT DOES</div>${factList(info.functions)}<div class="section-label">PART OF SOMETHING BIGGER</div><div class="connection">${esc(info.connection)}</div><a class="source-link" href="${info.source}" target="_blank" rel="noopener noreferrer">Read the anatomy reference ↗</a><p class="fine-print">The explanation describes the named organ or tissue class. Mesh components show the available macroscopic geometry, not cellular detail.</p>`;
}
function showSystem(id) {
  if (!ready()) return;
  closeSlice();
  $(".sidebar").classList.remove("mobile-open");
  currentConcept = null;
  currentSystem = id;
  viewer.clearSelection();
  viewer.showSystems([id]);
  viewer.home();
  setMode("explore");
  renderSystems();
  const s = systemMap.get(id);
  const meshes = catalog.meshes.filter((m) => m.system === id);
  const concepts = [...new Set(meshes.map((m) => m.concept))]
    .map((cid) => viewer.concepts.get(cid))
    .sort((a, b) => a.name.length - b.name.length);
  const count = meshes.length;
  panel.innerHTML = `${badge(s)}<h2 class="panel-title">The ${s.name.toLowerCase()}<br>system.</h2><p class="structure-id">${count.toLocaleString()} mesh structures in this atlas</p><p class="panel-text">${esc(s.description)}</p><div class="opacity-control"><label for="system-opacity">Layer opacity <span id="opacity-value">100%</span></label><input id="system-opacity" type="range" min="5" max="100" value="100" aria-label="${s.name} layer opacity"></div><div class="section-label">WHAT IT DOES</div>${factList(s.functions)}<div class="section-label">EXPLORE THE STRUCTURES</div><div class="structure-list">${concepts
    .slice(0, 30)
    .map(
      (c) =>
        `<button data-concept="${c.id}">${esc(title(c.name))} <span>↗</span></button>`,
    )
    .join(
      "",
    )}</div><p class="fine-print">${count > 30 ? "Use search to find more structures. " : ""}Systems overlap in function. Grouping here is for navigation. ${id === "lymphatic" ? "This dataset has limited lymphatic coverage; it does not include the complete lymphatic network." : ""}</p><a class="source-link" href="${s.source}" target="_blank" rel="noopener noreferrer">Learn about this system ↗</a>`;
  document
    .querySelectorAll("[data-preset]")
    .forEach((b) => b.classList.remove("active"));
}
function showLessons() {
  tour = null;
  currentConcept = null;
  viewer?.clearSelection();
  setMode("learn");
  panel.innerHTML = `<h2 class="panel-title">Let’s make some<br><em>connections.</em></h2><p class="panel-text">Follow a path through the body. Each short tour connects structures with the things they help you do.</p><div class="section-label">CHOOSE YOUR JOURNEY</div>${LESSONS.map((l, i) => `<button class="tour-card" data-tour="${l.id}"><span class="step-number">0${i + 1}</span><span><strong>${esc(l.title)}</strong><small>${esc(l.subtitle)}<br>${l.steps.length} stops · interactive tour</small></span><span class="arrow">↗</span></button>`).join("")}<p class="fine-print">Move the model at any point. The tours explain physiology; the mesh itself does not simulate organ function.</p>`;
}
function startTour(id) {
  if (!ready()) return;
  closeSlice();
  tour = LESSONS.find((l) => l.id === id);
  tourStep = 0;
  setExplosion(0);
  setMode("learn");
  runTourStep();
}
function runTourStep() {
  const step = tour.steps[tourStep];
  viewer.showSystems(step.systems);
  selectQuery(step.query, { focus: true, keepMode: true });
  renderSystems();
  panel.innerHTML = `<button class="back-button" data-action="all-tours">← All journeys</button><div class="eyebrow">${esc(tour.title.toUpperCase())}</div><div class="progress-dots">${tour.steps.map((_, i) => `<span class="${i <= tourStep ? "done" : ""}"></span>`).join("")}</div><span class="structure-id">STOP ${tourStep + 1} OF ${tour.steps.length}</span><h2 class="tour-step">${esc(step.title)}</h2><p class="panel-text">${esc(step.body)}</p><div class="connection">Try rotating the model. Use “Isolate” to see this structure on its own, then “Show context” to put it back into the system.</div><div class="structure-actions"><button class="action-button" data-action="isolate">Isolate</button><button class="action-button" data-action="tour-context">Show context</button></div><div class="tour-navigation"><button class="action-button" data-action="tour-prev" ${tourStep === 0 ? "disabled" : ""}>← Previous</button><button class="action-button primary" data-action="tour-next">${tourStep === tour.steps.length - 1 ? "Finish journey" : "Next stop →"}</button></div>`;
}
function startQuiz() {
  if (!ready()) return;
  closeSlice();
  quizIndex = 0;
  quizScore = 0;
  quizAnswer = null;
  setExplosion(0);
  setMode("quiz");
  showQuizQuestion();
}
function showQuizQuestion() {
  if (quizIndex >= QUIZ.length) {
    let best = 0;
    try {
      best = Math.max(
        quizScore,
        Number(localStorage.getItem("human-atlas-best") || 0),
      );
      localStorage.setItem("human-atlas-best", String(best));
    } catch {}
    panel.innerHTML = `${art}<span class="eyebrow">JOURNEY COMPLETE</span><h2 class="panel-title" style="margin-top:18px">${quizScore} / ${QUIZ.length}<br>Keep being curious.</h2><p class="panel-text">${quizScore === QUIZ.length ? "You have a great grasp of these body-system connections." : "Every question is a way to find something new to explore."}</p><p class="connection">Best score on this device: ${best} / ${QUIZ.length}</p><div class="structure-actions"><button class="action-button primary" data-action="quiz-restart">Try again</button><button class="action-button" data-action="explore">Explore anatomy</button></div>`;
    return;
  }
  const q = QUIZ[quizIndex];
  quizAnswer = null;
  currentConcept = null;
  viewer.setPreset("anatomy");
  viewer.home();
  renderSystems();
  panel.innerHTML = `<span class="structure-id">QUESTION ${quizIndex + 1} OF ${QUIZ.length}</span><div class="progress-dots">${QUIZ.map((_, i) => `<span class="${i < quizIndex ? "done" : ""}"></span>`).join("")}</div><h2 class="panel-title" style="font-size:24px">${esc(q.question)}</h2><div class="quiz-options">${q.options.map((o, i) => `<button class="quiz-option" data-answer="${i}">${String.fromCharCode(65 + i)}. ${esc(o)}</button>`).join("")}</div><div id="quiz-feedback" class="quiz-feedback" role="status" aria-live="polite"></div><button id="quiz-next" class="action-button primary" data-action="quiz-next" hidden>${quizIndex === QUIZ.length - 1 ? "See results" : "Next question →"}</button><p class="fine-print">Answer first, then see the relevant structure in 3D. Your best score is saved on this device only.</p>`;
}
function answerQuiz(index) {
  if (quizAnswer !== null) return;
  quizAnswer = index;
  const q = QUIZ[quizIndex];
  if (index === q.answer) quizScore++;
  document.querySelectorAll("[data-answer]").forEach((b, i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add("correct");
    else if (i === index) b.classList.add("incorrect");
  });
  $("#quiz-feedback").textContent =
    (index === q.answer
      ? "That’s right. "
      : "A useful connection to remember. ") + q.explanation;
  $("#quiz-next").hidden = false;
  viewer.showSystems(q.systems);
  selectQuery(q.query, { focus: true, keepMode: true });
  renderSystems();
}
function setExplosion(percent) {
  $("#explode").value = percent;
  $("#explode-value").textContent = percent + "%";
  $("#explode-toggle").setAttribute("aria-pressed", percent > 0);
  $("#explode-toggle").innerHTML =
    percent > 0 ? "Reassemble <span>↙</span>" : "Explode view <span>↗</span>";
  viewer?.setExplode(percent / 100);
}
function reset() {
  if (!ready()) return;
  closeSlice();
  viewer.setPreset("anatomy");
  viewer.home();
  setExplosion(0);
  viewer.setAutoRotate(false);
  $("#rotate-toggle").setAttribute("aria-pressed", "false");
  document
    .querySelectorAll("[data-preset]")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.preset === "anatomy"),
    );
  intro();
}
function showInfo() {
  const count = catalog?.meshes.length.toLocaleString() || "2,234";
  $("#dialog-content").innerHTML =
    `<h2>A whole body of discovery.</h2><p>Human Atlas is an interactive, macroscopic anatomy explorer built for curiosity. Rotate a real anatomical model, separate its structures, and connect what you see with how the body works.</p><h3>Explore with your hands or keyboard</h3><p>Drag to orbit. Scroll or pinch to zoom. Right-drag or use two fingers to pan. Select structures in 3D or through search. Use the A, L, P, and R buttons for anatomical views.</p><div class="shortcut-list"><span><kbd>/</kbd> Find a structure</span><span><kbd>R</kbd> Reset the atlas</span><span><kbd>E</kbd> Explode / assemble</span><span><kbd>Esc</kbd> Clear selection</span><span><kbd>+</kbd> Zoom in</span><span><kbd>−</kbd> Zoom out</span></div><h3>What this atlas contains</h3><p>${count} mesh components from the BodyParts3D 4.0 adult male reference, organized into 11 body systems. Mesh counts are not counts of individual organs. Some structures are represented by several components. Search also includes compound anatomical concepts.</p><p>The source is a simplified, polygon-reduced model. It does not include every anatomical structure, a female reference body, developmental stages, individual variation, microscopic cells, or a simulation of blood flow and organ function. Lymphatic and peripheral nerve coverage is limited. A structure’s placement in one navigation layer does not mean it belongs exclusively to that system. Exploded positions and colors are illustrative. The section tool clips surface meshes without synthesizing the cut tissue or filling the opening.</p><h3>Sources & credits</h3><p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noopener noreferrer">BodyParts3D / Anatomography</a>, © The Database Center for Life Science, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC Attribution 4.0 International</a>, as documented in the official February 2025 license update. Meshes have been converted, grouped, colored, and compressed for the web.</p><p>Original educational summaries reference <a href="https://training.seer.cancer.gov/anatomy/" target="_blank" rel="noopener noreferrer">NCI SEER Anatomy & Physiology</a> and NIH MedlinePlus. 3D rendering uses <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Three.js</a> (MIT). This is an educational atlas, not a diagnostic or clinical planning tool.</p><h3>Privacy</h3><p>Exploration runs in your browser. No account, analytics, or server-side data storage is required by the app. Only your best quiz score is stored locally.</p>`;
  $("#info-dialog").showModal();
}
$("#system-list").addEventListener("click", (e) => {
  const eyeButton = e.target.closest("[data-eye]");
  if (eyeButton) {
    if (!ready()) return;
    const id = eyeButton.dataset.eye;
    viewer.setSystem(id, !viewer.systems[id].visible);
    currentConcept = null;
    renderSystems();
    if (mode === "explore") intro();
    return;
  }
  const systemButton = e.target.closest("[data-system]");
  if (systemButton) showSystem(systemButton.dataset.system);
});
panel.addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (!button) return;
  if (button.dataset.concept) {
    chooseConcept(button.dataset.concept, { focus: true });
    return;
  }
  if (button.dataset.tour) {
    startTour(button.dataset.tour);
    return;
  }
  if (button.dataset.answer !== undefined) {
    answerQuiz(Number(button.dataset.answer));
    return;
  }
  if (button.dataset.intro) {
    if (!ready()) return;
    if (button.dataset.intro === "systems") showSystem("skeletal");
    if (button.dataset.intro === "heart") selectQuery("heart", { focus: true });
    if (button.dataset.intro === "explode") {
      setExplosion(65);
      toast("Drag to explore the separated structures.");
    }
    return;
  }
  const action = button.dataset.action;
  if (!action) return;
  if (action === "focus") viewer.focusSelection();
  if (action === "isolate") {
    viewer.isolateSelection();
    toast("Structure isolated. Reset the view to restore all layers.");
  }
  if (action === "hide") {
    viewer.hideSelection();
    intro();
    toast("Structure hidden. Reset restores hidden structures.");
  }
  if (action === "all-tours") showLessons();
  if (action === "tour-context") runTourStep();
  if (action === "tour-prev") {
    tourStep--;
    runTourStep();
  }
  if (action === "tour-next") {
    if (tourStep < tour.steps.length - 1) {
      tourStep++;
      runTourStep();
    } else {
      showLessons();
      toast("Journey complete. There is always more to discover.");
    }
  }
  if (action === "quiz-restart") startQuiz();
  if (action === "quiz-next") {
    quizIndex++;
    showQuizQuestion();
  }
  if (action === "explore") reset();
});
panel.addEventListener("input", (e) => {
  if (e.target.id === "system-opacity") {
    viewer.setOpacity(currentSystem, Number(e.target.value) / 100);
    $("#opacity-value").textContent = e.target.value + "%";
  }
});
$("#search").addEventListener("input", (e) => {
  const query = e.target.value.trim();
  const box = $("#search-results");
  if (!catalog || !query) {
    box.hidden = true;
    return;
  }
  const results = searchConcepts(catalog.concepts, query);
  box.hidden = false;
  box.innerHTML = results.length
    ? results
        .map(
          (c) =>
            `<button class="search-result" data-result="${c.id}"><strong>${esc(title(c.name))}</strong><small>${c.systems.length === 1 ? systemMap.get(c.systems[0]).name : "Multiple systems"} · ${c.meshes.length} ${c.meshes.length === 1 ? "component" : "components"}</small></button>`,
        )
        .join("") +
      '<p class="fine-print">' +
      (results.length === 40
        ? "Showing the first 40 matches. Refine your search for more."
        : "Names follow the source atlas.") +
      "</p>"
    : '<p class="search-empty">No structures found. Try “heart”, “femur”, or “brain”.</p>';
});
$("#search").addEventListener("keydown", (e) => {
  if (
    (e.key === "ArrowDown" || e.key === "Enter") &&
    !$("#search-results").hidden
  ) {
    e.preventDefault();
    const first = $("[data-result]");
    if (e.key === "Enter" && first)
      chooseConcept(first.dataset.result, { focus: true });
    else first?.focus();
  }
  if (e.key === "Escape") $("#search-results").hidden = true;
});
$("#search-results").addEventListener("click", (e) => {
  const b = e.target.closest("[data-result]");
  if (b) chooseConcept(b.dataset.result, { focus: true });
});
document.querySelectorAll("[data-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    if (b.dataset.mode === "explore") reset();
    if (b.dataset.mode === "learn") showLessons();
    if (b.dataset.mode === "quiz") startQuiz();
  }),
);
document.querySelectorAll("[data-preset]").forEach((b) =>
  b.addEventListener("click", () => {
    if (!ready()) return;
    closeSlice();
    viewer.setPreset(b.dataset.preset);
    viewer.home();
    setExplosion(0);
    intro();
    document
      .querySelectorAll("[data-preset]")
      .forEach((p) => p.classList.toggle("active", p === b));
  }),
);
document
  .querySelectorAll("[data-angle]")
  .forEach((b) =>
    b.addEventListener("click", () => viewer?.angle(b.dataset.angle)),
  );
$("#explode").addEventListener("input", (e) =>
  setExplosion(Number(e.target.value)),
);
$("#explode-toggle").addEventListener("click", () => {
  if (ready()) setExplosion(Number($("#explode").value) > 0 ? 0 : 65);
});
$("#zoom-in").addEventListener("click", () => viewer?.zoom(0.8));
$("#zoom-out").addEventListener("click", () => viewer?.zoom(1.25));
$("#home-view").addEventListener("click", reset);
$("#restore-systems").addEventListener("click", reset);
$("#rotate-toggle").addEventListener("click", (e) => {
  if (!ready()) return;
  const state = !viewer.controls.autoRotate;
  viewer.setAutoRotate(state);
  e.currentTarget.setAttribute("aria-pressed", state);
});
function closeSlice() {
  if (viewer?.ready) viewer.setSlice(null);
  $("#slice-panel").hidden = true;
  $("#slice-toggle").setAttribute("aria-pressed", "false");
}
function updateSlice() {
  viewer.setSlice(
    $("#slice-axis").value,
    Number($("#slice-position").value) / 100,
  );
}
$("#slice-toggle").addEventListener("click", () => {
  if (!ready()) return;
  if (!$("#slice-panel").hidden) {
    closeSlice();
    return;
  }
  $("#slice-panel").hidden = false;
  $("#slice-toggle").setAttribute("aria-pressed", "true");
  updateSlice();
});
$("#slice-close").addEventListener("click", closeSlice);
$("#slice-axis").addEventListener("change", updateSlice);
$("#slice-position").addEventListener("input", updateSlice);
$("#screenshot").addEventListener("click", () => {
  if (!ready()) return;
  const a = document.createElement("a");
  a.href = viewer.screenshot();
  a.download = "human-atlas-view.png";
  a.click();
  toast("Your anatomy view has been downloaded.");
});
$("#clear-selection").addEventListener("click", () => {
  viewer.clearSelection();
  intro();
});
["#help-button", "#source-button", "#model-info"].forEach((id) =>
  $(id).addEventListener("click", showInfo),
);
$("#close-dialog").addEventListener("click", () => $("#info-dialog").close());
$("#info-dialog").addEventListener("click", (e) => {
  if (e.target === $("#info-dialog")) {
    const r = e.target.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      e.target.close();
  }
});
$("#mobile-menu").addEventListener("click", () =>
  $(".sidebar").classList.toggle("mobile-open"),
);
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input,textarea") || $("#info-dialog").open) return;
  if (e.key === "/") {
    e.preventDefault();
    $(".sidebar").classList.add("mobile-open");
    $("#search").focus();
  }
  if (e.key.toLowerCase() === "r") reset();
  if (e.key.toLowerCase() === "e" && ready())
    setExplosion(Number($("#explode").value) > 0 ? 0 : 65);
  if (e.key === "Escape") {
    viewer?.clearSelection();
    intro();
    $(".sidebar").classList.remove("mobile-open");
  }
  if (e.key === "+" || e.key === "=") viewer?.zoom(0.85);
  if (e.key === "-") viewer?.zoom(1.18);
});
function showError(error) {
  $("#loading").hidden = false;
  $("#loading").classList.add("error");
  $("#loading").innerHTML =
    `<strong>The atlas couldn’t open.</strong><span>${esc(error.message || error)}<br>Your browser needs WebGL 2 to display the 3D model.</span><button id="retry-load">Try again</button>`;
  $("#retry-load").addEventListener("click", () => location.reload());
}
intro();
renderSystems();
try {
  viewer = new AnatomyViewer($("#anatomy-canvas"), {
    onSelect: (id) => chooseConcept(id),
    onProgress: (status) => {
      if (status.error) {
        showError(status.error);
        return;
      }
      $("#loading-progress").style.width = status.percent + "%";
      $("#loading-message").textContent = status.system
        ? "Preparing the " + status.system + " system…"
        : "Loading the atlas…";
      if (status.complete) {
        $("#loading").hidden = true;
        $("#mesh-count").textContent =
          status.count.toLocaleString() + " MESH STRUCTURES";
      }
    },
    onHover: (meta, e) => {
      const label = $("#hover-label");
      label.hidden = !meta;
      if (meta) {
        const rect = $(".workspace").getBoundingClientRect();
        label.textContent = title(meta.name);
        label.style.left =
          Math.min(e.clientX - rect.left + 15, rect.width - 220) + "px";
        label.style.top =
          Math.min(e.clientY - rect.top + 15, rect.height - 180) + "px";
      }
    },
    onState: updateLabels,
  });
  catalog = await viewer.load();
  renderSystems();
  // Public read-only diagnostics support manual browser QA without exposing internal objects.
  window.atlasDiagnostics = () => ({
    ready: viewer.ready,
    meshes: viewer.meshes.size,
    visible: [...viewer.meshes.values()].filter((m) => m.visible).length,
    selected: viewer.selected.size,
    isolated: viewer.isolated?.size ?? 0,
    explode: viewer.explodeTarget,
    mode,
    triangles: catalog.triangles,
  });
} catch (error) {
  console.error(error);
  showError(error);
}
window.addEventListener("pagehide", () => viewer?.dispose());
