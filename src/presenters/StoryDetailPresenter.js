import { getStoryById as fetchStoryFromAPI } from '../api.js';
import { isAuthenticated } from '../utils/auth.js';
import { navigateTo } from '../router.js';
import {
  renderStoryDetailPageLayout,
  populateStoryDataInView,
  setContainerHtml,
  setMapContainerText,
  updateLocationNameInView,
  setupMapLayerControlInDetailView,
  getDetailBookmarkButton,
  updateDetailBookmarkButton,
} from '../pages/StoryDetailPage.js';
import { Map, Marker, Popup, config as MapTilerConfig, MapStyle } from '@maptiler/sdk';
import * as db from '../utils/db.js';
import Swal from 'sweetalert2';

const MAPTILER_API_KEY = 'FBElmE3wCPbxGkZ0pppo'; // Replace with your MapTiler API key
MapTilerConfig.apiKey = MAPTILER_API_KEY;

class StoryDetailPresenter {
  constructor(viewContainer, storyId) {
    this._viewContainer = viewContainer;
    this._storyId = storyId;
    this._storyData = null; // To store the current story data including API data and bookmark status
    this._detailMapInstance = null;
    this._detailMapMarker = null;
    this._detailMapPopup = null;
    this._boundHandleToggleBookmark = this._handleToggleBookmark.bind(this);
  }

  async showPage() {
    if (!isAuthenticated()) {
      navigateTo('/login');
      return;
    }
    if (!this._storyId) {
      setContainerHtml(this._viewContainer, `<p class="error-message">Story ID is missing.</p>`);
      return;
    }

    renderStoryDetailPageLayout(this._viewContainer, true); // Show loading indicator

    let storyFromApi;
    let bookmarkStatusFromDb = false;

    try {
      const response = await fetchStoryFromAPI(this._storyId);
      if (response.error || !response.story) {
        throw new Error(response.message || 'Story not found via API.');
      }
      storyFromApi = response.story;

      // Get bookmark status from DB
      const storyInDb = await db.getStoryByIdFromDB(this._storyId);
      if (storyInDb) {
        bookmarkStatusFromDb = storyInDb.isBookmarked;
        // If bookmarked, update its details from API in DB
        if (storyInDb.isBookmarked) {
          await db.putStories([storyFromApi]); // putStories preserves bookmark status
        }
      }
      this._storyData = { ...storyFromApi, isBookmarked: bookmarkStatusFromDb };
    } catch (apiError) {
      console.warn(
        `[StoryDetailPresenter] API fetch failed for story ${this._storyId}:`,
        apiError.message,
        'Attempting to load from IndexedDB.',
      );
      // Try to load from DB if API fails
      const storyInDb = await db.getStoryByIdFromDB(this._storyId);
      if (storyInDb) {
        this._storyData = storyInDb; // This already includes isBookmarked status
      } else {
        renderStoryDetailPageLayout(this._viewContainer, false);
        setContainerHtml(
          this._viewContainer,
          `<p class="error-message text-center" style="padding: 20px;">Could not load story details.<br>Story not found in API or offline cache.</p>`,
        );
        return;
      }
    }

    if (!this._storyData) {
      // Should be redundant due to above checks, but as a safeguard
      renderStoryDetailPageLayout(this._viewContainer, false);
      setContainerHtml(
        this._viewContainer,
        `<p class="error-message text-center" style="padding: 20px;">Failed to load story data.</p>`,
      );
      return;
    }

    renderStoryDetailPageLayout(this._viewContainer, false); // Render actual layout
    populateStoryDataInView(this._viewContainer, this._storyData);
    this._setupLocationAndMap(this._storyData);
    this._initEventListeners();
  }

  _initEventListeners() {
    const bookmarkButton = getDetailBookmarkButton(this._viewContainer);
    if (bookmarkButton) {
      bookmarkButton.removeEventListener('click', this._boundHandleToggleBookmark);
      bookmarkButton.addEventListener('click', this._boundHandleToggleBookmark);
    }
  }

  async _handleToggleBookmark() {
    if (!this._storyData || !this._storyData.id) return;

    const isCurrentlyBookmarked = this._storyData.isBookmarked;

    if (isCurrentlyBookmarked) {
      const result = await Swal.fire({
        title: 'Unbookmark Story?',
        text: 'Are you sure you want to remove this story from your bookmarks?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#FA4EAB',
        cancelButtonColor: '#323232',
        confirmButtonText: 'Yes, unbookmark it!',
      });
      if (!result.isConfirmed) return;
    }

    try {
      // Pass the full _storyData so it can be added to DB if it's a new bookmark
      const newBookmarkStatus = await db.toggleBookmarkStatus(this._storyData.id, this._storyData);

      if (newBookmarkStatus !== null) {
        this._storyData.isBookmarked = newBookmarkStatus;
        updateDetailBookmarkButton(this._viewContainer, newBookmarkStatus);
        if (isCurrentlyBookmarked && !newBookmarkStatus) {
          Swal.fire({
            title: 'Unbookmarked!',
            text: 'The story has been removed from your bookmarks.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          });
        } else if (!isCurrentlyBookmarked && newBookmarkStatus) {
          Swal.fire({
            title: 'Bookmarked!',
            text: 'The story has been added to your bookmarks and saved for offline viewing.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } else {
        Swal.fire('Error', 'Could not update bookmark status.', 'error');
      }
    } catch (error) {
      console.error('Error toggling bookmark on detail page:', error);
      Swal.fire('Error', 'An unexpected error occurred.', 'error');
    }
  }

  async _fetchLocationName(lat, lon) {
    if (!MAPTILER_API_KEY) return 'Location name not available (API key missing)';
    const url = `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${MAPTILER_API_KEY}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[StoryDetailPresenter] Geocoding API error: ${response.status}`);
        return 'Location name not available (fetch error)';
      }
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        let bestName = data.features[0].place_name;
        if (data.features[0].context) {
          const cityFeature = data.features[0].context.find(
            (c) => c.id.startsWith('place.') || c.id.startsWith('locality.'),
          );
          if (cityFeature) {
            bestName = cityFeature.text;
            const countryFeature = data.features[0].context.find((c) =>
              c.id.startsWith('country.'),
            );
            if (countryFeature) bestName += `, ${countryFeature.text}`;
          }
        }
        return bestName || 'Unknown location';
      }
      return 'Location name not found';
    } catch (error) {
      console.error('[StoryDetailPresenter] Error fetching location name:', error);
      return 'Location name not available (error)';
    }
  }

  async _setupLocationAndMap(story) {
    const isValidLatitude = typeof story.lat === 'number' && !isNaN(story.lat);
    const isValidLongitude = typeof story.lon === 'number' && !isNaN(story.lon);
    const storyDetailMapDiv = this._viewContainer.querySelector('#story-detail-map-container');

    if (isValidLatitude && isValidLongitude && storyDetailMapDiv) {
      updateLocationNameInView(this._viewContainer, 'Loading location name...');
      try {
        const locationName = await this._fetchLocationName(story.lat, story.lon);
        updateLocationNameInView(this._viewContainer, locationName);
      } catch (e) {
        console.error('[StoryDetailPresenter] Error setting up location name:', e);
        updateLocationNameInView(this._viewContainer, 'Could not load location name.');
      }

      setMapContainerText(this._viewContainer, '', true);

      try {
        if (!MapTilerConfig.apiKey) {
          throw new Error('MapTiler API Key is missing.');
        }
        this._cleanupDetailMap();
        this._detailMapInstance = new Map({
          container: storyDetailMapDiv,
          center: [story.lon, story.lat],
          zoom: 14,
          interactive: true,
          style: MapStyle.STREETS,
        });

        this._detailMapMarker = new Marker({ color: '#FA4EAB' })
          .setLngLat([story.lon, story.lat])
          .addTo(this._detailMapInstance);

        this._detailMapPopup = new Popup({ offset: 25 })
          .setLngLat([story.lon, story.lat])
          .setHTML(
            `<h3>Story Location</h3><p>${story.description ? story.description.substring(0, 50) + '...' : 'No description'}<br>By: ${story.name || 'Anonymous'}</p>`,
          );

        this._detailMapMarker.setPopup(this._detailMapPopup);
        setupMapLayerControlInDetailView(
          this._detailMapInstance,
          storyDetailMapDiv.id,
          storyDetailMapDiv,
        );
      } catch (mapError) {
        console.error('[StoryDetailPresenter] Error initializing map:', mapError);
        setMapContainerText(
          this._viewContainer,
          `<p class="text-center error-message" style="padding-top:20px;">Map display failed: ${mapError.message}</p>`,
        );
      }
    } else {
      updateLocationNameInView(this._viewContainer, 'No location data provided');
      setMapContainerText(
        this._viewContainer,
        '<p class="text-center" style="padding-top:20px; color: #777;">Map not available for this story (no coordinates).</p>',
      );
    }
  }

  _cleanupDetailMap() {
    if (this._detailMapPopup) {
      this._detailMapPopup.remove();
      this._detailMapPopup = null;
    }
    if (this._detailMapMarker) {
      this._detailMapMarker.remove();
      this._detailMapMarker = null;
    }
    if (this._detailMapInstance) {
      try {
        this._detailMapInstance.remove();
      } catch (e) {
        console.warn('[StoryDetailPresenter] Could not remove map instance:', e);
      }
      this._detailMapInstance = null;
    }
  }

  cleanup() {
    this._cleanupDetailMap();
    const bookmarkButton = getDetailBookmarkButton(this._viewContainer);
    if (bookmarkButton) {
      bookmarkButton.removeEventListener('click', this._boundHandleToggleBookmark);
    }
    console.log('StoryDetailPresenter cleaned up.');
  }
}

export default StoryDetailPresenter;
