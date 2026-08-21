import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

export async function saveAdminSession(token: string) {
  const expiry = Date.now() + SESSION_DURATION;
  const data = JSON.stringify({ token, expiry });
  await SecureStore.setItemAsync(SESSION_KEY, data);
}

export async function getAdminSession() {
  const data = await SecureStore.getItemAsync(SESSION_KEY);
  if (!data) return null;

  const { token, expiry } = JSON.parse(data);
  if (Date.now() > expiry) {
    await SecureStore.deleteItemAsync(SESSION_KEY); // Expired
    return null;
  }
  return token;
}

export async function clearAdminSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
