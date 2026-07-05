// sync-fix-final.js - CORREÇÃO DEFINITIVA
(function() {
    'use strict';
    
    console.log('[SyncFix] 🔧 Aplicando correção definitiva...');
    
    if (window._syncFixFinalApplied) {
        console.log('[SyncFix] ⏳ Correções já aplicadas');
        return;
    }
    window._syncFixFinalApplied = true;
    
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
        
        console.log('[SyncFix] ✅ CacheManager patched');
    }
    
    window.forceSyncType = async function(type, data) {
        if (!window.CacheManager) {
            console.error('[SyncFix] ❌ CacheManager não disponível');
            return false;
        }
        
        const userId = window.CacheManager.getCurrentUserId();
        if (!userId) {
            console.error('[SyncFix] ❌ Usuário não logado');
            return false;
        }
        
        if (!window.DatabaseService) {
            console.error('[SyncFix] ❌ DatabaseService não disponível');
            return false;
        }
        
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
                console.log(`[SyncFix] ✅ ${type} salvo no Supabase`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`[SyncFix] ❌ Erro ao salvar ${type}:`, error);
            return false;
        }
    };
    
    window.forceSyncAllFinal = async function() {
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
        
        const dataTypes = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
        let successCount = 0;
        let errorCount = 0;
        
        for (const type of dataTypes) {
            try {
                const data = window.CacheManager.get(type, null);
                if (data !== null) {
                    const storageKey = `${userId}_${type}`;
                    localStorage.setItem(storageKey, JSON.stringify(data));
                    
                    const result = await window.forceSyncType(type, data);
                    if (result) {
                        successCount++;
                        console.log(`[SyncFix] ✅ ${type} sincronizado`);
                    } else {
                        errorCount++;
                    }
                }
            } catch (error) {
                errorCount++;
                console.error(`[SyncFix] ❌ Erro ao sincronizar ${type}:`, error);
            }
        }
        
        console.log(`[SyncFix] 📊 Sincronização concluída: ${successCount} tipos sincronizados, ${errorCount} erros`);
        
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
            window.dispatchEvent(new CustomEvent('forceRefresh'));
        }, 300);
        
        return errorCount === 0;
    };
    
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
                
                await window.CacheManager.loadFromCloud(true);
                await window.forceSyncAllFinal();
                
                _initialized = true;
                console.log('[SyncFix] ✅ Inicialização automática concluída');
            }
        } catch(e) {
            console.warn('[SyncFix] ⚠️ Erro na inicialização:', e);
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
        if (!_initialized) {
            setTimeout(autoInitFinal, 300);
        }
    });
    
    console.log('[SyncFix] ✅ Módulo de correção definitiva carregado!');
})();