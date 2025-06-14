import { API_BASE_URL, ACCESS_TOKEN_KEY } from './config.js';

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Content-Type is not set for FormData, browser handles it.
  // For JSON, set it if not already set in options.
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If parsing fails, use statusText or a generic message.
      // This is important if the server returns non-JSON for some errors.
      data = {
        error: true,
        message: response.statusText || `HTTP ${response.status} - Failed to parse JSON response`,
      };
    }

    if (!response.ok) {
      // console.error('API Error:', data ? data.message : `HTTP error! status: ${response.status}`);
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    // console.error('Fetch API Error:', error.message);
    throw error;
  }
}

export const loginUser = (email, password) => {
  return fetchAPI('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const registerUser = (name, email, password) => {
  return fetchAPI('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
};

export const getAllStories = (page = 1, size = 10, location = 0) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (location === 1) {
    queryParams.append('location', '1');
  }
  return fetchAPI(`/stories?${queryParams.toString()}`);
};

export const getStoryById = (storyId) => {
  return fetchAPI(`/stories/${storyId}`);
};

export const addNewStory = (formData) => {
  return fetchAPI('/stories', {
    method: 'POST',
    body: formData, // FormData, Content-Type will be set by browser
  });
};

export const subscribeToPushNotifications = (subscription) => {
  const subscriptionData = subscription.toJSON(); // Get plain object
  return fetchAPI('/notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      endpoint: subscriptionData.endpoint,
      keys: {
        // Ensure keys is an object as per API spec
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth,
      },
    }),
  });
};

export const unsubscribeFromPushNotifications = (endpoint) => {
  return fetchAPI('/notifications/subscribe', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });
};
