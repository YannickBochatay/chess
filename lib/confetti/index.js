const DEFAULT_CONFIG = {
  count: 75,
  size: 1,
  velocity: 200,
  fade: false
};

class Config {
  static init(config) {
    return {
      position: { x: window.innerWidth / 2, y: window.innerHeight / 3 },
      ...DEFAULT_CONFIG,
      ...config
    };
  }
};

function range(min, max) {
  return Math.random() * (max - min) + min;
}

class Vector2D {
    
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  copy() {
    return new Vector2D(this.x, this.y);
  }
  magnitude() {
    return Math.hypot(this.x, this.y);
  }
  normalize() {
    const mag = this.magnitude();
    if (mag === 0) {
      this.x = 0;
      this.y = 0;
      return this;
    }
    const inv = 1 / mag;
    this.x *= inv;
    this.y *= inv;
    return this;
  }
  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }
};

// src/core/Particle.ts
class Particle {
  
  constructor(config) {
    this.config = config;
    this.position = this.initPosition();
    this.size = this.initSize();
    this.velocity = this.initVelocity();
    this.rotation = range(0, 360);
    this.rotationSpeed = range(-250, 250);
    this.color = this.initColor();
    this.opacity = 100;
    this.fadeRate = 100 / range(0.5, 2.5);
  }
  initPosition() {
    const x = this.config.position.x;
    const y = this.config.position.y;
    return new Vector2D(x, y);
  }
  initSize() {
    const x = range(2, 10) * this.config.size;
    const y = range(2, 4) * this.config.size;
    return new Vector2D(x, y);
  }
  initVelocity() {
    const x = range(-0.5, 0.5);
    const y = range(-0.75, 0.25);
    const direction = new Vector2D(x, y).normalize();
    direction.x *= range(0, this.config.velocity * 4);
    direction.y *= range(0, this.config.velocity * 4);
    return direction;
  }
  initColor() {
    if (this.config.color && this.config.color.length > 0) {
      const index = Math.floor(range(0, this.config.color.length));
      return this.config.color[index];
    } else {
      return range(0, 360);
    }
  }
  update(delta, damping) {
    this.velocity.x += range(-350, 350) * delta;
    this.velocity.y += 75 * this.size.y * delta;
    this.velocity.scale(damping);
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.rotation += this.rotationSpeed * delta;
    if (this.config.fade) {
      this.opacity -= this.fadeRate * delta;
      if (this.opacity < 0) this.opacity = 0;
    }
  }
  draw(renderer) {
    renderer.drawRect(
      this.position,
      this.size,
      this.rotation,
      this.color,
      this.opacity
    );
  }
  cull(renderer) {
    const padding = Math.max(this.size.x, this.size.y) * 2;
    const offScreen = this.position.y > renderer.height + padding;
    return offScreen || this.opacity <= 0;
  }
};

// src/core/Renderer.ts
class Renderer {
  
  constructor() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to create 2d context");
    }
    this.canvas = canvas;
    this.context = context;
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.rafId = 0;
    this.boundResize = this.resize.bind(this);
    this.resize();
    window.addEventListener("resize", this.boundResize);
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.margin = "0";
    canvas.style.padding = "0";
    canvas.style.zIndex = "999999999";
    canvas.style.pointerEvents = "none";
    document.body.appendChild(canvas);
    this.context.imageSmoothingEnabled = true;
  }
  resize() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      const { innerWidth, innerHeight } = window;
      this.canvas.width = Math.round(innerWidth * this.dpr);
      this.canvas.height = Math.round(innerHeight * this.dpr);
      this.canvas.style.width = `${innerWidth}px`;
      this.canvas.style.height = `${innerHeight}px`;
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.context.imageSmoothingEnabled = true;
      this.rafId = 0;
    });
  }
  get width() {
    return this.canvas.width / this.dpr;
  }
  get height() {
    return this.canvas.height / this.dpr;
  }
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  drawRect(p, s, r, c, o) {
    const rad = r * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const width = s.x * this.dpr;
    const height = s.y * this.dpr;
    const tx = p.x * this.dpr;
    const ty = p.y * this.dpr;
    this.context.setTransform(cos, sin, -sin, cos, tx, ty);
    this.context.beginPath();
    this.context.rect(-width / 2, -height / 2, width, height);
    this.context.fillStyle = typeof c === "string" ? `oklch(from ${c} l c h / ${o}%)` : `oklch(0.85 0.25 ${c}deg / ${o}%)`;
    this.context.fill();
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  cleanup() {
    window.removeEventListener("resize", this.boundResize);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.canvas.remove();
  }
};


class Engine {
  
  static sharedEngine = null

  constructor() {
    this.renderer = new Renderer();
    this.particles = [];
    this.boundUpdate = this.update.bind(this);
    this.lastTime = 0;
    this.rafId = window.requestAnimationFrame(this.boundUpdate);
  }
  update(time) {
    const delta = this.lastTime ? Math.min((time - this.lastTime) / 1e3, 0.064) : 0;
    this.lastTime = time;
    if (this.particles.length === 0) {
      this.cleanup();
      return;
    }
    this.renderer.clear();
    let write = 0;
    const damping = Math.pow(0.98, delta * 60);
    for (let particle of this.particles) {
      particle.update(delta, damping);
      if (!particle.cull(this.renderer)) {
        particle.draw(this.renderer);
        this.particles[write++] = particle;
      }
    }
    this.particles.length = write;
    this.rafId = window.requestAnimationFrame(this.boundUpdate);
  }
  cleanup() {
    if (this.rafId) window.cancelAnimationFrame(this.rafId);
    this.renderer.cleanup();
    Engine.sharedEngine = null;
  }
  trigger(config) {
    for (let i = 0; i < config.count; i++) {
      this.particles.push(new Particle(config));
    }
  }
  static acquire() {
    if (!Engine.sharedEngine) {
      Engine.sharedEngine = new Engine();
    }
    return Engine.sharedEngine;
  }
}

export function confetti(c = {}) {
  const config = Config.init(c);
  const engine = Engine.acquire();
  engine.trigger(config);
}

export default confetti;