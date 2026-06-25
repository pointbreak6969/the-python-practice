'use client';

import { useEffect, useRef } from 'react';

interface Props {
  show: boolean;
  onDone: () => void;
}

const ANIMATION_MS = 1500;

export default function ErrorOverlay({ show, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Drive completion off a fixed timer, not the video's `onEnded` event:
  // on mobile (notably iOS Safari, which can't play .webm) the video may never
  // load or fire `onEnded`, which would otherwise leave the overlay stuck.
  // The timer guarantees a consistent 1.5s animation.
  // Depend only on `show` (onDone is held in a ref) so re-renders don't reset it.
  useEffect(() => {
    if (!show) return;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    const id = setTimeout(() => onDoneRef.current(), ANIMATION_MS);
    return () => clearTimeout(id);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <video
        ref={videoRef}
        src="/Error.webm"
        muted
        playsInline
        className="w-64 h-64 select-none"
      />
    </div>
  );
}
