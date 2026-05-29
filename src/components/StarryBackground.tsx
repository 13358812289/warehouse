import React, { useRef, useEffect } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  speed: number;
}

const StarryBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      const count = Math.floor((canvas.width * canvas.height) / 3500);
      starsRef.current = [];
      for (let i = 0; i < count; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.8 + 0.3,
          alpha: Math.random(),
          targetAlpha: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.008 + 0.002,
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制星星
      for (const star of starsRef.current) {
        // 闪烁效果
        star.alpha += (star.targetAlpha - star.alpha) * star.speed * 3;
        if (Math.abs(star.alpha - star.targetAlpha) < 0.02) {
          star.targetAlpha = Math.random() * 0.9 + 0.1;
        }

        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // 大星星加十字光芒
        if (star.size > 1.2) {
          ctx.globalAlpha = star.alpha * 0.4;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 3, star.y);
          ctx.lineTo(star.x + star.size * 3, star.y);
          ctx.moveTo(star.x, star.y - star.size * 3);
          ctx.lineTo(star.x, star.y + star.size * 3);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 偶尔出现流星
      if (Math.random() < 0.003) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height * 0.3;
        drawShootingStar(ctx, startX, startY);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    const shootingStars: { x: number; y: number; vx: number; vy: number; alpha: number; length: number }[] = [];

    const drawShootingStar = (
      ctx2d: CanvasRenderingContext2D,
      sx: number,
      sy: number
    ) => {
      shootingStars.push({
        x: sx,
        y: sy,
        vx: -(Math.random() * 4 + 3),
        vy: Math.random() * 2 + 1,
        alpha: 1,
        length: Math.random() * 40 + 30,
      });
    };

    // 流星绘制融入主循环
    const originalDraw = draw;
    const combinedDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制星星
      for (const star of starsRef.current) {
        star.alpha += (star.targetAlpha - star.alpha) * star.speed * 3;
        if (Math.abs(star.alpha - star.targetAlpha) < 0.02) {
          star.targetAlpha = Math.random() * 0.9 + 0.1;
        }

        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        if (star.size > 1.2) {
          ctx.globalAlpha = star.alpha * 0.4;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 3, star.y);
          ctx.lineTo(star.x + star.size * 3, star.y);
          ctx.moveTo(star.x, star.y - star.size * 3);
          ctx.lineTo(star.x, star.y + star.size * 3);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 更新绘制流星
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.015;

        if (s.alpha <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = s.alpha;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 6, s.y - s.vy * 6);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 6, s.y - s.vy * 6);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      // 随机发射流星
      if (Math.random() < 0.004) {
        drawShootingStar(ctx, Math.random() * canvas.width + canvas.width * 0.2, Math.random() * canvas.height * 0.3);
      }

      animFrameRef.current = requestAnimationFrame(combinedDraw);
    };

    combinedDraw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at bottom, #0a0a1a 0%, #000000 70%)',
      }}
    />
  );
};

export default StarryBackground;
