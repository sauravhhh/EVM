"use strict";
/* Mock EVM — ballot unit, VVPAT, control unit. All data stays on this device. */

const SYMS = {
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>',
  circle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="8"/></svg>',
  triangle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l10 18H2z"/></svg>',
  square: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>',
  diamond: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 10-8 10-8-10z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C7 16.5 2 13 2 8.8 2 6 4.2 4 6.8 4c1.7 0 3.4 1 4.2 2.4h2C13.8 5 15.5 4 17.2 4 19.8 4 22 6 22 8.8c0 4.2-5 7.7-10 12.2z" transform="scale(0.95) translate(0.6,0.6)"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M19.4 4.6l-2.1 2.1M6.7 17.3l-2.1 2.1"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/></svg>',
  flower: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="3"/><circle cx="17" cy="12" r="3"/><circle cx="12" cy="17" r="3"/><circle cx="7" cy="12" r="3"/><circle cx="12" cy="12" r="2.2" fill="#fff"/></svg>',
  umbrella: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 1 10 10H2A10 10 0 0 1 12 2zm-1 12h2v7a1 1 0 0 1-2 0v-7z"/></svg>',
  tree: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l7 10h-4l5 7H4l5-7H5z"/><rect x="11" y="18" width="2" height="5"/></svg>',
  cup: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h11v9a5 5 0 0 1-10 0V3h-1zm-2 0h2v2H3zM6 15h8l-1 6H7z"/></svg>',
  nota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/></svg>'
};
const SYM_KEYS = Object.keys(SYMS).filter(k => k !== "nota");

const LS_KEY = "evm-mock-v1";
const DEFAULTS = () => ({
  candidates: [
    {name: "Aarav Sharma", sym: "star"},
    {name: "Priya Deka", sym: "flower"},
    {name: "Rahul Bora", sym: "sun"},
    {name: "Mamoni Das", sym: "moon"}
  ],
  votes: {},
  voterNo: 1
});

let state;
try {
  state = JSON.parse(localStorage.getItem(LS_KEY)) || DEFAULTS();
  if (!Array.isArray(state.candidates)) state = DEFAULTS();
} catch (e) { state = DEFAULTS(); }
if (typeof state.voterNo !== "number") state.voterNo = 1;
if (typeof state.votes !== "object" || !state.votes) state.votes = {};
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }
function votesFor(i) { return state.votes[i] || 0; } // i: candidate idx, "nota" for NOTA

/* ---------- sound: EVM-style beep ---------- */
let AC = null;
function beep(freq, dur) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, AC.currentTime + 0.02);
    g.gain.setValueAtTime(0.5, AC.currentTime + dur - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + dur);
  } catch (e) {}
}

/* ---------- tabs ---------- */
document.querySelectorAll(".tabs button").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    ["vote", "results", "setup"].forEach(t => {
      document.getElementById("tab-" + t).hidden = (t !== b.dataset.tab);
    });
    if (b.dataset.tab === "results") renderResults();
    if (b.dataset.tab === "setup") renderSetup();
    window.scrollTo(0, 0);
  });
});

/* ---------- ballot unit ---------- */
const ballot = document.getElementById("ballot");
const slip = document.getElementById("slip");
const vvpatIdle = document.getElementById("vvpatIdle");
let slipTimer = null, votingLock = false;

function allEntries() {
  const list = state.candidates.map((c, i) => ({key: i, name: c.name, sym: c.sym, nota: false}));
  list.push({key: "nota", name: "NOTA", sym: "nota", nota: true});
  return list;
}
function renderBallot() {
  ballot.innerHTML = "";
  allEntries().forEach((e, idx) => {
    const row = document.createElement("div");
    row.className = "cand" + (e.nota ? " nota" : "");
    row.innerHTML =
      '<span class="paper"><span class="sl">' + (idx + 1) + '</span>' +
      '<span class="pname">' + escapeHtml(e.name) + '</span>' +
      '<span class="psym">' + SYMS[e.sym] + '</span></span>' +
      '<span class="votebox"><span class="led" id="led-' + e.key + '"></span>' +
      '<button class="vbtn" type="button" aria-label="Vote for ' + escapeHtml(e.name) + '"></button></span>';
    row.querySelector(".vbtn").addEventListener("click", () => castVote(e, idx));
    ballot.appendChild(row);
  });
  document.getElementById("voterNo").textContent = state.voterNo;
}
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function setSlipCount() {
  document.getElementById("slipCount").textContent = String(state.voterNo - 1).padStart(3, "0");
}
function castVote(e, idx) {
  if (votingLock) return;
  votingLock = true;
  const led = document.getElementById("led-" + e.key);
  if (led) led.classList.add("on");
  beep(880, 0.9); // EVM long beep
  state.votes[e.key] = votesFor(e.key) + 1;
  state.voterNo++;
  save();
  document.getElementById("voterNo").textContent = state.voterNo;
  // VVPAT slip, visible 7 seconds like the real machine
  vvpatIdle.hidden = true;
  slip.hidden = false;
  slip.innerHTML = '<div class="sl-no">SL.NO ' + (idx + 1) + ' &middot; VVPAT</div>' +
    '<div class="sl-symbig">' + SYMS[e.sym] + '</div>' +
    '<div class="sl-name">' + escapeHtml(e.name) + '</div>';
  setSlipCount();
  clearTimeout(slipTimer);
  slipTimer = setTimeout(() => { slip.hidden = true; vvpatIdle.hidden = false; }, 7000);
  setTimeout(() => {
    if (led) led.classList.remove("on");
    votingLock = false;
  }, 1200);
}

/* ---------- control unit / results ---------- */
function renderResults() {
  const box = document.getElementById("resRows");
  box.innerHTML = "";
  const entries = allEntries();
  const total = entries.reduce((a, e) => a + votesFor(e.key), 0);
  const sorted = [...entries].sort((a, b) => votesFor(b.key) - votesFor(a.key));
  const max = Math.max(1, ...entries.map(e => votesFor(e.key)));
  sorted.forEach(e => {
    const v = votesFor(e.key), pct = total ? (v / total * 100) : 0;
    const row = document.createElement("div");
    row.className = "rrow";
    row.innerHTML =
      '<span class="rsym">' + SYMS[e.sym] + '</span>' +
      '<span class="rname">' + escapeHtml(e.name) + '</span>' +
      '<span class="rvotes"><b>' + v + '</b> &middot; ' + pct.toFixed(1) + '%</span>' +
      '<span class="rbar"><i style="width:' + (v / max * 100).toFixed(1) + '%"></i></span>';
    box.appendChild(row);
  });
  document.getElementById("totVotes").textContent = total;
  const w = document.getElementById("winner");
  if (!total) { w.hidden = true; }
  else {
    const top = sorted[0], tied = sorted.filter(e => votesFor(e.key) === votesFor(top.key)).length > 1;
    w.hidden = false;
    w.textContent = tied ? "It's a tie!" : "Winner: " + top.name;
  }
}
document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset all votes to zero?")) return;
  state.votes = {}; state.voterNo = 1; save();
  document.getElementById("voterNo").textContent = 1;
  setSlipCount();
  renderResults();
});

/* ---------- setup ---------- */
let pickedSym = SYM_KEYS[0];
function renderSetup() {
  const list = document.getElementById("candList");
  list.innerHTML = "";
  state.candidates.forEach((c, i) => {
    const row = document.createElement("div");
    row.className = "clist-row";
    row.innerHTML = '<span class="csym">' + SYMS[c.sym] + '</span>' +
      '<span class="cname">' + escapeHtml(c.name) + '</span>';
    const del = document.createElement("button");
    del.className = "crm"; del.type = "button"; del.textContent = "\u00d7";
    del.setAttribute("aria-label", "Remove " + c.name);
    del.addEventListener("click", () => {
      if (!confirm("Remove " + c.name + "? Votes will be reset.")) return;
      state.candidates.splice(i, 1);
      state.votes = {}; state.voterNo = 1; save();
      renderSetup(); renderBallot();
      document.getElementById("voterNo").textContent = 1;
      setSlipCount();
    });
    row.appendChild(del);
    list.appendChild(row);
  });
  const grid = document.getElementById("symGrid");
  grid.innerHTML = "";
  SYM_KEYS.forEach(k => {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = SYMS[k];
    b.setAttribute("aria-label", k);
    if (k === pickedSym) b.classList.add("sel");
    b.addEventListener("click", () => {
      pickedSym = k;
      grid.querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
    });
    grid.appendChild(b);
  });
}
document.getElementById("addBtn").addEventListener("click", () => {
  const inp = document.getElementById("newName");
  const name = inp.value.trim();
  if (!name) { inp.focus(); return; }
  state.candidates.push({name: name, sym: pickedSym});
  state.votes = {}; state.voterNo = 1; save();
  inp.value = "";
  renderSetup(); renderBallot();
  document.getElementById("voterNo").textContent = 1;
  setSlipCount();
});

renderBallot();
setSlipCount();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
