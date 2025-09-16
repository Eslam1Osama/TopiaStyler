/**
 * Platform Navigation Manager - Enterprise Level
 * Handles cross-domain navigation across the EasOfTopia platform
 * Maintains existing header functionality while adding platform navigation
 */
class PlatformNavigationManager {
    constructor() {
        // Use platform configuration if available, otherwise use defaults
        this.platformApps = window.PlatformConfig ? 
            window.PlatformConfig.getPlatformApps() : [
                {
                    name: 'Home',
                    url: 'https://topiastyler-landing.vercel.app'
                },
                {
                    name: 'Style Editor',
                    url: window.location.origin,
                    isCurrent: true
                },
                {
                    name: 'Paletteniffer',
                    url: 'https://topiastyler-paletteniffer.vercel.app'
                }
            ];
        
        this.isInitialized = false;
        this.navigationContainer = null;
        this.dropdownMenu = null;
        this.currentApp = this.platformApps.find(app => app.isCurrent);
    }

    /**
     * Initialize platform navigation
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) return;
        
        this.config = {
            insertAfter: options.insertAfter || '.logo',
            showCurrentApp: options.showCurrentApp !== false,
            enableDropdown: options.enableDropdown !== false,
            ...options
        };

        this.createNavigationElement();
        this.insertNavigation();
        this.setupEventListeners();
        this.setupResponsiveBehavior();
        
        this.isInitialized = true;
    }

    /**
     * Create the navigation element with enterprise-level structure
     */
    createNavigationElement() {
        // Create main navigation container
        this.navigationContainer = document.createElement('div');
        this.navigationContainer.className = 'platform-navigation';
        this.navigationContainer.setAttribute('role', 'navigation');
        this.navigationContainer.setAttribute('aria-label', 'Platform Navigation');

        // Create navigation content
        const navContent = document.createElement('div');
        navContent.className = 'platform-nav-content';

        // Create current app indicator
        if (this.config.showCurrentApp && this.currentApp) {
            const currentAppIndicator = this.createCurrentAppIndicator();
            navContent.appendChild(currentAppIndicator);
        }

        // Create platform dropdown
        if (this.config.enableDropdown) {
            const dropdownContainer = this.createPlatformDropdown();
            navContent.appendChild(dropdownContainer);
        }

        this.navigationContainer.appendChild(navContent);
    }

    /**
     * Create current app indicator
     */
    createCurrentAppIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'current-app-indicator';
        indicator.setAttribute('role', 'button');
        indicator.setAttribute('tabindex', '0');
        indicator.setAttribute('aria-label', `Platform Navigation - Current: ${this.currentApp.name}`);

        indicator.innerHTML = `
            <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
            </svg>
        `;

        return indicator;
    }

    /**
     * Create platform dropdown menu
     */
    createPlatformDropdown() {
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'platform-dropdown-container';

        // Create backdrop
        this.dropdownBackdrop = document.createElement('div');
        this.dropdownBackdrop.className = 'platform-dropdown-backdrop';
        this.dropdownBackdrop.addEventListener('click', () => this.closeDropdown());

        // Create dropdown menu
        this.dropdownMenu = document.createElement('div');
        this.dropdownMenu.className = 'platform-dropdown-menu';
        this.dropdownMenu.setAttribute('role', 'menu');
        this.dropdownMenu.setAttribute('aria-hidden', 'true');

        // Create dropdown items (exclude current app)
        this.platformApps.forEach(app => {
            if (!app.isCurrent) {
                const menuItem = this.createDropdownMenuItem(app);
                this.dropdownMenu.appendChild(menuItem);
            }
        });

        dropdownContainer.appendChild(this.dropdownBackdrop);
        dropdownContainer.appendChild(this.dropdownMenu);
        return dropdownContainer;
    }

    /**
     * Create individual dropdown menu item
     */
    createDropdownMenuItem(app) {
        const menuItem = document.createElement('div');
        menuItem.className = 'platform-dropdown-item';
        menuItem.setAttribute('role', 'menuitem');
        menuItem.setAttribute('tabindex', '-1');

        menuItem.innerHTML = `
            <div class="app-info">
                <span class="app-name">${app.name}</span>
            </div>
        `;

        menuItem.addEventListener('click', () => this.navigateToApp(app));
        menuItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.navigateToApp(app);
            }
        });

        return menuItem;
    }

    /**
     * Insert navigation into the header
     */
    insertNavigation() {
        const targetElement = document.querySelector(this.config.insertAfter);
        if (!targetElement) {
            console.warn('Target element for platform navigation not found');
            return;
        }

        // Find the theme toggle button and insert before it
        const themeToggleBtn = targetElement.querySelector('#themeToggleBtn');
        if (themeToggleBtn) {
            targetElement.insertBefore(this.navigationContainer, themeToggleBtn);
        } else {
            // Fallback: append to the end if theme toggle button not found
            targetElement.appendChild(this.navigationContainer);
        }
    }

    /**
     * Setup event listeners for navigation
     */
    setupEventListeners() {
        // Toggle dropdown on current app indicator click
        const currentAppIndicator = this.navigationContainer.querySelector('.current-app-indicator');
        if (currentAppIndicator) {
            currentAppIndicator.addEventListener('click', () => this.toggleDropdown());
            currentAppIndicator.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleDropdown();
                }
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.navigationContainer.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
    }

    /**
     * Setup responsive behavior
     */
    setupResponsiveBehavior() {
        // Handle window resize to reposition dropdown if needed
        window.addEventListener('resize', () => {
            if (this.dropdownMenu && this.dropdownMenu.getAttribute('aria-hidden') === 'false') {
                this.repositionDropdown();
            }
        });
    }

    /**
     * Reposition dropdown based on available space
     */
    repositionDropdown() {
        if (!this.dropdownMenu || !this.navigationContainer) return;

        const containerRect = this.navigationContainer.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Get responsive dropdown width
        let dropdownWidth = 240; // Default width
        if (viewportWidth <= 480) {
            dropdownWidth = 180;
        } else if (viewportWidth <= 768) {
            dropdownWidth = 200;
        } else if (viewportWidth <= 1024) {
            dropdownWidth = 220;
        }
        
        const dropdownHeight = 200; // Estimated height

        // Reset positioning
        this.dropdownMenu.classList.remove('dropdown-up');
        this.dropdownMenu.style.top = '';
        this.dropdownMenu.style.bottom = '';
        this.dropdownMenu.style.left = '';
        this.dropdownMenu.style.right = '';

        // Calculate horizontal position - align to right edge of button
        let left = containerRect.right - dropdownWidth;
        if (left < 10) { // 10px margin from left edge
            left = 10;
        } else if (left + dropdownWidth > viewportWidth - 10) {
            left = viewportWidth - dropdownWidth - 10; // 10px margin from right edge
        }

        // Calculate vertical position
        let top = containerRect.bottom + 8; // 8px gap below button
        let isUpward = false;

        // Check if dropdown goes off-screen to the bottom
        if (top + dropdownHeight > viewportHeight - 10) {
            isUpward = true;
            top = containerRect.top - dropdownHeight - 8; // 8px gap above button
        }

        // Apply positioning
        this.dropdownMenu.style.left = `${left}px`;
        this.dropdownMenu.style.top = `${top}px`;

        if (isUpward) {
            this.dropdownMenu.classList.add('dropdown-up');
        }
    }

    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        const isOpen = this.dropdownMenu.getAttribute('aria-hidden') === 'false';
        
        if (isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    /**
     * Open dropdown menu
     */
    openDropdown() {
        this.dropdownMenu.setAttribute('aria-hidden', 'false');
        this.navigationContainer.classList.add('dropdown-open');
        
        // Reposition dropdown based on available space
        setTimeout(() => {
            this.repositionDropdown();
        }, 10);
        
        // Focus first menu item
        const firstMenuItem = this.dropdownMenu.querySelector('.platform-dropdown-item:not(.current)');
        if (firstMenuItem) {
            firstMenuItem.focus();
        }
    }

    /**
     * Close dropdown menu
     */
    closeDropdown() {
        // Add closing class for animation
        this.navigationContainer.classList.add('dropdown-closing');
        
        // Wait for animation to complete, then hide
        setTimeout(() => {
            this.dropdownMenu.setAttribute('aria-hidden', 'true');
            this.navigationContainer.classList.remove('dropdown-open', 'dropdown-closing');
            
            // Reset positioning
            if (this.dropdownMenu) {
                this.dropdownMenu.style.left = '';
                this.dropdownMenu.style.top = '';
            }
        }, 200); // Match the CSS transition duration
    }

    /**
     * Navigate to a platform app
     */
    navigateToApp(app) {
        // Always close the dropdown immediately for UX
        this.closeDropdown();
        // Add loading state
        this.navigationContainer.classList.add('navigating');
        // Defensive: Remove .navigating after 2s if navigation does not occur (SPA, dev, etc.)
        setTimeout(() => {
            this.navigationContainer.classList.remove('navigating');
        }, 2000);
        // Navigate to the app
        window.location.href = app.url;
    }

    /**
     * Update platform apps configuration
     */
    updatePlatformApps(apps) {
        this.platformApps = apps;
        this.currentApp = this.platformApps.find(app => app.isCurrent);
        
        if (this.isInitialized) {
            // Recreate navigation with new apps
            this.navigationContainer.remove();
            this.createNavigationElement();
            this.insertNavigation();
        }
    }

    /**
     * Get current platform configuration
     */
    getPlatformConfig() {
        return {
            apps: this.platformApps,
            currentApp: this.currentApp,
            isInitialized: this.isInitialized
        };
    }
}

// Export for use in other modules
window.PlatformNavigationManager = PlatformNavigationManager; 