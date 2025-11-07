/**
 * Analytics Dashboard
 * Displays statistics and analytics for shortened URLs
 */

document.addEventListener('DOMContentLoaded', async () => {
    const refreshBtn = document.getElementById('refreshBtn');
    
    refreshBtn.addEventListener('click', loadAnalytics);
    
    // Load analytics on page load
    await loadAnalytics();
});

async function loadAnalytics() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Loading...';
    
    try {
        const urls = await githubAPI.getUrls();
        displayAnalytics(urls);
    } catch (error) {
        console.error('Error loading analytics:', error);
        showError('Failed to load analytics data. Please try again.');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh Data';
    }
}

function displayAnalytics(urls) {
    const urlEntries = Object.entries(urls);
    
    // Calculate statistics
    const totalUrls = urlEntries.length;
    const totalClicks = urlEntries.reduce((sum, [, data]) => sum + (data.clicks || 0), 0);
    const avgClicks = totalUrls > 0 ? Math.round(totalClicks / totalUrls) : 0;
    
    // Update stat cards
    document.getElementById('totalUrls').textContent = totalUrls.toLocaleString();
    document.getElementById('totalClicks').textContent = totalClicks.toLocaleString();
    document.getElementById('avgClicks').textContent = avgClicks.toLocaleString();
    
    // Display most popular URLs
    displayPopularUrls(urlEntries);
    
    // Display recent URLs
    displayRecentUrls(urlEntries);
    
    // Update last updated timestamp
    updateLastUpdated();
}

function displayPopularUrls(urlEntries) {
    const container = document.getElementById('popularUrls');
    
    if (urlEntries.length === 0) {
        container.innerHTML = '<p class="empty-state">No URLs created yet.</p>';
        return;
    }
    
    // Sort by click count (descending)
    const sorted = [...urlEntries].sort((a, b) => {
        const clicksA = a[1].clicks || 0;
        const clicksB = b[1].clicks || 0;
        return clicksB - clicksA;
    });
    
    // Show top 10
    const topUrls = sorted.slice(0, 10);
    
    container.innerHTML = topUrls.map(([code, data]) => {
        const shortUrl = `${window.location.origin}/${code}`;
        const clicks = data.clicks || 0;
        const created = new Date(data.created).toLocaleDateString();
        const lastClicked = data.lastClicked ? new Date(data.lastClicked).toLocaleDateString() : 'Never';
        
        return `
            <div class="url-item">
                <div class="url-info">
                    <div class="url-short">${shortUrl}</div>
                    <div class="url-long">${truncateUrl(data.url, 60)}</div>
                    <div class="url-meta">
                        <span>Created: ${created}</span>
                        <span>Last clicked: ${lastClicked}</span>
                    </div>
                </div>
                <div class="url-stats">
                    <div class="click-count">${clicks.toLocaleString()}</div>
                    <div class="click-label">clicks</div>
                </div>
            </div>
        `;
    }).join('');
}

function displayRecentUrls(urlEntries) {
    const container = document.getElementById('recentUrls');
    
    if (urlEntries.length === 0) {
        container.innerHTML = '<p class="empty-state">No URLs created yet.</p>';
        return;
    }
    
    // Sort by creation date (descending)
    const sorted = [...urlEntries].sort((a, b) => {
        const dateA = new Date(a[1].created);
        const dateB = new Date(b[1].created);
        return dateB - dateA;
    });
    
    // Show most recent 10
    const recentUrls = sorted.slice(0, 10);
    
    container.innerHTML = recentUrls.map(([code, data]) => {
        const shortUrl = `${window.location.origin}/${code}`;
        const clicks = data.clicks || 0;
        const created = new Date(data.created).toLocaleDateString();
        const lastClicked = data.lastClicked ? new Date(data.lastClicked).toLocaleDateString() : 'Never';
        
        return `
            <div class="url-item">
                <div class="url-info">
                    <div class="url-short">${shortUrl}</div>
                    <div class="url-long">${truncateUrl(data.url, 60)}</div>
                    <div class="url-meta">
                        <span>Created: ${created}</span>
                        <span>Last clicked: ${lastClicked}</span>
                    </div>
                </div>
                <div class="url-stats">
                    <div class="click-count">${clicks.toLocaleString()}</div>
                    <div class="click-label">clicks</div>
                </div>
            </div>
        `;
    }).join('');
}

function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) {
        return url;
    }
    return url.substring(0, maxLength - 3) + '...';
}

function updateLastUpdated() {
    const lastUpdatedEl = document.getElementById('lastUpdated');
    const now = new Date();
    lastUpdatedEl.textContent = `Last updated: ${now.toLocaleString()}`;
}

function showError(message) {
    // Could add a toast notification or error banner here
    console.error(message);
    alert(message);
}

