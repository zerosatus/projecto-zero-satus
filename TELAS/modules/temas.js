// ============================================
// modules/temas.js - GERENCIADOR DE TEMAS
// ============================================

class TemasModule {
    constructor(app) {
        this.app = app;
        this.name = 'temas';
        
        // Temas disponíveis
        this.temas = {
            dark: {
                nome: 'Escuro',
                icone: 'fa-moon',
                vars: {
                    '--bg-color': '#0f1115',
                    '--card-bg': '#1a1d24',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#9ca3af',
                    '--border-color': '#2d3748',
                    '--nav-bg': '#1a1d24'
                }
            },
            light: {
                nome: 'Claro',
                icone: 'fa-sun',
                vars: {
                    '--bg-color': '#f5f5f7',
                    '--card-bg': '#ffffff',
                    '--text-primary': '#1a1a1a',
                    '--text-secondary': '#6b7280',
                    '--border-color': '#e5e7eb',
                    '--nav-bg': '#ffffff'
                }
            },
            midnight: {
                nome: 'Meia-Noite',
                icone: 'fa-star',
                vars: {
                    '--bg-color': '#0a0e27',
                    '--card-bg': '#131842',
                    '--text-primary': '#e0e7ff',
                    '--text-secondary': '#818cf8',
                    '--border-color': '#1e2a5e',
                    '--nav-bg': '#131842'
                }
            },
            sunset: {
                nome: 'Pôr do Sol',
                icone: 'fa-fire',
                vars: {
                    '--bg-color': '#1a0f0a',
                    '--card-bg': '#2d1810',
                    '--text-primary': '#ffe4d6',
                    '--text-secondary': '#fb923c',
                    '--border-color': '#4a2418',
                    '--nav-bg': '#2d1810'
                }
            },
            forest: {
                nome: 'Floresta',
                icone: 'fa-tree',
                vars: {
                    '--bg-color': '#0a1a0f',
                    '--card-bg': '#0f2418',
                    '--text-primary': '#d1fae5',
                    '--text-secondary': '#6ee7b7',
                    '--border-color': '#1e4a2e',
                    '--nav-bg': '#0f2418'
                }
            },
            ocean: {
                nome: 'Oceano',
                icone: 'fa-water',
                vars: {
                    '--bg-color': '#0a1628',
                    '--card-bg': '#0f2138',
                    '--text-primary': '#dbeafe',
                    '--text-secondary': '#60a5fa',
                    '--border-color': '#1e3a5f',
                    '--nav-bg': '#0f2138'
                }
            }
        };
        
        // Cores de destaque disponíveis
        this.cores = [
            { nome: 'Roxo', valor: '#8b5cf6' },
            { nome: 'Azul', valor: '#3b82f6' },
            { nome: 'Verde', valor: '#10b981' },
            { nome: 'Laranja', valor: '#f59e0b' },
            { nome: 'Vermelho', valor: '#ef4444' },
            { nome: 'Rosa', valor: '#ec4899' },
            { nome: 'Ciano', valor: '#06b6d4' },
            { nome: 'Índigo', valor: '#6366f1' }
        ];
        
        this.currentTheme = 'dark';
        this.currentAccent = '#8b5cf6';
        this.autoTheme = false;  // Seguir sistema
        
        console.log('[Temas] 🎨 Módulo inicializado');
        this.loadTheme();
    }
    
    // ============================================
    // CARREGAR TEMA SALVO
    // ============================================
    loadTheme() {
        const saved = localStorage.getItem('app_theme');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentTheme = data.theme || 'dark';
                this.currentAccent = data.accent || '#8b5cf6';
                this.autoTheme = data.auto || false;
            } catch(e) {}
        }
        
        // Se auto, seguir sistema
        if (this.autoTheme && window.matchMedia) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
        
        this.applyTheme(this.currentTheme);
        this.applyAccent(this.currentAccent);
    }
    
    // ============================================
    // SALVAR TEMA
    // ============================================
    saveTheme() {
        localStorage.setItem('app_theme', JSON.stringify({
            theme: this.currentTheme,
            accent: this.currentAccent,
            auto: this.autoTheme
        }));
        
        if (window.CacheManager) {
            window.CacheManager.set('themeSettings', {
                theme: this.currentTheme,
                accent: this.currentAccent,
                auto: this.autoTheme
            }, true);
        }
        
        // Atualizar Supabase (user_settings)
        if (this.app.user?.id && window.DatabaseService?.saveUserSettings) {
            window.DatabaseService.saveUserSettings(this.app.user.id, {
                theme: this.currentTheme,
                accent: this.currentAccent
            }).catch(() => {});
        }
    }
    
    // ============================================
    // APLICAR TEMA
    // ============================================
    applyTheme(themeName) {
        const tema = this.temas[themeName];
        if (!tema) {
            console.warn('[Temas] ⚠️ Tema não encontrado:', themeName);
            return;
        }
        
        const root = document.documentElement;
        
        Object.entries(tema.vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        
        // Aplicar classe para CSS específico
        document.body.classList.remove('theme-dark', 'theme-light', 'theme-midnight', 'theme-sunset', 'theme-forest', 'theme-ocean');
        document.body.classList.add(`theme-${themeName}`);
        
        // Meta theme-color para mobile
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', tema.vars['--bg-color']);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = tema.vars['--bg-color'];
            document.head.appendChild(meta);
        }
        
        this.currentTheme = themeName;
        console.log('[Temas] ✅ Tema aplicado:', tema.nome);
    }
    
    // ============================================
    // APLICAR COR DE DESTAQUE
    // ============================================
    applyAccent(color) {
        document.documentElement.style.setProperty('--accent-purple', color);
        // Variações
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--accent-color', color);
        
        this.currentAccent = color;
        console.log('[Temas] ✅ Cor de destaque aplicada:', color);
    }
    
    // ============================================
    // ALTERAR TEMA
    // ============================================
    setTheme(themeName) {
        this.autoTheme = false;
        this.applyTheme(themeName);
        this.saveTheme();
        this.showToast(`🎨 Tema "${this.temas[themeName].nome}" aplicado!`, 'success');
    }
    
    // ============================================
    // ALTERAR COR DE DESTAQUE
    // ============================================
    setAccent(color) {
        this.applyAccent(color);
        this.saveTheme();
        this.showToast('🎨 Cor de destaque atualizada!', 'success');
    }
    
    // ============================================
    // MODO AUTOMÁTICO (seguir sistema)
    // ============================================
    setAutoTheme(enabled) {
        this.autoTheme = enabled;
        
        if (enabled && window.matchMedia) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
            
            // Listener para mudanças no sistema
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.autoTheme) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
        
        this.saveTheme();
        this.showToast(enabled ? '🌗 Modo automático ativado!' : '🎨 Modo manual ativado!', 'success');
    }
    
    // ============================================
    // RENDER (chamado do app)
    // ============================================
    render(data) {
        this.loadTheme();
    }
    
    // ============================================
    // ABRIR MODAL DE TEMAS
    // ============================================
    openModal() {
        let modal = document.getElementById('temas-modal');
        
        if (!modal) {
            modal = this.createModal();
        }
        
        this.updateModalUI();
        modal.classList.add('active');
    }
    
    // ============================================
    // CRIAR MODAL
    // ============================================
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'profile-modal';
        modal.id = 'temas-modal';
        
        // HTML dos temas
        let temasHTML = '';
        Object.entries(this.temas).forEach(([key, tema]) => {
            temasHTML += `
                <div class="theme-card" data-theme="${key}" 
                     onclick="app.modules.temas.setTheme('${key}')">
                    <div class="theme-preview" style="background: ${tema.vars['--bg-color']};">
                        <div class="theme-preview-card" style="background: ${tema.vars['--card-bg']};"></div>
                        <div class="theme-preview-accent" style="background: ${tema.vars['--text-primary']};"></div>
                    </div>
                    <div class="theme-card-info">
                        <i class="fas ${tema.icone}"></i>
                        <span>${tema.nome}</span>
                    </div>
                    <div class="theme-check">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            `;
        });
        
        // HTML das cores
        let coresHTML = '';
        this.cores.forEach(cor => {
            coresHTML += `
                <div class="accent-color-option" data-color="${cor.valor}"
                     style="background: ${cor.valor};"
                     onclick="app.modules.temas.setAccent('${cor.valor}')"
                     title="${cor.nome}">
                    <i class="fas fa-check"></i>
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <button class="btn-back-modal" onclick="app.modules.temas.closeModal()">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2><i class="fas fa-palette"></i> Temas</h2>
                    <button class="btn-close-modal-btn" onclick="app.modules.temas.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="profile-form">
                    <!-- Modo Automático -->
                    <div class="toggle-option">
                        <div class="toggle-info">
                            <i class="fas fa-adjust"></i>
                            <div>
                                <span class="toggle-title">Modo Automático</span>
                                <span class="toggle-desc">Segue o tema do sistema</span>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="theme-auto-toggle"
                                   onchange="app.modules.temas.setAutoTheme(this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <!-- Grid de Temas -->
                    <div style="margin-top: 8px;">
                        <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 12px;">
                            <i class="fas fa-swatchbook"></i> Escolha um Tema
                        </label>
                        <div class="themes-grid">
                            ${temasHTML}
                        </div>
                    </div>
                    
                    <!-- Cores de Destaque -->
                    <div style="margin-top: 20px;">
                        <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 12px;">
                            <i class="fas fa-tint"></i> Cor de Destaque
                        </label>
                        <div class="accent-colors-grid">
                            ${coresHTML}
                        </div>
                    </div>
                    
                    <!-- Preview -->
                    <div style="margin-top: 20px; padding: 16px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px;">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;">
                            <i class="fas fa-eye"></i> Pré-visualização
                        </div>
                        <button class="btn-primary" style="width: 100%; padding: 12px; border-radius: 10px; border: none; color: white; font-weight: 600; cursor: pointer; background: var(--accent-purple);">
                            Botão de Exemplo
                        </button>
                        <div style="margin-top: 8px; padding: 10px; background: var(--bg-color); border-radius: 8px; color: var(--text-primary); font-size: 0.85rem;">
                            Texto de exemplo com a nova cor de destaque.
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
    
    // ============================================
    // ATUALIZAR UI DO MODAL
    // ============================================
    updateModalUI() {
        // Toggle auto
        const autoToggle = document.getElementById('theme-auto-toggle');
        if (autoToggle) autoToggle.checked = this.autoTheme;
        
        // Marcar tema ativo
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.dataset.theme === this.currentTheme);
        });
        
        // Marcar cor ativa
        document.querySelectorAll('.accent-color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === this.currentAccent);
        });
    }
    
    closeModal() {
        document.getElementById('temas-modal')?.classList.remove('active');
    }
    
    showToast(mensagem, tipo) {
        if (typeof showToast === 'function') {
            showToast(mensagem, tipo);
        } else {
            console.log('[Temas]', mensagem);
        }
    }
}

console.log('[Temas] ✅ Módulo carregado!');