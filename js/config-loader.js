/**
 * Configuration Loader
 * Dynamically loads config.js synchronously with error handling
 */

(function() {
    // Try to load config.js synchronously
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'config.js', false); // false = synchronous
        xhr.send(null);
        
        if (xhr.status === 200) {
            // Execute the config script content
            const script = document.createElement('script');
            script.textContent = xhr.responseText;
            document.head.appendChild(script);
        } else {
            console.warn('config.js not found (status: ' + xhr.status + '). Using defaults or localStorage.');
        }
    } catch (error) {
        console.warn('config.js not found. Using defaults or localStorage. Error:', error.message);
        // Continue execution - config values will be null/undefined
    }
})();

