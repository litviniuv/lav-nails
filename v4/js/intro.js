/* LAV intro: count 3-2-1-0, falling cards, dust, cracks from the digit corner,
   giant ЛАВ title, wall breaks along the cracks, page revealed. Decorative only. */
(function () {
  "use strict";

  window.__lavIntroStarted = true;

  var root = document.documentElement;
  var intro = document.querySelector(".intro");
  var SVGNS = "http://www.w3.org/2000/svg";
  var INERT = [".skip-link", ".site-header", "#mobile-menu", "#main", ".site-footer"];

  var timers = [];
  var raf = 0;
  var done = false;
  var skipping = false;
  var W = 0;
  var H = 0;
  var rnd = Math.random;

  var els = {};
  var geo = null;
  var noiseUrl = "";

  function reduced() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function at(ms, fn) {
    timers.push(window.setTimeout(function () {
      if (!done && !skipping) fn();
    }, ms));
  }

  function setInert(on) {
    INERT.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  }

  function cleanup() {
    if (done) return;
    done = true;
    timers.forEach(window.clearTimeout);
    timers = [];
    if (raf) window.cancelAnimationFrame(raf);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    root.classList.remove("intro-on");
    setInert(false);
    if (noiseUrl && window.URL && URL.revokeObjectURL) {
      try { URL.revokeObjectURL(noiseUrl); } catch (e) {}
    }
    window.__lavIntroDone = true;
    if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    if (location.hash.length > 1) {
      var target = null;
      try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
      if (target) target.scrollIntoView();
    }
  }

  function skip() {
    if (done || skipping) return;
    skipping = true;
    timers.forEach(window.clearTimeout);
    timers = [];
    if (intro && intro.animate) {
      var a = intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: "ease-out", fill: "forwards" });
      a.onfinish = cleanup;
      window.setTimeout(cleanup, 600);
    } else {
      cleanup();
    }
  }

  function onKey(e) {
    if (e.key === "Escape" || e.key === "Esc") skip();
  }

  var startW = 0;
  function onResize() {
    if (startW && Math.abs(window.innerWidth - startW) > 40) skip();
  }

  /* ---------- guards ---------- */
  if (!intro) return;
  if (reduced() || !root.classList.contains("intro-on") || !intro.animate) {
    cleanup();
    return;
  }

  /* ---------- helpers ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function d2(a, b) {
    var dx = a[0] - b[0], dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function polyLen(pts) {
    var L = 0;
    for (var i = 1; i < pts.length; i++) L += d2(pts[i - 1], pts[i]);
    return L;
  }

  function pathD(pts, ox, oy) {
    ox = ox || 0; oy = oy || 0;
    var s = "M" + (pts[0][0] - ox).toFixed(1) + " " + (pts[0][1] - oy).toFixed(1);
    for (var i = 1; i < pts.length; i++) s += "L" + (pts[i][0] - ox).toFixed(1) + " " + (pts[i][1] - oy).toFixed(1);
    return s;
  }

  function svgPath(d, w, hair) {
    var p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", d);
    p.setAttribute("stroke-width", w.toFixed(2));
    if (hair) p.setAttribute("class", "is-hair");
    return p;
  }

  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- wall noise (shared tile, blob URL keeps styles light) ---------- */
  function makeNoise(cb) {
    try {
      var c = document.createElement("canvas");
      c.width = c.height = 160;
      var ctx = c.getContext("2d");
      var img = ctx.createImageData(160, 160);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = (Math.random() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 14;
      }
      ctx.putImageData(img, 0, 0);
      if (c.toBlob && window.URL && URL.createObjectURL) {
        c.toBlob(function (b) {
          if (b) {
            noiseUrl = URL.createObjectURL(b);
            intro.style.setProperty("--intro-noise", "url(" + noiseUrl + ")");
          }
          cb();
        });
        return;
      }
    } catch (e) {}
    cb();
  }

  /* ---------- dust ---------- */
  function startDust() {
    var c = els.dust;
    var ctx = c.getContext && c.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = W < 700 ? 14 : 24;
    var ps = [];
    for (var i = 0; i < n; i++) {
      ps.push({
        x: rnd() * W, y: rnd() * H,
        r: 0.6 + rnd() * 1.3,
        vx: (rnd() - 0.5) * 0.012,
        vy: -(0.004 + rnd() * 0.012),
        a: 0.12 + rnd() * 0.3,
        ph: rnd() * 6.28
      });
    }
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(now - last, 50);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y < -4) { p.y = H + 4; p.x = rnd() * W; }
        if (p.x < -4) p.x = W + 4; else if (p.x > W + 4) p.x = -4;
        var tw = 0.65 + 0.35 * Math.sin(now * 0.0012 + p.ph);
        ctx.fillStyle = "rgba(243,236,223," + (p.a * tw).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      raf = window.requestAnimationFrame(frame);
    }
    raf = window.requestAnimationFrame(frame);
  }

  /* ---------- falling cards ---------- */
  var CARD_SRC = [
    ["images/work-01.jpg", 1], ["images/work-02.jpg", 1], ["images/work-03.jpg", 1],
    ["images/work-04.jpg", 1], ["images/work-05.jpg", 1], ["images/work-06.jpg", 1],
    ["images/interior-01.jpg", 0], ["images/interior-02.jpg", 0],
    ["images/interior-03.jpg", 0], ["images/interior-04.jpg", 0]
  ];

  function pickCards(n) {
    var works = CARD_SRC.filter(function (c) { return c[1]; });
    var inter = CARD_SRC.filter(function (c) { return !c[1]; });
    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    shuffle(works); shuffle(inter);
    var out = [works[0], inter[0], works[1], inter[1], works[2]];
    return out.slice(0, n);
  }

  function scheduleCards() {
    var list = pickCards(4);
    var starts = [120, 1270, 2420, 3520];
    list.forEach(function (c, i) {
      var img = new Image();
      img.decoding = "async";
      img.alt = "";
      img.src = c[0];
      at(starts[i], function () { dropCard(img, c[1], i); });
    });
  }

  function dropCard(img, isWork, i) {
    var base = Math.max(110, Math.min(W * 0.2, 230));
    var cw = isWork ? base : base * 1.25;
    var ch = isWork ? base * 1.22 : cw * 0.75;
    var card = el("figure", "intro-card", els.cards);
    card.style.width = cw.toFixed(0) + "px";
    card.style.height = ch.toFixed(0) + "px";
    card.appendChild(img);
    var left = i % 2 === 0;
    var x = left ? W * (0.1 + rnd() * 0.28) : W * (0.55 + rnd() * 0.28);
    x = Math.max(8, Math.min(W - cw - 8, x));
    var r0 = (left ? -1 : 1) * (3 + rnd() * 5);
    var r1 = r0 + (left ? 1 : -1) * (4 + rnd() * 6);
    var drift = (left ? 1 : -1) * (10 + rnd() * 30);
    var a = card.animate([
      { transform: "translate(" + x.toFixed(1) + "px," + (-ch - 60).toFixed(1) + "px) rotate(" + r0.toFixed(1) + "deg)" },
      { transform: "translate(" + (x + drift).toFixed(1) + "px," + (H + 60).toFixed(1) + "px) rotate(" + r1.toFixed(1) + "deg)" }
    ], { duration: 2350 + rnd() * 250, easing: "cubic-bezier(.33,.06,.62,.96)", fill: "forwards" });
    a.onfinish = function () { if (card.parentNode) card.parentNode.removeChild(card); };
  }

  /* ---------- digit ---------- */
  function setDigit(v) {
    var span = els.digitSpan;
    span.textContent = v;
    /* curtain: the new digit is unveiled top to bottom in the same place */
    span.animate([
      { clipPath: "inset(0 0 100% 0)", webkitClipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0 0)", webkitClipPath: "inset(0 0 0 0)" }
    ], { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" });
  }

  /* ---------- geometry: Voronoi wall, cracks are the shard edges ---------- */
  function clipHalf(poly, si, sj) {
    var mx = (si[0] + sj[0]) / 2, my = (si[1] + sj[1]) / 2;
    var nx = sj[0] - si[0], ny = sj[1] - si[1];
    function side(p) { return (p[0] - mx) * nx + (p[1] - my) * ny; }
    var out = [];
    for (var k = 0; k < poly.length; k++) {
      var a = poly[k], b = poly[(k + 1) % poly.length];
      var sa = side(a), sb = side(b);
      if (sa <= 0) out.push(a);
      if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
        var t = sa / (sa - sb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }

  function buildGeometry(O) {
    var cell = Math.max(88, Math.min(Math.min(W, H) / 5.2, 175));
    var seeds = [];
    /* ring of equidistant seeds makes the origin an exact vertex: cracks start at the digit */
    var ringR = cell * 0.55;
    var k = 7, gaps = [], tot = 0;
    for (var g = 0; g < k; g++) { var w = 0.55 + rnd() * 1.0; gaps.push(w); tot += w; }
    var ang = rnd() * Math.PI * 2;
    for (g = 0; g < k; g++) {
      ang += gaps[g] / tot * Math.PI * 2;
      seeds.push([O[0] + Math.cos(ang) * ringR, O[1] + Math.sin(ang) * ringR]);
    }
    var target = Math.round((W * H) / (cell * cell)) + k;
    var minD = cell * 0.66;
    for (var tries = 0; tries < target * 40 && seeds.length < target; tries++) {
      var c = [-0.04 * W + rnd() * W * 1.08, -0.04 * H + rnd() * H * 1.08];
      if (d2(c, O) < ringR * 1.35) continue;
      var ok = true;
      for (var s = 0; s < seeds.length; s++) {
        if (d2(c, seeds[s]) < minD) { ok = false; break; }
      }
      if (ok) seeds.push(c);
    }

    /* cells */
    var rect = [[0, 0], [W, 0], [W, H], [0, H]];
    var polys = [];
    for (var i = 0; i < seeds.length; i++) {
      var order = [];
      for (var j = 0; j < seeds.length; j++) if (j !== i) order.push(j);
      order.sort(function (a, b) { return d2(seeds[i], seeds[a]) - d2(seeds[i], seeds[b]); });
      var poly = rect.slice();
      for (var q = 0; q < order.length && poly.length; q++) {
        var sj = seeds[order[q]];
        var maxR = 0;
        for (var v = 0; v < poly.length; v++) maxR = Math.max(maxR, d2(poly[v], seeds[i]));
        if (d2(seeds[i], sj) > 2 * maxR + 1) break;
        poly = clipHalf(poly, seeds[i], sj);
      }
      if (poly.length >= 3) polys.push(poly);
    }

    /* snap vertices to shared nodes */
    var nodes = [];
    function nodeOf(p) {
      for (var n = 0; n < nodes.length; n++) {
        if (Math.abs(nodes[n][0] - p[0]) < 1.5 && Math.abs(nodes[n][1] - p[1]) < 1.5) return n;
      }
      nodes.push([p[0], p[1]]);
      return nodes.length - 1;
    }
    var cells = [];
    polys.forEach(function (poly) {
      var idx = [];
      poly.forEach(function (p) {
        var n = nodeOf(p);
        if (!idx.length || idx[idx.length - 1] !== n) idx.push(n);
      });
      while (idx.length > 1 && idx[0] === idx[idx.length - 1]) idx.pop();
      if (idx.length >= 3) cells.push({ idx: idx });
    });

    var E = 0.6;
    function sameSide(a, b) {
      return (a[0] < E && b[0] < E) || (a[0] > W - E && b[0] > W - E) ||
        (a[1] < E && b[1] < E) || (a[1] > H - E && b[1] > H - E);
    }

    function jitter(a, b) {
      var pts = [a, b];
      var L = d2(a, b);
      var depth = L > 90 ? 3 : L > 34 ? 2 : 1;
      for (var dd = 0; dd < depth; dd++) {
        var nxt = [pts[0]];
        for (var m = 1; m < pts.length; m++) {
          var p = pts[m - 1], r = pts[m];
          var l = d2(p, r);
          var amp = Math.min(l * 0.13, 10);
          var off = (rnd() - 0.5) * 2 * amp;
          var nx = -(r[1] - p[1]) / (l || 1), ny = (r[0] - p[0]) / (l || 1);
          nxt.push([(p[0] + r[0]) / 2 + nx * off, (p[1] + r[1]) / 2 + ny * off]);
          nxt.push(r);
        }
        pts = nxt;
      }
      return pts;
    }

    /* edges */
    var edges = {};
    var edgeList = [];
    cells.forEach(function (c) {
      c.edges = [];
      for (var m = 0; m < c.idx.length; m++) {
        var a = c.idx[m], b = c.idx[(m + 1) % c.idx.length];
        var lo = Math.min(a, b), hi = Math.max(a, b);
        var key = lo + "_" + hi;
        var e = edges[key];
        if (!e) {
          var crack = !sameSide(nodes[lo], nodes[hi]);
          e = edges[key] = {
            a: lo, b: hi, crack: crack,
            pts: crack ? jitter(nodes[lo], nodes[hi]) : [nodes[lo], nodes[hi]]
          };
          e.len = polyLen(e.pts);
          edgeList.push(e);
        }
        c.edges.push({ e: e, fwd: a === lo });
      }
      var pts = [];
      c.edges.forEach(function (ce) {
        var seg = ce.fwd ? ce.e.pts : ce.e.pts.slice().reverse();
        for (var z = 0; z < seg.length - 1; z++) pts.push(seg[z]);
      });
      c.pts = pts;
      var cx = 0, cy = 0;
      c.idx.forEach(function (n) { cx += nodes[n][0]; cy += nodes[n][1]; });
      c.cen = [cx / c.idx.length, cy / c.idx.length];
    });

    /* uneven spread: Dijkstra over crack edges with random weights */
    var adj = nodes.map(function () { return []; });
    edgeList.forEach(function (e) {
      if (!e.crack || e.len < 0.5) return;
      var wgt = e.len * (0.55 + rnd() * 1.3);
      adj[e.a].push([e.b, wgt]);
      adj[e.b].push([e.a, wgt]);
    });
    var src = 0, best = Infinity;
    nodes.forEach(function (n, ii) {
      var dd = d2(n, O);
      if (dd < best && adj[ii].length) { best = dd; src = ii; }
    });
    var dist = nodes.map(function () { return Infinity; });
    var seen = nodes.map(function () { return false; });
    dist[src] = 0;
    for (var it = 0; it < nodes.length; it++) {
      var u = -1, bu = Infinity;
      for (var x = 0; x < nodes.length; x++) if (!seen[x] && dist[x] < bu) { bu = dist[x]; u = x; }
      if (u < 0) break;
      seen[u] = true;
      adj[u].forEach(function (pr) {
        if (dist[u] + pr[1] < dist[pr[0]]) dist[pr[0]] = dist[u] + pr[1];
      });
    }
    var maxD = 1;
    edgeList.forEach(function (e) {
      if (!e.crack) return;
      var m0 = Math.min(dist[e.a], dist[e.b]);
      if (isFinite(m0)) maxD = Math.max(maxD, m0);
    });

    /* staircase timing: short burst, pause, next burst... last ones denser */
    var STEP = [0, 430, 830, 1180, 1480];
    var SPAN = 250;
    var crackEnd = 0;
    edgeList.forEach(function (e) {
      if (!e.crack) return;
      var da = dist[e.a], db = dist[e.b];
      var m0 = Math.min(da, db);
      if (!isFinite(m0)) m0 = maxD;
      var t = Math.min(1, m0 / maxD);
      var st = Math.min(4, Math.floor(t * 5));
      var within = t * 5 - st;
      e.delay = STEP[st] + within * SPAN + rnd() * 60;
      e.dur = Math.max(90, Math.min(e.len / 0.85, 420));
      e.w = 2.3 - 1.4 * t;
      e.draw = da <= db ? e.pts : e.pts.slice().reverse();
      crackEnd = Math.max(crackEnd, e.delay + e.dur);
    });

    /* hairline branches inside cells, drawn in the last, densest step */
    cells.forEach(function (c) {
      c.hairs = [];
      if (rnd() > 0.6) return;
      var cand = c.idx.filter(function (n) { return adj[n].length; });
      if (!cand.length) return;
      var v0 = nodes[cand[Math.floor(rnd() * cand.length)]];
      var dx = c.cen[0] - v0[0], dy = c.cen[1] - v0[1];
      var L = Math.sqrt(dx * dx + dy * dy) * (0.3 + rnd() * 0.35);
      var a0 = Math.atan2(dy, dx) + (rnd() - 0.5) * 0.8;
      var pts = [v0];
      var steps = 3;
      for (var h = 1; h <= steps; h++) {
        var aa = a0 + (rnd() - 0.5) * 0.7;
        var pr = pts[pts.length - 1];
        pts.push([pr[0] + Math.cos(aa) * L / steps, pr[1] + Math.sin(aa) * L / steps]);
      }
      var hair = { draw: pts, len: polyLen(pts), w: 0.85, delay: 1550 + rnd() * 520 };
      hair.dur = Math.max(120, hair.len / 0.5);
      crackEnd = Math.max(crackEnd, hair.delay + hair.dur);
      c.hairs.push(hair);
    });

    return { cells: cells, edges: edgeList, O: O, crackEnd: crackEnd };
  }

  /* ---------- DOM for cracks and shards ---------- */
  function buildCracks() {
    var svg = els.cracks;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var all = [];
    geo.edges.forEach(function (e) {
      if (!e.crack || e.len < 0.5) return;
      var p = svgPath(pathD(e.draw), e.w, false);
      all.push([p, e]);
    });
    geo.cells.forEach(function (c) {
      c.hairs.forEach(function (h) { all.push([svgPath(pathD(h.draw), h.w, true), h]); });
    });
    all.forEach(function (pe) {
      var L = (pe[1].len + 2).toFixed(1);
      pe[0].style.strokeDasharray = L + " " + L;
      pe[0].style.strokeDashoffset = L;
      svg.appendChild(pe[0]);
    });
    geo.crackPaths = all;
  }

  function runCracks() {
    var all = geo.crackPaths;
    all.forEach(function (pe) {
      pe[0].style.transition = "stroke-dashoffset " + pe[1].dur.toFixed(0) + "ms cubic-bezier(.3,.6,.4,1) " + pe[1].delay.toFixed(0) + "ms";
    });
    void els.cracks.getBoundingClientRect();
    all.forEach(function (pe) { pe[0].style.strokeDashoffset = "0"; });
  }

  function buildShards() {
    var frag = document.createDocumentFragment();
    geo.cells.forEach(function (c) {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      c.pts.forEach(function (p) {
        minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]);
        maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
      });
      var bx = Math.floor(minX) - 1, by = Math.floor(minY) - 1;
      var bw = Math.ceil(maxX) + 1 - bx, bh = Math.ceil(maxY) + 1 - by;
      if (bw < 2 || bh < 2) return;
      var d = el("div", "intro-shard");
      d.style.left = bx + "px";
      d.style.top = by + "px";
      d.style.width = bw + "px";
      d.style.height = bh + "px";
      var pos = (-bx) + "px " + (-by) + "px";
      d.style.backgroundPosition = [pos, pos, pos, pos].join(",");
      var cp = "polygon(" + c.pts.map(function (p) {
        return (p[0] - bx).toFixed(1) + "px " + (p[1] - by).toFixed(1) + "px";
      }).join(",") + ")";
      d.style.webkitClipPath = cp;
      d.style.clipPath = cp;
      var svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("viewBox", "0 0 " + bw + " " + bh);
      svg.setAttribute("focusable", "false");
      c.edges.forEach(function (ce) {
        if (!ce.e.crack) return;
        /* half of the stroke is clipped away, so double it to match the drawn crack */
        svg.appendChild(svgPath(pathD(ce.e.pts, bx, by), ce.e.w * 2, false));
      });
      c.hairs.forEach(function (h) { svg.appendChild(svgPath(pathD(h.draw, bx, by), h.w, true)); });
      d.appendChild(svg);
      c.el = d;
      c.bx = bx; c.by = by; c.bw = bw; c.bh = bh;
      frag.appendChild(d);
    });
    els.shards.appendChild(frag);
  }

  /* ---------- break ---------- */
  function breakWall() {
    var O = geo.O;
    var cells = geo.cells.filter(function (c) { return c.el; });
    var maxD = 1;
    cells.forEach(function (c) { c.dO = d2(c.cen, O); maxD = Math.max(maxD, c.dO); });

    intro.classList.add("is-split");
    els.digit.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: "ease-out", fill: "forwards" });
    els.dust.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1200, easing: "ease-out", fill: "forwards" });

    /* step 1: pieces loosen along the cracks (a few px, once) */
    cells.forEach(function (c) {
      var dx = c.cen[0] - O[0], dy = c.cen[1] - O[1];
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      var n = 2 + rnd() * 4;
      c.nx = dx / l * n; c.ny = dy / l * n;
      c.nr = (rnd() - 0.5) * 1.6;
      c.el.style.willChange = "transform";
      c.el.animate([
        { transform: "translate(0px,0px) rotate(0deg)" },
        { transform: "translate(" + c.nx.toFixed(1) + "px," + c.ny.toFixed(1) + "px) rotate(" + c.nr.toFixed(2) + "deg)" }
      ], { duration: 380, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
      var t = c.dO / maxD;
      c.wave = Math.min(3, Math.floor((t * 0.75 + rnd() * 0.38) * 4));
    });

    /* steps 2..5: waves of pieces drop and slide out below */
    var WAVE = [520, 900, 1260, 1600];
    var last = 0;
    cells.forEach(function (c) {
      var delay = WAVE[c.wave] + rnd() * 240;
      var dur = 1150 + rnd() * 380;
      last = Math.max(last, delay + dur);
      at(delay, function () {
        var dirX = c.cen[0] - O[0] >= 0 ? 1 : -1;
        var fx = c.nx + dirX * (16 + rnd() * 60) + (rnd() - 0.5) * 40;
        var fy = c.ny + (H - c.by) + c.bh + 60 + rnd() * H * 0.25;
        var fr = c.nr + (rnd() < 0.5 ? -1 : 1) * (8 + rnd() * 26);
        var from = "translate(" + c.nx.toFixed(1) + "px," + c.ny.toFixed(1) + "px) rotate(" + c.nr.toFixed(2) + "deg)";
        var to = "translate(" + fx.toFixed(1) + "px," + fy.toFixed(1) + "px) rotate(" + fr.toFixed(1) + "deg)";
        c.el.animate([
          { transform: from, opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.72 },
          { transform: to, opacity: 0, offset: 1 }
        ], { duration: dur, easing: "cubic-bezier(.45,0,.85,.45)", fill: "forwards" });
      });
    });

    /* title leaves with the last pieces */
    var titleOut = WAVE[3] - 150;
    at(titleOut, function () {
      els.title.animate([
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(-3vh) scale(1.04)" }
      ], { duration: 1000, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    });

    at(Math.max(last, titleOut + 1000) + 120, cleanup);
  }

  /* ---------- timeline ---------- */
  function run() {
    W = window.innerWidth;
    H = window.innerHeight;
    startW = W;
    rnd = mulberry32((Math.random() * 4294967296) >>> 0);
    intro.style.setProperty("--iw", W + "px");
    intro.style.setProperty("--ih", H + "px");

    els.back = el("div", "intro__back");
    els.shards = el("div", "intro__shards");
    els.dust = el("canvas", "intro__dust");
    els.cards = el("div", "intro__cards");
    els.cracks = document.createElementNS(SVGNS, "svg");
    els.cracks.setAttribute("class", "intro__cracks");
    els.cracks.setAttribute("focusable", "false");
    els.digit = intro.querySelector(".intro__digit");
    els.digitSpan = els.digit.querySelector("span");
    els.title = intro.querySelector(".intro__title");
    [els.back, els.shards, els.dust, els.cards, els.cracks].reverse().forEach(function (n) {
      intro.insertBefore(n, intro.firstChild);
    });

    startDust();
    scheduleCards();
    at(1000, function () { setDigit("2"); });
    at(2000, function () { setDigit("1"); });
    at(3000, function () { setDigit("0"); });

    /* geometry from the digit corner */
    var r = els.digitSpan.getBoundingClientRect();
    var O = [Math.min(W * 0.5, r.left + r.width * 0.8), Math.max(H * 0.5, r.top + r.height * 0.52)];
    geo = buildGeometry(O);
    buildCracks();
    buildShards();

    var CRACK = 3250;
    at(CRACK, runCracks);
    var TITLE = CRACK + geo.crackEnd - 80;
    at(TITLE, function () {
      els.title.animate([
        { opacity: 0, transform: "scale(.965)" },
        { opacity: 1, transform: "scale(1)" }
      ], { duration: 820, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" });
    });
    at(TITLE + 900, breakWall);

    /* hard stop in case timers were throttled */
    at(16000, cleanup);
  }

  function begin() {
    startW = window.innerWidth;
    setInert(true);
    window.scrollTo(0, 0);
    intro.addEventListener("click", skip);
    intro.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    var started = false;
    function go() {
      if (started || done) return;
      started = true;
      makeNoise(run);
    }
    function whenVisible() {
      if (!document.hidden) { go(); return; }
      document.addEventListener("visibilitychange", function onVis() {
        if (!document.hidden) {
          document.removeEventListener("visibilitychange", onVis);
          go();
        }
      });
    }
    /* wait for the serif (max ~0.9s) so the digit does not swap fonts mid-count */
    if (document.fonts && document.fonts.load) {
      var t = window.setTimeout(whenVisible, 900);
      document.fonts.load('700 120px "Cormorant Garamond"').then(function () {
        window.clearTimeout(t); whenVisible();
      }, function () {
        window.clearTimeout(t); whenVisible();
      });
    } else {
      whenVisible();
    }
  }

  begin();
})();
