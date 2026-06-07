// firebase-config.js - VERSÃO SIMPLIFICADA (SEM ERROS)

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
    
    function initFirebase() {
        if (typeof firebase === 'undefined') {
            console.warn('[Firebase] Firebase não carregado');
            return false;
        }
        
        if (!firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                console.log('[Firebase] ✅ Inicializado!');
            } catch (error) {
                console.error('[Firebase] ❌ Erro:', error);
                return false;
            }
        }
        
        db = firebase.firestore();
        auth = firebase.auth();
        storage = firebase.storage();
        
        // CONFIGURAR PERSISTÊNCIA DE FORMA SEGURA
        try {
            db.enablePersistence({ synchronizeTabs: true })
                .catch(err => {
                    if (err.code === 'failed-precondition') {
                        console.warn('[Firestore] Múltiplas abas, usando cache em memória');
                    } else if (err.code === 'unimplemented') {
                        console.warn('[Firestore] Navegador não suporta persistência');
                    }
                });
        } catch (err) {
            console.warn('[Firestore] Persistência não disponível:', err);
        }
        
        return true;
    }
    
    initFirebase();
    
    // ========== SERVIÇO PRINCIPAL DO FIRESTORE ==========
    window.FirestoreService = {
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
        
        async getTasks(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('tasks').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('[Firestore] getTasks error:', error);
                return [];
            }
        },
        
        async saveTask(userId, taskId, taskData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('tasks').doc(taskId).set(taskData, { merge: true });
                return true;
            } catch (error) {
                console.error('[Firestore] saveTask error:', error);
                return false;
            }
        },
        
        async deleteTask(userId, taskId) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('tasks').doc(taskId).delete();
                return true;
            } catch (error) {
                console.error('[Firestore] deleteTask error:', error);
                return false;
            }
        },
        
        async getNotes(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('notes').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('[Firestore] getNotes error:', error);
                return [];
            }
        },
        
        async saveNote(userId, noteId, noteData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('notes').doc(noteId).set(noteData, { merge: true });
                return true;
            } catch (error) {
                console.error('[Firestore] saveNote error:', error);
                return false;
            }
        },
        
        async deleteNote(userId, noteId) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('notes').doc(noteId).delete();
                return true;
            } catch (error) {
                console.error('[Firestore] deleteNote error:', error);
                return false;
            }
        },
        
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
            try {
                await db.collection('users').doc(userId).collection('calendarEvents').doc(eventId).set(eventData, { merge: true });
                return true;
            } catch (error) {
                console.error('[Firestore] saveCalendarEvent error:', error);
                return false;
            }
        },
        
        async deleteCalendarEvent(userId, eventId) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('calendarEvents').doc(eventId).delete();
                return true;
            } catch (error) {
                console.error('[Firestore] deleteCalendarEvent error:', error);
                return false;
            }
        },
        
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
                await db.collection('users').doc(userId).collection('settings').doc('weeklySchedule').set(scheduleData);
                return true;
            } catch (error) {
                console.error('[Firestore] saveWeeklySchedule error:', error);
                return false;
            }
        },
        
        async getTimeSlots(userId) {
            if (!userId || !db) return ['08:00', '09:30', '11:00', '14:00', '15:30'];
            try {
                const doc = await db.collection('users').doc(userId).collection('settings').doc('timeSlots').get();
                return doc.exists ? doc.data().slots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
            } catch (error) {
                return ['08:00', '09:30', '11:00', '14:00', '15:30'];
            }
        },
        
        async saveTimeSlots(userId, slots) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('settings').doc('timeSlots').set({ slots });
                return true;
            } catch (error) {
                console.error('[Firestore] saveTimeSlots error:', error);
                return false;
            }
        },
        
        async getNotifications(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('notifications').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('[Firestore] getNotifications error:', error);
                return [];
            }
        },
        
        listenToUserData(userId, callback) {
            if (!userId || !db) return () => {};
            
            // Retornar uma função vazia se não conseguir escutar
            const unsubTasks = db.collection('users').doc(userId).collection('tasks')
                .onSnapshot(snapshot => {
                    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback({ tasks });
                }, err => console.warn('[Firestore] Tasks listener error:', err));
            
            const unsubNotes = db.collection('users').doc(userId).collection('notes')
                .onSnapshot(snapshot => {
                    const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback({ notes });
                }, err => console.warn('[Firestore] Notes listener error:', err));
            
            const unsubEvents = db.collection('users').doc(userId).collection('calendarEvents')
                .onSnapshot(snapshot => {
                    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback({ calendarEvents: events });
                }, err => console.warn('[Firestore] Events listener error:', err));
            
            return () => {
                unsubTasks();
                unsubNotes();
                unsubEvents();
            };
        }
    };
    
    // ========== FOTO DE PERFIL ==========
    window.FirebaseStorage = {
        async uploadProfilePhoto(userId, file) {
            if (!userId || !file || !storage) return null;
            try {
                const fileName = `profile_${userId}_${Date.now()}`;
                const storageRef = storage.ref().child(`profile_photos/${fileName}`);
                const snapshot = await storageRef.put(file);
                const downloadUrl = await snapshot.ref.getDownloadURL();
                await db.collection('users').doc(userId).update({ profilePhotoUrl: downloadUrl });
                return downloadUrl;
            } catch (error) {
                console.error('[Storage] Erro:', error);
                return null;
            }
        },
        
        async getProfilePhotoUrl(userId) {
            if (!userId || !db) return null;
            try {
                const doc = await db.collection('users').doc(userId).get();
                return doc.exists ? doc.data().profilePhotoUrl : null;
            } catch (error) {
                return null;
            }
        },
        
        async deleteProfilePhoto(userId) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).update({ profilePhotoUrl: null });
                return true;
            } catch (error) {
                return false;
            }
        },
        
        listenProfilePhoto(userId, callback) {
            if (!userId || !db) return () => {};
            return db.collection('users').doc(userId).onSnapshot(doc => {
                if (doc.exists && callback) callback(doc.data().profilePhotoUrl);
            }, err => console.warn('[Storage] Profile photo listener error:', err));
        }
    };
    
    window.firebaseAuth = auth;
    window.firestore = db;
    
    console.log('[Firebase] Configuração carregada!');
})();