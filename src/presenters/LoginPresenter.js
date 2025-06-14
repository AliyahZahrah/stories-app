import {
  renderLoginPageLayout,
  getLoginForm,
  getEmailInput,
  getPasswordInput,
  displayLoginError,
  hideLoginError,
  setSubmitButtonState,
  getPasswordToggleButton,
  togglePasswordVisibilityInView,
} from '../pages/LoginPage.js';
import { handleLogin } from '../utils/auth.js';
// navigateTo is handled by handleLogin on success

class LoginPresenter {
  constructor(viewContainer) {
    this._viewContainer = viewContainer;
    // Bind event handlers to ensure `this` context and allow removal
    this._boundHandleFormSubmit = this._handleFormSubmit.bind(this);
    this._boundTogglePasswordVisibility = this._togglePasswordVisibility.bind(this);
  }

  showPage() {
    renderLoginPageLayout(this._viewContainer);
    this._initEventListeners();
  }

  _initEventListeners() {
    const form = getLoginForm(this._viewContainer);
    if (form) {
      form.addEventListener('submit', this._boundHandleFormSubmit);
    } else {
      console.error('Login form not found after rendering.');
    }

    const toggleButton = getPasswordToggleButton(this._viewContainer);
    if (toggleButton) {
      toggleButton.addEventListener('click', this._boundTogglePasswordVisibility);
    }
  }

  _togglePasswordVisibility() {
    // This method is called by the event listener.
    // It then calls the view function to update the DOM.
    togglePasswordVisibilityInView(this._viewContainer);
  }

  async _handleFormSubmit(event) {
    event.preventDefault();
    hideLoginError(this._viewContainer);

    const emailInput = getEmailInput(this._viewContainer);
    const passwordInput = getPasswordInput(this._viewContainer);

    if (!emailInput || !passwordInput) {
      displayLoginError(this._viewContainer, 'Form elements not found.');
      return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    setSubmitButtonState(this._viewContainer, true, 'Logging in...');

    const result = await handleLogin(email, password);

    setSubmitButtonState(this._viewContainer, false, 'Login');

    if (!result.success) {
      displayLoginError(
        this._viewContainer,
        result.message || 'Login failed. Please check your credentials.',
      );
    }
    // Successful login and navigation are handled within handleLogin
  }

  cleanup() {
    const form = getLoginForm(this._viewContainer);
    if (form) {
      form.removeEventListener('submit', this._boundHandleFormSubmit);
    }
    const toggleButton = getPasswordToggleButton(this._viewContainer);
    if (toggleButton) {
      toggleButton.removeEventListener('click', this._boundTogglePasswordVisibility);
    }
    console.log('LoginPresenter cleaned up.');
  }
}

export default LoginPresenter;
