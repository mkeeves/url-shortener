# URL Shortener for GitHub Pages

A secure, production-ready URL shortener application hosted on GitHub Pages. URLs are stored in a GitHub repository JSON file and accessed via GitHub API.

## Features

- ✅ Create short URLs via web form
- ✅ Immediate redirects to long URLs
- ✅ Analytics dashboard with click tracking
- ✅ reCAPTCHA v3 integration for user validation
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

You need to configure the GitHub token and repository information. There are several ways to do this:

#### Option A: Using config.js File (Recommended for Production)

1. Copy `config.example.js` to `config.js`:
```bash
cp config.example.js config.js
```

2. Edit `config.js` and fill in your values:
```javascript
window.GITHUB_TOKEN = 'your_token_here';
window.REPO_OWNER = 'your_username';
window.REPO_NAME = 'url-shortener';
window.RECAPTCHA_SITE_KEY = 'your_recaptcha_site_key'; // Optional
```

3. **Important**: `config.js` is already in `.gitignore` to prevent committing sensitive data. The application will automatically load it via `config-loader.js`.

4. **Security Note**: Since `config.js` contains sensitive data, consider these options:
   - For production: Use GitHub Actions to inject the token at build time
   - For development: Use browser localStorage (see Option B)
   - Never commit `config.js` to the repository

#### Option B: Using localStorage (For Development/Testing)

1. Open browser console on your site
2. Run:
```javascript
localStorage.setItem('github_token', 'your_token_here');
```

#### Option C: Using GitHub Actions (Most Secure)

Create `.github/workflows/deploy.yml` to inject tokens at build time (requires additional setup).

### 5. reCAPTCHA Setup (Optional but Recommended)

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Register a new site:
   - Label: URL Shortener
   - reCAPTCHA type: reCAPTCHA v3
   - Domains: `tinyurl.mkeeves.com`, `yourusername.github.io`
3. Copy the Site Key
4. Add it to your configuration (see step 4)

### 6. Update HTML Files

Update the reCAPTCHA site key in `index.html`:
```html
<div class="g-recaptcha" 
     data-sitekey="YOUR_RECAPTCHA_SITE_KEY" 
     data-size="invisible" 
     data-callback="onRecaptchaSuccess">
</div>
```

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
2. **reCAPTCHA**: Helps prevent abuse and automated URL creation
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

