# URL Shortener for GitHub Pages

A secure, production-ready URL shortener application hosted on GitHub Pages. URLs are stored in a GitHub repository JSON file and accessed via GitHub API.

## Features

- ✅ Create short URLs via web form
- ✅ Immediate redirects to long URLs
- ✅ Analytics dashboard with click tracking
- ✅ Cloudflare Turnstile integration for user validation
- ✅ Modern, responsive UI
- ✅ Secure GitHub API integration
- ✅ Custom domain support

## Setup Instructions

### 1. Repository Configuration

1. Push this repository to GitHub
2. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Select source branch (usually `main` or `master`)
   - Select `/ (root)` as the folder
   - Save

### 2. Custom Domain Setup

1. Create a `CNAME` file (already included) with your domain: `tinyurl.mkeeves.com`
2. Configure DNS:
   - Add a CNAME record: `tinyurl.mkeeves.com` → `yourusername.github.io`
   - Wait for DNS propagation (can take up to 24 hours)

### 3. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with the following scopes:
   - `repo` (Full control of private repositories)
3. Copy the token (you won't be able to see it again)

### 4. Deploy Secure API Backend (REQUIRED)

**IMPORTANT:** The GitHub token is now stored server-side only and never exposed to the browser. You must deploy a serverless API function.

#### Deploy to Vercel (Recommended - Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy the API:**
   ```bash
   cd /path/to/url-shortener
   vercel
   ```
   Follow the prompts to create a new project.

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Settings → Environment Variables
   - Add the following:
     - `GITHUB_TOKEN`: Your GitHub Personal Access Token (with `repo` scope)
     - `REPO_OWNER`: Your GitHub username (e.g., `mkeeves`)
     - `REPO_NAME`: Your repository name (e.g., `url-shortener`)

4. **Get your API URL:**
   - After deployment, Vercel will give you a URL like: `https://your-project.vercel.app`
   - Your API endpoint will be: `https://your-project.vercel.app/api/urls`

5. **Update GitHub Secrets:**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add `API_BASE_URL`: `https://your-project.vercel.app/api/urls`

#### Alternative: Deploy to Netlify

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

3. Deploy to Netlify and set environment variables in the dashboard

### 5. Configure Frontend

1. **Set up GitHub Secrets for Frontend:**
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Add:
     - `API_BASE_URL`: Your serverless function URL (e.g., `https://your-project.vercel.app/api/urls`)
     - `TURNSTILE_SITE_KEY`: Your Cloudflare Turnstile site key (optional)

2. **Configure GitHub Pages:**
   - Go to Settings → Pages
   - Under "Source", select "GitHub Actions" (not "Deploy from a branch")
   - The workflow will automatically deploy on every push to `main`

3. **Deploy:**
   - Push any change to trigger the workflow
   - The workflow will create `config.js` with only the API URL (no tokens!)
   - Your site will be deployed securely

### 5. Cloudflare Turnstile Setup (Optional but Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Turnstile (under Security → Turnstile)
3. Create a new site:
   - Site name: URL Shortener
   - Domain: `tinyurl.mkeeves.com` (and optionally `yourusername.github.io`)
   - Widget mode: Managed (or Invisible if preferred)
4. Copy the Site Key
5. Add it to your `config.js` file as `TURNSTILE_SITE_KEY`

The Turnstile widget will automatically appear on the form when configured. If not configured, the form will work without it.

## Usage

### Creating Short URLs

1. Visit your site at `tinyurl.mkeeves.com`
2. Enter a long URL in the form
3. Click "Shorten URL"
4. Copy and share your short URL

### Accessing Short URLs

Simply visit `tinyurl.mkeeves.com/abc123` and you'll be redirected automatically.

### Viewing Analytics

Visit `tinyurl.mkeeves.com/analytics.html` to see:
- Total URLs created
- Total clicks
- Most popular URLs
- Recent URLs

## Architecture

- **Frontend**: Static HTML/CSS/JavaScript
- **Storage**: `urls.json` file in the repository
- **API**: GitHub Contents API for read/write operations
- **Redirects**: Client-side JavaScript reads JSON and redirects

## Rate Limits

GitHub API rate limits:
- **Authenticated requests**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour

For low-volume production use, authenticated requests provide sufficient capacity.

## Security Considerations

1. **GitHub Token**: Stored server-side only in your serverless function. **Never exposed to the browser.**
2. **API Proxy**: All GitHub API calls go through a secure backend proxy
3. **Cloudflare Turnstile**: Helps prevent abuse and automated URL creation
4. **Input Validation**: URLs are validated before creation
5. **HTTPS**: GitHub Pages and serverless functions provide SSL certificates automatically
6. **CORS**: API includes proper CORS headers for secure cross-origin requests

## Troubleshooting

### "GitHub token not configured" error
- Ensure your token is set in `config.js` or localStorage
- Verify the token has `repo` permissions

### Redirects not working
- Check that `redirect.html` is accessible
- Verify the short code exists in `urls.json`
- Check browser console for errors

### Analytics not updating
- Click counts update asynchronously and may take a moment
- Refresh the analytics page to see latest data
- Check GitHub API rate limits if updates fail

### Custom domain not working
- Verify DNS CNAME record is correct
- Wait for DNS propagation (up to 24 hours)
- Check GitHub Pages settings show your custom domain

## File Structure

```
.
├── index.html          # Main landing page
├── 404.html            # Redirect handler (GitHub Pages serves this for unknown paths)
├── analytics.html      # Analytics dashboard
├── config.example.js   # Configuration template
├── urls.json          # URL data storage
├── CNAME              # Custom domain configuration
├── css/
│   └── styles.css     # Styling
├── js/
│   ├── app.js         # Main application logic
│   ├── github-api.js  # GitHub API integration
│   ├── redirect.js    # Redirect handler logic
│   ├── analytics.js   # Analytics dashboard logic
│   └── config-loader.js # Configuration loader with error handling
└── README.md          # This file
```

## License

MIT License - feel free to use this for your own projects.

## Support

For issues or questions, please open an issue on GitHub.

