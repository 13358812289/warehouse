import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface PlaylistData {
  tracks: { name: string; file: string }[];
}

const BGMPlayer: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [hasMusic, setHasMusic] = useState(false);
  const [currentTrack, setCurrentTrack] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tryPlay = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : 0.3;
    audioRef.current.play().then(() => {
      setHasMusic(true);
    }).catch(() => {
      // 浏览器阻止自动播放，等待用户交互
    });
  }, [isMuted]);

  // 从 music 目录加载 playlist.json 并自动播放
  useEffect(() => {
    let cancelled = false;

    fetch('/music/playlist.json')
      .then((res) => {
        if (!res.ok) throw new Error('no playlist');
        return res.json() as Promise<PlaylistData>;
      })
      .then((data) => {
        if (cancelled) return;
        const tracks = data.tracks;
        if (tracks.length > 0) {
          const first = tracks[0];
          audioRef.current = new Audio(first.file);
          audioRef.current.loop = true;
          setCurrentTrack(first.name);

          // 尝试自动播放
          const timer = setTimeout(tryPlay, 500);

          // 用户交互后备播放
          const handleInteraction = () => {
            if (audioRef.current && audioRef.current.paused) {
              tryPlay();
            }
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
          };

          document.addEventListener('click', handleInteraction);
          document.addEventListener('touchstart', handleInteraction);

          return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
          };
        }
        return undefined;
      })
      .catch(() => {
        // 无 playlist，静默处理
      });

    return () => {
      cancelled = true;
    };
  }, [tryPlay]);

  // 静音切换
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.volume = next ? 0 : 0.3;
  }, [isMuted]);

  // 组件卸载清理
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!hasMusic) return null;

  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-black/60 backdrop-blur-sm text-xs text-white/60 hover:text-white transition-colors"
      aria-label={isMuted ? '开启声音' : '静音'}
      title={currentTrack}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
      <span className="max-w-[80px] truncate">{currentTrack}</span>
    </button>
  );
};

export default BGMPlayer;
