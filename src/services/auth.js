import { client } from '@/api/axiosClient';

export function login({ email, password }) {
  return client.post(
    '/login',
    { email, password }
  );
}

export function logout() {
  return client.post('/logout');
}

export function enable2FA() {
  return client.post(
    'users/enable-2fa',
  );
}

export function verify2FA(userId, { totpToken }) {
  return client.post(
    'users/verify-2fa',
    { userId, totpToken }
  );
}

export function changePassword({ currentPassword, newPassword }) {
  return client.post(
    '/users/change-password',
    { currentPassword, newPassword }
  );
}

export function getUserData(userId) {
  return client.get(`/users/${userId}`).then(response => response.data);
}
