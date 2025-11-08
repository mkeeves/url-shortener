/**
 * Main Application Logic
 * Handles URL shortening form submission and UI interactions
 */

let turnstileWidgetId = null;
let turnstileInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('urlForm');
    const submitBtn = document.getElementById('submitBtn');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const shortUrlDisplay = document.getElementById('shortUrlDisplay');
    const copyBtn = document.getElementById('copyBtn');

    // Initialize Cloudflare Turnstile if site key is available
    const turnstileSiteKey = window.TURNSTILE_SITE_KEY || '';
    const turnstileContainer = document.getElementById('turnstile-widget');
    
    if (!turnstileSiteKey) {
        // Hide Turnstile widget if not configured
        if (turnstileContainer) {
            turnstileContainer.style.display = 'none';
        }
    } else {
        // Wait for Turnstile script to load, then initialize (only once)
        function initTurnstile() {
            // Prevent multiple initializations
            if (turnstileInitialized) {
                return;
            }
            
            if (window.turnstile && turnstileContainer && !turnstileContainer.hasChildNodes()) {
                try {
                    turnstileWidgetId = window.turnstile.render(turnstileContainer, {
                        sitekey: turnstileSiteKey,
                        callback: function(token) {
                            // Token received, form can be submitted
                            console.log('Turnstile token received');
                        },
                        'error-callback': function() {
                            console.error('Turnstile error occurred');
                        }
                    });
                    turnstileInitialized = true;
                } catch (error) {
                    console.error('Error initializing Turnstile:', error);
                }
            } else if (!window.turnstile) {
                // Retry after a short delay if script hasn't loaded yet
                setTimeout(initTurnstile, 100);
            }
        }
        
        // Start initialization - only use one method to avoid duplicates
        if (window.turnstile) {
            initTurnstile();
        } else {
            // Wait for script to load
            const checkTurnstile = setInterval(() => {
                if (window.turnstile) {
                    clearInterval(checkTurnstile);
                    initTurnstile();
                }
            }, 100);
            
            // Stop checking after 10 seconds
            setTimeout(() => {
                clearInterval(checkTurnstile);
                if (!turnstileInitialized) {
                    console.warn('Turnstile script failed to load');
                }
            }, 10000);
        }
    }

    // Check if API base URL is configured
    if (!window.API_BASE_URL && !apiClient.apiBase.startsWith('/')) {
        console.warn('API_BASE_URL not configured. Using relative path:', apiClient.apiBase);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const longUrl = document.getElementById('longUrl').value.trim();
        
        // Validate URL
        if (!isValidUrl(longUrl)) {
            showError('Please enter a valid URL (must start with http:// or https://)');
            return;
        }

        // Check Turnstile token if configured
        const turnstileSiteKey = window.TURNSTILE_SITE_KEY || '';
        if (turnstileSiteKey && window.turnstile && turnstileWidgetId !== null) {
            try {
                // Get the token from Turnstile widget
                const token = window.turnstile.getResponse(turnstileWidgetId);
                if (!token) {
                    showError('Please complete the verification challenge.');
                    return;
                }
            } catch (error) {
                console.error('Error checking Turnstile token:', error);
                // Continue anyway if Turnstile check fails
            }
        }

        // Proceed with URL creation
        await createShortUrl(longUrl);
        
        // Reset Turnstile widget after successful submission
        if (turnstileWidgetId !== null && window.turnstile) {
            window.turnstile.reset(turnstileWidgetId);
        }
    });

    // Copy button handler
    copyBtn.addEventListener('click', () => {
        shortUrlDisplay.select();
        document.execCommand('copy');
        
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '';
        }, 2000);
    });

    async function createShortUrl(longUrl) {
        // Show loading state
        setLoading(true);
        hideError();
        hideResult();

        try {
            console.log('Starting URL creation process...');
            
            // Get existing URLs to check for collisions
            console.log('Fetching existing URLs...');
            const urls = await apiClient.getUrls();
            console.log('Existing URLs fetched:', Object.keys(urls).length);
            
            // Generate unique short code
            const shortCode = generateShortCode(urls);
            console.log('Generated short code:', shortCode);
            
            // Create URL via secure API
            console.log('Creating URL via API...');
            const result = await apiClient.createUrl(longUrl, shortCode);
            console.log('URL created successfully:', result);
            
            // Show success
            const shortUrl = result.shortUrl || `${window.location.origin}/${shortCode}`;
            console.log('Short URL created:', shortUrl);
            showResult(shortUrl);
            
            // Reset form
            form.reset();
            
            // Reset Turnstile widget after successful submission
            if (turnstileWidgetId !== null && window.turnstile) {
                try {
                    window.turnstile.reset(turnstileWidgetId);
                } catch (error) {
                    console.error('Error resetting Turnstile:', error);
                }
            }
            
        } catch (error) {
            console.error('Error creating short URL:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            showError(error.message || 'Failed to create short URL. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function generateShortCode(existingUrls) {
        const length = 6;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            let code = '';
            for (let i = 0; i < length; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            if (!existingUrls[code]) {
                return code;
            }
            
            attempts++;
        }
        
        // If we've tried many times, increase length
        return generateLongerCode(existingUrls);
    }

    function generateLongerCode(existingUrls) {
        const length = 8;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Add timestamp to ensure uniqueness if still collision
        if (existingUrls[code]) {
            code += Date.now().toString(36).slice(-4);
        }
        
        return code;
    }

    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    function setLoading(loading) {
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-text').style.display = 'none';
            submitBtn.querySelector('.btn-loader').style.display = 'inline';
        } else {
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').style.display = 'inline';
            submitBtn.querySelector('.btn-loader').style.display = 'none';
        }
    }

    function showResult(shortUrl) {
        shortUrlDisplay.value = shortUrl;
        resultDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideResult() {
        resultDiv.style.display = 'none';
    }

    function showError(message) {
        errorDiv.querySelector('.error-message').textContent = message;
        errorDiv.style.display = 'block';
        resultDiv.style.display = 'none';
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }
});

function generateShortCode(existingUrls) {
    const length = 6;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        if (!existingUrls[code]) {
            return code;
        }
        
        attempts++;
    }
    
    // If we've tried many times, increase length
    return generateLongerCode(existingUrls);
}

function generateLongerCode(existingUrls) {
    const length = 8;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Add timestamp to ensure uniqueness if still collision
    if (existingUrls[code]) {
        code += Date.now().toString(36).slice(-4);
    }
    
    return code;
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

