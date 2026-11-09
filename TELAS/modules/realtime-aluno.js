// modules/realtime-aluno.js

function iniciarRealtimeAluno() {
    if (!window.appwriteClient) {
        console.warn('[Realtime] ⏳ Appwrite não carregado. Tentando novamente em 2s...');
        setTimeout(iniciarRealtimeAluno, 2000);
        return;
    }

    console.log('[Realtime] 🎧 Escutando novas mensagens do Admin...');

    const { Realtime } = window.Appwrite;
    const realtime = new Realtime(window.appwriteClient);

    // Escuta a tabela de mensagens
    realtime.subscribe(`databases.${window.APPWRITE_DB_ID}.tables.${window.APPWRITE_TABLE_ID}.rows`, (response) => {
        if (response.events.includes('create')) {
            const payload = response.payload;
            
            // Pega o email do usuário logado no cache
            let emailUsuario = '';
            try {
                const user = JSON.parse(localStorage.getItem('usuarioLogado'));
                if (user && user.email) emailUsuario = user.email;
            } catch(e) {}

            // Se a mensagem for para todos ou para este usuário específico
            if (payload.destino === 'todos' || payload.destino === emailUsuario) {
                console.log('🔔 Nova mensagem recebida!', payload);

                // 1. Mostra um alerta (ou você pode usar o seu Toast ou adicionar no sininho)
                alert(`🔔 NOVA MENSAGEM DO ADMIN:\n\n${payload.titulo}\n\n${payload.mensagem}`);
                
                // 2. Atualiza o badge do sininho (opcional)
                const badge = document.getElementById('notificationBadge');
                if (badge) {
                    let count = parseInt(badge.textContent) || 0;
                    badge.textContent = count + 1;
                    badge.style.display = 'flex';
                }

                // 3. Opcional: Tocar um som
                // const audio = new Audio('../sons/notificacao.mp3');
                // audio.play().catch(e => console.log('Som bloqueado'));
            }
        }
    });
}

// Inicia após o carregamento
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(iniciarRealtimeAluno, 1500); // Espera 1.5s para garantir que os scripts carregaram
});