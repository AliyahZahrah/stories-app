import { format } from 'date-fns';

// Renders the initial layout for the story detail page.
// isLoading flag controls whether to show loading indicator.
export function renderStoryDetailPageLayout(container, isLoading = true) {
  if (isLoading) {
    container.innerHTML = `<p class="loading-indicator">Loading story details...</p>`;
    return;
  }
  // This structure will be populated by populateStoryData after fetching data
  container.innerHTML = `
    <article class="story-detail-container" aria-labelledby="story-title">
      <div class="story-detail-actions-top">
        <a href="#/stories" class="btn btn-secondary mb-2" style="width:auto; display: inline-flex; align-items: center;">
          <img src="/img/arrow-left.png" alt="" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;" aria-hidden="true">
          Back to All Stories
        </a>
        <button id="detail-bookmark-button" class="btn btn-bookmark mb-2" style="width:auto; margin-left:10px;">
            <i class="far fa-bookmark" style="margin-right: 5px;"></i> Bookmark
        </button>
      </div>
      <h1 id="story-title"></h1>
      <div class="story-detail-meta">
        <span id="story-author-meta"></span> | 
        <span id="story-date-meta"></span>
      </div>
      <div class="story-detail-image-container" id="story-image-container">
        <!-- Image or placeholder will be inserted here by populateStoryData -->
      </div>
      <h2>Description</h2>
      <p class="story-detail-description" id="story-description-detail"></p>
      
      <section class="story-detail-location" aria-labelledby="location-heading">
          <h3 id="location-heading">Location</h3>
          <div id="story-detail-map-text-info">
              <p id="location-name-display">Location Name: Not available</p>
              <p id="latitude-display">Latitude: Not available</p>
              <p id="longitude-display">Longitude: Not available</p>
          </div>
          <div id="story-detail-map-container" role="application" aria-label="Map showing story location">
            <!-- Map or placeholder text will be inserted here -->
          </div> 
      </section>
    </article>
  `;
}

// --- DOM Element Getters ---
function getStoryDetailMapDiv(container) {
  return container.querySelector('#story-detail-map-container');
}
function getLocationNameDisplay(container) {
  return container.querySelector('#location-name-display');
}
function getLatitudeDisplay(container) {
  return container.querySelector('#latitude-display');
}
function getLongitudeDisplay(container) {
  return container.querySelector('#longitude-display');
}
function getStoryTitleEl(container) {
  return container.querySelector('#story-title');
}
function getStoryAuthorMetaEl(container) {
  return container.querySelector('#story-author-meta');
}
function getStoryDateMetaEl(container) {
  return container.querySelector('#story-date-meta');
}
function getStoryImageContainerEl(container) {
  return container.querySelector('#story-image-container');
}
function getStoryDescriptionEl(container) {
  return container.querySelector('#story-description-detail');
}
export function getDetailBookmarkButton(container) {
  return container.querySelector('#detail-bookmark-button');
}

// Populates the already rendered layout with story data.
// story object now includes isBookmarked
export function populateStoryDataInView(container, story) {
  if (!story) return;

  const storyAuthor = story.name || 'Anonymous';
  const storyDate = story.createdAt
    ? format(new Date(story.createdAt), "MMMM d, yyyy 'at' h:mm a")
    : 'Date not available';

  const storyTitleEl = getStoryTitleEl(container);
  const storyAuthorMetaEl = getStoryAuthorMetaEl(container);
  const storyDateMetaEl = getStoryDateMetaEl(container);
  const storyImageContainerEl = getStoryImageContainerEl(container);
  const storyDescriptionEl = getStoryDescriptionEl(container);
  const latitudeDisplay = getLatitudeDisplay(container);
  const longitudeDisplay = getLongitudeDisplay(container);
  const locationNameDisplay = getLocationNameDisplay(container);
  const storyDetailMapDiv = getStoryDetailMapDiv(container);

  if (storyTitleEl) storyTitleEl.textContent = `Story by ${storyAuthor}`;
  if (storyAuthorMetaEl) storyAuthorMetaEl.textContent = `Posted by: ${storyAuthor}`;
  if (storyDateMetaEl) storyDateMetaEl.textContent = `On: ${storyDate}`;

  if (storyImageContainerEl) {
    storyImageContainerEl.innerHTML = story.photoUrl
      ? `<img src="${story.photoUrl}" alt="Story image provided by ${storyAuthor}" class="story-detail-image" onerror="this.style.display='none'; this.parentElement.insertAdjacentHTML('beforeend', '<p class=\\'error-message\\'>Image could not be loaded.</p>');" data-ai-hint="story detail">`
      : `<div class="story-card-placeholder-img" style="height:300px;">No Image Provided</div>`;
  }
  if (storyDescriptionEl)
    storyDescriptionEl.textContent = story.description || 'No description provided.';

  const isValidLatitude = typeof story.lat === 'number' && !isNaN(story.lat);
  const isValidLongitude = typeof story.lon === 'number' && !isNaN(story.lon);

  if (isValidLatitude && isValidLongitude) {
    if (latitudeDisplay) latitudeDisplay.textContent = `Latitude: ${story.lat.toFixed(5)}`;
    if (longitudeDisplay) longitudeDisplay.textContent = `Longitude: ${story.lon.toFixed(5)}`;
  } else {
    if (locationNameDisplay)
      locationNameDisplay.textContent = `Location Name: No location data provided`;
    if (latitudeDisplay) latitudeDisplay.textContent = `Latitude: No location data provided`;
    if (longitudeDisplay) longitudeDisplay.textContent = `Longitude: No location data provided`;
    if (storyDetailMapDiv) {
      storyDetailMapDiv.innerHTML =
        '<p class="text-center" style="padding-top:20px; color: #777;">Map not available for this story (no coordinates).</p>';
      storyDetailMapDiv.classList.remove('map-active');
    }
  }
  updateDetailBookmarkButton(container, story.isBookmarked || false);
}

// --- UI Update Functions (called by presenter) ---
export function setContainerHtml(container, html) {
  container.innerHTML = html;
}

export function setMapContainerText(container, text, isActive = false) {
  const mapDiv = getStoryDetailMapDiv(container);
  if (mapDiv) {
    mapDiv.innerHTML = text;
    if (isActive) mapDiv.classList.add('map-active');
    else mapDiv.classList.remove('map-active');
  }
}

export function updateLocationNameInView(container, name) {
  const el = getLocationNameDisplay(container);
  if (el) el.textContent = `Location Name: ${name}`;
}

export function updateDetailBookmarkButton(container, isBookmarked) {
  const button = getDetailBookmarkButton(container);
  if (!button) return;
  const icon = button.querySelector('i');
  if (isBookmarked) {
    button.classList.add('bookmarked');
    if (icon) icon.className = 'fas fa-bookmark';
    button.innerHTML = `<i class="fas fa-bookmark" style="margin-right: 5px;"></i> Unbookmark`;
    button.setAttribute('aria-label', 'Unbookmark this story');
  } else {
    button.classList.remove('bookmarked');
    if (icon) icon.className = 'far fa-bookmark';
    button.innerHTML = `<i class="far fa-bookmark" style="margin-right: 5px;"></i> Bookmark`;
    button.setAttribute('aria-label', 'Bookmark this story');
  }
}

export function setupMapLayerControlInDetailView(
  mapInstance,
  mapContainerElementId,
  mapContainerDomNode,
) {
  if (!mapContainerDomNode) return;

  let controlContainer = mapContainerDomNode.querySelector('.map-layer-control');
  if (controlContainer) controlContainer.remove();

  controlContainer = document.createElement('div');
  controlContainer.className = 'map-layer-control';
  controlContainer.innerHTML = `
          <label for="${mapContainerElementId}-style-select">Map Style:</label>
          <select id="${mapContainerElementId}-style-select">
              <option value="streets">Streets</option>
              <option value="outdoor">Outdoor</option>
              <option value="satellite">Satellite</option>
              <option value="winter">Winter</option>
          </select>
      `;
  if (mapInstance && typeof mapInstance.getContainer === 'function' && mapInstance.getContainer()) {
    mapInstance.getContainer().appendChild(controlContainer);
  } else {
    mapContainerDomNode.appendChild(controlContainer);
  }

  const styleSelect = controlContainer.querySelector(`#${mapContainerElementId}-style-select`);
  styleSelect?.addEventListener('change', (e) => {
    mapInstance.setStyle(e.target.value);
  });
}
