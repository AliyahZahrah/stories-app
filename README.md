# **App Name**: Stories

## Core Features:

- Story Display: Display stories in a list format, including an image and textual description. Each story should include a map showing the location where the story was created, and also utilize the Story API data.
- Add Story: Allow users to add new stories with a description, image (taken from camera), and location (captured from a map click). The image should be stored using multipart/form-data, and latitude/longitude captured from map clicks
- Smooth Transitions: Implement smooth page transitions using View Transition API.

## Style Guidelines:

- Primary color: #323232 (Dark Gray).
- Secondary color: #FFF2F9 (Light Pink).
- Accent color: #FA4EAB (Bright Pink).
- Use a clean, grid-based layout to display stories in a visually appealing manner.
- Employ Font Awesome icons to enhance captions and provide visual cues.

# Stories App (Vite + Vanilla JS)

This is a Story Sharing application built with Vite and Vanilla JavaScript.

## Features

- User Registration and Login
- View a list of stories
- View story details
- Add new stories with photo (camera capture) and optional geolocation

## API Endpoint

The application interacts with the following API: `https://story-api.dicoding.dev/v1`

## Setup and Running

1.  **Clone the repository (if applicable)**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**

    ```bash
    npm run dev
    ```

    The application will typically be available at `http://localhost:9002`.

4.  **Build for production:**
    ```bash
    npm run build
    ```
    The production-ready files will be in the `dist` folder.

## Project Structure

- `index.html`: Main HTML entry point.
- `src/`: Contains the application's source code.
  - `main.js`: Main JavaScript entry point, initializes the router and core components.
  - `style.css`: Global CSS styles.
  - `router.js`: Simple client-side (hash-based) router.
  - `api.js`: Functions for interacting with the backend API.
  - `auth.js`: Handles authentication logic (login, register, logout, token management).
  - `store.js`: Simple global state management (e.g., current user).
  - `components/`: Reusable UI components (e.g., Navbar, Footer).
    - `Navbar.js`
    - `Footer.js`
  - `pages/`: Modules for rendering different application pages.
    - `LoginPage.js`
    - `RegisterPage.js`
    - `StoriesPage.js`
    - `AddStoryPage.js`
    - `StoryDetailPage.js`
    - `NotFoundPage.js`
- `vite.config.js`: Configuration file for Vite.
- `package.json`: Project dependencies and scripts.

## Notes on Geolocation and Camera

- The application uses the browser's `navigator.geolocation` API to get the user's current location when adding a story.
- The browser's `navigator.mediaDevices.getUserMedia` API is used for camera access to capture photos.
- Users will be prompted by their browser to grant permission for both location and camera access.
