/**
 * Platform Configuration - Enterprise Level
 * Centralized configuration for EasOfTopia platform apps
 * Easy to update for different environments and deployments
 */

const PlatformConfig = {
    // Environment detection
    getEnvironment() {
        const hostname = window.location.hostname;
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
            return 'development';
        } else if (hostname.includes('vercel.app')) {
            return 'production';
        } else if (hostname.includes('staging')) {
            return 'staging';
        }
        return 'production';
    },

    // Platform apps configuration
    getPlatformApps() {
        const environment = this.getEnvironment();
        
        const configs = {
            development: [
                {
                    name: 'Home',
                    url: 'https://firewalls-ids-web.vercel.app/'
                },
                {
                    name: 'Style Editor',
                    url: window.location.origin,
                    isCurrent: true
                },
                {
                    name: 'Paletteniffer',
                    url: 'https://poetbeloved.vercel.app/'
                }
            ],
            staging: [
                {
                    name: 'Home',
                    url: 'https://topiastyler-landing-staging.vercel.app'
                },
                {
                    name: 'Style Editor',
                    url: window.location.origin,
                    isCurrent: true
                },
                {
                    name: 'Paletteniffer',
                    url: 'https://topiastyler-paletteniffer-staging.vercel.app'
                }
            ],
            production: [
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
            ]
        };

        return configs[environment] || configs.production;
    },

    // Platform branding
    getPlatformBranding() {
        return {
            name: 'EasOfTopia',
            logo: 'assets/logo.png',
            primaryColor: '#38bdf8',
            secondaryColor: '#0ea5e9'
        };
    },

    // Navigation settings
    getNavigationSettings() {
        return {
            insertAfter: '.nav-right',
            showCurrentApp: true,
            enableDropdown: true,
            enableKeyboardNavigation: true,
            enableResponsiveDesign: true
        };
    },

    // Analytics and tracking
    getAnalyticsConfig() {
        return {
            enabled: this.getEnvironment() === 'production',
            trackingId: 'your-analytics-id',
            trackNavigation: true,
            trackThemeChanges: true
        };
    },

    // Feature flags
    getFeatureFlags() {
        return {
            enablePlatformNavigation: true,
            enableThemeSharing: false, // Will be implemented later
            enableCrossDomainAuth: false, // Will be implemented later
            enableAnalytics: this.getAnalyticsConfig().enabled
        };
    }
};

// Export for use in other modules
window.PlatformConfig = PlatformConfig; 