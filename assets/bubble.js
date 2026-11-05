/* Thought-bubble buttons, drawn like the white thought bubble in the DUH logo.

   Every accented button (.btn that isn't .ghost, plus Kit's signup button) gets its own
   hand-inked oval cloud: scallops of uneven size around a slightly wobbly, slightly tilted
   ellipse, a black outline of uneven weight, a hard black shadow falling down and left,
   and two white puffs trailing off the bottom left. The drawing is seeded from the
   button's label and its place on the page, so it stays the same on every visit, but no
   two buttons share a drawing. It redraws itself when the button changes size.

   Without JavaScript the button falls back to a plain white CSS oval (see bubble.css). */
(function (root) {
  'use strict';
  var INK = '#0D0A0F';

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // smooth periodic wobble around the ellipse, roughly in [-1, 1]
  function wobble(r) {
    var terms = [];
    for (var k = 2; k <= 5; k++) terms.push([k, r() * Math.PI * 2, (r() * 0.6 + 0.4) / k]);
    var norm = terms.reduce(function (s, t) { return s + t[2]; }, 0);
    return function (p) {
      var v = 0;
      for (var i = 0; i < terms.length; i++) v += terms[i][2] * Math.sin(terms[i][0] * p + terms[i][1]);
      return v / norm;
    };
  }
  function f(n) { return Math.round(n * 10) / 10; }
  function path(pts) {
    var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (var i = 1; i < pts.length; i++) d += 'L' + f(pts[i][0]) + ' ' + f(pts[i][1]);
    return d + 'Z';
  }

  // Draw one cloud for a box of w x h CSS px. Returns the SVG markup and how far it
  // reaches past the box on each side (so the caller can position it).
  function drawCloud(w, h, seed, tailLeft) {
    var r = rng(seed);
    var pad = tailLeft ? { l: 40, t: 10, r: 10, b: 14 } : { l: 26, t: 10, r: 10, b: 36 };
    var W = w + pad.l + pad.r, H = h + pad.t + pad.b;
    var cx = pad.l + w / 2, cy = pad.t + h / 2;
    var inset = 6.5;  // keep in step with INSET below
    var a = Math.max(w / 2 - inset, 12), b = Math.max(h / 2 - inset, 10);
    var tilt = (r() - 0.5) * 0.06;                 // up to about 1.7 degrees
    var wob = wobble(r), wob2 = wobble(r);
    var big = h < 56 ? 0.85 : 1;                    // smaller buttons get smaller scallops

    // arc-length table so scallops are spaced by length, not angle
    var M = 720, cum = [0], i;
    for (i = 1; i <= M; i++) {
      var p0 = (i - 1) / M * Math.PI * 2, p1 = i / M * Math.PI * 2;
      cum.push(cum[i - 1] + Math.hypot(a * (Math.cos(p1) - Math.cos(p0)), b * (Math.sin(p1) - Math.sin(p0))));
    }
    var per = cum[M];
    var n = Math.max(7, Math.round(per / ((27 + r() * 5) * big)));
    var wts = [], tot = 0;
    for (i = 0; i < n; i++) { var x = 0.65 + r() * 0.7; wts.push(x); tot += x; }
    var start = r() * per, edges = [], acc = start;
    for (i = 0; i <= n; i++) { edges.push(acc); acc += (wts[i % n] / tot) * per; }
    function phiAt(len) {
      len = ((len % per) + per) % per;
      var lo = 0, hi = M;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cum[mid] < len) lo = mid; else hi = mid; }
      var t = (len - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
      return (lo + t) / M * Math.PI * 2;
    }
    var heights = [];
    for (i = 0; i < n; i++) {
      var bl = (edges[i + 1] - edges[i]);
      heights.push(Math.min(Math.max(bl * 0.27, 4.2), 8.5) * (0.85 + r() * 0.3));
    }
    function point(phi, off) {
      var s = 1 + 0.022 * wob(phi);
      var ex = a * s * Math.cos(phi), ey = b * s * Math.sin(phi);
      var nx = Math.cos(phi) / a, ny = Math.sin(phi) / b, nl = Math.hypot(nx, ny);
      nx /= nl; ny /= nl;
      var x = ex + nx * off, y = ey + ny * off;
      var ct = Math.cos(tilt), st = Math.sin(tilt);
      return [cx + x * ct - y * st, cy + x * st + y * ct];
    }
    var inner = [], outer = [], S = 22;
    for (i = 0; i < n; i++) {
      for (var j = 0; j < S; j++) {
        var t = j / S;
        var phi = phiAt(edges[i] + (edges[i + 1] - edges[i]) * t);
        var bulge = heights[i] * Math.pow(Math.max(0, 1 - Math.pow(2 * t - 1, 2)), 0.62);
        var weight = 2.4 + 1.3 * (0.5 + 0.5 * wob2(phi)) + (Math.sin(phi) > 0 ? 0.5 : 0); // heavier underneath
        inner.push(point(phi, bulge));
        outer.push(point(phi, bulge + weight * Math.pow(Math.sin(Math.PI * t), 0.5)));
      }
    }
    var di = path(inner), dout = path(outer);

    // the two trailing puffs, bottom left, under the cloud
    var prx = Math.min(Math.max(b * 0.42, 7.5), 11.5), pry = prx * 0.7;
    var srx = prx * 0.56, sry = pry * 0.58, p1x, p1y, p2x, p2y, under;
    if (tailLeft) {                                  // in the nav bar the puffs trail off to the left
      under = point(Math.PI * 0.94, 6);
      p1x = under[0] - prx - 2; p1y = under[1] + 2;
      p2x = p1x - prx - srx - 1; p2y = p1y + pry * 0.6;
    } else {                                         // elsewhere, off the bottom left
      under = point(Math.PI * 0.72, 7);
      p1x = under[0] - 2; p1y = under[1] + pry + 3.5;
      p2x = p1x - prx - srx * 0.5; p2y = p1y + pry + sry - 0.5;
    }
    var rot1 = f((r() - 0.5) * 18), rot2 = f((r() - 0.5) * 24);
    function puff(x, y, rx, ry, rot, sw) {
      return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(rx) + '" ry="' + f(ry) +
        '" transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')" stroke-width="' + sw + '"/>';
    }
    var puffs = puff(p1x, p1y, prx, pry, rot1, 2.6) + puff(p2x, p2y, srx, sry, rot2, 2.2);

    var sx = -3, sy = 4;                             // hard shadow, down and left like the logo
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f(W) + ' ' + f(H) + '" width="' + f(W) + '" height="' + f(H) + '" aria-hidden="true" focusable="false">' +
      '<g transform="translate(' + sx + ' ' + sy + ')" fill="' + INK + '" stroke="' + INK + '" stroke-linejoin="round">' +
        '<path d="' + dout + '" stroke-width="2.4"/><path d="' + di + '" stroke-width="5"/>' + puffs + '</g>' +
      '<g fill="' + INK + '" stroke="' + INK + '" stroke-linejoin="round">' +
        '<path d="' + dout + '" stroke-width="0.6"/><path d="' + di + '" stroke-width="5"/>' + puffs + '</g>' +
      '<g fill="#fff"><path d="' + di + '"/>' + puffs.replace(/ stroke-width="[\d.]+"/g, '') + '</g>' +
      '</svg>';
    return { svg: svg, pad: pad, width: W, height: H };
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { drawCloud: drawCloud }; return; }

  var doc = root.document, count = 0, INSET = 6.5;
  // the label's own box, measured from its text
  function textBox(el) {
    var walker = doc.createTreeWalker(el, 4, null), node, box = null;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim() || (node.parentNode.closest && node.parentNode.closest('.bubble-art'))) continue;
      var rg = doc.createRange(); rg.selectNodeContents(node);
      var r = rg.getBoundingClientRect();
      if (!r.width) continue;
      box = box ? { l: Math.min(box.l, r.left), r: Math.max(box.r, r.right), t: Math.min(box.t, r.top), b: Math.max(box.b, r.bottom) }
                : { l: r.left, r: r.right, t: r.top, b: r.bottom };
    }
    return box && { w: box.r - box.l, h: box.b - box.t };
  }
  // widen the button so its label sits inside the oval, not over the scallops
  function fit(el, h) {
    var tb = textBox(el); if (!tb) return false;
    var b = h / 2 - INSET, hy = Math.min(tb.h / 2 + 2, b * 0.9);
    var a = (tb.w / 2 + 6) / Math.sqrt(1 - (hy / b) * (hy / b));
    var px = Math.max(Math.ceil(a + INSET - tb.w / 2), 18);
    var room = doc.documentElement.clientWidth - 40;   // never wider than a phone screen
    px = Math.max(18, Math.min(px, Math.floor((room - tb.w) / 2)));
    var target = el.matches('.formkit-submit') ? (el.querySelector(':scope > span:not(.bubble-art)') || el) : el;
    if (Math.abs((parseFloat(target.style.paddingLeft) || -1) - px) < 1) return false;
    target.style.setProperty('padding-left', px + 'px', 'important');
    target.style.setProperty('padding-right', px + 'px', 'important');
    return true;
  }
  function paint(el) {
    var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    if (fit(el, h)) { w = Math.round(el.offsetWidth); h = Math.round(el.offsetHeight); }
    if (el._bubble && el._bubble.w === w && el._bubble.h === h) return;
    var seed = hash((el.textContent || '').trim().toLowerCase() + '|' + el._bubbleIndex);
    var c = drawCloud(w, h, seed, !!el.closest('.nav'));
    var holder = el.querySelector(':scope > .bubble-art');
    if (!holder) {
      holder = doc.createElement('span');
      holder.className = 'bubble-art';
      el.insertBefore(holder, el.firstChild);
    }
    holder.style.left = -(c.pad.l + el.clientLeft) + 'px';   // the holder sits inside the border
    holder.style.top = -(c.pad.t + el.clientTop) + 'px';
    holder.style.width = c.width + 'px';
    holder.style.height = c.height + 'px';
    holder.innerHTML = c.svg;
    el._bubble = { w: w, h: h };
    el.classList.add('bubbled');
  }
  var ro = 'ResizeObserver' in root ? new ResizeObserver(function (es) { es.forEach(function (e) { paint(e.target); }); }) : null;
  function init(scope) {
    var els = (scope || doc).querySelectorAll('.btn:not(.ghost), #kit-embed .formkit-submit');
    Array.prototype.forEach.call(els, function (el) {
      if (el._bubbleIndex !== undefined) return;
      el._bubbleIndex = count++;
      paint(el);
      if (ro) ro.observe(el);
    });
  }
  function start() {
    init();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { init(); });
    if ('MutationObserver' in root) {
      new MutationObserver(function () { init(); }).observe(doc.body, { childList: true, subtree: true });
    }
    if (!ro) root.addEventListener('resize', function () { Array.prototype.forEach.call(doc.querySelectorAll('.bubbled'), paint); });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(this);
