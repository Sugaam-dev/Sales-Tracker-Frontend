import { API } from '../api/config';

async function postJSON(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed. Please try again.');
  }

  return data;
}

export async function login(identifier, password) {
  return postJSON(API.LOGIN, { identifier, password });
}

export async function refreshToken(refresh_token) {
  return postJSON(API.REFRESH, { refresh_token });
}

// --- Onboarding (first-time login) ---------------------------------------

export async function setPassword(tempToken, newPassword) {
  return postJSON(API.ONBOARDING_SET_PASSWORD, {
    temp_token: tempToken,
    new_password: newPassword,
  });
}

export async function sendEmailOTP(tempToken) {
  return postJSON(API.ONBOARDING_VERIFY_EMAIL, { temp_token: tempToken });
}

export async function verifyEmailOTP(tempToken, otp) {
  return postJSON(API.ONBOARDING_VERIFY_EMAIL, { temp_token: tempToken, otp });
}

export async function sendMobileOTP(tempToken) {
  return postJSON(API.ONBOARDING_VERIFY_MOBILE, { temp_token: tempToken });
}

export async function verifyMobileOTP(tempToken, otp) {
  return postJSON(API.ONBOARDING_VERIFY_MOBILE, { temp_token: tempToken, otp });
}

// --- Forgot / reset password ----------------------------------------------

export async function forgotPassword(email) {
  return postJSON(API.FORGOT_PASSWORD, { email });
}

export async function resetPassword(token, newPassword) {
  return postJSON(API.RESET_PASSWORD, { token, new_password: newPassword });
}

// --- MFA ---------------------------------------------------------------------

export async function verifyMFA(mfaPendingToken, otp) {
  return postJSON(API.MFA_VERIFY, { mfa_pending_token: mfaPendingToken, otp });
}

// --- Shared helpers ------------------------------------------------------------

// Derives the display-friendly user object the rest of the app expects
// (name, initials, role label) from the trimmed-down user summary the
// backend returns.
export function deriveUser(user) {
  const emailParts = user.email.split('@')[0].split(/[._-]/);
  const derivedName = emailParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const derivedInitials = emailParts
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const roleMap = {
    admin: 'Admin',
    manager: 'Sales Manager',
    agent: 'Sales Executive',
  };
  const displayRole = roleMap[user.role] || user.role;

  return {
    id: user.id,
    name: derivedName,
    role: displayRole,
    initials: derivedInitials || 'U',
    email: user.email,
  };
}

// Persists tokens (and the derived user, so a page refresh doesn't log the
// user out) from a successful session response (login, MFA verify, or the
// end of onboarding) into localStorage.
export function storeSession(response) {
  if (response.access_token) {
    localStorage.setItem('token', response.access_token);
  }
  if (response.refresh_token) {
    localStorage.setItem('refresh_token', response.refresh_token);
  }
  if (response.user) {
    localStorage.setItem('user', JSON.stringify(deriveUser(response.user)));
  }
}
