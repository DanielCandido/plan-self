'use client';

import { useEffect, useRef } from 'react';

export function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let t = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function drawWave(
      yBase: number,
      amplitude: number,
      frequency: number,
      speed: number,
      color: string,
      alpha: number,
      lineWidth = 1.5,
    ) {
      if (!canvas || !ctx) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth;

      for (let x = 0; x <= canvas.width; x += 3) {
        const y =
          yBase +
          amplitude * Math.sin((x / canvas.width) * frequency * Math.PI * 2 + t * speed) +
          (amplitude * 0.4) *
            Math.sin((x / canvas.width) * frequency * 1.7 * Math.PI * 2 + t * speed * 0.7 + 1);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const h = canvas.height;

      // Subtle wave layers
      drawWave(h * 0.25, 55, 1.4, 0.25, '#7c3aed', 0.07, 1.2);
      drawWave(h * 0.3, 45, 1.8, 0.18, '#6d28d9', 0.05, 1.0);
      drawWave(h * 0.4, 70, 1.2, 0.20, '#4c1d95', 0.06, 1.5);
      drawWave(h * 0.55, 60, 1.5, 0.22, '#7c3aed', 0.04, 1.0);
      drawWave(h * 0.65, 50, 1.9, 0.16, '#6d28d9', 0.055, 1.2);
      drawWave(h * 0.72, 40, 1.3, 0.28, '#5b21b6', 0.045, 0.9);
      drawWave(h * 0.85, 65, 1.6, 0.19, '#7c3aed', 0.035, 1.0);

      t += 0.008;
      animationId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#12131a] overflow-hidden">
      {/* Ambient glow bottom-right */}
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.06) 45%, transparent 70%)',
          transform: 'translate(20%, 20%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Subtle top-left glow */}
      <div
        className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 65%)',
          transform: 'translate(-30%, -30%)',
          filter: 'blur(40px)',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
