// API Configuration with override support for white-label deployments
const PRODUCTION_API = 'https://graphicat.site/api';

const API_SERVERS = {
    production: PRODUCTION_API,
    local: 'http://localhost:3001/api'
};

/**
 * Get API base URL with override support
 * Priority: localStorage override > environment variable > production fallback
 * Explicitly blocks and ignores any dead/legacy 'dashdev' references.
 */
export function getApiBaseUrl() {
    // 1. Check localStorage override (only if valid and not pointing to dead dashdev / netlify)
    try {
        const override = localStorage.getItem('api_server_override');
        if (override && API_SERVERS[override]) {
            return API_SERVERS[override];
        }
        if (override && (override.includes('dashdev') || override.includes('netlify') || override.includes('localhost'))) {
            localStorage.removeItem('api_server_override');
        }
    } catch (_) {}

    // 2. Use environment variable ONLY if it is set and DOES NOT point to dead dashdev / netlify
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && typeof envUrl === 'string' && !envUrl.includes('dashdev') && !envUrl.includes('netlify.app')) {
        let clean = envUrl.trim();
        if (clean.endsWith('/')) clean = clean.slice(0, -1);
        return clean;
    }

    // 3. Guaranteed Production API on graphicat.site (connected directly to Neon PostgreSQL)
    return PRODUCTION_API;
}

/**
 * Helper to switch API server (for development/testing)
 * @param {string} serverKey - 'production' or 'local'
 */
export function setApiServer(serverKey) {
    if (API_SERVERS[serverKey]) {
        localStorage.setItem('api_server_override', serverKey);
        console.log(`✅ API server switched to: ${serverKey}`);
        console.log('⚠️ Reload page to apply changes');
        return true;
    }
    console.error(`❌ Invalid server key: ${serverKey}`);
    return false;
}

/**
 * Helper to clear override
 */
export function clearApiOverride() {
    localStorage.removeItem('api_server_override');
    console.log('✅ API override cleared');
}

// Development helper - expose to window for console access
if (import.meta.env.DEV) {
    window.apiConfig = {
        switch: setApiServer,
        clear: clearApiOverride,
        current: getApiBaseUrl,
        available: Object.keys(API_SERVERS)
    };
}
