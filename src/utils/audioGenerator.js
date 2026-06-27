// Web Audio API Procedural Soundscape Generator for Zenith Student Companion

let audioCtx = null;
let activeNodes = {
  source: null,
  gain: null,
  filter: null,
  lfo: null,
  lfoGain: null,
  oscLeft: null,
  oscRight: null,
  pannerLeft: null,
  pannerRight: null
};

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Generate a 2-second buffer of white noise
function createNoiseBuffer() {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export const AudioSynth = {
  start(type, volume = 0.5) {
    this.stop();
    initAudioContext();

    const mainGain = audioCtx.createGain();
    mainGain.gain.setValueAtTime(volume, audioCtx.currentTime);
    mainGain.connect(audioCtx.destination);
    activeNodes.gain = mainGain;

    if (type === 'waves') {
      // Ocean Waves: White noise through a modulated Lowpass filter
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoiseBuffer();
      noise.loop = true;

      const lowpass = audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(300, audioCtx.currentTime);
      lowpass.Q.setValueAtTime(1, audioCtx.currentTime);

      // LFO to simulate breathing / rolling waves
      const lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, lfo.currentTime); // ~8 seconds per wave cycle

      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(200, audioCtx.currentTime); // sweep filter frequency by 200Hz

      lfo.connect(lfoGain);
      lfoGain.connect(lowpass.frequency);
      
      // Secondary LFO to modulate volume slightly for natural breathing effect
      const volumeLfo = audioCtx.createOscillator();
      volumeLfo.frequency.setValueAtTime(0.12, volumeLfo.currentTime);
      
      const volumeLfoGain = audioCtx.createGain();
      volumeLfoGain.gain.setValueAtTime(0.15, volumeLfoGain.currentTime);
      
      const baseGain = audioCtx.createGain();
      baseGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      
      volumeLfo.connect(volumeLfoGain);
      volumeLfoGain.connect(baseGain.gain);

      noise.connect(lowpass);
      lowpass.connect(baseGain);
      baseGain.connect(mainGain);

      noise.start();
      lfo.start();
      volumeLfo.start();

      activeNodes.source = noise;
      activeNodes.filter = lowpass;
      activeNodes.lfo = lfo;
      activeNodes.lfoGain = lfoGain;
      // Store additional nodes for cleaning up
      activeNodes.extraOsc = volumeLfo;
      activeNodes.extraGain = baseGain;

    } else if (type === 'binaural') {
      // Binaural Beats: Alpha waves (10Hz offset for focus)
      // Left channel: 140Hz, Right channel: 150Hz
      const oscLeft = audioCtx.createOscillator();
      oscLeft.frequency.setValueAtTime(140, audioCtx.currentTime);

      const oscRight = audioCtx.createOscillator();
      oscRight.frequency.setValueAtTime(150, audioCtx.currentTime);

      const merger = audioCtx.createChannelMerger(2);
      const pannerLeft = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
      const pannerRight = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

      if (pannerLeft && pannerRight) {
        pannerLeft.pan.setValueAtTime(-1, audioCtx.currentTime);
        pannerRight.pan.setValueAtTime(1, audioCtx.currentTime);
        
        oscLeft.connect(pannerLeft);
        oscRight.connect(pannerRight);
        
        pannerLeft.connect(mainGain);
        pannerRight.connect(mainGain);
      } else {
        // Fallback for older browsers
        oscLeft.connect(mainGain);
        oscRight.connect(mainGain);
      }

      oscLeft.start();
      oscRight.start();

      activeNodes.oscLeft = oscLeft;
      activeNodes.oscRight = oscRight;
      activeNodes.pannerLeft = pannerLeft;
      activeNodes.pannerRight = pannerRight;

    } else if (type === 'rain') {
      // Calming Rain: Highpassed and bandpassed noise with volume envelope spikes
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoiseBuffer();
      noise.loop = true;

      const bandpass = audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(800, audioCtx.currentTime);
      bandpass.Q.setValueAtTime(0.7, audioCtx.currentTime);

      const highpass = audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(1500, audioCtx.currentTime);

      // Rain density modulation using random minor impulses
      const rainGain = audioCtx.createGain();
      rainGain.gain.setValueAtTime(0.4, audioCtx.currentTime);

      noise.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(rainGain);
      rainGain.connect(mainGain);

      noise.start();

      activeNodes.source = noise;
      activeNodes.filter = highpass;
      activeNodes.extraGain = rainGain;
    }
  },

  setVolume(volume) {
    if (activeNodes.gain && audioCtx) {
      activeNodes.gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.1);
    }
  },

  stop() {
    // Safely stop and disconnect all nodes
    Object.keys(activeNodes).forEach(key => {
      const node = activeNodes[key];
      if (node) {
        try {
          if (node.stop) node.stop();
        } catch (e) {
          // Node already stopped or doesn't support stop
        }
        try {
          node.disconnect();
        } catch (e) {
          // Node not connected or already disconnected
        }
        activeNodes[key] = null;
      }
    });

    if (activeNodes.extraOsc) {
      try { activeNodes.extraOsc.stop(); } catch(e) {}
      try { activeNodes.extraOsc.disconnect(); } catch(e) {}
      activeNodes.extraOsc = null;
    }
    if (activeNodes.extraGain) {
      try { activeNodes.extraGain.disconnect(); } catch(e) {}
      activeNodes.extraGain = null;
    }
  }
};
