// firebase-config.js - VERSÃO FIRESTORE COMPLETA
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
                
                db.enablePersistence().catch(err => console.warn('[Firestore] Persistência offline:', err));
                console.log('[Firestore] ✅ Inicializado!');
                window.dispatchEvent(new CustomEvent('firebaseLoaded'));
                return true;
            } catch (error) {
                console.error('[Firestore] ❌ Erro:', error);
                return false;
            }
        }
        return false;
    }
    
    initFirebase();
    
    // ========== SERVIÇO PRINCIPAL DO FIRESTORE ==========
    window.FirestoreService = {
        // Usuário
        async getUserData(userId) {
            if (!userId || !db) return null;
            try {
                const doc = await db.collection('users').doc(userId).get();
                return doc.exists ? doc.data() : null;
            } catch (error) {
                return null;
            }
        },
        
        // Tarefas
        async getTasks(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('tasks').orderBy('createdAt', 'desc').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                return [];
            }
        },
        
        async saveTask(userId, taskId, taskData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('tasks').doc(taskId).set(taskData, { merge: true });
                return true;
            } catch (error) {
                return false;
            }
        },
        
        async deleteTask(userId, taskId) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('tasks').doc(taskId).delete();
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // Anotações
        async getNotes(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('notes').orderBy('updatedAt', 'desc').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                return [];
            }
        },
        
        async saveNote(userId, noteId, noteData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('notes').doc(noteId).set(noteData, { merge: true });
                return true;
            } catch (error) {
                return false;
            }
        },
        
        async deleteNote(userId, noteId) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('notes').doc(noteId).delete();
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // Eventos do calendário
        async getCalendarEvents(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('calendarEvents').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                return [];
            }
        },
        
        async saveCalendarEvent(userId, eventId, eventData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('calendarEvents').doc(eventId).set(eventData, { merge: true });
                return true;
            } catch (error) {
                return false;
            }
        },
        
        async deleteCalendarEvent(userId, eventId) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('calendarEvents').doc(eventId).delete();
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // Horário semanal
        async getWeeklySchedule(userId) {
            if (!userId || !db) return null;
            try {
                const doc = await db.collection('users').doc(userId).collection('settings').doc('weeklySchedule').get();
                return doc.exists ? doc.data() : null;
            } catch (error) {
                return null;
            }
        },
        
        async saveWeeklySchedule(userId, scheduleData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('settings').doc('weeklySchedule').set(scheduleData);
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // TimeSlots
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
                return false;
            }
        },
        
        // Notificações
        async getNotifications(userId) {
            if (!userId || !db) return [];
            try {
                const snapshot = await db.collection('users').doc(userId).collection('notifications').orderBy('time', 'desc').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                return [];
            }
        },
        
        async saveNotification(userId, notificationId, notificationData) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('notifications').doc(notificationId).set(notificationData);
                return true;
            } catch (error) {
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
                return true;
            } catch (error) {
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
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // Configurações
        async getSettings(userId) {
            if (!userId || !db) return { notifications: {}, appearance: {} };
            try {
                const doc = await db.collection('users').doc(userId).collection('settings').doc('preferences').get();
                return doc.exists ? doc.data() : { notifications: {}, appearance: {} };
            } catch (error) {
                return { notifications: {}, appearance: {} };
            }
        },
        
        async saveSettings(userId, settings) {
            if (!userId || !db) return false;
            try {
                await db.collection('users').doc(userId).collection('settings').doc('preferences').set(settings, { merge: true });
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // ESCUTA EM TEMPO REAL
        listenToUserData(userId, callback) {
            if (!userId || !db) return null;
            
            const unsubscribeTasks = db.collection('users').doc(userId).collection('tasks')
                .onSnapshot(snapshot => {
                    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback({ tasks });
                });
            
            const unsubscribeNotes = db.collection('users').doc(userId).collection('notes')
                .onSnapshot(snapshot => {
                    const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback({ notes });
                });
            
            const unsubscribeEvents = db.collection('users').doc(userId).collection('calendarEvents')
                .onSnapshot(snapshot => {
                    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback({ calendarEvents: events });
                });
            
            const unsubscribeSchedule = db.collection('users').doc(userId).collection('settings').doc('weeklySchedule')
                .onSnapshot(doc => {
                    if (doc.exists) callback({ weeklySchedule: doc.data() });
                });
            
            return () => {
                unsubscribeTasks();
                unsubscribeNotes();
                unsubscribeEvents();
                unsubscribeSchedule();
            };
        }
    };
    
    // ========== FOTO DE PERFIL (STORAGE) ==========
    window.FirebaseStorage = {
        async uploadProfilePhoto(userId, file) {
            if (!userId || !file || !storage) return null;
            try {
                const extension = file.type.split('/')[1] || 'jpg';
                const fileName = `profile_${userId}_${Date.now()}.${extension}`;
                const storageRef = storage.ref().child(`profile_photos/${fileName}`);
                const snapshot = await storageRef.put(file);
                const downloadUrl = await snapshot.ref.getDownloadURL();
                await db.collection('users').doc(userId).update({ profilePhotoUrl: downloadUrl, updatedAt: new Date().toISOString() });
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
            if (!userId || !db) return null;
            return db.collection('users').doc(userId).onSnapshot(doc => {
                if (doc.exists && callback) callback(doc.data().profilePhotoUrl);
            });
        }
    };
    
    window.firebaseAuth = auth;
    window.firestore = db;
    
    console.log('[Firebase] Configuração Firestore carregada!');
})();