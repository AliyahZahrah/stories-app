// This file now exports functions to render content AND manage view interactions.

// Renders the initial HTML content for the login page.
export function renderLoginPageLayout(container) {
  container.innerHTML = `
    <div class="form-container">
      <h1>Login</h1>
      <form id="login-form" novalidate>
        <div id="login-error" class="alert alert-danger" style="display:none;"></div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required placeholder="Enter your email">
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-container">
            <input type="password" id="password" name="password" required placeholder="Enter your password">
            <button type="button" class="password-toggle-btn" aria-label="Show password">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <button type="submit" class="btn">Login</button>
      </form>
      <p class="text-center mt-2">
        Don't have an account? <a href="#/register">Sign up</a>
      </p>
    </div>
  `;
}

// --- View Interaction Functions ---
// These functions will be called by the presenter.
// They assume the layout has been rendered by renderLoginPageLayout.

export function getLoginForm(container) {
  return container.querySelector('#login-form');
}
export function getEmailInput(container) {
  return container.querySelector('#email');
}
export function getPasswordInput(container) {
  return container.querySelector('#password');
}
export function getPasswordToggleButton(container) {
  return container.querySelector('#login-form .password-toggle-btn');
}

export function displayLoginError(container, message) {
  const errorDiv = container.querySelector('#login-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

export function hideLoginError(container) {
  const errorDiv = container.querySelector('#login-error');
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
}

export function setSubmitButtonState(container, disabled, text) {
  const button = container.querySelector('#login-form button[type="submit"]');
  if (button) {
    button.disabled = disabled;
    button.textContent = text;
  }
}

export function togglePasswordVisibilityInView(container) {
  const passwordInput = getPasswordInput(container);
  const toggleButton = getPasswordToggleButton(container);
  if (passwordInput && toggleButton) {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    const icon = toggleButton.querySelector('i');
    if (icon) {
      if (type === 'password') {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleButton.setAttribute('aria-label', 'Show password');
      } else {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleButton.setAttribute('aria-label', 'Hide password');
      }
    }
  }
}
