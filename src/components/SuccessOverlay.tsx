'use client';

import { useEffect, useRef } from 'react';

interface Props {
  show: boolean;
  onDone: () => void;
}

const ANIMATION_MS = 1500;

export default function SuccessOverlay({ show, onDone }: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Fixed-duration timer drives completion (and the auto-redirect to the next
  // question). The animation is pure inline SVG/CSS, so it renders the same on
  // desktop and mobile with no video/codec dependency. Depend only on `show`
  // (onDone is held in a ref) so re-renders don't reset the timer.
  useEffect(() => {
    if (!show) return;
    const id = setTimeout(() => onDoneRef.current(), ANIMATION_MS);
    return () => clearTimeout(id);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <svg
        className="result-icon result-icon--success"
        viewBox="0 0 100 100"
        role="img"
        aria-label="Correct"
      >
        <circle className="result-icon__circle" cx="50" cy="50" r="46" />
        <path className="result-icon__mark" d="M30 52 L44 66 L72 34" />
      </svg>
    </div>
  );
}
