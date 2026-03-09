class LocalDatabase {
    constructor(dbName = 'PainelAlunoDB') {
        this.dbName = dbName;
        this.db = null;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('tarefas')) {
                    db.createObjectStore('tarefas', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('anotacoes')) {
                    db.createObjectStore('anotacoes', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('eventos')) {
                    db.createObjectStore('eventos', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('horario')) {
                    db.createObjectStore('horario', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('pendingSync')) {
                    db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('notificacoes')) {
                    const notifStore = db.createObjectStore('notificacoes', { keyPath: 'id', autoIncrement: true });
                    notifStore.createIndex('tag', 'tag', { unique: false });
                    notifStore.createIndex('timestamp', 'timestamp');
                    notifStore.createIndex('lida', 'lida');
                }
                
                if (!db.objectStoreNames.contains('notificacoes_agendadas')) {
                    const agendadasStore = db.createObjectStore('notificacoes_agendadas', { keyPath: 'id', autoIncrement: true });
                    agendadasStore.createIndex('tag', 'tag', { unique: true });
                    agendadasStore.createIndex('disparo_em', 'disparo_em');
                }
                
                if (!db.objectStoreNames.contains('config_notificacoes')) {
                    db.createObjectStore('config_notificacoes', { keyPath: 'id' });
                }
            };
        });
    }
    
    async saveData(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            if (Array.isArray(data)) {
                data.forEach(item => store.put(item));
            } else {
                store.put(data);
            }
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
    
    async getData(storeName, key = null) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (key) {
                request = store.get(key);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async queryIndex(storeName, indexName, value) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteData(storeName, key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async clearStore(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async addToPendingSync(data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingSync'], 'readwrite');
            const store = transaction.objectStore('pendingSync');
            
            const pendingItem = {
                data: data,
                timestamp: new Date().toISOString(),
                synced: false
            };
            
            const request = store.add(pendingItem);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async salvarNotificacao(notificacao) {
        const notif = {
            ...notificacao,
            timestamp: Date.now(),
            lida: false
        };
        return this.saveData('notificacoes', notif);
    }
    
    async getNotificacoesNaoLidas() {
        const todas = await this.getData('notificacoes') || [];
        return todas.filter(n => !n.lida).sort((a, b) => b.timestamp - a.timestamp);
    }
    
    async marcarComoLida(id) {
        const notificacoes = await this.getData('notificacoes');
        const notif = notificacoes.find(n => n.id === id);
        if (notif) {
            notif.lida = true;
            await this.saveData('notificacoes', notif);
        }
    }
    
    async marcarTodasComoLidas() {
        const notificacoes = await this.getData('notificacoes');
        notificacoes.forEach(n => n.lida = true);
        await this.saveData('notificacoes', notificacoes);
    }
    
    async agendarNotificacao(notificacao) {
        return this.saveData('notificacoes_agendadas', notificacao);
    }
    
    async getNotificacoesAgendadas(ateTimestamp = Date.now()) {
        const todas = await this.getData('notificacoes_agendadas') || [];
        return todas.filter(n => n.disparo_em <= ateTimestamp);
    }
    
    async removerAgendada(id) {
        return this.deleteData('notificacoes_agendadas', id);
    }
    
    async salvarConfigNotificacoes(config) {
        return this.saveData('config_notificacoes', { id: 'config', ...config });
    }
    
    async getConfigNotificacoes() {
        const configs = await this.getData('config_notificacoes', 'config');
        return configs || {
            push: true,
            email: false,
            aulas: true,
            tarefas: true,
            lembrete_estudo: true,
            antecedencia: 30
        };
    }
}

const localDB = new LocalDatabase();
window.localDB = localDB;
