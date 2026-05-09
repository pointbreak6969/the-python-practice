import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  onRun: () => void;
  onReset: () => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onToggleSidebar: () => void;
  onToggleDetail: () => void;
  onFocusEditor: () => void;
  onToggleHelp: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  // Keep a stable ref so the event listener never needs to re-register
  const ref = useRef(handlers);
  useEffect(() => { ref.current = handlers; });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';

      // Ctrl/Cmd+Enter fires even inside the editor (CM keymap handles it there,
      // but this catches focus on other elements)
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        ref.current.onRun();
        return;
      }

      // All other shortcuts are blocked when user is typing
      if (isTyping) return;

      if (mod && e.shiftKey && e.key === 'Delete') {
        e.preventDefault();
        ref.current.onReset();
        return;
      }
      if (mod && e.key === 'ArrowRight') {
        e.preventDefault();
        ref.current.onNextQuestion();
        return;
      }
      if (mod && e.key === 'ArrowLeft') {
        e.preventDefault();
        ref.current.onPrevQuestion();
        return;
      }
      if (mod && e.key === 'b') {
        e.preventDefault();
        ref.current.onToggleSidebar();
        return;
      }
      if (mod && e.key === 'd') {
        e.preventDefault();
        ref.current.onToggleDetail();
        return;
      }
      if (mod && e.key === 'l') {
        e.preventDefault();
        ref.current.onFocusEditor();
        return;
      }
      if (e.key === '?' && !mod) {
        ref.current.onToggleHelp();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
