/**
 * Redirect Handler
 * Handles short URL redirects and click tracking
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Get short code from URL path
    // When GitHub Pages serves 404.html, the pathname is still the original path
    const path = window.location.pathname;
    const shortCode = path.replace(/^\//, '').split('/')[0].split('?')[0]; // Remove leading slash, get first segment, remove query params
    
    // List of special pages/files that should not be treated as short codes
    const specialPages = ['', 'index.html', 'analytics.html', 'redirect.html', '404.html', 'css', 'js', 'favicon.ico'];
    
    if (!shortCode || specialPages.includes(shortCode.toLowerCase())) {
        // Invalid or special page, redirect to home
        window.location.href = '/';
        return;
    }

    try {
        // Get URLs from GitHub
        const urls = await githubAPI.getUrls();
        
        if (urls[shortCode]) {
            const urlData = urls[shortCode];
            const longUrl = urlData.url;
            
            // Increment click count (fire and forget - don't wait)
            githubAPI.incrementClickCount(shortCode).catch(error => {
                console.error('Failed to update click count:', error);
                // Don't block redirect if analytics fail
            });
            
            // Redirect immediately
            window.location.replace(longUrl);
        } else {
            // Short code not found
            showError(`Short URL not found: ${shortCode}`);
        }
    } catch (error) {
        console.error('Error redirecting:', error);
        showError('Error loading URL. Please try again later.');
    }
});

function showError(message) {
    const errorDiv = document.getElementById('redirectError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    // Redirect to home after 3 seconds
    setTimeout(() => {
        window.location.href = '/';
    }, 3000);
}

