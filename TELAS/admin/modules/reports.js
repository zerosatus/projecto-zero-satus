// ==========================================
// reports.js - RELATÓRIOS
// ==========================================

console.log('[Reports] 📊 Carregando módulo de relatórios...');

// ==========================================
// CARREGAR RELATÓRIOS
// ==========================================
function loadReports() {
    console.log('[Reports] 📊 Carregando relatórios...');
    
    const period = document.getElementById('reportPeriod')?.value || '30';
    
    // Dados baseados no período (simulados)
    const dataByPeriod = {
        '7': { growth: '+12%', completion: '72%', avgTime: '38min', streak: '8' },
        '30': { growth: '+24%', completion: '68%', avgTime: '45min', streak: '12' },
        '90': { growth: '+58%', completion: '65%', avgTime: '52min', streak: '21' }
    };
    
    const data = dataByPeriod[period] || dataByPeriod['30'];
    
    // Atualizar cards
    const elGrowth = document.getElementById('reportGrowth');
    const elCompletion = document.getElementById('reportCompletion');
    const elAvgTime = document.getElementById('reportAvgTime');
    const elStreak = document.getElementById('reportStreak');
    
    if (elGrowth) elGrowth.textContent = data.growth;
    if (elCompletion) elCompletion.textContent = data.completion;
    if (elAvgTime) elAvgTime.textContent = data.avgTime;
    if (elStreak) elStreak.textContent = data.streak;
    
    // Atualizar gráfico
    carregarGrafico(period);
    
    console.log('[Reports] ✅ Relatórios carregados para período:', period);
}

// ==========================================
// CARREGAR GRÁFICO
// ==========================================
function carregarGrafico(period) {
    const container = document.getElementById('chartBars');
    if (!container) return;

    // Gerar dados aleatórios baseados no período
    const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const dados = dias.map(() => Math.floor(Math.random() * 15) + 3);
    const maxValor = Math.max(...dados);

    container.innerHTML = dados.map((valor, index) => `
        <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: ${(valor / maxValor) * 80 + 20}%;">
                <span class="chart-value">${valor}</span>
            </div>
            <span class="chart-label">${dias[index]}</span>
        </div>
    `).join('');
}

// ==========================================
// ATUALIZAR QUANDO MUDAR PERÍODO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const reportPeriod = document.getElementById('reportPeriod');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', loadReports);
    }
});

console.log('[Reports] ✅ reports.js carregado!');