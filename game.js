/**
 * SUPER RECOIL PLUMBER
 * A game for Broken Rules Jam
 * Built with HTML5 Canvas & Web Audio API (8-bit NES Synthesizer)
 */

// ============================================================================
// AUDIO SYNTHESIS ENGINE (8-bit NES APU Emulation)
// ============================================================================
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    const toggleEl = document.getElementById('sound-toggle');
    if (this.muted) {
      toggleEl.classList.add('muted');
      toggleEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      `;
    } else {
      toggleEl.classList.remove('muted');
      toggleEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
      this.init();
    }
    return this.muted;
  }

  // Bubble spray / FLUDD recoil launch
  playShoot() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    
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

const audio = new AudioEngine();

// ============================================================================
// LEVEL DATABASE
// ============================================================================
const LEVELS = [
  // LEVEL 1: Introduction (Jump across gap)
  {
    hint: "Aim with Mouse. Left-click to spray water recoil. Recoil launches you in opposite direction.",
    map: [
      "##############################",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#....P..................V....#",
      "##########........############",
      "##########........############",
      "##########........############",
      "##########........############",
      "##########........############",
      "##############################"
    ]
  },
  // LEVEL 2: The Rocket Climb
  {
    hint: "Manage your 3 Water cells. Spray downwards multiple times to launch upwards.",
    map: [
      "##############################",
      "#...................V........#",
      "#######.......................",
      "#######.......................",
      "#.....................########",
      "#.....................########",
      "#########....................#",
      "#########....................#",
      "#.....................########",
      "#.....................########",
      "##########...................#",
      "##########...................#",
      "#............................#",
      "#............................#",
      "#....P.......................#",
      "##############################",
      "##############################",
      "##############################",
      "##############################",
      "##############################"
    ]
  },
  // LEVEL 3: Spike Valley
  {
    hint: "Avoid spikes. Collect floating gold Coins to recharge water capacity mid-air.",
    map: [
      "##############################",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#....P..................V....#",
      "#######................#######",
      "#######................#######",
      "#............................#",
      "#............................#",
      "#........####....####........#",
      "#........####....####........#",
      "#............................#",
      "#............O..O............#",
      "#............................#",
      "#######................#######",
      "#######..XXXXXXXXXXXX..#######",
      "#######..XXXXXXXXXXXX..#######",
      "##############################",
      "##############################"
    ]
  },
  // LEVEL 4: Trampoline Bounce
  {
    hint: "Red spring Trampolines launch you high up for free (no water consumed).",
    map: [
      "##############################",
      "#............................#",
      "#............................#",
      "#....V.......................#",
      "######.......................#",
      "######.......................#",
      "#............................#",
      "#............XXXX............#",
      "#............XXXX............#",
      "#............####............#",
      "#............####............#",
      "#............................#",
      "#............................#",
      "#....P.......................#",
      "#######......................#",
      "#######......................#",
      "#............................#",
      "#............................#",
      "#.........B..................#",
      "##############################"
    ]
  },
  // LEVEL 5: Lock & Key
  {
    hint: "Collect the gold Key to break open the Keyhole Block doors.",
    map: [
      "##############################",
      "#............................#",
      "#............................#",
      "#.......................K....#",
      "#.....................#######",
      "#....P................#######",
      "#######......................#",
      "#######......................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#............................#",
      "#.......D#####################",
      "#.......D#...................#",
      "#.......D#.........V.........#",
      "##########...................#",
      "##########...................#",
      "##############################",
      "##############################",
      "##############################"
    ]
  },
  // LEVEL 6: World 1-6 (Bowser's Castle Gates)
  {
    hint: "Final Challenge: Combine all mechanics. Recoil speed is key to victory.",
    map: [
      "##############################",
      "#P...........................#",
      "######.......................#",
      "######.......................#",
      "#.............XXXX...........#",
      "#.............XXXX...........#",
      "#.......O.....####.......K...#",
      "#.............####.....#######",
      "#.............####.....#######",
      "#............................#",
      "#.......B....................#",
      "#########....................#",
      "#########....................#",
      "#............................#",
      "#.............D###############",
      "#.............D#.............#",
      "#.............D#......V......#",
      "##############################",
      "##############################",
      "##############################"
    ]
  }
];

// Helper to draw a 5-pointed star
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, angle = 0) {
  let rot = (Math.PI / 2) * 3 + angle;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.closePath();
  ctx.fillStyle = '#f8b800'; // Gold Star
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================
class Particle {
  constructor(x, y, vx, vy, color, size, life, decay, hasGravity = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.decay = decay;
    this.hasGravity = hasGravity;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.hasGravity) {
      this.vy += 0.25; // gravity pulling droplets down
    }
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  clear() {
    this.particles = [];
  }

  add(particle) {
    this.particles.push(particle);
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }

  // Water spray plume trail
  emitTrail(x, y, angle, speed) {
    const spread = 0.4;
    const pAngle = angle + Math.PI + (Math.random() - 0.5) * spread;
    const pSpeed = (1 + Math.random() * 3) * (speed * 0.1 + 1.2);
    const vx = Math.cos(pAngle) * pSpeed;
    const vy = Math.sin(pAngle) * pSpeed;
    const size = 1.5 + Math.random() * 3.5;
    const decay = 0.02 + Math.random() * 0.03;
    
    // Water blue/white palette
    const color = Math.random() > 0.4 ? '#00d8f8' : '#ffffff';
    this.add(new Particle(x, y, vx, vy, color, size, 0.9, decay, true));
  }

  // Water blast spray burst
  emitBlastSparks(x, y, angle) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const spread = 0.7;
      const pAngle = angle + (Math.random() - 0.5) * spread;
      const pSpeed = 3 + Math.random() * 7;
      const vx = Math.cos(pAngle) * pSpeed;
      const vy = Math.sin(pAngle) * pSpeed;
      const size = 2 + Math.random() * 4;
      const decay = 0.04 + Math.random() * 0.03;
      const color = Math.random() > 0.3 ? '#ffffff' : '#00d8f8';
      this.add(new Particle(x, y, vx, vy, color, size, 1.0, decay, true));
    }
  }

  // Death explosion burst (star sparks)
  emitDeathExplosion(x, y) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const pAngle = Math.random() * Math.PI * 2;
      const pSpeed = 1.5 + Math.random() * 4.5;
      const vx = Math.cos(pAngle) * pSpeed;
      const vy = Math.sin(pAngle) * pSpeed;
      const size = 2.5 + Math.random() * 2;
      const decay = 0.02 + Math.random() * 0.02;
      // Red, yellow, orange star particles
      const color = Math.random() > 0.5 ? '#e60012' : (Math.random() > 0.3 ? '#f8b800' : '#ffffff');
      this.add(new Particle(x, y, vx, vy, color, size, 1.0, decay, true));
    }
  }

  // Gold spark rings
  emitRechargeSparks(x, y) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const pAngle = (i / count) * Math.PI * 2;
      const pSpeed = 1.8;
      const vx = Math.cos(pAngle) * pSpeed;
      const vy = Math.sin(pAngle) * pSpeed;
      const size = 2;
      const decay = 0.06;
      this.add(new Particle(x, y, vx, vy, '#f8b800', size, 1.0, decay, false));
    }
  }

  // Star aura dust
  emitPortalVortex(x, y) {
    if (Math.random() > 0.3) return;
    const r = 24;
    const pAngle = Math.random() * Math.PI * 2;
    const px = x + Math.cos(pAngle) * r;
    const py = y + Math.sin(pAngle) * r;
    
    const vx = -Math.cos(pAngle) * 0.6 + Math.cos(pAngle + Math.PI/2) * 0.4;
    const vy = -Math.sin(pAngle) * 0.6 + Math.sin(pAngle + Math.PI/2) * 0.4;
    const size = 1.5 + Math.random() * 2;
    const decay = 0.035;
    this.add(new Particle(px, py, vx, vy, '#f8b800', size, 0.9, decay, false));
  }
}

// ============================================================================
// GAME CLASS
// ============================================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.tileSize = 30;
    
    // Subsystems
    this.particles = new ParticleSystem();
    
    // Game state
    this.state = 'START_MENU';
    this.currentLevelIndex = 0;
    
    // Background cloud database
    this.clouds = [
      { x: 120, y: 140, size: 55 },
      { x: 480, y: 80, size: 75 },
      { x: 820, y: 160, size: 45 }
    ];
    
    // Gameplay counters
    this.deathCount = 0;
    this.timeElapsed = 0;
    this.startTimeStamp = 0;
    this.levelStartTimeStamp = 0;
    this.gameCompleted = false;
    
    // Inputs
    this.keys = {};
    this.mouse = { x: 0, y: 0 };
    
    // Juice
    this.screenShake = 0;
    
    // Grid maps & static details (doors, keys, batteries)
    this.grid = [];
    this.originalGrid = [];
    this.batteries = [];
    this.keyPosition = null;
    this.hasKey = false;
    
    // Plumber Definition
    this.player = {
      x: 0,
      y: 0,
      width: 20,
      height: 24, // slightly taller for plumber cap
      vx: 0,
      vy: 0,
      onGround: false,
      slidingWall: 0,
      energy: 3,
      maxEnergy: 3,
      radius: 10,
      aimAngle: 0,
      alive: true
    };
    
    this.GRAVITY = 0.35;
    this.AIR_DRAG = 0.992; // Slightly more glide than cyber
    this.WALL_DRAG = 0.85;
    this.RECOIL_FORCE = 11.2;
    
    this.initEventListeners();
    this.setupMenus();
  }

  initEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if ((e.key === 'r' || e.key === 'R') && this.state === 'PLAYING' && this.player.alive) {
        this.triggerDeath(true);
      }
      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && (this.state === 'PLAYING' || this.state === 'PAUSED')) {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (this.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (this.height / rect.height);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state === 'PLAYING' && e.button === 0) {
        this.shootRecoil();
      }
    });

    document.getElementById('sound-toggle').addEventListener('click', () => {
      audio.toggleMute();
    });
  }

  setupMenus() {
    document.getElementById('btn-start-game').onclick = () => {
      audio.init();
      this.startLevel(0);
    };

    document.getElementById('btn-select-levels').onclick = () => {
      audio.init();
      this.showLevelSelect();
    };

    document.getElementById('btn-back-to-menu').onclick = () => {
      this.showStartMenu();
    };

    document.getElementById('btn-resume').onclick = () => {
      this.togglePause();
    };

    document.getElementById('btn-restart-level').onclick = () => {
      this.togglePause();
      this.loadLevel(this.currentLevelIndex);
    };

    document.getElementById('btn-quit-to-menu').onclick = () => {
      this.showStartMenu();
    };

    document.getElementById('btn-victory-next').onclick = () => {
      if (this.currentLevelIndex + 1 < LEVELS.length) {
        this.currentLevelIndex++;
        this.loadLevel(this.currentLevelIndex);
      } else {
        // Replay game
        this.startLevel(0);
      }
    };

    document.getElementById('btn-victory-menu').onclick = () => {
      this.showStartMenu();
    };
  }

  showStartMenu() {
    this.state = 'START_MENU';
    this.hideAllOverlays();
    document.getElementById('start-menu').classList.remove('hidden');
  }

  showLevelSelect() {
    this.state = 'LEVEL_SELECT';
    this.hideAllOverlays();
    
    const container = document.getElementById('level-grid-container');
    container.innerHTML = '';
    
    LEVELS.forEach((level, idx) => {
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.textContent = `1-${idx + 1}`;
      btn.onclick = () => {
        this.startLevel(idx);
      };
      container.appendChild(btn);
    });
    
    document.getElementById('level-select-menu').classList.remove('hidden');
  }

  hideAllOverlays() {
    const overlays = ['start-menu', 'level-select-menu', 'pause-menu', 'game-over-menu', 'victory-menu'];
    overlays.forEach(id => document.getElementById(id).classList.add('hidden'));
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pause-menu').classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pause-menu').classList.add('hidden');
    }
  }

  startLevel(index) {
    this.currentLevelIndex = index;
    this.deathCount = 0;
    this.timeElapsed = 0;
    this.startTimeStamp = performance.now();
    this.gameCompleted = false;
    this.loadLevel(index);
  }

  loadLevel(index) {
    this.hideAllOverlays();
    this.particles.clear();
    this.state = 'PLAYING';
    
    const levelData = LEVELS[index];
    this.levelStartTimeStamp = performance.now();
    this.levelDeathCount = 0;
    
    this.grid = [];
    this.originalGrid = [];
    this.batteries = [];
    this.keyPosition = null;
    this.hasKey = false;
    
    document.getElementById('level-num').textContent = `1-${index + 1}`;
    document.getElementById('level-hint').textContent = levelData.hint;
    document.getElementById('death-count').textContent = this.deathCount;
    
    const rows = levelData.map.length;
    for (let r = 0; r < rows; r++) {
      const rowStr = levelData.map[r];
      this.grid[r] = [];
      this.originalGrid[r] = [];
      
      for (let c = 0; c < rowStr.length; c++) {
        const char = rowStr[c];
        
        if (char === 'P') {
          this.player.x = c * this.tileSize + (this.tileSize - this.player.width) / 2;
          this.player.y = r * this.tileSize + (this.tileSize - this.player.height) / 2;
          this.player.vx = 0;
          this.player.vy = 0;
          this.player.onGround = false;
          this.player.energy = this.player.maxEnergy;
          this.player.alive = true;
          
          this.grid[r][c] = '.';
        } else if (char === 'O') {
          this.batteries.push({
            gridX: c,
            gridY: r,
            x: c * this.tileSize + this.tileSize / 2,
            y: r * this.tileSize + this.tileSize / 2,
            active: true,
            respawnTimer: 0
          });
          this.grid[r][c] = '.';
        } else if (char === 'K') {
          this.keyPosition = {
            gridX: c,
            gridY: r,
            x: c * this.tileSize + this.tileSize / 2,
            y: r * this.tileSize + this.tileSize / 2,
            active: true
          };
          this.grid[r][c] = '.';
        } else {
          this.grid[r][c] = char;
        }
        
        this.originalGrid[r][c] = this.grid[r][c];
      }
    }
    
    this.updateEnergyUI();
  }

  // nextLevel is replaced by showLevelClearMenu

  shootRecoil() {
    if (!this.player.alive || this.player.energy <= 0) return;
    
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    
    const dx = this.mouse.x - playerCenterX;
    const dy = this.mouse.y - playerCenterY;
    const angle = Math.atan2(dy, dx);
    
    const recoilX = -Math.cos(angle) * this.RECOIL_FORCE;
    const recoilY = -Math.sin(angle) * this.RECOIL_FORCE;
    
    if (this.player.onGround) {
      this.player.onGround = false;
      this.player.y -= 2;
      this.player.vx = recoilX;
      this.player.vy = recoilY;
    } else {
      this.player.vx += recoilX;
      this.player.vy += recoilY;
    }
    
    const speed = Math.hypot(this.player.vx, this.player.vy);
    const MAX_SPEED = 16.5;
    if (speed > MAX_SPEED) {
      this.player.vx = (this.player.vx / speed) * MAX_SPEED;
      this.player.vy = (this.player.vy / speed) * MAX_SPEED;
    }
    
    this.player.energy--;
    this.updateEnergyUI();
    
    audio.playShoot();
    this.screenShake = 5.5;
    
    // Muzzle coordinates: spray blue water splash
    const muzzleX = playerCenterX + Math.cos(angle) * 16;
    const muzzleY = playerCenterY + Math.sin(angle) * 16;
    this.particles.emitBlastSparks(muzzleX, muzzleY, angle);
  }

  updateEnergyUI() {
    const cells = document.querySelectorAll('.energy-cell');
    cells.forEach((cell, idx) => {
      if (idx < this.player.energy) {
        cell.className = 'energy-cell active';
      } else {
        cell.className = 'energy-cell spent';
      }
    });
  }

  triggerDeath(manual = false) {
    if (!this.player.alive) return;
    this.player.alive = false;
    
    if (!manual) {
      this.deathCount++;
      this.levelDeathCount++;
      document.getElementById('death-count').textContent = this.deathCount;
      audio.playExplode();
      this.screenShake = 12;
      
      const playerCenterX = this.player.x + this.player.width / 2;
      const playerCenterY = this.player.y + this.player.height / 2;
      this.particles.emitDeathExplosion(playerCenterX, playerCenterY);
    }
    
    const overlay = document.getElementById('game-over-menu');
    if (!manual) {
      overlay.classList.remove('hidden');
    }
    
    setTimeout(() => {
      overlay.classList.add('hidden');
      this.loadLevel(this.currentLevelIndex);
    }, manual ? 0 : 800);
  }

  showLevelClearMenu() {
    this.state = 'LEVEL_COMPLETE';
    this.hideAllOverlays();
    
    const levelMs = this.levelClearTime || 0;
    const minutes = Math.floor(levelMs / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((levelMs % 60000) / 1000).toString().padStart(2, '0');
    const tenths = Math.floor((levelMs % 1000) / 100);
    const timeString = `${minutes}:${seconds}.${tenths}`;
    
    const titleEl = document.querySelector('#victory-menu h1.glitch-title');
    const subtitleEl = document.querySelector('#victory-menu .subtitle');
    const nextBtn = document.getElementById('btn-victory-next');
    
    const isFinalLevel = (this.currentLevelIndex + 1 === LEVELS.length);
    
    if (isFinalLevel) {
      titleEl.textContent = "ALL STAGES CLEAR!";
      subtitleEl.textContent = "YOU SAVED THE DAY!";
      subtitleEl.style.color = 'var(--luigi-green)';
      nextBtn.textContent = "Replay Game";
    } else {
      titleEl.textContent = `STAGE 1-${this.currentLevelIndex + 1} CLEAR!`;
      subtitleEl.textContent = "COURSE CLEAR!";
      subtitleEl.style.color = 'var(--coin-gold)';
      nextBtn.textContent = "Next Stage";
    }
    
    document.getElementById('final-time').textContent = timeString;
    document.getElementById('final-deaths').textContent = this.levelDeathCount;
    
    let rank = 'S';
    if (levelMs > 25000 || this.levelDeathCount > 2) rank = 'A';
    if (levelMs > 45000 || this.levelDeathCount > 5) rank = 'B';
    if (levelMs > 75000 || this.levelDeathCount > 10) rank = 'C';
    document.getElementById('final-rank').textContent = rank;
    
    document.getElementById('victory-menu').classList.remove('hidden');
  }

  updatePhysics() {
    if (!this.player.alive) return;
    
    if (!this.player.onGround) {
      if (this.player.slidingWall !== 0 && this.player.vy > 0) {
        this.player.vy += this.GRAVITY * 0.45;
        this.player.vy *= this.WALL_DRAG;
      } else {
        this.player.vy += this.GRAVITY;
      }
      this.player.vx *= this.AIR_DRAG;
    }
    
    let newX = this.player.x + this.player.vx;
    let newY = this.player.y + this.player.vy;
    
    this.player.onGround = false;
    this.player.slidingWall = 0;
    
    this.player.x = newX;
    this.checkCollisionsAxis('x');
    
    this.player.y = newY;
    this.checkCollisionsAxis('y');
    
    if (this.player.x < 0) {
      this.player.x = 0;
      this.player.vx = 0;
    } else if (this.player.x + this.player.width > this.width) {
      this.player.x = this.width - this.player.width;
      this.player.vx = 0;
    }
    
    if (this.player.y < 0) {
      this.player.y = 0;
      this.player.vy = 0;
    } else if (this.player.y + this.player.height > this.height) {
      this.triggerDeath();
    }
    
    // Absolute Ground Friction - THE BROKEN RULE
    if (this.player.onGround) {
      this.player.vx = 0;
      this.player.vy = 0;
    }
  }

  checkCollisionsAxis(axis) {
    const x1 = Math.floor(this.player.x / this.tileSize);
    const x2 = Math.floor((this.player.x + this.player.width) / this.tileSize);
    const y1 = Math.floor(this.player.y / this.tileSize);
    const y2 = Math.floor((this.player.y + this.player.height) / this.tileSize);
    
    for (let r = y1; r <= y2; r++) {
      for (let c = x1; c <= x2; c++) {
        if (r < 0 || r >= this.grid.length || c < 0 || c >= this.grid[0].length) continue;
        
        const cell = this.grid[r][c];
        if (cell === '.' || cell === ' ') continue;
        
        const tx = c * this.tileSize;
        const ty = r * this.tileSize;
        
        if (this.player.x < tx + this.tileSize &&
            this.player.x + this.player.width > tx &&
            this.player.y < ty + this.tileSize &&
            this.player.y + this.player.height > ty) {
          
          if (cell === '#' || (cell === 'D' && !this.hasKey)) {
            if (axis === 'x') {
              if (this.player.vx > 0) {
                this.player.x = tx - this.player.width;
                this.player.slidingWall = 1;
              } else if (this.player.vx < 0) {
                this.player.x = tx + this.tileSize;
                this.player.slidingWall = -1;
              }
              this.player.vx = 0;
            } else {
              if (this.player.vy > 0) {
                this.player.y = ty - this.player.height;
                this.player.onGround = true;
                
                if (this.player.energy < this.player.maxEnergy) {
                  this.player.energy = this.player.maxEnergy;
                  this.updateEnergyUI();
                  audio.playRefill();
                  this.particles.emitRechargeSparks(this.player.x + this.player.width / 2, this.player.y + this.player.height);
                }
              } else if (this.player.vy < 0) {
                this.player.y = ty + this.tileSize;
              }
              this.player.vy = 0;
            }
          }
          
          else if (cell === 'X') {
            this.triggerDeath();
            return;
          }
          
          else if (cell === 'B') {
            this.player.vy = -13.2;
            this.player.onGround = false;
            audio.playBounce();
            this.screenShake = 6;
            
            if (this.player.energy < this.player.maxEnergy) {
              this.player.energy = this.player.maxEnergy;
              this.updateEnergyUI();
            }
            
            // Spawn splash bounce particles
            for (let i = 0; i < 8; i++) {
              const vx = (Math.random() - 0.5) * 3.5;
              const vy = -3 - Math.random() * 3.5;
              this.particles.add(new Particle(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height,
                vx, vy, '#00d8f8', 2.5, 1.0, 0.05
              ));
            }
          }
          
          else if (cell === 'V') {
            if (this.state === 'LEVEL_COMPLETE') return;
            this.state = 'LEVEL_COMPLETE';
            this.levelClearTime = performance.now() - this.levelStartTimeStamp;
            audio.playWin();
            
            const portalCenterX = tx + this.tileSize / 2;
            const portalCenterY = ty + this.tileSize / 2;
            for (let i = 0; i < 30; i++) {
              const angle = (i / 30) * Math.PI * 2;
              const vx = Math.cos(angle) * 2.5;
              const vy = Math.sin(angle) * 2.5;
              this.particles.add(new Particle(portalCenterX, portalCenterY, vx, vy, '#f8b800', 3, 1.0, 0.03));
            }
            
            setTimeout(() => {
              this.showLevelClearMenu();
            }, 600);
          }
        }
      }
    }
  }

  updateEntities() {
    if (!this.player.alive) return;
    
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    
    // 1. Check Gold Coin pick-ups
    for (const bat of this.batteries) {
      if (!bat.active) {
        bat.respawnTimer -= 16.6;
        if (bat.respawnTimer <= 0) {
          bat.active = true;
        }
        continue;
      }
      
      const dist = Math.hypot(playerCenterX - bat.x, playerCenterY - bat.y);
      if (dist < 20) {
        bat.active = false;
        bat.respawnTimer = 4000;
        
        if (this.player.energy < this.player.maxEnergy) {
          this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 1);
          this.updateEnergyUI();
        }
        audio.playRefill();
        this.particles.emitRechargeSparks(bat.x, bat.y);
      }
    }
    
    // 2. Check Key Item
    if (this.keyPosition && this.keyPosition.active) {
      const dist = Math.hypot(playerCenterX - this.keyPosition.x, playerCenterY - this.keyPosition.y);
      if (dist < 20) {
        this.keyPosition.active = false;
        this.hasKey = true;
        audio.playKey();
        
        this.particles.emitRechargeSparks(this.keyPosition.x, this.keyPosition.y);
        this.unlockSecurityDoors();
      }
    }
  }

  unlockSecurityDoors() {
    audio.playGateOpen();
    this.screenShake = 4.5;
    
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (this.grid[r][c] === 'D') {
          const gx = c * this.tileSize + this.tileSize / 2;
          const gy = r * this.tileSize + this.tileSize / 2;
          
          for (let i = 0; i < 4; i++) {
            const vx = (Math.random() - 0.5) * 3;
            const vy = (Math.random() - 0.5) * 3;
            this.particles.add(new Particle(gx, gy, vx, vy, '#f8b800', 2, 1.0, 0.05));
          }
          
          this.grid[r][c] = '.';
        }
      }
    }
  }

  run() {
    const loop = (timestamp) => {
      this.update(timestamp);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(timestamp) {
    if (this.state === 'PLAYING' && this.player.alive) {
      const currentMs = performance.now();
      const elapsed = currentMs - this.startTimeStamp;
      
      const minutes = Math.floor(elapsed / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
      const tenths = Math.floor((elapsed % 1000) / 100);
      document.getElementById('time-elapsed').textContent = `${minutes}:${seconds}.${tenths}`;
    }
    
    // Slow drifting background clouds
    for (const cloud of this.clouds) {
      cloud.x += 0.15;
      if (cloud.x > this.width + 100) {
        cloud.x = -100;
      }
    }
    
    if (this.state !== 'PLAYING' && this.state !== 'LEVEL_COMPLETE') {
      return;
    }
    
    if (this.state === 'PLAYING') {
      this.updatePhysics();
      this.updateEntities();
    }
    
    this.particles.update();
    
    // Gold Star vortex dust emitter
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (this.grid[r][c] === 'V') {
          const px = c * this.tileSize + this.tileSize / 2;
          const py = r * this.tileSize + this.tileSize / 2;
          this.particles.emitPortalVortex(px, py);
        }
      }
    }
    
    // Emit falling water droplets when flying fast
    if (this.player.alive && !this.player.onGround) {
      const speed = Math.hypot(this.player.vx, this.player.vy);
      if (speed > 1.2) {
        const angle = Math.atan2(this.player.vy, this.player.vx);
        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;
        this.particles.emitTrail(px, py, angle, speed);
      }
    }
    
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }
  }

  draw() {
    this.ctx.save();
    
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(dx, dy);
    }
    
    // 1. Draw sky, hills, clouds background
    this.drawBackground();
    
    // 2. Draw active tilemap
    this.drawTilemap();
    
    // 3. Draw active pickups (Coins, Keys)
    this.drawPickups();
    
    // 4. Draw particle effects
    this.particles.draw(this.ctx);
    
    // 5. Draw Plumber Character
    this.drawPlayer();
    
    this.ctx.restore();
  }

  drawBackground() {
    // Solid Sky blue
    this.ctx.fillStyle = '#5c94fc';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Green Hills
    this.ctx.fillStyle = '#00a800';
    this.ctx.strokeStyle = '#007000';
    this.ctx.lineWidth = 3;
    
    // Hill 1
    this.ctx.beginPath();
    this.ctx.arc(150, 610, 160, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Hill 2
    this.ctx.beginPath();
    this.ctx.arc(680, 610, 210, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Retro Clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (const cloud of this.clouds) {
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + cloud.size * 0.3, cloud.y - cloud.size * 0.1, cloud.size * 0.6, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + cloud.size * 0.7, cloud.y, cloud.size * 0.45, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawTilemap() {
    const rows = this.grid.length;
    if (rows === 0) return;
    const cols = this.grid[0].length;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = this.grid[r][c];
        const tx = c * this.tileSize;
        const ty = r * this.tileSize;
        
        if (cell === '#') {
          // Brick Block
          this.ctx.fillStyle = '#c84c0c'; // NES brick color
          this.ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
          
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(tx, ty, this.tileSize, this.tileSize);
          
          // Brick lines
          this.ctx.beginPath();
          this.ctx.moveTo(tx, ty + this.tileSize / 2);
          this.ctx.lineTo(tx + this.tileSize, ty + this.tileSize / 2);
          this.ctx.moveTo(tx + this.tileSize / 2, ty);
          this.ctx.lineTo(tx + this.tileSize / 2, ty + this.tileSize / 2);
          this.ctx.moveTo(tx + this.tileSize / 4, ty + this.tileSize / 2);
          this.ctx.lineTo(tx + this.tileSize / 4, ty + this.tileSize);
          this.ctx.moveTo(tx + (this.tileSize * 3) / 4, ty + this.tileSize / 2);
          this.ctx.lineTo(tx + (this.tileSize * 3) / 4, ty + this.tileSize);
          this.ctx.stroke();
          
          // Grass top block top face detail
          if (r > 0 && this.grid[r - 1][c] !== '#' && this.grid[r - 1][c] !== 'D') {
            this.ctx.fillStyle = '#00a800';
            this.ctx.fillRect(tx, ty, this.tileSize, 5);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(tx, ty + 5, this.tileSize, 1.5);
          }
        } 
        
        else if (cell === 'X') {
          // Sharp Spikes
          this.ctx.fillStyle = '#b0b0b0';
          this.ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
          
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(tx, ty, this.tileSize, this.tileSize);
          
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          // Draw three spike teeth
          const w = this.tileSize / 3;
          for (let i = 0; i < 3; i++) {
            const sx = tx + i * w;
            this.ctx.moveTo(sx, ty + this.tileSize);
            this.ctx.lineTo(sx + w / 2, ty);
            this.ctx.lineTo(sx + w, ty + this.tileSize);
          }
          this.ctx.fill();
          
          this.ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const sx = tx + i * w;
            this.ctx.moveTo(sx, ty + this.tileSize);
            this.ctx.lineTo(sx + w / 2, ty);
            this.ctx.lineTo(sx + w, ty + this.tileSize);
          }
          this.ctx.stroke();
        } 
        
        else if (cell === 'B') {
          // Springboard trampoline base
          this.ctx.fillStyle = '#f8d878';
          this.ctx.fillRect(tx, ty + 8, this.tileSize, this.tileSize - 8);
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(tx, ty + 8, this.tileSize, this.tileSize - 8);
          
          // Spring coils graphics
          this.ctx.beginPath();
          this.ctx.moveTo(tx + 7, ty + this.tileSize - 2);
          this.ctx.lineTo(tx + 15, ty + this.tileSize - 10);
          this.ctx.lineTo(tx + 23, ty + this.tileSize - 2);
          
          this.ctx.moveTo(tx + 7, ty + this.tileSize - 10);
          this.ctx.lineTo(tx + 15, ty + this.tileSize - 18);
          this.ctx.lineTo(tx + 23, ty + this.tileSize - 10);
          this.ctx.stroke();
          
          // Spring top springboard board (Red)
          this.ctx.fillStyle = '#e60012';
          this.ctx.fillRect(tx, ty, this.tileSize, 8);
          this.ctx.strokeRect(tx, ty, this.tileSize, 8);
        } 
        
        else if (cell === 'D') {
          // Keyhole locked block
          this.ctx.fillStyle = '#a85800'; // Dark wood
          this.ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(tx, ty, this.tileSize, this.tileSize);
          
          // Draw Keyhole
          this.ctx.fillStyle = '#000000';
          this.ctx.beginPath();
          this.ctx.arc(tx + this.tileSize / 2, ty + 11, 3.5, 0, Math.PI * 2);
          this.ctx.fill();
          
          this.ctx.beginPath();
          this.ctx.moveTo(tx + this.tileSize / 2 - 2, ty + 11);
          this.ctx.lineTo(tx + this.tileSize / 2 + 2, ty + 11);
          this.ctx.lineTo(tx + this.tileSize / 2 + 3.5, ty + 21);
          this.ctx.lineTo(tx + this.tileSize / 2 - 3.5, ty + 21);
          this.ctx.closePath();
          this.ctx.fill();
        } 
        
        else if (cell === 'V') {
          // Grand Star Exit (spinning)
          const px = tx + this.tileSize / 2;
          const py = ty + this.tileSize / 2;
          
          this.ctx.save();
          const spinAngle = performance.now() * 0.0045;
          
          // Outer gold star glow
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = '#f8b800';
          
          drawStar(this.ctx, px, py, 5, 12, 6, spinAngle);
          
          this.ctx.shadowBlur = 0;
          
          // Draw Star eyes
          this.ctx.translate(px, py);
          this.ctx.rotate(spinAngle);
          this.ctx.fillStyle = '#000000';
          this.ctx.fillRect(-2, -3.5, 1.5, 4.5);
          this.ctx.fillRect(1, -3.5, 1.5, 4.5);
          
          this.ctx.restore();
        }
      }
    }
  }

  drawPickups() {
    // 1. Spinning Gold Coins
    for (const bat of this.batteries) {
      if (!bat.active) continue;
      
      const spinScale = Math.abs(Math.sin(performance.now() * 0.0075));
      const cx = bat.x;
      const cy = bat.y + Math.sin(performance.now() * 0.005) * 3;
      
      this.ctx.save();
      this.ctx.translate(cx, cy);
      this.ctx.scale(spinScale, 1.0);
      
      this.ctx.fillStyle = '#f8b800';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 7, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.strokeStyle = '#f87800';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      this.ctx.stroke();
      
      // coin slot slash
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(-1, -3.5, 2, 7);
      
      this.ctx.restore();
    }
    
    // 2. Gold Key
    if (this.keyPosition && this.keyPosition.active) {
      const pulse = Math.sin(performance.now() * 0.006) * 3.5;
      const kx = this.keyPosition.x;
      const ky = this.keyPosition.y + pulse;
      
      this.ctx.save();
      this.ctx.fillStyle = '#f8b800';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      this.ctx.arc(kx - 4, ky, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#5c94fc';
      this.ctx.beginPath();
      this.ctx.arc(kx - 4, ky, 2.2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#f8b800';
      this.ctx.beginPath();
      this.ctx.rect(kx + 2, ky - 2, 9, 4);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.rect(kx + 7, ky + 2, 2, 4);
      this.ctx.rect(kx + 10, ky + 2, 2, 4);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  drawPlayer() {
    if (!this.player.alive) return;
    
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;
    
    const dx = this.mouse.x - px;
    const dy = this.mouse.y - py;
    const angle = Math.atan2(dy, dx);
    this.player.aimAngle = angle;
    
    // 1. Draw Water Sight Guide Line
    if (this.player.energy > 0) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([3, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(px, py);
      this.ctx.lineTo(px + Math.cos(angle) * 1000, py + Math.sin(angle) * 1000);
      this.ctx.stroke();
      this.ctx.restore();
    }
    
    // 2. Draw FLUDD Backpack opposite of aim direction
    this.ctx.save();
    this.ctx.translate(px, py);
    
    this.ctx.fillStyle = '#9b9b9b';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(-12, -7, 5, 14);
    this.ctx.strokeRect(-12, -7, 5, 14);
    
    // Draw Nozzle Barrel rotation
    this.ctx.rotate(angle);
    this.ctx.fillStyle = '#b5b5b5';
    this.ctx.fillRect(4, -3, 8, 6);
    this.ctx.strokeRect(4, -3, 8, 6);
    this.ctx.fillStyle = '#f8b800'; // Golden tip
    this.ctx.fillRect(12, -4, 2.5, 8);
    this.ctx.strokeRect(12, -4, 2.5, 8);
    this.ctx.restore();
    
    // 3. Draw Plumber overalls & hat
    this.ctx.save();
    this.ctx.translate(px, py);
    
    // Blue overall legs
    this.ctx.fillStyle = '#0020a8';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(-7, -2, 14, 11);
    this.ctx.strokeRect(-7, -2, 14, 11);
    
    // Overalls yellow chest button straps
    this.ctx.fillStyle = '#f8b800';
    this.ctx.fillRect(-4, -1, 1.5, 1.5);
    this.ctx.fillRect(2.5, -1, 1.5, 1.5);
    
    // Red Plumber Shirt
    this.ctx.fillStyle = '#e60012';
    this.ctx.fillRect(-9, -6, 18, 4);
    this.ctx.strokeRect(-9, -6, 18, 4);
    
    // Skin Head
    this.ctx.fillStyle = '#ffcca3';
    this.ctx.beginPath();
    this.ctx.arc(0, -11, 6.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Semicircle Red Cap
    this.ctx.fillStyle = '#e60012';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(0, -13, 6.5, Math.PI, 0);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Visor Brim
    const facingRight = Math.cos(angle) >= 0;
    this.ctx.fillStyle = '#e60012';
    if (facingRight) {
      this.ctx.fillRect(2, -15, 6, 2.5);
      this.ctx.strokeRect(2, -15, 6, 2.5);
    } else {
      this.ctx.fillRect(-8, -15, 6, 2.5);
      this.ctx.strokeRect(-8, -15, 6, 2.5);
    }
    
    // Eyes & Mustache
    this.ctx.fillStyle = '#000000';
    const eyeX = facingRight ? 2.5 : -4.5;
    this.ctx.fillRect(eyeX, -12.5, 1.5, 2);
    
    const mustacheX = facingRight ? 1.5 : -5.5;
    this.ctx.fillRect(mustacheX, -10, 4, 1.8);
    
    // Empty tank warning dot on top of cap
    if (this.player.energy === 0) {
      if (Math.floor(performance.now() / 200) % 2 === 0) {
        this.ctx.fillStyle = '#e60012';
        this.ctx.beginPath();
        this.ctx.arc(0, -21, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    this.ctx.restore();
  }
}

// ============================================================================
// BOOTSTRAP INITIALIZATION
// ============================================================================
window.onload = () => {
  const game = new Game();
  game.showStartMenu();
  game.run();
};
