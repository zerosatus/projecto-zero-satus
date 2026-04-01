// Popup de Atualizações

const updates = [
    {
        version: "v2.0.0",
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
            "🚀 Performance e carregamento mais rápido"
        ]
    },
    {
        version: "v1.5.0",
        date: "15/03/2026",
        title: "🚀 Melhorias de Performance",
        features: [
            "⚡ Carregamento mais rápido",
            "💾 Melhor sincronização de dados",
            "🐛 Correção de bugs no horário semanal",
            "📱 Melhor responsividade em tablets"
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
            "👤 Perfil do usuário com configurações"
        ]
    }
];

function showUpdatesPopup() {
    const lastSeenVersion = localStorage.getItem('last_seen_update_version');
    const latestVersion = updates[0].version;
    
    if (lastSeenVersion === latestVersion) {
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
                ${updates.map(update => `
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
            <div class="updates-popup-footer">
                <button class="updates-popup-btn" id="updates-gotit">Entendi!</button>
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
            border-radius: 24px;
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
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .updates-popup-icon i {
            font-size: 24px;
            color: white;
        }
        
        .updates-popup-header h2 {
            color: white;
            font-size: 24px;
            margin: 0;
            flex: 1;
        }
        
        .updates-popup-close {
            background: none;
            border: none;
            color: white;
            font-size: 28px;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }
        
        .updates-popup-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .updates-popup-body {
            padding: 20px 24px;
            max-height: 60vh;
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
        
        .update-version {
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .update-version:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .update-version-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
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
        
        .update-version h3 {
            color: white;
            font-size: 18px;
            margin-bottom: 12px;
        }
        
        .update-version ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .update-version li {
            color: #ccc;
            font-size: 14px;
            padding: 6px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .update-version li i {
            color: #10b981;
            font-size: 14px;
            width: 20px;
        }
        
        .updates-popup-footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }
        
        .updates-popup-btn {
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            border: none;
            padding: 12px 32px;
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
    `;
    document.head.appendChild(style);
    
    const closeBtn = popup.querySelector('.updates-popup-close');
    const gotitBtn = popup.querySelector('#updates-gotit');
    const overlay = popup.querySelector('.updates-popup-overlay');
    
    const closePopup = () => {
        popup.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => popup.remove(), 300);
        localStorage.setItem('last_seen_update_version', latestVersion);
    };
    
    closeBtn.addEventListener('click', closePopup);
    gotitBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showUpdatesPopup);
} else {
    showUpdatesPopup();
}
