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
                // Try to parse as JSON, but handle HTML error pages
                let errorMessage = `API error: ${response.status}`;
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const error = await response.json();
                        errorMessage = error.error || errorMessage;
                    } else {
                        // Response is not JSON (likely HTML error page)
                        const text = await response.text();
                        console.error('Non-JSON error response:', text.substring(0, 200));
                        errorMessage = `API error: ${response.status} ${response.statusText}`;
                    }
                } catch (parseError) {
                    // If parsing fails, use the status
                    errorMessage = `API error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
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
                // Try to parse as JSON, but handle HTML error pages
                let errorMessage = `API error: ${response.status}`;
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const error = await response.json();
                        errorMessage = error.error || errorMessage;
                    } else {
                        // Response is not JSON (likely HTML error page)
                        const text = await response.text();
                        console.error('Non-JSON error response:', text.substring(0, 200));
                        errorMessage = `API error: ${response.status} ${response.statusText}`;
                    }
                } catch (parseError) {
                    // If parsing fails, use the status
                    errorMessage = `API error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
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

