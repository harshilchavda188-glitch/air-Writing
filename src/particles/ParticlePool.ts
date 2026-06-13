export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  active: boolean;
}

export class ParticlePool {
  private pool: Particle[] = [];

  constructor(maxSize: number = 5000) {
    for (let i = 0; i < maxSize; i++) {
      this.pool.push(this.createInactive());
    }
  }

  private createInactive(): Particle {
    return { x: 0, y: 0, vx: 0, vy: 0, size: 0, alpha: 0, life: 0, maxLife: 0, color: '#fff', active: false };
  }

  acquire(): Particle | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].active = true;
        return this.pool[i];
      }
    }
    return null;
  }

  release(p: Particle): void {
    p.active = false;
  }

  getActive(): Particle[] {
    return this.pool.filter((p) => p.active);
  }

  get activeCount(): number {
    let count = 0;
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) count++;
    }
    return count;
  }

  update(dt: number): void {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.release(p);
      }
    }
  }

  reset(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
    }
  }
}

export function emitSpark(
  pool: ParticlePool,
  x: number, y: number,
  color: string,
  count: number = 5,
): void {
  for (let i = 0; i < count; i++) {
    const p = pool.acquire();
    if (!p) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    p.x = x + (Math.random() - 0.5) * 4;
    p.y = y + (Math.random() - 0.5) * 4;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.size = 1 + Math.random() * 2.5;
    p.alpha = 1;
    p.life = 0;
    p.maxLife = 0.3 + Math.random() * 0.5;
    p.color = color;
  }
}

export function emitFire(
  pool: ParticlePool,
  x: number, y: number,
  count: number = 8,
): void {
  for (let i = 0; i < count; i++) {
    const p = pool.acquire();
    if (!p) break;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = 20 + Math.random() * 80;
    p.x = x + (Math.random() - 0.5) * 6;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.size = 3 + Math.random() * 6;
    p.alpha = 1;
    p.life = 0;
    p.maxLife = 0.4 + Math.random() * 0.6;
    const r = ['#ff4400', '#ff6600', '#ffaa00', '#ffcc00', '#ff2200'];
    p.color = r[Math.floor(Math.random() * r.length)];
  }
}

export function emitSmoke(
  pool: ParticlePool,
  x: number, y: number,
  count: number = 6,
): void {
  for (let i = 0; i < count; i++) {
    const p = pool.acquire();
    if (!p) break;
    p.x = x + (Math.random() - 0.5) * 10;
    p.y = y + (Math.random() - 0.5) * 10;
    p.vx = (Math.random() - 0.5) * 20;
    p.vy = -10 - Math.random() * 30;
    p.size = 4 + Math.random() * 8;
    p.alpha = 0.4 + Math.random() * 0.3;
    p.life = 0;
    p.maxLife = 1.0 + Math.random() * 1.0;
    p.color = 'rgba(180,180,200,0.5)';
  }
}

export function emitGalaxy(
  pool: ParticlePool,
  x: number, y: number,
  color: string,
  count: number = 10,
): void {
  for (let i = 0; i < count; i++) {
    const p = pool.acquire();
    if (!p) break;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 12;
    p.x = x + Math.cos(angle) * dist;
    p.y = y + Math.sin(angle) * dist;
    p.vx = Math.cos(angle + Math.PI / 2) * dist * 3;
    p.vy = Math.sin(angle + Math.PI / 2) * dist * 3;
    p.size = 0.5 + Math.random() * 2;
    p.alpha = 1;
    p.life = 0;
    p.maxLife = 0.5 + Math.random() * 1.0;
    p.color = Math.random() > 0.5 ? color : '#ffffff';
  }
}

export function emitRainbow(
  pool: ParticlePool,
  x: number, y: number,
  count: number = 6,
): void {
  const hues = [0, 45, 120, 200, 270, 330];
  for (let i = 0; i < count; i++) {
    const p = pool.acquire();
    if (!p) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 100;
    p.x = x + (Math.random() - 0.5) * 4;
    p.y = y + (Math.random() - 0.5) * 4;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.size = 1.5 + Math.random() * 3;
    p.alpha = 1;
    p.life = 0;
    p.maxLife = 0.5 + Math.random() * 0.6;
    const h = hues[Math.floor(Math.random() * hues.length)];
    p.color = `hsl(${h}, 100%, 60%)`;
  }
}

export function emitInk(
  pool: ParticlePool,
  x: number, y: number,
  color: string,
  count: number = 3,
): void {
  for (let i = 0; i < count; i++) {
    const p = pool.acquire();
    if (!p) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 30;
    p.x = x + (Math.random() - 0.5) * 2;
    p.y = y + (Math.random() - 0.5) * 2;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.size = 0.5 + Math.random() * 1.5;
    p.alpha = 0.6 + Math.random() * 0.4;
    p.life = 0;
    p.maxLife = 0.5 + Math.random() * 0.8;
    p.color = color;
  }
}

export function renderParticles(ctx: CanvasRenderingContext2D, pool: ParticlePool): void {
  const active = pool.getActive();
  for (let i = 0; i < active.length; i++) {
    const p = active[i];
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = p.size * 3;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
