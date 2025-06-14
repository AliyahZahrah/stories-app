import { formatDistanceToNow } from 'date-fns';

// Adapted from StoriesPage.js
function renderBookmarkedStoryCard(story, isBookmarked = true) {
  // isBookmarked is always true here
  const timeAgo = story.createdAt
    ? formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })
    : 'some time ago';
  const storyAuthor = story.name || 'Anonymous';

  const imageHtml = story.photoUrl
    ? `<img src="${story.photoUrl}" alt="Story image provided by ${storyAuthor}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" data-ai-hint="bookmarked story">
       <div class="story-card-placeholder-img" style="display:none;">Image not available</div>`
    : `<div class="story-card-placeholder-img">No Image Provided</div>`;

  // On this page, the button will always be "Unbookmark"
  const bookmarkButtonIcon = 'fas fa-bookmark';
  const bookmarkButtonText = 'Unbookmark';
  const bookmarkButtonClass = 'btn-bookmark bookmarked';

  return `
    <article class="story-card" aria-labelledby="story-title-${story.id}" data-story-id="${story.id}">
      ${imageHtml}
      <div class="story-card-content">
        <h3 id="story-title-${story.id}">Story by ${storyAuthor}</h3>
        <p class="author">By: ${storyAuthor}</p>
        <p class="description">${story.description ? story.description.substring(0, 100) + (story.description.length > 100 ? '...' : '') : 'No description.'}</p>
        <p class="date">Posted: ${timeAgo}</p>
      </div>
      <div class="story-card-actions">
        <a href="#/story/${story.id}" class="btn btn-secondary" aria-label="View details for story by ${storyAuthor}">View Details</a>
        <button class="${bookmarkButtonClass}" data-story-id="${story.id}" aria-label="${bookmarkButtonText} story by ${storyAuthor}">
            <i class="${bookmarkButtonIcon}" style="margin-right: 5px;"></i> ${bookmarkButtonText}
        </button>
      </div>
    </article>
  `;
}

export function renderBookmarkedStoriesPageLayout(container) {
  container.innerHTML = `
    <div class="stories-header">
      <h1>Bookmarked Stories</h1>
    </div>
    <section id="bookmarked-stories-grid" class="stories-grid" aria-label="List of bookmarked stories">
      <p class="loading-indicator">Loading bookmarked stories...</p>
    </section>
  `;
}

export function generateBookmarkedStoryCardsHtml(bookmarkedStories) {
  if (!bookmarkedStories || bookmarkedStories.length === 0) {
    return '<p class="text-center" style="padding:20px;">You have no bookmarked stories yet.</p>';
  }
  // Here, story objects already include isBookmarked=true, but renderBookmarkedStoryCard handles it
  return bookmarkedStories.map((story) => renderBookmarkedStoryCard(story)).join('');
}

export function getBookmarkedStoriesGrid(container) {
  return container.querySelector('#bookmarked-stories-grid');
}

export function displayBookmarkedStoriesInGrid(container, storiesHtml) {
  const grid = getBookmarkedStoriesGrid(container);
  if (grid) {
    grid.innerHTML = storiesHtml;
  } else {
    console.error('Bookmarked stories grid not found to display stories.');
  }
}

export function showLoadingIndicatorInBookmarksGrid(container) {
  const grid = getBookmarkedStoriesGrid(container);
  if (grid) {
    grid.innerHTML = '<p class="loading-indicator">Loading bookmarked stories...</p>';
  }
}

export function displayErrorInBookmarksGrid(container, message) {
  const grid = getBookmarkedStoriesGrid(container);
  if (grid) {
    grid.innerHTML = `<p class="error-message text-center" style="padding: 20px;">${message}</p>`;
  }
}

// Function to remove a story card from the bookmarks grid
export function removeStoryCardFromBookmarksView(storyId) {
  const cardElement = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
  if (cardElement) {
    cardElement.remove();
    // Check if grid is empty now
    const grid = document.querySelector('#bookmarked-stories-grid');
    if (grid && grid.children.length === 0) {
      grid.innerHTML =
        '<p class="text-center" style="padding:20px;">You have no bookmarked stories yet.</p>';
    }
  }
}
