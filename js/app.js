/**
 * Main Application Logic
 * Handles URL shortening form submission and UI interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('urlForm');
    const submitBtn = document.getElementById('submitBtn');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const shortUrlDisplay = document.getElementById('shortUrlDisplay');
    const copyBtn = document.getElementById('copyBtn');

    // Set reCAPTCHA site key from config if available
    const recaptchaSiteKey = window.RECAPTCHA_SITE_KEY || '';
    const recaptchaDiv = document.querySelector('.g-recaptcha');
    if (recaptchaDiv && recaptchaSiteKey) {
        recaptchaDiv.setAttribute('data-sitekey', recaptchaSiteKey);
    }

    // Check if GitHub token is configured
    if (!githubAPI.token) {
        showError('GitHub token not configured. Please create config.js from config.example.js and set GITHUB_TOKEN.');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const longUrl = document.getElementById('longUrl').value.trim();
        
        // Validate URL
        if (!isValidUrl(longUrl)) {
            showError('Please enter a valid URL (must start with http:// or https://)');
            return;
        }

        // Trigger reCAPTCHA
        if (window.grecaptcha) {
            try {
                const recaptchaSiteKey = getRecaptchaSiteKey();
                if (recaptchaSiteKey) {
                    window.grecaptcha.execute(recaptchaSiteKey, { action: 'submit' });
                } else {
                    // If reCAPTCHA not configured, proceed without it
                    await createShortUrl(longUrl);
                }
            } catch (error) {
                console.error('reCAPTCHA error:', error);
                // Proceed without reCAPTCHA if it fails
                await createShortUrl(longUrl);
            }
        } else {
            // reCAPTCHA not loaded, proceed without it
            await createShortUrl(longUrl);
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
            // Get existing URLs
            const urls = await githubAPI.getUrls();
            
            // Generate unique short code
            const shortCode = generateShortCode(urls);
            
            // Create new URL entry
            const newUrl = {
                url: longUrl,
                created: new Date().toISOString(),
                clicks: 0
            };
            
            urls[shortCode] = newUrl;
            
            // Get file SHA for update
            let sha = null;
            try {
                const fileData = await githubAPI.getFileContent('urls.json');
                sha = fileData.sha;
            } catch (error) {
                // File doesn't exist yet, that's okay
                console.log('File does not exist yet, will create new file');
            }
            
            // Save to GitHub
            await githubAPI.saveUrls(urls, sha);
            
            // Show success
            const shortUrl = `${window.location.origin}/${shortCode}`;
            showResult(shortUrl);
            
            // Reset form
            form.reset();
            
        } catch (error) {
            console.error('Error creating short URL:', error);
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

    function getRecaptchaSiteKey() {
        // Try to get from window config
        if (window.RECAPTCHA_SITE_KEY) {
            return window.RECAPTCHA_SITE_KEY;
        }
        
        // Try to get from data attribute
        const recaptchaDiv = document.querySelector('.g-recaptcha');
        if (recaptchaDiv) {
            return recaptchaDiv.getAttribute('data-sitekey');
        }
        
        return null;
    }
});

// reCAPTCHA callback
function onRecaptchaSuccess(token) {
    // This will be called after reCAPTCHA validation
    // The form submission will continue in the submit handler
    const form = document.getElementById('urlForm');
    const longUrl = document.getElementById('longUrl').value.trim();
    
    if (longUrl && isValidUrl(longUrl)) {
        createShortUrlAfterRecaptcha(longUrl);
    }
}

async function createShortUrlAfterRecaptcha(longUrl) {
    const submitBtn = document.getElementById('submitBtn');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const shortUrlDisplay = document.getElementById('shortUrlDisplay');

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loader').style.display = 'inline';
    errorDiv.style.display = 'none';
    resultDiv.style.display = 'none';

    try {
        // Get existing URLs
        const urls = await githubAPI.getUrls();
        
        // Generate unique short code
        const shortCode = generateShortCode(urls);
        
        // Create new URL entry
        const newUrl = {
            url: longUrl,
            created: new Date().toISOString(),
            clicks: 0
        };
        
        urls[shortCode] = newUrl;
        
        // Get file SHA for update
        let sha = null;
        try {
            const fileData = await githubAPI.getFileContent('urls.json');
            sha = fileData.sha;
        } catch (error) {
            // File doesn't exist yet, that's okay
            console.log('File does not exist yet, will create new file');
        }
        
        // Save to GitHub
        await githubAPI.saveUrls(urls, sha);
        
        // Show success
        const shortUrl = `${window.location.origin}/${shortCode}`;
        shortUrlDisplay.value = shortUrl;
        resultDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Reset form
        document.getElementById('urlForm').reset();
        
    } catch (error) {
        console.error('Error creating short URL:', error);
        errorDiv.querySelector('.error-message').textContent = error.message || 'Failed to create short URL. Please try again.';
        errorDiv.style.display = 'block';
        resultDiv.style.display = 'none';
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').style.display = 'inline';
        submitBtn.querySelector('.btn-loader').style.display = 'none';
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

