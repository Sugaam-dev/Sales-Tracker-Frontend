import { API, authHeaders } from '../api/config';

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
  if (!user) return null;
  const emailParts = (user.email || '').split('@')[0].split(/[._-]/);
  const derivedName = user.name || emailParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const derivedInitials = user.name
    ? user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : emailParts
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const rawRole = (user.role || '').toLowerCase();
  const roleMap = {
    admin: 'Admin',
    sales_manager: 'Sales Manager',
    sales_executive: 'Sales Executive',
    leader: 'Leader',
  };
  const displayRole = roleMap[rawRole] || user.role;

  return {
    id: user.id,
    name: derivedName,
    rawRole: rawRole,
    role: displayRole,
    initials: derivedInitials || 'U',
    email: user.email,
    mobile: user.mobile || user.phone || null,
    is_active: user.is_active !== undefined ? user.is_active : true,
    permissions: user.permissions || [],
    manager_id: user.manager_id || null,
    manager_name: user.manager_name || null,
  };
}

export function hasPermission(user, permission) {
  if (!user) return false;
  const role = (user.rawRole || user.role || '').toLowerCase();
  if (role === 'admin') return true;
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  return false;
}

export function canAccessAdmin(user) {
  if (!user) return false;
  const role = (user.rawRole || user.role || '').toLowerCase();
  if (role === 'admin') return true;
  if (role === 'leader') {
    const adminPerms = [
      'user.view',
      'user.create',
      'user.update',
      'user.delete',
      'manager.manage',
      'system.settings.manage',
    ];
    return adminPerms.some((p) => hasPermission(user, p));
  }
  return false;
}

export function clearLocalSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function authenticatedFetch(url, options = {}) {
  let headers = {
    ...authHeaders(),
    ...(options.headers || {}),
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const refreshTokenVal = localStorage.getItem('refresh_token');
    if (!refreshTokenVal) {
      clearLocalSession();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(API.REFRESH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshTokenVal }),
        });

        if (!refreshRes.ok) {
          throw new Error('Refresh token invalid');
        }

        const data = await refreshRes.json();
        if (data.access_token && data.refresh_token) {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          isRefreshing = false;
          onRefreshed(data.access_token);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        clearLocalSession();
        window.location.href = '/login';
        throw err;
      }
    }

    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        headers['Authorization'] = `Bearer ${newToken}`;
        resolve(
          fetch(url, {
            ...options,
            headers,
          })
        );
      });
    });
  }

  return response;
}

export async function logout(accessToken, refreshToken) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    await fetch(API.LOGOUT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch (err) {
    console.error('Logout request failed:', err);
  } finally {
    clearLocalSession();
  }
}

export async function createUser(userData) {
  const response = await authenticatedFetch(API.USERS, {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create user.');
  }

  return data;
}

// --- Onboarding (first-time login) ---------------------------------------

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

export async function fetchUsers() {
  const response = await authenticatedFetch(API.USERS);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users.');
  }
  return data.data || data;
}

export async function updateUser(id, userData) {
  const response = await authenticatedFetch(`${API.USERS}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user.');
  }
  return data.data || data;
}

export async function deleteUser(id) {
  const response = await authenticatedFetch(`${API.USERS}/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete user.');
  }
  return data;
}

export async function assignManager(executiveId, managerId) {
  const response = await authenticatedFetch(`${API.USERS}/${executiveId}/manager`, {
    method: 'PATCH',
    body: JSON.stringify({ manager_id: managerId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to assign manager.');
  }
  return data;
}

export async function fetchLeaderDelegations(leaderId) {
  const response = await authenticatedFetch(`${API.USERS}/${leaderId}/delegations`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch delegations.');
  }
  return data.data || data;
}

export async function grantLeaderDelegation(leaderId, permission) {
  const response = await authenticatedFetch(`${API.USERS}/${leaderId}/delegations`, {
    method: 'POST',
    body: JSON.stringify({ permission }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to grant delegation.');
  }
  return data;
}

export async function revokeLeaderDelegation(leaderId, permission) {
  const response = await authenticatedFetch(`${API.USERS}/${leaderId}/delegations/${permission}`, {
    method: 'DELETE',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to revoke delegation.');
  }
  return data;
}

export async function fetchMyPermissions() {
  const response = await authenticatedFetch(API.MY_PERMISSIONS);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch permissions.');
  }
  return data.data || data;
}

export async function changePassword(newPassword) {
  const response = await authenticatedFetch(API.CHANGE_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ new_password: newPassword }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to change password.');
  }
  return data;
}
