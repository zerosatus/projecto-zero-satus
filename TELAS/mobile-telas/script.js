// --- script.js ---

document.addEventListener('DOMContentLoaded', () => {
    
    // Dados simulados para as próximas aulas
    const nextClasses = [
        { title: 'Matemática', subtitle: 'Álgebra - Página 45', icon: 'matematica' },
        { title: 'Entregar Redação', subtitle: 'Português - Tema: Tecnologia', icon: 'portugues' },
        { title: 'Lab. de Química', subtitle: 'Reação Ácido-Base', icon: 'quimica' },
        { title: 'Prova de História', subtitle: 'Segunda Guerra Mundial', icon: 'historia' }
    ];

    // Dados simulados para as notificações
    const notifications = [
        { title: 'Lembrete de leitura', subtitle: 'Capítulo 5 - Literatura Brasileira', icon: 'notification' },
        { title: 'Guilherme entrou em...', subtitle: 'Grupo de Estudos de Física', icon: 'notification' },
        { title: 'Tarefa aprovada', subtitle: 'Trabalho de Geografia - Nota: 9.5', icon: 'notification' }
    ];

    // Função para renderizar as aulas na lista
    function renderClasses() {
        const classesList = document.getElementById('classes-list');
        let html = '';
        nextClasses.forEach(item => {
            html += `
                <div class="list-item">
                    <div class="item-icon ${item.icon}">
                        <ion-icon name="book-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">${item.title}</div>
                        <div class="item-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="item-arrow">
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </div>
                </div>
            `;
        });
        classesList.innerHTML = html;
    }

    // Função para renderizar as notificações na lista
    function renderNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        let html = '';
        notifications.forEach(item => {
            html += `
                <div class="list-item">
                    <div class="item-icon ${item.icon}">
                        <ion-icon name="notifications-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">${item.title}</div>
                        <div class="item-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="item-arrow">
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </div>
                </div>
            `;
        });
        notificationsList.innerHTML = html;
    }

    // Inicializa a renderização
    renderClasses();
    renderNotifications();

    // Adiciona um evento de clique simples aos itens da lista para demonstração
    document.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', () => {
            const title = item.querySelector('.item-title').textContent;
            alert(`Você clicou em: ${title}`);
        });
    });
});