// Welcome Gate Component for Zenith Student Companion
export default {
  render(state) {
    return `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: var(--bg-primary); width: 100%;">
        <div class="card fade-in" style="max-width: 480px; width: 100%; border: 1px solid var(--border-accent); box-shadow: var(--border-glow); padding: 2.5rem; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(20px); text-align: center;">
          
          <!-- Header -->
          <div style="margin-bottom: 2rem;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style="color: var(--accent-primary); filter: drop-shadow(0 0 10px var(--accent-primary-glow));">
                <path d="M12 2L2 22h20L12 2zm0 3.99L18.8 19H5.2L12 5.99zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </div>
            <h1 style="font-family: var(--font-family-title); font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem;">Zenith</h1>
            <p style="color: var(--text-secondary); font-size: 1rem; line-height: 1.5;">Your personalized generative AI exam stress & student well-being companion.</p>
          </div>

          <div style="border-top: 1px solid var(--border-light); margin: 2rem 0; padding-top: 1.5rem;">
            <h3 style="font-size: 1.2rem; margin-bottom: 1.5rem; font-weight: 600; color: var(--text-primary);">Do you already have a Zenith account?</h3>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <button class="btn btn-primary" id="btn-gate-yes" style="padding: 0.9rem; font-size: 1rem; font-weight: 600; background: linear-gradient(135deg, var(--accent-primary) 0%, hsl(244, 97%, 62%) 100%); width: 100%;">
                Yes, Log In to My Profile
              </button>
              
              <button class="btn btn-secondary" id="btn-gate-no" style="padding: 0.9rem; font-size: 1rem; font-weight: 600; background: rgba(255,255,255,0.05); border: 1px solid var(--border-light); color: var(--text-primary); cursor: pointer; border-radius: 12px; transition: var(--transition-smooth); width: 100%;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                No, Register New Profile
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  attachListeners(state, setState) {
    const btnYes = document.getElementById('btn-gate-yes');
    const btnNo = document.getElementById('btn-gate-no');

    if (btnYes) {
      btnYes.addEventListener('click', () => {
        setState({ authState: 'login' });
      });
    }

    if (btnNo) {
      btnNo.addEventListener('click', () => {
        setState({ authState: 'register' });
      });
    }
  }
};
