/* =========================================================
   Lernplan – Uhrzeiten, Modus, Abhaken
   Alles wird nur lokal im Browser gespeichert (localStorage).
   ========================================================= */
(function () {
  'use strict';

  var KEY = 'geo-reliefsphaere-plan-v1';
  var THEME_KEY = 'geo-reliefsphaere-theme';
  var root = document.documentElement;
  function $(id) { return document.getElementById(id); }
  function $$(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* privat / gesperrt */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* egal */ } }
  };

  function roundedNow() {
    var d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    m = Math.ceil(m / 5) * 5;
    return toHHMM(m);
  }
  function toHHMM(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function toMin(hhmm) {
    var p = String(hhmm || '').split(':');
    var h = parseInt(p[0], 10), m = parseInt(p[1], 10);
    return isNaN(h) || isNaN(m) ? null : h * 60 + m;
  }

  var state;
  try { state = JSON.parse(store.get(KEY)); } catch (e) { state = null; }
  if (!state || typeof state !== 'object') state = {};
  if (!state.done || typeof state.done !== 'object') state.done = {};
  if (state.mode !== 'kompakt') state.mode = 'voll';
  if (toMin(state.start) == null) state.start = roundedNow();
  function save() { store.set(KEY, JSON.stringify(state)); }

  /* ---------- Hell / Dunkel ---------- */
  var themeBtn = $('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') ||
        (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set(THEME_KEY, next);
    });
  }

  /* ---------- Toasts ---------- */
  var toasts = $('toasts');
  function toast(html) {
    if (!toasts) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = html;
    toasts.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3900);
  }

  /* ---------- Haken einbauen ---------- */
  var TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 L6.5 12 L13 4.5"/></svg>';
  var tasks = $$('.tasks > li[data-id]');
  tasks.forEach(function (li) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'box-tick';
    b.innerHTML = TICK;
    li.insertBefore(b, li.firstChild);
    li.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) return;
      toggle(li);
    });
  });

  function toggle(li) {
    var id = li.getAttribute('data-id');
    var block = li.closest('.pblock');
    var wasDone = block && block.classList.contains('done');
    if (state.done[id]) delete state.done[id]; else state.done[id] = 1;
    save();
    render();
    if (block && !wasDone && block.classList.contains('done')) {
      var h = block.querySelector('h3');
      toast('<b>Block geschafft!</b> ' + (h ? h.textContent : ''));
    }
    if (countDone().done === countDone().all && state.done[id]) {
      toast('<b>Alles erledigt!</b> Jetzt schlafen – du bist bereit für die 11 Punkte.');
    }
  }

  function visible(li) {
    return !(state.mode === 'kompakt' && li.classList.contains('extra'));
  }
  function countDone() {
    var all = 0, done = 0;
    tasks.forEach(function (li) {
      if (!visible(li)) return;
      all++;
      if (state.done[li.getAttribute('data-id')]) done++;
    });
    return { all: all, done: done };
  }

  /* ---------- Uhrzeiten ---------- */
  var items = $$('#daylist > li');
  function minutes(li) {
    var v = li.getAttribute(state.mode === 'kompakt' ? 'data-min-k' : 'data-min');
    return parseFloat(v) || 0;
  }

  function render() {
    document.body.setAttribute('data-mode', state.mode);
    $$('#modeSwitch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === state.mode));
    });

    var start = toMin(state.start);
    var d = new Date(), nowMin = d.getHours() * 60 + d.getMinutes();
    if (nowMin < start - 120) nowMin += 1440; // nach Mitternacht
    var t = start, nowEl = null;

    items.forEach(function (li) {
      var len = minutes(li);
      var tEl = li.querySelector('.ptime'), dEl = li.querySelector('.pdur');
      if (tEl) tEl.textContent = toHHMM(t);
      if (dEl) dEl.textContent = len + ' Min.';
      var isNow = nowMin >= t && nowMin < t + len;
      li.classList.toggle('now', isNow && li.classList.contains('pblock'));
      if (isNow) nowEl = li;
      t += len;

      if (li.classList.contains('pblock')) {
        var own = $$('.tasks > li[data-id]', li).filter(visible);
        var ok = own.length > 0 && own.every(function (x) { return state.done[x.getAttribute('data-id')]; });
        li.classList.toggle('done', ok);
      }
    });

    tasks.forEach(function (li) {
      var on = !!state.done[li.getAttribute('data-id')];
      li.classList.toggle('done', on);
      var b = li.querySelector('.box-tick');
      if (b) {
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', (on ? 'Erledigt: ' : 'Abhaken: ') + li.textContent.trim().slice(0, 60));
      }
    });

    // Ende + Hinweis
    var fin = $('finish');
    if (fin) {
      var endAbs = t, total = t - start;
      var h = Math.floor(total / 60), m = total % 60;
      var late = endAbs > 23 * 60;
      fin.innerHTML = 'Fertig um ca. <b>' + toHHMM(endAbs) + ' Uhr</b> (' + h + ' h' + (m ? ' ' + m + ' Min.' : '') + ' inkl. Pausen)' +
        (late ? (state.mode === 'voll'
          ? '<br>Das wird spät. Nimm lieber <b>Kompakt</b> – Schlaf bringt mehr als die letzte Stunde.'
          : '<br>Das wird spät. Kürze Block 9 und schlaf lieber.') : '');
      fin.classList.toggle('late', late);
    }

    // Fortschritt
    var c = countDone();
    $('doneTasks').textContent = c.done;
    $('allTasks').textContent = c.all;
    var pct = c.all ? (c.done / c.all) * 100 : 0;
    $('planBar').style.width = pct + '%';
    $('topProgress').style.width = pct + '%';

    // Button „aktueller Block“
    $$('#jetzt').forEach(function (x) { x.removeAttribute('id'); });
    var target = nowEl && nowEl.classList.contains('pblock') ? nowEl : null;
    if (!target) target = items.filter(function (x) { return x.classList.contains('pblock') && !x.classList.contains('done'); })[0];
    var btn = $('nowBtn');
    if (target) {
      target.id = 'jetzt';
      if (btn) { btn.hidden = false; btn.textContent = (nowEl === target ? 'Zum aktuellen Block' : 'Zum nächsten offenen Block') + ' →'; }
    } else if (btn) {
      btn.hidden = true;
    }
  }

  /* ---------- Bedienung ---------- */
  var startInput = $('startTime');
  if (startInput) {
    startInput.value = state.start;
    startInput.addEventListener('change', function () {
      if (toMin(startInput.value) == null) return;
      state.start = startInput.value;
      save();
      render();
    });
  }
  $$('#modeSwitch button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.mode = b.getAttribute('data-mode');
      save();
      render();
    });
  });
  var reset = $('resetPlan');
  if (reset) {
    reset.addEventListener('click', function () {
      if (!confirm('Alle Haken im Lernplan entfernen und Startzeit auf jetzt setzen?')) return;
      state = { done: {}, mode: state.mode, start: roundedNow() };
      if (startInput) startInput.value = state.start;
      save();
      render();
    });
  }

  render();
  setInterval(render, 60000);
})();
