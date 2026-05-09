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
        console.log('[Firebase] Firebase inicializado!');
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
                console.log(`[Cloud] ✅ ${dataType} salvo na nuvem!`);
                return true;
            } catch (error) {
                console.error('[Cloud] ❌ Erro ao salvar:', error);
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
                console.error('[Cloud] ❌ Erro ao carregar:', error);
                return null;
            }
        },
        
        // Sincronizar todos os dados de uma vez
        async syncAllDataToCloud(userId, data) {
            if (!userId) return false;
            try {
                // Remover dados sensíveis ou circulares
                const cleanData = { ...data };
                delete cleanData.saveAllData;
                delete cleanData.loadAllData;
                delete cleanData.syncAllDataToCloud;
                
                const userData = {
                    ...cleanData,
                    lastUpdated: firebase.database.ServerValue.TIMESTAMP,
                    userId: userId
                };
                
                await database.ref(`users/${userId}`).update(userData);
                console.log('[Cloud] ✅ Todos dados sincronizados com a nuvem!');
                return true;
            } catch (error) {
                console.error('[Cloud] ❌ Erro na sincronização total:', error);
                return false;
            }
        },
        
        // Carregar todos os dados do usuário da nuvem
        async loadAllUserDataFromCloud(userId) {
            if (!userId) return null;
            try {
                console.log('[Cloud] 🔍 Buscando dados do usuário na nuvem...');
                const snapshot = await database.ref(`users/${userId}`).once('value');
                const data = snapshot.val();
                if (data && Object.keys(data).length > 0) {
                    console.log('[Cloud] ✅ Dados carregados da nuvem com sucesso!');
                    return data;
                }
                console.log('[Cloud] ⚠️ Nenhum dado encontrado na nuvem');
                return null;
            } catch (error) {
                console.error('[Cloud] ❌ Erro ao carregar todos dados:', error);
                return null;
            }
        },
        
        // Escutar mudanças em tempo real
        listenToUserData(userId, callback) {
            if (!userId) return null;
            console.log('[Cloud] 📡 Iniciando escuta em tempo real...');
            const userRef = database.ref(`users/${userId}`);
            const listener = userRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data && callback) {
                    console.log('[Cloud] 🔔 Mudança detectada na nuvem!');
                    callback(data);
                }
            });
            return () => {
                console.log('[Cloud] 🔌 Parando escuta em tempo real');
                userRef.off('value', listener);
            };
        },
        
        // Configurar sincronização automática com keepSynced
        enableAutoSync(userId) {
            if (!userId) return;
            const userRef = database.ref(`users/${userId}`);
            userRef.keepSynced(true);
            console.log('[Cloud] 🔄 Auto-sync ativado para o usuário');
        }
    };
    
    // Configurar auto-sync quando usuário logar
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('[Firebase] Usuário autenticado:', user.uid);
            window.FirebaseSync.enableAutoSync(user.uid);
        }
    });
    
    console.log('[Firebase] Configuração do Realtime Database carregada!');
})();