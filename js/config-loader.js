/**
 * Configuration Loader
 * Dynamically loads config.js with error handling
 */

(function() {
    const script = document.createElement('script');
    script.src = 'config.js';
    script.onerror = function() {
        console.warn('config.js not found. Using defaults or localStorage. Create config.js from config.example.js for production use.');
        // Continue execution - config values will be null/undefined
    };
    document.head.appendChild(script);
})();

