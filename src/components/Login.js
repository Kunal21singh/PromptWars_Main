// Login Component for Zenith Student Companion
import { store } from '../store.js';

export default {
  render(state) {
    const accounts = store.getAccountsList();

    let accountSelectorHtml = '';
    if (accounts.length > 0) {
      const options = accounts.map(acc => `<option value="${acc}">${acc}</option>`).join('');
      accountSelectorHtml = `
        <div class="form-group">
          <label for="login-username">Select Profile</label>
          <select class="form-control" id="login-username">
            ${options}
          </select>
        </div>
      `;
    } else {
      accountSelectorHtml = `
        <div class="form-group">
          <label for="login-username">Aspirant Name</label>
          <input type="text" class="form-control" id="login-username" placeholder="Enter your name" required />
        </div>
      `;
    }

    return `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: var(--bg-primary); width: 100%;">
        <div class="card fade-in" style="max-width: 480px; width: 100%; border: 1px solid var(--border-accent); box-shadow: var(--border-glow); padding: 2.5rem; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(20px);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 2rem;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36" style="color: var(--accent-primary); filter: drop-shadow(0 0 8px var(--accent-primary-glow));">
                <path d="M12 2L2 22h20L12 2zm0 3.99L18.8 19H5.2L12 5.99zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span style="font-family: var(--font-family-title); font-size: 2.25rem; font-weight: 800; background: linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Zenith</span>
            </div>
            <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">Welcome Back</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Access your academic profile and stress-support workspace.</p>
          </div>

          <!-- Form -->
          <div class="settings-section">
            ${accountSelectorHtml}

            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" class="form-control" id="login-password" placeholder="Enter your password" required />
            </div>

            <div id="login-error-msg" style="color: var(--accent-danger); font-size: 0.85rem; margin-bottom: 1rem; display: none;"></div>

            <button class="btn btn-primary" id="btn-submit-login" style="width: 100%; margin-top: 0.5rem; padding: 0.9rem; font-size: 1rem; background: linear-gradient(135deg, var(--accent-primary) 0%, hsl(244, 97%, 62%) 100%);">
              Enter Workspace
            </button>

            <div style="text-align: center; margin-top: 1.5rem;">
              <span style="color: var(--text-muted); font-size: 0.85rem;">New aspirant? </span>
              <a href="#" id="link-go-to-onboarding" style="color: var(--accent-secondary); font-size: 0.85rem; font-weight: 600; text-decoration: none; border-bottom: 1px dashed var(--accent-secondary-glow); padding-bottom: 2px;">Create Prep Profile</a>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  attachListeners(state, setState) {
    const loginBtn = document.getElementById('btn-submit-login');
    const goToOnboardingLink = document.getElementById('link-go-to-onboarding');

    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const usernameEl = document.getElementById('login-username');
        const passwordEl = document.getElementById('login-password');
        const errorEl = document.getElementById('login-error-msg');

        if (!usernameEl || !passwordEl) return;

        const nameVal = usernameEl.value.trim();
        const passwordVal = passwordEl.value;

        if (!nameVal) {
          if (errorEl) {
            errorEl.textContent = 'Please select or enter your name.';
            errorEl.style.display = 'block';
          }
          return;
        }

        if (!passwordVal) {
          if (errorEl) {
            errorEl.textContent = 'Please enter your password.';
            errorEl.style.display = 'block';
          }
          return;
        }

        const res = await store.loginUser(nameVal, passwordVal);
        if (res.success) {
          if (errorEl) errorEl.style.display = 'none';
        } else {
          if (errorEl) {
            errorEl.textContent = res.message || 'Incorrect credentials.';
            errorEl.style.display = 'block';
          }
        }
      });
    }

    if (goToOnboardingLink) {
      goToOnboardingLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Set state to force Onboarding view (isOnboarded false shows onboarding)
        setState({
          isOnboarded: false,
          showForceOnboarding: true // local flag to distinguish from initial load with no accounts
        });
      });
    }
  }
};
