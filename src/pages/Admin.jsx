import React, { useState, useEffect } from 'react';
import { Users, Mail, Edit2, Plus, Check, X, Trash2, Eye, EyeOff, Shield, RefreshCw } from 'lucide-react';
import { API, authHeaders } from '../api/config';
import {
  createUser,
  fetchUsers,
  updateUser,
  grantLeaderDelegation,
  revokeLeaderDelegation,
  hasPermission,
} from '../services/authService';
import { normalizeError } from '../services/apiError';
import { useToast, useConfirm } from '../context/FeedbackContext';
import { SkeletonTable } from '../components/common/Skeleton';
import './Admin.css';

// ─── Reusable UI Components ──────────────────────────────────────────────────

const ModalWrapper = ({ title, onClose, children, maxWidth = '440px', bodyClassName = '' }) => (
  <div
    className="admin-modal-overlay"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="admin-modal-card" style={{ maxWidth }}>
      <div className="admin-modal-header">
        <h3 className="admin-modal-title">{title}</h3>
        <button
          type="button"
          className="admin-modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>
      <div className={`admin-modal-body hide-scrollbar ${bodyClassName}`}>
        {children}
      </div>
    </div>
  </div>
);

const FormInput = ({ label, name, type = "text", defaultValue, required, min, max, as = "input", children }) => (
  <div>
    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>{label}</label>
    {React.createElement(as, {
      name, type, defaultValue, required, min, max,
      style: { width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }
    }, children)}
  </div>
);

// ─── Main Admin Component ─────────────────────────────────────────────────────

export default function Admin({ user: propUser }) {
  const showToast = useToast();
  const confirm = useConfirm();
  const currentUser = propUser || JSON.parse(localStorage.getItem('user'));
  const userRole = (currentUser?.rawRole || currentUser?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  const canViewUsers = hasPermission(currentUser, 'user.view');
  const canCreateUser = hasPermission(currentUser, 'user.create');
  const canUpdateUser = hasPermission(currentUser, 'user.update');
  const canDeleteUser = hasPermission(currentUser, 'user.delete');
  const canManageManagers = hasPermission(currentUser, 'manager.manage');

  const tabs = [];
  if (canViewUsers) {
    tabs.push({ id: 'users', label: 'User Management', Icon: Users });
  }
  if (isAdmin) {
    tabs.push({ id: 'email', label: 'Email Automation', Icon: Mail });
  }

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'users');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState('sales_executive');
  const [editingUser, setEditingUser] = useState(null);
  const [delegationModalLeader, setDelegationModalLeader] = useState(null);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [sendingState, setSendingState] = useState('idle');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('Sales Tracker Report');
  const [emailError, setEmailError] = useState('');

  const [userCreationLoading, setUserCreationLoading] = useState(false);
  const [userCreationError, setUserCreationError] = useState('');
  const [userCreationSuccess, setUserCreationSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usersError, setUsersError] = useState(null);

  const loadUsers = async () => {
    if (!canViewUsers) return;
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
      const errMsg = normalizeError(err, 'Failed to load users');
      setUsersError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [canViewUsers]);

  const toggleUser = async (user) => {
    if (!canDeleteUser || togglingUserId) return;
    const newStatus = user.is_active === false ? true : false;
    const actionLabel = newStatus ? 'activate' : 'deactivate';

    const confirmed = await confirm({
      title: `${newStatus ? 'Activate' : 'Deactivate'} User?`,
      message: `Are you sure you want to ${actionLabel} ${user.name || user.email}?`,
      confirmText: newStatus ? 'Activate' : 'Deactivate',
      cancelText: 'Cancel',
      variant: newStatus ? 'primary' : 'danger',
    });
    if (!confirmed) return;

    setTogglingUserId(user.id);
    try {
      const updatedUser = await updateUser(user.id, {
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: newStatus,
        manager_id: user.manager_id || null,
      });
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === user.id) {
            return {
              ...u,
              ...(updatedUser && typeof updatedUser === 'object' ? updatedUser : {}),
              is_active: updatedUser?.is_active !== undefined ? updatedUser.is_active : newStatus,
            };
          }
          return u;
        })
      );
      showToast('User status updated successfully', 'success');
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      showToast(err.message || 'Failed to toggle status', 'error');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setModalRole('sales_executive');
    setUserCreationError('');
    setUserCreationSuccess('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setModalRole((user.role || '').toLowerCase());
    setUserCreationError('');
    setUserCreationSuccess('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserCreationError('');
    setUserCreationSuccess('');

    const elements = e.target.elements;
    const name = elements.name.value;
    const email = elements.email.value;
    const role = elements.role.value;
    const managerId = elements.manager_id ? (elements.manager_id.value || null) : null;

    if (editingUser) {
      if (role === 'sales_executive' && !managerId) {
        setUserCreationError('Please select an assigned sales manager for the sales executive.');
        return;
      }

      setUserCreationLoading(true);
      try {
        await updateUser(editingUser.id, {
          name: name.trim(),
          email: email.trim(),
          role,
          is_active: editingUser.is_active !== false,
          manager_id: role === 'sales_executive' ? managerId : null,
        });
        showToast('User updated successfully.', 'success');
        setIsUserModalOpen(false);
        setEditingUser(null);
        await loadUsers();
      } catch (err) {
        console.error('User update failed:', err);
        setUserCreationError(err.message || 'An error occurred during user update.');
      } finally {
        setUserCreationLoading(false);
      }
      return;
    }

    const mobile = elements.mobile?.value || '';
    const password = elements.password.value;

    if (!name || !email || !password || !role) {
      setUserCreationError('Name, email, password, and role are required.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setUserCreationError('Please enter a valid email address.');
      return;
    }

    // Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (password.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setUserCreationError('Password must be at least 8 characters and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
      return;
    }

    // Manager requirement for sales executive
    if (role === 'sales_executive' && !managerId) {
      setUserCreationError('Please select an assigned sales manager for the sales executive.');
      return;
    }

    setUserCreationLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        role,
        password,
      };

      if (mobile && mobile.trim()) {
        payload.mobile = mobile.trim();
      }

      if (role === 'sales_executive' && managerId) {
        payload.manager_id = managerId;
      }

      const responseData = await createUser(payload);

      if (responseData.email_sent === false) {
        showToast('User created, but welcome email failed.', 'warning');
      } else {
        showToast('User created successfully and welcome email sent.', 'success');
      }

      await loadUsers();
      setIsUserModalOpen(false);
    } catch (err) {
      console.error('User creation failed:', err);
      if (err.message.includes('403') || err.message.toLowerCase().includes('authorized') || err.message.toLowerCase().includes('permission')) {
        setUserCreationError('You are not authorized to create users.');
      } else if (err.message.includes('409') || err.message.toLowerCase().includes('already exists') || err.message.toLowerCase().includes('duplicate')) {
        setUserCreationError('Email or mobile number already exists.');
      } else {
        setUserCreationError(err.message || 'An error occurred during user creation.');
      }
    } finally {
      setUserCreationLoading(false);
    }
  };

  const handleToggleDelegation = async (leaderId, permission, currentGranted) => {
    setDelegationLoading(true);
    const permObj = DELEGABLE_PERMISSIONS.find(p => p.key === permission);
    const permLabel = permObj ? permObj.label : permission;
    try {
      if (currentGranted) {
        await revokeLeaderDelegation(leaderId, permission);
        showToast(`${permLabel} permission revoked.`);
      } else {
        await grantLeaderDelegation(leaderId, permission);
        showToast(`${permLabel} permission granted.`);
      }

      // Update state in modal & list
      setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === leaderId) {
          const prevPerms = u.permissions || [];
          const updatedPerms = currentGranted
            ? prevPerms.filter(p => p !== permission)
            : [...prevPerms, permission];
          return { ...u, permissions: updatedPerms };
        }
        return u;
      }));

      if (delegationModalLeader && delegationModalLeader.id === leaderId) {
        const prevPerms = delegationModalLeader.permissions || [];
        const updatedPerms = currentGranted
          ? prevPerms.filter(p => p !== permission)
          : [...prevPerms, permission];
        setDelegationModalLeader({ ...delegationModalLeader, permissions: updatedPerms });
      }
    } catch (err) {
      console.error('Failed to update delegation:', err);
      showToast(err.message || 'Failed to update delegation');
    } finally {
      setDelegationLoading(false);
    }
  };

  const roleDisplay = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'admin': return 'Admin';
      case 'leader': return 'Leader';
      case 'sales_manager': return 'Sales Manager';
      case 'sales_executive': return 'Sales Executive';
      default: return role;
    }
  };

  const activeSalesManagers = users.filter(u => (u.role || '').toLowerCase() === 'sales_manager' && Boolean(u.is_active));

  const DELEGABLE_PERMISSIONS = [
    { key: 'user.view', label: 'View Users', desc: 'Can view team members list and details' },
    { key: 'user.create', label: 'Create Users', desc: 'Can create new users in the system' },
    { key: 'user.update', label: 'Update Users', desc: 'Can modify user details and credentials' },
    { key: 'user.delete', label: 'Delete / Deactivate Users', desc: 'Can deactivate or delete users' },
    { key: 'manager.manage', label: 'Manage Managers', desc: 'Can assign sales executives to managers' },
    { key: 'system.settings.manage', label: 'Manage Settings', desc: 'Can configure system and master settings' },
  ];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="page-title">Admin & Settings</h1>
      </div>

      <div className="admin-tabs">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} className={`admin-tab ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      <div className="admin-content card">
        {activeTab === 'users' && canViewUsers && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h3>Team Members</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>
                  Manage users, roles, manager hierarchy, and administrative delegations
                </p>
              </div>
              {canCreateUser && (
                <button className="btn-primary" onClick={handleOpenCreateUser}>
                  <Plus size={16} /> Add Member
                </button>
              )}
            </div>

            {loadingUsers ? (
              <div style={{ padding: '16px' }}>
                <SkeletonTable rows={5} columns={6} />
              </div>
            ) : usersError ? (
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #F87171', margin: '16px 0' }}>
                <p style={{ color: '#DC2626', fontWeight: '500', margin: '0 0 12px 0', fontSize: '14px' }}>{usersError}</p>
                <button
                  onClick={loadUsers}
                  className="btn-primary"
                  style={{ padding: '6px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Manager</th>
                      <th>Status</th>
                      {(canUpdateUser || isAdmin) && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const isExecutive = (u.role || '').toLowerCase() === 'sales_executive';
                      const isLeader = (u.role || '').toLowerCase() === 'leader';
                      const isActive = Boolean(u.is_active);
                      const isToggling = togglingUserId === u.id;

                      return (
                        <tr key={u.id}>
                          <td className="font-medium">{u.name}</td>
                          <td>{u.email}</td>
                          <td><span className="role-badge">{roleDisplay(u.role)}</span></td>
                          <td>
                            {isExecutive ? (
                              u.manager_name ? (
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>{u.manager_name}</span>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Unassigned</span>
                              )
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <label
                              className="toggle-switch"
                              style={isToggling ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                            >
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={() => toggleUser(u)}
                                disabled={!canDeleteUser || isToggling}
                              />
                              <span className="slider"></span>
                            </label>
                          </td>
                          {(canUpdateUser || isAdmin) && (
                            <td>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {canUpdateUser && (
                                  <button
                                    className="icon-btn edit"
                                    title="Edit user"
                                    onClick={() => handleOpenEditUser(u)}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                )}
                                {isAdmin && isLeader && (
                                  <button
                                    className="btn-secondary"
                                    style={{ fontSize: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    title="Manage leader delegations"
                                    onClick={() => setDelegationModalLeader(u)}
                                  >
                                    <Shield size={14} />
                                    <span>Delegations ({u.permissions?.length || 0})</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                          No team members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && isAdmin && (
          <div className="tab-pane email-automation">
            <div className="pane-header"><h3>Email Automation</h3></div>
            <div className="email-form">
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Sender Email</label>
                  <input type="email" value="sugaam.dev@gmail.com" disabled style={{ opacity: 0.6 }} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Recipient Email</label>
                  <input type="email" placeholder="recipient@example.com" value={emailRecipient} onChange={e => setEmailRecipient(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Subject</label>
                  <input type="text" placeholder="Sales Tracker Report" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                </div>
              </div>
              {emailError && <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '4px' }}>{emailError}</p>}
              <div className="email-actions">
                <button
                  className={`btn-primary test-email-btn ${sendingState === 'success' ? 'success' : ''}`}
                  disabled={sendingState !== 'idle'}
                  onClick={async () => {
                    setEmailError('');
                    if (!emailRecipient) return setEmailError('Please enter a recipient email address.');
                    setSendingState('sending');
                    try {
                      const res = await fetch(API.SEND_EMAIL, {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({ recipient: emailRecipient, subject: emailSubject || 'Sales Tracker Report', body: '<p>This is a test email from <strong>Sales Tracker</strong>.</p>' })
                      });
                      const data = await res.json();
                      if (res.ok && data.message === 'Email sent successfully') {
                        setSendingState('success');
                        setTimeout(() => setSendingState('idle'), 3000);
                      } else {
                        setSendingState('idle');
                        setEmailError(data.message || 'Failed to send email.');
                      }
                    } catch (err) {
                      setSendingState('idle');
                      setEmailError('Network error — could not reach server.');
                    }
                  }}
                >
                  {sendingState === 'idle' && 'Send Test Email'}
                  {sendingState === 'sending' && 'Sending...'}
                  {sendingState === 'success' && <><Check size={18} /> Sent!</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {isUserModalOpen && (
        <ModalWrapper
          title={editingUser ? 'Edit Member' : 'Add New Member'}
          onClose={() => { setIsUserModalOpen(false); setUserCreationError(''); setUserCreationSuccess(''); }}
        >
          <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {userCreationError && (
              <div style={{ color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px', fontSize: '13px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {userCreationError}
              </div>
            )}
            {userCreationSuccess && (
              <div style={{ color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px', fontSize: '13px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                {userCreationSuccess}
              </div>
            )}
            <FormInput label="Name" name="name" defaultValue={editingUser?.name || ''} required disabled={userCreationLoading} />
            <FormInput label="Email" name="email" type="email" defaultValue={editingUser?.email || ''} required disabled={userCreationLoading} />
            
            {!editingUser && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Mobile Number (Optional)</label>
                  <input
                    name="mobile"
                    type="tel"
                    disabled={userCreationLoading}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={userCreationLoading}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={userCreationLoading}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                    Must be at least 8 characters, with 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
                  </span>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Role</label>
              <select
                name="role"
                value={modalRole}
                onChange={(e) => setModalRole(e.target.value)}
                disabled={userCreationLoading}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
              >
                <option value="sales_executive">Sales Executive</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="leader">Leader</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Manager Assignment field - Only for sales executives */}
            {modalRole === 'sales_executive' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>
                  Assigned Sales Manager <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  name="manager_id"
                  defaultValue={editingUser?.manager_id || ''}
                  required
                  disabled={userCreationLoading}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                >
                  <option value="">-- Select Sales Manager --</option>
                  {activeSalesManagers.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} ({mgr.email})
                    </option>
                  ))}
                </select>
                {activeSalesManagers.length === 0 && (
                  <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                    No active Sales Managers available. Please create or activate a Sales Manager first.
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setIsUserModalOpen(false); setUserCreationError(''); setUserCreationSuccess(''); }}
                disabled={userCreationLoading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={userCreationLoading}>
                {userCreationLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* Leader Delegation Management Modal (Admin Only) */}
      {delegationModalLeader && isAdmin && (
        <ModalWrapper
          title={`Leader Delegations: ${delegationModalLeader.name}`}
          onClose={() => setDelegationModalLeader(null)}
          maxWidth="480px"
          bodyClassName="delegation-modal-body"
        >
          <div className="delegation-modal-container">
            <p className="delegation-modal-desc">
              Admins can grant or revoke specific administrative privileges to Leaders. Leaders have unrestricted sales data visibility by default.
            </p>

            <div className="delegation-permissions-list hide-scrollbar">
              {DELEGABLE_PERMISSIONS.map(p => {
                const isGranted = (delegationModalLeader.permissions || []).includes(p.key);
                return (
                  <div
                    key={p.key}
                    className={`delegation-perm-card ${isGranted ? 'granted' : ''}`}
                    onClick={() => {
                      if (!delegationLoading) {
                        handleToggleDelegation(delegationModalLeader.id, p.key, isGranted);
                      }
                    }}
                  >
                    <div className="delegation-checkbox-container">
                      <input
                        type="checkbox"
                        id={`perm-${p.key}`}
                        checked={isGranted}
                        disabled={delegationLoading}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleDelegation(delegationModalLeader.id, p.key, isGranted);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="delegation-checkbox-input"
                      />
                    </div>
                    <div className="delegation-perm-info">
                      <div className="delegation-perm-title">{p.label}</div>
                      <div className="delegation-perm-desc">{p.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="delegation-modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setDelegationModalLeader(null)}
              >
                Done
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}