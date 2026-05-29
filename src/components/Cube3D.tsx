import React, { useRef, useEffect, useCallback, useState } from 'react';

interface Cube3DProps {
  imageUrl: string;
  size?: number;
}

const Cube3D: React.FC<Cube3DProps> = ({ imageUrl, size = 300 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: -15, y: 25 });
  const autoRotate = useRef({ x: 0.3, y: 0.5 });
  const targetRotation = useRef({ x: -15, y: 25 });
  const [isLoaded, setIsLoaded] = useState(false);

  const halfSize = size / 2;

  // 自动旋转动画
  const animate = useCallback(() => {
    if (!cubeRef.current) return;

    if (!isDragging.current) {
      // 自动旋转状态
      targetRotation.current.x += autoRotate.current.x;
      targetRotation.current.y += autoRotate.current.y;
    }

    // 平滑插值到目标角度
    rotation.current.x += (targetRotation.current.x - rotation.current.x) * 0.08;
    rotation.current.y += (targetRotation.current.y - rotation.current.y) * 0.08;

    const rx = rotation.current.x;
    const ry = rotation.current.y;

    cubeRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;

    // 阴影跟随旋转动态变化
    if (shadowRef.current) {
      const shadowScale = 0.8 + 0.2 * Math.abs(Math.cos((rx * Math.PI) / 180));
      const shadowOpacity = 0.35 + 0.15 * Math.abs(Math.sin((ry * Math.PI) / 180));
      shadowRef.current.style.transform = `rotateX(90deg) translateZ(${-halfSize - 20}px) scale(${shadowScale})`;
      shadowRef.current.style.opacity = String(shadowOpacity);
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [halfSize]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [animate]);

  // 鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  }, []);

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - lastMouse.current.x;
    const deltaY = e.clientY - lastMouse.current.y;

    targetRotation.current.y += deltaX * 0.5;
    targetRotation.current.x -= deltaY * 0.5;

    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  // 鼠标释放
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  }, []);

  // 触摸事件
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDragging.current = true;
    lastMouse.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastMouse.current.x;
    const deltaY = touch.clientY - lastMouse.current.y;

    targetRotation.current.y += deltaX * 0.5;
    targetRotation.current.x -= deltaY * 0.5;

    lastMouse.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const faces = [
    { name: 'front', transform: `translateZ(${halfSize}px)` },
    { name: 'back', transform: `rotateY(180deg) translateZ(${halfSize}px)` },
    { name: 'left', transform: `rotateY(-90deg) translateZ(${halfSize}px)` },
    { name: 'right', transform: `rotateY(90deg) translateZ(${halfSize}px)` },
    { name: 'top', transform: `rotateX(90deg) translateZ(${halfSize}px)` },
    { name: 'bottom', transform: `rotateX(-90deg) translateZ(${halfSize}px)` },
  ];

  return (
    <div
      ref={containerRef}
      className="cube-scene relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
        cursor: 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 预加载图片 */}
      <img
        src={imageUrl}
        alt="preload"
        className="sr-only"
        onLoad={() => setIsLoaded(true)}
      />

      <div
        ref={cubeRef}
        className="cube relative"
        style={{
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
        }}
      >
        {faces.map((face) => (
          <div
            key={face.name}
            className="cube-face absolute overflow-hidden"
            style={{
              width: size,
              height: size,
              transform: face.transform,
              backgroundColor: '#333333',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6), 0 0 25px rgba(139,92,246,0.25)',
            }}
          >
            <img
              src={imageUrl}
              alt={face.name}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              draggable={false}
            />
          </div>
        ))}

        {/* 底部动态阴影 */}
        <div
          ref={shadowRef}
          className="absolute"
          style={{
            width: size,
            height: size,
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 70%)',
            transform: `rotateX(90deg) translateZ(${-halfSize - 20}px)`,
            transformStyle: 'preserve-3d',
            pointerEvents: 'none',
            opacity: 0.5,
            filter: 'blur(12px)',
          }}
        />
      </div>
    </div>
  );
};

export default Cube3D;
