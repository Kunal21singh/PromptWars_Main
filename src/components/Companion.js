// AI Conversational Companion Component for Zenith
import { GenAI } from '../utils/gemini.js';
import { escapeHtml } from '../utils/sanitize.js';

let isBotTyping = false;

export default {
  render(state) {
    const chatHtml = state.chatHistory.map(msg => {
      const isBot = msg.role === 'bot';
      const timeStr = msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="chat-message ${isBot ? 'bot' : 'user'}">
          <div class="message-bubble">
            ${escapeHtml(msg.content)}
          </div>
          <div class="message-time">${escapeHtml(timeStr)}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="view-header fade-in">
        <div class="view-title-group">
          <h1>AI Companion</h1>
          <div class="view-subtitle">An empathetic, always-available digital companion to guide you through exam pressure.</div>
        </div>
        <div style="font-size: 0.75rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--accent-danger); padding: 0.5rem 1rem; border-radius: 8px; max-width: 400px;">
          <strong>Disclaimer:</strong> Zenith is an AI stress advisor, not a clinical therapy replacement. If you are experiencing severe crisis, please contact your local student helpline.
        </div>
      </div>

      <div class="chat-layout fade-in">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="bot-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </div>
          <div class="bot-info">
            <span class="bot-name">Zenith AI</span>
            <div class="bot-status">
              <span class="status-dot"></span>
              <span>Empathetic Listener</span>
            </div>
          </div>
          <button class="btn btn-secondary" id="btn-clear-chat" style="margin-left: auto; font-size: 0.75rem; padding: 0.4rem 0.8rem; border-radius: 8px;">
            Clear History
          </button>
        </div>

        <!-- Messages Viewport -->
        <div class="chat-viewport" id="chat-viewport">
          ${chatHtml}
          ${isBotTyping ? `
            <div class="chat-message bot" id="chat-typing">
              <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Suggestion Chips -->
        <div class="chat-suggestions">
          <button class="suggestion-btn" data-msg="I'm feeling severe exam anxiety and panic right now.">Mock exam panic 😰</button>
          <button class="suggestion-btn" data-msg="I studied all day but feel like I forgot everything.">Syllabus self-doubt 🧠</button>
          <button class="suggestion-btn" data-msg="How can I recover and study after failing a mock test?">Mock test rebound 📈</button>
          <button class="suggestion-btn" data-msg="I am too exhausted to revise but feel guilty when resting.">Study exhaustion guilt 🔋</button>
        </div>

        <!-- Input Bar -->
        <div class="chat-input-container">
          <div class="chat-form">
            <input type="text" id="chat-input-field" class="chat-input" placeholder="Type your thoughts here (e.g. mock test pressure, can't focus)..." autocomplete="off" />
            <button class="btn btn-primary" id="btn-send-chat" style="border-radius: 12px; padding: 0 1.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },
          <div class="view-subtitle">An empathetic, always-available digital companion to guide you through exam pressure.</div>
        </div>
        <div style="font-size: 0.75rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--accent-danger); padding: 0.5rem 1rem; border-radius: 8px; max-width: 400px;">
          <strong>Disclaimer:</strong> Zenith is an AI stress advisor, not a clinical therapy replacement. If you are experiencing severe crisis, please contact your local student helpline.
        </div>
      </div>

      <div class="chat-layout fade-in">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="bot-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </div>
          <div class="bot-info">
            <span class="bot-name">Zenith AI</span>
            <div class="bot-status">
              <span class="status-dot"></span>
              <span>Empathetic Listener</span>
            </div>
          </div>
          <button class="btn btn-secondary" id="btn-clear-chat" style="margin-left: auto; font-size: 0.75rem; padding: 0.4rem 0.8rem; border-radius: 8px;">
            Clear History
          </button>
        </div>

        <!-- Messages Viewport -->
        <div class="chat-viewport" id="chat-viewport">
          ${chatHtml}
          ${isBotTyping ? `
            <div class="chat-message bot" id="chat-typing">
              <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Suggestion Chips -->
        <div class="chat-suggestions">
          <button class="suggestion-btn" data-msg="I'm feeling severe exam anxiety and panic right now.">Mock exam panic 😰</button>
          <button class="suggestion-btn" data-msg="I studied all day but feel like I forgot everything.">Syllabus self-doubt 🧠</button>
          <button class="suggestion-btn" data-msg="How can I recover and study after failing a mock test?">Mock test rebound 📈</button>
          <button class="suggestion-btn" data-msg="I am too exhausted to revise but feel guilty when resting.">Study exhaustion guilt 🔋</button>
        </div>

        <!-- Input Bar -->
        <div class="chat-input-container">
          <div class="chat-form">
            <input type="text" id="chat-input-field" class="chat-input" placeholder="Type your thoughts here (e.g. mock test pressure, can't focus)..." autocomplete="off" />
            <button class="btn btn-primary" id="btn-send-chat" style="border-radius: 12px; padding: 0 1.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  attachListeners(state, setState) {
    const chatViewport = document.getElementById('chat-viewport');
    const inputField = document.getElementById('chat-input-field');
    const sendBtn = document.getElementById('btn-send-chat');
    const clearBtn = document.getElementById('btn-clear-chat');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');

    // Scroll chat viewport to the bottom
    function scrollToBottom() {
      if (chatViewport) {
        chatViewport.scrollTop = chatViewport.scrollHeight;
      }
    }

    scrollToBottom();

    // Function to submit user message
    async function submitMessage(text) {
      if (!text || isBotTyping) return;

      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsg = { role: 'user', content: text, time: timeNow };
      const updatedHistory = [...state.chatHistory, userMsg];

      // Update state with user message and show typing animation
      isBotTyping = true;
      setState({ chatHistory: updatedHistory });

      if (inputField) inputField.value = '';

      try {
        const reply = await GenAI.getCompanionResponse(text, updatedHistory.slice(-6), state.profile);
        
        isBotTyping = false;
        const botMsg = { role: 'bot', content: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        
        setState({
          chatHistory: [...updatedHistory, botMsg]
        });
      } catch (err) {
        console.error('Chat bot error:', err);
        isBotTyping = false;
        
        const errorMsg = { 
          role: 'bot', 
          content: 'Sorry, I hit a brief mental block. Let\'s try box breathing for a minute, or ask me again. 🌿', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        
        setState({
          chatHistory: [...updatedHistory, errorMsg]
        });
      }
    }

    // Input handlers
    if (sendBtn && inputField) {
      sendBtn.addEventListener('click', () => {
        submitMessage(inputField.value.trim());
      });

      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          submitMessage(inputField.value.trim());
        }
      });
    }

    // Suggestion chips handler
    suggestionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-msg');
        if (msg) {
          submitMessage(msg);
        }
      });
    });

    // Clear chat handler
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your chat companion history?')) {
          setState({
            chatHistory: [
              { 
                role: 'bot', 
                content: `Hi ${state.profile.name || 'there'}! I am Zenith, your academic well-being companion. Preparing for high-stakes exams can be incredibly stressful. How are you holding up today?` 
              }
            ]
          });
        }
      });
    }
  }
};
