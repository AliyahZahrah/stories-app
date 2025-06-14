import { loginUser as apiLogin, registerUser as apiRegister } from '../api.js';
import { navigateTo } from '../router.js';
import { updateUserState, clearUserState } from '../store.js'; // Removed getUser as it's not used here
import { updateNavLinks } from '../components/Navbar.js';
import { ACCESS_TOKEN_KEY, USER_NAME_KEY, USER_ID_KEY } from '../config.js';
import { registerServiceWorkerAndSubscribe } from './notifications.js'; // Import for push notifications

export async function handleLogin(email, password) {
  try {
    const response = await apiLogin(email, password);
    if (!response.error && response.loginResult) {
      localStorage.setItem(ACCESS_TOKEN_KEY, response.loginResult.token);
      localStorage.setItem(USER_NAME_KEY, response.loginResult.name);
      localStorage.setItem(USER_ID_KEY, response.loginResult.userId);
      updateUserState({
        token: response.loginResult.token,
        name: response.loginResult.name,
        id: response.loginResult.userId,
      });
      updateNavLinks(); // Update nav links specifically after successful login
      navigateTo('/'); // Navigate to stories page after login

      // Attempt to subscribe to push notifications after successful login
      if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
        console.log(
          'Attempting to register service worker and subscribe for push notifications post-login...',
        );
        registerServiceWorkerAndSubscribe().catch((err) => {
          console.error('Error during post-login push notification setup:', err);
        });
      } else {
        console.warn(
          'Push notifications, Service Workers, or Notification API not fully supported in this browser (checked post-login).',
        );
      }

      return { success: true };
    } else {
      return { success: false, message: response.message || 'Login failed' };
    }
  } catch (error) {
    return { success: false, message: error.message || 'An unexpected error occurred' };
  }
}

export async function handleRegister(name, email, password) {
  try {
    const response = await apiRegister(name, email, password);
    if (!response.error) {
      // Attempt to subscribe to push notifications after successful registration
      // Note: Sending subscription to server will likely fail here as user is not logged in yet (no token)
      // It will be re-attempted after successful login.
      if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
        console.log(
          'Attempting to register service worker and subscribe for push notifications post-registration...',
        );
        registerServiceWorkerAndSubscribe().catch((err) => {
          // Not awaiting, let it run in background
          console.error('Error during post-registration push notification setup:', err);
        });
      } else {
        console.warn(
          'Push notifications, Service Workers, or Notification API not fully supported in this browser (checked post-registration).',
        );
      }

      navigateTo('/login');
      return { success: true, message: 'Registration successful! Please login.' };
    } else {
      return { success: false, message: response.message || 'Registration failed' };
    }
  } catch (error) {
    return { success: false, message: error.message || 'An unexpected error occurred' };
  }
}

export function handleLogout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_ID_KEY);
  clearUserState();
  updateNavLinks(); // Update nav links specifically after logout
  navigateTo('/login');
}

export function checkAuth() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const name = localStorage.getItem(USER_NAME_KEY);
  const id = localStorage.getItem(USER_ID_KEY);
  if (token && name && id) {
    updateUserState({ token, name, id });
  } else {
    // If any item is missing, clear all to ensure consistent state
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_ID_KEY);
    clearUserState();
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
}
