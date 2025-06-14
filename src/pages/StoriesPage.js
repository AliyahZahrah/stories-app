import { formatDistanceToNow } from 'date-fns';

function renderStoryCard(story, isBookmarked) {
  const timeAgo = story.createdAt
    ? formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })
    : 'some time ago';
  const storyAuthor = story.name || 'Anonymous';

  const imageHtml = story.photoUrl
    ? `<img src="${story.photoUrl}" alt="Story image provided by ${storyAuthor}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" data-ai-hint="story user">
       <div class="story-card-placeholder-img" style="display:none;">Image not available</div>`
    : `<div class="story-card-placeholder-img">No Image Provided</div>`;

  const bookmarkButtonIcon = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
  const bookmarkButtonText = isBookmarked ? 'Unbookmark' : 'Bookmark';
  const bookmarkButtonClass = isBookmarked ? 'btn-bookmark bookmarked' : 'btn-bookmark';

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

export function renderStoriesPageLayout(container) {
  container.innerHTML = `
    <div class="stories-header">
      <h1>All Stories</h1>
      <div class="stories-header-actions">
        <a href="#/add-story" class="btn btn-add-story">
          <img src="/img/story.png" alt="" class="icon-story" aria-hidden="true">
          Add New Story
        </a>
      </div>
    </div>
    <div id="offline-info-message" class="alert alert-info" style="display:none; margin: 10px 20px;"></div>
    <section id="stories-grid" class="stories-grid" aria-label="List of stories">
      <p class="loading-indicator">Loading stories...</p>
    </section>
  `;
}

// stories is now an array of { story: Story, isBookmarked: boolean }
export function generateStoryCardsHtml(storiesWithBookmarkStatus) {
  if (!storiesWithBookmarkStatus || storiesWithBookmarkStatus.length === 0) {
    return '<p>No stories found. Why not add one?</p>';
  }
  return storiesWithBookmarkStatus
    .map((item) => renderStoryCard(item.story, item.isBookmarked))
    .join('');
}

export function getStoriesGrid(container) {
  return container.querySelector('#stories-grid');
}

export function getOfflineInfoMessageDiv(container) {
  return container.querySelector('#offline-info-message');
}

export function showOfflineInfoMessage(container, message) {
  const div = getOfflineInfoMessageDiv(container);
  if (div) {
    div.textContent = message;
    div.style.display = 'block';
  }
}

export function hideOfflineInfoMessage(container) {
  const div = getOfflineInfoMessageDiv(container);
  if (div) {
    div.style.display = 'none';
  }
}

export function displayStoriesInGrid(container, storiesHtml) {
  const grid = getStoriesGrid(container);
  if (grid) {
    grid.innerHTML = storiesHtml;
  } else {
    console.error('Stories grid not found to display stories.');
  }
}

export function showLoadingIndicatorInGrid(container) {
  const grid = getStoriesGrid(container);
  if (grid) {
    grid.innerHTML = '<p class="loading-indicator">Loading stories...</p>';
  }
}

export function displayErrorInGrid(container, message) {
  const grid = getStoriesGrid(container);
  if (grid) {
    grid.innerHTML = `<p class="error-message text-center" style="padding: 20px;">${message}</p>`;
  }
}

// Function to update a single story card's bookmark button
export function updateStoryCardBookmarkButton(cardElement, isBookmarked) {
  if (!cardElement) return;
  const button = cardElement.querySelector('.btn-bookmark');
  if (!button) return;

  const icon = button.querySelector('i');
  if (isBookmarked) {
    button.classList.add('bookmarked');
    button.innerHTML = `<i class="fas fa-bookmark" style="margin-right: 5px;"></i> Unbookmark`;
    button.setAttribute('aria-label', `Unbookmark story`);
  } else {
    button.classList.remove('bookmarked');
    button.innerHTML = `<i class="far fa-bookmark" style="margin-right: 5px;"></i> Bookmark`;
    button.setAttribute('aria-label', `Bookmark story`);
  }
}
