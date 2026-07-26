import {
  init as initSDK,
  isTMA,
  miniApp,
  themeParams,
  viewport,
  mainButton,
  backButton,
} from '@telegram-apps/sdk-react';

let initialized = false;

/**
 * Boots the Telegram SDK when actually running inside a Telegram client.
 * Outside of Telegram (plain browser preview during development) this is a
 * no-op so the app still renders using the dark fallback theme in index.css.
 */
export async function initTelegram(): Promise<boolean> {
  if (initialized) return true;
  if (!isTMA()) return false;

  initSDK();
  initialized = true;

  if (miniApp.mountSync.isAvailable()) miniApp.mountSync();
  if (themeParams.mountSync.isAvailable()) themeParams.mountSync();
  if (mainButton.mount.isAvailable()) mainButton.mount();
  if (backButton.mount.isAvailable()) backButton.mount();

  if (viewport.mount.isAvailable() && !viewport.isMounted()) {
    try {
      await viewport.mount();
    } catch {
      // environment doesn't support it — keep going with CSS env() fallback
    }
  }

  if (viewport.bindCssVars.isAvailable()) viewport.bindCssVars();
  if (themeParams.bindCssVars.isAvailable()) themeParams.bindCssVars();
  if (miniApp.bindCssVars.isAvailable()) miniApp.bindCssVars();
  if (viewport.expand.isAvailable()) viewport.expand();

  if (miniApp.setBackgroundColor.isAvailable()) {
    miniApp.setBackgroundColor('#121016');
  }
  if (miniApp.setHeaderColor.isAvailable()) {
    try {
      miniApp.setHeaderColor('#121016');
    } catch {
      miniApp.setHeaderColor('bg_color');
    }
  }

  if (miniApp.ready.isAvailable()) miniApp.ready();

  return true;
}

export { isTMA };
