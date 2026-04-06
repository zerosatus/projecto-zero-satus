document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Renderizar Gráfico Semanal
    const chartContainer = document.getElementById('weekly-chart');
    const daysContainer = document.getElementById('weekly-days');
    
    const weeklyData = [
        { day: 'Dom', h: '25%', active: false },
        { day: 'Seg', h: '55%', active: false },
        { day: 'Ter', h: '40%', active: false },
        { day: 'Qua', h: '65%', active: false },
        { day: 'Qui', h: '30%', active: false },
        { day: 'Sex', h: '80%', active: false },
        { day: 'Sáb', h: '72%', active: true }
    ];

    weeklyData.forEach(d => {
        // Barra
        const bar = document.createElement('div');
        bar.className = `bar ${d.active ? 'active' : ''}`;
        bar.style.height = d.h;
        chartContainer.appendChild(bar);

        // Label
        const label = document.createElement('span');
        label.textContent = d.day;
        if(d.active) label.className = 'active';
        daysContainer.appendChild(label);
    });

    // 2. Renderizar Próximas Aulas
    const classesData = [
        { name: 'Matemática', meta: '2 aulas hoje', time: '14:00', icon: 'calculator-outline', color: 'bg-red' },
        { name: 'Física', meta: '1 aula hoje', time: '16:00', icon: 'planet-outline', color: 'bg-blue' },
        { name: 'Química', meta: '1 aula hoje', time: '18:30', icon: 'flask-outline', color: 'bg-orange' }
    ];

    const classesList = document.getElementById('classes-list');
    classesData.forEach(cls => {
        const el = document.createElement('div');
        el.className = 'card-item';
        el.innerHTML = `
            <div class="item-icon ${cls.color}"><ion-icon name="${cls.icon}"></ion-icon></div>
            <div class="item-info">
                <span class="item-name">${cls.name}</span>
                <span class="item-meta">${cls.meta}</span>
            </div>
            <span class="item-value">${cls.time}</span>
        `;
        classesList.appendChild(el);
    });

    // 3. Renderizar Tempo por Disciplina
    const subjectsData = [
        { name: 'Matemática', meta: '5h progresso hoje', val: '5 horas', color: 'bg-red', icon: 'calculator-outline', progress: 85 },
        { name: 'Física', meta: '3h progresso hoje', val: '3 horas', color: 'bg-blue', icon: 'planet-outline', progress: 60 },
        { name: 'Química', meta: '4h progresso hoje', val: '4 horas', color: 'bg-orange', icon: 'flask-outline', progress: 70 },
        { name: 'Biologia', meta: '3h progresso hoje', val: '3 horas', color: 'bg-green', icon: 'leaf-outline', progress: 45 },
        { name: 'História', meta: '2h progresso hoje', val: '2 horas', color: 'bg-purple', icon: 'book-outline', progress: 30 },
        { name: 'Português', meta: '4h progresso hoje', val: '4 horas', color: 'bg-pink', icon: 'chatbubbles-outline', progress: 65 }
    ];

    const subjectsList = document.getElementById('subjects-list');
    subjectsData.forEach(sub => {
        const el = document.createElement('div');
        el.className = 'card-item';
        el.innerHTML = `
            <div class="item-icon ${sub.color}"><ion-icon name="${sub.icon}"></ion-icon></div>
            <div class="item-info">
                <span class="item-name">${sub.name}</span>
                <span class="item-meta">${sub.meta}</span>
                <div class="progress-mini">
                    <div class="progress-fill" style="width: ${sub.progress}%; background-color: var(--accent-cyan);"></div>
                </div>
            </div>
            <span class="item-value">${sub.val}</span>
        `;
        subjectsList.appendChild(el);
    });

    // 4. Lógica de Toggle de Modos
    window.selectMode = function(mode) {
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.mode-btn.${mode}`);
        if(activeBtn) activeBtn.classList.add('active');
    };

    // 5. Simular animação do anel de progresso
    setTimeout(() => {
        const circle = document.getElementById('progress-circle');
        circle.style.strokeDashoffset = 56; // Valor fixo para 72%
    }, 500);
});