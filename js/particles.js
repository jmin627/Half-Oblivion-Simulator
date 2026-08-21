// 절반 소멸 시뮬레이터 - Canvas 2D 고성능 우주 별빛 & 먼지 소멸 파티클 시스템

export class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.dustParticles = [];
    this.shockwaves = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isRunning = false;
    this.particlesEnabled = true;
    this.currentAuraColor = '#f59e0b'; // 기본 황금빛 우주 에너지

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);

    window.addEventListener('resize', this.resize);
    this.resize();
    this.initStars();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setAuraColor(color) {
    this.currentAuraColor = color || '#f59e0b';
  }

  setEnabled(val) {
    this.particlesEnabled = !!val;
  }

  initStars() {
    this.stars = [];
    const count = Math.min(150, Math.floor((this.width * this.height) / 8000));
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        speedY: Math.random() * 0.15 + 0.05
      });
    }
  }

  // 손가락 튕겼을 때 발생하는 먼지 소멸(Dust Dissolve) 파티클 폭발
  spawnSnapDust(centerX, centerY, count = 80, colorOverride = null) {
    if (!this.particlesEnabled) return;

    const baseColor = colorOverride || this.currentAuraColor;

    // 1. 충격파 링 생성
    this.shockwaves.push({
      x: centerX,
      y: centerY,
      radius: 10,
      maxRadius: Math.max(this.width, this.height) * 0.65,
      alpha: 0.8,
      color: baseColor
    });

    // 2. 우주 먼지 파티클 생성 (재와 먼지가 되어 공중으로 승화)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      const size = Math.random() * 3.5 + 1.2;
      const life = Math.random() * 45 + 35; // 프레임 수명

      this.dustParticles.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed - Math.random() * 3.5, // 위로 흩날리는 효과
        size: size,
        alpha: 1.0,
        maxLife: life,
        life: life,
        color: Math.random() > 0.3 ? baseColor : '#ffffff',
        spin: (Math.random() - 0.5) * 0.1
      });
    }
  }

  // 화면 전체 물질 분해 이펙트 (Cosmic / 특수 이벤트용)
  spawnCosmicBurst(count = 160) {
    if (!this.particlesEnabled) return;
    const cx = this.width / 2;
    const cy = this.height / 2;
    this.spawnSnapDust(cx, cy, count, '#ec4899');

    // 추가 주변 산란
    for (let i = 0; i < 4; i++) {
      const rx = Math.random() * this.width;
      const ry = Math.random() * this.height;
      this.spawnSnapDust(rx, ry, 30, '#a855f7');
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop() {
    this.isRunning = false;
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. 별빛 배경 렌더링
    if (this.particlesEnabled) {
      this.ctx.fillStyle = '#ffffff';
      for (let star of this.stars) {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 0.9 || star.alpha < 0.15) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }
        star.y -= star.speedY;
        if (star.y < 0) {
          star.y = this.height;
          star.x = Math.random() * this.width;
        }

        this.ctx.globalAlpha = star.alpha;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // 2. 충격파 링 렌더링
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.12 + 4;
      sw.alpha -= 0.025;

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.strokeStyle = sw.color;
      this.ctx.lineWidth = Math.max(1, (1 - sw.radius / sw.maxRadius) * 6);
      this.ctx.globalAlpha = sw.alpha * 0.7;
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. 우주 먼지 파티클 렌더링 & 물리 연산
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94; // 공기 저항 감속
      p.vy *= 0.94;
      p.vy -= 0.08; // 위로 서서히 흩날리는 부력
      p.life--;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0 || p.alpha <= 0) {
        this.dustParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.globalAlpha = 1.0;
    requestAnimationFrame(this.animate);
  }
}
