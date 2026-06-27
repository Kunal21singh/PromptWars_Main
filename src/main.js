// Central Coordinator for Zenith Student Companion
import { store } from './store.js';
import { AudioSynth } from './utils/audioGenerator.js';

// Import Views
import Dashboard from './components/Dashboard.js';
import Journal from './components/Journal.js';
import Companion from './components/Companion.js';
import Mindfulness from './components/Mindfulness.js';
import Settings from './components/Settings.js';
import Onboarding from './components/Onboarding.js';
import Login from './components/Login.js';

// Map views to active tab names
const VIEWS = {
  dashboard: Dashboard,
  journal: Journal,
  companion: Companion,
  mindfulness: Mindfulness,
  settings: Settings
};

let currentPlayingType = null;
let currentVolume = null;
let pomodoroInterval = null;

// Synchronize store soundscape state with Web Audio API synthesis
function syncSoundscape(state) {
  const { playing, type, volume } = state.soundscape;
  
  if (playing) {
    if (currentPlayingType !== type) {
      try {
        AudioSynth.start(type, volume);
        currentPlayingType = type;
        currentVolume = volume;
      } catch (err) {
        console.error('Failed to start procedural audio synth:', err);
      }
    } else if (currentVolume !== volume) {
      AudioSynth.setVolume(volume);
      currentVolume = volume;
    }
  } else {
    if (currentPlayingType !== null) {
      try {
        AudioSynth.stop();
      } catch (err) {
        console.error('Failed to stop audio synth:', err);
      }
      currentPlayingType = null;
      currentVolume = null;
    }
  }
}

// Play notification sound when Pomodoro completes
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
    osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.6); // C6
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.9);
  } catch (e) {
    console.error('Web Audio beep failed:', e);
  }
}

// Background Pomodoro Ticker
function syncPomodoroTicker(state) {
  const { running } = state.pomodoro;
  
  if (running && !pomodoroInterval) {
    pomodoroInterval = setInterval(() => {
      const currentPom = store.state.pomodoro;
      if (currentPom.secondsLeft > 0) {
        store.setState({
          pomodoro: {
            ...currentPom,
            secondsLeft: currentPom.secondsLeft - 1
          }
        });
      } else {
        // Complete!
        playChime();
        const nextType = currentPom.type === 'work' ? 'break' : 'work';
        const nextSeconds = nextType === 'work' ? 1500 : 300;
        
        store.setState({
          pomodoro: {
            secondsLeft: nextSeconds,
            running: false,
            type: nextType
          }
        });
        
        setTimeout(() => {
          alert(
            nextType === 'break' 
              ? "🎯 Focus Session Complete! Go to the 'Mindfulness' tab to rest your mind with soundscapes or box breathing." 
              : "🔋 Mind Buffer break over! Ready to return to study revision?"
          );
        }, 100);
      }
    }, 1000);
  } else if (!running && pomodoroInterval) {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
  }
}

// Main render function
function renderApp(state) {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Routing for authentication / onboarding
  if (!state.currentUser) {
    const accounts = store.getAccountsList();
    const showOnboarding = (accounts.length === 0) || state.showForceOnboarding;
    
    if (showOnboarding) {
      appContainer.innerHTML = Onboarding.render(state);
      try {
        Onboarding.attachListeners(state, (updates) => store.setState(updates));
      } catch (err) {
        console.error('Error attaching Onboarding listeners:', err);
      }
    } else {
      appContainer.innerHTML = Login.render(state);
      try {
        Login.attachListeners(state, (updates) => store.setState(updates));
      } catch (err) {
        console.error('Error attaching Login listeners:', err);
      }
    }
    return;
  }

  const { activeTab } = state;
  const avatarInitial = state.profile.name ? state.profile.name.charAt(0).toUpperCase() : 'A';
  
  // Renders core structure
  appContainer.innerHTML = `
    <div class="app-container">
      
      <!-- DESKTOP SIDEBAR -->
      <aside class="sidebar">
        <div class="logo-container">
          <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2zm0 3.99L18.8 19H5.2L12 5.99zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <span class="logo-text">Zenith</span>
          <span class="logo-badge">GenAI</span>
        </div>
        
        <ul class="nav-menu">
          <li class="nav-item">
            <a class="nav-link ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1"/>
                <rect width="7" height="5" x="14" y="3" rx="1"/>
                <rect width="7" height="9" x="14" y="12" rx="1"/>
                <rect width="7" height="5" x="3" y="16" rx="1"/>
              </svg>
              <span>Dashboard</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${activeTab === 'journal' ? 'active' : ''}" data-tab="journal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
              <span>AI Journal</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${activeTab === 'companion' ? 'active' : ''}" data-tab="companion">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>AI Companion</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${activeTab === 'mindfulness' ? 'active' : ''}" data-tab="mindfulness">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12a4 4 0 1 1 8 0 4 4 0 1 1-8 0Z"/>
              </svg>
              <span>Mindfulness Hub</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Settings</span>
            </a>
          </li>
        </ul>
        
        <div class="sidebar-footer">
          ${state.soundscape.playing ? `
            <div style="background: hsla(173, 80%, 40%, 0.1); border: 1px solid var(--accent-secondary-glow); border-radius: 12px; padding: 0.5rem 0.75rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.5rem; animation: pulse-glow 2s infinite;">
              <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden; white-space: nowrap;">
                <span class="playing-pulse" style="width: 8px; height: 8px; background: var(--accent-secondary); border-radius: 50%; display: inline-block;"></span>
                <span style="font-weight: 600; text-transform: capitalize; color: var(--accent-secondary); text-overflow: ellipsis; overflow: hidden;">${state.soundscape.type} active</span>
              </div>
              <button id="sidebar-sound-stop" style="background: transparent; border: none; color: var(--accent-danger); cursor: pointer; display: flex;" title="Stop Soundscape">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              </button>
            </div>
          ` : ''}
          <div class="profile-card" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="profile-avatar">${avatarInitial}</div>
              <div class="profile-info">
                <div class="profile-name">${state.profile.name}</div>
                <div class="profile-exam">${state.profile.exam} Candidate</div>
              </div>
            </div>
            <button id="sidebar-logout-btn" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.color='var(--accent-danger)'" onmouseout="this.style.color='var(--text-muted)'" title="Log Out / Lock Account">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- MOBILE HEADER -->
      <header class="mobile-header">
        <div class="logo-container" style="margin-bottom: 0; gap: 0.5rem;">
          <svg class="logo-icon" style="width:24px; height:24px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2zm0 3.99L18.8 19H5.2L12 5.99zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <span class="logo-text" style="font-size: 1.25rem;">Zenith</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="profile-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${avatarInitial}</div>
          <button id="mobile-logout-btn" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; padding: 4px;" title="Log Out">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- MAIN VIEWPORT -->
      <main class="main-content">
        <div id="view-content"></div>
      </main>

      <!-- MOBILE BOTTOM NAV -->
      <nav class="mobile-nav">
        <a class="nav-link ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
          <span>Dashboard</span>
        </a>
        <a class="nav-link ${activeTab === 'journal' ? 'active' : ''}" data-tab="journal">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
          <span>Journal</span>
        </a>
        <a class="nav-link ${activeTab === 'companion' ? 'active' : ''}" data-tab="companion">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Chat</span>
        </a>
        <a class="nav-link ${activeTab === 'mindfulness' ? 'active' : ''}" data-tab="mindfulness">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12a4 4 0 1 1 8 0 4 4 0 1 1-8 0Z"/>
          </svg>
          <span>Relax</span>
        </a>
        <a class="nav-link ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
          <span>Setup</span>
        </a>
      </nav>
      
    </div>
  `;

  // Render the specific active view inside viewport
  const viewContent = document.getElementById('view-content');
  if (viewContent) {
    const ActiveViewComponent = VIEWS[activeTab];
    if (ActiveViewComponent) {
      viewContent.innerHTML = ActiveViewComponent.render(state);
      
      // Let the view component attach its specific DOM event listeners
      try {
        ActiveViewComponent.attachListeners(state, (updates) => store.setState(updates));
      } catch (err) {
        console.error(`Error attaching event listeners in view: ${activeTab}`, err);
      }
    }
  }

  // Hook layout event listeners
  attachLayoutListeners(state);
}

// Universal layout click routing & actions
function attachLayoutListeners(state) {
  // Navigation tabs (Sidebar + Mobile Bottom Nav)
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      if (tab) {
        store.setState({ activeTab: tab });
      }
    });
  });

  // Sidebar soundscape stopper
  const sidebarSoundStopBtn = document.getElementById('sidebar-sound-stop');
  if (sidebarSoundStopBtn) {
    sidebarSoundStopBtn.addEventListener('click', () => {
      store.setState({
        soundscape: {
          ...state.soundscape,
          playing: false
        }
      });
    });
  }

  // Logout actions
  const logoutBtn = document.getElementById('sidebar-logout-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  
  const handleLogout = (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to log out and lock your session?')) {
      store.logoutUser();
    }
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', handleLogout);
  }
}

// Initialise core app listeners & subscriber
store.subscribe((state) => {
  // Sync background timers/sound
  syncSoundscape(state);
  syncPomodoroTicker(state);
  
  // Render layout updates
  renderApp(state);
});

// Run initial configurations
store.fetchAccounts();
syncSoundscape(store.state);
syncPomodoroTicker(store.state);
renderApp(store.state);

// Add window level reference to store to assist components if required
window.zenithStore = store;
