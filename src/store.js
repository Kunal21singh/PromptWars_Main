// Central State Store for Zenith Well-being Companion

const DEFAULT_STATE = {
  currentUser: null,
  activeTab: 'dashboard',
  isOnboarded: false,
  accountsList: [],
  profile: {
    name: 'Aspirant',
    exam: 'JEE',
    examDate: new Date(new Date().getFullYear() + 1, 3, 1).toISOString().split('T')[0], // April next year
    dailyHoursTarget: 8,
    stressors: ['Mock Tests', 'Time Management']
  },
  moodLogs: [
    // Pre-populate with a week's worth of data for beautiful chart rendering out of the box
    { date: '2026-06-21', mood: 'Good', score: 80, note: 'Had a productive chemistry revision' },
    { date: '2026-06-22', mood: 'Okay', score: 60, note: 'Physics test went average' },
    { date: '2026-06-23', mood: 'Stressed', score: 35, note: 'Mock test scores dropped' },
    { date: '2026-06-24', mood: 'Okay', score: 55, note: 'Slept a bit better today' },
    { date: '2026-06-25', mood: 'Burned Out', score: 20, note: 'Studied for 10 hours, feeling completely exhausted' },
    { date: '2026-06-26', mood: 'Good', score: 75, note: 'Spoke to a friend, felt lighter' }
  ],
  journals: [],
  chatHistory: [
    { role: 'bot', content: 'Hi there! I am Zenith, your academic well-being companion. Preparing for high-stakes exams can be incredibly stressful. How are you holding up today?' }
  ],
  soundscape: {
    playing: false,
    type: 'waves', // 'waves', 'binaural', 'rain'
    volume: 0.5
  },
  pomodoro: {
    secondsLeft: 1500, // 25 minutes
    running: false,
    type: 'work' // 'work', 'break'
  }
};

export const store = {
  state: { ...DEFAULT_STATE },
  listeners: [],
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  
  setState(updater) {
    const updates = typeof updater === 'function' ? updater(this.state) : updater;
    
    const nextState = { ...this.state, ...updates };
    if (updates.profile) nextState.profile = { ...this.state.profile, ...updates.profile };
    if (updates.soundscape) nextState.soundscape = { ...this.state.soundscape, ...updates.soundscape };
    if (updates.pomodoro) nextState.pomodoro = { ...this.state.pomodoro, ...updates.pomodoro };

    this.state = nextState;
    
        this.listeners.forEach(listener => listener(this.state));

    // Async syncable state synchronization with BigQuery (skip Pomodoro/Soundscape tickers to save requests)
    const hasSyncableUpdates = updates.profile || updates.moodLogs || updates.journals || updates.chatHistory;
    if (this.state.currentUser && hasSyncableUpdates) {
      this.syncUserData();
    }
  },

  async syncUserData() {
    if (!this.state.currentUser) return;
    const profileData = {
      profile: this.state.profile,
      moodLogs: this.state.moodLogs,
      journals: this.state.journals,
      chatHistory: this.state.chatHistory,
      soundscape: this.state.soundscape,
      pomodoro: this.state.pomodoro
    };
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData })
      });
      const data = await response.json();
      if (!data.success) {
        console.error('[Sync] Failed to sync state to BigQuery:', data.message);
      }
    } catch (e) {
      console.error('[Sync] Backend connection failed during synchronization:', e);
    }
  },

  getAccountsList() {
    return this.state.accountsList || [];
  },

  async fetchAccounts() {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success) {
        this.setState({ accountsList: data.accounts });
      }
    } catch (e) {
      console.error('[Store] Failed to fetch accounts from backend:', e);
    }
  },

  async registerAccount(name, password, profile) {
    try {
      const payload = {
        username: name.trim(),
        password,
        profile: {
          profile,
          moodLogs: [...DEFAULT_STATE.moodLogs],
          journals: [],
          chatHistory: [...DEFAULT_STATE.chatHistory],
          soundscape: { ...DEFAULT_STATE.soundscape },
          pomodoro: { ...DEFAULT_STATE.pomodoro }
        }
      };

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!data.success) {
        return { success: false, message: data.message };
      }

      const userProfile = data.profile;
      this.setState({
        currentUser: data.username,
        isOnboarded: true,
        activeTab: 'dashboard',
        profile: userProfile.profile,
        moodLogs: userProfile.moodLogs || [...DEFAULT_STATE.moodLogs],
        journals: userProfile.journals || [],
        chatHistory: userProfile.chatHistory || [...DEFAULT_STATE.chatHistory],
        soundscape: userProfile.soundscape || { ...DEFAULT_STATE.soundscape },
        pomodoro: userProfile.pomodoro || { ...DEFAULT_STATE.pomodoro }
      });

      await this.fetchAccounts();
      return { success: true };
    } catch (e) {
      console.error('[Store] Registration error:', e);
      return { success: false, message: 'Server connection error.' };
    }
  },

  async loginUser(name, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name.trim(), password })
      });

      const data = await response.json();
      if (!data.success) {
        return { success: false, message: data.message };
      }

      this.setState({
        currentUser: data.username,
        isOnboarded: true,
        activeTab: 'dashboard',
        profile: data.profile || { ...DEFAULT_STATE.profile },
        moodLogs: data.moodLogs || [...DEFAULT_STATE.moodLogs],
        journals: data.journals || [],
        chatHistory: data.chatHistory || [...DEFAULT_STATE.chatHistory],
        soundscape: data.soundscape || { ...DEFAULT_STATE.soundscape },
        pomodoro: data.pomodoro || { ...DEFAULT_STATE.pomodoro }
      });

      return { success: true };
    } catch (e) {
      console.error('[Store] Login error:', e);
      return { success: false, message: 'Server connection error.' };
    }
  },

  async logoutUser() {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      console.error('[Store] Logout request failed:', e);
    }

    this.setState({
      currentUser: null,
      isOnboarded: false,
      activeTab: 'dashboard',
      profile: { ...DEFAULT_STATE.profile },
      moodLogs: [...DEFAULT_STATE.moodLogs],
      journals: [],
      chatHistory: [...DEFAULT_STATE.chatHistory],
      soundscape: { ...DEFAULT_STATE.soundscape },
      pomodoro: { ...DEFAULT_STATE.pomodoro }
    });
  },

  async changePassword(oldPassword, newPassword) {
    if (!this.state.currentUser) {
      return { success: false, message: 'No user is currently logged in.' };
    }
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await response.json();
      return data;
    } catch (e) {
      console.error('[Store] Password change error:', e);
      return { success: false, message: 'Server connection error.' };
    }
  }
};

      return { success: false, message: 'Server connection error.' };
    }
  }
};
