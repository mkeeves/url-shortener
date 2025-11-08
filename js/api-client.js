/**
 * Secure API Client
 * Makes requests to the backend API proxy instead of GitHub directly
 * No tokens are exposed to the browser
 */

class APIClient {
    constructor() {
        // API endpoint - set this to your serverless function URL
        // For Vercel: https://your-project.vercel.app/api/urls
        // For Netlify: https://your-site.netlify.app/api/urls
        // This should be set via environment variable or config
        this.apiBase = window.API_BASE_URL || '/api/urls';
    }

    async getUrls() {
        try {
            const response = await fetch(this.apiBase, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `API error: ${response.status}`);
            }

            const data = await response.json();
            return data.urls || {};
        } catch (error) {
            console.error('Error fetching URLs:', error);
            throw error;
        }
    }

    async createUrl(longUrl, shortCode) {
        try {
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    longUrl,
                    shortCode
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating URL:', error);
            throw error;
        }
    }

    async incrementClickCount(shortCode) {
        try {
            const response = await fetch(`${this.apiBase}?code=${shortCode}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Don't throw - analytics failures shouldn't block redirects
                console.error('Failed to increment click count');
                return null;
            }

            const data = await response.json();
            return data.clicks;
        } catch (error) {
            console.error('Error incrementing click count:', error);
            // Don't throw - analytics failures shouldn't block redirects
            return null;
        }
    }
}

// Create global instance
const apiClient = new APIClient();

