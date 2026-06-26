/**
 * SUPER RECOIL PLUMBER - Main Game Logic
 */

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
    this.lastScale = 1;
    this.resizeGame();

    // Delayed resize adjustments to capture correct iframe size in itch.io
    setTimeout(() => this.resizeGame(), 100);
    setTimeout(() => this.resizeGame(), 300);
    setTimeout(() => this.resizeGame(), 1000);

    // Periodic scaling check to adapt to iframe size changes without window resize events
    setInterval(() => this.resizeGame(), 500);
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

    window.addEventListener('resize', () => {
      this.resizeGame();
    });
  }

  resizeGame() {
    const wrapper = document.getElementById('game-wrapper');
    if (!wrapper) return;
    
    const targetWidth = 912; // 900 + 12px border
    const targetHeight = 612; // 600 + 12px border
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (windowWidth <= 0 || windowHeight <= 0) {
      if (this.lastScale !== 1) {
        wrapper.style.transform = 'translate(-50%, -50%) scale(1)';
        this.lastScale = 1;
      }
      return;
    }
    
    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;
    let scale = Math.min(scaleX, scaleY);
    
    // Guard against invalid or 0 scale (which makes game tiny/invisible)
    // Set a safe minimum scale of 0.25 on initial load
    if (isNaN(scale) || scale <= 0.25) {
      scale = 1;
    }
    
    if (scale !== this.lastScale) {
      wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
      this.lastScale = scale;
    }
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
    audio.stopMusic();
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
      audio.pauseMusic();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pause-menu').classList.add('hidden');
      audio.resumeMusic();
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
    
    // Start background music
    audio.startMusic();
    
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
    audio.stopMusic();
    
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
            audio.stopMusic();
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
