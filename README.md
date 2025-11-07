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

### 4. Configure the Application

You need to configure the GitHub token and repository information. The recommended approach is using GitHub Actions with repository secrets (most secure).

#### Option A: Using GitHub Actions with Secrets (Recommended - Most Secure)

This approach uses GitHub Actions to automatically generate `config.js` from repository secrets during deployment. Your secrets never appear in the repository.

1. **Set up GitHub Secrets:**
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret" and add the following secrets:
     - `GH_PAT`: Your GitHub Personal Access Token (with `repo` scope)
     - `REPO_OWNER`: Your GitHub username (e.g., `mkeeves`)
     - `REPO_NAME`: Your repository name (e.g., `url-shortener`)
     - `TURNSTILE_SITE_KEY`: Your Cloudflare Turnstile site key (optional - leave empty if not using)

2. **Configure GitHub Pages:**
   - Go to Settings → Pages
   - Under "Source", select "GitHub Actions" (not "Deploy from a branch")
   - The workflow will automatically deploy on every push to `main`

3. **Deploy:**
   - Push any change to trigger the workflow
   - The workflow will create `config.js` automatically from your secrets
   - Your site will be deployed with the configuration included

**Note:** The `config.js` file is generated during deployment and won't appear in your repository. It's only included in the GitHub Pages deployment.

#### Option B: Using config.js File (For Local Development)

1. Copy `config.example.js` to `config.js`:
```bash
cp config.example.js config.js
```

2. Edit `config.js` and fill in your values
3. **Important**: `config.js` is in `.gitignore` - never commit it to the repository

#### Option C: Using localStorage (For Quick Testing)

1. Open browser console on your deployed site
2. Run:
```javascript
localStorage.setItem('github_token', 'your_token_here');
```

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

1. **GitHub Token**: Keep your token secure. Never commit it to the repository.
2. **Cloudflare Turnstile**: Helps prevent abuse and automated URL creation
3. **Input Validation**: URLs are validated before creation
4. **HTTPS**: GitHub Pages provides SSL certificates automatically

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

