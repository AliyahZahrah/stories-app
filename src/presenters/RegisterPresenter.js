import {
  renderRegisterPageLayout,
  getRegisterForm,
  getNameInput,
  getEmailInput,
  getPasswordInput,
  displayRegisterError,
  displayRegisterSuccess,
  hideRegisterMessages,
  setSubmitButtonState,
  resetRegisterForm,
  getPasswordToggleButton,
  togglePasswordVisibilityInView,
} from '../pages/RegisterPage.js';
import { handleRegister } from '../utils/auth.js';
// navigateTo on successful registration is handled by handleRegister

class RegisterPresenter {
  constructor(viewContainer) {
    this._viewContainer = viewContainer;
    this._boundHandleFormSubmit = this._handleFormSubmit.bind(this);
    this._boundTogglePasswordVisibility = this._togglePasswordVisibility.bind(this);
  }

  showPage() {
    renderRegisterPageLayout(this._viewContainer);
    this._initEventListeners();
  }

  _initEventListeners() {
    const form = getRegisterForm(this._viewContainer);
    if (form) {
      form.addEventListener('submit', this._boundHandleFormSubmit);
    } else {
      console.error('Register form not found after rendering.');
    }

    const toggleButton = getPasswordToggleButton(this._viewContainer);
    if (toggleButton) {
      toggleButton.addEventListener('click', this._boundTogglePasswordVisibility);
    }
  }

  _togglePasswordVisibility() {
    togglePasswordVisibilityInView(this._viewContainer);
  }

  async _handleFormSubmit(event) {
    event.preventDefault();
    hideRegisterMessages(this._viewContainer);

    const nameInput = getNameInput(this._viewContainer);
    const emailInput = getEmailInput(this._viewContainer);
    const passwordInput = getPasswordInput(this._viewContainer);

    if (!nameInput || !emailInput || !passwordInput) {
      displayRegisterError(this._viewContainer, 'Form elements not found.');
      return;
    }

    const name = nameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    setSubmitButtonState(this._viewContainer, true, 'Registering...');

    const result = await handleRegister(name, email, password);

    setSubmitButtonState(this._viewContainer, false, 'Register');

    if (result.success) {
      displayRegisterSuccess(
        this._viewContainer,
        result.message || 'Registration successful! Please login.',
      );
      resetRegisterForm(this._viewContainer);
      // Navigation to login page is handled by handleRegister
    } else {
      displayRegisterError(
        this._viewContainer,
        result.message || 'Registration failed. Please try again.',
      );
    }
  }

  cleanup() {
    const form = getRegisterForm(this._viewContainer);
    if (form) {
      form.removeEventListener('submit', this._boundHandleFormSubmit);
    }
    const toggleButton = getPasswordToggleButton(this._viewContainer);
    if (toggleButton) {
      toggleButton.removeEventListener('click', this._boundTogglePasswordVisibility);
    }
    console.log('RegisterPresenter cleaned up.');
  }
}

export default RegisterPresenter;
