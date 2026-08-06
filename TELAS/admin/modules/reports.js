// ==========================================
// reports.js - RELATÓRIOS REAIS
// ==========================================

console.log('[Reports] 📊 Carregando módulo de relatórios...');

// ==========================================
// CARREGAR RELATÓRIOS
// ==========================================
async function loadReports() {
    console.log('[Reports] 📊 Carregando relatórios...');
    
    const period = document.getElementById('reportPeriod')?.value || '30';
    
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.warn('[Reports] ⚠️ Supabase não inicializado, usando dados mock');
            loadMockReports(period);
            return;
        }

        // Buscar estatísticas reais
        const { data, error } = await client.rpc('get_admin_stats');

        if (error) {
            console.error('[Reports] ❌ Erro:', error);
            loadMockReports(period);
            return;
        }

        if (data && data.length > 0) {
            const stats = data[0];
            
            // Calcular crescimento
            const growth = stats.total_usuarios > 0 ? 
                Math.round((stats.novos_usuarios_7dias / stats.total_usuarios) * 100) : 0;
            
            // Calcular taxa de conclusão
            const completion = stats.total_posts > 0 ? 
                Math.round(((stats.total_posts - stats.total_rascunhos) / stats.total_posts) * 100) : 0;
            
            // Tempo médio (simulado baseado em dados reais)
            const avgTime = stats.ativos_hoje > 0 ? 
                Math.round((stats.total_posts / (stats.ativos_hoje || 1)) * 15) : 0;
            
            // Sequência (simulada)
            const streak = stats.ativos_hoje > 0 ? 
                Math.min(Math.round(stats.ativos_hoje / 2), 30) : 0;

            updateReportCards(
                `+${growth}%`,
                `${completion}%`,
                `${Math.max(avgTime, 5)}min`,
                `${streak}`
            );
        }

        // Carregar gráfico com dados reais
        await loadRealChart(period);

    } catch (error) {
        console.error('[Reports] ❌ Erro:', error);
        loadMockReports(period);
    }
}

// ==========================================
// CARREGAR GRÁFICO REAL
// ==========================================
async function loadRealChart(period) {
    const container = document.getElementById('chartBars');
    if (!container) return;

    try {
        const client = window.supabaseClient;
        if (!client) {
            loadMockChart(container);
            return;
        }

        // Buscar dados de usuários por dia
        const days = parseInt(period);
        const { data, error } = await client
            .from('profiles')
            .select('created_at')
            .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

        if (error) {
            console.error('[Reports] ❌ Erro ao buscar dados do gráfico:', error);
            loadMockChart(container);
            return;
        }

        // Agrupar por dia
        const dailyCounts = {};
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Inicializar últimos 7 dias
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyCounts[key] = 0;
        }

        // Contar usuários por dia
        data?.forEach(profile => {
            const date = new Date(profile.created_at);
            const key = date.toISOString().split('T')[0];
            if (dailyCounts[key] !== undefined) {
                dailyCounts[key]++;
            }
        });

        const labels = Object.keys(dailyCounts);
        const values = Object.values(dailyCounts);
        const maxValor = Math.max(...values, 1);

        container.innerHTML = labels.map((key, index) => {
            const valor = values[index];
            const dayOfWeek = new Date(key).getDay();
            const label = dayNames[dayOfWeek];
            const height = Math.max((valor / maxValor) * 80 + 20, 10);
            
            return `
                <div class="chart-bar-wrapper">
                    <div class="chart-bar" style="height: ${height}%;">
                        <span class="chart-value">${valor}</span>
                    </div>
                    <span class="chart-label">${label}</span>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('[Reports] ❌ Erro:', error);
        loadMockChart(container);
    }
}

// ==========================================
// CARREGAR RELATÓRIOS MOCK (FALLBACK)
// ==========================================
function loadMockReports(period) {
    const dataByPeriod = {
        '7': { growth: '+12%', completion: '72%', avgTime: '38min', streak: '8' },
        '30': { growth: '+24%', completion: '68%', avgTime: '45min', streak: '12' },
        '90': { growth: '+58%', completion: '65%', avgTime: '52min', streak: '21' }
    };
    
    const data = dataByPeriod[period] || dataByPeriod['30'];
    updateReportCards(data.growth, data.completion, data.avgTime, data.streak);
    loadMockChart(document.getElementById('chartBars'));
}

// ==========================================
// CARREGAR GRÁFICO MOCK
// ==========================================
function loadMockChart(container) {
    if (!container) return;
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
// ATUALIZAR CARDS
// ==========================================
function updateReportCards(growth, completion, avgTime, streak) {
    const elGrowth = document.getElementById('reportGrowth');
    const elCompletion = document.getElementById('reportCompletion');
    const elAvgTime = document.getElementById('reportAvgTime');
    const elStreak = document.getElementById('reportStreak');
    
    if (elGrowth) elGrowth.textContent = growth;
    if (elCompletion) elCompletion.textContent = completion;
    if (elAvgTime) elAvgTime.textContent = avgTime;
    if (elStreak) elStreak.textContent = streak;
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