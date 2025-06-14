import { isAuthenticated, handleLogout } from '../utils/auth.js';
import { getUser } from '../store.js';

export function Navbar() {
  const user = getUser();
  const loggedIn = isAuthenticated();
  let finalNavItemsHtml = '';

  if (loggedIn) {
    const userName = user && user.name ? user.name : 'User';

    // Item 1: Drawer User Greeting (Mobile Only)
    finalNavItemsHtml += `
        <li class="drawer-user-greeting-item">
          <img src="/img/user.png" alt="User" class="drawer-user-avatar">
          <span>Hi, ${userName}!</span>
        </li>
    `;

    // Standard Nav Links (Story, Add Story, Bookmarks)
    finalNavItemsHtml += `
        <li><a href="#/stories" class="${window.location.hash === '#/stories' || window.location.hash === '#/' || window.location.hash === '' ? 'active' : ''}">Story</a></li>
        <li><a href="#/add-story" class="${window.location.hash === '#/add-story' ? 'active' : ''}">Add Story</a></li>
        <li><a href="#/bookmarks" class="${window.location.hash === '#/bookmarks' ? 'active' : ''}">Bookmarks</a></li>
    `;

    // Desktop Profile Dropdown (Desktop Only)
    finalNavItemsHtml += `
        <li class="profile-dropdown-container">
          <img src="/img/user.png" alt="User Profile" class="profile-avatar" id="profile-avatar">
          <div class="dropdown-content" id="profile-dropdown">
             <div class="dropdown-user-info">Hi, ${userName}!</div>
             <a href="#" id="logout-button-dropdown">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px; vertical-align: middle;">
                <path d="M14 8V6C14 4.89543 13.1046 4 12 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H12C13.1046 20 14 19.1046 14 18V16M10 12H21M21 12L18 15M21 12L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Logout
             </a>
          </div>
        </li>
    `;

    // Drawer Logout Link (Mobile Only)
    finalNavItemsHtml += `
        <li class="drawer-logout-item">
          <a href="#" id="logout-button-drawer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px; vertical-align: middle;">
                <path d="M14 8V6C14 4.89543 13.1046 4 12 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H12C13.1046 20 14 19.1046 14 18V16M10 12H21M21 12L18 15M21 12L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Logout
          </a>
        </li>
    `;
  } else {
    finalNavItemsHtml = `
      <li><a href="#/login" class="${window.location.hash === '#/login' ? 'active' : ''}">Login</a></li>
      <li><a href="#/register" class="${window.location.hash === '#/register' ? 'active' : ''}">Register</a></li>
    `;
  }

  const hamburgerButtonHtml = `
    <button id="hamburger-menu" class="hamburger-button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="nav-links">
      <img src="/img/app-drawer.png" alt="Menu" class="hamburger-icon-image">
    </button>
  `;

  return `
    <nav>
      <a href="#/" class="logo">
        <img src="/img/logo.png" alt="Stories App Logo" style="height: 40px; vertical-align: middle;">
      </a>
      ${hamburgerButtonHtml}
      <ul id="nav-links" class="nav-menu">
        ${finalNavItemsHtml}
      </ul>
    </nav>
  `;
}

export function updateNavLinks() {
  const navElement = document.querySelector('#main-header nav');
  if (!navElement) {
    return;
  }

  let navLinksContainer = navElement.querySelector('#nav-links');
  if (!navLinksContainer) {
    console.warn(
      'updateNavLinks: #nav-links container not found. Navbar might not be fully initialized.',
    );
    return;
  }

  const user = getUser();
  const loggedIn = isAuthenticated();
  let finalNavItemsHtml = '';

  if (loggedIn) {
    const userName = user && user.name ? user.name : 'User';

    // Item 1: Drawer User Greeting (Mobile Only)
    finalNavItemsHtml += `
            <li class="drawer-user-greeting-item">
              <img src="/img/user.png" alt="User" class="drawer-user-avatar">
              <span>Hi, ${userName}!</span>
            </li>
        `;

    // Standard Nav Links (Story, Add Story, Bookmarks)
    finalNavItemsHtml += `
            <li><a href="#/stories" class="${window.location.hash === '#/stories' || window.location.hash === '#/' || window.location.hash === '' ? 'active' : ''}">Story</a></li>
            <li><a href="#/add-story" class="${window.location.hash === '#/add-story' ? 'active' : ''}">Add Story</a></li>
            <li><a href="#/bookmarks" class="${window.location.hash === '#/bookmarks' ? 'active' : ''}">Bookmarks</a></li>
        `;

    // Desktop Profile Dropdown (Desktop Only)
    finalNavItemsHtml += `
            <li class="profile-dropdown-container">
              <img src="/img/user.png" alt="User Profile" class="profile-avatar" id="profile-avatar">
              <div class="dropdown-content" id="profile-dropdown">
                 <div class="dropdown-user-info">Hi, ${userName}!</div>
                 <a href="#" id="logout-button-dropdown">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px; vertical-align: middle;">
                    <path d="M14 8V6C14 4.89543 13.1046 4 12 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H12C13.1046 20 14 19.1046 14 18V16M10 12H21M21 12L18 15M21 12L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Logout
                 </a>
              </div>
            </li>
        `;
    // Drawer Logout Link (Mobile Only)
    finalNavItemsHtml += `
            <li class="drawer-logout-item">
              <a href="#" id="logout-button-drawer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px; vertical-align: middle;">
                    <path d="M14 8V6C14 4.89543 13.1046 4 12 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H12C13.1046 20 14 19.1046 14 18V16M10 12H21M21 12L18 15M21 12L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Logout
              </a>
            </li>
        `;
  } else {
    finalNavItemsHtml = `
            <li><a href="#/login" class="${window.location.hash === '#/login' ? 'active' : ''}">Login</a></li>
            <li><a href="#/register" class="${window.location.hash === '#/register' ? 'active' : ''}">Register</a></li>
        `;
  }
  navLinksContainer.innerHTML = finalNavItemsHtml;
}

function initializeNavbarEventListeners() {
  const headerElementForListeners = document.getElementById('main-header');
  if (headerElementForListeners) {
    headerElementForListeners.removeEventListener('click', handleNavbarClick);
    headerElementForListeners.addEventListener('click', handleNavbarClick);

    const hamburgerButton = headerElementForListeners.querySelector('#hamburger-menu');
    const navMenu = headerElementForListeners.querySelector('#nav-links');

    if (hamburgerButton && navMenu) {
      hamburgerButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true' || false;
        hamburgerButton.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('drawer-open');
        document.body.classList.toggle('no-scroll');
      });

      navMenu.addEventListener('click', (event) => {
        const targetLink = event.target.closest('a');
        if (targetLink && navMenu.classList.contains('drawer-open')) {
          const isNavigatingLink =
            targetLink.getAttribute('href') && targetLink.getAttribute('href').startsWith('#/');
          const isLogoutButton = targetLink.id === 'logout-button-drawer';

          if (isNavigatingLink && !isLogoutButton) {
            hamburgerButton.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('drawer-open');
            document.body.classList.remove('no-scroll');
          }
        }
      });
    }
  }
}

function handleNavbarClick(event) {
  const avatar = event.target.closest('#profile-avatar');
  const headerElement = event.currentTarget;

  if (avatar) {
    const dropdownContainer = headerElement.querySelector('.profile-dropdown-container');
    if (dropdownContainer) {
      dropdownContainer.classList.toggle('open');
    }
    return;
  }

  const logoutButtonDesktop = event.target.closest('#logout-button-dropdown');
  const logoutButtonDrawer = event.target.closest('#logout-button-drawer');

  if (logoutButtonDesktop || logoutButtonDrawer) {
    event.preventDefault();
    handleLogout();
    const navMenu = headerElement.querySelector('#nav-links');
    const hamburgerButton = headerElement.querySelector('#hamburger-menu');
    if (navMenu && navMenu.classList.contains('drawer-open') && hamburgerButton) {
      hamburgerButton.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('drawer-open');
      document.body.classList.remove('no-scroll');
    }
    const dropdownContainer = headerElement.querySelector('.profile-dropdown-container.open');
    if (dropdownContainer) {
      dropdownContainer.classList.remove('open');
    }
    return;
  }
}

let globalClickListenerAttached = false;

function initializeGlobalDropdownListener() {
  if (!globalClickListenerAttached) {
    document.addEventListener('click', (event) => {
      const openDropdown = document.querySelector('.profile-dropdown-container.open');
      if (openDropdown) {
        const isAvatarClick = event.target.closest('#profile-avatar');
        const isDropdownClick = event.target.closest('.dropdown-content');

        if (!isAvatarClick && !isDropdownClick) {
          openDropdown.classList.remove('open');
        }
      }
    });
    globalClickListenerAttached = true;
  }
}

export { initializeNavbarEventListeners, initializeGlobalDropdownListener };
