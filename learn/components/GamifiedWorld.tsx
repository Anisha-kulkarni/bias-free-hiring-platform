import React, { useEffect, useRef } from 'react';

export const GamifiedWorld: React.FC<{ xp: number }> = ({ xp }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; size: number; speed: number; color: string }[] = [];

    // Initialize particles (stars/fireflies)
    const initParticles = () => {
      particles = [];
      // Determine number of elements based on XP (Growth)
      const particleCount = Math.min(50 + Math.floor(xp / 10), 200);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.5 + 0.1,
          color: Math.random() > 0.5 ? '#8b5cf6' : '#3b82f6' // Purple or Blue
        });
      }
    };

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      initParticles();
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Transparent background so we can see through to the app background slightly
      // But draw a semi-transparent ground
      
      // Draw "Garden" Ground
      const gradient = ctx.createLinearGradient(0, canvas.height - 50, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.2)');
      gradient.addColorStop(1, 'rgba(30, 41, 59, 0.6)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

      // Draw Particles
      particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < 0) p.y = canvas.height;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw "Plant" (Simple fractal tree growing with XP)
      drawTree(ctx, canvas.width / 2, canvas.height - 50, -90, Math.min(xp / 5, 100), 10);

      animationFrameId = requestAnimationFrame(draw);
    };

    const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, len: number, width: number) => {
      ctx.beginPath();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle * Math.PI / 180);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len);
      ctx.strokeStyle = `hsl(${160 + len}, 70%, 50%)`; // Color shifts as it grows
      ctx.lineWidth = width;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${160 + len}, 70%, 50%)`;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (len < 10) {
        ctx.restore();
        return;
      }

      drawTree(ctx, 0, -len, angle - 15, len * 0.8, width * 0.7);
      drawTree(ctx, 0, -len, angle + 15, len * 0.8, width * 0.7);
      ctx.restore();
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [xp]);

  return (
    <div className="w-full h-48 md:h-full relative rounded-3xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="absolute bottom-4 left-4 text-white font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
            <i className="fas fa-seedling text-green-400 mr-2"></i>
            Level {(xp / 100).toFixed(0)}
        </div>
    </div>
  );
};