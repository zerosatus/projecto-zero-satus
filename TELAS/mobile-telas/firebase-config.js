// Configuração do Firebase para sincronização em nuvem
(function() {
    const firebaseConfig = {
        apiKey: "AIzaSyDOXYoICsqe3D7bBALLI1MFLSGr1D-t4iY",
        authDomain: "zero-5e74d.firebaseapp.com",
        projectId: "zero-5e74d",
        storageBucket: "zero-5e74d.firebasestorage.app",
        messagingSenderId: "431244473899",
        appId: "1:431244473899:web:da9424fd226f7386dddc6e"
    };
    
    if (!window.firebaseApp) {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        window.firebaseDb = firebase.firestore();
        window.firebaseAuth = firebase.auth();
    }
    
    window.FirebaseSync = {
        async saveUserDataToCloud(userId, dataType, data) {
            if (!userId) return false;
            try {
                const userRef = window.firebaseDb.collection('users').doc(userId);
                const updateData = {};
                updateData[dataType] = data;
                updateData.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
                await userRef.set(updateData, { merge: true });
                console.log(`[Cloud] ${dataType} salvo!`);
                return true;
            } catch (error) {
                console.error('[Cloud] Erro:', error);
                return false;
            }
        },
        
        async loadUserDataFromCloud(userId, dataType) {
            if (!userId) return null;
            try {
                const userRef = window.firebaseDb.collection('users').doc(userId);
                const doc = await userRef.get();
                if (doc.exists) {
                    return doc.data()[dataType] || null;
                }
                return null;
            } catch (error) {
                console.error('[Cloud] Erro:', error);
                return null;
            }
        },
        
        async syncAllDataToCloud(userId, data) {
            if (!userId) return false;
            try {
                const userRef = window.firebaseDb.collection('users').doc(userId);
                await userRef.set({
                    ...data,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: userId
                }, { merge: true });
                console.log('[Cloud] Todos dados sincronizados!');
                return true;
            } catch (error) {
                console.error('[Cloud] Erro:', error);
                return false;
            }
        },
        
        async loadAllUserDataFromCloud(userId) {
            if (!userId) return null;
            try {
                const userRef = window.firebaseDb.collection('users').doc(userId);
                const doc = await userRef.get();
                if (doc.exists) {
                    return doc.data();
                }
                return null;
            } catch (error) {
                console.error('[Cloud] Erro:', error);
                return null;
            }
        }
    };
    
    console.log('[Firebase] Configuração carregada!');
})();
