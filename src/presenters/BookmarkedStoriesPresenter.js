import { isAuthenticated } from '../utils/auth.js';
import { navigateTo } from '../router.js';
import {
  renderBookmarkedStoriesPageLayout,
  generateBookmarkedStoryCardsHtml,
  displayBookmarkedStoriesInGrid,
  showLoadingIndicatorInBookmarksGrid,
  displayErrorInBookmarksGrid,
  getBookmarkedStoriesGrid,
  // removeStoryCardFromBookmarksView, // No longer used directly after unbookmark
} from '../pages/BookmarkedStoriesPage.js';
import * as db from '../utils/db.js';
import Swal from 'sweetalert2';

class BookmarkedStoriesPresenter {
  constructor(viewContainer) {
    this._viewContainer = viewContainer;
    this._boundHandleToggleBookmark = this._handleToggleBookmark.bind(this);
  }

  async _loadAndDisplayBookmarkedStories() {
    showLoadingIndicatorInBookmarksGrid(this._viewContainer);
    try {
      const bookmarkedStories = await db.getAllBookmarkedStories();
      if (bookmarkedStories && bookmarkedStories.length > 0) {
        const storiesHtml = generateBookmarkedStoryCardsHtml(bookmarkedStories);
        displayBookmarkedStoriesInGrid(this._viewContainer, storiesHtml);
      } else {
        displayBookmarkedStoriesInGrid(
          this._viewContainer,
          '<p class="text-center" style="padding:20px;">You have no bookmarked stories yet.</p>',
        );
      }
    } catch (error) {
      console.error('Error fetching bookmarked stories:', error);
      displayErrorInBookmarksGrid(this._viewContainer, 'Could not load bookmarked stories.');
    }
  }

  async showPage() {
    if (!isAuthenticated()) {
      navigateTo('/login');
      return;
    }

    renderBookmarkedStoriesPageLayout(this._viewContainer);
    this._initEventListeners(); // Call after layout is rendered
    await this._loadAndDisplayBookmarkedStories();
  }

  _initEventListeners() {
    const storiesGrid = getBookmarkedStoriesGrid(this._viewContainer);
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

    // On this page, it's always an "unbookmark" action
    const result = await Swal.fire({
      title: 'Unbookmark Story?',
      text: 'Are you sure you want to remove this story from your bookmarks?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FA4EAB',
      cancelButtonColor: '#323232',
      confirmButtonText: 'Yes, unbookmark it!',
    });

    if (!result.isConfirmed) {
      return; // User cancelled
    }

    try {
      const newBookmarkStatus = await db.toggleBookmarkStatus(storyId); // This will unbookmark it
      if (newBookmarkStatus === false) {
        // Successfully unbookmarked
        // removeStoryCardFromBookmarksView(storyId); // Replaced with full re-render
        await this._loadAndDisplayBookmarkedStories(); // Re-fetch and re-render the grid
        Swal.fire({
          title: 'Unbookmarked!',
          text: 'The story has been removed from your bookmarks.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } else if (newBookmarkStatus === null) {
        // Story not found or error in toggle
        Swal.fire('Error', 'Could not update bookmark status for this story.', 'error');
      }
    } catch (error) {
      console.error('Error toggling bookmark from bookmarks page:', error);
      Swal.fire('Error', 'An unexpected error occurred.', 'error');
    }
  }

  cleanup() {
    const storiesGrid = getBookmarkedStoriesGrid(this._viewContainer);
    if (storiesGrid) {
      storiesGrid.removeEventListener('click', this._boundHandleToggleBookmark);
    }
    console.log('BookmarkedStoriesPresenter cleaned up.');
  }
}

export default BookmarkedStoriesPresenter;
