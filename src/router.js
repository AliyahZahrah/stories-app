import LoginPresenter from './presenters/LoginPresenter.js';
import RegisterPresenter from './presenters/RegisterPresenter.js';
import StoriesPresenter from './presenters/StoriesPresenter.js';
import AddStoryPresenter from './presenters/AddStoryPresenter.js';
import StoryDetailPresenter from './presenters/StoryDetailPresenter.js';
import BookmarkedStoriesPresenter from './presenters/BookmarkedStoriesPresenter.js';
import { renderNotFoundPageContent } from './pages/NotFoundPage.js'; // Import Not Found Page

import { updateNavLinks } from './components/Navbar.js';
import { isAuthenticated, checkAuth } from './utils/auth.js';

const routes = {
  '/login': { PresenterClass: LoginPresenter, requiresAuth: false },
  '/register': { PresenterClass: RegisterPresenter, requiresAuth: false },
  '/stories': { PresenterClass: StoriesPresenter, requiresAuth: true },
  '/add-story': { PresenterClass: AddStoryPresenter, requiresAuth: true },
  '/story': { PresenterClass: StoryDetailPresenter, requiresAuth: true },
  '/bookmarks': { PresenterClass: BookmarkedStoriesPresenter, requiresAuth: true },
};

let activePresenter = null;

async function renderPage(currentPathHash) {
  checkAuth();

  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('App container not found!');
    return;
  }

  if (activePresenter && typeof activePresenter.cleanup === 'function') {
    try {
      activePresenter.cleanup();
    } catch (e) {
      console.error('Error during presenter cleanup:', e);
    }
  }
  activePresenter = null;

  let rawPath = currentPathHash.slice(1);
  if (rawPath === '' || rawPath === '/') {
    rawPath = isAuthenticated() ? '/stories' : '/login';
  }

  let lookupPath;
  let params = null;
  let segments;

  if (rawPath.startsWith('/')) {
    segments = rawPath.substring(1).split('/');
  } else {
    segments = rawPath.split('/');
  }

  if (segments.length > 0 && segments[0]) {
    lookupPath = `/${segments[0].toLowerCase()}`;
    if (segments.length > 1) {
      params = segments.slice(1).join('/');
    }
  } else if (segments.length === 1 && segments[0] === '') {
    console.warn('Edge case in path parsing, defaulting to login logic if possible.');
    lookupPath = isAuthenticated() ? '/stories' : '/login';
  } else {
    console.error(`Could not determine lookup path from rawPath: "${rawPath}". Defaulting...`);
    lookupPath = isAuthenticated() ? '/stories' : '/login';
  }

  const routeConfig = routes[lookupPath];

  if (routeConfig && routeConfig.PresenterClass) {
    if (routeConfig.requiresAuth && !isAuthenticated()) {
      navigateTo('/login');
      return;
    }
    if ((lookupPath === '/login' || lookupPath === '/register') && isAuthenticated()) {
      navigateTo('/stories');
      return;
    }

    try {
      const presenter = new routeConfig.PresenterClass(appContainer, params);
      activePresenter = presenter;
      await presenter.showPage();
    } catch (pageError) {
      console.error(
        `Error rendering page for path "${currentPathHash}" (lookup: "${lookupPath}"):`,
        pageError,
      );
      appContainer.innerHTML = `
        <div class="container" style="padding-top: 20px;">
          <h1 style="color: red; margin-bottom: 10px;">Oops! Something went wrong.</h1>
          <p>We encountered an error while trying to load this page.</p>
          <p><strong>Error details:</strong> ${pageError.message}</p>
          <p>Please try refreshing the page, or <a href="#/stories">go back to Stories</a>.</p>
          <pre style="white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ccc; padding: 10px; margin-top:10px; background-color: #f9f9f9;">${pageError.stack || 'No stack available'}</pre>
        </div>
      `;
    }
  } else {
    // If no routeConfig is found, render the Not Found page
    appContainer.innerHTML = renderNotFoundPageContent();
  }

  updateNavLinks();
  appContainer.focus();
}

function router() {
  const currentPathHash = window.location.hash || '#/';
  const appContainer = document.getElementById('app');

  if (document.startViewTransition) {
    document.startViewTransition(async () => {
      if (appContainer) appContainer.innerHTML = ''; // Clear content before transition
      await renderPage(currentPathHash);
    });
  } else {
    (async () => {
      if (appContainer) appContainer.innerHTML = ''; // Clear content
      await renderPage(currentPathHash);
    })();
  }
}

export function navigateTo(path) {
  if (window.location.hash === path && path !== '#/') {
    // If already on the same path, and it's not the root (which might auto-redirect), force render
    router();
    return;
  }
  window.location.hash = path;
}

export function initRouter() {
  window.addEventListener('hashchange', router);
  router(); // Initial call to render the page based on the current hash
}
