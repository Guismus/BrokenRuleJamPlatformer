/**
 * SUPER RECOIL PLUMBER - Audio Engine
 * Built with HTML5 Canvas & Web Audio API (8-bit NES Synthesizer)
 */

// ============================================================================
// AUDIO SYNTHESIS ENGINE (8-bit NES APU Emulation)
// ============================================================================
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;

    // Music System (Chiptune Synthesizer)
    this.musicPlaying = false;
    this.musicEnabled = false;
    this.tempo = 130.0; // BPM
    this.lookahead = 25.0; // ms
    this.scheduleAheadTime = 0.1; // seconds
    this.nextNoteTime = 0.0;
    this.currentNoteIndex = 0;
    this.schedulerTimer = null;

    // 32-step arpeggiated retro melody (16th notes)
    this.melodyPattern = [
      60, 64, 67, 72, 71, 67, 64, 67, // C E G C5 B G E G
      62, 66, 69, 74, 72, 69, 66, 69, // D F# A D5 C5 A F# A
      60, 64, 67, 72, 71, 67, 64, 67, // C E G C5 B G E G
      55, 59, 62, 67, 71, 67, 62, 59  // G3 B3 D4 G4 B4 G4 D4 B3
    ];

    // 32-step retro walking bassline (8th notes / 16th notes layout)
    this.bassPattern = [
      48, 48, 55, 48, 48, 55, 48, 55, // C3 C3 G3 C3 C3 G3 C3 G3
      50, 50, 57, 50, 50, 57, 50, 57, // D3 D3 A3 D3 D3 A3 D3 A3
      48, 48, 55, 48, 48, 55, 48, 55, // C3 C3 G3 C3 C3 G3 C3 G3
      43, 43, 50, 43, 43, 50, 43, 50  // G2 G2 D3 G2 G2 D3 G2 D3
    ];
  }

  init() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn("Web Audio API was blocked or is unsupported in this browser environment:", e);
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    const toggleEl = document.getElementById('sound-toggle');
    if (this.muted) {
      if (toggleEl) {
        toggleEl.classList.add('muted');
        toggleEl.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        `;
      }
      this.pauseMusic();
    } else {
      if (toggleEl) {
        toggleEl.classList.remove('muted');
        toggleEl.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        `;
      }
      this.init();
      this.resumeMusic();
    }
    return this.muted;
  }

  midiToFreq(note) {
    if (!note || note === 0) return 0;
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  startMusic() {
    this.musicEnabled = true;
    if (this.muted || this.musicPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.musicPlaying = true;
    this.nextNoteTime = this.ctx.currentTime;
    this.currentNoteIndex = 0;

    this.schedulerTimer = setInterval(() => {
      this.scheduler();
    }, this.lookahead);
  }

  stopMusic() {
    this.musicEnabled = false;
    this.musicPlaying = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  pauseMusic() {
    this.musicPlaying = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  resumeMusic() {
    if (this.musicEnabled && !this.muted && !this.musicPlaying) {
      this.init();
      if (!this.ctx) return;
      this.musicPlaying = true;
      this.nextNoteTime = this.ctx.currentTime;
      this.schedulerTimer = setInterval(() => {
        this.scheduler();
      }, this.lookahead);
    }
  }

  scheduler() {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentNoteIndex, this.nextNoteTime);
      this.nextNote();
    }
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat; // Add a 16th note duration
    this.currentNoteIndex++;
  }

  scheduleNote(stepNumber, time) {
    if (!this.ctx) return;
    const melodyNote = this.melodyPattern[stepNumber % this.melodyPattern.length];
    const bassNote = this.bassPattern[stepNumber % this.bassPattern.length];
    const stepDuration = 60.0 / this.tempo / 4;

    // Melody synth (Square wave)
    if (melodyNote > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(this.midiToFreq(melodyNote), time);

      gain.gain.setValueAtTime(0.022, time); // Soft pleasant volume
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + stepDuration);
    }

    // Bass synth (Triangle wave)
    if (bassNote > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.midiToFreq(bassNote), time);

      gain.gain.setValueAtTime(0.045, time); // Soft bass volume
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 0.95);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + stepDuration);
    }
  }

  // Bubble spray / FLUDD recoil launch
  playShoot() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Bubble spray slide using triangle wave
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.06);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.16);
    
    gain.gain.setValueAtTime(0.24, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    
    // Short noise splash sound
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 550;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.07, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
    noise.start();
    noise.stop(ctx.currentTime + 0.1);
  }

  // Plumber death chromatics
  playExplode() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    // Classic NES "Too Bad" game over tone progression
    const notes = [493.88, 523.25, 587.33, 392.00, 349.23, 293.66, 196.00]; // B4, C5, D5, G4, F4, D4, G3
    const noteLen = 0.09;
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + idx * noteLen;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.005);
      gain.gain.setValueAtTime(0.08, startTime + noteLen - 0.015);
      gain.gain.linearRampToValueAtTime(0.001, startTime + noteLen);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + noteLen);
    });
  }

  // Classic NES Coin Sound (Ding!)
  playRefill() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    // Coin chime: B5 (987.77 Hz) for 0.06s, then E6 (1318.51 Hz) for 0.3s
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime);
    osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.06);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  // Trampoline bend jump sound
  playBounce() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.16);
    
    gain.gain.setValueAtTime(0.24, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  // Power-up pickup chime
  playKey() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const notes = [783.99, 1046.50, 1318.51, 1567.98]; // G5, C6, E6, G6
    const duration = 0.06;
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + idx * duration;
      gain.gain.setValueAtTime(0.07, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.14);
    });
  }

  // Brick break crunch noise
  playGateOpen() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
    noise.stop(ctx.currentTime + 0.18);
  }

  // Classic level win fanfare
  playWin() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const melody = [
      { f: 523.25, d: 0.08 }, // C5
      { f: 659.25, d: 0.08 }, // E5
      { f: 783.99, d: 0.08 }, // G5
      { f: 1046.50, d: 0.08 },// C6
      { f: 1318.51, d: 0.08 },// E6
      { f: 1567.98, d: 0.16 },// G6
      { f: 1318.51, d: 0.08 },// E6
      { f: 1567.98, d: 0.28 } // G6
    ];
    
    let timeAccum = 0;
    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = note.f;
      
      const startTime = ctx.currentTime + timeAccum;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.005);
      gain.gain.setValueAtTime(0.08, startTime + note.d - 0.01);
      gain.gain.linearRampToValueAtTime(0.001, startTime + note.d);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + note.d);
      
      timeAccum += note.d;
    });
  }
}

export const audio = new AudioEngine();
