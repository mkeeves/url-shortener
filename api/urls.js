/**
 * Secure API Proxy for GitHub Operations
 * This runs server-side and keeps the GitHub token secure
 * 
 * Deploy this as a serverless function on:
 * - Vercel (recommended): https://vercel.com
 * - Netlify Functions
 * - Cloudflare Workers
 * - Or any Node.js serverless platform
 */

// Environment variables (set these in your serverless platform):
// - GITHUB_TOKEN: Your GitHub Personal Access Token
// - REPO_OWNER: Your GitHub username
// - REPO_NAME: Your repository name

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const API_BASE = 'https://api.github.com';

// CORS headers for browser requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

async function getFileContent(path) {
    const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
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
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return {
            content: JSON.parse(content),
            sha: data.sha
        };
    }
    
    return { content: {}, sha: null };
}

async function updateFile(path, content, sha, message = 'Update URLs') {
    const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    
    const encodedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

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
            'Authorization': `token ${GITHUB_TOKEN}`,
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

// Main handler function (Vercel/Netlify compatible)
export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).json({});
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Verify environment variables
    if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
        return res.status(500).json({ 
            error: 'Server configuration error: Missing environment variables' 
        });
    }

    try {
        const method = req.method;
        const code = req.query?.code;

        if (method === 'GET') {
            // Get all URLs
            const fileData = await getFileContent('urls.json');
            return res.status(200).json({
                urls: fileData.content || {},
                sha: fileData.sha
            });
        }

        if (method === 'POST') {
            // Create new URL
            const { longUrl, shortCode } = req.body;
            
            if (!longUrl || !shortCode) {
                return res.status(400).json({ error: 'Missing required fields: longUrl, shortCode' });
            }

            const fileData = await getFileContent('urls.json');
            const urls = fileData.content || {};
            const sha = fileData.sha;

            // Check if short code already exists
            if (urls[shortCode]) {
                return res.status(409).json({ error: 'Short code already exists' });
            }

            // Add new URL
            urls[shortCode] = {
                url: longUrl,
                created: new Date().toISOString(),
                clicks: 0
            };

            await updateFile('urls.json', urls, sha, `Add short URL: ${shortCode}`);
            
            return res.status(200).json({ 
                success: true,
                shortCode,
                shortUrl: `${req.headers.origin || ''}/${shortCode}`
            });
        }

        if (method === 'PUT' && code) {
            // Increment click count
            const fileData = await getFileContent('urls.json');
            const urls = fileData.content || {};
            const sha = fileData.sha;

            if (!urls[code]) {
                return res.status(404).json({ error: 'Short code not found' });
            }

            urls[code].clicks = (urls[code].clicks || 0) + 1;
            urls[code].lastClicked = new Date().toISOString();

            await updateFile('urls.json', urls, sha, `Update click count for ${code}`);
            
            return res.status(200).json({ 
                success: true,
                clicks: urls[code].clicks
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: error.message || 'Internal server error' 
        });
    }
}

