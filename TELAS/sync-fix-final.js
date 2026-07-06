// sync-fix-final.js - CORREÇÃO DEFINITIVA OTIMIZADA

(function() {
    'use strict';
    
    console.log('[SyncFix] 🔧 Aplicando correção otimizada...');
    
    if (window._syncFixFinalApplied) {
        console.log('[SyncFix] ⏳ Correções já aplicadas');
        return;
    }
    window._syncFixFinalApplied = true;
    
    // Patch CacheManager
    if (window.CacheManager) {
        const originalGetCurrentUserId = window.CacheManager.getCurrentUserId;
        window.CacheManager.getCurrentUserId = function() {
            if (this.currentUserId) return this.currentUserId;
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    const user = JSON.parse(usuario);
                    this.currentUserId = user.id || user.uid;
                    return this.currentUserId;
                } catch(e) {}
            }
            return null;
        };
        
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                window.CacheManager.currentUserId = user.id || user.uid;
            } catch(e) {}
        }
    }
    
    // Forçar sync de um tipo
    window.forceSyncType = async function(type, data) {
        if (!window.CacheManager || !window.DatabaseService) return false;
        
        const userId = window.CacheManager.getCurrentUserId();
        if (!userId) return false;
        
        try {
            window.CacheManager.set(type, data, true);
            
            const saveMethods = {
                tasks: window.DatabaseService.saveTasks,
                notes: window.DatabaseService.saveNotes,
                calendarEvents: window.DatabaseService.saveCalendarEvents,
                weeklySchedule: window.DatabaseService.saveWeeklySchedule,
                timeSlots: window.DatabaseService.saveTimeSlots,
                notifications: window.DatabaseService.saveNotifications,
                disciplinas: window.DatabaseService.saveDisciplinas
            };
            
            const saveMethod = saveMethods[type];
            if (saveMethod) {
                await saveMethod(userId, data);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`[SyncFix] ❌ Erro ao salvar ${type}:`, error);
            return false;
        }
    };
    
    // Forçar sync completo
    window.forceSyncAllFinal = async function() {
        console.log('[SyncFix] 🔄 Sincronização completa...');
        
        if (!window.CacheManager) return false;
        const userId = window.CacheManager.getCurrentUserId();
        if (!userId) return false;
        
        const dataTypes = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
        let successCount = 0;
        
        for (const type of dataTypes) {
            try {
                const data = window.CacheManager.get(type, null);
                if (data !== null) {
                    localStorage.setItem(`${userId}_${type}`, JSON.stringify(data));
                    const result = await window.forceSyncType(type, data);
                    if (result) successCount++;
                }
            } catch (error) {
                console.error(`[SyncFix] ❌ Erro ${type}:`, error);
            }
        }
        
        console.log(`[SyncFix] ✅ ${successCount}/${dataTypes.length} sincronizados`);
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
            window.dispatchEvent(new CustomEvent('forceRefresh'));
        }, 200);
        
        return successCount === dataTypes.length;
    };
    
    // Auto inicialização
    let _initialized = false;
    async function autoInitFinal() {
        if (_initialized) return;
        const usuario = localStorage.getItem('usuarioLogado');
        if (!usuario) return;
        
        try {
            const user = JSON.parse(usuario);
            const userId = user.id || user.uid;
            
            if (userId && window.CacheManager) {
                window.CacheManager.currentUserId = userId;
                window.CacheManager.init();
                await window.CacheManager.loadFromCloud(false);
                _initialized = true;
            }
        } catch(e) {
            console.warn('[SyncFix] ⚠️ Erro:', e);
        }
    }
    
    if (document.readyState === 'complete') {
        setTimeout(autoInitFinal, 500);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(autoInitFinal, 500);
        });
    }
    
    window.addEventListener('cacheReady', () => {
        if (!_initialized) setTimeout(autoInitFinal, 300);
    });
    
    console.log('[SyncFix] ✅ Módulo otimizado carregado!');
})();