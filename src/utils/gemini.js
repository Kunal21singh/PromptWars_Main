// Gemini API Connector & Fallback Simulation Engine for Zenith

// In-memory API key storage: keep the key in runtime memory and avoid persisting it into localStorage.
let cachedApiKey = '';

export const GeminiConfig = {
  getApiKey() {
    return cachedApiKey;
  },
  setApiKey(key) {
    cachedApiKey = key ? key.trim() : '';
  },
  hasKey() {
    return Boolean(cachedApiKey);
  }
};

// Main function to query Gemini API
async function callGemini(systemPrompt, userPrompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\nUser Input:\n${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `API error (${response.status})`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API');
  
  return text;
}

// Clean JSON code blocks returned by LLMs
function extractJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return JSON.parse(cleaned.trim());
}

export const GenAI = {
  // 1. Analyze daily journaling entries
  async analyzeJournal(journalText, profile) {
    const apiKey = GeminiConfig.getApiKey();
    
    if (!apiKey) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return simulateJournalAnalysis(journalText, profile);
    }

    const systemPrompt = `You are a specialist clinical psychologist and student well-being coach. 
Analyze the student's daily journal entry. The student is preparing for a high-stakes exam: ${profile.exam}.
Identify their current emotional state, hidden stress triggers, and risk of burnout.
You must output a valid JSON object EXACTLY in the format below. Do not output any text before or after the JSON.

JSON Structure:
{
  "emotions": {
    "anxiety": <integer between 0 and 100 representing level of worry/anxiety>,
    "exhaustion": <integer between 0 and 100 representing physical/mental fatigue>,
    "selfDoubt": <integer between 0 and 100 representing self-criticism or doubt>,
    "motivation": <integer between 0 and 100 representing drive/determination>
  },
  "triggers": [
    "<trigger 1: e.g., Chemistry mock test, lack of sleep, peer comparison, long study hours>",
    "<trigger 2: maximum 3 triggers>"
  ],
  "burnoutLevel": "<'low' | 'med' | 'high'>",
  "counsel": "<A highly empathetic, 2-3 sentence personalized assessment. Validate their struggle specifically for ${profile.exam} and give warm encouragement. Avoid generic platitudes.>",
  "advice": {
    "title": "<A concise action title, e.g., 'Try a 5-Minute Brain-Dump' or 'Take a Mindful Walk'>",
    "body": "<A short 1-2 sentence instruction explaining exactly how to execute this quick mental refresh action right now.>"
  }
}`;

    try {
      const responseText = await callGemini(systemPrompt, journalText, apiKey);
      return extractJson(responseText);
    } catch (e) {
      console.error('Gemini API call failed, running mock fallback:', e);
      return simulateJournalAnalysis(journalText, profile);
    }
  },

  // 2. Chatbot response with full context
  async getCompanionResponse(userMessage, chatHistory, profile) {
    const apiKey = GeminiConfig.getApiKey();

    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return simulateCompanionChat(userMessage, chatHistory, profile);
    }

    // Build chat context
    const examInfo = `Student Profile: Preparing for ${profile.exam}. Target study hours: ${profile.dailyHoursTarget}h/day. Main stressors: ${profile.stressors?.join(', ') || 'General exam pressure'}.`;
    const systemPrompt = `You are "Zenith", an empathetic, wise, and warm digital companion for students under high stress from competitive entrance exams (e.g. JEE, NEET, UPSC).
Your role is to offer support, validate their stress, help them break down study burnout, and suggest quick breathing/mindfulness tactics.
Be warm, conversational, and direct. Keep responses under 4 sentences unless asked for detailed explanations. Use emojis occasionally to feel friendly.
Always keep in mind the student's profile:
${examInfo}

Here is the conversation history:
${chatHistory.map(h => `${h.role === 'user' ? 'Student' : 'Zenith'}: ${h.content}`).join('\n')}
`;

    try {
      return await callGemini(systemPrompt, userMessage, apiKey);
    } catch (e) {
      console.error('Gemini API chat failed, running mock fallback:', e);
      return simulateCompanionChat(userMessage, chatHistory, profile);
    }
  },

  // 3. Cognitive Reframer for anxious thoughts
  async reframeThought(thoughtText, profile) {
    const apiKey = GeminiConfig.getApiKey();
    
    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return simulateThoughtReframing(thoughtText, profile);
    }

    const systemPrompt = `You are a Cognitive Behavioral Therapist (CBT) specializing in exam-related stress and student anxiety.
The student is preparing for ${profile.exam}.
Analyze their self-limiting, anxious, or self-critical thought (cognitive distortion like catastrophizing, mind reading, or black-and-white thinking).
Generate a balanced, realistic, and encouraging cognitive reframe.
You must output a valid JSON object EXACTLY in the format below. Do not output any text before or after the JSON.

JSON Structure:
{
  "distortionType": "<e.g., Catastrophizing, All-or-Nothing Thinking, Overgeneralization, Labeling>",
  "reframedThought": "<A highly empathetic, realistic, and balanced alternative thought that validates their struggle but removes the distortion. Keep it under 3 sentences.>"
}`;

    try {
      const responseText = await callGemini(systemPrompt, thoughtText, apiKey);
      return extractJson(responseText);
    } catch (e) {
      console.error('Gemini API reframing failed, running mock fallback:', e);
      return simulateThoughtReframing(thoughtText, profile);
    }
  }
};

/* --- HIGH-FIDELITY SIMULATION ENGINES (Fallback when API key is missing) --- */

function simulateJournalAnalysis(text, profile) {
  const lowerText = text.toLowerCase();
  
  // Base default metrics
  let anxiety = 45;
  let exhaustion = 35;
  let selfDoubt = 30;
  let motivation = 65;
  let triggers = [];

  // Scrape text for keywords to dynamically adapt parameters
  if (lowerText.match(/(fail|worst|can\'t|never|cannot|drop|quit)/)) {
    selfDoubt += 40;
    anxiety += 25;
    motivation -= 35;
    triggers.push("Fear of failure");
  }
  if (lowerText.match(/(tired|sleep|exhausted|sleepy|lazy|fatigue|rest|burn)/)) {
    exhaustion += 45;
    anxiety += 10;
    motivation -= 15;
    triggers.push("Sleep deficit / Fatigue");
  }
  if (lowerText.match(/(mock|test|exam|score|percent|marks|rank)/)) {
    anxiety += 30;
    selfDoubt += 15;
    triggers.push("Mock test assessment");
  }
  if (lowerText.match(/(physics|chemistry|maths|biology|history|syllabus|revision)/)) {
    anxiety += 15;
    triggers.push("Syllabus coverage pressure");
  }
  if (lowerText.match(/(parents|peer|friend|coaching|society| Sharma| Sharmaji)/)) {
    selfDoubt += 20;
    anxiety += 20;
    triggers.push("External expectations");
  }

  // Cap values between 5 and 95
  anxiety = Math.max(5, Math.min(95, anxiety));
  exhaustion = Math.max(5, Math.min(95, exhaustion));
  selfDoubt = Math.max(5, Math.min(95, selfDoubt));
  motivation = Math.max(5, Math.min(95, motivation));

  if (triggers.length === 0) {
    triggers.push("General study overload");
  }

  // Determine burnout risk level
  const score = (anxiety + exhaustion + selfDoubt) / 3;
  let burnoutLevel = 'low';
  if (score > 65) burnoutLevel = 'high';
  else if (score > 40) burnoutLevel = 'med';

  // Customize counseling text based on exam
  let counsel = "";
  let advice = { title: "", body: "" };

  if (burnoutLevel === 'high') {
    counsel = `I hear how heavy things feel right now. Preparing for ${profile.exam} is an immense challenge, and it's completely natural to hit a wall when pushing yourself this hard. Please remember that your value is not defined by any single study day or test score.`;
    advice = {
      title: "5-4-3-2-1 Grounding Method",
      body: "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste to immediately pull your mind out of stress loops."
    };
  } else if (burnoutLevel === 'med') {
    counsel = `You are maintaining a strong efforts for ${profile.exam}, but your exhaustion levels suggest it's time for a structured buffer break. Stepping away for a short while will actually improve your memory retention and focus when you return.`;
    advice = {
      title: "Box Breathing",
      body: "Go to the Mindfulness tab and do a 3-minute Box Breathing session. It instantly resets your autonomic nervous system."
    };
  } else {
    counsel = `You're in a great mental space today! Keep this positive momentum going for your ${profile.exam} prep. Make sure to pace yourself so you don't burn out later in the week.`;
    advice = {
      title: "Mindful Hydration",
      body: "Stand up, stretch, and drink a slow glass of cold water. Focus solely on the sensation of coolness to center your mind."
    };
  }

  return {
    emotions: { anxiety, exhaustion, selfDoubt, motivation },
    triggers: triggers.slice(0, 3),
    burnoutLevel,
    counsel,
    advice
  };
}

function simulateCompanionChat(message, history, profile) {
  const msg = message.toLowerCase();
  
  // Specific templates based on student inputs
  if (msg.includes("anxious") || msg.includes("anxiety") || msg.includes("scared") || msg.includes("afraid")) {
    return `Exam anxiety is highly real, especially with the high stakes of ${profile.exam}. When you feel your heart racing, try to lengthen your exhales. Would you like to do a quick 2-minute box breathing session with me right now? 🌿`;
  }
  if (msg.includes("tired") || msg.includes("sleep") || msg.includes("exhausted") || msg.includes("burnout") || msg.includes("sleepy")) {
    return `Physical exhaustion blocks mental focus. If you've been studying chemistry or notes for hours, your brain is signaling for a shutdown. I suggest putting the books down for 15 minutes. Take a quick nap or walk away from your desk. You've worked hard today. 🔋`;
  }
  if (msg.includes("mock") || msg.includes("score") || msg.includes("test") || msg.includes("marks") || msg.includes("fail")) {
    return `Mock tests are diagnostics, not final judgments. They simply highlight areas to revise for ${profile.exam}, not your destiny. Take a deep breath, write down the mistakes, and review them tomorrow when you are fresh. You are learning! 📈`;
  }
  if (msg.includes("parent") || msg.includes("peer") || msg.includes("comparison") || msg.includes("friend") || msg.includes("pressure")) {
    return `Coaching centers and family expectations can create a suffocating pressure cooker. Remember: your path is unique. Try to filter out the noise of what others are doing. You are only competing with who you were yesterday. I'm rooting for you. 💫`;
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return `Hey there! I'm Zenith, your companion. I know preparing for ${profile.exam} is an exhausting climb. How are you holding up today? I'm here to listen. 💙`;
  }
  if (msg.includes("help") || msg.includes("what can you do")) {
    return `I can help analyze your journal entries for stress triggers, guide you through a box-breathing cycle, generate alpha-wave binaural beats to help you focus, or simply listen while you vent about ${profile.exam} prep! What would you like to explore?`;
  }
  
  // General responses
  const randomGems = [
    `I understand. Remember, prep for ${profile.exam} is a marathon, not a sprint. Taking a deep breath and focusing on just the next single hour is the best way forward. 🏃‍♂️`,
    `That sounds really stressful. It is completely okay to feel overwhelmed sometimes. What is one small study task we can simplify or break down to make it easier? 📝`,
    `You are working incredibly hard. Don't forget to give yourself credit for showing up and putting in the effort. How are your sleeping hours looking lately? 💤`,
    `I'm right here with you. When self-doubt creeps in, try to focus on how much you have already covered since you started. Every page read is progress. 📖`
  ];
  
  return randomGems[Math.floor(Math.random() * randomGems.length)];
}

function simulateThoughtReframing(thought, profile) {
  const lower = thought.toLowerCase();
  let distortionType = "All-or-Nothing Thinking";
  let reframedThought = `Preparing for ${profile.exam} is a demanding journey, but a single day or test score doesn't dictate your value or future. You are growing and learning every day.`;

  if (lower.includes("fail") || lower.includes("life is over") || lower.includes("ruin") || lower.includes("destroy")) {
    distortionType = "Catastrophizing";
    reframedThought = `While failing an exam feels daunting, your life is broad and full of opportunities. There are many alternative paths to your goals, and a test cannot define your future success.`;
  } else if (lower.includes("never") || lower.includes("can't") || lower.includes("always") || lower.includes("unable")) {
    distortionType = "Overgeneralization";
    reframedThought = `Saying you 'never' understand is an overgeneralization. Think of the concepts you have already mastered. Focus on steady, daily practice rather than expecting instant mastery of everything.`;
  } else if (lower.includes("parent") || lower.includes("peer") || lower.includes("everyone") || lower.includes("shame") || lower.includes("disappoint")) {
    distortionType = "Mind Reading / External Pressure";
    reframedThought = `You are carrying heavy expectations, but the people who care about you ultimately want your safety and happiness. Focus on doing your best for your own growth, not managing external expectations.`;
  } else if (lower.includes("lazy") || lower.includes("stupid") || lower.includes("useless") || lower.includes("dumb")) {
    distortionType = "Labeling";
    reframedThought = `Labeling yourself harshly is counterproductive and untrue. You are a dedicated student experiencing heavy fatigue. Resting is a vital part of learning, not a personal failure.`;
  }

  return {
    distortionType,
    reframedThought
  };
}
