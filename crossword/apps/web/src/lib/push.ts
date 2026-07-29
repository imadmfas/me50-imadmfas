import { API_BASE } from './api';

const FIRST_MATCH_FLAG = 'anc-completed-first-match';

/** Call once when a match ends — gates when the notification-permission UI may appear (never on first load). */
export function markFirstMatchCompleted(): void {
  localStorage.setItem(FIRST_MATCH_FLAG, '1');
}

export function hasCompletedFirstMatch(): boolean {
  return localStorage.getItem(FIRST_MATCH_FLAG) === '1';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function getPushStatus(): Promise<{ configured: boolean; publicKey: string | null }> {
  const res = await fetch(`${API_BASE}/api/push/status`);
  return res.json();
}

export async function subscribeToPush(vapidPublicKey: string): Promise<'subscribed' | 'denied' | 'unsupported'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });

  const json = subscription.toJSON();
  await fetch(`${API_BASE}/api/push/subscribe`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  return 'subscribed';
}
