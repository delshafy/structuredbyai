/* ============================================================
   STRUCTURED BY AI — signature background
   Warm flow-field: dense oriented streaks following a drifting
   value-noise vector field, colour-graded magenta -> red ->
   orange -> amber on near-black. Drift accelerates with scroll
   velocity. Colour buckets keep it to ~16 stroke() calls/frame.
   Factory contract: window.SBAI_BG(canvas, {intensity}) ->
     { destroy(), setTheme(name), setVelocity(v) }
   ============================================================ */
window.SBAI_BG = function (canvas, opts) {
  opts = opts || {};
  var ctx = canvas.getContext('2d', { alpha: true });
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var intensity = opts.intensity != null ? opts.intensity : 1;

  // warm gradient stops: magenta -> pink -> red -> orange -> amber
  var STOPS = [
    [255, 28, 160],
    [255, 32, 120],
    [255, 46, 78],
    [255, 78, 40],
    [255, 128, 28],
    [255, 198, 80],
  ];
  function ramp(t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var f = t * (STOPS.length - 1), i = Math.floor(f), k = f - i;
    var a = STOPS[i], b = STOPS[Math.min(i + 1, STOPS.length - 1)];
    return [(a[0] + (b[0] - a[0]) * k) | 0, (a[1] + (b[1] - a[1]) * k) | 0, (a[2] + (b[2] - a[2]) * k) | 0];
  }

  // cheap smooth value-noise
  function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function sm(t) { return t * t * (3 - 2 * t); }
  function noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    var u = sm(xf), v = sm(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  var BUCKETS = 16;
  var buckets = [];
  for (var bi = 0; bi < BUCKETS; bi++) buckets.push([]);

  var W, H, dpr, STEP, LEN;
  var phase = 0, vel = 0;
  var FREQ = 0.0023;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    STEP = Math.max(11, Math.min(17, Math.round(Math.min(W, H) / 66)));
    LEN = STEP * 2.1;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.25;
    for (var b = 0; b < BUCKETS; b++) buckets[b].length = 0;

    var p = phase, half = LEN * 0.5;
    for (var y = -STEP; y < H + STEP; y += STEP) {
      for (var x = -STEP; x < W + STEP; x += STEP) {
        // organic jitter so it isn't a rigid grid
        var jx = (hash(x * 0.21, y * 0.17) - 0.5) * STEP * 0.7;
        var jy = (hash(x * 0.13, y * 0.29) - 0.5) * STEP * 0.7;
        var cx = x + jx, cy = y + jy;
        // brightness/density field — low values become black valleys
        var br = noise(cx * FREQ * 1.1 + p * 0.5, cy * FREQ * 1.1 - p * 0.3);
        if (br < 0.28) continue;
        // flow angle (several turns -> swirls)
        var ang = noise(cx * FREQ + p, cy * FREQ - p * 0.6) * 6.2831 * 1.7;
        // hue region from a smooth low-freq field + gentle L->R warm bias (magenta-forward)
        var hp = noise(cx * FREQ * 0.55 - p * 0.4, cy * FREQ * 0.55 + p * 0.3) * 0.8 + (cx / W) * 0.14;
        var idx = Math.floor(hp * BUCKETS);
        idx = idx < 0 ? 0 : idx >= BUCKETS ? BUCKETS - 1 : idx;
        var dx = Math.cos(ang) * half, dy = Math.sin(ang) * half;
        var arr = buckets[idx];
        arr.push(cx - dx, cy - dy, cx + dx, cy + dy);
      }
    }

    ctx.globalCompositeOperation = 'lighter'; // additive — overlaps glow toward white like the reference
    for (var bk = 0; bk < BUCKETS; bk++) {
      var seg = buckets[bk];
      if (!seg.length) continue;
      var col = ramp(bk / (BUCKETS - 1));
      ctx.strokeStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (0.55 * intensity).toFixed(3) + ')';
      ctx.beginPath();
      for (var i = 0; i < seg.length; i += 4) { ctx.moveTo(seg[i], seg[i + 1]); ctx.lineTo(seg[i + 2], seg[i + 3]); }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  var raf;
  function loop() {
    var boost = Math.min(Math.abs(vel) * 0.012, 0.05); // scroll accelerates the flow
    phase += 0.0016 + boost;
    vel *= 0.9;
    draw();
    raf = requestAnimationFrame(loop);
  }

  resize();
  if (reduced) { draw(); } else { loop(); }

  var rt;
  function onResize() { clearTimeout(rt); rt = setTimeout(function () { resize(); if (reduced) draw(); }, 150); }
  window.addEventListener('resize', onResize);

  return {
    destroy: function () { cancelAnimationFrame(raf); clearTimeout(rt); window.removeEventListener('resize', onResize); },
    setTheme: function (name) { intensity = (name === 'cream') ? 0.85 : 1; },
    setVelocity: function (v) { vel = v || 0; },
  };
};
