// Onboarding Component for Zenith Student Companion
import { store } from '../store.js';

const AVAILABLE_STRESSORS = [
  'Mock Tests', 
  'Time Management', 
  'Syllabus Load', 
  'Peer Pressure', 
  'Family Expectations', 
  'Fear of Failure'
];

const AVAILABLE_EXAMS = [
  'JEE', 
  'NEET', 
  'UPSC', 
  'CAT', 
  'GATE', 
  'CUET', 
  'CBSE Boards', 
  'ICSE Boards'
];

export default {
  render(state) {
    const today = new Date().toISOString().split('T')[0];
    const defaultExamDate = new Date(new Date().getFullYear() + 1, 3, 1).toISOString().split('T')[0];

    // Stressor checkbox rendering
    const stressorsHtml = AVAILABLE_STRESSORS.map(s => `
      <label class="checkbox-label">
        <input type="checkbox" class="onboard-stressor-checkbox" value="${s}" style="display:none;" />
        <span>${s}</span>
      </label>
    `).join('');

    // Exam dropdown rendering
    const examsDropdownHtml = AVAILABLE_EXAMS.map(e => `
      <option value="${e}">${e}</option>
    `).join('');

    return `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: var(--bg-primary); width: 100%;">
        <div class="card fade-in" style="max-width: 650px; width: 100%; border: 1px solid var(--border-accent); box-shadow: var(--border-glow); padding: 2.5rem; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(20px);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 2rem;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36" style="color: var(--accent-primary); filter: drop-shadow(0 0 8px var(--accent-primary-glow));">
                <path d="M12 2L2 22h20L12 2zm0 3.99L18.8 19H5.2L12 5.99zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span style="font-family: var(--font-family-title); font-size: 2.25rem; font-weight: 800; background: linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Zenith</span>
            </div>
            <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">Create Your Prep Profile</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Configure your academic milestones so your digital companion can personalize your stress support.</p>
          </div>

          <!-- Form -->
          <div class="settings-section">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group">
                <label for="onboard-name">Your Name</label>
                <input type="text" class="form-control" id="onboard-name" placeholder="Enter your name" required />
              </div>
              <div class="form-group">
                <label for="onboard-exam">Target Exam</label>
                <select class="form-control" id="onboard-exam">
                  <option value="" disabled selected>Select your exam</option>
                  ${examsDropdownHtml}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group">
                <label for="onboard-date">Exam Date</label>
                <input type="date" class="form-control" id="onboard-date" value="${defaultExamDate}" min="${today}" />
              </div>
              <div class="form-group">
                <label for="onboard-hours">Daily Study Goal (Hours)</label>
                <input type="number" class="form-control" id="onboard-hours" value="8" min="1" max="18" />
              </div>
            </div>

            <div class="form-group">
              <label>Primary Stress Triggers (Select all that apply)</label>
              <div class="form-checkbox-group" style="grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));">
                ${stressorsHtml}
              </div>
            </div>

            <div class="form-group" style="border-top: 1px solid var(--border-light); padding-top: 1.25rem; margin-top: 0.5rem;">
              <label for="onboard-password">Choose Password</label>
              <input type="password" class="form-control" id="onboard-password" placeholder="Create a password for your account" required />
            </div>

            <button class="btn btn-primary" id="btn-submit-onboarding" style="width: 100%; margin-top: 1rem; padding: 0.9rem; font-size: 1rem; background: linear-gradient(135deg, var(--accent-primary) 0%, hsl(244, 97%, 62%) 100%);">
              Begin My Journey
            </button>

            ${store.getAccountsList().length > 0 ? `
              <div style="text-align: center; margin-top: 1.5rem;">
                <span style="color: var(--text-muted); font-size: 0.85rem;">Already have an account? </span>
                <a href="#" id="link-go-to-login" style="color: var(--accent-secondary); font-size: 0.85rem; font-weight: 600; text-decoration: none; border-bottom: 1px dashed var(--accent-secondary-glow); padding-bottom: 2px;">Log In</a>
              </div>
            ` : ''}
          </div>

        </div>
      </div>
    `;
  },

  attachListeners(state, setState) {
    const submitBtn = document.getElementById('btn-submit-onboarding');

    // Stressor checkbox interaction
    const checkBoxes = document.querySelectorAll('.onboard-stressor-checkbox');
    checkBoxes.forEach(box => {
      box.addEventListener('change', () => {
        const label = box.parentElement;
        if (box.checked) {
          label.classList.add('selected');
        } else {
          label.classList.remove('selected');
        }
      });
    });

    const goToLoginLink = document.getElementById('link-go-to-login');
    if (goToLoginLink) {
      goToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        setState({
          showForceOnboarding: false
        });
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        const nameVal = document.getElementById('onboard-name').value.trim();
        const examVal = document.getElementById('onboard-exam').value;
        const dateVal = document.getElementById('onboard-date').value;
        const hoursVal = parseInt(document.getElementById('onboard-hours').value) || 8;
        const passwordVal = document.getElementById('onboard-password').value;

        if (!nameVal) {
          alert('Please enter your name to begin!');
          return;
        }

        if (!examVal) {
          alert('Please select the exam you are preparing for!');
          return;
        }

        if (!passwordVal) {
          alert('Please choose a password!');
          return;
        }

        // Save stressors
        const selectedStressors = [];
        const checkedBoxes = document.querySelectorAll('.onboard-stressor-checkbox:checked');
        checkedBoxes.forEach(box => {
          selectedStressors.push(box.value);
        });

        // Register account and login
        const res = await store.registerAccount(nameVal, passwordVal, {
          name: nameVal,
          exam: examVal,
          examDate: dateVal,
          dailyHoursTarget: hoursVal,
          stressors: selectedStressors
        });

        if (!res.success) {
          alert(res.message);
          return;
        }

        setState({ showForceOnboarding: false });
      });
    }
  }
};
