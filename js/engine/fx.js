/* Zero Satus — motor de efeitos (canvas 2D, determinístico: tudo é função do progresso do scroll).
   Tipos: flow (enxame que converge), path (cometa), burst (explosão em anéis),
   emit (faíscas emitidas ao longo de uma linha), dust (poeira de luz ambiente). */
(function (w) {
    'use strict';
    var ZS = (w.ZS = w.ZS || {});
    function R(i, k) { var x = Math.sin(i * 127.1 + k * 311.7 + 13.37) * 43758.5453; return x - Math.floor(x); }
    function cl(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    ZS.fx = function (canvas, stage, opts) {
        opts = opts || {};
        var ctx = canvas.getContext('2d'), dpr = Math.min(2, w.devicePixelRatio || 1);
        var W = 0, H = 0, G = [], blend = opts.blend || 'lighter', mob = !!opts.mobile, U = 1;
        function resize() {
            var r = stage.getBoundingClientRect(); W = r.width; H = r.height; U = Math.max(0.7, Math.min(1.3, W / 1440));
            canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
            canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        function dot(x, y, s, c, a) {
            if (a <= 0.01) return;
            ctx.fillStyle = c;
            ctx.globalAlpha = a * 0.26; ctx.beginPath(); ctx.arc(x, y, s * 2.8, 0, 6.2832); ctx.fill();
            ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.2832); ctx.fill();
        }
        var T = {
            flow: function (g, p) {
                var t = cl((p - g.t0) / (g.t1 - g.t0)); if (t <= 0) return;
                var S = g.src(), D = g.dst(); if (!S.length || !D.length) return;
                var n = mob ? Math.round(g.n * 0.6) : g.n, cx = W / 2, cy = H / 2;
                for (var i = 0; i < n; i++) {
                    var ti = cl((t - R(i, 1) * 0.35) / 0.65); if (ti <= 0 || ti >= 1) continue;
                    var s = S[i % S.length], e = D[(i * 5 + 2) % D.length], c = e.c || g.colors[i % g.colors.length];
                    var x0 = s.x, y0 = s.y;
                    if (g.swirl) { var a0 = R(i, 2) * 6.2832, rr = g.swirl.r * Math.min(W, H) * (0.55 + R(i, 3) * 0.9); x0 = cx + Math.cos(a0) * rr; y0 = cy + Math.sin(a0) * rr * 0.62; }
                    var te = ease(ti), dx = e.x - x0, dy = e.y - y0, L = Math.sqrt(dx * dx + dy * dy) || 1;
                    var x = x0 + dx * te, y = y0 + dy * te, amp = (R(i, 4) - 0.5) * L * (g.curve || 0.5) * Math.sin(Math.PI * te);
                    x += -dy / L * amp; y += dx / L * amp;
                    if (g.swirl) { var ang = (1 - te) * g.swirl.spin * (R(i, 5) > 0.5 ? 1 : -1) * 0.6, ox = x - cx, oy = y - cy, ca = Math.cos(ang), sa = Math.sin(ang); x = cx + ox * ca - oy * sa; y = cy + ox * sa + oy * ca; }
                    var a = Math.min(1, ti * 5) * (ti > 0.86 ? (1 - ti) / 0.14 : 1), sz = (1.2 + R(i, 6) * 2.3) * U;
                    dot(x, y, sz, c, a);
                    dot(x - dx / L * 7 * U, y - dy / L * 7 * U, sz * 0.7, c, a * 0.55);
                    dot(x - dx / L * 15 * U, y - dy / L * 15 * U, sz * 0.45, c, a * 0.3);
                }
            },
            path: function (g, p) {
                var t = cl((p - g.t0) / (g.t1 - g.t0)); if (t <= 0) return;
                var P = g.pts(); if (P.length < 2) return; var cum = [0], tot = 0;
                for (var j = 1; j < P.length; j++) { tot += Math.hypot(P[j].x - P[j - 1].x, P[j].y - P[j - 1].y); cum.push(tot); }
                var head = t * tot, n = mob ? Math.round(g.n * 0.7) : g.n;
                for (var i = 0; i < n; i++) {
                    var pos = head - i * g.gap * U; if (pos < 0 || pos > tot) continue;
                    var k = 1; while (k < cum.length - 1 && cum[k] < pos) k++;
                    var f = (pos - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1), x = P[k - 1].x + (P[k].x - P[k - 1].x) * f, y = P[k - 1].y + (P[k].y - P[k - 1].y) * f;
                    var life = 1 - i / n; x += (R(i, 1) - 0.5) * 14 * U * (1 - life); y += (R(i, 2) - 0.5) * 14 * U * (1 - life);
                    dot(x, y, (g.size * (0.35 + life * 0.9)) * U, i < 3 ? '#ffffff' : g.colors[i % g.colors.length], Math.pow(life, 1.4) * (t > 0.97 ? (1 - t) / 0.03 : 1));
                }
            },
            burst: function (g, p) {
                var A = g.pts(), m = mob ? Math.round(g.m * 0.6) : g.m;
                for (var j = 0; j < A.length; j++) {
                    var tt = (p - (g.t0 + j * g.dt)) / g.dur; if (tt <= 0 || tt >= 1) continue; var te = ease(tt), c = A[j].c || g.colors[j % g.colors.length];
                    for (var k = 0; k < m; k++) {
                        var ang = R(j * 31 + k, 7) * 6.2832, rad = g.r * U * (0.3 + R(j * 31 + k, 8) * 0.7) * te;
                        dot(A[j].x + Math.cos(ang) * rad, A[j].y + Math.sin(ang) * rad * 0.85, (1.3 + R(j * 31 + k, 9) * 2.2) * U, c, (1 - tt) * 0.95);
                    }
                    ctx.globalAlpha = (1 - tt) * 0.6; ctx.strokeStyle = c; ctx.lineWidth = 2 * U; ctx.beginPath(); ctx.arc(A[j].x, A[j].y, g.r * 1.05 * U * te, 0, 6.2832); ctx.stroke();
                }
            },
            emit: function (g, p) {
                var rc = g.rect(), n = mob ? Math.round(g.n * 0.6) : g.n;
                for (var i = 0; i < n; i++) {
                    var tb = g.t0 + R(i, 1) * (g.t1 - g.t0), age = (p - tb) / g.life; if (age <= 0 || age >= 1) continue;
                    var fr = (tb - g.t0) / (g.t1 - g.t0), x = rc.x + R(i, 2) * rc.w + (R(i, 3) - 0.5) * 70 * age * U, y = rc.y + fr * rc.h - age * 80 * (0.4 + R(i, 4)) * U;
                    dot(x, y, (1 + R(i, 5) * 2.2) * U, g.colors[i % g.colors.length], (1 - age) * 0.95);
                }
            },
            dust: function (g, p) {
                var n = mob ? Math.round(g.n * 0.6) : g.n;
                for (var i = 0; i < n; i++) {
                    var x = R(i, 1) * W + Math.sin(p * 18 + i) * 10 * U, y = (((R(i, 2) * H - p * g.speed * (0.4 + R(i, 3))) % H) + H) % H;
                    dot(x, y, (0.7 + R(i, 4) * 1.6) * U, g.colors[i % g.colors.length], (0.2 + 0.5 * R(i, 5)) * (0.55 + 0.45 * Math.sin(p * 40 + i * 3)));
                }
            }
        };
        var F = {
            add: function (g) { G.push(g); return F; },
            resize: resize,
            draw: function (p) {
                ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = blend;
                G.forEach(function (g) { if (g.type !== 'dust' && (p < g.t0 - 0.001 || p > g.t1 + (g.ext || 0.06))) return; T[g.type](g, p); });
                ctx.globalAlpha = 1;
            }
        };
        return F;
    };
})(window);
