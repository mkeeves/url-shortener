/**
 * Dark Mode Toggle Manager
 * Matches mkeeves.github.io style - floating button with popup menu
 * Includes cross-domain sync with mkeeves.com
 */
(function() {
  'use strict';

  class DarkModeManager {
    constructor() {
      // Check URL parameter first (for cross-domain sync)
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = urlParams.get('theme');
      if (urlTheme && ['light', 'dark', 'auto'].includes(urlTheme)) {
        localStorage.setItem('theme-preference', urlTheme);
        // Clean URL by removing theme parameter
        if (urlParams.has('theme')) {
          urlParams.delete('theme');
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
        }
      }
      
      this.theme = this.getStoredTheme() || 'auto';
      this.init();
    }

    /**
     * Initialize the dark mode manager
     */
    init() {
      this.applyTheme();
      this.createToggleButton();
      this.bindEvents();
      this.syncCrossDomainLinks();
    }

    /**
     * Get system theme preference
     */
    getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    /**
     * Get stored theme from cookie (for cross-domain sync) or localStorage
     */
    getStoredTheme() {
      // Try cookie first (for cross-domain sync) - this is the source of truth
      const cookieTheme = this.getCookie('theme-preference');
      if (cookieTheme) {
        // Sync to localStorage for faster future access
        localStorage.setItem('theme-preference', cookieTheme);
        return cookieTheme;
      }
      
      // Fall back to localStorage if no cookie exists
      const localTheme = localStorage.getItem('theme-preference');
      if (localTheme) {
        // Also set cookie so it's available cross-domain
        this.setCookie('theme-preference', localTheme, 365);
        return localTheme;
      }
      
      return null;
    }

    /**
     * Store theme in both localStorage and cookie (for cross-domain sync)
     */
    setStoredTheme(theme) {
      localStorage.setItem('theme-preference', theme);
      // Set cookie with domain=.mkeeves.com so it's accessible from both sites
      this.setCookie('theme-preference', theme, 365); // 1 year expiry
    }

    /**
     * Get cookie value
     */
    getCookie(name) {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }

    /**
     * Set cookie with appropriate domain for cross-domain access
     */
    setCookie(name, value, days) {
      // First, delete any existing cookies with different domain/path settings
      // This ensures we don't have conflicting cookies
      const pastDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
      document.cookie = name + '=; expires=' + pastDate + '; path=/';
      document.cookie = name + '=; expires=' + pastDate + '; path=/; domain=.mkeeves.com';
      document.cookie = name + '=; expires=' + pastDate + '; path=/; domain=mkeeves.com';
      
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
      }
      
      // Determine the appropriate domain
      const hostname = window.location.hostname;
      let domain = '';
      
      // If we're on a subdomain (e.g., tinyurl.mkeeves.com), use .mkeeves.com
      // If we're on root domain (mkeeves.com), use mkeeves.com
      if (hostname.includes('.') && hostname.split('.').length > 2) {
        // Subdomain - use .mkeeves.com
        const parts = hostname.split('.');
        domain = '.' + parts.slice(-2).join('.');
      } else if (hostname === 'mkeeves.com' || hostname.endsWith('.mkeeves.com')) {
        // Root domain or any mkeeves.com domain - use .mkeeves.com for cross-domain
        domain = '.mkeeves.com';
      }
      
      // Set cookie with domain if we determined one
      try {
        const cookieStr = name + '=' + (value || '') + expires + '; path=/' + 
                          (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
        document.cookie = cookieStr;
      } catch (e) {
        // If cookie setting fails, just use localStorage
        console.warn('Failed to set cookie:', e);
      }
    }

    /**
     * Apply theme to document
     */
    applyTheme() {
      const shouldBeDark = this.theme === 'dark' || (this.theme === 'auto' && this.getSystemTheme() === 'dark');

      // Use data-theme attribute for consistency with mkeeves.github.io
      if (shouldBeDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-mode');
      }
      this.setStoredTheme(this.theme);
      this.updateToggleButton();
    }

    /**
     * Set theme programmatically
     */
    setTheme(theme) {
      if (theme === 'light' || theme === 'dark' || theme === 'auto') {
        this.theme = theme;
        this.applyTheme();
      }
    }

    /**
     * Toggle between light, dark, and auto themes
     */
    toggleTheme() {
      if (this.theme === 'light') {
        this.theme = 'dark';
      } else if (this.theme === 'dark') {
        this.theme = 'auto';
      } else {
        this.theme = 'light';
      }
      this.applyTheme();
    }

    /**
     * Get SVG icon for theme
     */
    getIcon(theme) {
      if (theme === 'dark') {
        return '<svg class="theme-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      } else if (theme === 'light') {
        return '<svg class="theme-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      } else { // auto
        return '<svg class="theme-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path></svg>';
      }
    }

    /**
     * Create floating toggle button with popup
     */
    createToggleButton() {
      // Remove existing toggle if it exists
      const existingToggle = document.getElementById('dark-mode-toggle');
      if (existingToggle) {
        existingToggle.remove();
      }

      // Remove old toggle if it exists
      const oldToggle = document.querySelector('.dark-toggle');
      if (oldToggle) {
        oldToggle.remove();
      }

      // Create toggle container
      const toggleContainer = document.createElement('div');
      toggleContainer.id = 'dark-mode-toggle';
      toggleContainer.className = 'dark-mode-toggle-container';

      // Create toggle button
      const toggleButton = document.createElement('button');
      toggleButton.id = 'theme-toggle-button';
      toggleButton.className = 'dark-mode-toggle-button';
      toggleButton.setAttribute('aria-label', 'Theme settings');
      toggleButton.setAttribute('title', 'Theme settings');

      // Create icon
      const icon = document.createElement('span');
      icon.id = 'theme-icon';
      icon.className = 'dark-mode-icon';
      icon.innerHTML = this.getIcon(this.theme);

      toggleButton.appendChild(icon);
      toggleContainer.appendChild(toggleButton);

      // Create popup menu
      const popup = document.createElement('div');
      popup.id = 'theme-popup';
      popup.className = 'dark-mode-popup';

      // Create theme options
      const themes = [
        { value: 'light', label: 'Light', icon: this.getIcon('light') },
        { value: 'dark', label: 'Dark', icon: this.getIcon('dark') },
        { value: 'auto', label: 'Auto', icon: this.getIcon('auto') }
      ];

      themes.forEach(theme => {
        const option = document.createElement('button');
        option.className = `theme-option ${this.theme === theme.value ? 'theme-option-active' : ''}`;
        option.setAttribute('data-theme', theme.value);
        option.setAttribute('aria-label', `Set theme to ${theme.label}`);

        option.innerHTML = `
          <span class="theme-option-icon">${theme.icon}</span>
          <span class="theme-option-label">${theme.label}</span>
        `;

        // Add click handler directly to the button
        option.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          const selectedTheme = option.getAttribute('data-theme');
          if (selectedTheme) {
            this.setTheme(selectedTheme);
          }
          this.hidePopup();
        }, true);

        popup.appendChild(option);
      });

      toggleContainer.appendChild(popup);

      // Add to body
      document.body.appendChild(toggleContainer);
    }

    /**
     * Update toggle button appearance
     */
    updateToggleButton() {
      const icon = document.getElementById('theme-icon');
      if (icon) {
        icon.innerHTML = this.getIcon(this.theme);
      }

      // Update popup options highlighting
      const options = document.querySelectorAll('.theme-option');
      options.forEach(option => {
        const theme = option.getAttribute('data-theme');
        if (theme === this.theme) {
          option.classList.add('theme-option-active');
        } else {
          option.classList.remove('theme-option-active');
        }
      });
    }

    /**
     * Show popup menu
     */
    showPopup() {
      const popup = document.getElementById('theme-popup');
      if (popup) {
        popup.classList.add('dark-mode-popup-visible');
      }
    }

    /**
     * Hide popup menu
     */
    hidePopup() {
      const popup = document.getElementById('theme-popup');
      if (popup) {
        popup.classList.remove('dark-mode-popup-visible');
      }
    }

    /**
     * Sync cross-domain links - add theme parameter to links to mkeeves.com
     */
    syncCrossDomainLinks() {
      // Add theme parameter to any links pointing to mkeeves.com domains
      const links = document.querySelectorAll('a[href*="mkeeves.com"]');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          try {
            const url = new URL(link.href);
            // Only add theme param if it's a different domain
            if (url.hostname !== window.location.hostname) {
              url.searchParams.set('theme', this.theme);
              link.href = url.toString();
            }
          } catch (err) {
            // If URL parsing fails, ignore
          }
        });
      });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
      // Add direct click handlers to prevent processing feedback
      const toggleButton = document.getElementById('theme-toggle-button');
      if (toggleButton) {
        toggleButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const popup = document.getElementById('theme-popup');
          if (popup && !popup.classList.contains('dark-mode-popup-visible')) {
            this.showPopup();
          } else {
            this.hidePopup();
          }
        }, true); // Use capture phase to run before other handlers
      }

      // Toggle button click - show/hide popup
      document.addEventListener('click', (e) => {
        if (e.target && e.target instanceof Element) {
          if (e.target.closest('#theme-toggle-button')) {
            e.preventDefault();
            e.stopPropagation();
            return;
          } else if (e.target.closest('.theme-option')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const themeElement = e.target.closest('.theme-option');
            const theme = themeElement?.getAttribute('data-theme');
            if (theme) {
              this.setTheme(theme);
            }
            this.hidePopup();
          } else {
            // Click outside - hide popup
            this.hidePopup();
          }
        }
      });
      
      // Also add direct handlers to theme options to prevent processing feedback
      // but still allow theme selection to work
      const addThemeOptionHandlers = () => {
        document.querySelectorAll('.theme-option').forEach(option => {
          // Remove any existing handlers to avoid duplicates
          const newOption = option.cloneNode(true);
          option.parentNode.replaceChild(newOption, option);
          
          // Add handler that prevents processing feedback but allows theme change
          newOption.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Actually set the theme
            const theme = newOption.getAttribute('data-theme');
            if (theme) {
              this.setTheme(theme);
            }
            this.hidePopup();
          }, true);
        });
      };
      
      // Add handlers immediately and also after a delay for dynamically created buttons
      addThemeOptionHandlers();
      setTimeout(addThemeOptionHandlers, 100);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.theme === 'auto') {
          this.applyTheme();
        }
      });

      // Keyboard shortcut (Ctrl/Cmd + Shift + D)
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
      return this.theme;
    }
  }

  // Initialize dark mode when DOM is ready
  function initializeDarkMode() {
    // Prevent multiple initializations
    if (window.darkMode) {
      return;
    }

    // Small delay to ensure DOM is fully ready
    if (document.body) {
      window.darkMode = new DarkModeManager();
    } else {
      setTimeout(() => {
        window.darkMode = new DarkModeManager();
      }, 100);
    }
  }

  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDarkMode);
  } else {
    // DOM is already loaded, initialize immediately
    initializeDarkMode();
  }
})();

