/**
 * GitHub API Integration
 * Handles reading and writing to the urls.json file via GitHub Contents API
 */

class GitHubAPI {
    constructor() {
        // Get GitHub token from environment or config
        // In production, this should be set via GitHub Pages environment variables
        // or loaded from a secure configuration
        this.token = this.getGitHubToken();
        this.repoOwner = this.getRepoOwner();
        this.repoName = this.getRepoName();
        this.apiBase = 'https://api.github.com';
    }

    getGitHubToken() {
        // Try to get token from various sources
        // 1. From window config (set via script tag in HTML)
        if (window.GITHUB_TOKEN) {
            return window.GITHUB_TOKEN;
        }
        
        // 2. From localStorage (for development/testing)
        const storedToken = localStorage.getItem('github_token');
        if (storedToken) {
            return storedToken;
        }

        // 3. Prompt user if not found (for initial setup)
        return null;
    }

    getRepoOwner() {
        // Extract from current URL or config
        // Default: try to detect from GitHub Pages URL structure
        if (window.REPO_OWNER) {
            return window.REPO_OWNER;
        }
        
        // Try to extract from GitHub Pages URL
        const hostname = window.location.hostname;
        if (hostname.includes('github.io')) {
            const parts = hostname.split('.');
            if (parts.length >= 3) {
                return parts[0];
            }
        }
        
        // Fallback: try to extract from custom domain by checking common patterns
        // For custom domains, user must set REPO_OWNER in config
        return null;
    }

    getRepoName() {
        // Extract from current URL or config
        if (window.REPO_NAME) {
            return window.REPO_NAME;
        }
        
        // Try to extract from GitHub Pages URL structure
        const hostname = window.location.hostname;
        if (hostname.includes('github.io')) {
            const parts = hostname.split('.');
            if (parts.length >= 3) {
                // Format: username.github.io means repo name is usually the same as username
                // But we can't reliably detect it, so return default
                return 'url-shortener';
            }
        }
        
        // Fallback: use default repository name
        // User should set REPO_NAME in config for custom domains
        return 'url-shortener';
    }

    async getFileContent(path) {
        if (!this.token) {
            throw new Error('GitHub token not configured. Please set GITHUB_TOKEN.');
        }

        if (!this.repoOwner || !this.repoName) {
            throw new Error('Repository information not configured. Please set REPO_OWNER and REPO_NAME.');
        }

        const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/contents/${path}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'URL-Shortener'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // File doesn't exist yet, return empty object
                    return {};
                }
                
                if (response.status === 403) {
                    const rateLimitInfo = await this.checkRateLimit();
                    throw new Error(`GitHub API rate limit exceeded. ${rateLimitInfo}`);
                }
                
                const errorData = await response.json();
                throw new Error(errorData.message || `GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Decode base64 content
            if (data.content) {
                const content = atob(data.content.replace(/\s/g, ''));
                return {
                    content: JSON.parse(content),
                    sha: data.sha
                };
            }
            
            return { content: {}, sha: null };
        } catch (error) {
            console.error('Error fetching file from GitHub:', error);
            throw error;
        }
    }

    async updateFile(path, content, sha, message = 'Update URLs') {
        if (!this.token) {
            throw new Error('GitHub token not configured. Please set GITHUB_TOKEN.');
        }

        if (!this.repoOwner || !this.repoName) {
            throw new Error('Repository information not configured. Please set REPO_OWNER and REPO_NAME.');
        }

        const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/contents/${path}`;
        
        // Encode content to base64
        const encodedContent = btoa(JSON.stringify(content, null, 2));

        const body = {
            message: message,
            content: encodedContent,
            branch: 'main' // or 'master' depending on your default branch
        };

        // Include sha if updating existing file
        if (sha) {
            body.sha = sha;
        }

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'URL-Shortener'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                if (response.status === 403) {
                    const rateLimitInfo = await this.checkRateLimit();
                    throw new Error(`GitHub API rate limit exceeded. ${rateLimitInfo}`);
                }
                
                const errorData = await response.json();
                throw new Error(errorData.message || `GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating file on GitHub:', error);
            throw error;
        }
    }

    async checkRateLimit() {
        try {
            const response = await fetch(`${this.apiBase}/rate_limit`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const core = data.resources.core;
                const remaining = core.remaining;
                const resetTime = new Date(core.reset * 1000);
                
                return `Remaining: ${remaining}/${core.limit}. Resets at: ${resetTime.toLocaleString()}`;
            }
        } catch (error) {
            console.error('Error checking rate limit:', error);
        }
        
        return 'Unable to check rate limit status';
    }

    async getUrls() {
        try {
            const result = await this.getFileContent('urls.json');
            return result.content || {};
        } catch (error) {
            console.error('Error getting URLs:', error);
            // Return empty object if file doesn't exist
            if (error.message.includes('404')) {
                return {};
            }
            throw error;
        }
    }

    async saveUrls(urls, sha) {
        try {
            const result = await this.updateFile('urls.json', urls, sha, 'Update URL mappings');
            return result;
        } catch (error) {
            console.error('Error saving URLs:', error);
            throw error;
        }
    }

    async incrementClickCount(shortCode) {
        try {
            // Get current file content and SHA
            const fileData = await this.getFileContent('urls.json');
            const urls = fileData.content || {};
            const sha = fileData.sha;

            // Update click count
            if (urls[shortCode]) {
                urls[shortCode].clicks = (urls[shortCode].clicks || 0) + 1;
                urls[shortCode].lastClicked = new Date().toISOString();
                
                // Save updated URLs
                await this.saveUrls(urls, sha);
                return urls[shortCode].clicks;
            }
            
            return null;
        } catch (error) {
            console.error('Error incrementing click count:', error);
            // Don't throw - we don't want to block redirects if analytics fail
            return null;
        }
    }
}

// Create global instance
const githubAPI = new GitHubAPI();

