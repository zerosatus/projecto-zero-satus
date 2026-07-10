// Reports (estáticos por enquanto)
console.log('[Reports] Módulo de relatórios carregado');

function loadReports() {
    console.log('[Reports] 📊 Carregando relatórios...');
    const period = document.getElementById('reportPeriod')?.value || '30';
    const dataByPeriod = {
        '7': { growth: '+12%', completion: '72%', avgTime: '38min', streak: '8' },
        '30': { growth: '+24%', completion: '68%', avgTime: '45min', streak: '12' },
        '90': { growth: '+58%', completion: '65%', avgTime: '52min', streak: '21' }
    };
    const data = dataByPeriod[period] || dataByPeriod['30'];
    document.getElementById('reportGrowth').textContent = data.growth;
    document.getElementById('reportCompletion').textContent = data.completion;
    document.getElementById('reportAvgTime').textContent = data.avgTime;
    document.getElementById('reportStreak').textContent = data.streak;
    console.log('[Reports] ✅ Relatórios carregados!');
}

document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('reportPeriod');
    if (sel) sel.addEventListener('change', loadReports);
});
// ==========================================
// reports.js - RELATÓRIOS (DADOS ESTÁTICOS)
// ==========================================

console.log('[Reports] 📊 Carregando módulo de relatórios...');

// ==========================================
// CARREGAR RELATÓRIOS
// ==========================================
function loadReports() {
    console.log('[Reports] 📊 Carregando relatórios...');
    
    // 🔥 DADOS ESTÁTICOS (fictícios para visual)
    // Quando o backend estiver pronto, isso virá do Supabase
    
    const period = document.getElementById('reportPeriod')?.value || '30';
    
    // Simular diferentes dados por período
    const dataByPeriod = {
        '7': { growth: '+12%', completion: '72%', avgTime: '38min', streak: '8' },
        '30': { growth: '+24%', completion: '68%', avgTime: '45min', streak: '12' },
        '90': { growth: '+58%', completion: '65%', avgTime: '52min', streak: '21' }
    };
    
    const data = dataByPeriod[period] || dataByPeriod['30'];
    
    // Atualizar cards
    document.getElementById('reportGrowth').textContent = data.growth;
    document.getElementById('reportCompletion').textContent = data.completion;
    document.getElementById('reportAvgTime').textContent = data.avgTime;
    document.getElementById('reportStreak').textContent = data.streak;
    
    console.log('[Reports] ✅ Relatórios carregados!');
}

// Atualizar quando mudar o período
document.addEventListener('DOMContentLoaded', () => {
    const reportPeriod = document.getElementById('reportPeriod');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', loadReports);
    }
});

console.log('[Reports] ✅ reports.js carregado!');
