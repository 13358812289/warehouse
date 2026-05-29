import React from 'react';
import Cube3D from '@/components/Cube3D';
import Fireworks from '@/components/Fireworks';
import StarryBackground from '@/components/StarryBackground';
import BGMPlayer from '@/components/BGMPlayer';

const PHOTO_URL = 'https://miaoda-conversation-file.cdn.bcebos.com/user-by5d7i2ga874/app-by5dxdeuttdt/20260528/0cb9516d6334449fdae3a23724b7a7ae.jpg';

const CubePage: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-full min-h-screen overflow-hidden bg-black">
      {/* 星空背景 */}
      <StarryBackground />

      {/* 烟花特效 */}
      <Fireworks />

      {/* 中央聚光遮罩，突出立方体 */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* 立方体内容 */}
      <div className="relative z-20 flex flex-col items-center gap-8">
        <Cube3D imageUrl={PHOTO_URL} size={280} />
      </div>

      {/* 背景音乐播放器 */}
      <BGMPlayer />
    </div>
  );
};

export default CubePage;
