// Settings and Profile configuration Component for Zenith
import { GeminiConfig } from '../utils/gemini.js';
import { store } from '../store.js';
import { escapeHtml } from '../utils/sanitize.js';

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
    const { name, exam, examDate, dailyHoursTarget, stressors } = state.profile;
    const apiKey = GeminiConfig.getApiKey();
    const hasApiKey = GeminiConfig.hasKey();

    // Render Stressors list with appropriate .selected classes
    const stressorsHtml = AVAILABLE_STRESSORS.map(s => {
      const isSelected = stressors.includes(s);
      return `
        <label class="checkbox-label ${isSelected ? 'selected' : ''}">
          <input type="checkbox" class="stressor-checkbox" value="${escapeHtml(s)}" ${isSelected ? 'checked' : ''} style="display:none;" />
          <span>${escapeHtml(s)}</span>
        </label>
      `;
    }).join('');

    // Render Exam dropdown
    const examsDropdownHtml = AVAILABLE_EXAMS.map(e => `
      <option value="${escapeHtml(e)}" ${exam === e ? 'selected' : ''}>${escapeHtml(e)}</option>
    `).join('');

    return `
      <div class="view-header fade-in">
        <div class="view-title-group">
          <h1>Settings & Profile</h1>
          <div class="view-subtitle">Customize your wellness companion profile and configure API credentials.</div>
        </div>
      </div>

      <div class="dashboard-grid fade-in">
        <!-- Profile Config Card -->
        <div class="card col-8">
          <h3 style="margin-bottom: 1rem;">Student Academic Profile</h3>
          
          <div class="settings-section">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label for="profile-name-input">Aspirant Name</label>
                <input type="text" class="form-control" id="profile-name-input" value="${escapeHtml(name)}" placeholder="Aspirant" />
              </div>
              <div class="form-group">
                <label for="profile-exam-select">Target Exam / Milestone</label>
                <select class="form-control" id="profile-exam-select">
                  ${examsDropdownHtml}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label for="profile-date-input">Target Exam Date</label>
                <input type="date" class="form-control" id="profile-date-input" value="${escapeHtml(examDate)}" />
              </div>
              <div class="form-group">
                <label for="profile-hours-input">Daily Study Goal (Hours)</label>
                <input type="number" class="form-control" id="profile-hours-input" value="${escapeHtml(String(dailyHoursTarget))}" min="1" max="18" />
              </div>
            </div>

            <div class="form-group">
              <label>Primary Stress Triggers</label>
              <div class="form-checkbox-group">
                ${stressorsHtml}
              </div>
            </div>

            <button class="btn btn-primary" id="btn-save-profile" style="width: fit-content; align-self: flex-end;">
              Save Profile Changes
            </button>
          </div>
        <!-- Security Settings Card -->
        <div class="card col-4">
          <h3 style="margin-bottom: 1rem;">Security & Account</h3>
          
          <div class="settings-section">
            <div class="form-group">
              <label for="settings-old-password">Current Password</label>
              <input type="password" class="form-control" id="settings-old-password" placeholder="Enter current password" required />
            </div>
            <div class="form-group">
              <label for="settings-new-password">New Password</label>
              <input type="password" class="form-control" id="settings-new-password" placeholder="Enter new password" required />
            </div>
            <div class="form-group">
              <label for="settings-confirm-password">Confirm New Password</label>
              <input type="password" class="form-control" id="settings-confirm-password" placeholder="Confirm new password" required />
            </div>
            <button class="btn btn-primary" id="btn-change-password" style="width: 100%; margin-top: 0.5rem;">
              Update Password
            </button>
          </div>
        </div>
      </div>
    `;
  },

  attachListeners(state, setState) {
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const btnSaveApiKey = document.getElementById('btn-save-api-key');
    const btnClearApiKey = document.getElementById('btn-clear-api-key');

    // Multi-select Checkbox styling helper
    const checkBoxes = document.querySelectorAll('.stressor-checkbox');
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

    // Profile Saver
    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', () => {
        const nameVal = document.getElementById('profile-name-input').value.trim() || 'Aspirant';
        const examVal = document.getElementById('profile-exam-select').value;
        const dateVal = document.getElementById('profile-date-input').value;
        const hoursVal = parseInt(document.getElementById('profile-hours-input').value) || 8;

        // Extract selected stressors checkboxes
        const selectedStressors = [];
        const checkedBoxes = document.querySelectorAll('.stressor-checkbox:checked');
        checkedBoxes.forEach(box => {
          selectedStressors.push(box.value);
        });

        // Set state
        setState({
          profile: {
            name: nameVal,
            exam: examVal,
            examDate: dateVal,
            dailyHoursTarget: hoursVal,
            stressors: selectedStressors
          }
        });

        alert('Academic profile updated successfully!');
      });
    }

    // Password Changer
    const btnChangePassword = document.getElementById('btn-change-password');
    if (btnChangePassword) {
      btnChangePassword.addEventListener('click', async () => {
        const oldPw = document.getElementById('settings-old-password').value;
        const newPw = document.getElementById('settings-new-password').value;
        const confirmPw = document.getElementById('settings-confirm-password').value;

        if (!oldPw || !newPw || !confirmPw) {
          alert('Please fill out all password fields.');
          return;
        }

        if (newPw !== confirmPw) {
          alert('New passwords do not match.');
          return;
        }

        const res = await store.changePassword(oldPw, newPw);
        if (res.success) {
          alert(res.message);
          document.getElementById('settings-old-password').value = '';
          document.getElementById('settings-new-password').value = '';
          document.getElementById('settings-confirm-password').value = '';
        } else {
          alert(res.message);
        }
      });
    }

    // Gemini key operations
    if (btnSaveApiKey) {
      btnSaveApiKey.addEventListener('click', () => {
        const inputKey = document.getElementById('settings-api-key').value.trim();
        if (!inputKey) {
          alert('Please enter a valid API Key first!');
          return;
        }

        GeminiConfig.setApiKey(inputKey);
        setState({}); // Update layout text and state
        alert('Gemini API Key saved successfully to local secure storage.');
      });
    }

    if (btnClearApiKey) {
      btnClearApiKey.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your configured Gemini API key?')) {
          GeminiConfig.setApiKey('');
          setState({});
          const input = document.getElementById('settings-api-key');
          if (input) input.value = '';
          alert('Gemini API Key removed. Zenith will now run in simulated fallback sandbox.');
        }
      });
    }
  }
};
