// Popup de Atualizações

const updates = [
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
                    <i class="fas fa-database"></i>
                </div>
                <h2>Atualização!</h2>
                <button class="updates-popup-close">&times;</button>
            </div>
            <div class="updates-popup-body">
                <div class="update-badge">
                    <i class="fas fa-cloud-upload-alt"></i> Sincronização em Nuvem Ativada!
                </div>
                ${updates.map(update => `
                    <div class="update-version latest">
                        <div class="update-version-header">
                            <span class="update-version-tag">${update.version}</span>
                            <span class="update-version-date">${update.date}</span>
                            <span class="new-badge">ATUAL</span>
                        </div>
                        <h3>${update.title}</h3>
                        <ul>
                            ${update.features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
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
            border: 1px solid rgba(147, 51, 234, 0.3);
            animation: slideUp 0.3s ease;
        }
        
        .updates-popup-header {
            padding: 20px 24px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            margin-bottom: 10px;
        }
        
        .update-version.latest {
            background: rgba(16, 185, 129, 0.1);
            border-radius: 16px;
            padding: 16px;
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
        
        @media (max-width: 480px) {
            .updates-popup-content {
                max-width: 95%;
                max-height: 90vh;
            }
            
            .updates-popup-header h2 {
                font-size: 22px;
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
    
    closeBtn.addEventListener('click', closePopup);
    gotitBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);
}

// Verificar se é a primeira vez que o usuário vê o popup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showUpdatesPopup);
} else {
    showUpdatesPopup();
}