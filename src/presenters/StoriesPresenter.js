import { getAllStories as fetchStoriesFromAPI } from '../api.js';
import { isAuthenticated } from '../utils/auth.js';
import { navigateTo } from '../router.js';
import {
  renderStoriesPageLayout,
  generateStoryCardsHtml,
  displayStoriesInGrid,
  showLoadingIndicatorInGrid,
  displayErrorInGrid,
  showOfflineInfoMessage,
  hideOfflineInfoMessage,
  updateStoryCardBookmarkButton,
  getStoriesGrid,
} from '../pages/StoriesPage.js';
import * as db from '../utils/db.js';
import Swal from 'sweetalert2';

class StoriesPresenter {
  constructor(viewContainer) {
    this._viewContainer = viewContainer;
    this._boundHandleToggleBookmark = this._handleToggleBookmark.bind(this);
    this._stories = []; // To store current stories with API data & bookmark status
  }

  async showPage() {
    if (!isAuthenticated()) {
      navigateTo('/login');
      return;
    }

    renderStoriesPageLayout(this._viewContainer);
    this._initEventListeners();
    showLoadingIndicatorInGrid(this._viewContainer);
    hideOfflineInfoMessage(this._viewContainer);

    try {
      const apiResponse = await fetchStoriesFromAPI(1, 20, 0); // Get all stories for now
      if (apiResponse.error || !apiResponse.listStory) {
        throw new Error(apiResponse.message || 'Could not load stories from API.');
      }

      // Update details of existing (likely bookmarked) stories in DB
      // This will NOT add new non-bookmarked stories from API to DB.
      await db.putStories(apiResponse.listStory);

      // Prepare stories for display by merging API data with local bookmark status
      const storiesWithBookmarkStatus = [];
      for (const apiStory of apiResponse.listStory) {
        const storyFromDb = await db.getStoryByIdFromDB(apiStory.id);
        storiesWithBookmarkStatus.push({
          story: apiStory,
          isBookmarked: storyFromDb ? storyFromDb.isBookmarked : false,
        });
      }

      this._stories = storiesWithBookmarkStatus.sort(
        (a, b) => new Date(b.story.createdAt) - new Date(a.story.createdAt),
      );

      const storiesHtml = generateStoryCardsHtml(this._stories);
      displayStoriesInGrid(this._viewContainer, storiesHtml);
    } catch (apiError) {
      console.warn(
        'Failed to fetch stories from API, trying to load bookmarked stories from IndexedDB:',
        apiError,
      );
      try {
        // When offline, show only bookmarked stories on the main stories page
        const bookmarkedStoriesFromDb = await db.getAllBookmarkedStories();

        if (bookmarkedStoriesFromDb && bookmarkedStoriesFromDb.length > 0) {
          this._stories = bookmarkedStoriesFromDb
            .map((story) => ({
              story, // story object from DB already has isBookmarked
              isBookmarked: story.isBookmarked,
            }))
            .sort((a, b) => new Date(b.story.createdAt) - new Date(a.story.createdAt));

          const storiesHtml = generateStoryCardsHtml(this._stories);
          displayStoriesInGrid(this._viewContainer, storiesHtml);
          showOfflineInfoMessage(
            this._viewContainer,
            'Showing bookmarked stories from offline cache. Some features may be limited.',
          );
        } else {
          displayErrorInGrid(
            this._viewContainer,
            `Error loading stories: ${apiError.message}. No bookmarked stories available offline.`,
          );
        }
      } catch (dbError) {
        console.error('Failed to fetch bookmarked stories from IndexedDB:', dbError);
        displayErrorInGrid(
          this._viewContainer,
          `Error loading stories: ${apiError.message}. Could not load bookmarked offline data either.`,
        );
      }
    }
  }

  _initEventListeners() {
    const storiesGrid = getStoriesGrid(this._viewContainer);
    if (storiesGrid) {
      storiesGrid.removeEventListener('click', this._boundHandleToggleBookmark); // Prevent duplicates
      storiesGrid.addEventListener('click', this._boundHandleToggleBookmark);
    }
  }

  async _handleToggleBookmark(event) {
    const bookmarkButton = event.target.closest('.btn-bookmark');
    if (!bookmarkButton) return;

    const storyId = bookmarkButton.dataset.storyId;
    if (!storyId) return;

    const cardElement = bookmarkButton.closest('.story-card');
    const storyDataWrapper = this._stories.find((s) => s.story.id === storyId);

    if (!storyDataWrapper || !storyDataWrapper.story) {
      Swal.fire('Error', 'Story data not found to toggle bookmark.', 'error');
      return;
    }

    const storyObject = storyDataWrapper.story; // This is the story data from API/DB
    const isCurrentlyBookmarked = storyDataWrapper.isBookmarked;

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
      // Pass the storyObject so db.toggleBookmarkStatus can add it if it's a new bookmark
      const newBookmarkStatus = await db.toggleBookmarkStatus(storyId, storyObject);

      if (newBookmarkStatus !== null) {
        if (cardElement) {
          updateStoryCardBookmarkButton(cardElement, newBookmarkStatus);
        }
        storyDataWrapper.isBookmarked = newBookmarkStatus; // Update internal state

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
            text: 'The story has been added to your bookmarks.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } else {
        Swal.fire('Error', 'Could not update bookmark status.', 'error');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Swal.fire('Error', 'An unexpected error occurred while updating bookmark.', 'error');
    }
  }

  cleanup() {
    const storiesGrid = getStoriesGrid(this._viewContainer);
    if (storiesGrid) {
      storiesGrid.removeEventListener('click', this._boundHandleToggleBookmark);
    }
    console.log('StoriesPresenter cleaned up.');
  }
}

export default StoriesPresenter;
