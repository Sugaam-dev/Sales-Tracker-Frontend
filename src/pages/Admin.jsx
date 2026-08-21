import React, { useState, useEffect } from 'react';
import { Users, Settings, Mail, Edit2, Plus, Check, X, Trash2 } from 'lucide-react';
import { API, authHeaders } from '../api/config';
import './Admin.css';

// ─── Reusable UI Components ──────────────────────────────────────────────────

const ModalWrapper = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
          <X size={20} />
        </button>
      </div>
      {children}
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

// ─── Master Data Section Component ───────────────────────────────────────────

function MasterDataSection({ title, items, onDelete, onAdd, onEdit, renderItem }) {
  return (
    <div style={{ marginBottom: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: 'var(--color-background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>{title}</h4>
        <button className="btn-primary" onClick={onAdd} style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={12} /> Add
        </button>
      </div>
      <div style={{ padding: '8px' }}>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: '4px', background: item.is_active ? 'transparent' : 'rgba(239,68,68,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.is_active ? '#10B981' : '#EF4444', display: 'inline-block', flexShrink: 0 }}></span>
              {renderItem(item)}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="icon-btn edit" onClick={() => onEdit(item)} title="Edit"><Edit2 size={13} /></button>
              <button className="icon-btn delete" onClick={() => onDelete(item.id)} title="Deactivate"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p style={{ padding: '12px', color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center' }}>No items yet — click Add!</p>}
      </div>
    </div>
  );
}

// ─── Master Data Settings Tab ─────────────────────────────────────────────────

function MasterDataSettings() {
  const [stages, setStages] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [sources, setSources] = useState([]);
  const [regions, setRegions] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const endpoints = [API.MASTER_STAGES, API.MASTER_PRIORITIES, API.MASTER_SOURCES, API.MASTER_REGIONS, API.MASTER_ACTIVITY_TYPES];
      const [s, p, src, r, a] = await Promise.all(
        endpoints.map(url => fetch(url, { headers: authHeaders() }).then(res => res.json()))
      );
      setStages(s); setPriorities(p); setSources(src); setRegions(r); setActivityTypes(a);
    } catch (err) {
      console.error('Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  const API_MAP = {
    stage: API.MASTER_STAGES,
    priority: API.MASTER_PRIORITIES,
    source: API.MASTER_SOURCES,
    region: API.MASTER_REGIONS,
    activityType: API.MASTER_ACTIVITY_TYPES,
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const form = e.target.elements;
    const { type, mode, item } = modal;

    const payload = { name: form.name.value };
    if (type === 'stage') {
      payload.order_index = parseInt(form.order_index?.value || 0);
      payload.default_probability = parseFloat(form.default_probability?.value || 0);
    } else if (type === 'priority' || type === 'source') {
      payload.score = parseInt(form.score?.value || 0);
    }

    const url = mode === 'edit' ? `${API_MAP[type]}/${item.id}` : API_MAP[type];
    try {
      const res = await fetch(url, { method: mode === 'edit' ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) { fetchAll(); setModal(null); }
    } catch (err) {
      alert('Failed to save');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Deactivate this item?')) return;
    try {
      await fetch(`${API_MAP[type]}/${id}`, { method: 'DELETE', headers: authHeaders() });
      fetchAll();
    } catch (err) {
      alert('Failed to deactivate');
    }
  };

  if (loading) return <p style={{ padding: '16px', color: 'var(--color-text-muted)' }}>Loading master data...</p>;

  const masterDataConfigs = [
    { type: 'stage', title: '📋 Lead Stages', items: stages, detail: (item) => `Prob: ${item.default_probability}% | Order: ${item.order_index}` },
    { type: 'priority', title: '🎯 Priorities', items: priorities, detail: (item) => `Score: ${item.score}` },
    { type: 'source', title: '📡 Lead Sources', items: sources, detail: (item) => `Score: ${item.score}` },
    { type: 'region', title: '🌍 Regions', items: regions },
    { type: 'activityType', title: '⚡ Activity Types', items: activityTypes },
  ];

  return (
    <div>
      {/* <div className="pane-header" style={{ marginBottom: '16px' }}> */}
        {/* <h3>Dropdown Settings</h3> */}
        {/* <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Manage dropdown values used across the app</p> */}
      {/* </div> */}

      {/* {masterDataConfigs.map(({ type, title, items, detail }) => (
        <MasterDataSection
          key={type}
          title={title}
          items={items}
          onAdd={() => setModal({ type, mode: 'add', item: {} })}
          onEdit={(item) => setModal({ type, mode: 'edit', item })}
          onDelete={(id) => handleDelete(type, id)}
          renderItem={(item) => (
            <div>
              <span style={{ fontWeight: '500', fontSize: '14px' }}>{item.name}</span>
              {detail && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{detail(item)}</span>}
            </div>
          )}
        />
      ))} */}

      {modal && (
        <ModalWrapper title={`${modal.mode === 'add' ? 'Add' : 'Edit'} ${modal.type}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <FormInput label="Name" name="name" defaultValue={modal.item?.name || ''} required />
            
            {modal.type === 'stage' && (
              <>
                <FormInput label="Default Probability (%)" name="default_probability" type="number" min="0" max="100" defaultValue={modal.item?.default_probability || 0} />
                <FormInput label="Order Index" name="order_index" type="number" min="0" defaultValue={modal.item?.order_index || 0} />
              </>
            )}
            
            {['priority', 'source'].includes(modal.type) && (
              <FormInput label="Score" name="score" type="number" min="0" defaultValue={modal.item?.score || 0} />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const [toastMessage, setToastMessage] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [users, setUsers] = useState([
    { id: 1, name: 'Debabrata Ghosh', email: 'debabrata@salestracker.com', role: 'Sales Executive', active: true  },
    { id: 2, name: 'Sanjay Mishra',   email: 'sanjay@salestracker.com',   role: 'Sales Manager',   active: true  },
    { id: 3, name: 'Hemant Kumar',    email: 'hemant@salestracker.com',   role: 'Director of Sales', active: true },
    { id: 4, name: 'Priya Sharma',    email: 'priya@salestracker.com',    role: 'Sales Executive', active: false },
    { id: 5, name: 'Rahul Desai',     email: 'rahul@salestracker.com',    role: 'Leadership', active: true  },
  ]);

  const [sendingState, setSendingState] = useState('idle');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('Sales Tracker Report');
  const [emailError, setEmailError] = useState('');

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const toggleUser = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u));
    showToast('User status updated');
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    const { name, email, role } = e.target.elements;

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: name.value, email: email.value, role: role.value } : u));
      showToast('User updated successfully');
    } else {
      setUsers([...users, { id: Date.now(), name: name.value, email: email.value, role: role.value, active: true }]);
      showToast('New member added');
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const tabs = [
    { id: 'users', label: 'User Management', Icon: Users },
    // { id: 'settings', label: 'Dropdown Settings', Icon: Settings },
    { id: 'email', label: 'Email Automation', Icon: Mail }
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
        {activeTab === 'users' && (
          <div className="tab-pane">
            <div className="pane-header">
              <h3>Team Members</h3>
              <button className="btn-primary" onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}>
                <Plus size={16} /> Add Member
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="font-medium">{user.name}</td>
                      <td>{user.email}</td>
                      <td><span className="role-badge">{user.role}</span></td>
                      <td>
                        <label className="toggle-switch">
                          <input type="checkbox" checked={user.active} onChange={() => toggleUser(user.id)} />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td>
                        <button className="icon-btn edit" title="Edit" onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }}>
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-pane">
            <MasterDataSettings />
          </div>
        )}

        {activeTab === 'email' && (
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

      {isUserModalOpen && (
        <ModalWrapper title={editingUser ? 'Edit Member' : 'Add New Member'} onClose={() => setIsUserModalOpen(false)}>
          <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormInput label="Name" name="name" defaultValue={editingUser?.name || ''} required />
            <FormInput label="Email" name="email" type="email" defaultValue={editingUser?.email || ''} required />
            <FormInput label="Role" name="role" as="select" defaultValue={editingUser?.role || 'Sales Executive'}>
              <option>Sales Executive</option>
              <option>Sales Manager</option>
              <option>Director of Sales</option>
              <option>Leadership</option>
            </FormInput>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}