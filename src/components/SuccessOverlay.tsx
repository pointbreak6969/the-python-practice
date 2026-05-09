'use client';

import { useEffect, useRef } from 'react';

interface Props {
  show: boolean;
  onDone: () => void;
}

export default function SuccessOverlay({ show, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (show && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <video
        ref={videoRef}
        src="/success.webm"
        muted
        playsInline
        onEnded={onDone}
        className="w-64 h-64 select-none"
      />
    </div>
  );
}
