// Mindfulness & Coping Hub Component for Zenith
import { GenAI } from '../utils/gemini.js';

let activeSubTab = 'breathing'; // 'breathing' | 'soundscapes' | 'reframer'

// Box Breathing State Variables
let breathingInterval = null;
let breathingPhase = 'idle'; // 'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2'
let secondsInPhase = 4;
let cyclesCompleted = 0;

// Reframer State Variables
let reframerInputText = '';
let isReframing = false;
let reframerResult = null; // { distortionType, reframedThought }

export default {
  render(state) {
    // Sync active sub-tab from journal advice action triggers if set globally
    if (window.activeMindfulnessTab) {
      activeSubTab = window.activeMindfulnessTab;
      delete window.activeMindfulnessTab;
    }

    let subViewHtml = '';

    if (activeSubTab === 'breathing') {
      subViewHtml = renderBreathingView();
    } else if (activeSubTab === 'soundscapes') {
      subViewHtml = renderSoundscapesView(state);
    } else {
      subViewHtml = renderReframerView();
    }

    return `
      <div class="view-header fade-in">
        <div class="view-title-group">
          <h1>Mindfulness Hub</h1>
          <div class="view-subtitle">Ground yourself, recharge your brain, and reframe study anxiety.</div>
        </div>
      </div>

      <div class="mindfulness-tabs fade-in">
        <button class="mind-tab-btn ${activeSubTab === 'breathing' ? 'active' : ''}" data-subtab="breathing">Box Breathing</button>
        <button class="mind-tab-btn ${activeSubTab === 'soundscapes' ? 'active' : ''}" data-subtab="soundscapes">Soundscapes</button>
        <button class="mind-tab-btn ${activeSubTab === 'reframer' ? 'active' : ''}" data-subtab="reframer">Anxiety Reframer</button>
      </div>

      <div class="mind-tab-content fade-in">
        ${subViewHtml}
      </div>
    `;
  },

  attachListeners(state, setState) {
    // Tab switching listeners
    const tabBtns = document.querySelectorAll('.mind-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Clean up breathing if they switch tabs
        if (breathingInterval) {
          clearInterval(breathingInterval);
          breathingInterval = null;
          breathingPhase = 'idle';
          secondsInPhase = 4;
          cyclesCompleted = 0;
        }
        activeSubTab = btn.getAttribute('data-subtab');
        setState({}); // Trigger view re-render
      });
    });

    // Sub-tab specific listeners
    if (activeSubTab === 'breathing') {
      attachBreathingListeners(state, setState);
    } else if (activeSubTab === 'soundscapes') {
      attachSoundscapeListeners(state, setState);
    } else if (activeSubTab === 'reframer') {
      attachReframerListeners(state, setState);
    }
  }
};

/* --- VIEW RENDERING HELPERS --- */

function renderBreathingView() {
  let instructions = 'Ready to reset your focus?';
  let detailLabel = 'Standard 4-4-4-4 Box Breathing resets your parasympathetic nervous system.';
  let visualClass = '';

  if (breathingPhase === 'inhale') {
    instructions = 'Breathe In Deeply (Nose)';
    detailLabel = 'Expand your chest and stomach slowly.';
    visualClass = 'inhale';
  } else if (breathingPhase === 'hold1') {
    instructions = 'Hold the Breath';
    detailLabel = 'Rest in the fullness of your lungs.';
    visualClass = 'hold';
  } else if (breathingPhase === 'exhale') {
    instructions = 'Breathe Out Slowly (Mouth)';
    detailLabel = 'Release all tension and exam worry.';
    visualClass = 'exhale';
  } else if (breathingPhase === 'hold2') {
    instructions = 'Hold Empty';
    detailLabel = 'Rest in the quiet stillness.';
    visualClass = 'hold';
  }

  return `
    <div class="card breathing-card">
      <div class="breathing-outer-ring">
        <div class="breathing-circle-glow ${visualClass}">
          <span class="breathing-center-text">
            ${breathingPhase === 'idle' ? 'Go' : `${secondsInPhase}s`}
          </span>
        </div>
      </div>
      <div class="breathing-instruction">${instructions}</div>
      <div class="breathing-timer">
        ${breathingPhase === 'idle' 
          ? detailLabel 
          : `Cycle: <strong>${cyclesCompleted + 1}</strong> | Phase: <strong>${breathingPhase.toUpperCase()}</strong>`
        }
      </div>
      
      <button class="btn btn-primary" id="btn-breathing-toggle" style="background-color: var(--accent-secondary); box-shadow: 0 4px 15px rgba(20, 184, 166, 0.3);">
        ${breathingPhase === 'idle' ? 'Start Box Breathing' : 'Stop Session'}
      </button>
    </div>
  `;
}

function renderSoundscapesView(state) {
  const { playing, type, volume } = state.soundscape;
  
  const isWavesActive = playing && type === 'waves';
  const isBinauralActive = playing && type === 'binaural';
  const isRainActive = playing && type === 'rain';

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="margin-bottom: 0.5rem;">Alpha Focus Soundscapes</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">
        Generate calming background noise directly inside your browser. Recommended: Use headphones, particularly for Binaural Beats (utilizes 140Hz/150Hz offset to induce 10Hz alpha waves for high concentration).
      </p>
    </div>

    <div class="soundscapes-grid" style="margin-bottom: 2rem;">
      <!-- Ocean Waves -->
      <div class="sound-card ${isWavesActive ? 'active' : ''}" data-type="waves">
        <div class="sound-header">
          <div class="sound-icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
              <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
            </svg>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: ${isWavesActive ? 'var(--accent-secondary)' : 'var(--text-muted)'};">
            ${isWavesActive ? 'PLAYING' : 'IDLE'}
          </span>
        </div>
        <div class="sound-title" style="margin-top: 1rem;">Ocean Waves</div>
        <p style="color: var(--text-muted); font-size: 0.75rem; line-height: 1.4;">Procedural white noise sweeps simulating tides.</p>
      </div>

      <!-- Binaural Beats -->
      <div class="sound-card ${isBinauralActive ? 'active' : ''}" data-type="binaural">
        <div class="sound-header">
          <div class="sound-icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: ${isBinauralActive ? 'var(--accent-secondary)' : 'var(--text-muted)'};">
            ${isBinauralActive ? 'PLAYING' : 'IDLE'}
          </span>
        </div>
        <div class="sound-title" style="margin-top: 1rem;">Binaural Focus</div>
        <p style="color: var(--text-muted); font-size: 0.75rem; line-height: 1.4;">10Hz Alpha beat to improve cognitive lock during study.</p>
      </div>

      <!-- Rain -->
      <div class="sound-card ${isRainActive ? 'active' : ''}" data-type="rain">
        <div class="sound-header">
          <div class="sound-icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
              <path d="M4 14.89A6 6 0 1 1 15.67 10.1A4 4 0 0 1 19 14a4 4 0 0 1-3.6 3.97"/>
              <line x1="16" y1="19" x2="16" y2="21"/>
              <line x1="12" y1="19" x2="12" y2="21"/>
              <line x1="8" y1="19" x2="8" y2="21"/>
            </svg>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: ${isRainActive ? 'var(--accent-secondary)' : 'var(--text-muted)'};">
            ${isRainActive ? 'PLAYING' : 'IDLE'}
          </span>
        </div>
        <div class="sound-title" style="margin-top: 1rem;">Calming Rain</div>
        <p style="color: var(--text-muted); font-size: 0.75rem; line-height: 1.4;">Filtered pink noise creating a steady rain atmosphere.</p>
      </div>
    </div>

    <!-- Volume Controller widget -->
    <div class="card sound-slider-container" style="max-width: 400px;">
      <div class="sound-slider-header">
        <span>Volume Intensity</span>
        <span id="volume-val-display">${Math.round(volume * 100)}%</span>
      </div>
      <input type="range" class="sound-slider" id="sound-volume-slider" min="0" max="1" step="0.05" value="${volume}" />
    </div>
  `;
}

function renderReframerView() {
  let outputPanelContent = '';

  if (isReframing) {
    outputPanelContent = `
      <div class="empty-placeholder" style="padding: 2rem 0;">
        <div class="typing-indicator" style="align-self: center; margin-bottom: 1rem; width: 60px;">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
        <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">Reframing Thought...</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Applying cognitive behavioral balance.</div>
      </div>
    `;
  } else if (reframerResult) {
    outputPanelContent = `
      <div class="analysis-section-title">Detected distortion</div>
      <div style="font-weight: 700; color: var(--accent-danger); font-size: 0.9rem; margin-bottom: 0.75rem;">
        ${reframerResult.distortionType}
      </div>

      <div class="reframer-card old" style="margin-bottom: 1rem;">
        "${reframerInputText}"
      </div>
      
      <div class="reframer-arrow" style="margin-bottom: 1rem;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <polyline points="19 12 12 19 5 12"/>
        </svg>
      </div>

      <div class="analysis-section-title">CBT Balanced Perspective</div>
      <div class="reframer-card new">
        ${reframerResult.reframedThought}
      </div>
    `;
  } else {
    outputPanelContent = `
      <div class="empty-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
          <path d="M12 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 12v6"/>
        </svg>
        <div style="font-weight: 700; margin-bottom: 0.25rem;">Perspective Lab</div>
        <div style="font-size: 0.8rem; max-width: 260px; margin: 0 auto; line-height: 1.4;">Input a stressful, self-critical, or catastrophic exam belief to generate a balanced CBT reframe.</div>
      </div>
    `;
  }

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="margin-bottom: 0.5rem;">Cognitive Anxiety Reframer</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">
        Exam candidates often experience cognitive distortions (e.g., Catastrophizing: "If I miss this mock test, I will fail the actual JEE"). Challenge these thoughts systematically.
      </p>
    </div>

    <div class="reframer-grid">
      <!-- Input Panel -->
      <div class="card reframer-input-panel">
        <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">Anxious / Self-Critical Thought</label>
        <textarea class="reframer-textarea" id="reframer-input-field" placeholder="Example: If I don't get under AIR 1000 in NEET, my parents will think I am a failure and my career is ruined..."></textarea>
        
        <button class="btn btn-primary" id="btn-reframe-thought" style="width: 100%; margin-top: auto;">
          Reframe with AI
        </button>
      </div>

      <!-- Output Panel -->
      <div class="reframer-output-panel" id="reframer-output-container">
        ${outputPanelContent}
      </div>
    </div>
  `;
}

/* --- EVENT LISTENERS DRIVE --- */

function attachBreathingListeners(state, setState) {
  const toggleBtn = document.getElementById('btn-breathing-toggle');
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (breathingInterval) {
        // Stop breathing
        clearInterval(breathingInterval);
        breathingInterval = null;
        breathingPhase = 'idle';
        secondsInPhase = 4;
        cyclesCompleted = 0;
        setState({});
      } else {
        // Start breathing
        breathingPhase = 'inhale';
        secondsInPhase = 4;
        cyclesCompleted = 0;
        setState({});

        breathingInterval = setInterval(() => {
          if (secondsInPhase > 1) {
            secondsInPhase--;
            setState({});
          } else {
            // Rotate phase
            secondsInPhase = 4;
            if (breathingPhase === 'inhale') {
              breathingPhase = 'hold1';
            } else if (breathingPhase === 'hold1') {
              breathingPhase = 'exhale';
            } else if (breathingPhase === 'exhale') {
              breathingPhase = 'hold2';
            } else if (breathingPhase === 'hold2') {
              breathingPhase = 'inhale';
              cyclesCompleted++;
            }
            setState({});
          }
        }, 1000);
      }
    });
  }
}

function attachSoundscapeListeners(state, setState) {
  const cards = document.querySelectorAll('.sound-card');
  const slider = document.getElementById('sound-volume-slider');

  // Sound card selection
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const typeSelected = card.getAttribute('data-type');
      const current = state.soundscape;

      if (current.playing && current.type === typeSelected) {
        // Toggle off
        setState({
          soundscape: {
            ...current,
            playing: false
          }
        });
      } else {
        // Toggle on or switch
        setState({
          soundscape: {
            ...current,
            playing: true,
            type: typeSelected
          }
        });
      }
    });
  });

  // Volume slider adjustments
  if (slider) {
    slider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      const display = document.getElementById('volume-val-display');
      if (display) display.textContent = `${Math.round(vol * 100)}%`;
      
      setState({
        soundscape: {
          ...state.soundscape,
          volume: vol
        }
      });
    });
  }
}

function attachReframerListeners(state, setState) {
  const input = document.getElementById('reframer-input-field');
  const button = document.getElementById('btn-reframe-thought');

  // Restore input field typing if present
  if (input && reframerInputText) {
    input.value = reframerInputText;
  }

  if (input) {
    input.addEventListener('input', (e) => {
      reframerInputText = e.target.value;
    });
  }

  if (button) {
    button.addEventListener('click', async () => {
      const text = input ? input.value.trim() : '';
      if (!text) {
        alert('Please write an anxious thought to reframe first!');
        return;
      }

      if (text.split(/\s+/).length < 3) {
        alert('Please type a slightly longer sentence representing your worry.');
        return;
      }

      isReframing = true;
      reframerResult = null;
      setState({}); // Trigger re-render to show loading status

      try {
        const reframe = await GenAI.reframeThought(text, state.profile);
        isReframing = false;
        reframerResult = reframe;
        setState({});
      } catch (err) {
        console.error('Reframer error:', err);
        isReframing = false;
        setState({});
        alert('Reframing failed. Please check your connection or API configuration.');
      }
    });
  }
}
