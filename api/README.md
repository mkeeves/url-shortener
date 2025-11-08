# Secure API Proxy

This API acts as a secure proxy between the frontend and GitHub's API, keeping the GitHub token server-side and never exposing it to the browser.

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Set environment variables in Vercel dashboard:
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
   - `REPO_OWNER`: Your GitHub username
   - `REPO_NAME`: Your repository name

The API will be available at: `https://your-project.vercel.app/api/urls`

### Option 2: Netlify Functions

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

### Option 3: Cloudflare Workers

1. Install Wrangler: `npm i -g wrangler`
2. Create `wrangler.toml`:
```toml
name = "url-shortener-api"
main = "api/urls.js"
compatibility_date = "2024-01-01"
```

3. Set secrets: `wrangler secret put GITHUB_TOKEN`
4. Deploy: `wrangler publish`

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

