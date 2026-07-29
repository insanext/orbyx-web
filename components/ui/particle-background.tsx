"use client";

import { useEffect, useRef } from "react";

// Fondo de canvas con particulas conectadas, reaccionan al mouse en
// pantallas con puntero fino (desktop). En touch/mobile se desactiva
// la interaccion con el mouse y se reduce la cantidad de particulas.
const PARTICLE_RGB = "59, 130, 246"; // azul de marca

class Particle {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  size: number;

  constructor(x: number, y: number, directionX: number, directionY: number, size: number) {
    this.x = x;
    this.y = y;
    this.directionX = directionX;
    this.directionY = directionY;
    this.size = size;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = `rgb(${PARTICLE_RGB})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = `rgba(${PARTICLE_RGB}, 0.9)`;
    ctx.fill();
    ctx.restore();
  }

  update(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, mouse: { x: number | null; y: number | null; radius: number }) {
    if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
    if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

    if (mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < mouse.radius + this.size) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (mouse.radius - distance) / mouse.radius;
        this.x -= forceDirectionX * force * 4;
        this.y -= forceDirectionY * force * 4;
      }
    }

    this.x += this.directionX;
    this.y += this.directionY;
    this.draw(ctx);
  }
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let particles: Particle[] = [];
    const mouse: { x: number | null; y: number | null; radius: number } = {
      x: null,
      y: null,
      radius: 160,
    };
    const canInteract =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function init() {
      if (!canvas) return;
      particles = [];
      const isSmallScreen = canvas.width < 640;
      // shadowBlur del glow es mas costoso que un circulo simple, asi que en
      // pantallas chicas se reduce mas la cantidad de particulas que antes.
      const divisor = isSmallScreen ? 22000 : 9000;
      const maxParticles = isSmallScreen ? 20 : 90;
      const numberOfParticles = Math.min(
        Math.floor((canvas.height * canvas.width) / divisor),
        maxParticles
      );
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 1.6 + 1;
        const x = Math.random() * (canvas.width - size * 4) + size * 2;
        const y = Math.random() * (canvas.height - size * 4) + size * 2;
        const directionX = Math.random() * 0.4 - 0.2;
        const directionY = Math.random() * 0.4 - 0.2;
        particles.push(new Particle(x, y, directionX, directionY, size));
      }
    }

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    }

    function connect() {
      if (!ctx || !canvas) return;
      const maxDistanceSq = (canvas.width / 7) * (canvas.height / 7);
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < maxDistanceSq) {
            const opacity = (1 - distanceSq / maxDistanceSq) * 0.18;
            ctx.strokeStyle = `rgba(${PARTICLE_RGB}, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(ctx, canvas, mouse);
      }
      connect();
    }

    function handleMouseMove(event: MouseEvent) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    }

    function handleMouseOut() {
      mouse.x = null;
      mouse.y = null;
    }

    window.addEventListener("resize", resizeCanvas);
    if (canInteract) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseout", handleMouseOut);
    }

    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (canInteract) {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseout", handleMouseOut);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
