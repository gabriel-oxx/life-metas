import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hook de acessibilidade para modais:
 * 1. Salva o elemento que tinha foco antes de abrir e restaura ao fechar.
 * 2. Transfere o foco imediatamente para dentro do modal ao abrir (para leitura correta por leitores de tela).
 * 3. Fecha o modal ao pressionar a tecla Escape.
 * 4. Mantém o foco preso dentro do modal (Focus Trap) ao navegar com Tab / Shift+Tab.
 */
export function useModalA11y(isOpen: boolean, onClose: () => void) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Transfere o foco imediatamente para o modal assim que ele renderizar
    const timer = setTimeout(() => {
      if (!modalRef.current) return;

      const autoFocusEl = modalRef.current.querySelector<HTMLElement>(
        '[autofocus], [data-autofocus]'
      );
      if (autoFocusEl) {
        autoFocusEl.focus();
        return;
      }

      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        modalRef.current.focus();
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Se o foco por algum motivo estiver fora do modal, traz de volta imediatamente
        if (!modalRef.current.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === 'function' &&
        document.contains(previousFocusRef.current)
      ) {
        setTimeout(() => {
          previousFocusRef.current?.focus();
        }, 0);
      }
    };
  }, [isOpen, onClose]);

  return modalRef;
}
