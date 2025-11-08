# Secure API Proxy

This API acts as a secure proxy between the frontend and GitHub's API, keeping the GitHub token server-side and never exposing it to the browser.

## Deployment Options

### Option 1: Cloudflare Workers (Recommended)

1. Install Wrangler CLI: `npm i -g wrangler`
2. Login to Cloudflare: `wrangler login`
3. Set secrets:
   ```bash
   wrangler secret put GITHUB_TOKEN
   wrangler secret put REPO_OWNER
   wrangler secret put REPO_NAME
   ```
4. Deploy: `wrangler deploy`

The API will be available at: `https://url-shortener-api.your-subdomain.workers.dev`

**Note:** Use `api/urls-worker.js` for Cloudflare Workers (already configured in `wrangler.toml`).

### Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Set environment variables in Vercel dashboard:
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
   - `REPO_OWNER`: Your GitHub username
   - `REPO_NAME`: Your repository name

The API will be available at: `https://your-project.vercel.app/api/urls`

**Note:** Use `api/urls.js` for Vercel (configured in `vercel.json`).

### Option 3: Netlify Functions

1. Create `netlify.toml`:
```toml
[build]
  functions = "api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

2. Move `api/urls.js` to `netlify/functions/urls.js`
3. Set environment variables in Netlify dashboard
4. Deploy to Netlify

## API Endpoints

### GET /api/urls
Returns all URLs and the file SHA.

**Response:**
```json
{
  "urls": {
    "abc123": {
      "url": "https://example.com",
      "created": "2024-01-01T00:00:00Z",
      "clicks": 0
    }
  },
  "sha": "abc123..."
}
```

### POST /api/urls
Creates a new short URL.

**Request:**
```json
{
  "longUrl": "https://example.com",
  "shortCode": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "shortCode": "abc123",
  "shortUrl": "https://yoursite.com/abc123"
}
```

### PUT /api/urls?code=abc123
Increments the click count for a short code.

**Response:**
```json
{
  "success": true,
  "clicks": 1
}
```

## Security

- GitHub token is stored server-side only
- Never exposed to the browser
- CORS enabled for your domain
- Input validation on all endpoints

