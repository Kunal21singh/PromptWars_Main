// Daily AI Journaling Component for Zenith
import { GenAI } from '../utils/gemini.js';

const JOURNAL_PROMPTS = [
  "How did today's mock tests / revision go? What did you feel when you got stuck?",
  "What is the biggest source of pressure you are feeling right now (parents, scores, time)?",
  "Write down the self-critical thoughts you had today. Let's check them later.",
  "Describe your energy levels right now. Did you sleep enough? What is exhausting you?",
  "If you clear your exam, how will your life change? Write a letter to your future self."
];

let activePromptIndex = 0;
let isAnalyzing = false;

export default {
  render(state) {
    const prompt = JOURNAL_PROMPTS[activePromptIndex];
    const latestJournal = state.journals[state.journals.length - 1];

    let analysisPanelHtml = '';

    if (isAnalyzing) {
      analysisPanelHtml = `
        <div class="card analysis-results-card" style="border-color: var(--accent-primary);">
          <div class="analysis-header">
            <span style="font-weight: 700;">AI Analysis</span>
          </div>
          <div class="empty-placeholder" style="padding: 2rem 1rem;">
            <div class="typing-indicator" style="align-self: center; margin-bottom: 1rem; width: 60px;">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">Zenith AI is analyzing...</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Checking stress, fatigue, and triggers.</div>
          </div>
        </div>
      `;
    } else if (latestJournal && latestJournal.analysis) {
      const { emotions, triggers, burnoutLevel, counsel, advice } = latestJournal.analysis;
      
      let badgeClass = 'low';
      if (burnoutLevel === 'high') badgeClass = 'high';
      else if (burnoutLevel === 'med') badgeClass = 'med';

      const anxietyWidth = emotions.anxiety || 0;
      const exhaustionWidth = emotions.exhaustion || 0;
      const selfDoubtWidth = emotions.selfDoubt || 0;
      const motivationWidth = emotions.motivation || 0;

      analysisPanelHtml = `
        <div class="card analysis-results-card">
          <div class="analysis-header">
            <span style="font-weight: 700; font-size: 1rem;">AI Insights</span>
            <span class="analysis-score-badge ${badgeClass}">${burnoutLevel.toUpperCase()} RISK</span>
          </div>

          <div class="analysis-section-title">Emotional Makeup</div>
          <div class="emotions-grid">
            <div class="emotion-card">
              <div class="emotion-card-header">
                <span>Anxiety</span>
                <span>${anxietyWidth}%</span>
              </div>
              <div class="emotion-bar">
                <div class="emotion-bar-fill" style="width: ${anxietyWidth}%; background-color: var(--accent-warning);"></div>
              </div>
            </div>

            <div class="emotion-card">
              <div class="emotion-card-header">
                <span>Exhaustion</span>
                <span>${exhaustionWidth}%</span>
              </div>
              <div class="emotion-bar">
                <div class="emotion-bar-fill" style="width: ${exhaustionWidth}%; background-color: var(--accent-danger);"></div>
              </div>
            </div>

            <div class="emotion-card">
              <div class="emotion-card-header">
                <span>Self-Doubt</span>
                <span>${selfDoubtWidth}%</span>
              </div>
              <div class="emotion-bar">
                <div class="emotion-bar-fill" style="width: ${selfDoubtWidth}%; background-color: var(--accent-primary);"></div>
              </div>
            </div>

            <div class="emotion-card">
              <div class="emotion-card-header">
                <span>Motivation</span>
                <span>${motivationWidth}%</span>
              </div>
              <div class="emotion-bar">
                <div class="emotion-bar-fill" style="width: ${motivationWidth}%; background-color: var(--accent-success);"></div>
              </div>
            </div>
          </div>

          <div class="analysis-section-title">Stress Triggers</div>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom: 1.5rem;">
            ${triggers.map(t => `<span style="font-size:0.75rem; background:var(--bg-secondary); border:1px solid var(--border-light); padding:0.25rem 0.6rem; border-radius:12px; color:var(--text-secondary); font-weight:600;">${t}</span>`).join('')}
          </div>

          <div class="analysis-section-title">Counseling Advice</div>
          <div class="counsel-text">${counsel}</div>

          <div class="analysis-section-title">Instant Reliever</div>
          <div class="advice-card">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v4l3 3"></path>
            </svg>
            <div class="advice-body">
              <h4>${advice.title}</h4>
              <p>${advice.body}</p>
              <button class="btn btn-primary" id="btn-trigger-advice" style="font-size: 0.7rem; padding: 0.35rem 0.75rem; margin-top: 0.5rem; width: fit-content; border-radius: 6px; box-shadow: none;">
                Launch Reliever
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      analysisPanelHtml = `
        <div class="card" style="height: 100%; display: flex; align-items: center; justify-content: center;">
          <div class="empty-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <div style="font-weight: 700; margin-bottom: 0.25rem;">Counselor Ready</div>
            <div class="insight-desc" style="font-size: 0.8rem; max-width: 240px; margin: 0 auto;">Your journal thoughts will be safely analyzed to uncover hidden stress loads and mental wellness blocks.</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="view-header fade-in">
        <div class="view-title-group">
          <h1>AI Journaling</h1>
          <div class="view-subtitle">A private space to express your thoughts, clear your mind, and track triggers.</div>
        </div>
      </div>

      <div class="journal-layout fade-in">
        <!-- Editor Column -->
        <div class="card journal-editor-card">
          <div class="journal-prompt">
            <div class="journal-prompt-text">
              Prompt: "${prompt}"
            </div>
            <button class="prompt-refresh-btn" id="btn-refresh-prompt" title="New Prompt">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M3 21v-5h5"></path>
              </svg>
            </button>
          </div>
          
          <textarea id="journal-input" class="journal-textarea" placeholder="Start typing here... Write freely about what you did today, what frustrated you, or any self-criticisms you're carrying. Your data is saved locally."></textarea>
          
          <div class="journal-footer">
            <span class="word-count" id="word-count-display">0 words</span>
            <button class="btn btn-primary" id="btn-analyze-journal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Analyze Reflections
            </button>
          </div>
        </div>

        <!-- Analysis Sidebar -->
        <div class="analysis-panel" id="analysis-panel-container">
          ${analysisPanelHtml}
        </div>
      </div>
    `;
  },

  attachListeners(state, setState) {
    const journalInput = document.getElementById('journal-input');
    const wordCountDisplay = document.getElementById('word-count-display');
    const btnRefreshPrompt = document.getElementById('btn-refresh-prompt');
    const btnAnalyzeJournal = document.getElementById('btn-analyze-journal');
    const btnTriggerAdvice = document.getElementById('btn-trigger-advice');

    // Restore text if they recently typed
    if (journalInput && latestSessionText) {
      journalInput.value = latestSessionText;
      updateWordCount(latestSessionText);
    }

    function updateWordCount(text) {
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      if (wordCountDisplay) {
        wordCountDisplay.textContent = `${words} word${words !== 1 ? 's' : ''}`;
      }
    }

    if (journalInput) {
      journalInput.addEventListener('input', (e) => {
        latestSessionText = e.target.value;
        updateWordCount(e.target.value);
      });
    }

    // Refresh Prompt
    if (btnRefreshPrompt) {
      btnRefreshPrompt.addEventListener('click', () => {
        activePromptIndex = (activePromptIndex + 1) % JOURNAL_PROMPTS.length;
        // Keep text preserved during prompt cycling
        setState(prev => ({ ...prev }));
      });
    }

    // Trigger Coping Action
    if (btnTriggerAdvice) {
      btnTriggerAdvice.addEventListener('click', () => {
        const latestJournal = state.journals[state.journals.length - 1];
        if (latestJournal && latestJournal.analysis?.advice) {
          const actionTitle = latestJournal.analysis.advice.title.toLowerCase();
          
          if (actionTitle.includes('breathing') || actionTitle.includes('box')) {
            // Switch to mindfulness breathing
            setState({ activeTab: 'mindfulness' });
            // Alert in mindfulness component can auto-select breathing tab
            window.activeMindfulnessTab = 'breathing';
          } else if (actionTitle.includes('grounding') || actionTitle.includes('5-4-3-2-1') || actionTitle.includes('refram')) {
            setState({ activeTab: 'mindfulness' });
            window.activeMindfulnessTab = 'reframer';
          } else {
            // Default to mindfulness hub soundscapes
            setState({ activeTab: 'mindfulness' });
            window.activeMindfulnessTab = 'soundscapes';
          }
        }
      });
    }

    // Run AI analysis
    if (btnAnalyzeJournal) {
      btnAnalyzeJournal.addEventListener('click', async () => {
        const text = journalInput ? journalInput.value.trim() : '';
        if (!text) {
          alert('Please write something in your journal first!');
          return;
        }

        if (text.split(/\s+/).length < 5) {
          alert('Please write a slightly longer reflection (at least 5 words) for analysis.');
          return;
        }

        isAnalyzing = true;
        // Re-render to show loading status
        setState(prev => ({ ...prev }));

        try {
          const analysis = await GenAI.analyzeJournal(text, state.profile);
          
          isAnalyzing = false;
          latestSessionText = ''; // Reset writing buffer

          // Append journal with analysis
          setState(prev => {
            const today = new Date().toISOString().split('T')[0];
            const newJournal = {
              date: today,
              text: text,
              analysis: analysis
            };

            // Also feed mood check-in score automatically if it aligns
            // (e.g. if the journal is analyzed, update the user mood graph with the dynamic score)
            let updatedLogs = [...prev.moodLogs];
            const todayIndex = updatedLogs.findIndex(l => l.date === today);
            
            // Map burnoutLevel to mood score (low = good mood, high = stressed/exhausted mood)
            let inferredScore = 60; // Okay
            let inferredMood = 'Okay';
            if (analysis.burnoutLevel === 'high') {
              inferredScore = 20;
              inferredMood = 'Burned Out';
            } else if (analysis.burnoutLevel === 'med') {
              inferredScore = 40;
              inferredMood = 'Stressed';
            } else {
              inferredScore = 80;
              inferredMood = 'Good';
            }

            if (todayIndex > -1) {
              // Only overwrite if notes were blank or to align logs
              updatedLogs[todayIndex].score = Math.round((updatedLogs[todayIndex].score + inferredScore) / 2);
            } else {
              updatedLogs.push({
                date: today,
                mood: inferredMood,
                score: inferredScore,
                note: `AI Inferred: ${analysis.triggers[0] || 'Reflection check'}`
              });
            }

            return {
              journals: [...prev.journals, newJournal],
              moodLogs: updatedLogs
            };
          });
        } catch (err) {
          isAnalyzing = false;
          setState(prev => ({ ...prev }));
          alert(`Analysis failed: ${err.message}. Running locally instead.`);
        }
      });
    }
  }
};

// Simple module-level variable to preserve typed text between view changes
let latestSessionText = '';
