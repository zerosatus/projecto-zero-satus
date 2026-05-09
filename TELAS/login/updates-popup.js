// Popup de Atualizações

const updates = [
    {
        version: "v2.1.0",
        date: "01/04/2026",
        title: "🎉 Nova Versão!",
        features: [
            "✨ Sistema de persistência de dados por usuário",
            "📱 Interface otimizada para dispositivos móveis",
            "🔒 Segurança aprimorada com cache por usuário",
            "📝 Anotações agora são salvas permanentemente",
            "📅 Calendário com eventos personalizados",
            "✅ Gerenciamento de tarefas completo",
            "🎨 Tema escuro e personalização de cores",
            "🚀 Performance e carregamento mais rápido",
            "🖼️ Upload de foto de perfil",
            "☁️ Sincronização com nuvem via Firebase",
            "📱 Aplicativo responsivo para todos os dispositivos"
        ]
    },
    {
        version: "v2.0.0",
        date: "25/03/2026",
        title: "🚀 Sincronização em Nuvem",
        features: [
            "☁️ Sincronização automática com Firebase",
            "💾 Dados salvos localmente e na nuvem",
            "🔄 Sincronização entre múltiplos dispositivos",
            "📱 Login com Google e GitHub",
            "🔐 Segurança aprimorada"
        ]
    },
    {
        version: "v1.5.0",
        date: "15/03/2026",
        title: "⚡ Melhorias de Performance",
        features: [
            "⚡ Carregamento mais rápido",
            "💾 Melhor sincronização de dados",
            "🐛 Correção de bugs no horário semanal",
            "📱 Melhor responsividade em tablets",
            "🎨 Interface mais intuitiva"
        ]
    },
    {
        version: "v1.0.0",
        date: "01/03/2026",
        title: "🎯 Lançamento Oficial",
        features: [
            "🏠 Dashboard com resumo de atividades",
            "📊 Horário semanal personalizável",
            "📝 Sistema de anotações",
            "📅 Calendário acadêmico",
            "✅ Lista de tarefas com prioridades",
            "👤 Perfil do usuário com configurações",
            "🔔 Sistema de notificações"
        ]
    }
];

function showUpdatesPopup() {
    const lastSeenVersion = localStorage.getItem('last_seen_update_version');
    const latestVersion = updates[0].version;
    
    // Se já viu a última versão, não mostra
    if (lastSeenVersion === latestVersion) {
        return;
    }
    
    // Verificar se é a primeira vez que o usuário vê essa versão
    const hasSeen = localStorage.getItem(`update_seen_${latestVersion}`);
    if (hasSeen) {
        return;
    }
    
    const popup = document.createElement('div');
    popup.className = 'updates-popup';
    popup.innerHTML = `
        <div class="updates-popup-overlay"></div>
        <div class="updates-popup-content">
            <div class="updates-popup-header">
                <div class="updates-popup-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h2>Novidades!</h2>
                <button class="updates-popup-close">&times;</button>
            </div>
            <div class="updates-popup-body">
                <div class="update-badge">
                    <i class="fas fa-star"></i> Nova versão disponível!
                </div>
                ${updates.map(update => `
                    <div class="update-version ${update.version === latestVersion ? 'latest' : ''}">
                        <div class="update-version-header">
                            <span class="update-version-tag">${update.version}</span>
                            <span class="update-version-date">${update.date}</span>
                            ${update.version === latestVersion ? '<span class="new-badge">NOVO!</span>' : ''}
                        </div>
                        <h3>${update.title}</h3>
                        <ul>
                            ${update.features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
            <div class="updates-popup-footer">
                <button class="updates-popup-btn" id="updates-gotit">Entendi!</button>
                <button class="updates-popup-skip" id="updates-skip">Ignorar esta versão</button>
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
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
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
            animation: pulse 2s infinite;
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
            background: #9333ea;
            border-radius: 3px;
        }
        
        .update-badge {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.5);
            border-radius: 30px;
            padding: 8px 16px;
            text-align: center;
            margin-bottom: 20px;
            color: #10b981;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .update-badge i {
            font-size: 14px;
        }
        
        .update-version {
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
        }
        
        .update-version:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .update-version.latest {
            background: rgba(147, 51, 234, 0.1);
            border-radius: 16px;
            padding: 16px;
            margin: -8px -8px 24px -8px;
            border: 1px solid rgba(147, 51, 234, 0.3);
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
            background: rgba(147, 51, 234, 0.2);
            color: #c084fc;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(147, 51, 234, 0.3);
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
            font-size: 18px;
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
        
        .updates-popup-footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            display: flex;
            gap: 12px;
            background: rgba(0, 0, 0, 0.3);
        }
        
        .updates-popup-btn {
            flex: 2;
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            border: none;
            padding: 12px 20px;
            border-radius: 40px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .updates-popup-btn:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
        }
        
        .updates-popup-skip {
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 12px 20px;
            border-radius: 40px;
            color: #aaa;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .updates-popup-skip:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
            }
        }
        
        @media (max-width: 480px) {
            .updates-popup-content {
                max-width: 95%;
                max-height: 90vh;
            }
            
            .updates-popup-header h2 {
                font-size: 22px;
            }
            
            .updates-popup-footer {
                flex-direction: column;
            }
            
            .updates-popup-btn,
            .updates-popup-skip {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
    
    const closeBtn = popup.querySelector('.updates-popup-close');
    const gotitBtn = popup.querySelector('#updates-gotit');
    const skipBtn = popup.querySelector('#updates-skip');
    const overlay = popup.querySelector('.updates-popup-overlay');
    
    const closePopup = (saveSkip = false) => {
        popup.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => popup.remove(), 300);
        
        if (saveSkip) {
            localStorage.setItem(`update_seen_${latestVersion}`, 'skipped');
        } else {
            localStorage.setItem(`update_seen_${latestVersion}`, 'seen');
        }
        localStorage.setItem('last_seen_update_version', latestVersion);
    };
    
    closeBtn.addEventListener('click', () => closePopup(false));
    gotitBtn.addEventListener('click', () => closePopup(false));
    skipBtn.addEventListener('click', () => closePopup(true));
    overlay.addEventListener('click', () => closePopup(false));
    
    // Adicionar efeito de confete para versões importantes
    if (latestVersion === 'v2.1.0') {
        setTimeout(() => {
            // Efeito simples de confete
            for (let i = 0; i < 30; i++) {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: 8px;
                    height: 8px;
                    background: ${['#9333ea', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)]};
                    top: -10px;
                    left: ${Math.random() * 100}%;
                    border-radius: 2px;
                    animation: confettiFall ${1 + Math.random() * 2}s linear forwards;
                    z-index: 10001;
                    pointer-events: none;
                `;
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }
            
            const confettiStyle = document.createElement('style');
            confettiStyle.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(confettiStyle);
        }, 100);
    }
}

// Verificar se é a primeira vez que o usuário vê o popup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showUpdatesPopup);
} else {
    showUpdatesPopup();
}
