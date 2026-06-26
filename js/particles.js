/**
 * SUPER RECOIL PLUMBER - Particle System
 */

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
