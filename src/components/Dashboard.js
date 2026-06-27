// Dashboard Component for Zenith
import { escapeHtml } from '../utils/sanitize.js';

export default {
  render(state) {
    const { name, exam, examDate } = state.profile;
    
    // Calculate days remaining to exam
    const safeName = escapeHtml(name || 'Aspirant');
    const safeExam = escapeHtml(exam || 'Your exam');
    const daysLeft = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
    const countdownText = daysLeft > 0 ? `${daysLeft} days until ${safeExam}` : `Exam Day is here!`;

    // Calculate current average stress index (0-100, where higher is more stress)
    // We compute this from mood logs (mood score represents well-being: 100 - score = stress)
    let stressIndex = 40; // Default fallback
    let latestMood = 'Okay';
    let latestNote = 'No log today yet';

    if (state.moodLogs.length > 0) {
      const latestLog = state.moodLogs[state.moodLogs.length - 1];
      latestMood = latestLog.mood;
      latestNote = latestLog.note || 'No notes added';

      const recentLogs = state.moodLogs.slice(-3);
      const avgWellbeing = recentLogs.reduce((sum, log) => sum + log.score, 0) / recentLogs.length;
      stressIndex = Math.round(100 - avgWellbeing);
    }

    // Determine color and status for stress
    let stressColor = 'var(--accent-secondary)';
    let stressLabel = 'Optimal';
    if (stressIndex > 65) {
      stressColor = 'var(--accent-danger)';
      stressLabel = 'Severe';
    } else if (stressIndex > 40) {
      stressColor = 'var(--accent-warning)';
      stressLabel = 'Moderate';
    }

    // Calculate radial gauge offsets
    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (stressIndex / 100) * circumference;

    // Burnout Index (based on exhaustion scores in recent journals / logs)
    let burnoutScore = 30;
    if (state.journals.length > 0) {
      const recentJournals = state.journals.slice(-3);
      const totalExhaustion = recentJournals.reduce((sum, j) => sum + (j.analysis?.emotions?.exhaustion || 0), 0);
      burnoutScore = Math.round(totalExhaustion / recentJournals.length);
    } else if (state.moodLogs.length > 0) {
      // Proxy burnout from low mood scores
      const recentExhaust = state.moodLogs.slice(-3).reduce((sum, l) => sum + (100 - l.score), 0) / 3;
      burnoutScore = Math.round(recentExhaust * 0.8);
    }

    let burnoutStatus = 'Low Risk';
    let burnoutColor = 'var(--accent-success)';
    let burnoutTip = 'Your pace is healthy. Keep scheduled breaks in place.';
    if (burnoutScore > 70) {
      burnoutStatus = 'High Risk';
      burnoutColor = 'var(--accent-danger)';
      burnoutTip = 'Critical: Your brain is signaling severe fatigue. Skip next revision block for recovery sleep.';
    } else if (burnoutScore > 40) {
      burnoutStatus = 'Moderate';
      burnoutColor = 'var(--accent-warning)';
      burnoutTip = 'Warning: Self-doubt and exhaustion are building. Try a 10-minute walk.';
    }

    // Generate weekly chart SVG path
    const svgChart = generateSvgChart(state.moodLogs);

    // Get latest AI Triggers
    let triggersHtml = '';
    if (state.journals.length > 0 && state.journals[state.journals.length - 1].analysis?.triggers) {
      const activeTriggers = state.journals[state.journals.length - 1].analysis.triggers;
      triggersHtml = activeTriggers.map(t => `
        <div class="insight-item">
          <div class="insight-icon-container warning">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <div class="insight-body">
            <div class="insight-title">${escapeHtml(t)}</div>
            <div class="insight-desc">Triggering stress spikes during recent study cycles.</div>
          </div>
        </div>
      `).join('');
    } else {
      triggersHtml = `
        <div class="empty-placeholder" style="padding: 1rem 0;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
          </svg>
          <div class="insight-desc" style="font-size: 0.8rem;">Write your first entry in the <strong>AI Journal</strong> tab to extract hidden stress triggers.</div>
        </div>
      `;
    }

    // Format Pomodoro Time
    const min = String(Math.floor(state.pomodoro.secondsLeft / 60)).padStart(2, '0');
    const sec = String(state.pomodoro.secondsLeft % 60).padStart(2, '0');
    const timerLabel = state.pomodoro.type === 'work' ? 'FOCUS SESSION' : 'MIND BUFFER BREAK';

    return `
      <div class="view-header fade-in">
        <div class="view-title-group">
          <h1>Stay Centered, ${safeName}</h1>
          <div class="view-subtitle">A digital workspace designed to protect your mental well-being.</div>
        </div>
        <div class="logo-badge" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
          ${countdownText}
        </div>
      </div>

      <div class="dashboard-grid fade-in">
        <!-- Hero Welcome Widget -->
        <div class="card hero-card col-12">
          <div class="hero-content">
            <div class="hero-text">
              <h2>Let's handle the pressure together.</h2>
              <p style="color: var(--text-secondary); max-width: 600px; font-size: 0.9rem;">
                Zenith uses Generative AI to identify stress signals, track burnout patterns, and provide custom psychological coping mechanisms for students facing high-stakes tests.
              </p>
            </div>
            <button class="btn btn-primary" id="btn-quick-journal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
              Open Daily Journal
            </button>
          </div>
        </div>

        <!-- Quick Mood check-in -->
        <div class="card col-6">
          <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem;">Daily Check-in</div>
          <div class="view-subtitle" style="margin-bottom: 1rem; font-size: 0.85rem;">How are you dealing with the syllabus load today?</div>
          
          <div class="mood-checkin">
            <div class="mood-selector">
              <div class="mood-btn" data-mood="Awesome" data-score="95">
                <span class="mood-emoji">😊</span>
                <span class="mood-label">Awesome</span>
              </div>
              <div class="mood-btn" data-mood="Good" data-score="75">
                <span class="mood-emoji">🙂</span>
                <span class="mood-label">Good</span>
              </div>
              <div class="mood-btn" data-mood="Okay" data-score="50">
                <span class="mood-emoji">😐</span>
                <span class="mood-label">Okay</span>
              </div>
              <div class="mood-btn" data-mood="Stressed" data-score="30">
                <span class="mood-emoji">😰</span>
                <span class="mood-label">Stressed</span>
              </div>
              <div class="mood-btn" data-mood="Burned Out" data-score="10">
                <span class="mood-emoji">😫</span>
                <span class="mood-label">Exhausted</span>
              </div>
            </div>
            
            <input type="text" id="mood-note" class="mood-note-input" placeholder="Add a quick note (e.g. finished mock test, chemistry is tough)..." />
            <button class="btn btn-secondary" id="btn-log-mood" style="width: 100%;">Save Daily Check-in</button>
          </div>
        </div>

        <!-- Pomodoro Study Focus Timer -->
        <div class="card col-6">
          <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">Study Buffer Timer</div>
          <div class="view-subtitle" style="margin-bottom: 1.25rem; font-size: 0.85rem;">Take a mindfulness break automatically after every 25 minutes of prep.</div>
          
          <div class="timer-container" style="background: var(--bg-secondary); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-light);">
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 0.7rem; color: var(--accent-secondary); font-weight: 700; letter-spacing: 0.05em;">${timerLabel}</span>
              <span class="timer-digits">${min}:${sec}</span>
            </div>
            <div class="timer-controls">
              <button class="btn btn-primary" id="btn-timer-toggle" style="padding: 0.6rem 1rem;">
                ${state.pomodoro.running ? 'Pause' : 'Start'}
              </button>
              <button class="btn btn-secondary" id="btn-timer-reset" style="padding: 0.6rem 1rem;">Reset</button>
            </div>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.75rem; text-align: center;">
            Recommended: Switch soundscapes to <strong>Binaural Focus Beats</strong> during sessions.
          </div>
        </div>

        <!-- Stress Level Radial Gauge -->
        <div class="card col-4">
          <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem;">Stress Index</div>
          <div class="view-subtitle" style="margin-bottom: 1rem; font-size: 0.85rem;">Average of recent well-being markers.</div>
          
          <div class="gauge-container">
            <div class="gauge-svg">
              <svg viewBox="0 0 140 140" width="100%" height="100%">
                <circle cx="70" cy="70" r="${radius}" class="gauge-bg" />
                <circle cx="70" cy="70" r="${radius}" class="gauge-fill" 
                        stroke="${stressColor}"
                        stroke-dasharray="${circumference}" 
                        stroke-dashoffset="${strokeDashoffset}" />
              </svg>
              <div class="gauge-value">
                <span class="gauge-number">${stressIndex}%</span>
                <span class="gauge-label" style="color: ${stressColor}">${stressLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Burnout Risk Tracker -->
        <div class="card col-4">
          <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem;">Burnout Risk</div>
          <div class="view-subtitle" style="margin-bottom: 1rem; font-size: 0.85rem;">Calculated based on mental fatigue signals.</div>
          
          <div class="burnout-tracker" style="margin-top: 1.5rem;">
            <div class="burnout-status">
              <span>Fatigue Score: ${burnoutScore}%</span>
              <span style="color: ${burnoutColor}">${burnoutStatus}</span>
            </div>
            <div class="burnout-bar-bg">
              <div class="burnout-bar-fill" style="width: ${burnoutScore}%; background-color: ${burnoutColor};"></div>
            </div>
            
            <div class="burnout-tip" style="margin-top: 1rem;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>${burnoutTip}</span>
            </div>
          </div>
        </div>

        <!-- AI Detected Stress Triggers -->
        <div class="card col-4">
          <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem;">AI Stress Triggers</div>
          <div class="view-subtitle" style="margin-bottom: 1rem; font-size: 0.85rem;">Extracted patterns from daily reflections.</div>
          
          <div class="insights-list">
            ${triggersHtml}
          </div>
        </div>

        <!-- Weekly Mood Trend Line Chart -->
        <div class="card col-12">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem;">Weekly Mood Trend</div>
              <div class="view-subtitle" style="font-size: 0.85rem;">Protects tracking of emotional recoveries and dips.</div>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Last 7 Check-ins</div>
          </div>
          <div class="chart-container">
            ${svgChart}
          </div>
        </div>
      </div>
    `;
  },

  attachListeners(state, setState) {
    // Quick journal navigation
    const btnQuickJournal = document.getElementById('btn-quick-journal');
    if (btnQuickJournal) {
      btnQuickJournal.addEventListener('click', () => {
        setState({ activeTab: 'journal' });
      });
    }

    // Mood Selector Interactions
    let selectedMood = null;
    let selectedScore = null;
    const moodBtns = document.querySelectorAll('.mood-btn');
    
    moodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        moodBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMood = btn.getAttribute('data-mood');
        selectedScore = parseInt(btn.getAttribute('data-score'));
      });
    });

    // Save Daily Mood Log
    const btnLogMood = document.getElementById('btn-log-mood');
    if (btnLogMood) {
      btnLogMood.addEventListener('click', () => {
        if (!selectedMood) {
          alert('Please select a mood emoji first!');
          return;
        }
        const noteInput = document.getElementById('mood-note');
        const note = noteInput ? noteInput.value.trim() : '';
        const todayDate = new Date().toISOString().split('T')[0];

        // Create new log
        const newLog = {
          date: todayDate,
          mood: selectedMood,
          score: selectedScore,
          note: note
        };

        // Add log (checking if a log for today already exists, and if so, updating it, or appending)
        setState(prev => {
          let updatedLogs = [...prev.moodLogs];
          const existingIndex = updatedLogs.findIndex(l => l.date === todayDate);
          
          if (existingIndex > -1) {
            updatedLogs[existingIndex] = newLog;
          } else {
            updatedLogs.push(newLog);
          }

          return {
            moodLogs: updatedLogs
          };
        });

        alert('Daily check-in saved!');
      });
    }

    // Timer Controls
    const btnTimerToggle = document.getElementById('btn-timer-toggle');
    if (btnTimerToggle) {
      btnTimerToggle.addEventListener('click', () => {
        setState(prev => ({
          pomodoro: {
            ...prev.pomodoro,
            running: !prev.pomodoro.running
          }
        }));
      });
    }

    const btnTimerReset = document.getElementById('btn-timer-reset');
    if (btnTimerReset) {
      btnTimerReset.addEventListener('click', () => {
        setState(prev => ({
          pomodoro: {
            ...prev.pomodoro,
            secondsLeft: prev.pomodoro.type === 'work' ? 1500 : 300,
            running: false
          }
        }));
      });
    }
  }
};

// Pure SVG line chart generator helper
function generateSvgChart(logs) {
  if (!logs || logs.length === 0) {
    return `<div style="text-align:center; padding: 2rem 0; color: var(--text-muted);">Not enough data for chart.</div>`;
  }

  // Take the last 7 logs
  const chartLogs = logs.slice(-7);
  
  // Chart dimensions
  const width = 800;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  // Chart boundaries
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Compute points
  const points = chartLogs.map((log, index) => {
    const x = paddingX + (index / Math.max(1, chartLogs.length - 1)) * chartWidth;
    // Score is 0-100 (where 100 is excellent mood, 0 is worst). Chart represents mood (higher is better).
    const y = paddingY + chartHeight - (log.score / 100) * chartHeight;
    return { x, y, mood: log.mood, score: log.score, date: log.date.substring(5) }; // just MM-DD
  });

  // Construct path string
  let pathD = '';
  let areaD = '';

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    areaD = `M ${points[0].x} ${paddingY + chartHeight} L ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
      areaD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    areaD += ` L ${points[points.length - 1].x} ${paddingY + chartHeight} Z`;
  }

  // Generate gridlines and labels
  const horizontalGridCount = 3;
  let gridLines = '';
  for (let i = 0; i <= horizontalGridCount; i++) {
    const yVal = paddingY + (i / horizontalGridCount) * chartHeight;
    const scoreVal = Math.round(100 - (i / horizontalGridCount) * 100);
    gridLines += `
      <line x1="${paddingX}" y1="${yVal}" x2="${width - paddingX}" y2="${yVal}" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      <text x="${paddingX - 10}" y="${yVal + 4}" fill="var(--text-muted)" font-size="9" text-anchor="end">${scoreVal}%</text>
    `;
  }

  const verticalLabels = points.map(p => `
    <text x="${p.x}" y="${height - 2}" fill="var(--text-muted)" font-size="9" text-anchor="middle">${p.date}</text>
  `).join('');

  const circles = points.map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--accent-primary)" stroke="var(--bg-secondary)" stroke-width="2" />
    <title>${p.mood} (${p.score}%) on ${p.date}</title>
  `).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
      <defs>
        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.3" />
          <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      
      <!-- Grid -->
      ${gridLines}
      
      <!-- Filled Area under curve -->
      ${points.length > 1 ? `<path d="${areaD}" fill="url(#chart-grad)" />` : ''}
      
      <!-- Line path -->
      ${points.length > 1 ? `<path d="${pathD}" fill="none" stroke="var(--accent-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ''}
      
      <!-- Data points -->
      ${circles}
      
      <!-- Labels -->
      ${verticalLabels}
    </svg>
  `;
}
