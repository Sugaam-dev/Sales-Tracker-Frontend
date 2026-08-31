import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { fetchCurrentUsers } from '../services/leadService';
import './Modal.css';

export default function QuickCreateLeadModal({
  isOpen,
  onClose,
  onCreate,
}) {
  const dialogRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [countryCode, setCountryCode] = useState('IN +91');

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      // Fetch dynamic users when modal opens
      fetchCurrentUsers().then(res => {
        if (res.success && res.data) {
          setUsers(res.data);
        }
      }).catch(err => console.error("Failed to fetch users", err));
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    let isValid = true;
    
    // Validate Phone (10 digits)
    const strippedPhone = String(data.phone).replace(/\D/g, '');
    if (strippedPhone.length !== 10) {
      setPhoneError('Contact Number must be exactly 10 digits.');
      isValid = false;
    } else {
      setPhoneError('');
    }

    // Validate Email
    if (!data.email.toLowerCase().endsWith('.com')) {
      setEmailError('Email must end with .com');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!isValid) return;

    // Attach country code to data
    data.countryCode = countryCode;
    onCreate(data);
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog"
      onCancel={onClose}
    >
      <div className="modal-header">
        <h3>Quick Create Lead</h3>

        <button
          type="button"
          className="close-btn"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="quick-lead-content">
        <form
          onSubmit={handleSubmit}
          className="quick-create-form"
        >
          <div className="form-grid">
            <div className="form-group">
              <label>
                Lead Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="leadName"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Company Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Contact Number <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  name="countryCode" 
                  value={countryCode} 
                  onChange={e => setCountryCode(e.target.value)}
                  style={{ width: '100px', flexShrink: 0 }}
                >
                  <option value="IN +91">IN +91</option>
                  <option value="US +1">US +1</option>
                  <option value="UK +44">UK +44</option>
                  <option value="AE +971">AE +971</option>
                  <option value="SG +65">SG +65</option>
                </select>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength="10"
                  minLength="10"
                  pattern="\d{10}"
                  title="Phone number must be exactly 10 digits"
                  style={{ flex: 1 }}
                  onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                />
              </div>
              {phoneError && <span style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{phoneError}</span>}
            </div>

            <div className="form-group">
              <label>
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
              />
              {emailError && <span style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{emailError}</span>}
            </div>

            <div className="form-group">
              <label>
                Product / Service <span className="required">*</span>
              </label>
              <input
                type="text"
                name="productService"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Request Type <span className="required">*</span>
              </label>
              <select
                name="requestType"
                required
              >
                <option value="">Select...</option>
                <option>Product Request</option>
                <option>Service Request</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Lead Owner <span className="required">*</span>
              </label>
              <select
                name="owner"
                required
              >
                <option value="">Select...</option>
                {users.length > 0 ? (
                  users.map(user => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                  ))
                ) : (
                  <>
                    <option>Debabrata Ghosh</option>
                    <option>Sanjay Mishra</option>
                    <option>Hemant Kumar</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Priority <span className="required">*</span>
              </label>
              <select
                name="priority"
                required
              >
                <option value="">Select...</option>
                <option>Urgent</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Lead Status <span className="required">*</span>
              </label>
              <select
                name="status"
                required
              >
                <option value="">Select...</option>
                <option>Open</option>
                <option>New</option>
                <option>Contacted</option>
                <option>Analysis</option>
                <option>Interested</option>
                <option>Negotiation</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Estimated Req. Date
              </label>
              <input
                type="date"
                name="estDate"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}