import Swal from 'sweetalert2';
import { VAPID_PUBLIC_KEY } from '../config.js';
import { subscribeToPushNotifications } from '../api.js'; // Import the API function

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendSubscriptionToServer(subscription) {
  try {
    const response = await subscribeToPushNotifications(subscription);
    if (response.error) {
      throw new Error(response.message || 'Failed to send subscription to server.');
    }
    console.log('Subscription sent to server successfully:', response);
    Swal.fire({
      title: 'Subscribed!',
      text: 'You will now receive push notifications for new stories and updates.',
      icon: 'success',
      confirmButtonColor: '#FA4EAB',
    });
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
    Swal.fire({
      title: 'Subscription Sync Failed',
      text: `Your browser subscription was successful, but we couldn't sync it with our server: ${error.message}. You might not receive notifications.`,
      icon: 'warning', // Use warning as browser part succeeded
      confirmButtonColor: '#FA4EAB',
    });
  }
}

async function registerServiceWorkerAndSubscribe() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported.');
    return;
  }
  if (!('PushManager' in window)) {
    console.warn('Push API not supported.');
    return;
  }
  if (!('Notification' in window)) {
    console.warn('Notification API not supported.');
    return;
  }

  if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE_FROM_API_DOCS' || !VAPID_PUBLIC_KEY) {
    console.error('VAPID_PUBLIC_KEY is not set. Please set it in src/config.js');
    Swal.fire({
      title: 'Push Notification Setup Error',
      text: 'VAPID Public Key is not configured. Push notifications will not work.',
      icon: 'error',
      confirmButtonColor: '#FA4EAB',
    });
    return;
  }

  try {
    const swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service Worker registered successfully:', swRegistration);

    await navigator.serviceWorker.ready;
    console.log('Service Worker is active and ready.');

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted by the user.');
      // No Swal here if permission denied, as it can be intrusive if user explicitly denies.
      // If they denied, they likely don't want more popups about it.
      // Consider a less intrusive UI element if you want to prompt again later.
      return;
    }

    console.log('Notification permission granted.');

    let currentSubscription = await swRegistration.pushManager.getSubscription();
    if (currentSubscription) {
      console.log('User is already subscribed:', currentSubscription);
      // Optionally, re-send to backend to ensure it's up-to-date,
      // or just inform the user they are already subscribed.
      // For simplicity, we'll assume if it exists, it's synced.
      // You might want to add logic here if re-syncing is important.
      // Swal.fire({
      //     title: 'Already Subscribed',
      //     text: 'You are already set up to receive notifications.',
      //     icon: 'info',
      //     confirmButtonColor: '#FA4EAB'
      // });
      return currentSubscription; // Already subscribed, nothing more to do client-side.
    }

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });
    console.log('User subscribed with browser successfully:', subscription);

    // Send the subscription to your backend server
    await sendSubscriptionToServer(subscription);
    // The Swal success message is now inside sendSubscriptionToServer

    return subscription;
  } catch (error) {
    console.error('Service Worker registration or Push Subscription failed:', error);
    // Avoid showing a generic Swal error if permission was denied earlier,
    // as that's a specific user choice.
    if (Notification.permission === 'denied') {
      console.warn('Subscription failed because notification permission was denied.');
    } else {
      Swal.fire({
        title: 'Subscription Failed',
        text: `Could not subscribe to notifications: ${error.message}. Please try again later or check console.`,
        icon: 'error',
        confirmButtonColor: '#FA4EAB',
      });
    }
  }
}

export { registerServiceWorkerAndSubscribe };
