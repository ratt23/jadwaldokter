// API Configuration with override support for white-label deployments
const API_SERVERS = {
    production: 'https://graphicat.site/api',
    local: 'http://localhost:3001/api',
    dashdev4: 'https://dashdev4.netlify.app/.netlify/functions/api',
    dashdev3: 'https://dashdev3.netlify.app/.netlify/functions/api'
};

/**
 * Get API base URL with override support
 * Priority: localStorage override > environment variable > production fallback
 */
export function getApiBaseUrl() {
    // Check localStorage override (for development/testing)
    const override = localStorage.getItem('api_server_override');
    if (override && API_SERVERS[override]) {
        console.log(`🔄 Using API override: ${override}`);
        return API_SERVERS[override];
    }

    // Use environment variable if specified
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
        let clean = envUrl.trim();
        if (clean.endsWith('/')) clean = clean.slice(0, -1);
        return clean;
    }

    // Default: Production API on graphicat.site (connected to Neon PostgreSQL)
    return API_SERVERS.production;
}

/**
 * Helper to switch API server (for development/testing)
 * @param {string} serverKey - 'production', 'local', 'dashdev4', 'dashdev3'
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
    console.log('💡 API Switcher available in console:');
    console.log('   - apiConfig.switch("production") - Switch to graphicat.site');
    console.log('   - apiConfig.switch("local") - Switch to localhost:3001');
    console.log('   - apiConfig.clear() - Clear override');
    console.log('   - apiConfig.current() - Show current API');
}
