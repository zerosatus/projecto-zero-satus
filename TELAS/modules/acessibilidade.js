// ============================================
// modules/acessibilidade.js - ACESSIBILIDADE
// ============================================

class AcessibilidadeModule {
    constructor(app) {
        this.app = app;
        this.name = 'acessibilidade';
        this.settings = {
            fontSize: 100,        // %
            highContrast: false,
            reduceMotion: false,
            dyslexicFont: false,
            focusVisible: true,
            screenReader: false
        };
        
        console.log('[Acessibilidade] ♿ Módulo inicializado');
        this.loadSettings();
    }
    
    // ============================================
    // CARREGAR CONFIGURAÇÕES
    // ============================================
    loadSettings() {
        const saved = localStorage.getItem('a11y_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch(e) {}
        }
        this.applySettings();
    }
    
    // ============================================
    // SALVAR CONFIGURAÇÕES
    // ============================================
    saveSettings() {
        localStorage.setItem('a11y_settings', JSON.stringify(this.settings));
        
        if (window.CacheManager) {
            window.CacheManager.set('a11ySettings', this.settings, true);
        }
        
        this.applySettings();
        this.showToast('✅ Acessibilidade atualizada!', 'success');
    }
    
    // ============================================
    // APLICAR CONFIGURAÇÕES
    // ============================================
    applySettings() {
        const root = document.documentElement;
        const body = document.body;
        
        // 1. Tamanho da fonte
        root.style.fontSize = `${this.settings.fontSize}%`;
        
        // 2. Alto contraste
        body.classList.toggle('high-contrast', this.settings.highContrast);
        
        // 3. Reduzir movimento
        body.classList.toggle('reduce-motion', this.settings.reduceMotion);
        
        // 4. Fonte para dislexia
        body.classList.toggle('dyslexic-font', this.settings.dyslexicFont);
        
        // 5. Foco visível
        body.classList.toggle('focus-visible', this.settings.focusVisible);
        
        // 6. Modo leitor de tela (ARIA labels extras)
        body.classList.toggle('screen-reader-mode', this.settings.screenReader);
        
        // 7. Preferência do sistema
        if (window.matchMedia) {
            const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReduced && !this.settings.reduceMotion) {
                body.classList.add('reduce-motion');
            }
        }
        
        console.log('[Acessibilidade] ✅ Configurações aplicadas:', this.settings);
    }
    
    // ============================================
    // RENDER (para chamar do app)
    // ============================================
    render(data) {
        this.loadSettings();
    }
    
    // ============================================
    // ABRIR MODAL DE ACESSIBILIDADE
    // ============================================
    openModal() {
        let modal = document.getElementById('a11y-modal');
        
        if (!modal) {
            modal = this.createModal();
        }
        
        // Atualizar valores
        document.getElementById('a11y-font-size').value = this.settings.fontSize;
        document.getElementById('a11y-font-size-value').textContent = `${this.settings.fontSize}%`;
        document.getElementById('a11y-high-contrast').checked = this.settings.highContrast;
        document.getElementById('a11y-reduce-motion').checked = this.settings.reduceMotion;
        document.getElementById('a11y-dyslexic').checked = this.settings.dyslexicFont;
        document.getElementById('a11y-focus-visible').checked = this.settings.focusVisible;
        document.getElementById('a11y-screen-reader').checked = this.settings.screenReader;
        
        modal.classList.add('active');
    }
    
    // ============================================
    // CRIAR MODAL
    // ============================================
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'profile-modal';
        modal.id = 'a11y-modal';
        modal.innerHTML = `
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <button class="btn-back-modal" onclick="app.modules.acessibilidade.closeModal()">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2><i class="fas fa-universal-access"></i> Acessibilidade</h2>
                    <button class="btn-close-modal-btn" onclick="app.modules.acessibilidade.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="profile-form">
                    <!-- Tamanho da Fonte -->
                    <div class="a11y-group">
                        <label><i class="fas fa-text-height"></i> Tamanho da Fonte</label>
                        <div class="a11y-range-wrapper">
                            <button class="a11y-btn" onclick="app.modules.acessibilidade.changeFontSize(-10)">A-</button>
                            <input type="range" id="a11y-font-size" min="80" max="150" step="10" value="100"
                                   oninput="app.modules.acessibilidade.changeFontSize(this.value - 100, true)">
                            <button class="a11y-btn" onclick="app.modules.acessibilidade.changeFontSize(10)">A+</button>
                        </div>
                        <div class="a11y-value" id="a11y-font-size-value">100%</div>
                    </div>
                    
                    <!-- Alto Contraste -->
                    <div class="toggle-option">
                        <div class="toggle-info">
                            <i class="fas fa-adjust"></i>
                            <div>
                                <span class="toggle-title">Alto Contraste</span>
                                <span class="toggle-desc">Aumenta o contraste das cores</span>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="a11y-high-contrast"
                                   onchange="app.modules.acessibilidade.toggle('highContrast', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <!-- Reduzir Movimento -->
                    <div class="toggle-option">
                        <div class="toggle-info">
                            <i class="fas fa-wind"></i>
                            <div>
                                <span class="toggle-title">Reduzir Movimento</span>
                                <span class="toggle-desc">Desativa animações e transições</span>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="a11y-reduce-motion"
                                   onchange="app.modules.acessibilidade.toggle('reduceMotion', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <!-- Fonte para Dislexia -->
                    <div class="toggle-option">
                        <div class="toggle-info">
                            <i class="fas fa-font"></i>
                            <div>
                                <span class="toggle-title">Fonte para Dislexia</span>
                                <span class="toggle-desc">Usa fonte mais legível</span>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="a11y-dyslexic"
                                   onchange="app.modules.acessibilidade.toggle('dyslexicFont', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <!-- Foco Visível -->
                    <div class="toggle-option">
                        <div class="toggle-info">
                            <i class="fas fa-crosshairs"></i>
                            <div>
                                <span class="toggle-title">Foco Visível</span>
                                <span class="toggle-desc">Destaca elementos focados</span>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="a11y-focus-visible"
                                   onchange="app.modules.acessibilidade.toggle('focusVisible', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <!-- Modo Leitor de Tela -->
                    <div class="toggle-option">
                        <div class="toggle-info">
                            <i class="fas fa-assistive-listening-systems"></i>
                            <div>
                                <span class="toggle-title">Modo Leitor de Tela</span>
                                <span class="toggle-desc">Adiciona descrições ARIA</span>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="a11y-screen-reader"
                                   onchange="app.modules.acessibilidade.toggle('screenReader', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <!-- Botão Reset -->
                    <button class="btn-secondary" onclick="app.modules.acessibilidade.reset()"
                            style="margin-top: 10px;">
                        <i class="fas fa-undo"></i> Restaurar Padrões
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
    
    // ============================================
    // AÇÕES
    // ============================================
    changeFontSize(delta, isAbsolute = false) {
        if (isAbsolute) {
            this.settings.fontSize = parseInt(delta) + 100;
        } else {
            this.settings.fontSize = Math.max(80, Math.min(150, this.settings.fontSize + delta));
        }
        
        document.getElementById('a11y-font-size').value = this.settings.fontSize;
        document.getElementById('a11y-font-size-value').textContent = `${this.settings.fontSize}%`;
        
        this.saveSettings();
    }
    
    toggle(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }
    
    reset() {
        this.settings = {
            fontSize: 100,
            highContrast: false,
            reduceMotion: false,
            dyslexicFont: false,
            focusVisible: true,
            screenReader: false
        };
        this.saveSettings();
        this.openModal();
    }
    
    closeModal() {
        document.getElementById('a11y-modal')?.classList.remove('active');
    }
    
    // ============================================
    // TOAST
    // ============================================
    showToast(mensagem, tipo = 'success') {
        if (typeof showToast === 'function') {
            showToast(mensagem, tipo);
        } else {
            console.log('[A11y]', mensagem);
        }
    }
}

console.log('[Acessibilidade] ✅ Módulo carregado!');