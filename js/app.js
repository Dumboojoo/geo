/* =========================================================
   Lernzettel Reliefsphäre – Fortschritt, Erklärstufen, Schnelltests
   Alles wird nur lokal im Browser gespeichert (localStorage).
   ========================================================= */
(function () {
  'use strict';

  var KEY = 'geo-reliefsphaere-v1';
  var THEME_KEY = 'geo-reliefsphaere-theme';
  var PTS_TOPIC = 10;
  var PTS_Q = 5;
  var LEVELS = [[1, 'Einfach'], [2, 'Normal'], [3, 'Genauer']];
  // Rang ab Anteil der maximal erreichbaren Punkte
  var RANKS = [
    [0, 'Staubkorn'],
    [0.06, 'Sandkorn'],
    [0.16, 'Kiesel'],
    [0.30, 'Geröll'],
    [0.46, 'Findling'],
    [0.62, 'Vulkan'],
    [0.80, 'Gebirge'],
    [1, 'Pangäa']
  ];
  // Gesteinsmuster je Kapitel (Richtung der Schraffur im Bohrkern)
  var TEX = ['0deg', '90deg', '45deg', '0deg', '-45deg', '135deg'];

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* privat / gesperrt */ } }
  };

  function load() {
    var s = null;
    try { s = JSON.parse(store.get(KEY)); } catch (e) { s = null; }
    if (!s || typeof s !== 'object') s = {};
    return {
      done: s.done && typeof s.done === 'object' ? s.done : {},
      quiz: s.quiz && typeof s.quiz === 'object' ? s.quiz : {},
      level: [1, 2, 3].indexOf(s.level) > -1 ? s.level : 2
    };
  }
  var state = load();
  function save() { store.set(KEY, JSON.stringify(state)); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function bars(n) {
    return '<span class="bars" data-n="' + n + '" aria-hidden="true"><i></i><i></i><i></i></span>';
  }
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hell / Dunkel ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') ||
        (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set(THEME_KEY, next);
    });
  }

  /* ---------- Themen aufbauen ---------- */
  var chapters = [].slice.call(document.querySelectorAll('.chapter'));
  var topics = [].slice.call(document.querySelectorAll('.topic'));
  var allQ = [];

  chapters.forEach(function (ch, ci) {
    ch._cc = ch.style.getPropertyValue('--cc');
    ch._tex = TEX[ci % TEX.length];
    ch.style.setProperty('--tex', ch._tex);
    ch._topics = [];
  });

  topics.forEach(function (t, i) {
    var ch = t.closest('.chapter');
    t._chapter = ch;
    ch._topics.push(t);
    t._no = (i + 1 < 10 ? '0' : '') + (i + 1);
    var head = t.querySelector('.topic-head');
    t._title = head.querySelector('h3').textContent;

    head.insertBefore(el('span', 'topic-no', t._no), head.firstChild);

    var btn = el('button', 'check');
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.title = 'Als verstanden abhaken (+' + PTS_TOPIC + ' Punkte)';
    btn.innerHTML = '<span class="tick" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5"/></svg></span><span class="lbl">Verstanden</span>';
    btn.addEventListener('click', function () { toggleDone(t.id, btn); });
    head.appendChild(btn);
    t._btn = btn;

    var tabs = el('div', 'tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Erklärstufe: ' + t._title);
    t._tabs = LEVELS.map(function (L) {
      var b = el('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('data-l', L[0]);
      b.innerHTML = bars(L[0]) + L[1];
      b.addEventListener('click', function () { setTopicLevel(t, L[0]); });
      tabs.appendChild(b);
      return b;
    });
    head.parentNode.insertBefore(tabs, head.nextSibling);

    var qs = [].slice.call(t.querySelectorAll('.q'));
    qs.forEach(function (q, qi) { setupQ(q, t.id + '-' + qi); });
    var quiz = t.querySelector('.quiz');
    if (quiz && qs.length) {
      var qh = el('div', 'quiz-head');
      qh.innerHTML = '<span class="overline">Schnelltest · <b>' + qs.length + ' Fragen</b> · je ' + PTS_Q + ' Punkte</span>';
      var rb = el('button', 'linkish', 'zurücksetzen');
      rb.type = 'button';
      rb.addEventListener('click', function () {
        qs.forEach(function (q) { delete state.quiz[q._id]; resetQ(q); });
        save();
        render();
      });
      qh.appendChild(rb);
      quiz.insertBefore(qh, quiz.firstChild);
    }
  });

  /* ---------- Schnelltest ---------- */
  function setupQ(q, id) {
    q._id = id;
    q._answer = parseInt(q.getAttribute('data-a'), 10);
    var ol = q.querySelector('ol');
    var items = [].slice.call(ol.children);
    var wrap = el('div', 'q-opts');
    q._btns = items.map(function (li, i) {
      var b = el('button');
      b.type = 'button';
      b.innerHTML = '<span class="k">' + 'ABCD'.charAt(i) + '</span><span>' + li.innerHTML + '</span>';
      b.addEventListener('click', function () { answer(q, i); });
      wrap.appendChild(b);
      return b;
    });
    ol.parentNode.insertBefore(wrap, ol.nextSibling);
    var why = q.querySelector('.why');
    if (why) {
      q._res = el('span', 'res');
      why.insertBefore(q._res, why.firstChild);
    }
    allQ.push(q);
    if (state.quiz[id] !== undefined) showQ(q, state.quiz[id]);
  }
  function answer(q, i) {
    if (state.quiz[q._id] !== undefined) return;
    var before = snapshot();
    state.quiz[q._id] = i;
    save();
    showQ(q, i);
    if (i === q._answer) floatText(q._btns[i], '+' + PTS_Q);
    render(before);
  }
  function showQ(q, i) {
    var right = i === q._answer;
    q.classList.add('answered');
    q.classList.toggle('is-right', right);
    q.classList.toggle('is-wrong', !right);
    q._btns.forEach(function (b, bi) {
      b.disabled = true;
      b.classList.toggle('right', bi === q._answer);
      b.classList.toggle('wrong', bi === i && !right);
    });
    if (q._res) q._res.textContent = right ? 'Richtig! ' : 'Leider nicht. ';
  }
  function resetQ(q) {
    q.classList.remove('answered', 'is-right', 'is-wrong');
    q._btns.forEach(function (b) { b.disabled = false; b.classList.remove('right', 'wrong'); });
  }

  /* ---------- Inhaltslisten & Bohrkern ---------- */
  var tocGrid = document.getElementById('tocGrid');
  var tocSide = document.getElementById('tocSide');
  var core = document.getElementById('core');
  var tocChecks = {}, sideLinks = {}, coreLinks = {}, tocCounts = [];

  chapters.forEach(function (ch, ci) {
    var short = ch.getAttribute('data-short') || ch.querySelector('h2').textContent;
    var roman = ch.querySelector('.chapter-no').textContent;

    if (tocGrid) {
      var card = el('div', 'toc-card');
      card.style.setProperty('--cc', ch._cc);
      var h = el('header');
      var h3 = el('h3');
      var a = el('a', null, roman + ' · ' + short);
      a.href = '#' + ch.id;
      h3.appendChild(a);
      var cnt = el('span', 'cnt');
      tocCounts[ci] = cnt;
      h.appendChild(h3);
      h.appendChild(cnt);
      card.appendChild(h);
      var ul = el('ul');
      ch._topics.forEach(function (t) {
        var li = el('li');
        var cb = el('input');
        cb.type = 'checkbox';
        cb.setAttribute('aria-label', t._title + ' verstanden');
        cb.addEventListener('change', function () { toggleDone(t.id, cb, cb.checked); });
        var la = el('a', null, t._no + '  ' + t._title);
        la.href = '#' + t.id;
        li.appendChild(cb);
        li.appendChild(la);
        ul.appendChild(li);
        tocChecks[t.id] = cb;
      });
      card.appendChild(ul);
      tocGrid.appendChild(card);
    }

    if (tocSide) {
      var chap = el('div', 'chap');
      chap.style.setProperty('--cc', ch._cc);
      chap.innerHTML = '<b>' + roman + '</b>' + short;
      tocSide.appendChild(chap);
      ch._topics.forEach(function (t) {
        var sa = el('a');
        sa.href = '#' + t.id;
        sa.style.setProperty('--cc', ch._cc);
        sa.style.setProperty('--tex', ch._tex);
        sa.innerHTML = '<span class="layer" aria-hidden="true"></span><span class="t"></span>';
        sa.querySelector('.t').textContent = t._title;
        tocSide.appendChild(sa);
        sideLinks[t.id] = sa;
      });
    }

    if (core) {
      ch._topics.forEach(function (t) {
        var ca = el('a');
        ca.href = '#' + t.id;
        ca.title = t._no + ' ' + t._title;
        ca.setAttribute('aria-label', t._title);
        ca.style.setProperty('--cc', ch._cc);
        ca.style.setProperty('--tex', ch._tex);
        core.appendChild(ca);
        coreLinks[t.id] = ca;
      });
    }
  });

  /* ---------- Punkte & Rang ---------- */
  function score() {
    var done = 0, right = 0;
    topics.forEach(function (t) { if (state.done[t.id]) done++; });
    allQ.forEach(function (q) { if (state.quiz[q._id] === q._answer) right++; });
    return {
      done: done,
      right: right,
      points: done * PTS_TOPIC + right * PTS_Q,
      max: topics.length * PTS_TOPIC + allQ.length * PTS_Q
    };
  }
  function rankIndex(s) {
    var f = s.max ? s.points / s.max : 0, idx = 0;
    RANKS.forEach(function (r, i) { if (f >= r[0] - 1e-9) idx = i; });
    return idx;
  }
  function chapterDone(ch) {
    return ch._topics.every(function (t) { return !!state.done[t.id]; });
  }
  function snapshot() {
    var s = score();
    return { rank: rankIndex(s), chapters: chapters.map(chapterDone), all: s.done === topics.length };
  }

  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var e = $(id); if (e) e.textContent = v; }

  function render(before) {
    var s = score();
    topics.forEach(function (t) {
      var d = !!state.done[t.id];
      t.classList.toggle('is-done', d);
      t._btn.setAttribute('aria-pressed', String(d));
      t._btn.querySelector('.lbl').textContent = d ? 'Verstanden' : 'Verstanden?';
      if (tocChecks[t.id]) {
        tocChecks[t.id].checked = d;
        tocChecks[t.id].parentNode.classList.toggle('done', d);
      }
      if (sideLinks[t.id]) sideLinks[t.id].classList.toggle('done', d);
      if (coreLinks[t.id]) coreLinks[t.id].classList.toggle('done', d);
    });
    chapters.forEach(function (ch, ci) {
      var n = ch._topics.filter(function (t) { return state.done[t.id]; }).length;
      var c = ch.querySelector('.chapter-count');
      if (c) c.innerHTML = '<b>' + n + '/' + ch._topics.length + '</b>verstanden';
      ch.classList.toggle('is-complete', n === ch._topics.length);
      if (tocCounts[ci]) tocCounts[ci].textContent = n + '/' + ch._topics.length;
    });

    var ri = rankIndex(s);
    setText('points', s.points);
    setText('pointsMax', s.max);
    setText('rankName', RANKS[ri][1]);
    setText('doneCount', s.done);
    setText('totalCount', topics.length);
    setText('quizCount', s.right);
    setText('quizTotal', allQ.length);
    var bar = $('rankBar'), next = $('rankNext');
    if (ri < RANKS.length - 1) {
      var lo = Math.ceil(RANKS[ri][0] * s.max), hi = Math.ceil(RANKS[ri + 1][0] * s.max);
      if (bar) bar.style.width = Math.max(0, Math.min(100, (s.points - lo) / (hi - lo) * 100)) + '%';
      if (next) next.textContent = 'Noch ' + (hi - s.points) + ' Punkte bis „' + RANKS[ri + 1][1] + '“';
    } else {
      if (bar) bar.style.width = '100%';
      if (next) next.textContent = 'Höchster Rang – alle Schichten freigelegt!';
    }
    var tp = $('topProgress');
    if (tp) tp.style.width = (s.done / topics.length * 100) + '%';

    if (before) {
      var now = snapshot();
      chapters.forEach(function (ch, ci) {
        if (now.chapters[ci] && !before.chapters[ci]) {
          toast('<b>Kapitel ' + ch.querySelector('.chapter-no').textContent + ' geschafft!</b> ' + (ch.getAttribute('data-msg') || ''));
        }
      });
      if (now.rank > before.rank) {
        toast('Neuer Rang: <b>' + RANKS[now.rank][1] + '</b>');
      }
      if (now.all && !before.all) finale();
    }
  }

  function toggleDone(id, origin, force) {
    var before = snapshot();
    var on = typeof force === 'boolean' ? force : !state.done[id];
    if (on) {
      state.done[id] = Date.now();
      var t = document.getElementById(id);
      burst(origin, t ? getComputedStyle(t).getPropertyValue('--cc').trim() : '');
      floatText(origin, '+' + PTS_TOPIC);
    } else {
      delete state.done[id];
    }
    save();
    render(before);
  }

  /* ---------- Erklärstufen ---------- */
  var levelBtns = [].slice.call(document.querySelectorAll('#levelSwitch button'));
  function setTopicLevel(t, l) {
    t.setAttribute('data-show', l);
    t._tabs.forEach(function (b) { b.setAttribute('aria-selected', String(+b.getAttribute('data-l') === l)); });
  }
  function setGlobalLevel(l, persist) {
    state.level = l;
    if (persist) save();
    topics.forEach(function (t) { setTopicLevel(t, l); });
    levelBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-l') === l)); });
  }
  levelBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      setGlobalLevel(+b.getAttribute('data-l'), true);
      toast('Alle Themen auf <b>' + LEVELS[+b.getAttribute('data-l') - 1][1] + '</b> umgestellt');
    });
  });
  setGlobalLevel(state.level, false);

  /* ---------- Effekte ---------- */
  var toasts = $('toasts');
  function toast(html) {
    if (!toasts) return;
    var t = el('div', 'toast');
    t.innerHTML = html;
    toasts.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3900);
  }
  function burst(origin, color, x, y, n) {
    if (reduceMotion || !origin) return;
    var r = origin.getBoundingClientRect();
    var cx = x != null ? x : r.left + r.width / 2;
    var cy = y != null ? y : r.top + r.height / 2;
    var c = color || '#c2410c';
    for (var i = 0; i < (n || 14); i++) {
      var s = el('span', 'shard');
      var a = Math.random() * Math.PI * 2, d = 40 + Math.random() * (n ? 220 : 70);
      var sz = 4 + Math.random() * 6;
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      s.style.width = sz + 'px';
      s.style.height = sz + 'px';
      s.style.background = i % 3 ? c : 'var(--ink)';
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', (Math.sin(a) * d - 24) + 'px');
      s.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      document.body.appendChild(s);
      setTimeout((function (node) { return function () { if (node.parentNode) node.parentNode.removeChild(node); }; })(s), 1000);
    }
  }
  function floatText(origin, text) {
    if (reduceMotion || !origin) return;
    var r = origin.getBoundingClientRect();
    var p = el('span', 'plus', text);
    p.style.left = (r.right - 18) + 'px';
    p.style.top = (r.top - 8) + 'px';
    document.body.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1000);
  }
  var finaleEl = $('finale');
  function finale() {
    if (!finaleEl) return;
    finaleEl.hidden = false;
    var card = finaleEl.querySelector('.finale-card');
    var colors = chapters.map(function (ch) { return getComputedStyle(ch).getPropertyValue('--cc').trim(); });
    colors.forEach(function (c, i) {
      setTimeout(function () { burst(card, c, innerWidth / 2, innerHeight / 2, 22); }, i * 120);
    });
    var close = finaleEl.querySelector('button');
    if (close) close.focus();
  }
  if (finaleEl) {
    finaleEl.addEventListener('click', function (e) {
      if (e.target === finaleEl || e.target.closest('[data-close]')) finaleEl.hidden = true;
    });
  }

  /* ---------- Zufallsthema & Zurücksetzen ---------- */
  var randBtn = $('randomTopic');
  if (randBtn) {
    randBtn.addEventListener('click', function () {
      var open = topics.filter(function (t) { return !state.done[t.id]; });
      if (!open.length) {
        toast('Alles abgehakt – <b>Zeit für eine Übungsklausur!</b>');
        return;
      }
      var t = open[Math.floor(Math.random() * open.length)];
      t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      t.classList.remove('flash');
      void t.offsetWidth;
      t.classList.add('flash');
    });
  }
  /* Lernzettel zurücksetzen – der Lernplan (eigener Speicher) bleibt unberührt */
  var NL = String.fromCharCode(10);
  [].slice.call(document.querySelectorAll('[data-reset]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!window.confirm('Den kompletten Lernzettel zurücksetzen?' + NL + NL + 'Alle Haken, Schnelltest-Ergebnisse, Punkte und der Rang werden gelöscht, die Erklärstufe wird wieder auf „Normal“ gestellt.' + NL + NL + 'Dein Lernplan bleibt so, wie er ist.')) return;
      state.done = {};
      state.quiz = {};
      setGlobalLevel(2, false);
      save();
      allQ.forEach(resetQ);
      render();
      window.scrollTo(0, 0);
      toast('Lernzettel zurückgesetzt – <b>auf ein Neues!</b> Dein Lernplan ist unverändert.');
    });
  });

  /* ---------- Aktives Thema in der Seitenleiste ---------- */
  if ('IntersectionObserver' in window && tocSide) {
    var active = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (active) active.classList.remove('active');
        active = sideLinks[e.target.id];
        if (active) active.classList.add('active');
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    topics.forEach(function (t) { io.observe(t); });
  }

  render();
})();
