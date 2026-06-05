// Configuração do Firebase para sincronização em nuvem (Realtime Database + Base64 para fotos)
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
    
    let database = null;
    let auth = null;
    let firebaseInitialized = false;
    
    function initFirebase() {
        if (firebaseInitialized) return true;
        
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                database = firebase.database();
                auth = firebase.auth();
                firebaseInitialized = true;
                console.log('[Firebase] ✅ Firebase inicializado com sucesso!');
                window.dispatchEvent(new CustomEvent('firebaseLoaded'));
                return true;
            } catch (error) {
                console.error('[Firebase] ❌ Erro ao inicializar:', error);
                return false;
            }
        } else if (typeof firebase !== 'undefined' && firebase.apps.length) {
            database = firebase.database();
            auth = firebase.auth();
            firebaseInitialized = true;
            return true;
        }
        return false;
    }
    
    initFirebase();
    
    if (!firebaseInitialized) {
        setTimeout(initFirebase, 1000);
    }
    
    // Função auxiliar para converter File para Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    // ========== FUNÇÕES DE FOTO DE PERFIL COM BASE64 ==========
    window.FirebaseStorage = {
        async uploadProfilePhoto(userId, file) {
            if (!userId || !file) {
                console.error('[Storage] userId ou arquivo não fornecido');
                return null;
            }
            
            if (!database && !initFirebase()) {
                console.error('[Storage] Database não disponível');
                return null;
            }
            
            try {
                if (file.size > 2 * 1024 * 1024) {
                    console.error('[Storage] Imagem muito grande para Base64 (max 2MB)');
                    return null;
                }
                
                console.log('[Storage] 📤 Convertendo foto para Base64...');
                const base64 = await fileToBase64(file);
                
                console.log('[Storage] 💾 Salvando foto no Realtime Database...');
                const userRef = database.ref(`users/${userId}/profilePhotoBase64`);
                await userRef.set(base64);
                await database.ref(`users/${userId}/profilePhotoUpdated`).set(Date.now());
                
                console.log('[Storage] ✅ Foto salva como Base64 com sucesso!');
                return base64;
                
            } catch (error) {
                console.error('[Storage] ❌ Erro no upload:', error);
                return null;
            }
        },
        
        async getProfilePhotoUrl(userId) {
            if (!userId) return null;
            if (!database && !initFirebase()) return null;
            
            try {
                const snapshot = await database.ref(`users/${userId}/profilePhotoBase64`).once('value');
                return snapshot.val();
            } catch (error) {
                console.error('[Storage] ❌ Erro ao buscar foto:', error);
                return null;
            }
        },
        
        async deleteProfilePhoto(userId, photoUrl) {
            if (!userId) return false;
            if (!database && !initFirebase()) return false;
            
            try {
                await database.ref(`users/${userId}/profilePhotoBase64`).remove();
                await database.ref(`users/${userId}/profilePhotoUpdated`).remove();
                console.log('[Storage] ✅ Foto deletada do Realtime Database');
                return true;
            } catch (error) {
                console.error('[Storage] ❌ Erro ao deletar foto:', error);
                return false;
            }
        },
        
        listenProfilePhoto(userId, callback) {
            if (!userId || !database) return null;
            
            const photoRef = database.ref(`users/${userId}/profilePhotoBase64`);
            const listener = photoRef.on('value', (snapshot) => {
                const photoUrl = snapshot.val();
                if (callback) callback(photoUrl);
            });
            
            return () => photoRef.off('value', listener);
        }
    };
    
    // ========== FUNÇÕES DE SINCRONIZAÇÃO ==========
    window.FirebaseSync = {
        async saveUserDataToCloud(userId, dataType, data) {
            if (!userId) {
                console.error('[Cloud] ❌ userId não fornecido');
                return false;
            }
            
            if (!database && !initFirebase()) {
                console.error('[Cloud] ❌ Database não disponível');
                return false;
            }
            
            try {
                const userRef = database.ref(`users/${userId}/${dataType}`);
                await userRef.set(data);
                await database.ref(`users/${userId}/lastUpdated`).set(firebase.database.ServerValue.TIMESTAMP);
                console.log(`[Cloud] ✅ ${dataType} salvo na nuvem para ${userId}`);
                return true;
            } catch (error) {
                console.error(`[Cloud] ❌ Erro ao salvar ${dataType}:`, error);
                return false;
            }
        },
        
        async loadUserDataFromCloud(userId, dataType) {
            if (!userId) return null;
            if (!database && !initFirebase()) return null;
            
            try {
                const snapshot = await database.ref(`users/${userId}/${dataType}`).once('value');
                return snapshot.val();
            } catch (error) {
                console.error(`[Cloud] ❌ Erro ao carregar ${dataType}:`, error);
                return null;
            }
        },
        
        async loadAllUserDataFromCloud(userId) {
            if (!userId) {
                console.log('[Cloud] ❌ userId não fornecido');
                return null;
            }
            
            if (!database && !initFirebase()) {
                console.log('[Cloud] ❌ Database indisponível');
                return null;
            }
            
            try {
                console.log('[Cloud] 🔍 Buscando dados do usuário:', userId);
                const snapshot = await database.ref(`users/${userId}`).once('value');
                const data = snapshot.val();
                
                if (data && Object.keys(data).length > 0) {
                    console.log('[Cloud] ✅ Dados carregados:', Object.keys(data));
                    return data;
                }
                
                console.log('[Cloud] ⚠️ Nenhum dado encontrado para:', userId);
                return null;
            } catch (error) {
                console.error('[Cloud] ❌ Erro ao carregar todos dados:', error);
                return null;
            }
        },
        
        listenToUserData(userId, callback) {
            if (!userId) {
                console.log('[Cloud] ❌ userId não fornecido');
                return null;
            }
            
            if (!database && !initFirebase()) {
                console.log('[Cloud] ❌ Database indisponível para escuta');
                return null;
            }
            
            console.log('[Cloud] 📡 Iniciando escuta em tempo real para:', userId);
            
            const userRef = database.ref(`users/${userId}`);
            const listener = userRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data && callback) {
                    console.log('[Cloud] 🔔 Mudança detectada na nuvem!');
                    callback(data);
                }
            }, (error) => {
                console.error('[Cloud] ❌ Erro na escuta:', error);
            });
            
            return () => {
                console.log('[Cloud] 🔌 Parando escuta para:', userId);
                userRef.off('value', listener);
            };
        },
        
        async deleteUserData(userId) {
            if (!userId) return false;
            if (!database && !initFirebase()) return false;
            
            try {
                await database.ref(`users/${userId}`).remove();
                console.log('[Cloud] ✅ Dados do usuário removidos da nuvem');
                return true;
            } catch (error) {
                console.error('[Cloud] ❌ Erro ao remover dados:', error);
                return false;
            }
        },
        
        async syncAllDataToCloud(userId, allData) {
            if (!userId) return false;
            if (!database && !initFirebase()) return false;
            
            try {
                await database.ref(`users/${userId}`).update(allData);
                console.log('[Cloud] ✅ Todos os dados sincronizados!');
                return true;
            } catch (error) {
                console.error('[Cloud] ❌ Erro na sincronização:', error);
                return false;
            }
        }
    };
    
    window.firebaseAuth = auth;
    
    console.log('[Firebase] Configuração do Realtime Database com Base64 carregada!');
})();