document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════
    //  VIEW NAVIGATION
    // ══════════════════════════════════════
    window.goTo = function(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        window.scrollTo(0, 0);

        if (viewId === 'view-foco-maximo') {
            initFocoMaximo();
        }
    };

    // ══════════════════════════════════════
    //  DASHBOARD
    // ══════════════════════════════════════

    // Progress ring
    setTimeout(() => {
        const circle = document.getElementById('progress-circle');
        if (circle) circle.style.strokeDashoffset = 201 * (1 - 0.72);
    }, 400);

    // Weekly chart
    const weeklyData = [
        { day: 'Dom', sessions: 2, pct: 25 },
        { day: 'Seg', sessions: 4, pct: 55 },
        { day: 'Ter', sessions: 5, pct: 40 },
        { day: 'Qua', sessions: 3, pct: 65 },
        { day: 'Qui', sessions: 4, pct: 30 },
        { day: 'Sex', sessions: 2, pct: 80 },
        { day: 'Sáb', sessions: 6, pct: 72, active: true }
    ];

    const chartEl    = document.getElementById('weekly-chart');
    const labelsEl   = document.getElementById('weekly-days');
    const sessionsEl = document.getElementById('weekly-sessions');

    weeklyData.forEach(d => {
        const wrap = document.createElement('div');
        wrap.className = 'bar-wrap';
        const bar = document.createElement('div');
        bar.className = 'bar' + (d.active ? ' active' : '');
        bar.style.height = d.pct + '%';
        wrap.appendChild(bar);
        chartEl.appendChild(wrap);

        const lbl = document.createElement('span');
        lbl.textContent = d.day;
        if (d.active) lbl.className = 'active';
        labelsEl.appendChild(lbl);

        const ses = document.createElement('span');
        ses.textContent = d.sessions + 's';
        if (d.active) ses.className = 'active';
        sessionsEl.appendChild(ses);
    });

    // Mode toggle
    window.selectMode = function(btn) {
        document.querySelectorAll('.mode-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    // Próximas Aulas
    const aulasData = [
        { name: 'Matemática', dur: '1h',      time: '14:00', day: 'hoje', color: '#f87171' },
        { name: 'Física',     dur: '45min',   time: '16:00', day: 'hoje', color: '#2dd4bf' },
        { name: 'Química',    dur: '1h30min', time: '18:30', day: 'hoje', color: '#fbbf24' }
    ];
    const classesList = document.getElementById('classes-list');
    aulasData.forEach(a => {
        const el = document.createElement('div');
        el.className = 'aula-item';
        el.innerHTML = `
            <div class="aula-left-bar" style="background:${a.color};"></div>
            <div class="aula-info">
                <span class="aula-name">${a.name}</span>
                <span class="aula-dur">${a.dur}</span>
            </div>
            <div class="aula-right">
                <span class="aula-time">${a.time}</span>
                <span class="aula-day">${a.day}</span>
            </div>`;
        classesList.appendChild(el);
    });

    // Tempo por Disciplina
    const subjectsData = [
        { name:'Matemática', today:'45min hoje', hrs:'5h', total:'40min total', icon:'calculator-outline', iconClass:'ic-red',    color:'#f87171', metaProgress:75,  metaVal:'45/60min', weekFilled:5 },
        { name:'Física',     today:'30min hoje', hrs:'3h', total:'30min total', icon:'flash-outline',       iconClass:'ic-teal',   color:'#2dd4bf', metaProgress:67,  metaVal:'30/45min', weekFilled:4 },
        { name:'Química',    today:'20min hoje', hrs:'3h', total:'0min total',  icon:'flask-outline',       iconClass:'ic-yellow', color:'#fbbf24', metaProgress:50,  metaVal:'20/40min', weekFilled:3 },
        { name:'Biologia',   today:'50min hoje', hrs:'4h', total:'20min total', icon:'leaf-outline',        iconClass:'ic-green',  color:'#34d399', metaProgress:100, metaVal:'50/50min', weekFilled:6 },
        { name:'História',   today:'15min hoje', hrs:'2h', total:'30min total', icon:'book-outline',        iconClass:'ic-pink',   color:'#f472b6', metaProgress:50,  metaVal:'15/30min', weekFilled:2 },
        { name:'Português',  today:'35min hoje', hrs:'3h', total:'15min total', icon:'chatbubbles-outline', iconClass:'ic-orange', color:'#fb923c', metaProgress:78,  metaVal:'35/45min', weekFilled:5 }
    ];
    const subjectsList = document.getElementById('subjects-list');
    subjectsData.forEach(s => {
        const dotsHTML = Array.from({length:7}, (_,i) =>
            `<div class="dot" style="${i < s.weekFilled ? `background:${s.color};opacity:0.7;` : ''}"></div>`
        ).join('');
        const el = document.createElement('div');
        el.className = 'disciplina-item';
        el.innerHTML = `
            <div class="disciplina-top">
                <div class="disciplina-icon ${s.iconClass}"><ion-icon name="${s.icon}"></ion-icon></div>
                <div class="disciplina-info">
                    <span class="disciplina-name">${s.name}</span>
                    <span class="disciplina-today">${s.today}</span>
                </div>
                <div class="disciplina-hrs">
                    <span class="disciplina-h">${s.hrs}</span>
                    <span class="disciplina-total">${s.total}</span>
                </div>
            </div>
            <div class="meta-row">
                <span class="meta-lbl">Meta diária</span>
                <span class="meta-val">${s.metaVal}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${s.metaProgress}%;background:${s.color};box-shadow:0 0 8px ${s.color}55;"></div>
            </div>
            <div class="week-dots">${dotsHTML}</div>`;
        subjectsList.appendChild(el);
    });

    // ══════════════════════════════════════
    //  FOCO MÁXIMO
    // ══════════════════════════════════════

    let timerMode     = 'timer';
    let totalSeconds  = 25 * 60;
    let remaining     = totalSeconds;
    let elapsed       = 0;
    let running       = false;
    let timerInterval = null;
    let sessions      = 3;
    let todaySeconds  = 0;
    const ARC_CIRC    = 2 * Math.PI * 118; // ~741
    let ticksDrawn    = false;

    function initFocoMaximo() {
        if (!ticksDrawn) {
            drawTicks();
            ticksDrawn = true;
        }
        renderTimer();
        updateArc(1);
    }

    function drawTicks() {
        const g = document.getElementById('ticks');
        if (!g) return;
        const cx = 150, cy = 150, r1 = 125;
        for (let i = 0; i < 60; i++) {
            const angle   = (i / 60) * 2 * Math.PI - Math.PI / 2;
            const isMajor = i % 5 === 0;
            const len     = isMajor ? 10 : 5;
            const x1 = cx + r1 * Math.cos(angle);
            const y1 = cy + r1 * Math.sin(angle);
            const x2 = cx + (r1 - len) * Math.cos(angle);
            const y2 = cy + (r1 - len) * Math.sin(angle);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1); line.setAttribute('y1', y1);
            line.setAttribute('x2', x2); line.setAttribute('y2', y2);
            line.setAttribute('stroke', isMajor ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)');
            line.setAttribute('stroke-width', isMajor ? '2' : '1');
            line.setAttribute('stroke-linecap', 'round');
            g.appendChild(line);
        }
    }

    function fmt(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
    }

    function updateArc(pct) {
        const arc = document.getElementById('progress-arc');
        if (arc) arc.style.strokeDashoffset = ARC_CIRC * (1 - pct);
    }

    function renderTimer() {
        const dispEl  = document.getElementById('clock-display');
        const subEl   = document.getElementById('clock-sub');
        const sesEl   = document.getElementById('session-count');
        const todayEl = document.getElementById('today-time');
        if (!dispEl) return;

        if (timerMode === 'timer') {
            dispEl.textContent = fmt(remaining);
            subEl.textContent  = 'RESTANTE';
            updateArc(remaining / totalSeconds);
        } else {
            dispEl.textContent = fmt(elapsed);
            subEl.textContent  = 'DECORRIDO';
            updateArc(Math.min(elapsed / 3600, 1));
        }
        if (todayEl) todayEl.textContent = fmt(todaySeconds);
        if (sesEl)   sesEl.textContent   = sessions;
    }

    window.switchTab = function(m) {
        pauseTimer();
        timerMode = m;
        document.getElementById('tab-timer').classList.toggle('active', m === 'timer');
        document.getElementById('tab-crono').classList.toggle('active', m === 'crono');
        document.getElementById('presets').style.visibility = m === 'timer' ? 'visible' : 'hidden';
        remaining = totalSeconds;
        elapsed   = 0;
        renderTimer();
        updateArc(1);
    };

    window.setPreset = function(min) {
        if (running) return;
        totalSeconds = min * 60;
        remaining    = totalSeconds;
        document.querySelectorAll('.preset').forEach(b => {
            b.classList.toggle('active', parseInt(b.textContent) === min);
        });
        updateArc(1);
        renderTimer();
    };

    window.toggleTimer = function() {
        running ? pauseTimer() : startTimer();
    };

    function startTimer() {
        running = true;
        const pi = document.getElementById('play-icon');
        const pb = document.getElementById('play-btn');
        if (pi) pi.setAttribute('name', 'pause');
        if (pb) pb.classList.add('running');

        timerInterval = setInterval(() => {
            if (timerMode === 'timer') {
                if (remaining <= 0) { completeSession(); return; }
                remaining--;
            } else {
                elapsed++;
            }
            todaySeconds++;
            renderTimer();
        }, 1000);
    }

    function pauseTimer() {
        running = false;
        clearInterval(timerInterval);
        const pi = document.getElementById('play-icon');
        const pb = document.getElementById('play-btn');
        if (pi) pi.setAttribute('name', 'play');
        if (pb) pb.classList.remove('running');
    }

    function completeSession() {
        pauseTimer();
        sessions++;
        remaining = totalSeconds;
        renderTimer();
        const arc = document.getElementById('progress-arc');
        if (arc) {
            arc.style.stroke = '#34d399';
            setTimeout(() => { arc.style.stroke = 'url(#arcGrad)'; }, 800);
        }
    }

    window.resetTimer = function() {
        pauseTimer();
        if (timerMode === 'timer') remaining = totalSeconds;
        else elapsed = 0;
        renderTimer();
        updateArc(1);
    };

    // ══════════════════════════════════════
    //  ESTUDO ONLINE
    // ══════════════════════════════════════

    let eoAccent       = '#00e5ff';
    let eoClockRunning = false;
    let eoClockTicks   = false;
    let eoCronoRunning = false;
    let eoCronoSec     = 0;
    let eoCronoInt     = null;
    let eoTimerTotal   = 25 * 60;
    let eoTimerRem     = eoTimerTotal;
    let eoTimerRunning = false;
    let eoTimerInt     = null;
    let eoSubMode      = 'relogio'; // relogio | crono | timer

    function initEstudoOnline() {
        if (!eoClockTicks) { drawEoTicks(); eoClockTicks = true; }
        if (!eoClockRunning) { eoClockRunning = true; tickEoClock(); }
        updateEoAccent(eoAccent);
        updateEoDigital();
    }

    function drawEoTicks() {
        const g = document.getElementById('eo-ticks');
        if (!g) return;
        g.innerHTML = '';
        const cx = 150, cy = 150;
        for (let i = 0; i < 60; i++) {
            const angle   = (i / 60) * 2 * Math.PI - Math.PI / 2;
            const isMajor = i % 5 === 0;
            const r1 = 122, len = isMajor ? 10 : 5;
            const x1 = cx + r1 * Math.cos(angle);
            const y1 = cy + r1 * Math.sin(angle);
            const x2 = cx + (r1 - len) * Math.cos(angle);
            const y2 = cy + (r1 - len) * Math.sin(angle);
            const line = document.createElementNS('http://www.w3.org/2000/svg','line');
            line.setAttribute('x1',x1); line.setAttribute('y1',y1);
            line.setAttribute('x2',x2); line.setAttribute('y2',y2);
            line.setAttribute('stroke', isMajor ? eoAccent : eoAccent + '55');
            line.setAttribute('stroke-width', isMajor ? '2' : '1');
            line.setAttribute('stroke-linecap','round');
            g.appendChild(line);
        }
    }

    function tickEoClock() {
        if (document.getElementById('view-estudo-online').classList.contains('hidden')) {
            eoClockRunning = false; return;
        }
        const now  = new Date();
        const h    = now.getHours() % 12;
        const m    = now.getMinutes();
        const s    = now.getSeconds();
        const ms   = now.getMilliseconds();

        const sDeg = (s + ms/1000) * 6;
        const mDeg = (m + s/60) * 6;
        const hDeg = (h + m/60) * 30;

        setHand('eo-second', sDeg, 150, 60,  160, 170);
        setHand('eo-minute', mDeg, 150, 68,  150, 155);
        setHand('eo-hour',   hDeg, 150, 92,  150, 155);

        updateEoDigital(now);
        requestAnimationFrame(tickEoClock);
    }

    function setHand(id, deg, cx, tipDist, tailY, cx2) {
        const el = document.getElementById(id);
        if (!el) return;
        const rad = (deg - 90) * Math.PI / 180;
        const x2  = cx + tipDist * Math.cos(rad);
        const y2  = 150 + tipDist * Math.sin(rad);
        el.setAttribute('x2', x2);
        el.setAttribute('y2', y2);
        // tail (opposite short end)
        const xT = cx - 15 * Math.cos(rad);
        const yT = 150 - 15 * Math.sin(rad);
        el.setAttribute('x1', xT);
        el.setAttribute('y1', yT);
    }

    function updateEoDigital(now) {
        now = now || new Date();
        const el = document.getElementById('eo-digital-time');
        if (!el) return;

        if (eoSubMode === 'relogio') {
            const hh = String(now.getHours()).padStart(2,'0');
            const mm = String(now.getMinutes()).padStart(2,'0');
            const ss = String(now.getSeconds()).padStart(2,'0');
            el.textContent = `${hh}:${mm}:${ss}`;
            const days = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];
            const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
            const dateEl = document.getElementById('eo-date');
            if (dateEl) dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} De ${months[now.getMonth()]}`;
        } else if (eoSubMode === 'crono') {
            el.textContent = fmtEo(eoCronoSec);
        } else {
            el.textContent = fmtEo(eoTimerRem);
        }
    }

    function fmtEo(s) {
        const h  = Math.floor(s / 3600);
        const m  = Math.floor((s % 3600) / 60);
        const sc = s % 60;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
    }

    function updateEoAccent(color) {
        eoAccent = color;
        document.documentElement.style.setProperty('--eo-accent', color);

        // Decide text color (dark bg for bright/light colors)
        const brightColors = ['#00e5ff','#00e676','#ffd600'];
        const textColor = brightColors.includes(color) ? '#000d14' : '#ffffff';

        // SVG: outer border
        const outerBorder = document.getElementById('eo-border-outer');
        if (outerBorder) outerBorder.setAttribute('stroke', color);

        // SVG: inner border
        const innerBorder = document.getElementById('eo-border-inner');
        if (innerBorder) innerBorder.setAttribute('stroke', color);

        // SVG: hour & minute hands (accent color), second hand stays white
        ['eo-hour','eo-minute'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.setAttribute('stroke', color);
        });

        // SVG: numbers 12,3,6,9
        document.querySelectorAll('[id="eo-num"]').forEach(el => el.setAttribute('fill', color));

        // SVG: center info text
        const centerText = document.querySelector('#eo-clock-svg text:last-of-type');
        if (centerText) centerText.setAttribute('fill', color);

        // SVG: center dot
        const circles = document.querySelectorAll('#eo-clock-svg circle');
        if (circles.length) circles[circles.length - 1].setAttribute('fill', color);

        // Digital display glow
        const dispEl = document.getElementById('eo-digital-time');
        if (dispEl) {
            dispEl.style.color = color;
            dispEl.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}55`;
        }

        // Date text
        const dateEl = document.getElementById('eo-date');
        if (dateEl) dateEl.style.color = color + '88';

        // Tab bar active tab
        document.querySelectorAll('.eo-tab.active').forEach(t => {
            t.style.background = color;
            t.style.color = textColor;
            t.style.boxShadow = `0 2px 12px ${color}66`;
        });

        // Nav title accent
        document.querySelectorAll('#view-estudo-online .nav-title').forEach(el => {
            el.style.color = color + 'cc';
        });

        // Redraw ticks with new color
        drawEoTicks();
    }

    window.switchEoTab = function(tab) {
        eoSubMode = tab;
        const brightColors = ['#00e5ff','#00e676','#ffd600'];
        const textColor = brightColors.includes(eoAccent) ? '#000d14' : '#ffffff';
        document.querySelectorAll('.eo-tab').forEach(t => {
            t.classList.remove('active');
            t.style.background = '';
            t.style.color = '';
            t.style.boxShadow = '';
        });
        const activeTab = document.getElementById('eo-tab-' + tab);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.background = eoAccent;
            activeTab.style.color = textColor;
            activeTab.style.boxShadow = `0 2px 12px ${eoAccent}66`;
        }
        // stop crono/timer if switching away
        if (tab !== 'crono' && eoCronoRunning) { clearInterval(eoCronoInt); eoCronoRunning = false; }
        if (tab !== 'timer' && eoTimerRunning) { clearInterval(eoTimerInt); eoTimerRunning = false; }

        // show/hide date for non-clock modes
        const dateEl = document.getElementById('eo-date');
        if (dateEl) dateEl.textContent = tab === 'relogio' ? '' : tab === 'crono' ? 'Toque para iniciar / parar' : 'Timer 25 minutos';

        updateEoDigital();
    };

    window.toggleEoSettings = function() {
        const panel = document.getElementById('eo-settings');
        if (!panel) return;
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    };

    window.setEoColor = function(el) {
        document.querySelectorAll('.eo-color-opt').forEach(o => o.classList.remove('active'));
        el.classList.add('active');
        updateEoAccent(el.dataset.color);
    };

    // ── Wallpaper ─────────────────────────────
    const wallpaperInput = document.getElementById('wallpaper-input');
    const eoView = document.getElementById('view-estudo-online');

    // Wire up the wallpaper button
    document.querySelector('.eo-bg-btn')?.addEventListener('click', () => {
        wallpaperInput?.click();
    });

    wallpaperInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);

        // Remove old wallpaper elements
        eoView.querySelectorAll('.eo-wallpaper, .eo-wallpaper-overlay').forEach(el => el.remove());

        // Add wallpaper bg div and overlay
        const bg = document.createElement('div');
        bg.className = 'eo-wallpaper';
        bg.style.backgroundImage = `url(${url})`;
        const overlay = document.createElement('div');
        overlay.className = 'eo-wallpaper-overlay';
        eoView.prepend(overlay);
        eoView.prepend(bg);
        eoView.classList.add('has-wallpaper');

        // Make frame position relative above wallpaper
        eoView.querySelector('.eo-frame').style.position = 'relative';
        eoView.querySelector('.eo-frame').style.zIndex = '1';
    });

    // ── Override goTo to init views ───────────────
    const _originalGoTo = window.goTo;
    window.goTo = function(viewId) {
        _originalGoTo(viewId);
        if (viewId === 'view-estudo-online') {
            initEstudoOnline();
        }
        if (viewId === 'view-estatisticas') {
            initEstatisticas();
        }
    };

    // ── Estatísticas ──────────────────────────────
    let estInitialized = false;

    function initEstatisticas() {
        if (estInitialized) return;
        estInitialized = true;

        const weekData = [
            {day:'Dom', pct:25}, {day:'Seg', pct:55}, {day:'Ter', pct:40},
            {day:'Qua', pct:65}, {day:'Qui', pct:30}, {day:'Sex', pct:80},
            {day:'Sáb', pct:72, active:true}
        ];
        const chart = document.getElementById('est-chart');
        const days  = document.getElementById('est-days');
        if (!chart || !days) return;

        weekData.forEach(d => {
            const wrap = document.createElement('div');
            wrap.className = 'est-bar-wrap';
            const bar = document.createElement('div');
            bar.className = 'est-bar' + (d.active ? ' active' : '');
            bar.style.height = d.pct + '%';
            wrap.appendChild(bar);
            chart.appendChild(wrap);

            const lbl = document.createElement('span');
            lbl.textContent = d.day;
            if (d.active) lbl.className = 'active';
            days.appendChild(lbl);
        });

        // animate hoje bar
        setTimeout(() => {
            const fill = document.querySelector('.est-hoje-fill');
            if (fill) fill.style.width = '91%';
        }, 400);
    }

    window.switchEstTab = function(btn, tab) {
        document.querySelectorAll('.est-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
    };

    // ── Also handle digital time click for crono start/stop
    document.getElementById('eo-digital-time')?.addEventListener('click', () => {
        if (eoSubMode === 'crono') {
            if (eoCronoRunning) { clearInterval(eoCronoInt); eoCronoRunning = false; }
            else {
                eoCronoRunning = true;
                eoCronoInt = setInterval(() => { eoCronoSec++; updateEoDigital(); }, 1000);
            }
        }
    });

});

    // ══════════════════════════════════════
    //  ESTUDO ONLINE
    // ══════════════════════════════════════

    let eoColor     = '#00e5ff';
    let eoTab       = 'relogio';
    let eoCrono     = 0;
    let eoRunning   = false;
    let eoCronoInt  = null;
    let eoTimer     = 25 * 60;
    let eoTimerTot  = 25 * 60;
    let eoTimerRun  = false;
    let eoTimerInt  = null;
    let eoTicksDone = false;

    function initEstudoOnline() {
        applyEoColor(eoColor);
        if (!eoTicksDone) { drawEoTicks(); eoTicksDone = true; }
        updateEoClock();
        updateEoDigital();
        if (!window._eoClockInt) window._eoClockInt = setInterval(updateEoClock, 1000);
    }

    function drawEoTicks() {
        const g = document.getElementById('eo-ticks');
        if (!g) return;
        const cx = 150, cy = 150, r1 = 128;
        for (let i = 0; i < 60; i++) {
            const angle   = (i / 60) * 2 * Math.PI - Math.PI / 2;
            const isMajor = i % 5 === 0;
            const len     = isMajor ? 12 : 5;
            const x1 = cx + r1 * Math.cos(angle);
            const y1 = cy + r1 * Math.sin(angle);
            const x2 = cx + (r1 - len) * Math.cos(angle);
            const y2 = cy + (r1 - len) * Math.sin(angle);
            const line = document.createElementNS('http://www.w3.org/2000/svg','line');
            line.setAttribute('x1', x1); line.setAttribute('y1', y1);
            line.setAttribute('x2', x2); line.setAttribute('y2', y2);
            line.setAttribute('stroke', eoColor);
            line.setAttribute('stroke-width', isMajor ? '2' : '1');
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('opacity', isMajor ? '0.8' : '0.3');
            line.classList.add('eo-tick');
            g.appendChild(line);
        }
    }

    function updateEoClock() {
        const now = new Date();
        const h = now.getHours() % 12 + now.getMinutes() / 60;
        const m = now.getMinutes() + now.getSeconds() / 60;
        const s = now.getSeconds();

        const rotH = (h / 12) * 360;
        const rotM = (m / 60) * 360;
        const rotS = (s / 60) * 360;

        setHandAngle('eo-hour',   rotH, 150, 90);
        setHandAngle('eo-minute', rotM, 150, 65);
        setHandAngle('eo-second', rotS, 150, 55);

        if (eoTab === 'relogio') updateEoDigital();
    }

    function setHandAngle(id, deg, cx, tip) {
        const el = document.getElementById(id);
        if (!el) return;
        const rad = (deg - 90) * Math.PI / 180;
        // x2, y2 = tip; x1, y1 = center (150,150); tail for second hand
        const x2 = 150 + (150 - tip) * Math.cos(rad);
        const y2 = 150 + (150 - tip) * Math.sin(rad);
        el.setAttribute('x2', x2.toFixed(2));
        el.setAttribute('y2', y2.toFixed(2));
        if (id === 'eo-second') {
            const tailRad = (deg + 90) * Math.PI / 180;
            el.setAttribute('x1', (150 + 10 * Math.cos(tailRad)).toFixed(2));
            el.setAttribute('y1', (150 + 10 * Math.sin(tailRad)).toFixed(2));
        }
    }

    function updateEoDigital() {
        const el = document.getElementById('eo-digital-time');
        const dateEl = document.getElementById('eo-date');
        if (!el) return;
        if (eoTab === 'relogio') {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2,'0');
            const mm = String(now.getMinutes()).padStart(2,'0');
            const ss = String(now.getSeconds()).padStart(2,'0');
            el.textContent = `${hh}:${mm}:${ss}`;
            const days   = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];
            const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
            if (dateEl) dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} De ${months[now.getMonth()]}`;
        } else if (eoTab === 'crono') {
            el.textContent = fmtEo(eoCrono);
            if (dateEl) dateEl.textContent = eoRunning ? 'A contar...' : 'Cronômetro';
        } else {
            el.textContent = fmtEo(eoTimer);
            if (dateEl) dateEl.textContent = eoTimerRun ? 'A contar...' : 'Timer';
        }
    }

    function fmtEo(s) {
        const h  = Math.floor(s / 3600);
        const m  = Math.floor((s % 3600) / 60);
        const sc = s % 60;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
    }

    function applyEoColor(color) {
        eoColor = color;
        document.documentElement.style.setProperty('--eo-color', color);
        // update SVG elements
        ['eo-border-outer','eo-hour','eo-minute','eo-second'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.setAttribute('stroke', id === 'eo-second' ? '#ffffff' : color);
        });
        const dot = document.querySelector('#eo-clock-svg circle[fill="#00e5ff"], #eo-clock-svg circle[r="5"]');
        if (dot) dot.setAttribute('fill', color);
        document.querySelectorAll('.eo-tick').forEach(t => t.setAttribute('stroke', color));
        document.querySelectorAll('#eo-num, text[fill="#00e5ff"]').forEach(t => t.setAttribute('fill', color));
        const timeEl = document.getElementById('eo-digital-time');
        if (timeEl) { timeEl.style.color = color; timeEl.style.textShadow = `0 0 20px ${color}`; }
        const activeTab = document.querySelector('.eo-tab.active');
        if (activeTab) { activeTab.style.background = color; }
    }

    window.toggleEoSettings = function() {
        const panel = document.getElementById('eo-settings');
        if (!panel) return;
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    };

    window.setEoColor = function(el) {
        document.querySelectorAll('.eo-color-opt').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
        applyEoColor(el.dataset.color);
    };

    window.switchEoTab = function(tab) {
        eoTab = tab;
        ['relogio','crono','timer'].forEach(t => {
            document.getElementById('eo-tab-' + t).classList.toggle('active', t === tab);
            const activeEl = document.getElementById('eo-tab-' + t);
            if (t === tab) { activeEl.style.background = eoColor; activeEl.style.color = '#000'; }
            else { activeEl.style.background = ''; activeEl.style.color = ''; }
        });
        updateEoDigital();
    };

    // Extend goTo to init Estudo Online
    const _origGoTo = window.goTo;
    window.goTo = function(viewId) {
        _origGoTo(viewId);
        if (viewId === 'view-estudo-online') initEstudoOnline();
    };