const CACHE_NAME = 'video-task-manager-v2';
const STATIC_CACHE_NAME = 'video-task-manager-static-v2';
const DYNAMIC_CACHE_NAME = 'video-task-manager-dynamic-v2';

// Minimal assets to cache for basic offline functionality
const STATIC_ASSETS = [
  '/manifest.json',
  '/next.svg',
  '/vercel.svg',
];

// API routes that can be cached (read-only operations)
const CACHEABLE_API_ROUTES = [
  '/api/projects',
  '/api/tasks',
  '/api/users',
  '/api/clients',
  '/api/equipment',
];

// Install event - cache minimal static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing for online-first mode...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching minimal static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Ready for online-first operation');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement online-first caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle different types of requests with online-first approach
  if (url.pathname.startsWith('/api/')) {
    // API requests - Always try network first, minimal caching
    event.respondWith(onlineFirstApiStrategy(request));
  } else if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    // Static assets - Cache first for performance
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Pages and other resources - Network first for fresh content
    event.respondWith(networkFirstStrategy(request));
  }
});

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache First Strategy failed:', error);
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Online First Strategy for API calls - prioritize fresh data
async function onlineFirstApiStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && CACHEABLE_API_ROUTES.some(route => request.url.includes(route))) {
      // Only cache successful GET responses for read operations
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network unavailable, checking cache:', error);
    
    // Only return cached data for read operations
    if (CACHEABLE_API_ROUTES.some(route => request.url.includes(route))) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        const response = cachedResponse.clone();
        response.headers.set('X-Served-From', 'cache');
        response.headers.set('X-Cache-Warning', 'Stale data - network unavailable');
        return response;
      }
    }

    // Return network error for non-cacheable requests
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'Please check your internet connection',
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Network First Strategy - for pages and resources
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Video Task Manager</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/html'
      }
    });
  }
}

// Stale While Revalidate Strategy - for pages
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cached version if available
    return cachedResponse;
  });

  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync-tasks') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when back online
async function syncOfflineActions() {
  try {
    console.log('Service Worker: Syncing offline actions...');
    
    // Get offline actions from IndexedDB or localStorage
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action from offline storage
        await removeOfflineAction(action.id);
        
        console.log('Service Worker: Synced offline action', action.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync action', action.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Helper functions for offline action management
async function getOfflineActions() {
  // In a real implementation, this would read from IndexedDB
  // For now, return empty array
  return [];
}

async function removeOfflineAction(actionId) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Service Worker: Removing offline action', actionId);
}

// Push notification handling (optimized for online use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event);
  
  let notificationData;
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (e) {
    notificationData = { body: event.data ? event.data.text() : 'New notification' };
  }
  
  const options = {
    body: notificationData.body || 'New notification from Video Task Manager',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: notificationData.url || '/dashboard',
      timestamp: Date.now()
    },
    requireInteraction: false, // Don't require interaction for online use
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Video Task Manager',
      options
    )
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/dashboard';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Try to focus existing window first
          for (const client of clientList) {
            if (client.url.includes(self.location.origin)) {
              return client.focus().then(() => client.navigate(urlToOpen));
            }
          }
          // Open new window if no existing window found
          return clients.openWindow(urlToOpen);
        })
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Removed aggressive caching for online-first approach
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('video-task-manager-')) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});

console.log('Service Worker: Loaded for online-first operation');