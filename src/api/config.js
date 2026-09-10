const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const API = {
  LOGIN: `${BASE_URL}/auth/login`,
  REFRESH: `${BASE_URL}/auth/refresh`,
  SSO_REDIRECT: `${BASE_URL}/auth/sso/redirect`,
  ONBOARDING_SET_PASSWORD: `${BASE_URL}/auth/onboarding/set-password`,
  ONBOARDING_VERIFY_EMAIL: `${BASE_URL}/auth/onboarding/verify-email`,
  ONBOARDING_VERIFY_MOBILE: `${BASE_URL}/auth/onboarding/verify-mobile`,
  FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
  MFA_VERIFY: `${BASE_URL}/auth/mfa/verify`,
  USERS: `${BASE_URL}/users`,
  LOGOUT: `${BASE_URL}/auth/logout`,
  MASTER_STAGES: `${BASE_URL}/master/stages`,
  MASTER_PRIORITIES: `${BASE_URL}/master/priorities`,
  MASTER_SOURCES: `${BASE_URL}/master/sources`,
  MASTER_REGIONS: `${BASE_URL}/master/regions`,
  MASTER_ACTIVITY_TYPES: `${BASE_URL}/master/activity-types`,
  SEND_EMAIL: `${BASE_URL}/email/send`,
  CURRENT_USERS: `${BASE_URL}/current_users/`,
  LEADS: `${BASE_URL}/leads`,
  TASKS: `${BASE_URL}/tasks`,
  HEAT_MAP: `${BASE_URL}/reports/heat-map`,
  COMMERCIAL: (leadId) => `${BASE_URL}/leads/${leadId}/commercial`,
  ACTIVITIES: `${BASE_URL}/activities`,
  ACTIVITIES_SUMMARY: `${BASE_URL}/activities/summary`,
  DASHBOARD_SUMMARY: `${BASE_URL}/dashboard/summary`,
  REPORTS_ANALYTICS: `${BASE_URL}/reports/analytics`,
};

export const authHeaders = () => {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
