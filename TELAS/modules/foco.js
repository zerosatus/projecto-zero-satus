// ============================================
// modules/foco.js - TIMER DE FOCO MÁXIMO
// ============================================
class FocoModule {
    constructor(app) {
        this.app = app;
        this.name = 'foco';
        this.timeLeft = 25 * 60;
        this.totalTime = 25 * 60;
        this.isRunning = false;
        this.mode = 'timer';
        this.interval = null;
        this.selectedDisc = null;
        this.sessionsToday = 0;
        this.log = [];
        console.log('[Foco] ✅ Módulo inicializado');
    }

    render(data) {
        console.log('[Foco] 🎯 Renderizando timer de foco...');
        this.disciplinas = data.disciplinas || [];
        this.renderDisciplinas();
        this.updateTimerDisplay();
        this.renderLog();
        
        // Atalho: Espaço = Play/Pause
        this._keyHandler = (e) => {
            if (e.code === 'Space' && this.app.currentView === 'foco') {
                e.preventDefault();
                this.toggleTimer();
            }
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    renderDisciplinas() {
        const list = document.getElementById('foco-disc-list');
        if (!list) return;
        
        if (this.disciplinas.length === 0) {
            list.innerHTML = '<p style="color:#666;font-size:0.8rem;text-align:center;padding:20px;">Nenhuma disciplina cadastrada</p>';
            return;
        }

        list.innerHTML = this.disciplinas.map((d, i) => `
            <div class="disciplina-item ${this.selectedDisc === i ? 'active' : ''}" onclick="app.modules.foco.selectDisciplina(${i})">
                <div class="disc-icon" style="background:${d.cor || '#8b5cf6'}20;color:${d.cor || '#8b5cf6'}">
                    <i class="fas ${d.icone || 'fa-book'}"></i>
                </div>
                <div class="disc-info">
                    <h4>${this.app.escapeHtml(d.nome)}</h4>
                    <p>Padrão: ${d.tempoPadrao || 25}min</p>
                </div>
            </div>
        `).join('');
    }

    selectDisciplina(index) {
        this.selectedDisc = index;
        const disc = this.disciplinas[index];
        this.setDuration(disc.tempoPadrao || 25);
        this.renderDisciplinas();
        
        const nameEl = document.getElementById('timer-disc-name');
        if (nameEl) nameEl.innerHTML = `<i class="fas ${disc.icone || 'fa-book'}"></i> ${this.app.escapeHtml(disc.nome)}`;
    }

    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
        if (btn) btn.classList.add('active');
        this.resetTimer();
    }

    setDuration(mins) {
        if (this.mode !== 'timer') return;
        this.totalTime = mins * 60;
        this.timeLeft = this.totalTime;
        this.updateTimerDisplay();
        
        document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.dur-btn[data-min="${mins}"]`);
        if (btn) btn.classList.add('active');
    }

    toggleTimer() {
        if (this.isRunning) this.pauseTimer();
        else this.startTimer();
    }

    startTimer() {
        if (this.timeLeft <= 0 && this.mode === 'timer') return;
        this.isRunning = true;
        const statusEl = document.getElementById('foco-status');
        if (statusEl) statusEl.textContent = this.mode === 'timer' ? 'FOCANDO...' : 'CRONOMETRANDO';
        const iconEl = document.getElementById('btn-play-icon');
        if (iconEl) iconEl.className = 'fas fa-pause';
        
        this.interval = setInterval(() => {
            if (this.mode === 'timer') {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.finishTimer();
                    return;
                }
            } else {
                this.timeLeft++;
            }
            this.updateTimerDisplay();
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.interval);
        const statusEl = document.getElementById('foco-status');
        if (statusEl) statusEl.textContent = 'PAUSADO';
        const iconEl = document.getElementById('btn-play-icon');
        if (iconEl) iconEl.className = 'fas fa-play';
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.mode === 'timer' ? this.totalTime : 0;
        const statusEl = document.getElementById('foco-status');
        if (statusEl) statusEl.textContent = 'PRONTO PARA FOCAR';
        this.updateTimerDisplay();
    }

    addTime(mins) {
        this.timeLeft += mins * 60;
        if (this.mode === 'timer') this.totalTime += mins * 60;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const mins = Math.floor(Math.abs(this.timeLeft) / 60);
        const secs = Math.abs(this.timeLeft) % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        const timeEl = document.getElementById('foco-time');
        if (timeEl) timeEl.textContent = timeStr;
        
        document.title = `${timeStr} - Zero Satus Foco`;

        const circle = document.getElementById('timer-progress');
        if (circle && this.mode === 'timer' && this.totalTime > 0) {
            const circumference = 942;
            const progress = this.timeLeft / this.totalTime;
            const offset = circumference - (progress * circumference);
            circle.style.strokeDashoffset = offset;
        } else if (circle) {
            circle.style.strokeDashoffset = 0;
        }
    }

    finishTimer() {
        this.pauseTimer();
        this.sessionsToday++;
        const statEl = document.getElementById('stat-sessions');
        if (statEl) statEl.textContent = this.sessionsToday;
        
        const discName = this.selectedDisc !== null ? this.disciplinas[this.selectedDisc].nome : 'Geral';
        this.log.unshift({
            disc: discName,
            time: Math.floor(this.totalTime / 60) + 'min',
            hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
        });
        this.renderLog();
        
        const statusEl = document.getElementById('foco-status');
        if (statusEl) statusEl.textContent = 'SESSÃO CONCLUÍDA!';
        
        if (this.app.showToast) {
            this.app.showToast('🎉 Sessão de foco concluída!', 'success');
        }
    }

    renderLog() {
        const list = document.getElementById('foco-log-list');
        if (!list) return;
        
        if (this.log.length === 0) {
            list.innerHTML = '<p style="color:#666;font-size:0.8rem;text-align:center;">Nenhuma sessão hoje</p>';
            return;
        }

        list.innerHTML = this.log.map(l => `
            <div class="log-item">
                <div class="log-dot"></div>
                <div class="log-info">
                    <h4>${this.app.escapeHtml(l.disc)}</h4>
                    <p>${l.time}</p>
                </div>
                <div class="log-time">${l.hora}</div>
            </div>
        `).join('');
    }
}
console.log('[Foco] ✅ Módulo carregado!');