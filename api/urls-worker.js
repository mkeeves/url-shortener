/**
 * Cloudflare Workers API Proxy for GitHub Operations
 * This runs server-side and keeps the GitHub token secure
 * 
 * Deploy with: wrangler deploy
 */

// Environment variables (set these as secrets in Cloudflare):
// - GITHUB_TOKEN: Your GitHub Personal Access Token
// - REPO_OWNER: Your GitHub username
// - REPO_NAME: Your repository name

const API_BASE = 'https://api.github.com';

// CORS headers for browser requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

async function getFileContent(path, env) {
    const url = `${API_BASE}/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${path}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'URL-Shortener-API'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            return { content: {}, sha: null };
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.content) {
        // Cloudflare Workers can decode base64 directly
        // GitHub API returns base64 with potential whitespace/newlines
        const base64Content = data.content.replace(/\s/g, '');
        const content = atob(base64Content);
        return {
            content: JSON.parse(content),
            sha: data.sha
        };
    }
    
    return { content: {}, sha: null };
}

async function updateFile(path, content, sha, message, env) {
    const url = `${API_BASE}/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${path}`;
    
    // Cloudflare Workers can encode base64 directly
    const encodedContent = btoa(JSON.stringify(content, null, 2));

    const body = {
        message: message,
        content: encodedContent,
        branch: 'main'
    };

    if (sha) {
        body.sha = sha;
    }

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'URL-Shortener-API'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `GitHub API error: ${response.status}`);
    }

    return await response.json();
}

// Cloudflare Workers handler
export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: corsHeaders
            });
        }

        // Verify environment variables
        if (!env.GITHUB_TOKEN || !env.REPO_OWNER || !env.REPO_NAME) {
            return new Response(JSON.stringify({ 
                error: 'Server configuration error: Missing environment variables' 
            }), {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }

        try {
            const url = new URL(request.url);
            const method = request.method;
            const code = url.searchParams.get('code');

            if (method === 'GET') {
                // Get all URLs
                const fileData = await getFileContent('urls.json', env);
                return new Response(JSON.stringify({
                    urls: fileData.content || {},
                    sha: fileData.sha
                }), {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                });
            }

            if (method === 'POST') {
                // Create new URL
                const body = await request.json();
                const { longUrl, shortCode } = body;
                
                if (!longUrl || !shortCode) {
                    return new Response(JSON.stringify({ 
                        error: 'Missing required fields: longUrl, shortCode' 
                    }), {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                }

                const fileData = await getFileContent('urls.json', env);
                const urls = fileData.content || {};
                const sha = fileData.sha;

                // Check if short code already exists
                if (urls[shortCode]) {
                    return new Response(JSON.stringify({ 
                        error: 'Short code already exists' 
                    }), {
                        status: 409,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                }

                // Add new URL
                urls[shortCode] = {
                    url: longUrl,
                    created: new Date().toISOString(),
                    clicks: 0
                };

                await updateFile('urls.json', urls, sha, `Add short URL: ${shortCode}`, env);
                
                const origin = request.headers.get('origin') || url.origin;
                return new Response(JSON.stringify({ 
                    success: true,
                    shortCode,
                    shortUrl: `${origin}/${shortCode}`
                }), {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                });
            }

            if (method === 'PUT' && code) {
                // Increment click count
                const fileData = await getFileContent('urls.json', env);
                const urls = fileData.content || {};
                const sha = fileData.sha;

                if (!urls[code]) {
                    return new Response(JSON.stringify({ 
                        error: 'Short code not found' 
                    }), {
                        status: 404,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                }

                urls[code].clicks = (urls[code].clicks || 0) + 1;
                urls[code].lastClicked = new Date().toISOString();

                await updateFile('urls.json', urls, sha, `Update click count for ${code}`, env);
                
                return new Response(JSON.stringify({ 
                    success: true,
                    clicks: urls[code].clicks
                }), {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                });
            }

            return new Response(JSON.stringify({ 
                error: 'Method not allowed' 
            }), {
                status: 405,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });

        } catch (error) {
            console.error('API Error:', error);
            return new Response(JSON.stringify({ 
                error: error.message || 'Internal server error' 
            }), {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }
    }
};

