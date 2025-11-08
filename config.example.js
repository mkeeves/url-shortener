/**
 * Configuration File
 * 
 * Copy this file to config.js and fill in your values.
 * 
 * IMPORTANT: This file now only contains the API endpoint URL.
 * All sensitive tokens are stored server-side in your serverless function.
 */

// API Base URL - Your serverless function endpoint
// For Vercel: https://your-project.vercel.app/api/urls
// For Netlify: https://your-site.netlify.app/api/urls
// Leave empty or use '/api/urls' for relative path (same domain)
window.API_BASE_URL = '/api/urls';

// Cloudflare Turnstile Site Key (optional but recommended)
// Get one from: https://dash.cloudflare.com/?to=/:account/turnstile
window.TURNSTILE_SITE_KEY = 'your_turnstile_site_key_here';

