import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

/**
 * Keeps the screen on while mounted. Release waits for activation to finish,
 * which avoids the web implementation throwing when a screen unmounts fast.
 */
export function useScreenAwake(): void {
  useEffect(() => {
    const tag = `who-dat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const activation = activateKeepAwakeAsync(tag).then(
      () => true,
      () => false,
    );
    return () => {
      activation
        .then((active) => (active ? deactivateKeepAwake(tag) : undefined))
        .catch(() => {
          // Nothing to release.
        });
    };
  }, []);
}
