import { useEffect, useRef } from 'react';
import { mainButton } from '@telegram-apps/sdk-react';

interface MainButtonOptions {
  text: string;
  visible: boolean;
  enabled?: boolean;
  onClick: () => void;
}

/**
 * Keeps the native Telegram MainButton in sync with React state and falls
 * back to nothing outside of Telegram (the in-app ConfirmButton handles that
 * case on its own).
 */
export function useMainButton({ text, visible, enabled = true, onClick }: MainButtonOptions) {
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!mainButton.setParams.isAvailable()) return;

    mainButton.setParams({
      text,
      isVisible: visible,
      isEnabled: enabled,
      isLoaderVisible: false,
    });
  }, [text, visible, enabled]);

  useEffect(() => {
    if (!mainButton.onClick.isAvailable()) return;

    const handler = () => onClickRef.current();
    return mainButton.onClick(handler);
  }, []);
}
