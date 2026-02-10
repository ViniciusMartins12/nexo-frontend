/**
 * Toca um som curto de notificação (beep) usando Web Audio API.
 * Não depende de arquivo de áudio externo.
 * Respeita a preferência em localStorage (nexo_notification_sound).
 */

export const NOTIFICATION_SOUND_KEY = "nexo_notification_sound";

export function isNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY);
  return stored !== "false";
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_SOUND_KEY, enabled ? "true" : "false");
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

export function playNotificationSound(): void {
  if (!isNotificationSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch {
    // Ignora falha em ambientes restritos
  }
}
