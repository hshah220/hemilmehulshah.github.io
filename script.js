(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Theme toggle ---------- */
  $('#themeToggle').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menuToggle'), navEl = $('.nav nav');
  menuBtn.addEventListener('click', function () {
    var open = navEl.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#navlinks a').forEach(function (a) {
    a.addEventListener('click', function () { navEl.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); });
  });

  /* ---------- Typing terminal ---------- */
  var body = $('#termBody');
  var lines = [];
  try { lines = JSON.parse(body.getAttribute('data-lines')); } catch (e) {}
  function el(cls, text) { var p = document.createElement('p'); if (cls) p.className = cls; p.textContent = text || ''; return p; }
  var caret = document.createElement('span'); caret.className = 'caret';

  function renderStatic() {
    body.innerHTML = '';
    lines.forEach(function (l) { body.appendChild(el('p', l.cmd)); body.lastChild.className = 'p'; body.appendChild(el('o', l.out)); });
    var last = el('p', ''); last.className = 'p'; last.appendChild(caret); body.appendChild(last);
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function typeIntro() {
    body.innerHTML = '';
    for (var i = 0; i < lines.length; i++) {
      var cmdLine = el('p', ''); cmdLine.className = 'p'; body.appendChild(cmdLine);
      cmdLine.appendChild(caret);
      var txt = document.createTextNode(''); cmdLine.insertBefore(txt, caret);
      for (var c = 0; c < lines[i].cmd.length; c++) { txt.nodeValue += lines[i].cmd[c]; await sleep(45 + Math.random() * 45); }
      await sleep(260);
      var out = el('o', lines[i].out); body.appendChild(out);
      await sleep(380);
    }
    var last = el('p', ''); last.className = 'p'; body.appendChild(last); last.appendChild(caret);
  }
  if (lines.length) { reduce ? renderStatic() : typeIntro(); }

  /* ---------- Scroll progress ---------- */
  var prog = $('#progress');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Reveal on scroll, counters, skill bars ---------- */
  function countUp(node) {
    var target = parseFloat(node.getAttribute('data-count')), dec = parseInt(node.getAttribute('data-dec') || '0', 10);
    if (reduce) { node.textContent = target.toFixed(dec); return; }
    var start = performance.now(), dur = 1200;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      node.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target; t.classList.add('in');
        $$('[data-count]', t).forEach(countUp);
        $$('.bar', t).forEach(function (b) { b.style.setProperty('--w', b.getAttribute('data-v') + '%'); b.querySelector('i').style.setProperty('--w', b.getAttribute('data-v') + '%'); });
        io.unobserve(t);
      });
    }, { threshold: 0.15 });
    $$('.reveal').forEach(function (n) { io.observe(n); });
  } else {
    document.documentElement.classList.add('js-off');
    $$('[data-count]').forEach(countUp);
    $$('.bar').forEach(function (b) { b.querySelector('i').style.setProperty('--w', b.getAttribute('data-v') + '%'); });
  }

  /* ---------- Scrollspy ---------- */
  var links = $$('[data-spy]');
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute('data-spy')); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-spy') === en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { if (s) spy.observe(s); });
  }

  /* ---------- Expand / collapse jobs ---------- */
  var allOpen = false;
  $('#expandAll').addEventListener('click', function () {
    allOpen = !allOpen;
    $$('.job details').forEach(function (d) { d.open = allOpen; });
    this.textContent = allOpen ? 'collapse all' : 'expand all';
  });

  /* ---------- Project filter ---------- */
  var chips = $$('.chip'), cards = $$('.proj');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) { var on = c === chip; c.classList.toggle('active', on); c.setAttribute('aria-pressed', String(on)); });
      cards.forEach(function (card) {
        var show = f === 'all' || card.getAttribute('data-tags').split(' ').indexOf(f) > -1;
        card.classList.toggle('hide', !show);
        if (show) card.classList.add('in');
      });
    });
  });

  /* ---------- Background: drifting node graph ---------- */
  var cv = $('#bg'), ctx = cv.getContext('2d'), pts = [], W, H;
  function size() {
    var d = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * d; H = cv.height = innerHeight * d; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(d, d);
    var n = Math.round((innerWidth * innerHeight) / 24000);
    pts = []; for (var i = 0; i < n; i++) pts.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 });
  }
  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    var col = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6dffb0';
    ctx.fillStyle = col; ctx.strokeStyle = col;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > innerWidth) p.vx *= -1; if (p.y < 0 || p.y > innerHeight) p.vy *= -1; }
      ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, 6.283); ctx.fill();
      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, dist = dx * dx + dy * dy;
        if (dist < 14000) { ctx.globalAlpha = (1 - dist / 14000) * .22; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      }
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  size(); draw();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (reduce) draw(); }, 150); });
})();
