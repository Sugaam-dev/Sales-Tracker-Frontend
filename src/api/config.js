const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const API = {
  LOGIN: `${BASE_URL}/auth/login`,
  USERS: `${BASE_URL}/users/`,
  MASTER_STAGES: `${BASE_URL}/master/stages`,
  MASTER_PRIORITIES: `${BASE_URL}/master/priorities`,
  MASTER_SOURCES: `${BASE_URL}/master/sources`,
  MASTER_REGIONS: `${BASE_URL}/master/regions`,
  MASTER_ACTIVITY_TYPES: `${BASE_URL}/master/activity-types`,
  SEND_EMAIL: `${BASE_URL}/email/send`,
  SSO_REDIRECT: `${BASE_URL}/auth/sso/redirect`,
};

export const authHeaders = () => {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};