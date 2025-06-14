// This file now exports functions to render the HTML content,
// get DOM elements, and manage UI updates for the add story page.

// Renders the initial HTML content for the add story page.
export function renderAddStoryPageLayout(container) {
  container.innerHTML = `
    <div class="form-container">
      <h1>Add New Story</h1>
      <form id="add-story-form" novalidate>
        <div id="add-story-error" class="alert alert-danger" style="display:none;"></div>
        
        <fieldset class="form-group">
            <legend>Story Photo</legend>
            <p class="form-text text-muted">Max 1MB. JPG, PNG format.</p>
            <div class="story-photo-controls">
                <label for="story-photo-input" class="btn btn-secondary btn-file-upload" style="width:auto; margin-bottom:5px;">
                    <i class="fas fa-upload" style="margin-right: 8px;"></i> Upload File
                </label>
                <input type="file" id="story-photo-input" name="photo" accept="image/jpeg, image/png" class="visually-hidden">
                
                <button type="button" id="start-camera-btn" class="btn btn-secondary btn-use-camera" style="width:auto; margin-bottom:5px;">
                    <i class="fas fa-camera" style="margin-right: 8px;"></i> Use Camera
                </button>
            </div>
            
            <div class="camera-container" id="camera-ui" style="display:none;">
                <video id="camera-video" autoplay playsinline muted aria-label="Camera preview"></video>
                <div id="camera-controls">
                    <button type="button" id="capture-photo-btn" class="btn btn-primary" style="width:auto;">
                        <i class="fas fa-camera-retro" style="margin-right: 8px;"></i> Capture Photo
                    </button>
                    <button type="button" id="stop-camera-btn" class="btn btn-danger" style="width:auto;">
                         <i class="fas fa-stop-circle" style="margin-right: 8px;"></i> Stop Camera
                    </button>
                </div>
            </div>
            <img id="image-preview" src="#" alt="Selected image preview" style="display:none;" data-ai-hint="story image">
            <div id="photo-error" class="error-message"></div>
        </fieldset>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="4" required minlength="3" placeholder="Enter your story description"></textarea>
          <div id="description-error" class="error-message"></div>
        </div>

        <fieldset class="form-group">
          <legend>Location (Optional)</legend>
          <p class="form-text text-muted">Click on the map to set location or use current location.</p>
          <div id="map-container-add-story" role="application" aria-label="Interactive map to select story location">Attempting to get location... Click button if needed.</div>
          <button type="button" id="get-location-btn" class="btn btn-get-location mt-1" style="width:auto;">
            <i class="fas fa-map-marker-alt" style="margin-right: 8px;"></i>Get Current Location
          </button>
          <p id="location-coords" class="mt-1" style="font-size:0.9em;" aria-live="polite"></p>
           <p id="location-name-display-add" class="mt-1" style="font-size:0.9em;"></p>
        </fieldset>

        <button type="submit" class="btn btn-submit-story">
           <i class="fas fa-plus" style="margin-right: 8px;"></i>Add Story
        </button>
      </form>
    </div>
  `;
}

// --- DOM Element Getters (called by presenter or other view functions) ---
export function getAddStoryForm(container) {
  return container.querySelector('#add-story-form');
}
export function getDescriptionInput(container) {
  return container.querySelector('#description');
}
export function getPhotoInput(container) {
  return container.querySelector('#story-photo-input');
}
export function getImagePreview(container) {
  return container.querySelector('#image-preview');
}
export function getStartCameraButton(container) {
  return container.querySelector('#start-camera-btn');
}
export function getCameraUiDiv(container) {
  return container.querySelector('#camera-ui');
}
export function getCameraVideo(container) {
  return container.querySelector('#camera-video');
}
export function getCapturePhotoButton(container) {
  return container.querySelector('#capture-photo-btn');
}
export function getStopCameraButton(container) {
  return container.querySelector('#stop-camera-btn');
}
export function getGetLocationButton(container) {
  return container.querySelector('#get-location-btn');
}
export function getMapContainer(container) {
  return container.querySelector('#map-container-add-story');
}
export function getLocationCoordsP(container) {
  return container.querySelector('#location-coords');
}
export function getAddStoryErrorDiv(container) {
  return container.querySelector('#add-story-error');
}
export function getPhotoErrorDiv(container) {
  return container.querySelector('#photo-error');
}
export function getDescriptionErrorDiv(container) {
  return container.querySelector('#description-error');
}
export function getSubmitButton(container) {
  return container.querySelector('#add-story-form button[type="submit"]');
}
export function getLocationNameDisplayAdd(container) {
  return container.querySelector('#location-name-display-add');
}

// --- UI Update Functions ---
export function displayError(element, message) {
  if (element) element.textContent = message;
}
export function showElement(element) {
  if (element) element.style.display = 'block';
}
export function hideElement(element) {
  if (element) element.style.display = 'none';
}

export function setSubmitButtonState(container, disabled, htmlContent) {
  const button = getSubmitButton(container);
  if (button) {
    button.disabled = disabled;
    button.innerHTML = htmlContent;
  }
}

export function updateLocationCoordsText(container, text) {
  const p = getLocationCoordsP(container);
  if (p) p.textContent = text;
}
export function updateLocationNameTextAdd(container, text) {
  const el = getLocationNameDisplayAdd(container);
  if (el) el.textContent = text ? `Location Name: ${text}` : '';
}

export function setMapContainerText(container, text) {
  const mapDiv = getMapContainer(container);
  if (mapDiv) mapDiv.textContent = text;
}
export function setMapContainerActive(container, isActive) {
  const mapDiv = getMapContainer(container);
  if (mapDiv) {
    if (isActive) mapDiv.classList.add('map-active');
    else mapDiv.classList.remove('map-active');
  }
}

export function resetPhotoInput(container) {
  const photoInput = getPhotoInput(container);
  if (photoInput) photoInput.value = '';
}

export function setImagePreviewSource(container, src) {
  const imgPreview = getImagePreview(container);
  if (imgPreview) imgPreview.src = src;
}

export function setupMapLayerControlInView(
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
          <label for="${mapContainerElementId}-style-select-add">Map Style:</label>
          <select id="${mapContainerElementId}-style-select-add">
              <option value="streets">Streets</option>
              <option value="outdoor">Outdoor</option>
              <option value="satellite">Satellite</option>
              <option value="winter">Winter</option>
          </select>
      `;
  // Ensure mapInstance.getContainer() is valid and the DOM element is ready
  if (mapInstance && typeof mapInstance.getContainer === 'function' && mapInstance.getContainer()) {
    mapInstance.getContainer().appendChild(controlContainer);
  } else {
    // Fallback if mapInstance container isn't ready, append to the passed DOM node.
    // This might happen if called before map is fully initialized and attached.
    mapContainerDomNode.appendChild(controlContainer);
  }

  const styleSelect = controlContainer.querySelector(`#${mapContainerElementId}-style-select-add`);
  styleSelect?.addEventListener('change', (e) => {
    mapInstance.setStyle(e.target.value);
  });
}
