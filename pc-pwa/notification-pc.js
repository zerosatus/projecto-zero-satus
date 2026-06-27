// pc-pwa/notification-pc.js
// Sistema de notificações APENAS para PC com PWA instalado

const PcNotification = {
    _isInitialized: false,
    _registration: null,
    _subscription: null,

    /**
     * Inicializa o sistema de notificações
     */
    async init() {
        if (this._isInitialized) return;
        
        // 🔥 SÓ EXECUTA SE FOR PC E PWA INSTALADO
        if (!window.PwaDetector || !window.PwaDetector.canUsePwaFeatures()) {
            console.log('[PcNotify] ❌ Notificações desativadas - não é PC ou PWA não instalado');
            return;
        }

        console.log('[PcNotify] ✅ Inicializando notificações para PC/PWA');
        this._isInitialized = true;

        // Espera o Service Worker estar pronto
        if ('serviceWorker' in navigator) {
            try {
                this._registration = await navigator.serviceWorker.ready;
                console.log('[PcNotify] Service Worker pronto');
            } catch (error) {
                console.error('[PcNotify] Erro ao obter SW:', error);
                return;
            }
        } else {
            console.log('[PcNotify] ❌ Service Worker não suportado');
            return;
        }

        // Verifica permissões
        await this.checkPermission();

        // Configura listeners
        this.setupListeners();

        // Tenta registrar push
        if (this._registration) {
            await this.registerPush();
        }
    },

    /**
     * Verifica permissão para notificações
     */
    async checkPermission() {
        if (!('Notification' in window)) {
            console.log('[PcNotify] ❌ Notificações não suportadas');
            return false;
        }

        const permission = Notification.permission;
        
        if (permission === 'denied') {
            console.log('[PcNotify] ❌ Permissão negada pelo usuário');
            return false;
        }

        if (permission === 'granted') {
            console.log('[PcNotify] ✅ Permissão já concedida');
            return true;
        }

        // Pede permissão
        try {
            const result = await Notification.requestPermission();
            if (result === 'granted') {
                console.log('[PcNotify] ✅ Permissão concedida');
                return true;
            } else {
                console.log('[PcNotify] ❌ Permissão negada');
                return false;
            }
        } catch (error) {
            console.error('[PcNotify] Erro ao pedir permissão:', error);
            return false;
        }
    },

    /**
     * Registra push notifications
     */
    async registerPush() {
        if (!this._registration) {
            console.log('[PcNotify] ❌ Sem Service Worker');
            return;
        }

        // Verifica se já está inscrito
        try {
            const existing = await this._registration.pushManager.getSubscription();
            if (existing) {
                this._subscription = existing;
                console.log('[PcNotify] ✅ Já inscrito em push');
                await this.saveSubscription(existing);
                return;
            }
        } catch (error) {
            console.error('[PcNotify] Erro ao verificar inscrição:', error);
        }

        // 🔥 CHAVE VAPID PÚBLICA (substitua pela sua)
        const VAPID_PUBLIC_KEY = 'BEl62iUYgUh9XpqCh8OKyWJ3jS9eBvv8uLZ6kQhG5JyJpXzE7VwPqNmLkTr9u4tZ8QjVfNcX5mB2dH3qW4rS6tY';

        try {
            const subscription = await this._registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            this._subscription = subscription;
            console.log('[PcNotify] ✅ Inscrito com sucesso!', subscription);

            // Salva a inscrição
            await this.saveSubscription(subscription);
            
            // Dispara evento
            window.dispatchEvent(new CustomEvent('pushRegistered', { 
                detail: { subscription } 
            }));

        } catch (error) {
            console.error('[PcNotify] Erro ao inscrever push:', error);
        }
    },

    /**
     * Salva a inscrição no servidor/local
     */
    async saveSubscription(subscription) {
        if (!subscription) return;

        // Salva localmente
        try {
            localStorage.setItem('push_subscription', JSON.stringify(subscription));
        } catch (e) {
            console.warn('[PcNotify] Erro ao salvar localmente:', e);
        }

        // Envia para o servidor (se disponível)
        try {
            const response = await fetch('/api/save-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription,
                    userId: this.getUserId()
                })
            });

            if (response.ok) {
                console.log('[PcNotify] ✅ Inscrição enviada ao servidor');
            }
        } catch (error) {
            // Silencia erro - não tem servidor backend
            console.log('[PcNotify] ⚠️ Servidor de push não disponível');
        }
    },

    /**
     * Envia uma notificação local (sem servidor)
     * @param {string} title - Título
     * @param {string} body - Corpo
     * @param {string} icon - Ícone (opcional)
     */
    async sendLocalNotification(title, body, icon = '/icons/icon-192x192.png') {
        if (!this._isInitialized) {
            console.log('[PcNotify] ❌ Sistema não inicializado');
            return;
        }

        if (Notification.permission !== 'granted') {
            console.log('[PcNotify] ❌ Sem permissão');
            return;
        }

        try {
            // Tenta usar Service Worker
            if (this._registration && this._registration.showNotification) {
                await this._registration.showNotification(title, {
                    body: body,
                    icon: icon,
                    badge: '/icons/icon-72x72.png',
                    vibrate: [200, 100, 200],
                    data: {
                        url: window.location.href,
                        timestamp: Date.now()
                    },
                    actions: [
                        { action: 'open', title: '🔗 Abrir App' },
                        { action: 'dismiss', title: '❌ Fechar' }
                    ]
                });
                console.log('[PcNotify] ✅ Notificação enviada via SW');
                return;
            }

            // Fallback: Notification API
            const notification = new Notification(title, {
                body: body,
                icon: icon,
                tag: 'zero-notification',
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            setTimeout(() => notification.close(), 10000);
            console.log('[PcNotify] ✅ Notificação enviada via API');

        } catch (error) {
            console.error('[PcNotify] Erro ao enviar notificação:', error);
        }
    },

    /**
     * Obtém o ID do usuário atual
     */
    getUserId() {
        try {
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                const data = JSON.parse(usuario);
                return data.id || data.email;
            }
        } catch (e) {}
        return null;
    },

    /**
     * Converte VAPID key base64 para Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    /**
     * Configura listeners
     */
    setupListeners() {
        // Quando o usuário logar
        window.addEventListener('autoLoginSuccess', () => {
            console.log('[PcNotify] Usuário logou - registrando push');
            this.registerPush();
        });

        // Quando o app for instalado
        window.addEventListener('pwaInstalled', () => {
            console.log('[PcNotify] PWA instalado - verificando notificações');
            this.checkPermission();
            this.registerPush();
        });

        // Quando a página ganhar foco
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this._isInitialized) {
                // Verifica se a inscrição ainda existe
                this._registration?.pushManager?.getSubscription()
                    .then(sub => {
                        if (!sub && this._subscription) {
                            console.log('[PcNotify] Inscrição perdida, registrando novamente');
                            this.registerPush();
                        }
                    })
                    .catch(() => {});
            }
        });
    },

    /**
     * Envia notificação de teste
     */
    async testNotification() {
        await this.sendLocalNotification(
            '🔔 Zero · Teste de Notificação',
            `Esta é uma notificação de teste do Zero PWA.\nHora: ${new Date().toLocaleTimeString()}`,
            '/icons/icon-192x192.png'
        );
    },

    /**
     * Remove inscrição push
     */
    async unsubscribe() {
        if (this._subscription) {
            try {
                await this._subscription.unsubscribe();
                this._subscription = null;
                localStorage.removeItem('push_subscription');
                console.log('[PcNotify] Inscrição removida');
            } catch (error) {
                console.error('[PcNotify] Erro ao remover inscrição:', error);
            }
        }
    }
};

// 🔥 EXPORTA GLOBALMENTE
window.PcNotification = PcNotification;

// 🔥 INICIALIZA AUTOMATICAMENTE
document.addEventListener('DOMContentLoaded', () => {
    // Só inicializa se estiver na página de login ou painel
    if (!window.location.pathname.includes('/login/')) {
        PcNotification.init();
    }
});

console.log('🖥️ PcNotification carregado - Notificações APENAS PC/PWA');