"use strict";
/* Mock EVM — ballot unit, VVPAT, control unit. All data stays on this device. */

const SYMS = {
  lotus: '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="8.5" rx="2.2" ry="5"/><ellipse cx="7.6" cy="10.5" rx="2" ry="4.4" transform="rotate(-35 7.6 10.5)"/><ellipse cx="16.4" cy="10.5" rx="2" ry="4.4" transform="rotate(35 16.4 10.5)"/><ellipse cx="4.6" cy="14" rx="1.8" ry="3.8" transform="rotate(-60 4.6 14)"/><ellipse cx="19.4" cy="14" rx="1.8" ry="3.8" transform="rotate(60 19.4 14)"/><path d="M7.5 19.5h9l-1.2 2.5H6.3z"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="10.5" width="10" height="10.5" rx="4"/><rect x="7.2" y="3.5" width="2.4" height="8" rx="1.2"/><rect x="10.4" y="2.5" width="2.4" height="9" rx="1.2"/><rect x="13.6" y="3.5" width="2.4" height="8" rx="1.2"/><rect x="3.6" y="9.5" width="2.6" height="7" rx="1.3" transform="rotate(-28 4.9 13)"/></svg>',
  broom: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="11" y="1" width="2.2" height="12" rx="1" transform="rotate(18 12 7)"/><path d="M8.5 13.5h9L19 21H7z"/></svg>',
  elephant: '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="13.5" cy="13" rx="6.5" ry="5.2"/><circle cx="6.8" cy="10.2" r="3.4"/><path d="M4.6 11.5c-1.6 2-1.7 5 .3 7.2l1.9-.7c-1.5-1.7-1.5-3.9-.4-5.7z"/><ellipse cx="9.2" cy="8.6" rx="1.9" ry="2.5"/><rect x="9.5" y="16" width="2.6" height="5" rx="1"/><rect x="14.5" y="16" width="2.6" height="5" rx="1"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.5 2.2"/></svg>',
  bicycle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="16.5" r="3.8"/><circle cx="18" cy="16.5" r="3.8"/><path d="M6 16.5l5-9h4l3 9M11 7.5L9.5 5h3M15 7.5l2-2"/></svg>',
  lamp: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="10" y="1.5" width="4" height="2.6" rx="1"/><path d="M9.5 4.5c-2.2 2-3.5 4.2-3.5 7h12c0-2.8-1.3-5-3.5-7z" opacity=".55"/><path d="M8 12.5h8l-1.2 4.5H9.2z"/><rect x="10.8" y="17.5" width="2.4" height="3" rx="1"/><ellipse cx="12" cy="22" rx="5" ry="1.3"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><path d="M7 18a5 5 0 0 1 10 0z" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8"><path d="M12 3v3.5M5.8 5.8l2.5 2.5M18.2 5.8l-2.5 2.5M3 12h3.5M17.5 12H21"/></g><rect x="2" y="19.5" width="20" height="2" fill="currentColor"/></svg>',
  leaves: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 2.5C7 6.5 6 11.5 7.2 19.5c6.5-1.2 10.3-5 11.3-11.5-3.5-3-6-4.5-8-5.5z"/><path d="M4 9c-1 4-.5 8 2 12 2.5-4 3-8 2-12-1.5-.5-2.8-.5-4 0z" opacity=".7"/></svg>',
  torch: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1c2.2 2.8 3.2 4.6 3.2 7a3.2 3.2 0 0 1-6.4 0c0-1 .4-2 1-2.8.3 1 1 1.6 2.2 1.6-.6-2-.2-4 0-5.8z"/><rect x="8" y="10" width="8" height="2.4" rx="1"/><rect x="10.9" y="12.4" width="2.2" height="9" rx="1"/></svg>',
  scales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M8 21h8M12 5.5L4.5 7.5M12 5.5l7.5 2"/><path d="M4.5 7.5L2 13.5a2.8 2.8 0 0 0 5 0L4.5 7.5zM19.5 7.5L17 13.5a2.8 2.8 0 0 0 5 0l-2.5-6z"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5.5C10 4 7 3.5 3.5 3.5v15c3.5 0 6.5.5 8.5 2 2-1.5 5-2 8.5-2v-15c-3.5 0-6.5.5-8.5 2zm0 0v15"/></svg>',
  nota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/></svg>'
};
const SYM_KEYS = Object.keys(SYMS).filter(k => k !== "nota");

const LS_KEY = "evm-mock-v2";
const DEFAULTS = () => ({
  candidates: [
    {name: "BJP", sym: "lotus"},
    {name: "Congress", sym: "hand"},
    {name: "AAP", sym: "broom"},
    {name: "BSP", sym: "elephant"},
    {name: "Samajwadi Party", sym: "bicycle"}
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
/* ---------- election result as PDF (no libraries) ---------- */
document.getElementById("pdfBtn").addEventListener("click", downloadResultPDF);
function downloadResultPDF() {
  const esc = s => String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const entries = allEntries().map(e => ({name: e.name, v: votesFor(e.key)}));
  const total = entries.reduce((x, e) => x + e.v, 0);
  const sorted = [...entries].sort((p, q) => q.v - p.v);
  const now = new Date();
  const dstr = now.toLocaleDateString("en-IN", {day: "2-digit", month: "short", year: "numeric"}) +
    " " + now.toLocaleTimeString("en-IN", {hour: "2-digit", minute: "2-digit"});
  let C = "";
  const T = (txt, x, y, size, bold) => {
    C += "BT /" + (bold ? "HB" : "H") + " " + size + " Tf " + x.toFixed(1) + " " + y.toFixed(1) +
      " Td (" + esc(txt) + ") Tj ET\n";
  };
  const line = (x1, y, x2) => { C += x1 + " " + y + " m " + x2 + " " + y + " l S\n"; };
  T("MOCK ELECTION RESULT", 60, 790, 20, true);
  T("Generated: " + dstr, 60, 768, 10, false);
  let y = 736;
  T("SL", 60, y, 11, true); T("CANDIDATE", 100, y, 11, true);
  T("VOTES", 400, y, 11, true); T("SHARE", 480, y, 11, true);
  line(60, y - 8, 545); y -= 28;
  sorted.forEach((e, i) => {
    const pct = total ? (e.v / total * 100).toFixed(1) + "%" : "0.0%";
    T(String(i + 1), 60, y, 11, false);
    T(e.name, 100, y, 11, false);
    T(String(e.v), 400, y, 11, false);
    T(pct, 480, y, 11, false);
    y -= 20;
  });
  line(60, y + 6, 545); y -= 16;
  T("TOTAL VOTES: " + total, 60, y, 12, true); y -= 26;
  const top = sorted[0], tied = sorted.filter(e => e.v === top.v).length > 1;
  T(total ? (tied ? "RESULT: TIE" : "WINNER: " + top.name.toUpperCase()) : "NO VOTES POLLED", 60, y, 13, true);
  T("Mock EVM app - for practice and voter awareness only.", 60, 60, 9, false);
  const objs = [];
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objs[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /H 5 0 R /HB 6 0 R >> >> >>";
  objs[4] = "<< /Length " + C.length + " >>\nstream\n" + C + "endstream";
  objs[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objs[6] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  let pdf = "%PDF-1.4\n"; const off = [0];
  for (let i = 1; i <= 6; i++) { off[i] = pdf.length; pdf += i + " 0 obj\n" + objs[i] + "\nendobj\n"; }
  const xref = pdf.length;
  pdf += "xref\n0 7\n0000000000 65535 f \n";
  for (let i = 1; i <= 6; i++) pdf += String(off[i]).padStart(10, "0") + " 00000 n \n";
  pdf += "trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF";
  const blob = new Blob([pdf], {type: "application/pdf"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "election-result.pdf";
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
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
