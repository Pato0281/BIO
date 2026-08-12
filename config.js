// =======================================
// CONFIGURACIÓN GENERAL DE BIO IA
// =======================================

// ---------- Firebase ----------
export const firebaseConfig = {
    apiKey: "AIzaSyC6ZZTc1cvEu5sT8yLtC4mKIwMDbPT0L-4",
    authDomain: "bio-control-cdc2e.firebaseapp.com",
    projectId: "bio-control-cdc2e",
    storageBucket: "bio-control-cdc2e.firebasestorage.app",
    messagingSenderId: "751277149960",
    appId: "1:751277149960:web:dda2d68b510b85acb9a6bd"
};

// ---------- Netlify ----------
export const NETLIFY_FUNCTION_URL =
    "/.netlify/functions/analizarEtiqueta";
export const IA_CONFIG = {
    API_URL: NETLIFY_FUNCTION_URL,
    ENGINE_VERSION: "BIO-IA-V3",
    PROVIDER: "Gemini",
    temperatura: 0.2,
    maxTokens: 2048
};

// ---------- Tiempo máximo de espera ----------
export const REQUEST_TIMEOUT = 30000;

// ---------- Configuración de IA ----------
export const IA_CONFIG = {
    temperatura: 0.2,
    maxTokens: 2048
};