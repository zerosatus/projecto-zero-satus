// Configuração do Firebase para sincronização em nuvem (Realtime Database)
(function() {
    const firebaseConfig = {
        apiKey: "AIzaSyDOXYoICsqe3D7bBALLI1MFLSGr1D-t4iY",
        authDomain: "zero-5e74d.firebaseapp.com",
        projectId: "zero-5e74d",
        storageBucket: "zero-5e74d.firebasestorage.app",
        messagingSenderId: "431244473899",
        appId: "1:431244473899:web:da9424fd226f7386dddc6e",
        databaseURL: "https://zero-5e74d-default-rtdb.firebaseio.com/"
    };
    
    // Inicializar Firebase apenas se ainda não foi inicializado
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const database = firebase.database();
    const auth = firebase.auth();
    
    window.FirebaseSync = {
        // Salvar dado específico do usuário
        async saveUserDataToCloud(userId, dataType, data) {
            if (!userId) return false;
            try {
                const userRef = database.ref(`users/${userId}/${dataType}`);
                await userRef.set(data);
                await database.ref(`users/${userId}/lastUpdated`).set(firebase.database.ServerValue.TIMESTAMP);
                console.log(`[Cloud] ${dataType} salvo!`);
                return true;
            } catch (error) {
                console.error('[Cloud] Erro ao salvar:', error);
                return false;
            }
        },
        
        // Carregar dado específico do usuário
        async loadUserDataFromCloud(userId, dataType) {
            if (!userId) return null;
            try {
                const snapshot = await database.ref(`users/${userId}/${dataType}`).once('value');
                return snapshot.val();
            } catch (error) {
                console.error('[Cloud] Erro ao carregar:', error);
                return null;
            }
        },
        
        // Sincronizar todos os dados de uma vez
        async syncAllDataToCloud(userId, data) {
            if (!userId) return false;
            try {
                const userData = {
                    ...data,
                    lastUpdated: firebase.database.ServerValue.TIMESTAMP,
                    userId: userId
                };
                // Remover campos circulares ou funções que possam causar erro
                delete userData.saveAllData;
                delete userData.loadAllData;
                
                await database.ref(`users/${userId}`).update(userData);
                console.log('[Cloud] Todos dados sincronizados!');
                return true;
            } catch (error) {
                console.error('[Cloud] Erro na sincronização total:', error);
                return false;
            }
        },
        
        // Carregar todos os dados do usuário da nuvem
        async loadAllUserDataFromCloud(userId) {
            if (!userId) return null;
            try {
                const snapshot = await database.ref(`users/${userId}`).once('value');
                const data = snapshot.val();
                if (data) {
                    console.log('[Cloud] Dados carregados com sucesso!');
                    return data;
                }
                return null;
            } catch (error) {
                console.error('[Cloud] Erro ao carregar todos dados:', error);
                return null;
            }
        },
        
        // Escutar mudanças em tempo real (opcional)
        listenToUserData(userId, callback) {
            if (!userId) return null;
            const userRef = database.ref(`users/${userId}`);
            const listener = userRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data && callback) callback(data);
            });
            return () => userRef.off('value', listener);
        }
    };
    
    console.log('[Firebase] Configuração do Realtime Database carregada!');
})();