const ADDITIVE_EMITTERS = [
  "Red",
  "Deep Red",
  "Red Orange",
  "Amber",
  "Lime",
  "Green",
  "Cyan",
  "Blue",
  "UV (Indigo)",
  "White",
  "Warm White",
  "Cool White",
  "CTO"
];

const CMY_EMITTERS = ["Cyan", "Magenta", "Yellow", "CTO"];

const DEFAULT_BASIS_HEX = {
  Red: "#ff0000",
  "Deep Red": "#b1002f",
  "Red Orange": "#ff4500",
  Amber: "#ffbf00",
  Lime: "#98ff4d",
  Green: "#00d050",
  Cyan: "#00ccff",
  Blue: "#1d4fff",
  "UV (Indigo)": "#4a00ff",
  White: "#ffffff",
  "Warm White": "#ffe3b6",
  "Cool White": "#d7e9ff",
  CTO: "#ffd6a4",
  Magenta: "#ff00d8",
  Yellow: "#fff100"
};

const DEFAULT_XY = {
  Red: { x: 0.700, y: 0.299 },
  "Deep Red": { x: 0.715, y: 0.283 },
  "Red Orange": { x: 0.620, y: 0.360 },
  Amber: { x: 0.565, y: 0.430 },
  Lime: { x: 0.390, y: 0.550 },
  Green: { x: 0.300, y: 0.600 },
  Cyan: { x: 0.225, y: 0.330 },
  Blue: { x: 0.150, y: 0.070 },
  "UV (Indigo)": { x: 0.160, y: 0.040 },
  White: { x: 0.3127, y: 0.3290 },
  "Warm White": { x: 0.450, y: 0.410 },
  "Cool White": { x: 0.310, y: 0.320 },
  CTO: { x: 0.520, y: 0.410 },
  Magenta: { x: 0.345, y: 0.154 },
  Yellow: { x: 0.468, y: 0.469 }
};

const MODE_INFO = {
  A: {
    title: "Level A: Fast approximation",
    whatUses: "Uses default emitter basis constants.",
    whatProvide: "Select fixture channels and target color."
  },
  B: {
    title: "Level B: Chromaticity-aware",
    whatUses: "Uses emitter x,y data when provided.",
    whatProvide: "Optional per-emitter chromaticity overrides."
  },
  C: {
    title: "Level C: Spectral/SPD (Expert)",
    whatUses: "MVP beta keeps UI for SPD workflow and falls back to current basis.",
    whatProvide: "Optional SPD CSV for future spectral model updates."
  }
};

const QUICK_SETS = {
  additive: {
    RGBW: ["Red", "Green", "Blue", "White"],
    RGBWAUV: ["Red", "Green", "Blue", "White", "Amber", "UV (Indigo)"],
    RGBWLi: ["Red", "Green", "Blue", "White", "Lime"]
  },
  cmy: {
    "CMY+CTO": ["Cyan", "Magenta", "Yellow", "CTO"]
  }
};

const STORAGE_KEY = "lightingColorMatchFixturesV1";

const els = {
  familySelect: document.getElementById("familySelect"),
  modeSelect: document.getElementById("modeSelect"),
  modeCard: document.getElementById("modeCard"),
  targetColor: document.getElementById("targetColor"),
  hexInput: document.getElementById("hexInput"),
  copyHexBtn: document.getElementById("copyHexBtn"),
  hexError: document.getElementById("hexError"),
  showDecimals: document.getElementById("showDecimals"),
  showDisabled: document.getElementById("showDisabled"),
  emitterList: document.getElementById("emitterList"),
  quickSets: document.getElementById("quickSets"),
  levelBPanel: document.getElementById("levelBPanel"),
  levelCPanel: document.getElementById("levelCPanel"),
  chromaticityList: document.getElementById("chromaticityList"),
  spdInput: document.getElementById("spdInput"),
  outputBody: document.getElementById("outputBody"),
  nearBlackNote: document.getElementById("nearBlackNote"),
  targetSwatch: document.getElementById("targetSwatch"),
  predictedSwatch: document.getElementById("predictedSwatch"),
  copyCsvBtn: document.getElementById("copyCsvBtn"),
  fixtureName: document.getElementById("fixtureName"),
  fixtureFamilySelect: document.getElementById("fixtureFamilySelect"),
  fixtureEmitterList: document.getElementById("fixtureEmitterList"),
  saveFixtureBtn: document.getElementById("saveFixtureBtn"),
  deleteFixtureBtn: document.getElementById("deleteFixtureBtn"),
  fixtureSelect: document.getElementById("fixtureSelect")
};

const state = {
  family: "additive",
  mode: "A",
  targetHex: "#FF5500",
  selected: new Set(["Red", "Green", "Blue", "White"]),
  showDecimals: false,
  showDisabled: false,
  chromaticityOverrides: {},
  spdCsv: "",
  fixtures: [],
  currentFixtureId: ""
};

init();

function init() {
  loadFixtures();
  renderModeCard();
  renderEmitterChecklist();
  renderQuickSets();
  renderChromaticityInputs();
  renderFixtureBuilderChecklist();
  renderFixtureSelect();
  wireEvents();
  solveAndRender();
}

function wireEvents() {
  els.familySelect.addEventListener("change", () => {
    state.family = els.familySelect.value;
    state.selected = new Set(defaultSelectionForFamily(state.family));
    renderEmitterChecklist();
    renderQuickSets();
    renderChromaticityInputs();
    solveAndRender();
  });

  els.modeSelect.addEventListener("change", () => {
    state.mode = els.modeSelect.value;
    renderModeCard();
    renderChromaticityInputs();
    solveAndRender();
  });

  els.targetColor.addEventListener("input", () => {
    const hex = normalizeHex(els.targetColor.value);
    if (!hex) return;
    state.targetHex = hex;
    els.hexInput.value = hex;
    els.hexError.textContent = "";
    solveAndRender();
  });

  els.hexInput.addEventListener("input", () => {
    const hex = normalizeHex(els.hexInput.value, true);
    if (!hex) {
      els.hexError.textContent = "Use format #RRGGBB.";
      return;
    }
    state.targetHex = hex;
    els.targetColor.value = hex;
    els.hexInput.value = hex;
    els.hexError.textContent = "";
    solveAndRender();
  });

  els.copyHexBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(state.targetHex);
    } catch {
      els.hexError.textContent = "Clipboard unavailable in this context.";
    }
  });

  els.showDecimals.addEventListener("change", () => {
    state.showDecimals = els.showDecimals.checked;
    solveAndRender();
  });

  els.showDisabled.addEventListener("change", () => {
    state.showDisabled = els.showDisabled.checked;
    solveAndRender();
  });

  els.spdInput.addEventListener("input", () => {
    state.spdCsv = els.spdInput.value;
  });

  els.copyCsvBtn.addEventListener("click", async () => {
    const rows = Array.from(els.outputBody.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.children).map((td) => td.textContent).join(",")
    );
    const csv = ["Emitter,DMX,Percent", ...rows].join("\n");
    try {
      await navigator.clipboard.writeText(csv);
    } catch {
      // Clipboard support depends on browser security context.
    }
  });

  els.fixtureFamilySelect.addEventListener("change", renderFixtureBuilderChecklist);

  els.saveFixtureBtn.addEventListener("click", saveFixtureFromBuilder);
  els.deleteFixtureBtn.addEventListener("click", deleteSelectedFixture);

  els.fixtureSelect.addEventListener("change", () => {
    const id = els.fixtureSelect.value;
    state.currentFixtureId = id;
    if (!id) return;
    const fixture = state.fixtures.find((f) => f.id === id);
    if (!fixture) return;
    applyFixtureToQuickMix(fixture);
    hydrateFixtureBuilder(fixture);
  });
}

function renderModeCard() {
  const info = MODE_INFO[state.mode];
  els.modeCard.innerHTML = `
    <strong>${info.title}</strong>
    <p><b>What this uses:</b> ${info.whatUses}</p>
    <p><b>What you provide:</b> ${info.whatProvide}</p>
  `;

  const showB = state.mode === "B";
  const showC = state.mode === "C";
  els.levelBPanel.classList.toggle("hidden", !showB);
  els.levelCPanel.classList.toggle("hidden", !showC);
}

function renderEmitterChecklist() {
  const emitters = emittersForFamily(state.family);
  els.emitterList.innerHTML = "";
  emitters.forEach((emitter) => {
    const id = `emit-${safeId(emitter)}`;
    const checked = state.selected.has(emitter) ? "checked" : "";
    const label = document.createElement("label");
    label.innerHTML = `<input id="${id}" type="checkbox" ${checked} /><span>${emitter}</span>`;
    label.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) state.selected.add(emitter);
      else state.selected.delete(emitter);
      renderChromaticityInputs();
      solveAndRender();
    });
    els.emitterList.appendChild(label);
  });
}

function renderQuickSets() {
  els.quickSets.innerHTML = "";
  const sets = QUICK_SETS[state.family] || {};
  Object.entries(sets).forEach(([name, emitters]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = name;
    btn.addEventListener("click", () => {
      state.selected = new Set(emitters);
      renderEmitterChecklist();
      renderChromaticityInputs();
      solveAndRender();
    });
    els.quickSets.appendChild(btn);
  });
}

function renderChromaticityInputs() {
  els.chromaticityList.innerHTML = "";
  if (state.mode !== "B") return;

  emittersForFamily(state.family).forEach((emitter) => {
    if (!state.selected.has(emitter)) return;
    const fallback = DEFAULT_XY[emitter] || { x: 0.3127, y: 0.329 };
    const override = state.chromaticityOverrides[emitter] || {};

    const row = document.createElement("div");
    row.className = "chromaticity-row";
    row.innerHTML = `
      <span>${emitter}</span>
      <input type="number" min="0" max="0.9" step="0.001" value="${(override.x ?? fallback.x).toFixed(3)}" />
      <input type="number" min="0" max="0.9" step="0.001" value="${(override.y ?? fallback.y).toFixed(3)}" />
    `;

    const [xInput, yInput] = row.querySelectorAll("input");
    xInput.addEventListener("input", () => {
      updateChromaticityOverride(emitter, xInput.value, yInput.value);
      solveAndRender();
    });
    yInput.addEventListener("input", () => {
      updateChromaticityOverride(emitter, xInput.value, yInput.value);
      solveAndRender();
    });

    els.chromaticityList.appendChild(row);
  });
}

function updateChromaticityOverride(emitter, x, y) {
  const xNum = Number(x);
  const yNum = Number(y);
  if (!Number.isFinite(xNum) || !Number.isFinite(yNum) || xNum <= 0 || yNum <= 0 || xNum + yNum >= 1) {
    return;
  }
  state.chromaticityOverrides[emitter] = { x: xNum, y: yNum };
}

function solveAndRender() {
  const targetRgb = hexToSrgb01(state.targetHex);
  els.targetSwatch.style.background = state.targetHex;

  const luminance = 0.2126 * srgbToLinear(targetRgb[0]) + 0.7152 * srgbToLinear(targetRgb[1]) + 0.0722 * srgbToLinear(targetRgb[2]);
  const nearBlack = luminance < 0.01;
  els.nearBlackNote.classList.toggle("hidden", !nearBlack);

  const emitters = emittersForFamily(state.family);
  const selected = emitters.filter((e) => state.selected.has(e));

  let weights = {};
  let predicted = [0, 0, 0];

  if (!nearBlack && selected.length > 0) {
    const basis = buildBasis(selected);
    const solved = solveWeights(targetRgb, selected, basis);
    weights = solved.weights;
    predicted = solved.predictedSrgb;
  }

  renderOutputTable(emitters, selected, weights, nearBlack);
  els.predictedSwatch.style.background = toHex(predicted);
}

function renderOutputTable(emitters, selected, weights, nearBlack) {
  const rows = [];
  emitters.forEach((emitter) => {
    const selectedEmitter = selected.includes(emitter);
    if (!selectedEmitter && !state.showDisabled) return;

    let valueNorm = 0;
    if (!nearBlack && selectedEmitter) valueNorm = clamp01(weights[emitter] || 0);

    const dmx = Math.round(valueNorm * 255);
    const percent = state.showDecimals ? (valueNorm * 100).toFixed(1) : String(Math.round(valueNorm * 100));
    rows.push({ emitter, dmx, percent, disabled: !selectedEmitter });
  });

  els.outputBody.innerHTML = rows
    .map(
      (row) => `
      <tr style="opacity:${row.disabled ? 0.5 : 1}">
        <td>${row.emitter}</td>
        <td>${row.dmx}</td>
        <td>${row.percent}%</td>
      </tr>
    `
    )
    .join("");
}

function buildBasis(selectedEmitters) {
  return selectedEmitters.map((emitter) => {
    if (state.mode === "B") {
      const xy = state.chromaticityOverrides[emitter] || DEFAULT_XY[emitter];
      if (xy && xy.x > 0 && xy.y > 0 && xy.x + xy.y < 1) {
        const rgb = xyzToSrgb(xyToXyz(xy.x, xy.y, 1));
        return rgb;
      }
    }

    // Level C keeps SPD UI in MVP beta but currently reuses basis defaults.
    return hexToSrgb01(DEFAULT_BASIS_HEX[emitter] || "#ffffff");
  });
}

function solveWeights(targetSrgb, emitters, basisSrgb) {
  const basisLinear = basisSrgb.map((b) => b.map(srgbToLinear));
  const targetLab = srgbToOklab(targetSrgb);

  let w = new Array(emitters.length).fill(0.15);
  const step = 0.08;
  const eps = 1e-4;

  for (let iter = 0; iter < 130; iter += 1) {
    const grad = new Array(w.length).fill(0);
    const baseError = objective(w);

    for (let i = 0; i < w.length; i += 1) {
      const perturbed = w.slice();
      perturbed[i] = clamp01(perturbed[i] + eps);
      grad[i] = (objective(perturbed) - baseError) / eps;
    }

    for (let i = 0; i < w.length; i += 1) {
      w[i] = clamp01(w[i] - step * grad[i]);
    }
  }

  const maxW = Math.max(...w, 0);
  const normalized = maxW > 0 ? w.map((x) => x / maxW) : w;

  const predictedLinear = mixFromWeights(normalized, basisLinear);
  const predictedSrgb = predictedLinear.map(linearToSrgb);

  const weightMap = {};
  emitters.forEach((emitter, i) => {
    weightMap[emitter] = normalized[i] || 0;
  });

  return { weights: weightMap, predictedSrgb };

  function objective(weights) {
    const mixedLinear = mixFromWeights(weights, basisLinear);
    const mixedSrgb = mixedLinear.map(linearToSrgb);
    const mixedLab = srgbToOklab(mixedSrgb);
    return euclidean3(mixedLab, targetLab);
  }
}

function mixFromWeights(weights, basisLinear) {
  const out = [0, 0, 0];
  for (let i = 0; i < weights.length; i += 1) {
    out[0] += basisLinear[i][0] * weights[i];
    out[1] += basisLinear[i][1] * weights[i];
    out[2] += basisLinear[i][2] * weights[i];
  }
  return out.map(clamp01);
}

function renderFixtureBuilderChecklist() {
  const family = els.fixtureFamilySelect.value;
  const emitters = emittersForFamily(family);
  els.fixtureEmitterList.innerHTML = "";
  emitters.forEach((emitter) => {
    const checked = state.selected.has(emitter) ? "checked" : "";
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${emitter}" ${checked}/><span>${emitter}</span>`;
    els.fixtureEmitterList.appendChild(label);
  });
}

function getFixtureBuilderEmitters() {
  return Array.from(els.fixtureEmitterList.querySelectorAll("input:checked")).map((el) => el.value);
}

function saveFixtureFromBuilder() {
  const name = els.fixtureName.value.trim();
  if (!name) return;

  const family = els.fixtureFamilySelect.value;
  const emitters = getFixtureBuilderEmitters();
  const id = state.currentFixtureId || crypto.randomUUID();

  const fixture = {
    id,
    name,
    family,
    emitters,
    chromaticityOverrides: { ...state.chromaticityOverrides },
    spdCsv: state.spdCsv || ""
  };

  const index = state.fixtures.findIndex((f) => f.id === id);
  if (index >= 0) state.fixtures[index] = fixture;
  else state.fixtures.push(fixture);

  state.currentFixtureId = id;
  persistFixtures();
  renderFixtureSelect();
}

function deleteSelectedFixture() {
  if (!state.currentFixtureId) return;
  state.fixtures = state.fixtures.filter((f) => f.id !== state.currentFixtureId);
  state.currentFixtureId = "";
  els.fixtureName.value = "";
  persistFixtures();
  renderFixtureSelect();
}

function renderFixtureSelect() {
  els.fixtureSelect.innerHTML = '<option value="">Select a fixture</option>';
  state.fixtures
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((fixture) => {
      const opt = document.createElement("option");
      opt.value = fixture.id;
      opt.textContent = fixture.name;
      if (fixture.id === state.currentFixtureId) opt.selected = true;
      els.fixtureSelect.appendChild(opt);
    });
}

function applyFixtureToQuickMix(fixture) {
  state.family = fixture.family;
  state.selected = new Set(fixture.emitters);
  state.chromaticityOverrides = fixture.chromaticityOverrides || {};
  state.spdCsv = fixture.spdCsv || "";

  els.familySelect.value = fixture.family;
  els.spdInput.value = state.spdCsv;

  renderEmitterChecklist();
  renderQuickSets();
  renderChromaticityInputs();
  solveAndRender();
}

function hydrateFixtureBuilder(fixture) {
  els.fixtureName.value = fixture.name;
  els.fixtureFamilySelect.value = fixture.family;
  renderFixtureBuilderChecklist();

  Array.from(els.fixtureEmitterList.querySelectorAll("input")).forEach((input) => {
    input.checked = fixture.emitters.includes(input.value);
  });
}

function persistFixtures() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.fixtures));
}

function loadFixtures() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    state.fixtures = Array.isArray(parsed) ? parsed : [];
  } catch {
    state.fixtures = [];
  }
}

function emittersForFamily(family) {
  return family === "cmy" ? CMY_EMITTERS : ADDITIVE_EMITTERS;
}

function defaultSelectionForFamily(family) {
  if (family === "cmy") return ["Cyan", "Magenta", "Yellow", "CTO"];
  return ["Red", "Green", "Blue", "White"];
}

function normalizeHex(value, allowNoHash = false) {
  const trimmed = value.trim().toUpperCase();
  const normalized = allowNoHash && /^[0-9A-F]{6}$/.test(trimmed) ? `#${trimmed}` : trimmed;
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

function hexToSrgb01(hex) {
  const clean = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255);
}

function toHex(rgb01) {
  return `#${rgb01
    .map((n) => Math.round(clamp01(n) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function srgbToLinear(c) {
  if (c <= 0.04045) return c / 12.92;
  return ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c) {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * c ** (1 / 2.4) - 0.055;
}

function srgbToOklab(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  ];
}

function xyToXyz(x, y, Y = 1) {
  const X = (x * Y) / y;
  const Z = ((1 - x - y) * Y) / y;
  return [X, Y, Z];
}

function xyzToSrgb([X, Y, Z]) {
  const rLin = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const gLin = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const bLin = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  return [linearToSrgb(rLin), linearToSrgb(gLin), linearToSrgb(bLin)].map(clamp01);
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function euclidean3(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function safeId(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
