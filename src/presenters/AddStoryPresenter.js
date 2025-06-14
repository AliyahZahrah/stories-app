import { addNewStory } from '../api.js';
import { isAuthenticated } from '../utils/auth.js';
import { navigateTo } from '../router.js';
import {
  renderAddStoryPageLayout,
  getAddStoryForm,
  getDescriptionInput,
  getPhotoInput,
  getImagePreview,
  getStartCameraButton,
  getCameraUiDiv,
  getCameraVideo,
  getCapturePhotoButton,
  getStopCameraButton,
  getGetLocationButton,
  getMapContainer,
  getLocationCoordsP,
  getAddStoryErrorDiv,
  getPhotoErrorDiv,
  getDescriptionErrorDiv,
  getSubmitButton,
  displayError,
  showElement,
  hideElement,
  setSubmitButtonState,
  updateLocationCoordsText,
  setMapContainerText,
  setMapContainerActive,
  resetPhotoInput,
  setImagePreviewSource,
  setupMapLayerControlInView,
  updateLocationNameTextAdd,
  getLocationNameDisplayAdd,
} from '../pages/AddStoryPage.js';
import { Map, Marker, config as MapTilerConfig, MapStyle } from '@maptiler/sdk';
import Swal from 'sweetalert2';

const MAPTILER_API_KEY = 'FBElmE3wCPbxGkZ0pppo';
MapTilerConfig.apiKey = MAPTILER_API_KEY;

class AddStoryPresenter {
  constructor(viewContainer) {
    this._viewContainer = viewContainer;
    this._currentLatitude = null;
    this._currentLongitude = null;
    this._capturedImageFile = null;
    this._mapInstance = null;
    this._mapMarker = null;
    this._cameraStream = null;

    this._boundHandleFormSubmit = this._handleFormSubmit.bind(this);
    this._boundHandlePhotoFileChange = this._handlePhotoFileChange.bind(this);
    this._boundHandleStartCamera = this._handleStartCamera.bind(this);
    this._boundHandleStopCamera = this._handleStopCamera.bind(this);
    this._boundHandleCapturePhoto = this._handleCapturePhoto.bind(this);
    this._boundFetchLocationAndSetupMapUserAction = () => this._fetchLocationAndSetupMap(true);
  }

  async showPage() {
    if (!isAuthenticated()) {
      navigateTo('/login');
      return;
    }
    renderAddStoryPageLayout(this._viewContainer);
    this._resetState();
    this._initEventListeners();
    this._fetchLocationAndSetupMap(false);
  }

  _resetState() {
    this._currentLatitude = null;
    this._currentLongitude = null;
    this._capturedImageFile = null;
  }

  _initEventListeners() {
    getAddStoryForm(this._viewContainer)?.addEventListener('submit', this._boundHandleFormSubmit);
    getPhotoInput(this._viewContainer)?.addEventListener(
      'change',
      this._boundHandlePhotoFileChange,
    );
    getStartCameraButton(this._viewContainer)?.addEventListener(
      'click',
      this._boundHandleStartCamera,
    );
    getStopCameraButton(this._viewContainer)?.addEventListener(
      'click',
      this._boundHandleStopCamera,
    );
    getCapturePhotoButton(this._viewContainer)?.addEventListener(
      'click',
      this._boundHandleCapturePhoto,
    );
    getGetLocationButton(this._viewContainer)?.addEventListener(
      'click',
      this._boundFetchLocationAndSetupMapUserAction,
    );
  }

  _handlePhotoFileChange(event) {
    this._stopCameraStream();
    hideElement(getCameraUiDiv(this._viewContainer));

    const file = event.target.files[0];
    displayError(getPhotoErrorDiv(this._viewContainer), '');
    hideElement(getImagePreview(this._viewContainer));
    setImagePreviewSource(this._viewContainer, '#');
    this._capturedImageFile = null;

    if (file) {
      const validImageTypes = ['image/jpeg', 'image/png'];
      if (!validImageTypes.includes(file.type)) {
        displayError(
          getPhotoErrorDiv(this._viewContainer),
          'Invalid file type. Please select a JPG or PNG image.',
        );
        resetPhotoInput(this._viewContainer);
        return;
      }
      if (file.size > 1 * 1024 * 1024) {
        // 1MB
        displayError(getPhotoErrorDiv(this._viewContainer), 'File too large. Maximum size is 1MB.');
        resetPhotoInput(this._viewContainer);
        return;
      }
      this._capturedImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewSource(this._viewContainer, e.target.result);
        showElement(getImagePreview(this._viewContainer));
      };
      reader.readAsDataURL(file);
    }
  }

  async _handleStartCamera() {
    displayError(getPhotoErrorDiv(this._viewContainer), '');
    hideElement(getImagePreview(this._viewContainer));
    setImagePreviewSource(this._viewContainer, '#');
    this._capturedImageFile = null;
    resetPhotoInput(this._viewContainer);

    const cameraVideo = getCameraVideo(this._viewContainer);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && cameraVideo) {
      try {
        this._cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        cameraVideo.srcObject = this._cameraStream;
        showElement(getCameraUiDiv(this._viewContainer));
        hideElement(getImagePreview(this._viewContainer));
      } catch (err) {
        console.error('Error accessing camera:', err);
        displayError(
          getPhotoErrorDiv(this._viewContainer),
          `Could not access camera: ${err.message}. Try uploading a file.`,
        );
        hideElement(getCameraUiDiv(this._viewContainer));
      }
    } else {
      displayError(
        getPhotoErrorDiv(this._viewContainer),
        'Camera API not supported or video element missing.',
      );
      hideElement(getCameraUiDiv(this._viewContainer));
    }
  }

  _stopCameraStream() {
    if (this._cameraStream) {
      this._cameraStream.getTracks().forEach((track) => track.stop());
      this._cameraStream = null;
      const videoEl = getCameraVideo(this._viewContainer);
      if (videoEl) videoEl.srcObject = null;
      console.log('Camera stream stopped.');
    }
  }

  _handleStopCamera() {
    this._stopCameraStream();
    hideElement(getCameraUiDiv(this._viewContainer));
  }

  _handleCapturePhoto() {
    const cameraVideo = getCameraVideo(this._viewContainer);
    if (!this._cameraStream || !cameraVideo || !cameraVideo.srcObject) {
      displayError(
        getPhotoErrorDiv(this._viewContainer),
        'Camera not active. Please start the camera first.',
      );
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob.size > 1 * 1024 * 1024) {
          // 1MB
          displayError(
            getPhotoErrorDiv(this._viewContainer),
            'Captured image is too large (over 1MB). Try again.',
          );
          return;
        }
        this._capturedImageFile = new File([blob], 'story_capture.jpg', { type: 'image/jpeg' });
        setImagePreviewSource(this._viewContainer, URL.createObjectURL(this._capturedImageFile));
        showElement(getImagePreview(this._viewContainer));
        displayError(getPhotoErrorDiv(this._viewContainer), '');
      },
      'image/jpeg',
      0.9,
    );
  }

  _cleanupMap() {
    if (this._mapMarker) {
      this._mapMarker.remove();
      this._mapMarker = null;
    }
    if (this._mapInstance) {
      try {
        this._mapInstance.remove();
      } catch (e) {
        console.warn('Could not remove previous map instance on AddStoryPage:', e);
      }
      this._mapInstance = null;
    }
    setMapContainerText(this._viewContainer, '');
  }

  _initializeMap(center = [-74.5, 40], zoom = 2) {
    this._cleanupMap();
    const mapContainer = getMapContainer(this._viewContainer);
    if (!mapContainer) return;

    setMapContainerText(this._viewContainer, '');
    setMapContainerActive(this._viewContainer, true);

    try {
      this._mapInstance = new Map({
        container: mapContainer, // DOM element
        center: center,
        zoom: zoom,
        style: MapStyle.STREETS,
      });

      this._mapInstance.on('click', async (e) => {
        this._currentLatitude = e.lngLat.lat;
        this._currentLongitude = e.lngLat.lng;
        updateLocationCoordsText(
          this._viewContainer,
          `Lat: ${this._currentLatitude.toFixed(5)}, Lon: ${this._currentLongitude.toFixed(5)}`,
        );
        const locationName = await this._fetchLocationName(
          this._currentLatitude,
          this._currentLongitude,
        );
        updateLocationNameTextAdd(this._viewContainer, locationName);

        if (this._mapMarker) {
          this._mapMarker.setLngLat(e.lngLat);
        } else {
          this._mapMarker = new Marker({ color: '#FA4EAB', draggable: true })
            .setLngLat(e.lngLat)
            .addTo(this._mapInstance);
          this._mapMarker.on('dragend', async () => {
            const lngLat = this._mapMarker.getLngLat();
            this._currentLatitude = lngLat.lat;
            this._currentLongitude = lngLat.lng;
            updateLocationCoordsText(
              this._viewContainer,
              `Lat: ${this._currentLatitude.toFixed(5)}, Lon: ${this._currentLongitude.toFixed(5)}`,
            );
            const newLocationName = await this._fetchLocationName(
              this._currentLatitude,
              this._currentLongitude,
            );
            updateLocationNameTextAdd(this._viewContainer, newLocationName);
          });
        }
      });
      setupMapLayerControlInView(this._mapInstance, mapContainer.id, mapContainer);
    } catch (mapError) {
      console.error('Error initializing map:', mapError);
      setMapContainerText(
        this._viewContainer,
        `Map failed to display: ${mapError.message}. You can try 'Get Current Location'.`,
      );
      setMapContainerActive(this._viewContainer, false);
    }
  }

  async _fetchLocationName(lat, lon) {
    if (!MAPTILER_API_KEY) return 'Location name not available (API key missing)';
    const url = `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${MAPTILER_API_KEY}`;
    try {
      const response = await fetch(url);
      if (!response.ok) return 'Location name not available (fetch error)';
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
      console.error('Error fetching location name:', error);
      return 'Location name not available (error)';
    }
  }

  _fetchLocationAndSetupMap(useDeviceLocation = false) {
    setMapContainerText(this._viewContainer, 'Loading map...');
    setMapContainerActive(this._viewContainer, false);
    updateLocationCoordsText(this._viewContainer, '');
    updateLocationNameTextAdd(this._viewContainer, '');

    if (this._mapMarker) this._mapMarker.remove();
    this._mapMarker = null;
    this._currentLatitude = null;
    this._currentLongitude = null;

    if (useDeviceLocation && navigator.geolocation) {
      setMapContainerText(this._viewContainer, 'Attempting to get current location...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this._currentLatitude = lat;
          this._currentLongitude = lon;
          updateLocationCoordsText(
            this._viewContainer,
            `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`,
          );
          const locationName = await this._fetchLocationName(lat, lon);
          updateLocationNameTextAdd(this._viewContainer, locationName);
          this._initializeMap([lon, lat], 14);
          if (this._mapInstance && !this._mapMarker) {
            this._mapMarker = new Marker({ color: '#FA4EAB', draggable: true })
              .setLngLat([lon, lat])
              .addTo(this._mapInstance);
            this._mapMarker.on('dragend', async () => {
              const lngLat = this._mapMarker.getLngLat();
              this._currentLatitude = lngLat.lat;
              this._currentLongitude = lngLat.lng;
              updateLocationCoordsText(
                this._viewContainer,
                `Lat: ${this._currentLatitude.toFixed(5)}, Lon: ${this._currentLongitude.toFixed(5)}`,
              );
              const newLocationName = await this._fetchLocationName(
                this._currentLatitude,
                this._currentLongitude,
              );
              updateLocationNameTextAdd(this._viewContainer, newLocationName);
            });
          }
        },
        (error) => {
          console.error('Error getting device location:', error);
          setMapContainerText(
            this._viewContainer,
            `Failed to get current location: ${error.message}. Click on map to set location.`,
          );
          this._initializeMap();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      if (useDeviceLocation)
        setMapContainerText(
          this._viewContainer,
          'Geolocation is not supported or permission denied. Click on map to set location.',
        );
      this._initializeMap();
    }
  }

  async _handleFormSubmit(event) {
    event.preventDefault();
    hideElement(getAddStoryErrorDiv(this._viewContainer));
    displayError(getAddStoryErrorDiv(this._viewContainer), '');
    displayError(getPhotoErrorDiv(this._viewContainer), '');
    displayError(getDescriptionErrorDiv(this._viewContainer), '');
    let valid = true;

    if (!this._capturedImageFile) {
      displayError(
        getPhotoErrorDiv(this._viewContainer),
        'Please select or capture a photo for your story.',
      );
      valid = false;
    } else if (this._capturedImageFile.size > 1 * 1024 * 1024) {
      displayError(getPhotoErrorDiv(this._viewContainer), 'Photo size must be less than 1MB.');
      valid = false;
    }

    const descriptionInput = getDescriptionInput(this._viewContainer);
    if (descriptionInput && descriptionInput.value.trim().length < 3) {
      displayError(
        getDescriptionErrorDiv(this._viewContainer),
        'Description must be at least 3 characters long.',
      );
      valid = false;
    }

    if (!valid) return;

    const formData = new FormData();
    formData.append('photo', this._capturedImageFile);
    if (descriptionInput) formData.append('description', descriptionInput.value.trim());
    if (this._currentLatitude !== null && this._currentLongitude !== null) {
      formData.append('lat', this._currentLatitude.toString());
      formData.append('lon', this._currentLongitude.toString());
    }

    setSubmitButtonState(
      this._viewContainer,
      true,
      `<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Adding Story...`,
    );

    try {
      const response = await addNewStory(formData);
      if (response.error) {
        throw new Error(response.message || 'Failed to add story due to a server error.');
      }

      await Swal.fire({
        title: 'Good job!',
        text: 'Your story has been added!',
        icon: 'success',
        confirmButtonColor: '#FA4EAB',
      });
      navigateTo('/stories');
    } catch (err) {
      const generalErrorDiv = getAddStoryErrorDiv(this._viewContainer);
      displayError(generalErrorDiv, err.message || 'An unexpected error occurred.');
      showElement(generalErrorDiv);
      Swal.fire({
        title: 'Error!',
        text: err.message || 'An unexpected error occurred while adding the story.',
        icon: 'error',
        confirmButtonColor: '#FA4EAB',
      });
    } finally {
      setSubmitButtonState(
        this._viewContainer,
        false,
        `<i class="fas fa-plus" style="margin-right: 8px;"></i>Add Story`,
      );
    }
  }

  cleanup() {
    this._stopCameraStream();
    this._cleanupMap();

    const form = getAddStoryForm(this._viewContainer);
    if (form) form.removeEventListener('submit', this._boundHandleFormSubmit);

    const photoInput = getPhotoInput(this._viewContainer);
    if (photoInput) photoInput.removeEventListener('change', this._boundHandlePhotoFileChange);

    const startCameraButton = getStartCameraButton(this._viewContainer);
    if (startCameraButton)
      startCameraButton.removeEventListener('click', this._boundHandleStartCamera);

    const stopCameraButton = getStopCameraButton(this._viewContainer);
    if (stopCameraButton)
      stopCameraButton.removeEventListener('click', this._boundHandleStopCamera);

    const capturePhotoButton = getCapturePhotoButton(this._viewContainer);
    if (capturePhotoButton)
      capturePhotoButton.removeEventListener('click', this._boundHandleCapturePhoto);

    const getLocationButton = getGetLocationButton(this._viewContainer);
    if (getLocationButton)
      getLocationButton.removeEventListener('click', this._boundFetchLocationAndSetupMapUserAction);

    console.log('AddStoryPresenter cleaned up.');
  }
}

export default AddStoryPresenter;
