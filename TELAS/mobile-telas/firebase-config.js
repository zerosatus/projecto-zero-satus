import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    doc, getDoc, setDoc, updateDoc,
    onSnapshot,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getAuth, 
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDOXYoICsqe3D7bBALLI1MFLSGr1D-t4iY",
    authDomain: "zero-5e74d.firebaseapp.com",
    projectId: "zero-5e74d",
    storageBucket: "zero-5e74d.firebasestorage.app",
    messagingSenderId: "431244473899",
    appId: "1:431244473899:web:da9424fd226f7386dddc6e",
    measurementId: "G-HTX5HLKYHJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

enableIndexedDbPersistence(db).catch((err) => {
    console.log('Erro de persistência:', err);
});

let currentUser = null;
let unsubscribeFunctions = [];

function getCurrentUser() {
    return currentUser;
}

async function loadUserData(userId) {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.usuarioLogado) window.setCached('usuarioLogado', data.usuarioLogado);
            if (data.notifications) window.setCached('notifications', data.notifications);
            if (data.tasks) window.setCached('tasks', data.tasks);
            if (data.notes) window.setCached('notes', data.notes);
            if (data.calendarEvents) window.setCached('calendarEvents', data.calendarEvents);
            if (data.weeklySchedule) window.setCached('weeklySchedule', data.weeklySchedule);
            if (data.timeSlots) window.setCached('timeSlots', data.timeSlots);
            if (data.notificacoesSettings) window.setCached('notificacoesSettings', data.notificacoesSettings);
            if (data.appearanceSettings) window.setCached('appearanceSettings', data.appearanceSettings);
            return data;
        } else {
            await createDefaultUserData(userId);
            return await loadUserData(userId);
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        return null;
    }
}

async function createDefaultUserData(userId) {
    const defaultData = {
        usuarioLogado: { uid: userId, nome: currentUser?.displayName || 'Usuário', email: currentUser?.email || '' },
        notifications: [
            { id: 1, type: 'aula', title: 'Aula de Matemática', message: 'Lembrete: Aula às 14h hoje', time: new Date().toISOString(), read: false },
            { id: 2, type: 'tarefa', title: 'Tarefa Pendente', message: 'Lista de Exercícios para amanhã', time: new Date().toISOString(), read: false },
            { id: 3, type: 'lembrete', title: 'Prova de História', message: 'Sua prova será na próxima segunda', time: new Date().toISOString(), read: false }
        ],
        tasks: [
            { id: 1, title: 'Entregar Redação', subject: 'Português', date: new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), color: '#ec4899', completed: false, priority: 'alta' },
            { id: 2, title: 'Lista de Exercícios', subject: 'Matemática', date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), color: '#6366f1', completed: false, priority: 'media' }
        ],
        notes: [
            { id: Date.now() - 1000, title: 'Fórmulas de Física', content: 'F = m * a\nE = m * c²', date: new Date().toISOString() },
            { id: Date.now() - 2000, title: 'Vocabulário Inglês', content: 'Apple - Maçã\nBook - Livro', date: new Date().toISOString() }
        ],
        calendarEvents: [],
        weeklySchedule: {
            'Seg': [{ horaInicio: '08:00', horaFim: '09:30', materia: 'Matemática', color: '#6366f1', professor: '' }, { horaInicio: '09:30', horaFim: '11:00', materia: 'Química', color: '#10b981', professor: '' }, { horaInicio: '14:00', horaFim: '15:30', materia: 'Matemática', color: '#6366f1', professor: '' }],
            'Ter': [{ horaInicio: '08:00', horaFim: '09:30', materia: 'Português', color: '#ec4899', professor: '' }, { horaInicio: '09:30', horaFim: '11:00', materia: 'Biologia', color: '#3b82f6', professor: '' }],
            'Qua': [{ horaInicio: '08:00', horaFim: '09:30', materia: 'Física', color: '#ef4444', professor: '' }, { horaInicio: '09:30', horaFim: '11:00', materia: 'Inglês', color: '#8b5cf6', professor: '' }],
            'Qui': [{ horaInicio: '08:00', horaFim: '10:00', materia: 'História', color: '#f59e0b', professor: '' }],
            'Sex': [{ horaInicio: '08:00', horaFim: '09:30', materia: 'História', color: '#f59e0b', professor: '' }, { horaInicio: '09:30', horaFim: '11:00', materia: 'Geografia', color: '#a855f7', professor: '' }]
        },
        timeSlots: ['08:00', '09:00', '10:00', '14:00'],
        notificacoesSettings: { push: true, email: false, aulas: true, tarefas: true },
        appearanceSettings: { theme: 'dark', accent: '#8b5cf6', fontSize: 14 }
    };
    await setDoc(doc(db, 'users', userId), defaultData);
}

async function saveToFirestore(dataType, data) {
    if (!currentUser) return false;
    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { [dataType]: data });
        return true;
    } catch (error) {
        console.error(`Erro ao salvar ${dataType}:`, error);
        return false;
    }
}

function setupRealtimeListener(callback) {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists() && callback) callback(docSnap.data());
    });
    unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
}

async function logout() {
    try {
        unsubscribeFunctions.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
        unsubscribeFunctions = [];
        await signOut(auth);
        currentUser = null;
        localStorage.clear();
        return { success: true };
    } catch (error) {
        console.error('Erro ao sair:', error);
        return { success: false, error: error.message };
    }
}

function initAuth(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData(user.uid);
            setupRealtimeListener((data) => {
                if (data.notifications) window.setCached('notifications', data.notifications);
                if (data.tasks) window.setCached('tasks', data.tasks);
                if (data.notes) window.setCached('notes', data.notes);
                if (data.calendarEvents) window.setCached('calendarEvents', data.calendarEvents);
                if (data.weeklySchedule) window.setCached('weeklySchedule', data.weeklySchedule);
                if (data.timeSlots) window.setCached('timeSlots', data.timeSlots);
            });
            if (callback) callback(true, user);
        } else {
            currentUser = null;
            if (callback) callback(false, null);
        }
    });
}

window.firebaseAPI = { getCurrentUser, logout, initAuth, saveToFirestore, loadUserData };
