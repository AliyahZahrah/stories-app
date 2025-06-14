import { initRouter } from './router.js';
import {
  Navbar,
  initializeNavbarEventListeners,
  initializeGlobalDropdownListener,
} from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { checkAuth } from './utils/auth.js';
import 'sweetalert2/dist/sweetalert2.min.css';
// Removed: import { registerServiceWorkerAndSubscribe } from './utils/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    const headerContainer = document.getElementById('main-header');
    const footerContainer = document.getElementById('main-footer');
    const appContainer = document.getElementById('app');

    if (!headerContainer || !footerContainer || !appContainer) {
      console.error(
        'Critical error: One or more core DOM elements (header, footer, app) not found.',
      );
      document.body.innerHTML = `<div style="color: red; padding: 20px; font-family: sans-serif;">
        <h1>Application Initialization Error</h1>
        <p>Core HTML elements are missing. The application cannot start.</p>
        <p>Please ensure your index.html file contains elements with ids: main-header, main-footer, and app.</p>
      </div>`;
      return;
    }

    // Skip-to-content link functionality
    const mainContent = document.getElementById('app');
    const skipLink = document.querySelector('.skip-link');

    if (skipLink && mainContent) {
      skipLink.addEventListener('click', function (event) {
        event.preventDefault();
        skipLink.blur();
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      console.warn('Skip link or main content not found for accessibility feature.');
    }

    checkAuth();

    headerContainer.innerHTML = Navbar();
    initializeNavbarEventListeners();
    initializeGlobalDropdownListener();

    footerContainer.innerHTML = Footer();

    initRouter();

    // Initialize Push Notifications - MOVED to after successful login in auth.js
    // Check for feature support before attempting to register
    // This block is intentionally left here but commented out to show where it was.
    // The actual call is now in `src/utils/auth.js` inside `handleLogin`.
    /*
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Attempting to register service worker and subscribe for push notifications...');
        registerServiceWorkerAndSubscribe().catch(err => {
            console.error('Error during push notification setup:', err);
        });
    } else {
        console.warn('Push notifications, Service Workers, or Notification API not fully supported in this browser.');
    }
    */
    // Register service worker for PWA capabilities (caching, offline)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('[Main] Service Worker registered for PWA: ', registration);
          })
          .catch((registrationError) => {
            console.log('[Main] Service Worker registration for PWA failed: ', registrationError);
          });
      });
    }
  } catch (error) {
    console.error('Critical error during app initialization:', error);
    const appRoot = document.getElementById('app') || document.body;
    appRoot.innerHTML = `<div style="color: red; padding: 20px; font-family: sans-serif; background-color: #fff; border: 2px solid red; margin: 20px;">
      <h1>Application Error</h1>
      <p>A critical error occurred during application startup, and the app cannot continue.</p>
      <p><strong>Error:</strong> ${error.message}</p>
      <p>Please check the browser console for more details.</p>
      <pre style="white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ccc; padding: 10px; margin-top:10px; background-color: #f9f9f9;">${error.stack}</pre>
    </div>`;
    const header = document.getElementById('main-header');
    if (header) header.innerHTML = '';
    const footer = document.getElementById('main-footer');
    if (footer) footer.innerHTML = '';
  }
});
