const CACHE_NAME = 'video-task-manager-v3';
const STATIC_CACHE_NAME = 'video-task-manager-static-v3';
const DYNAMIC_CACHE_NAME = 'video-task-manager-dynamic-v3';

// Enhanced assets to cache for better offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/profile',
  '/projects',
  '/calendar',
  '/manifest.json',
  '/next.svg',
  '/vercel.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes that can be cached (read-only operations)
const CACHEABLE_API_ROUTES = [
  '/api/projects',
  '/api/tasks',
  '/api/users',
  '/api/clients',
  '/api/equipment',
];

// Offline-capable routes for task creation
const OFFLINE_CAPABLE_ROUTES = [
  '/api/tasks',
  '/api/projects',
  '/api/comments',
];

// Install event - cache minimal static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing for mobile-optimized mode...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching minimal static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Ready for mobile-optimized operation');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
        // Don't fail installation if caching fails on mobile
        return Promise.resolve();
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

// Fetch event - implement mobile-optimized caching strategies
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

  // Mobile-specific optimizations
  const isMobileRequest = request.headers.get('user-agent')?.includes('Mobile') ||
                         request.headers.get('user-agent')?.includes('Android') ||
                         request.headers.get('user-agent')?.includes('iPhone');

  // Handle different types of requests with mobile-optimized approach
  if (url.pathname.startsWith('/api/')) {
    // API requests - Mobile-optimized with better error handling
    event.respondWith(mobileOptimizedApiStrategy(request, isMobileRequest));
  } else if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    // Static assets - Cache first for performance
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Pages and other resources - Mobile-optimized network strategy
    event.respondWith(mobileOptimizedNetworkStrategy(request, isMobileRequest));
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

// Mobile-optimized API Strategy with better error handling
async function mobileOptimizedApiStrategy(request, isMobile) {
  const url = new URL(request.url);
  
  try {
    // Add timeout for mobile requests to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), isMobile ? 10000 : 30000);
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse.ok && CACHEABLE_API_ROUTES.some(route => request.url.includes(route))) {
      // Cache successful GET responses for read operations
      try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
        
        // Store data in IndexedDB for offline access (with error handling)
        if (request.method === 'GET') {
          try {
            const data = await networkResponse.clone().json();
            await storeOfflineData(url.pathname, data);
          } catch (jsonError) {
            console.warn('Failed to parse JSON for offline storage:', jsonError);
          }
        }
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network unavailable or timeout, checking offline capabilities:', error);
    
    // Handle offline POST/PUT requests for task creation
    if (request.method !== 'GET' && OFFLINE_CAPABLE_ROUTES.some(route => request.url.includes(route))) {
      return handleOfflineWrite(request);
    }
    
    // Return cached data for read operations
    if (request.method === 'GET' && CACHEABLE_API_ROUTES.some(route => request.url.includes(route))) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        const response = cachedResponse.clone();
        response.headers.set('X-Served-From', 'cache');
        response.headers.set('X-Cache-Warning', 'Stale data - network unavailable');
        return response;
      }
      
      // Try to get data from IndexedDB
      try {
        const offlineData = await getOfflineData(url.pathname);
        if (offlineData) {
          return new Response(JSON.stringify(offlineData), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Served-From': 'offline-storage',
              'X-Cache-Warning': 'Offline data - may be stale'
            }
          });
        }
      } catch (dbError) {
        console.warn('Failed to retrieve offline data:', dbError);
      }
    }

    // Return appropriate offline response
    return getMobileOfflineResponse(request, isMobile);
  }
}

// Handle offline write operations
async function handleOfflineWrite(request) {
  try {
    const requestData = await request.clone().json();
    const offlineAction = {
      id: Date.now().toString(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: JSON.stringify(requestData),
      timestamp: Date.now()
    };
    
    // Store in IndexedDB for later sync
    await storeOfflineAction(offlineAction);
    
    // Return optimistic response
    return new Response(JSON.stringify({
      success: true,
      id: offlineAction.id,
      message: 'Action queued for sync when online',
      offline: true,
      data: requestData
    }), {
      status: 202,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Action': 'queued'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to queue offline action',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get mobile-appropriate offline response
function getMobileOfflineResponse(request, isMobile) {
  const url = new URL(request.url);
  
  const mobileMessage = isMobile ?
    'Limited connectivity detected. Some features may not be available.' :
    'Network unavailable. Please check your internet connection.';
  
  if (url.pathname.includes('/projects')) {
    return new Response(JSON.stringify({
      projects: [],
      pagination: { totalItems: 0, currentPage: 1, totalPages: 0 },
      message: mobileMessage,
      offline: true,
      mobile: isMobile
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Mode': 'true',
        'X-Mobile-Optimized': isMobile ? 'true' : 'false'
      }
    });
  }
  
  if (url.pathname.includes('/tasks')) {
    return new Response(JSON.stringify({
      tasks: [],
      message: mobileMessage,
      offline: true,
      mobile: isMobile
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Mode': 'true',
        'X-Mobile-Optimized': isMobile ? 'true' : 'false'
      }
    });
  }
  
  return new Response(JSON.stringify({
    error: 'Network unavailable',
    message: mobileMessage,
    offline: true,
    mobile: isMobile,
    timestamp: new Date().toISOString(),
    suggestions: isMobile ? [
      'Check your mobile data connection',
      'Try switching between WiFi and mobile data',
      'Move to an area with better signal'
    ] : [
      'Check your internet connection',
      'Try refreshing the page'
    ]
  }), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'application/json',
      'X-Offline-Mode': 'true',
      'X-Mobile-Optimized': isMobile ? 'true' : 'false'
    }
  });
}

// IndexedDB operations for offline data
async function storeOfflineData(endpoint, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoTaskManagerOffline', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('apiData')) {
        db.createObjectStore('apiData', { keyPath: 'endpoint' });
      }
      if (!db.objectStoreNames.contains('offlineActions')) {
        db.createObjectStore('offlineActions', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['apiData'], 'readwrite');
      const store = transaction.objectStore('apiData');
      
      store.put({
        endpoint: endpoint,
        data: data,
        timestamp: Date.now()
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function getOfflineData(endpoint) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoTaskManagerOffline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['apiData'], 'readonly');
      const store = transaction.objectStore('apiData');
      const getRequest = store.get(endpoint);
      
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        resolve(result ? result.data : null);
      };
      
      getRequest.onerror = () => resolve(null);
    };
    
    request.onerror = () => resolve(null);
  });
}

async function storeOfflineAction(action) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoTaskManagerOffline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      
      store.put(action);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Mobile-optimized Network Strategy - for pages and resources
async function mobileOptimizedNetworkStrategy(request, isMobile) {
  try {
    // Add timeout for mobile requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), isMobile ? 8000 : 15000);
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      // Cache successful responses (with size limits for mobile)
      try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        
        // Limit cache size on mobile devices
        if (isMobile) {
          const cacheKeys = await cache.keys();
          if (cacheKeys.length > 50) {
            // Remove oldest entries
            const oldestKey = cacheKeys[0];
            await cache.delete(oldestKey);
          }
        }
        
        cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return mobile-optimized offline page
    return getMobileOfflinePage(isMobile);
  }
}

// Mobile-optimized offline page
function getMobileOfflinePage(isMobile) {
  const mobileStyles = isMobile ? `
    body { font-size: 16px; padding: 20px; }
    .offline-message { max-width: 100%; }
    button {
      min-height: 44px;
      min-width: 44px;
      padding: 12px 24px;
      font-size: 16px;
      touch-action: manipulation;
    }
  ` : '';

  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Offline - Video Task Manager</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <meta name="theme-color" content="#6366f1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 50px 20px;
            background: #f9fafb;
            color: #374151;
            margin: 0;
          }
          .offline-message {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          h1 { color: #1f2937; margin-bottom: 1rem; }
          button {
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            margin-top: 1rem;
          }
          button:hover { background: #5856eb; }
          .icon { font-size: 3rem; margin-bottom: 1rem; }
          ${mobileStyles}
        </style>
      </head>
      <body>
        <div class="offline-message">
          <div class="icon">📱</div>
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          ${isMobile ? '<p><small>Tip: Try switching to a different network or enable mobile data.</small></p>' : ''}
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

// Enhanced offline action management
async function getOfflineActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoTaskManagerOffline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineActions'], 'readonly');
      const store = transaction.objectStore('offlineActions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => resolve([]);
    };
    
    request.onerror = () => resolve([]);
  });
}

async function removeOfflineAction(actionId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoTaskManagerOffline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      
      store.delete(actionId);
      
      transaction.oncomplete = () => {
        console.log('Service Worker: Removed offline action', actionId);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Push notifications removed as requested

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

console.log('Service Worker: Loaded for mobile-optimized operation');