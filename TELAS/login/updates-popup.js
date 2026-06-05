const updates = [
    {
        version: "v2.1.0",
        date: "05/06/2026",
        title: "📸 Atualização - Foto de Perfil e Sincronização",
        features: [
            "🖼️ Adicione sua foto de perfil! Agora você pode personalizar sua conta com uma imagem",
            "☁️ Sincronização em tempo real da foto entre dispositivos (PC e Mobile)",
            "🔄 Remoção de horários no Mobile agora sincroniza instantaneamente com o PC",
            "📱 Melhorias na sincronização bidirecional entre Desktop e Mobile",
            "🐛 Correção de bugs na remoção de horários do calendário semanal",
            "⚡ Otimização do CacheManager para sincronização mais rápida",
            "🔔 Melhorias nas notificações em tempo real",
            "🎨 Interface aprimorada para upload de fotos"
        ]
    },
    {
        version: "v2.0.0",
        date: "29/05/2026",
        title: "🚀 Atualização Massiva - Sistema Completo",
        features: [
            "📱 Interface Mobile totalmente responsiva para WebView/APK",
            "🔐 Sistema de Autenticação com Firebase (Email/Senha)",
            "☁️ Sincronização em tempo real com Firebase Realtime Database",
            "💾 CacheManager com fallback offline",
            "📝 Editor de anotações com formatação rich text",
            "📅 Calendário acadêmico com visualização mensal/semanal/diária",
            "✅ Gerenciador de tarefas com prioridades e subtarefas",
            "📊 Dashboard com estatísticas e gráficos de desempenho",
            "👤 Perfil completo com avatar e configurações",
            "⏰ Timer de estudo integrado",
            "📈 Gráfico de horas de estudo semanais",
            "🗓️ Horário semanal personalizável",
            "🔔 Sistema de notificações em tempo real",
            "📱 Otimização para WebView Android",
            "🎨 Tema escuro e personalização de cores"
        ]
    },
    {
        version: "v1.1.0",
        date: "25/05/2026",
        title: "✨ Melhorias de Performance",
        features: [
            "⚡ Otimização do CacheManager para carregamento mais rápido",
            "🔄 Sincronização bidirecional entre abas",
            "🐛 Correção de bugs no calendário",
            "📱 Melhor responsividade para tablets",
            "🎨 Interface mais fluida e animações suaves",
            "🔒 Segurança aprimorada nas rotas"
        ]
    },
    {
        version: "v1.0.1",
        date: "18/05/2026",
        title: "🔄 Atualização de Estabilidade",
        features: [
            "☁️ Implementação do Firebase Realtime Database",
            "🐛 Correção do loop infinito entre login e dashboard",
            "🐛 Correção de redirecionamentos entre páginas",
            "🐛 Correção de caminhos relativos dos arquivos",
            "⚡ Melhorias na sincronização de dados em tempo real",
            "🔒 Segurança aprimorada no gerenciamento de sessão",
            "📱 Otimização para dispositivos móveis",
            "🚀 Performance geral melhorada"
        ]
    }
];

// Função para obter a frase do dia (fallback caso daily-phrases.js não esteja carregado)
function getFraseDoDiaParaPopup() {
    if (window.FrasesDoDia && typeof window.FrasesDoDia.getFraseDoDia === 'function') {
        return window.FrasesDoDia.getFraseDoDia();
    }
    
    // Frases de fallback caso o módulo não esteja disponível
    const frasesFallback = [
        "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
        "Acredite em si mesmo e todo o resto se encaixará.",
        "Não espere o momento perfeito. Aproveite o que tem e faça acontecer.",
        "Seu futuro é criado pelo que você faz hoje, não amanhã.",
        "A persistência é o caminho do êxito."
    ];
    
    const hoje = new Date();
    const diaDoAno = Math.floor((hoje - new Date(hoje.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const indice = diaDoAno % frasesFallback.length;
    
    return frasesFallback[indice];
}

function showUpdatesPopup() {
    const lastSeenVersion = localStorage.getItem('last_seen_update_version');
    const latestVersion = updates[0].version;
    
    if (lastSeenVersion === latestVersion) {
        console.log('[Updates] Usuário já viu a versão', latestVersion);
        return;
    }
    
    const hasSeen = localStorage.getItem(`update_seen_${latestVersion}`);
    if (hasSeen) {
        console.log('[Updates] Versão', latestVersion, 'já foi vista');
        return;
    }
    
    console.log('[Updates] Mostrando popup de novidades da versão', latestVersion);
    
    // Obter a frase motivacional do dia
    const fraseDoDia = getFraseDoDiaParaPopup();
    
    const popup = document.createElement('div');
    popup.className = 'updates-popup';
    popup.innerHTML = `
        <div class="updates-popup-overlay"></div>
        <div class="updates-popup-content">
            <div class="updates-popup-header">
                <div class="updates-popup-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h2>Novidades! 🎉</h2>
                <button class="updates-popup-close">&times;</button>
            </div>
            <div class="updates-popup-body">
                <!-- FRASE DO DIA - DESTAQUE -->
                <div class="frase-dia-highlight">
                    <div class="frase-dia-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div class="frase-dia-content">
                        <div class="frase-dia-label">✨ FRASE DO DIA ✨</div>
                        <div class="frase-dia-text">"${fraseDoDia}"</div>
                    </div>
                </div>
                
                <div class="update-badge">
                    <i class="fas fa-cloud-upload-alt"></i> Sincronização em Nuvem Ativada!
                </div>
                
                <div class="update-version latest">
                    <div class="update-version-header">
                        <span class="update-version-tag">${updates[0].version}</span>
                        <span class="update-version-date">${updates[0].date}</span>
                        <span class="new-badge">ATUAL</span>
                    </div>
                    <h3>${updates[0].title}</h3>
                    <ul>
                        ${updates[0].features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="updates-older">
                    <button class="older-toggle" id="toggle-older">
                        <i class="fas fa-chevron-down"></i> Versões anteriores (${updates.length - 1})
                    </button>
                    <div class="older-content" style="display: none;">
                        ${updates.slice(1).map(update => `
                            <div class="update-version">
                                <div class="update-version-header">
                                    <span class="update-version-tag">${update.version}</span>
                                    <span class="update-version-date">${update.date}</span>
                                </div>
                                <h3>${update.title}</h3>
                                <ul>
                                    ${update.features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="updates-popup-footer">
                <button class="updates-popup-btn" id="updates-gotit">Continuar para o App</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    const style = document.createElement('style');
    style.textContent = `
        .updates-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        
        .updates-popup-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(5px);
        }
        
        .updates-popup-content {
            position: relative;
            max-width: 550px;
            width: 90%;
            max-height: 85vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(147, 51, 234, 0.3);
            animation: slideUp 0.3s ease;
        }
        
        .updates-popup-header {
            padding: 20px 24px;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
        }
        
        .updates-popup-icon {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .updates-popup-icon i {
            font-size: 28px;
            color: white;
        }
        
        .updates-popup-header h2 {
            color: white;
            font-size: 28px;
            margin: 0;
            flex: 1;
            font-weight: 700;
        }
        
        .updates-popup-close {
            background: none;
            border: none;
            color: white;
            font-size: 28px;
            cursor: pointer;
            padding: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }
        
        .updates-popup-close:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }
        
        .updates-popup-body {
            padding: 20px 24px;
            max-height: 55vh;
            overflow-y: auto;
        }
        
        .updates-popup-body::-webkit-scrollbar {
            width: 6px;
        }
        
        .updates-popup-body::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }
        
        .updates-popup-body::-webkit-scrollbar-thumb {
            background: #8b5cf6;
            border-radius: 3px;
        }
        
        /* ESTILOS DA FRASE DO DIA NO POPUP */
        .frase-dia-highlight {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.1));
            border-radius: 20px;
            padding: 16px 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            border: 1px solid rgba(139, 92, 246, 0.4);
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
        }
        
        .frase-dia-icon {
            width: 48px;
            height: 48px;
            background: rgba(139, 92, 246, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .frase-dia-icon i {
            font-size: 24px;
            color: #a78bfa;
        }
        
        .frase-dia-content {
            flex: 1;
        }
        
        .frase-dia-label {
            font-size: 10px;
            letter-spacing: 2px;
            color: #a78bfa;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .frase-dia-text {
            font-size: 14px;
            line-height: 1.5;
            color: #e2e8f0;
            font-style: italic;
            font-weight: 500;
        }
        
        .update-badge {
            background: rgba(139, 92, 246, 0.2);
            border: 1px solid rgba(139, 92, 246, 0.5);
            border-radius: 30px;
            padding: 8px 16px;
            text-align: center;
            margin-bottom: 20px;
            color: #a78bfa;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .update-version {
            margin-bottom: 20px;
        }
        
        .update-version.latest {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 16px;
            padding: 16px;
            border: 1px solid rgba(139, 92, 246, 0.3);
            margin-bottom: 16px;
        }
        
        .update-version-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .update-version-tag {
            background: rgba(139, 92, 246, 0.2);
            color: #c4b5fd;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }
        
        .update-version-date {
            color: #888;
            font-size: 11px;
        }
        
        .new-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        
        .update-version h3 {
            color: white;
            font-size: 16px;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .update-version ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .update-version li {
            color: #ccc;
            font-size: 13px;
            padding: 8px 0;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .update-version li:last-child {
            border-bottom: none;
        }
        
        .update-version li i {
            color: #10b981;
            font-size: 14px;
            width: 20px;
            flex-shrink: 0;
        }
        
        .updates-older {
            margin-top: 8px;
        }
        
        .older-toggle {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 10px 16px;
            color: #a78bfa;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
        }
        
        .older-toggle:hover {
            background: rgba(139, 92, 246, 0.15);
            border-color: rgba(139, 92, 246, 0.3);
        }
        
        .older-content {
            margin-top: 12px;
        }
        
        .older-content .update-version {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 8px;
        }
        
        .older-content .update-version h3 {
            font-size: 14px;
        }
        
        .older-content .update-version li {
            font-size: 12px;
            padding: 6px 0;
        }
        
        .updates-popup-footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            background: rgba(0, 0, 0, 0.3);
        }
        
        .updates-popup-btn {
            width: 100%;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            border: none;
            padding: 14px 20px;
            border-radius: 40px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .updates-popup-btn:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @media (max-width: 480px) {
            .updates-popup-content {
                max-width: 95%;
                max-height: 90vh;
            }
            
            .updates-popup-header h2 {
                font-size: 22px;
            }
            
            .update-version.latest {
                padding: 12px;
            }
            
            .update-version h3 {
                font-size: 14px;
            }
            
            .update-version li {
                font-size: 11px;
            }
            
            .frase-dia-highlight {
                padding: 12px 16px;
            }
            
            .frase-dia-icon {
                width: 36px;
                height: 36px;
            }
            
            .frase-dia-icon i {
                font-size: 18px;
            }
            
            .frase-dia-text {
                font-size: 12px;
            }
        }
    `;
    document.head.appendChild(style);
    
    const closeBtn = popup.querySelector('.updates-popup-close');
    const gotitBtn = popup.querySelector('#updates-gotit');
    const overlay = popup.querySelector('.updates-popup-overlay');
    const toggleBtn = popup.querySelector('#toggle-older');
    const olderContent = popup.querySelector('.older-content');
    
    if (toggleBtn && olderContent) {
        toggleBtn.addEventListener('click', () => {
            const isVisible = olderContent.style.display === 'block';
            olderContent.style.display = isVisible ? 'none' : 'block';
            toggleBtn.innerHTML = isVisible 
                ? `<i class="fas fa-chevron-down"></i> Versões anteriores (${updates.length - 1})`
                : `<i class="fas fa-chevron-up"></i> Mostrar menos`;
        });
    }
    
    const closePopup = () => {
        popup.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => popup.remove(), 300);
        
        localStorage.setItem(`update_seen_${latestVersion}`, 'seen');
        localStorage.setItem('last_seen_update_version', latestVersion);
        console.log('[Updates] Popup fechado, versão', latestVersion, 'marcada como vista');
    };
    
    closeBtn.addEventListener('click', closePopup);
    gotitBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);
    
    document.addEventListener('keydown', function onEsc(e) {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', onEsc);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(showUpdatesPopup, 500);
    });
} else {
    setTimeout(showUpdatesPopup, 500);
}