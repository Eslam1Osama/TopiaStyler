const CACHE_NAME = 'topiastyler-v1.0.0';
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/platformNavigation.css',
    '/css/platformPreloader.css',
    '/js/app.js',
    '/js/editor.js',
    '/js/exporter.js',
    '/js/fileHandler.js',
    '/js/platformConfig.js',
    '/js/platformNavigation.js',
    '/js/renderer.js',
    '/lib/jszip.min.js',
    '/platformPreloader.js',
    '/manifest.json',
    '/browserconfig.xml',
    '/assets/logo.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Lato:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=PT+Sans:wght@400;700&family=Ubuntu:wght@400;700&family=Varela&family=Varela+Round&family=Exo:wght@400;700&family=Droid+Sans:wght@400;700&family=Raleway:wght@400;700&family=Poppins:wght@400;700&family=Quicksand:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=PT+Serif:wght@400;700&family=Vollkorn:wght@400;700&family=Bitter:wght@400;700&family=Droid+Serif:wght@400;700&family=Lora:wght@400;700&family=Abril+Fatface&display=swap',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Changa+One&family=Pacifico&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Caveat:wght@400;700&family=Playfair+Display:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;700&family=Space+Mono:wght@400;700&family=Inconsolata:wght@400;700&display=swap'
];

// Install event - cache static files
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(STATIC_FILES);
            })
            .catch(function(error) {
                console.log('Service Worker install failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip chrome-extension URLs and other unsupported schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'moz-extension:' || 
        url.protocol === 'chrome-devtools:' ||
        url.protocol === 'devtools:' ||
        url.protocol === 'about:' ||
        url.protocol === 'data:' ||
        url.protocol === 'blob:' ||
        url.protocol === 'file:') {
        return;
    }
    
    // Handle null request headers gracefully
    if (!request.headers) {
        return;
    }
    
    const acceptHeader = request.headers.get('accept');
    if (!acceptHeader) {
        return;
    }
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(function(response) {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Clone the request for network fetch
                const fetchRequest = request.clone();
                
                return fetch(fetchRequest)
                    .then(function(response) {
                        // Check if response is valid
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response for caching
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(request, responseToCache);
                            })
                            .catch(function(error) {
                                console.log('Cache put failed:', error);
                            });
                        
                        return response;
                    })
                    .catch(function(error) {
                        console.log('Fetch failed:', error);
                        
                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                        
                        return new Response('Network error', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

 