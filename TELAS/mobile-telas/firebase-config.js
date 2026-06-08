// firebase-config.js - VERSÃO FIRESTORE COMPLETA CORRIGIDA
(function() {
    const firebaseConfig = {
        apiKey: "AIzaSyDOXYoICsqe3D7bBALLI1MFLSGr1D-t4iY",
        authDomain: "zero-5e74d.firebaseapp.com",
        projectId: "zero-5e74d",
        storageBucket: "zero-5e74d.firebasestorage.app",
        messagingSenderId: "431244473899",
        appId: "1:431244473899:web:da9424fd226f7386dddc6e"
    };
    
    let db = null;
    let auth = null;
    let storage = null;
    let firebaseInitialized = false;
    
    function initFirebase() {
        if (firebaseInitialized) return true;
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                auth = firebase.auth();
                storage = firebase.storage();
                firebaseInitialized = true;
                
                // Configurar persistência offline
                db.enablePersistence({ synchronizeTabs: true })
                    .catch(err => {
                        if (err.code === 'failed-precondition') {
                            console.warn('[Firestore] Persistência offline não disponível (múltiplas abas)');
                        } else if (err.code === 'unimplemented') {
                            console.warn('[Firestore] Navegador não suporta persistência offline');
                        } else {
                            console.warn('[Firestore] Erro ao configurar persistência:', err);
                        }
                    });
                console.log('[Firestore] ✅ Inicializado!');
                window.dispatchEvent(new CustomEvent('firebaseLoaded'));
                return true;
            } catch (error) {
                console.error('[Firestore] ❌ Erro ao inicializar:', error);
                return false;
            }
        }
        return false;
    }
    
    initFirebase();
    
    // ========== FUNÇÃO AUXILIAR PARA LIMPAR ID ==========
    function cleanId(id) {
        if (!id || typeof id !== 'string') return Date.now().toString();
        // Remove caracteres inválidos para Firestore (., #, $, [, ], /)
        return String(id).replace(/[.#$[\]]/g, '_');
    }
    
    // ========== SERVIÇO PRINCIPAL DO FIRESTORE ==========
    window.FirestoreService = {
        // ========== USUÁRIO ==========
        async getUserData(userId) {
            if (!userId || !db) return null;
            try {
                const doc = await db.collection('users').doc(userId).get();
                return doc.exists ? doc.data() : null;
            } catch (error) {
                console.error('[Firestore] getUserData error:', error);
                return null;
            }
        },
        
        async createUser(userId, userData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).set({
                    ...userData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                console.log('[Firestore] Usuário criado/atualizado:', userId);
                return true;
            } catch (error) {
                console.error('[Firestore] createUser error:', error);
                return false;
            }
        },
        
        // ========== CONFIGURAÇÕES ==========
        async getSettings(userId) {
            if (!userId || !db) return { notifications: {}, appearance: {} };
            try {
                const doc = await db.collection('users').doc(userId).collection('settings').doc('preferences').get();
                return doc.exists ? doc.data() : { notifications: {}, appearance: {} };
            } catch (error) {
                console.error('[Firestore] getSettings error:', error);
                return { notifications: {}, appearance: {} };
            }
        },
        
        async saveSettings(userId, settings) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('settings').doc('preferences').set(settings, { merge: true });
                console.log('[Firestore] Settings salvos');
                return true;
            } catch (error) {
                console.error('[Firestore] saveSettings error:', error);
                return false;
            }
        },
        
        // ========== TAREFAS ==========
        async getTasks(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('tasks')
                    .orderBy('createdAt', 'desc')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('[Firestore] getTasks error:', error);
                return [];
            }
        },
        
        async saveTask(userId, taskId, taskData) {
            if (!userId || !db) return false;
            if (!taskId) return false;
            try {
                const id = cleanId(taskId);
                await db.collection('users').doc(userId).collection('tasks').doc(id).set({
                    ...taskData,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                console.log('[Firestore] Task salva:', id);
                return true;
            } catch (error) {
                console.error('[Firestore] saveTask error:', error);
                return false;
            }
        },
        
        async deleteTask(userId, taskId) {
            if (!userId || !db) return false;
            try {
                const id = cleanId(taskId);
                await db.collection('users').doc(userId).collection('tasks').doc(id).delete();
                console.log('[Firestore] Task deletada:', id);
                return true;
            } catch (error) {
                console.error('[Firestore] deleteTask error:', error);
                return false;
            }
        },
        
        async deleteAllTasks(userId) {
            if (!userId || !db) return false;
            try {
                const snapshot = await db.collection('users').doc(userId).collection('tasks').get();
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log('[Firestore] Todas as tasks deletadas');
                return true;
            } catch (error) {
                console.error('[Firestore] deleteAllTasks error:', error);
                return false;
            }
        },
        
        // ========== ANOTAÇÕES ==========
        async getNotes(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('notes')
                    .orderBy('updatedAt', 'desc')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('[Firestore] getNotes error:', error);
                return [];
            }
        },
        
        async saveNote(userId, noteId, noteData) {
            if (!userId || !db) return false;
            if (!noteId) return false;
            try {
                const id = cleanId(noteId);
                await db.collection('users').doc(userId).collection('notes').doc(id).set({
                    ...noteData,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                console.log('[Firestore] Note salva:', id);
                return true;
            } catch (error) {
                console.error('[Firestore] saveNote error:', error);
                return false;
            }
        },
        
        async deleteNote(userId, noteId) {
            if (!userId || !db) return false;
            try {
                const id = cleanId(noteId);
                await db.collection('users').doc(userId).collection('notes').doc(id).delete();
                console.log('[Firestore] Note deletada:', id);
                return true;
            } catch (error) {
                console.error('[Firestore] deleteNote error:', error);
                return false;
            }
        },
        
        async deleteAllNotes(userId) {
            if (!userId || !db) return false;
            try {
                const snapshot = await db.collection('users').doc(userId).collection('notes').get();
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log('[Firestore] Todas as notes deletadas');
                return true;
            } catch (error) {
                console.error('[Firestore] deleteAllNotes error:', error);
                return false;
            }
        },
        
        // ========== EVENTOS DO CALENDÁRIO ==========
        async getCalendarEvents(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('calendarEvents').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('[Firestore] getCalendarEvents error:', error);
                return [];
            }
        },
        
        async saveCalendarEvent(userId, eventId, eventData) {
            if (!userId || !db) return false;
            if (!eventId) return false;
            try {
                const id = cleanId(eventId);
                await db.collection('users').doc(userId).collection('calendarEvents').doc(id).set({
                    ...eventData,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                console.log('[Firestore] CalendarEvent salvo:', id);
                return true;
            } catch (error) {
                console.error('[Firestore] saveCalendarEvent error:', error);
                return false;
            }
        },
        
        async deleteCalendarEvent(userId, eventId) {
            if (!userId || !db) return false;
            try {
                const id = cleanId(eventId);
                await db.collection('users').doc(userId).collection('calendarEvents').doc(id).delete();
                console.log('[Firestore] CalendarEvent deletado:', id);
                return true;
            } catch (error) {
                console.error('[Firestore] deleteCalendarEvent error:', error);
                return false;
            }
        },
        
        async deleteAllCalendarEvents(userId) {
            if (!userId || !db) return false;
            try {
                const snapshot = await db.collection('users').doc(userId).collection('calendarEvents').get();
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log('[Firestore] Todos os calendarEvents deletados');
                return true;
            } catch (error) {
                console.error('[Firestore] deleteAllCalendarEvents error:', error);
                return false;
            }
        },
        
        // ========== HORÁRIO SEMANAL ==========
        async getWeeklySchedule(userId) {
            if (!userId || !db) return null;
            try {
                const doc = await db.collection('users').doc(userId).collection('settings').doc('weeklySchedule').get();
                return doc.exists ? doc.data() : null;
            } catch (error) {
                console.error('[Firestore] getWeeklySchedule error:', error);
                return null;
            }
        },
        
        async saveWeeklySchedule(userId, scheduleData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('settings').doc('weeklySchedule').set({
                    ...scheduleData,
                    updatedAt: new Date().toISOString()
                });
                console.log('[Firestore] WeeklySchedule salvo');
                return true;
            } catch (error) {
                console.error('[Firestore] saveWeeklySchedule error:', error);
                return false;
            }
        },
        
        // ========== TIME SLOTS ==========
        async getTimeSlots(userId) {
            if (!userId || !db) return ['08:00', '09:30', '11:00', '14:00', '15:30'];
            try {
                const doc = await db.collection('users').doc(userId).collection('settings').doc('timeSlots').get();
                return doc.exists ? doc.data().slots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
            } catch (error) {
                console.error('[Firestore] getTimeSlots error:', error);
                return ['08:00', '09:30', '11:00', '14:00', '15:30'];
            }
        },
        
        async saveTimeSlots(userId, slots) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('settings').doc('timeSlots').set({
                    slots: slots,
                    updatedAt: new Date().toISOString()
                });
                console.log('[Firestore] TimeSlots salvos:', slots.length);
                return true;
            } catch (error) {
                console.error('[Firestore] saveTimeSlots error:', error);
                return false;
            }
        },
        
        // ========== NOTIFICAÇÕES ==========
        async getNotifications(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('notifications')
                    .orderBy('time', 'desc')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('[Firestore] getNotifications error:', error);
                return [];
            }
        },
        
        async saveNotification(userId, notificationId, notificationData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('notifications').doc(notificationId).set({
                    ...notificationData,
                    updatedAt: new Date().toISOString()
                });
                console.log('[Firestore] Notification salva:', notificationId);
                return true;
            } catch (error) {
                console.error('[Firestore] saveNotification error:', error);
                return false;
            }
        },
        
        async deleteNotification(userId, notificationId) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('notifications').doc(notificationId).delete();
                console.log('[Firestore] Notification deletada:', notificationId);
                return true;
            } catch (error) {
                console.error('[Firestore] deleteNotification error:', error);
                return false;
            }
        },
        
        async markAllNotificationsAsRead(userId) {
            if (!userId || !db) return false;
            try {
                const snapshot = await db.collection('users').doc(userId).collection('notifications').get();
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.update(doc.ref, { read: true });
                });
                await batch.commit();
                console.log('[Firestore] Todas notificações marcadas como lidas');
                return true;
            } catch (error) {
                console.error('[Firestore] markAllNotificationsAsRead error:', error);
                return false;
            }
        },
        
        async clearAllNotifications(userId) {
            if (!userId || !db) return false;
            try {
                const snapshot = await db.collection('users').doc(userId).collection('notifications').get();
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log('[Firestore] Todas notificações limpas');
                return true;
            } catch (error) {
                console.error('[Firestore] clearAllNotifications error:', error);
                return false;
            }
        },
        
        // ========== ESCUTA EM TEMPO REAL CORRIGIDA ==========
        listenToUserData(userId, callback) {
            if (!userId || !db) {
                console.warn('[Firestore] listenToUserData: userId ou db não disponível');
                return () => {};
            }
            
            console.log('[Firestore] 🔔 Iniciando escuta em tempo real para:', userId);
            
            let isActive = true;
            let unsubscribes = [];
            
            try {
                const unsubscribeTasks = db.collection('users').doc(userId).collection('tasks')
                    .onSnapshot(snapshot => {
                        if (!isActive) return;
                        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        callback({ tasks });
                    }, err => console.warn('[Firestore] Tasks listener error:', err));
                unsubscribes.push(unsubscribeTasks);
                
                const unsubscribeNotes = db.collection('users').doc(userId).collection('notes')
                    .onSnapshot(snapshot => {
                        if (!isActive) return;
                        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        callback({ notes });
                    }, err => console.warn('[Firestore] Notes listener error:', err));
                unsubscribes.push(unsubscribeNotes);
                
                const unsubscribeEvents = db.collection('users').doc(userId).collection('calendarEvents')
                    .onSnapshot(snapshot => {
                        if (!isActive) return;
                        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        callback({ calendarEvents: events });
                    }, err => console.warn('[Firestore] Events listener error:', err));
                unsubscribes.push(unsubscribeEvents);
                
                const unsubscribeSchedule = db.collection('users').doc(userId).collection('settings').doc('weeklySchedule')
                    .onSnapshot(doc => {
                        if (!isActive) return;
                        if (doc.exists) callback({ weeklySchedule: doc.data() });
                    }, err => console.warn('[Firestore] Schedule listener error:', err));
                unsubscribes.push(unsubscribeSchedule);
                
                const unsubscribeTimeSlots = db.collection('users').doc(userId).collection('settings').doc('timeSlots')
                    .onSnapshot(doc => {
                        if (!isActive) return;
                        if (doc.exists) callback({ timeSlots: doc.data().slots });
                    }, err => console.warn('[Firestore] TimeSlots listener error:', err));
                unsubscribes.push(unsubscribeTimeSlots);
                
                console.log('[Firestore] ✅ Escuta em tempo real iniciada com sucesso');
                
            } catch (error) {
                console.error('[Firestore] Erro ao iniciar escuta:', error);
            }
            
            return () => {
                console.log('[Firestore] 🔌 Encerrando escuta em tempo real');
                isActive = false;
                unsubscribes.forEach(unsubscribe => {
                    if (typeof unsubscribe === 'function') unsubscribe();
                });
                unsubscribes = [];
            };
        }
    };
    
    // ========== FOTO DE PERFIL (STORAGE) ==========
    window.FirebaseStorage = {
        async uploadProfilePhoto(userId, file) {
            if (!userId || !file || !storage) {
                console.error('[Storage] uploadProfilePhoto: parâmetros inválidos');
                return null;
            }
            
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                console.error('[Storage] Arquivo não é uma imagem');
                return null;
            }
            
            // Limitar tamanho (2MB)
            if (file.size > 2 * 1024 * 1024) {
                console.error('[Storage] Imagem muito grande (máx 2MB)');
                return null;
            }
            
            try {
                const extension = file.type.split('/')[1] || 'jpg';
                const fileName = `profile_${userId}_${Date.now()}.${extension}`;
                const storageRef = storage.ref().child(`profile_photos/${fileName}`);
                
                console.log('[Storage] Enviando foto...');
                const snapshot = await storageRef.put(file);
                const downloadUrl = await snapshot.ref.getDownloadURL();
                
                // Salvar URL no Firestore como Base64 (simulado)
                await db.collection('users').doc(userId).set({ 
                    profilePhotoUrl: downloadUrl,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                
                console.log('[Storage] ✅ Foto enviada com sucesso');
                return downloadUrl;
            } catch (error) {
                console.error('[Storage] Erro no upload:', error);
                return null;
            }
        },
        
        async getProfilePhotoUrl(userId) {
            if (!userId || !db) return null;
            try {
                const doc = await db.collection('users').doc(userId).get();
                return doc.exists ? doc.data().profilePhotoUrl : null;
            } catch (error) {
                console.error('[Storage] getProfilePhotoUrl error:', error);
                return null;
            }
        },
        
        async deleteProfilePhoto(userId) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).update({ 
                    profilePhotoUrl: null,
                    updatedAt: new Date().toISOString()
                });
                console.log('[Storage] Foto de perfil removida');
                return true;
            } catch (error) {
                console.error('[Storage] deleteProfilePhoto error:', error);
                return false;
            }
        },
        
        listenProfilePhoto(userId, callback) {
            if (!userId || !db) return () => {};
            return db.collection('users').doc(userId).onSnapshot(doc => {
                if (doc.exists && callback) {
                    callback(doc.data().profilePhotoUrl);
                }
            }, err => console.warn('[Storage] Profile photo listener error:', err));
        }
    };
    
    // ========== FUNÇÕES DE UTILIDADE ==========
    window.FirestoreUtils = {
        async deleteAllUserData(userId) {
            if (!userId || !db) return false;
            console.log('[Firestore] 🗑️ Deletando todos os dados do usuário:', userId);
            
            try {
                await window.FirestoreService.deleteAllTasks(userId);
                await window.FirestoreService.deleteAllNotes(userId);
                await window.FirestoreService.deleteAllCalendarEvents(userId);
                await window.FirestoreService.deleteProfilePhoto(userId);
                
                console.log('[Firestore] ✅ Todos os dados foram deletados');
                return true;
            } catch (error) {
                console.error('[Firestore] deleteAllUserData error:', error);
                return false;
            }
        },
        
        async getUserStats(userId) {
            if (!userId || !db) return null;
            try {
                const tasks = await window.FirestoreService.getTasks(userId);
                const notes = await window.FirestoreService.getNotes(userId);
                const events = await window.FirestoreService.getCalendarEvents(userId);
                
                return {
                    tasksCount: tasks.length,
                    notesCount: notes.length,
                    eventsCount: events.length,
                    lastUpdated: new Date().toISOString()
                };
            } catch (error) {
                console.error('[Firestore] getUserStats error:', error);
                return null;
            }
        }
    };
    
    // Expor instâncias para uso global
    window.firebaseAuth = auth;
    window.firestore = db;
    window.firebaseStorage = storage;
    
    console.log('[Firebase] 🔥 Configuração Firestore completa carregada!');
    console.log('[Firebase] Versão: FIRESTORE_COMPLETA_v2.1');
})();