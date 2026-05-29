import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
}

interface Firework {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  exploded: boolean;
  particles: Particle[];
}

const COLORS = [
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9ff3',
  '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
  '#ee5a24', '#0abde3', '#10ac84', '#f368e0',
];

const Fireworks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioEnabledRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 加载烟花音效
    const loadAudio = async () => {
      try {
        const response = await fetch('/music/fireworks.wav');
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioCtxRef.current = audioCtx;
        audioBufferRef.current = audioBuffer;
      } catch {
        // 音频加载失败不影响烟花效果
      }
    };
    loadAudio();

    // 用户交互后启用音频
    const enableAudio = () => {
      audioEnabledRef.current = true;
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
    };
    window.addEventListener('click', enableAudio);
    window.addEventListener('touchstart', enableAudio);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const createFirework = (): Firework => {
      const x = Math.random() * canvas.width;
      const targetY = Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
      return {
        x,
        y: canvas.height,
        targetY,
        vy: -(Math.random() * 3 + 6),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        exploded: false,
        particles: [],
      };
    };

    const playExplosionSound = () => {
      if (!audioEnabledRef.current || !audioCtxRef.current || !audioBufferRef.current) return;
      try {
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;

        // 随机音高变化，让每次爆炸听起来不同
        const playbackRate = 0.8 + Math.random() * 0.5;
        source.playbackRate.value = playbackRate;

        // 增益控制
        const gainNode = audioCtxRef.current.createGain();
        gainNode.gain.value = 0.15 + Math.random() * 0.1;

        source.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);
        source.start();
      } catch {
        // 播放失败不影响视觉效果
      }
    };

    const explode = (firework: Firework) => {
      firework.exploded = true;
      playExplosionSound();
      const particleCount = Math.floor(Math.random() * 40 + 60);
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 4 + 2;
        firework.particles.push({
          x: firework.x,
          y: firework.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.008,
          color: firework.color,
          size: Math.random() * 2.5 + 1,
        });
      }
      // 添加一些散射粒子
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 3;
        firework.particles.push({
          x: firework.x,
          y: firework.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.01,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 2 + 0.5,
        });
      }
    };

    const draw = () => {
      // 拖尾效果
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 随机发射烟花
      if (Math.random() < 0.025) {
        fireworksRef.current.push(createFirework());
      }

      // 更新和绘制烟花
      fireworksRef.current = fireworksRef.current.filter((fw) => {
        if (!fw.exploded) {
          // 上升阶段
          fw.y += fw.vy;
          fw.vy += 0.12; // 重力

          // 绘制上升轨迹
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = fw.color;
          ctx.fill();

          // 到达目标高度或速度变正时爆炸
          if (fw.y <= fw.targetY || fw.vy >= 0) {
            explode(fw);
          }
          return true;
        }

        // 爆炸粒子
        let hasAlive = false;
        for (const p of fw.particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.06; // 粒子重力
          p.vx *= 0.985; // 空气阻力
          p.alpha -= p.decay;

          if (p.alpha > 0) {
            hasAlive = true;
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            // 发光效果
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.restore();
          }
        }

        return hasAlive;
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Fireworks;
