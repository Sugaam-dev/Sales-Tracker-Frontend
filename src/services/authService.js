import { API } from '../api/config';

export async function login(identifier, password) {
  const response = await fetch(API.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Invalid credentials or login failed');
  }

  return data;
}
