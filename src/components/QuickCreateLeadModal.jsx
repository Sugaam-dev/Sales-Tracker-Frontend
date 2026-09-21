import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useMasterData } from '../context/MasterDataContext';
import { COUNTRY_CODES, getCountryObj } from '../constants/countries';
import { validatePhoneNumber, getMaxPhoneDigits } from '../utils/phoneValidation';
import './Modal.css';

/**
 * Whitespace-based word counter handling normal spaces, multiple spaces,
 * leading/trailing spaces, tabs, and newlines.
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Validates email address format supporting various domains (.com, .in, .org, .net, .co.uk, etc.)
 */
function validateEmail(email) {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return { valid: false, message: 'Email address is required.' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: 'Enter a valid email address.' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates a single field according to business rules.
 */
function validateField(name, value, allData) {
  const trimmed = (value || '').trim();
  switch (name) {
    case 'leadName':
      if (!trimmed) return 'Lead name is required.';
      return '';
    case 'companyName':
      if (!trimmed) return 'Company name is required.';
      return '';
    case 'phone':
      return validatePhoneNumber(value, allData.countryCode, true, 'Contact number is required.').message;
    case 'email':
      return validateEmail(value).message;
    case 'requestType':
      if (trimmed !== 'IT Product' && trimmed !== 'IT Service') {
        return 'Request type is required.';
      }
      return '';
    case 'requestDetails': {
      const words = countWords(value);
      if (words < 10 || words > 200) {
        return 'Request details must be between 10 and 200 words.';
      }
      return '';
    }
    case 'owner':
      if (!trimmed) return 'Lead owner is required.';
      return '';
    case 'priority':
      if (!trimmed) return 'Priority is required.';
      return '';
    case 'status':
      if (!trimmed) return 'Lead status is required.';
      return '';
    default:
      return '';
  }
}

const initialFormData = {
  leadName: '',
  companyName: '',
  phone: '',
  countryCode: 'IN +91',
  email: '',
  requestType: '',
  requestDetails: '',
  owner: '',
  priority: '',
  status: '',
  estDate: '',
};

export default function QuickCreateLeadModal({
  isOpen,
  onClose,
  onCreate,
}) {
  const dialogRef = useRef(null);
  const { usersList } = useMasterData();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (usersList && usersList.length > 0) {
      setUsers(usersList);
    }
  }, [usersList]);

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setTouched({});
    setServerError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleChange = (field, val) => {
    setServerError('');
    let finalVal = val;
    let updated = { ...formData };

    if (field === 'phone') {
      // 1. Do not accept alphabetic or non-numeric characters (keep only digits)
      const digitsOnly = val.replace(/\D/g, '');
      // 2. Do not accept values more than the selected country code max length
      const maxLen = getMaxPhoneDigits(formData.countryCode);
      finalVal = digitsOnly.slice(0, maxLen);
      updated = { ...formData, [field]: finalVal };
    } else if (field === 'countryCode') {
      // Truncate phone number if it exceeds new country's max allowed length
      const maxLen = getMaxPhoneDigits(val);
      const digitsOnly = (formData.phone || '').replace(/\D/g, '');
      const truncatedPhone = digitsOnly.slice(0, maxLen);
      updated = { ...formData, countryCode: val, phone: truncatedPhone };
      finalVal = val;
    } else if (field === 'value') {
      const cleanVal = val.replace(/[^0-9.]/g, '');
      finalVal = cleanVal;
      updated = { ...formData, [field]: cleanVal };
    } else {
      updated = { ...formData, [field]: val };
    }

    setFormData(updated);

    // If changing country code, immediately revalidate phone if non-empty or touched
    if (field === 'countryCode') {
      if (updated.phone) {
        const phoneMsg = validatePhoneNumber(updated.phone, val, true, 'Contact number is required.').message;
        setErrors(prev => ({ ...prev, phone: phoneMsg }));
      } else if (touched.phone) {
        setErrors(prev => ({ ...prev, phone: 'Contact number is required.' }));
      }
    }

    // Live error clearing if field was already blurred or has error
    if (touched[field] || errors[field]) {
      const errorMsg = validateField(field, finalVal, updated);
      setErrors(prev => ({ ...prev, [field]: errorMsg }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, formData[field], formData);
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const fieldsToValidate = [
      'leadName',
      'companyName',
      'phone',
      'email',
      'requestType',
      'requestDetails',
      'owner',
      'priority',
      'status',
      'value'
    ];

    const newErrors = {};
    const newTouched = {};
    let hasError = false;

    fieldsToValidate.forEach(field => {
      newTouched[field] = true;
      const msg = validateField(field, formData[field], formData);
      if (msg) {
        newErrors[field] = msg;
        hasError = true;
      }
    });

    setTouched(prev => ({ ...prev, ...newTouched }));
    setErrors(newErrors);

    if (hasError) return;

    // Extract country calling code
    const countryObj = getCountryObj(formData.countryCode);
    const callingCode = countryObj?.code || '+91';

    const submitData = {
      ...formData,
      countryCode: callingCode,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      leadName: formData.leadName.trim(),
      companyName: formData.companyName.trim(),
      requestDetails: formData.requestDetails.trim(),
      requestType: formData.requestType,
      owner: formData.owner,
      priority: formData.priority,
      status: formData.status,
      estDate: formData.estDate,
      value: formData.value ? formData.value.trim() : undefined,
    };

    try {
      setSubmitting(true);
      await onCreate(submitData);
      resetForm();
    } catch (err) {
      console.error('Quick Create Lead Error:', err);
      setServerError(err.message || 'Failed to create lead.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentWordCount = countWords(formData.requestDetails);

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog"
      onCancel={handleClose}
    >
      <div className="modal-header">
        <h3>Quick Create Lead</h3>

        <button
          type="button"
          className="close-btn"
          onClick={handleClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="quick-lead-content">
        {serverError && (
          <div className="modal-error-banner" style={{ marginBottom: '16px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="quick-create-form"
          noValidate
        >
          <div className="form-grid">
            {/* ROW 1 */}
            {/* 1. Lead Name */}
            <div className="form-group">
              <label>
                Lead Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="leadName"
                value={formData.leadName}
                onChange={e => handleChange('leadName', e.target.value)}
                onBlur={() => handleBlur('leadName')}
                className={errors.leadName ? 'input-error' : ''}
                placeholder="Enter lead name"
              />
              {errors.leadName && <span className="field-error-text">{errors.leadName}</span>}
            </div>

            {/* 2. Company Name */}
            <div className="form-group">
              <label>
                Company Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={e => handleChange('companyName', e.target.value)}
                onBlur={() => handleBlur('companyName')}
                className={errors.companyName ? 'input-error' : ''}
                placeholder="Enter company name"
              />
              {errors.companyName && <span className="field-error-text">{errors.companyName}</span>}
            </div>

            {/* ROW 2 */}
            {/* 3. Contact Number */}
            <div className="form-group">
              <label>
                Contact Number <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  name="countryCode" 
                  value={formData.countryCode} 
                  onChange={e => handleChange('countryCode', e.target.value)}
                  style={{ width: '135px', flexShrink: 0 }}
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={`${c.iso}-${c.code}`} value={`${c.iso} ${c.code}`}>
                      {c.flag} {c.iso} ({c.code})
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  maxLength={getMaxPhoneDigits(formData.countryCode)}
                  className={errors.phone ? 'input-error' : ''}
                  placeholder="Enter contact number"
                  style={{ flex: 1 }}
                />
              </div>
              {errors.phone && <span className="field-error-text">{errors.phone}</span>}
            </div>

            {/* 4. Email Address */}
            <div className="form-group">
              <label>
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={errors.email ? 'input-error' : ''}
                placeholder="e.g. user@company.org"
              />
              {errors.email && <span className="field-error-text">{errors.email}</span>}
            </div>

            {/* ROW 3 */}
            {/* 5. Request Type (Left Column) */}
            <div className="form-group">
              <label>
                Request Type <span className="required">*</span>
              </label>
              <select
                name="requestType"
                value={formData.requestType}
                onChange={e => handleChange('requestType', e.target.value)}
                onBlur={() => handleBlur('requestType')}
                className={errors.requestType ? 'input-error' : ''}
              >
                <option value="">Select...</option>
                <option value="IT Product">IT Product</option>
                <option value="IT Service">IT Service</option>
              </select>
              {errors.requestType && <span className="field-error-text">{errors.requestType}</span>}
            </div>

            {/* 6. Request Details (Right Column, replaces Product / Service) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>
                  Request Details <span className="required">*</span>
                </label>
                <span 
                  className="word-counter"
                  style={{ 
                    color: (currentWordCount < 10 || currentWordCount > 200) ? 'var(--color-text-muted)' : '#10b981'
                  }}
                >
                  {currentWordCount} / 200 words {currentWordCount < 10 && <span style={{ fontSize: '10px' }}>(at least 10 words required)</span>}
                </span>
              </div>
              <textarea
                name="requestDetails"
                value={formData.requestDetails}
                onChange={e => handleChange('requestDetails', e.target.value)}
                onBlur={() => handleBlur('requestDetails')}
                className={errors.requestDetails ? 'input-error' : ''}
                placeholder="Provide between 10 to 200 words describing the client request..."
              />
              {errors.requestDetails && <span className="field-error-text">{errors.requestDetails}</span>}
            </div>

            {/* ROW 4 */}
            {/* 7. Lead Owner (Left Column) */}
            <div className="form-group">
              <label>
                Lead Owner <span className="required">*</span>
              </label>
              <select
                name="owner"
                value={formData.owner}
                onChange={e => handleChange('owner', e.target.value)}
                onBlur={() => handleBlur('owner')}
                className={errors.owner ? 'input-error' : ''}
              >
                <option value="">Select...</option>
                {users.length > 0 ? (
                  users.map(user => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Debabrata Ghosh">Debabrata Ghosh</option>
                    <option value="Sanjay Mishra">Sanjay Mishra</option>
                    <option value="Hemant Kumar">Hemant Kumar</option>
                  </>
                )}
              </select>
              {errors.owner && <span className="field-error-text">{errors.owner}</span>}
            </div>

            {/* 8. Priority (Right Column) */}
            <div className="form-group">
              <label>
                Priority <span className="required">*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={e => handleChange('priority', e.target.value)}
                onBlur={() => handleBlur('priority')}
                className={errors.priority ? 'input-error' : ''}
              >
                <option value="">Select...</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              {errors.priority && <span className="field-error-text">{errors.priority}</span>}
            </div>

            {/* ROW 5 */}
            {/* 9. Lead Status (Left Column) */}
            <div className="form-group">
              <label>
                Lead Status <span className="required">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={e => handleChange('status', e.target.value)}
                onBlur={() => handleBlur('status')}
                className={errors.status ? 'input-error' : ''}
              >
                <option value="">Select...</option>
                <option value="Open">Open</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Analysis">Analysis</option>
                <option value="Interested">Interested</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
              {errors.status && <span className="field-error-text">{errors.status}</span>}
            </div>

            {/* 10. Estimated Req. Date (Right Column) */}
            <div className="form-group">
              <label>
                Estimated Req. Date
              </label>
              <input
                type="date"
                name="estDate"
                value={formData.estDate}
                onChange={e => handleChange('estDate', e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}