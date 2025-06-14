// This file now exports functions to render content AND manage view interactions.

// Renders the initial HTML content for the register page.
export function renderRegisterPageLayout(container) {
  container.innerHTML = `
    <div class="form-container">
      <h1>Register</h1>
      <form id="register-form" novalidate>
        <div id="register-error" class="alert alert-danger" style="display:none;"></div>
        <div id="register-success" class="alert alert-success" style="display:none;"></div>
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" required minlength="2" placeholder="Enter your name">
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required placeholder="Enter your email">
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-container">
            <input type="password" id="password" name="password" required minlength="8" placeholder="Enter your password">
            <button type="button" class="password-toggle-btn" aria-label="Show password">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <button type="submit" class="btn">Register</button>
      </form>
      <p class="text-center mt-2">
        Already have an account? <a href="#/login">Log in</a>
      </p>
    </div>
  `;
}

// --- View Interaction Functions ---

export function getRegisterForm(container) {
  return container.querySelector('#register-form');
}
export function getNameInput(container) {
  return container.querySelector('#name');
}
export function getEmailInput(container) {
  return container.querySelector('#email');
}
export function getPasswordInput(container) {
  return container.querySelector('#password');
}
export function getPasswordToggleButton(container) {
  return container.querySelector('#register-form .password-toggle-btn');
}

export function displayRegisterError(container, message) {
  const errorDiv = container.querySelector('#register-error');
  const successDiv = container.querySelector('#register-success');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
  if (successDiv) {
    successDiv.style.display = 'none';
  }
}

export function displayRegisterSuccess(container, message) {
  const successDiv = container.querySelector('#register-success');
  const errorDiv = container.querySelector('#register-error');
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.style.display = 'block';
  }
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

export function hideRegisterMessages(container) {
  const errorDiv = container.querySelector('#register-error');
  const successDiv = container.querySelector('#register-success');
  if (errorDiv) errorDiv.style.display = 'none';
  if (successDiv) successDiv.style.display = 'none';
}

export function setSubmitButtonState(container, disabled, text) {
  const button = container.querySelector('#register-form button[type="submit"]');
  if (button) {
    button.disabled = disabled;
    button.textContent = text;
  }
}

export function resetRegisterForm(container) {
  const form = getRegisterForm(container);
  if (form) form.reset();
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
