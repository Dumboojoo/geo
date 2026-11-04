/* =========================================================
   Übungsklausuren – Timer, Erwartungshorizont, Selbstbewertung
   ========================================================= */
(function () {
  'use strict';

  var THEME_KEY = 'geo-reliefsphaere-theme';
  var root = document.documentElement;
  function $(id) { return document.getElementById(id); }

  /* ---------- Hell / Dunkel ---------- */
  var themeBtn = $('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') ||
        (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* egal */ }
    });
  }

  /* ---------- Zeitplan aus den Teilaufgaben ---------- */
  var steps = [].slice.call(document.querySelectorAll('.st[data-min]'));
  var plan = [], acc = 0;
  steps.forEach(function (s) {
    acc += parseFloat(s.getAttribute('data-min')) || 0;
    plan.push({ el: s, label: s.getAttribute('data-label'), end: acc });
  });
  var TOTAL = parseFloat(document.body.getAttribute('data-minutes')) || acc || 90;

  /* ---------- Timer ---------- */
  var clock = $('tClock'), now = $('tNow'), startBtn = $('tStart'), resetBtn = $('tReset'), box = $('timer');
  var elapsed = 0, startedAt = null, tick = null, warned = false;

  function fmt(sec) {
    var neg = sec < 0;
    sec = Math.abs(Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (neg ? '+' : '') + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function current() { return elapsed + (startedAt ? (Date.now() - startedAt) / 1000 : 0); }
  function update() {
    var t = current(), left = TOTAL * 60 - t, min = t / 60;
    if (clock) clock.textContent = fmt(left);
    if (box) box.classList.toggle('over', left < 0);
    var active = null;
    for (var i = 0; i < plan.length; i++) { if (min < plan[i].end) { active = plan[i]; break; } }
    plan.forEach(function (p) { p.el.classList.toggle('now', !!startedAt && p === active); });
    if (now) {
      if (!startedAt && t === 0) now.textContent = TOTAL + ' Minuten · Start, wenn du bereit bist';
      else if (left < 0) now.textContent = 'Zeit ist um!';
      else if (active) now.textContent = 'Jetzt: ' + active.label + ' (bis Min. ' + Math.round(active.end) + ')';
      else now.textContent = 'Puffer: kontrollieren!';
    }
    if (left < 0 && !warned) {
      warned = true;
      if (now) now.textContent = 'Zeit ist um!';
    }
  }
  function start() {
    if (startedAt) {
      elapsed = current();
      startedAt = null;
      clearInterval(tick);
      startBtn.textContent = 'Weiter';
      if (box) box.classList.remove('running');
    } else {
      startedAt = Date.now();
      tick = setInterval(update, 500);
      startBtn.textContent = 'Pause';
      if (box) box.classList.add('running');
    }
    update();
  }
  function reset() {
    clearInterval(tick);
    elapsed = 0;
    startedAt = null;
    warned = false;
    if (startBtn) startBtn.textContent = 'Start';
    if (box) box.classList.remove('running', 'over');
    update();
  }
  if (startBtn) startBtn.addEventListener('click', start);
  if (resetBtn) resetBtn.addEventListener('click', reset);
  update();

  /* ---------- Erwartungshorizont ---------- */
  var solBtn = $('solBtn');
  if (solBtn) {
    solBtn.addEventListener('click', function () {
      var on = document.body.classList.toggle('show-sol');
      solBtn.setAttribute('aria-pressed', String(on));
      solBtn.textContent = on ? 'Lösung ausblenden' : 'Erwartungshorizont';
      if (on) {
        var s = document.querySelector('.sheet.solutions');
        if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  var printBtn = $('printBtn');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  /* ---------- Selbstbewertung ---------- */
  // Übliche Oberstufen-Tabelle (Richtwert): Mindestprozent je Notenpunkt
  var NP = [[95, 15], [90, 14], [85, 13], [80, 12], [75, 11], [70, 10], [65, 9], [60, 8], [55, 7], [50, 6], [45, 5], [40, 4], [33, 3], [27, 2], [20, 1], [0, 0]];
  var inputs = [].slice.call(document.querySelectorAll('.sc-grid input'));
  function calc() {
    var sum = 0, max = 0;
    inputs.forEach(function (inp) {
      var m = parseFloat(inp.getAttribute('max')) || 0;
      var v = parseFloat(String(inp.value).replace(',', '.'));
      if (isNaN(v)) v = 0;
      v = Math.max(0, Math.min(m, v));
      sum += v;
      max += m;
    });
    var pct = max ? sum / max * 100 : 0;
    var np = 0;
    for (var i = 0; i < NP.length; i++) { if (pct >= NP[i][0] - 1e-9) { np = NP[i][1]; break; } }
    if ($('scSum')) $('scSum').textContent = (Math.round(sum * 10) / 10).toString().replace('.', ',') + ' / ' + max;
    if ($('scPct')) $('scPct').textContent = Math.round(pct) + ' %';
    if ($('scNP')) $('scNP').textContent = np + (np === 1 ? ' Punkt' : ' Punkte');
  }
  inputs.forEach(function (inp) { inp.addEventListener('input', calc); });
  calc();
})();
