import AsyncStorage from '@react-native-async-storage/async-storage';

// Parse JWT payload (no dependencies needed)
export function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

// Clear the stored token and email (for logout or expired token handling)
export async function clearAuthData() {
  await Promise.all([
    AsyncStorage.removeItem('userToken'),
    AsyncStorage.removeItem('userEmail'),
    AsyncStorage.removeItem('lastActiveTime')
  ]);
}

const INACTIVITY_TIMEOUT_MS = 1000 * 60 * 60 * 24; // 24 hours

// Use this to check on app load or in protected screens whether login is required
export async function isLoggedIn() {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) return false;

  if (isTokenExpired(token)) {
    await clearAuthData();
    return false;
  }

  const lastActiveStr = await AsyncStorage.getItem('lastActiveTime');
  const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;
  if (!lastActive || (Date.now() - lastActive > INACTIVITY_TIMEOUT_MS)) {
    await clearAuthData(); // Session expired due to inactivity
    return false;
  }

  // Update last active to now, so user stays logged in while active
  await AsyncStorage.setItem('lastActiveTime', Date.now().toString());

  return true;
}
