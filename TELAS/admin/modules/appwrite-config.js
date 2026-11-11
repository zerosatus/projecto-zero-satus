// modules/appwrite-config.js

const APPWRITE_ENDPOINT = 'https://tor.cloud.appwrite.io/v1'; // Seu Endpoint
const APPWRITE_PROJECT_ID = '6af0bac90024f45e74ad'; // Seu Project ID
const APPWRITE_DB_ID = '6af0ce90024caf513cd'; // ID do Banco (Production Ta...)
const APPWRITE_TABLE_ID = '6af0c72880017ce629894'; // ID da Tabela (o que você mandou no print)

let appwriteClient = null;
let appwriteDatabases = null;

try {
    if (typeof window.Appwrite !== 'undefined') {
        const { Client, Databases } = window.Appwrite;
        
        appwriteClient = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID);

        appwriteDatabases = new Databases(appwriteClient);
        console.log('[Appwrite] ✅ Cliente inicializado');
    }
} catch (error) {
    console.error('[Appwrite] ❌ Erro ao inicializar:', error);
}

window.appwriteClient = appwriteClient;
window.appwriteDatabases = appwriteDatabases;
window.APPWRITE_DB_ID = APPWRITE_DB_ID;
window.APPWRITE_TABLE_ID = APPWRITE_TABLE_ID;