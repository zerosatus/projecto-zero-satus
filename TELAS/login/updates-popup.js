// Popup de Atualizações

const updates = [
    {
        version: "v2.2.0",
        date: "09/05/2026",
        title: "🔥 Banco de Dados em Tempo Real!",
        features: [
            "☁️ Realtime Database do Firebase totalmente integrado",
            "🔄 Sincronização automática entre dispositivos",
            "💾 Seus dados salvos com segurança na nuvem",
            "📱 Acesse suas anotações, tarefas e calendário em qualquer lugar",
            "⚡ Atualizações em tempo real sem precisar recarregar",
            "🔒 Segurança com autenticação por usuário",
            "🚀 Dados sincronizados automaticamente ao fazer login"
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
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <h2>Banco de Dados em Tempo Real!</h2>
                <button class="updates-popup-close">&times;</button>
            </div>
            <div class="updates-popup-body">
                <div class="update-badge">
                    <i class="fas fa-database"></i> Realtime Database conectado!
                </div>
                ${updates.map(update => `
                    <div class="update-version latest">
                        <div class="update-version-header">
                            <span class="update-version-tag">${update.version}</span>
                            <span class="update-version-date">${update.date}</span>
                            <span class="new-badge">ATIVO!</span>
                        </div>
                        <h3>${update.title}</h3>
                        <ul>
                            ${update.features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
                <div style="text-align: center; margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 12px;">
                    <i class="fas fa-sync-alt" style="color: #10b981; margin-right: 8px;"></i>
                    <span style="color: #10b981; font-size: 12px;">Sincronização automática ativada!</span>
                </div>
            </div>
            <div class="updates-popup-footer">
                <button class="updates-popup-btn" id="updates-gotit">Continuar</button>
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
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(16, 185, 129, 0.3);
            animation: slideUp 0.3s ease;
        }
        
        .updates-popup-header {
            padding: 20px 24px;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
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
            font-size: 22px;
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
            background: #10b981;
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
            background: rgba(16, 185, 129, 0.1);
            border-radius: 16px;
            padding: 16px;
            margin: -8px -8px 0 -8px;
            border: 1px solid rgba(16, 185, 129, 0.3);
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
            background: rgba(16, 185, 129, 0.2);
            color: #34d399;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(16, 185, 129, 0.3);
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
            background: rgba(0, 0, 0, 0.3);
        }
        
        .updates-popup-btn {
            width: 100%;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
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
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
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
                font-size: 18px;
            }
            
            .updates-popup-footer {
                flex-direction: column;
            }
            
            .updates-popup-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
    
    const closeBtn = popup.querySelector('.updates-popup-close');
    const gotitBtn = popup.querySelector('#updates-gotit');
    const overlay = popup.querySelector('.updates-popup-overlay');
    
    const closePopup = () => {
        popup.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => popup.remove(), 300);
        
        localStorage.setItem(`update_seen_${latestVersion}`, 'seen');
        localStorage.setItem('last_seen_update_version', latestVersion);
    };
    
    closeBtn.addEventListener('click', () => closePopup());
    gotitBtn.addEventListener('click', () => closePopup());
    overlay.addEventListener('click', () => closePopup());
    
    // Efeito de confete para celebrar o novo banco de dados
    setTimeout(() => {
        for (let i = 0; i < 40; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${['#10b981', '#059669', '#34d399', '#6ee7b7'][Math.floor(Math.random() * 4)]};
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

// Verificar se é a primeira vez que o usuário vê o popup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showUpdatesPopup);
} else {
    showUpdatesPopup();
}