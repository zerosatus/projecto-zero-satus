// sync-fix.js - CORREÇÃO DEFINITIVA DE SINCRONIZAÇÃO
(function() {
    'use strict';
    
    console.log('[SyncFix] 🔧 Aplicando correções de sincronização...');
    
    if (window._syncFixApplied) {
        console.log('[SyncFix] ⏳ Correções já aplicadas');
        return;
    }
    window._syncFixApplied = true;
    
    // ============================================
    // 1. PATCH: localStorage para usar CacheManager
    // ============================================
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;
    
    // Tipos de dados que devem ser sincronizados com CacheManager
    const SYNC_KEYS = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas', 'disciplina'];
    let _syncInProgress = false;
    
    // Interceptar setItem
    localStorage.setItem = function(key, value) {
        // Chamar o original primeiro
        originalSetItem.call(this, key, value);
        
        // Verificar se é um dado que precisa ser sincronizado
        const syncKey = SYNC_KEYS.find(k => key.includes(`_${k}`) || key === k);
        if (syncKey && window.CacheManager && !_syncInProgress) {
            try {
                const data = JSON.parse(value);
                if (data !== null && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
                    _syncInProgress = true;
                    // Usar o nome correto da chave no CacheManager
                    let cacheKey = syncKey;
                    if (syncKey === 'disciplina') cacheKey = 'disciplinas';
                    
                    window.CacheManager.set(cacheKey, data, true);
                    console.log(`[SyncFix] 🔄 Dados ${cacheKey} sincronizados via CacheManager (${Array.isArray(data) ? data.length : Object.keys(data).length} itens)`);
                    
                    // Disparar evento específico
                    window.dispatchEvent(new CustomEvent(`${cacheKey}Updated`, { detail: data }));
                    setTimeout(() => { _syncInProgress = false; }, 100);
                }
            } catch(e) {
                // Não é JSON válido, ignorar
                if (_syncInProgress) _syncInProgress = false;
            }
        }
    };
    
    // Interceptar removeItem
    localStorage.removeItem = function(key) {
        originalRemoveItem.call(this, key);
        
        const syncKey = SYNC_KEYS.find(k => key.includes(`_${k}`) || key === k);
        if (syncKey && window.CacheManager) {
            console.log(`[SyncFix] 🗑️ Dados ${syncKey} removidos localmente`);
        }
    };
    
    // ============================================
    // 2. PATCH: CacheManager para disparar eventos
    // ============================================
    if (window.CacheManager) {
        const originalSet = window.CacheManager.set.bind(window.CacheManager);
        window.CacheManager.set = function(key, value, notify = true) {
            const result = originalSet(key, value, notify);
            
            // Disparar eventos
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: value }));
                window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value } }));
            }, 50);
            
            return result;
        };
        
        console.log('[SyncFix] ✅ CacheManager patched');
    }
    
    // ============================================
    // 3. PATCH: Todas as páginas usarem UUID
    // ============================================
    // Função para obter o usuário com UUID
    window.getUserWithUUID = function() {
        const usuario = localStorage.getItem('usuarioLogado');
        if (!usuario) return null;
        
        try {
            const user = JSON.parse(usuario);
            // Garantir que tem ID
            if (!user.id && user.uid) {
                user.id = user.uid;
                localStorage.setItem('usuarioLogado', JSON.stringify(user));
            }
            return user;
        } catch(e) {
            return null;
        }
    };
    
    // ============================================
    // 4. Sincronização forçada
    // ============================================
    window.forceSyncAll = async function() {
        console.log('[SyncFix] 🔄 Forçando sincronização completa...');
        
        if (!window.CacheManager) {
            console.error('[SyncFix] ❌ CacheManager não disponível');
            return false;
        }
        
        const userId = window.CacheManager.getCurrentUserId();
        if (!userId) {
            console.error('[SyncFix] ❌ Usuário não logado');
            return false;
        }
        
        try {
            // Carregar da nuvem
            await window.CacheManager.loadFromCloud(true);
            
            // Salvar localmente com as chaves corretas
            const dataTypes = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
            
            for (const type of dataTypes) {
                const data = window.CacheManager.get(type, null);
                if (data !== null && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
                    const storageKey = `${userId}_${type}`;
                    localStorage.setItem(storageKey, JSON.stringify(data));
                    console.log(`[SyncFix] 📦 ${type} salvo localmente: ${Array.isArray(data) ? data.length : Object.keys(data).length} itens`);
                }
            }
            
            // Disparar eventos
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                window.dispatchEvent(new CustomEvent('forceRefresh'));
            }, 200);
            
            console.log('[SyncFix] ✅ Sincronização completa realizada');
            return true;
        } catch (error) {
            console.error('[SyncFix] ❌ Erro na sincronização:', error);
            return false;
        }
    };
    
    // ============================================
    // 5. Forçar recarga da UI
    // ============================================
    window.refreshUIData = function() {
        console.log('[SyncFix] 🔄 Recarregando UI...');
        
        // Tentar recarregar cada tipo de dados
        const dataTypes = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
        
        for (const type of dataTypes) {
            const data = window.CacheManager?.get(type, null);
            if (data !== null) {
                // Disparar evento específico
                window.dispatchEvent(new CustomEvent(`${type}Updated`, { detail: data }));
            }
        }
        
        // Disparar eventos genéricos
        window.dispatchEvent(new CustomEvent('forceRefresh'));
        window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
        
        console.log('[SyncFix] ✅ UI recarregada');
    };
    
    // ============================================
    // 6. Inicialização automática
    // ============================================
    let _initialized = false;
    
    async function autoInit() {
        if (_initialized) return;
        
        const usuario = localStorage.getItem('usuarioLogado');
        if (!usuario) return;
        
        try {
            const user = JSON.parse(usuario);
            if (!user.id && user.uid) {
                user.id = user.uid;
                localStorage.setItem('usuarioLogado', JSON.stringify(user));
            }
            
            if (window.CacheManager && user.id) {
                window.CacheManager.currentUserId = user.id;
                window.CacheManager.init();
                
                // Carregar dados da nuvem
                await window.forceSyncAll();
                
                _initialized = true;
                console.log('[SyncFix] ✅ Inicialização automática concluída');
            }
        } catch(e) {
            console.warn('[SyncFix] ⚠️ Erro na inicialização automática:', e);
        }
    }
    
    // Iniciar quando a página carregar
    if (document.readyState === 'complete') {
        setTimeout(autoInit, 500);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(autoInit, 500);
        });
    }
    
    // Também iniciar quando o CacheManager estiver pronto
    window.addEventListener('cacheReady', () => {
        if (!_initialized) {
            setTimeout(autoInit, 300);
        }
    });
    
    // ============================================
    // 7. Escutar mudanças no localStorage
    // ============================================
    window.addEventListener('storage', (event) => {
        if (event.key && event.key.includes('_tasks') ||
            event.key.includes('_notes') ||
            event.key.includes('_calendarEvents') ||
            event.key.includes('_weeklySchedule') ||
            event.key.includes('_disciplinas')) {
            
            console.log(`[SyncFix] 📡 Mudança detectada: ${event.key}`);
            
            // Recarregar dados após mudança
            setTimeout(() => {
                window.refreshUIData();
            }, 300);
        }
    });
    
    console.log('[SyncFix] ✅ Módulo carregado com sucesso!');
})();