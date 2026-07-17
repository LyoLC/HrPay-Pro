import { useState, useEffect, useRef } from 'react';

interface UseGlobalShortcutsProps {
  onSearch: () => void;
  onPrint: () => void;
  onMobileMenuToggle: () => void;
  onDarkModeToggle: () => void;
}

export function useGlobalShortcuts({
  onSearch,
  onPrint,
  onMobileMenuToggle,
  onDarkModeToggle
}: UseGlobalShortcutsProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const callbacksRef = useRef({ onSearch, onPrint, onMobileMenuToggle, onDarkModeToggle });

  useEffect(() => {
    callbacksRef.current = { onSearch, onPrint, onMobileMenuToggle, onDarkModeToggle };
  }, [onSearch, onPrint, onMobileMenuToggle, onDarkModeToggle]);

  useEffect(() => {
    let shiftTimeoutId: NodeJS.Timeout;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        callbacksRef.current.onSearch();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        callbacksRef.current.onPrint();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        callbacksRef.current.onMobileMenuToggle();
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        callbacksRef.current.onDarkModeToggle();
      }
      if (e.key === 'Shift' && !e.repeat) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
        shiftTimeoutId = setTimeout(() => {
          setShowShortcuts(true);
        }, 400);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        clearTimeout(shiftTimeoutId);
        setShowShortcuts(false);
      }
    };

    const handleBlur = () => {
      clearTimeout(shiftTimeoutId);
      setShowShortcuts(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      clearTimeout(shiftTimeoutId);
    };
  }, []);

  return showShortcuts;
}
