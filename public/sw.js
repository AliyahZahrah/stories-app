/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

// Versioning for cache busting
const CACHE_VERSION = 'v64'; // Incremented version

// Workbox CDN import
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');
} catch (error) {
  console.error(
    `[SW] Workbox could not be loaded from CDN. Offline capabilities may be severely limited. Error: ${error}`,
  );
}

if (typeof workbox !== 'undefined') {
  console.log(`[SW] Workbox is loaded successfully. (${CACHE_VERSION})`);

  // Set up cache names with versioning
  workbox.core.setCacheNameDetails({
    prefix: 'stories-app-cache',
    suffix: CACHE_VERSION,
    precache: 'precache',
    runtime: 'runtime',
    googleAnalytics: 'ga',
  });

  // Precache the main application shell files (static assets from public usually)
  // For Vite, index.html is the main entry. Other assets are dynamically imported.
  const APP_SHELL_FILES_WITH_REVISION = [
    { url: '/index.html', revision: CACHE_VERSION },
    { url: '/app.webmanifest', revision: CACHE_VERSION }, // Browser will fetch, SW can cache
    { url: '/img/logo.png', revision: CACHE_VERSION },
    { url: '/img/favicon.png', revision: CACHE_VERSION },
    { url: '/img/user.png', revision: CACHE_VERSION },
    { url: '/img/story.png', revision: CACHE_VERSION },
    { url: '/img/arrow-left.png', revision: CACHE_VERSION },
    { url: '/img/app-drawer.png', revision: CACHE_VERSION },
    { url: '/img/icons/icon-192x192.png', revision: CACHE_VERSION },
    { url: '/img/icons/icon-512x512.png', revision: CACHE_VERSION },
    // Shortcut icons - ensure these exist in public/img/icons/
    { url: '/img/icons/add-x512.png', revision: CACHE_VERSION },
    { url: '/img/icons/bookmark-x512.png', revision: CACHE_VERSION },
  ];

  workbox.precaching.precacheAndRoute(APP_SHELL_FILES_WITH_REVISION, {
    ignoreURLParametersMatching: [/.*/], // Ignore all URL parameters for precached assets
    directoryIndex: null, // Let NavigationRoute handle index.html for SPA
  });

  // --- Runtime Caching Strategies ---

  // Navigation Route for SPA (Single Page Application)
  // Always try network first, fallback to cached index.html
  const navigationRoute = new workbox.routing.NavigationRoute(
    async ({ event }) => {
      const networkFirst = new workbox.strategies.NetworkFirst({
        cacheName: `stories-app-cache-navigation-${CACHE_VERSION}`,
        plugins: [
          new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200], // Cache opaque responses and successful ones
          }),
        ],
      });

      try {
        // Try to fetch the navigation request (e.g., / or /#/some-page)
        const response = await networkFirst.handle({ event, request: event.request });
        return response;
      } catch (error) {
        console.warn(
          '[SW] NetworkFirst navigation failed, falling back to cached /index.html.',
          error,
        );
        // If network fails (offline or error), serve the precached index.html
        const precacheController = workbox.precaching.getPrecacheController();
        const cachedIndex = await precacheController.matchPrecache('/index.html');
        return cachedIndex || Response.error();
      }
    },
    {
      // Denylist Vite internal and development server paths
      denylist: [
        new RegExp('/@vite/'),
        new RegExp('/@fs/'),
        new RegExp('/src/'), // Avoid SW interfering with Vite serving src files in dev
        new RegExp('/node_modules/'), // Avoid SW interfering with Vite serving node_modules in dev
      ],
    },
  );
  workbox.routing.registerRoute(navigationRoute);

  // Cache CSS files (NetworkFirst: Get latest, fallback to cache)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style',
    new workbox.strategies.NetworkFirst({
      cacheName: `stories-app-cache-styles-${CACHE_VERSION}`,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  );

  // Cache JavaScript files (NetworkFirst: Get latest, fallback to cache)
  // Exclude Vite internal scripts
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'script' &&
      !(url.pathname.includes('/@vite/') || url.pathname.includes('/@fs/')),
    new workbox.strategies.NetworkFirst({
      cacheName: `stories-app-cache-scripts-${CACHE_VERSION}`,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  );

  // Cache Images (CacheFirst: Serve from cache if available, then network)
  // Ignores blob URLs
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'image' &&
      typeof url.pathname === 'string' && // Ensure pathname is a string
      !url.pathname.startsWith('blob:'), // Exclude blob URLs
    new workbox.strategies.CacheFirst({
      cacheName: `stories-app-cache-images-${CACHE_VERSION}`,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200], // Cache opaque and successful responses
        }),
        // No ExpirationPlugin here for now to simplify and avoid previous errors
      ],
    }),
  );

  // Cache Web Fonts from Google Fonts (StaleWhileRevalidate)
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `stories-app-cache-webfonts-${CACHE_VERSION}`,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  );

  // Handle API requests (NetworkFirst: Always try network, fallback to cache)
  const apiCacheStrategy = new workbox.strategies.NetworkFirst({
    cacheName: `stories-app-cache-api-${CACHE_VERSION}`,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200], // Cache successful responses and opaque responses
      }),
      // No ExpirationPlugin here for now
    ],
    networkTimeoutSeconds: 10, // Timeout for network requests
  });

  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://story-api.dicoding.dev' && url.pathname.startsWith('/v1/stories'),
    apiCacheStrategy,
  );

  // Explicitly ignore Vite internal routes (NetworkOnly)
  // This is important for HMR and development server to work correctly
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.includes('/@vite/') || url.pathname.includes('/@fs/'),
    new workbox.strategies.NetworkOnly(),
  );

  // --- Service Worker Lifecycle ---
  self.addEventListener('install', (event) => {
    console.log(`[SW] Install event (${CACHE_VERSION})`);
    // Force the waiting service worker to become the active service worker.
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener('activate', (event) => {
    console.log(`[SW] Activate event (${CACHE_VERSION})`);
    // Claim clients (open tabs) to take control immediately
    event.waitUntil(
      (async () => {
        await self.clients.claim();
        console.log(`[SW] Activated and clients claimed (${CACHE_VERSION})`);
        // Clean up old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => {
              // Delete caches that are not the current version's precache, runtime, or API cache
              return (
                name.startsWith('stories-app-cache-') &&
                !name.endsWith(CACHE_VERSION) && // Keep current version caches
                name !== workbox.core.cacheNames.precache && // Workbox internal precache (will have version)
                name !== workbox.core.cacheNames.runtime && // Workbox internal runtime (will have version)
                name !== `stories-app-cache-ga-${CACHE_VERSION}` && // Google Analytics cache if used
                name !== `stories-app-cache-navigation-${CACHE_VERSION}` &&
                name !== `stories-app-cache-styles-${CACHE_VERSION}` &&
                name !== `stories-app-cache-scripts-${CACHE_VERSION}` &&
                name !== `stories-app-cache-images-${CACHE_VERSION}` &&
                name !== `stories-app-cache-webfonts-${CACHE_VERSION}` &&
                name !== `stories-app-cache-api-${CACHE_VERSION}`
              );
            })
            .map((name) => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            }),
        );
      })(),
    );
  });

  // Handle push notifications
  self.addEventListener('push', (event) => {
    console.log('[SW] Push event received:', event);
    let notificationData = {
      title: 'New Notification',
      options: {
        body: 'You have a new message.',
        icon: '/img/icons/icon-192x192.png', // Default icon
        badge: '/img/icons/icon-192x192.png', // Default badge
      },
    };

    if (event.data) {
      try {
        const dataText = event.data.text();
        console.log('[SW] Push data text:', dataText);
        const parsedData = JSON.parse(dataText);
        console.log('[SW] Parsed push data:', parsedData);

        notificationData.title = parsedData.title || notificationData.title;
        if (parsedData.options) {
          notificationData.options.body = parsedData.options.body || notificationData.options.body;
          notificationData.options.icon = parsedData.options.icon || notificationData.options.icon;
          notificationData.options.badge =
            parsedData.options.badge || notificationData.options.badge;
          notificationData.options.image = parsedData.options.image; // Optional image
          notificationData.options.data = parsedData.options.data; // Custom data
          notificationData.options.actions = parsedData.options.actions; // Notification actions
        }
      } catch (e) {
        console.error('[SW] Error parsing push data:', e);
        notificationData.title = 'Push Data Error';
        notificationData.options.body = `Could not parse notification: ${event.data.text()}`;
      }
    }

    event.waitUntil(
      self.registration.showNotification(notificationData.title, notificationData.options),
    );
  });

  // Handle notification click
  self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click Received.', event.notification);
    event.notification.close();

    // Example: Open a specific URL or focus an existing window
    // This URL should be the base URL of your application or a relevant page
    const targetUrl =
      event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          // If a window for the app is already open, focus it
          // You might need to adjust the URL check if your app uses a specific path
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
    );
  });

  console.log(`[SW] Workbox setup complete. (${CACHE_VERSION})`);
} else {
  console.error(
    `[SW] Workbox could not be loaded. Offline capabilities may be unavailable. (${CACHE_VERSION})`,
  );
}
