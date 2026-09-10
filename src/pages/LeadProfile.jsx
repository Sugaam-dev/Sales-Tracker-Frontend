import { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { fetchLeadActivities, createActivity, completeActivity } from '../services/leadService';
import { useToast } from '../context/FeedbackContext';

// Country codes with flags (emoji flags work universally)
const COUNTRY_CODES = [
  { code: '+1',   iso: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1',   iso: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+91',  iso: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+44',  iso: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61',  iso: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+49',  iso: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  iso: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+81',  iso: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+86',  iso: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+55',  iso: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+7',   iso: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+27',  iso: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+971', iso: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', iso: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+65',  iso: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60',  iso: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+62',  iso: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+82',  iso: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+39',  iso: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+34',  iso: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+31',  iso: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46',  iso: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+41',  iso: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+47',  iso: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+45',  iso: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', iso: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+48',  iso: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+52',  iso: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+54',  iso: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+20',  iso: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+234', iso: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', iso: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+92',  iso: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', iso: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94',  iso: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', iso: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '+66',  iso: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+84',  iso: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+63',  iso: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+64',  iso: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
];

// eslint-disable-next-line react-refresh/only-export-components
export const LIFECYCLE_PIPELINES = {
  enterprise: {
    name: 'Enterprise Sales',
    stages: ['Prospecting', 'Qualification', 'Initial Discussion', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
  },
  inbound: {
    name: 'Inbound / Self-Serve',
    stages: ['Subscriber', 'Lead', 'Marketing Qualified (MQL)', 'Sales Qualified (SQL)', 'Trial Active', 'Converted']
  },
  partner: {
    name: 'Partner Referral',
    stages: ['Referral Received', 'Partner Review', 'Introduction', 'Joint Evaluation', 'Agreement', 'Closed Won', 'Closed Lost']
  }
};

/**
 * Validates a local phone number respecting country code and leading zero rule.
 */
function validatePhone(number, countryCode) {
  const trimmed = (number || '').trim();
  if (!trimmed) return { valid: false, message: 'Phone number is required.' };
  if (trimmed.startsWith('0')) return { valid: false, message: 'Phone number must not start with 0.' };

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return { valid: false, message: 'Enter a valid phone number.' };
  if (digits.startsWith('0')) return { valid: false, message: 'Phone number must not start with 0.' };

  const country = String(countryCode || '').toUpperCase();
  if (country.includes('IN') || country.includes('+91')) {
    if (digits.length !== 10) return { valid: false, message: 'Invalid phone number for the selected country.' };
  } else if (country.includes('US') || country.includes('+1')) {
    if (digits.length !== 10) return { valid: false, message: 'Invalid phone number for the selected country.' };
  } else if (country.includes('UK') || country.includes('GB') || country.includes('+44')) {
    if (digits.length < 9 || digits.length > 10) return { valid: false, message: 'Invalid phone number for the selected country.' };
  } else if (country.includes('AE') || country.includes('+971')) {
    if (digits.length !== 9) return { valid: false, message: 'Invalid phone number for the selected country.' };
  } else if (country.includes('SG') || country.includes('+65')) {
    if (digits.length !== 8) return { valid: false, message: 'Invalid phone number for the selected country.' };
  } else {
    if (digits.length < 7 || digits.length > 15) return { valid: false, message: 'Enter a valid phone number.' };
  }

  return { valid: true, message: '' };
}

function validateEmail(val) {
  const trimmed = (val || '').trim();
  if (!trimmed) return { valid: false, message: 'Email is required.' };
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return { valid: false, message: 'Enter a valid email address.' };
  return { valid: true, message: '' };
}

function normalizeCountryCode(val, fallback = 'IN|+91') {
  if (!val) return fallback;
  const str = String(val).trim();
  if (str.includes('|')) return str;
  const code = str.startsWith('+') ? str : `+${str}`;
  const found = COUNTRY_CODES.find(c => c.code === code || c.iso.toUpperCase() === str.toUpperCase());
  return found ? `${found.iso}|${found.code}` : fallback;
}

/**
 * Returns maximum allowed phone number digits based on selected country code.
 */
function getMaxPhoneDigits(countryCode) {
  const country = String(countryCode || '').toUpperCase();
  if (country.includes('IN') || country.includes('+91')) return 10;
  if (country.includes('US') || country.includes('+1')) return 10;
  if (country.includes('UK') || country.includes('GB') || country.includes('+44')) return 10;
  if (country.includes('AE') || country.includes('+971')) return 9;
  if (country.includes('SG') || country.includes('+65')) return 8;
  return 15;
}

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
 * Validates requestDetails according to 10-200 words business rules.
 */
function validateRequestDetails(value) {
  const words = countWords(value);
  if (words < 10 || words > 200) {
    return 'Request details must be between 10 and 200 words.';
  }
  return '';
}

/** A phone input combining a country-code dropdown with a number field. */
function PhoneInput({ label, required, value, onChange, countryCode, onCountryCodeChange, error }) {
  const selected = COUNTRY_CODES.find(c => `${c.iso}|${c.code}` === countryCode || c.code === countryCode || c.iso === countryCode) || COUNTRY_CODES.find(c => c.code === '+91') || COUNTRY_CODES[2];
  const maxDigits = getMaxPhoneDigits(countryCode);

  return (
    <div className="form-group">
      <label>
        {label}
        {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>

      {/* Single unified input-like row — full width, same as email */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box',
          border: error ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-surface)',
          overflow: 'hidden',
        }}
      >
        {/* Country prefix pill */}
        <div style={{ position: 'relative', flexShrink: 0, borderRight: '1px solid var(--color-border)' }}>
          {/* Invisible native select for interaction */}
          <select
            value={selected ? `${selected.iso}|${selected.code}` : countryCode}
            onChange={(e) => {
              const newCode = e.target.value;
              onCountryCodeChange(newCode);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              zIndex: 1,
            }}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={`${c.iso}-${c.code}`} value={`${c.iso}|${c.code}`}>
                {c.flag} {c.code} {c.name}
              </option>
            ))}
          </select>

          {/* Visible overlay */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '0 10px',
              height: '36px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              backgroundColor: '#F8FAFC',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{selected?.flag}</span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-main)' }}>{selected?.code}</span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>▾</span>
          </div>
        </div>

        {/* Number input — takes all remaining space */}
        <input
          type="tel"
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            const max = getMaxPhoneDigits(countryCode);
            onChange(digits.slice(0, max));
          }}
          maxLength={maxDigits}
          placeholder="e.g. 98765 43210"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '8px 10px',
            fontSize: '14px',
            backgroundColor: 'transparent',
            width: 0,           /* flex will size it correctly */
            minWidth: 0,
          }}
        />
      </div>

      {error && (
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function LeadProfile({ lead, onSave, onCancel, isEditing, usersList = [], stagesList = [] }) {
  const showToast = useToast();
  const isExistingLead = !!lead;
  const [isEditMode] = useState(isEditing || !isExistingLead);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partners, setPartners] = useState(lead?.partners || []);
  const [status, setStatus] = useState(lead?.status || 'select');
  const [stage, setStage] = useState(lead?.stage || 'select');
  const [pipelineType, setPipelineType] = useState(lead?.pipelineType || 'enterprise');
  const [owner, setOwner] = useState(lead?.owner || 'select');
  
  const getInitialRequestType = (val) => {
    if (!val) return 'select';
    if (typeof val === 'string') return val;
    return val.category || val.type || 'select';
  };

  // Controlled fields state
  const [company, setCompany] = useState(lead?.company || '');
  const [requestDetails, setRequestDetails] = useState(lead?.requestDetails || lead?.basicRequirements || '');
  const [requestDetailsTouched, setRequestDetailsTouched] = useState(false);
  const [basicRequirements, setBasicRequirements] = useState(lead?.basicRequirements || '');
  const [requestType, setRequestType] = useState(getInitialRequestType(lead?.requestType));
  const [industry, setIndustry] = useState(lead?.industry || 'select');
  const [size, setSize] = useState(lead?.size || 'select');
  const [region, setRegion] = useState(lead?.region || 'select');
  const [projectName, setProjectName] = useState(lead?.projectName || '');
  const [contact, setContact] = useState(lead?.contact || '');
  const [designation, setDesignation] = useState(lead?.designation || '');
  const [priority, setPriority] = useState(lead?.priority || 'select');
  const [source, setSource] = useState(lead?.source || 'select');
  const [sentiment, setSentiment] = useState(lead?.sentiment || 'select');
  const [value] = useState(lead?.value || '');
  const [lostReason, setLostReason] = useState(lead?.lostReason || lead?.reason || '');
  const [linkedinProfileUrl, setLinkedinProfileUrl] = useState(lead?.linkedinProfileUrl || lead?.linkedin?.profile || '');
  const [linkedinCompanyPageUrl, setLinkedinCompanyPageUrl] = useState(lead?.linkedinCompanyPageUrl || lead?.linkedin?.company || '');
  const [estimatedRequirementDate, setEstimatedRequirementDate] = useState(lead?.estimatedRequirementDate ? lead.estimatedRequirementDate.substring(0, 10) : '');
  const [lastContactDate, setLastContactDate] = useState(lead?.lastContactDate ? lead.lastContactDate.substring(0, 10) : '');
  const [nextFollowUp, setNextFollowUp] = useState(lead?.nextFollowUp ? lead.nextFollowUp.substring(0, 10) : '');
  const [notes, setNotes] = useState(lead?.notes || '');

  const currentWordCount = countWords(requestDetails);

  // Office phone and Best Time state
  const [officePhone, setOfficePhone] = useState(lead?.officePhone || lead?.phone || '');
  const [officePhoneError, setOfficePhoneError] = useState('');
  const [officePhoneTouched, setOfficePhoneTouched] = useState(false);
  const [officePhoneCountry, setOfficePhoneCountry] = useState(() => 
    normalizeCountryCode(lead?.officePhoneCountry || lead?.countryCode, 'IN|+91')
  );

  const [bestTime, setBestTime] = useState(() => {
    const val = lead?.bestTime || lead?.criteria?.bestTime;
    if (['Morning', 'Afternoon', 'Evening'].includes(val)) return val;
    return val || 'Select One';
  });
  const [bestTimeError, setBestTimeError] = useState('');

  // Dropdown error states
  const [contactError, setContactError] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [requestDetailsError, setRequestDetailsError] = useState('');
  const [requestTypeError, setRequestTypeError] = useState('');
  const [ownerError, setOwnerError] = useState('');
  const [industryError, setIndustryError] = useState('');
  const [sizeError, setSizeError] = useState('');
  const [regionError, setRegionError] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [priorityError, setPriorityError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [stageError, setStageError] = useState('');
  const [sentimentError, setSentimentError] = useState('');

  // ── Phone & Email state ────────────────────────────────────────────
  const [phone, setPhone] = useState(lead?.phone || lead?.officePhone || '');
  const [phoneCountry, setPhoneCountry] = useState(() => 
    normalizeCountryCode(lead?.countryCode || lead?.phoneCountry, 'IN|+91')
  );
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [altPhone, setAltPhone] = useState(lead?.altPhone || '');
  const [altPhoneCountry, setAltPhoneCountry] = useState(() => 
    normalizeCountryCode(lead?.alternatePhoneCountry || lead?.altPhoneCountry, 'IN|+91')
  );
  const [altPhoneError, setAltPhoneError] = useState('');
  const [altPhoneTouched, setAltPhoneTouched] = useState(false);

  const [email, setEmail] = useState(lead?.email || lead?.altContact?.email || '');
  const [emailError, setEmailError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  // ──────────────────────────────────────────────────────────────────

  const [activities, setActivities] = useState(() => {
    const defaultActs = lead?.history ? lead.history.map((h) => ({
      type: h.action.includes('Status') || h.action.includes('Stage') ? 'Status Update' : 'System Log',
      user: h.user,
      time: h.date,
      note: h.action,
      iconClass: 'system',
      iconBg: 'var(--color-text-muted)'
    })) : [
      {
        type: 'Lead Created',
        user: 'System',
        time: 'Just now',
        note: 'Lead initialized via form.',
        iconClass: '',
        iconBg: 'var(--color-text-muted)'
      }
    ];
    return [
      {
        type: 'Email Sent',
        user: lead?.owner || 'Sarah Jenkins',
        time: 'Today, 10:30 AM',
        note: 'Followed up with introductory deck.',
        iconClass: 'email',
        iconBg: 'var(--color-primary)'
      },
      ...defaultActs
    ];
  });

  useEffect(() => {
    if (isExistingLead && lead?.id) {
      fetchLeadActivities(lead.id).then(res => {
        if (res.success && res.data && res.data.length > 0) {
          const fetchedActs = res.data.map(a => ({
            id: a.id,
            type: a.type || 'System Log',
            user: a.user || 'System',
            time: a.dueDate || a.createdAt || 'Recently',
            note: a.desc || a.note || '',
            completed: a.completed,
            iconClass: (a.type || '').toLowerCase().includes('email') ? 'email' : ((a.type || '').toLowerCase().includes('call') ? 'call' : 'system'),
            iconBg: 'var(--color-primary)'
          }));
          setActivities(fetchedActs);
        }
      }).catch(err => console.error('Failed to load activities', err));
    }
  }, [isExistingLead, lead?.id]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handlePhoneChange = (val) => {
    const digits = (val || '').replace(/\D/g, '');
    const max = getMaxPhoneDigits(phoneCountry);
    const sanitized = digits.slice(0, max);
    setPhone(sanitized);
    if (phoneTouched) setPhoneError(validatePhone(sanitized, phoneCountry).message);
  };
  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    setPhoneError(validatePhone(phone, phoneCountry).message);
  };

  const handleAltPhoneChange = (val) => {
    const digits = (val || '').replace(/\D/g, '');
    const max = getMaxPhoneDigits(altPhoneCountry);
    const sanitized = digits.slice(0, max);
    setAltPhone(sanitized);
    if (altPhoneTouched) {
      setAltPhoneError(sanitized ? validatePhone(sanitized, altPhoneCountry).message : '');
    }
  };
  const handleAltPhoneBlur = () => {
    setAltPhoneTouched(true);
    setAltPhoneError(altPhone ? validatePhone(altPhone, altPhoneCountry).message : '');
  };

  const handleOfficePhoneChange = (val) => {
    const digits = (val || '').replace(/\D/g, '');
    const max = getMaxPhoneDigits(officePhoneCountry);
    const sanitized = digits.slice(0, max);
    setOfficePhone(sanitized);
    if (officePhoneTouched) {
      const msg = validatePhone(sanitized, officePhoneCountry).message;
      setOfficePhoneError(msg ? msg.replace('Phone number', 'Office Phone Number') : '');
    }
  };
  const handleOfficePhoneBlur = () => {
    setOfficePhoneTouched(true);
    const msg = validatePhone(officePhone, officePhoneCountry).message;
    setOfficePhoneError(msg ? msg.replace('Phone number', 'Office Phone Number') : '');
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (emailTouched) setEmailError(validateEmail(val).message);
  };
  const handleEmailBlur = () => {
    setEmailTouched(true);
    setEmailError(validateEmail(email).message);
  };

  const handleRequestDetailsChange = (e) => {
    const val = e.target.value;
    setRequestDetails(val);
    if (requestDetailsTouched || requestDetailsError) {
      setRequestDetailsError(validateRequestDetails(val));
    }
  };
  const handleRequestDetailsBlur = () => {
    setRequestDetailsTouched(true);
    setRequestDetailsError(validateRequestDetails(requestDetails));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0].name);
    }
  };

  const handleLogActivity = async (e) => {
    e.preventDefault();
    const type = e.target.elements.type.value;
    const note = e.target.elements.note.value;

    let apiType = 'Other';
    if (type.toLowerCase().includes('call')) apiType = 'Call';
    else if (type.toLowerCase().includes('email')) apiType = 'Email';
    else if (type.toLowerCase().includes('meeting') || type.toLowerCase().includes('demo')) apiType = 'Demo';

    try {
      const response = await createActivity(lead.id, {
        type: apiType,
        desc: note,
        outcome: '',
        dueDate: ''
      });
      if (response.success && response.data) {
        const res = await fetchLeadActivities(lead.id);
        if (res.success && res.data) {
          const fetchedActs = res.data.map(a => ({
            id: a.id,
            type: a.type || 'System Log',
            user: 'You',
            time: a.dueDate || a.createdAt || 'Recently',
            note: a.desc || a.note || '',
            completed: a.completed,
            iconClass: (a.type || '').toLowerCase().includes('email') ? 'email' : ((a.type || '').toLowerCase().includes('call') ? 'call' : 'system'),
            iconBg: 'var(--color-primary)'
          }));
          setActivities(fetchedActs);
          showToast('Activity logged successfully', 'success');
        }
      }
    } catch (err) {
      console.error('Failed to log activity:', err);
      showToast(err.message || 'Failed to log activity.', 'error');
    } finally {
      setIsActivityModalOpen(false);
    }
  };

  const handleAddPartner = (e) => {
    e.preventDefault();
    const partnerName = e.target.elements.partnerName.value;
    if (partnerName && !partners.includes(partnerName)) {
      setPartners([...partners, partnerName]);
    }
    setIsPartnerModalOpen(false);
  };

  const handleRemovePartner = (partnerToRemove) => {
    setPartners(partners.filter(p => p !== partnerToRemove));
  };

  const mapStatusToStage = (statusVal) => {
    if (stagesList && stagesList.length > 0) {
      const matched = stagesList.find(s => s.status === statusVal);
      if (matched) return matched.name;
    }
    switch(statusVal) {
      case 'Open': return 'Prospecting';
      case 'New': return 'Qualification';
      case 'Contacted': return 'Initial Discussion';
      case 'Analysis': return 'Needs Analysis';
      case 'Interested': return 'Proposal';
      case 'Negotiation': return 'Negotiation';
      case 'Won': return 'Closed Won';
      case 'Lost': return 'Closed Lost';
      default: return 'Prospecting';
    }
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    const mappedStage = mapStatusToStage(newStatus);
    setStage(mappedStage);
  };

  const validateOfficePhone = (val) => {
    if (!val || val.trim() === '') {
      setOfficePhoneError('');
      return true;
    }
    const pv = validatePhone(val, officePhoneCountry);
    const msg = pv.message ? pv.message.replace('Phone number', 'Office Phone Number') : '';
    setOfficePhoneError(msg);
    return pv.valid;
  };

  /** Validate phones and email before saving */
  const handleSave = () => {
    const pv = validatePhone(phone, phoneCountry);
    const av = altPhone ? validatePhone(altPhone, altPhoneCountry) : { valid: true, message: '' };
    const ev = validateEmail(email);

    setPhoneTouched(true);
    setPhoneError(pv.message);
    setAltPhoneTouched(true);
    setAltPhoneError(av.message);
    setEmailTouched(true);
    setEmailError(ev.message);

    setOfficePhoneTouched(true);
    const isOfficePhoneValid = validateOfficePhone(officePhone);

    let hasContactError = false;
    if (!contact || !contact.trim()) {
      setContactError('KAM Name is required');
      hasContactError = true;
    } else {
      setContactError('');
    }

    let hasCompanyError = false;
    if (!company || !company.trim()) {
      setCompanyError('Company Name is required');
      hasCompanyError = true;
    } else {
      setCompanyError('');
    }

    let hasRequestDetailsError = false;
    setRequestDetailsTouched(true);
    const reqDetailsMsg = validateRequestDetails(requestDetails);
    if (reqDetailsMsg) {
      setRequestDetailsError(reqDetailsMsg);
      hasRequestDetailsError = true;
    } else {
      setRequestDetailsError('');
    }

    let hasRequestTypeError = false;
    if (!requestType || requestType === 'select') {
      setRequestTypeError('Request Type is required');
      hasRequestTypeError = true;
    } else {
      setRequestTypeError('');
    }

    let hasSelectErrors = false;
    if (owner === 'select') { setOwnerError('Lead Owner is required'); hasSelectErrors = true; } else { setOwnerError(''); }
    if (priority === 'select') { setPriorityError('Priority is required'); hasSelectErrors = true; } else { setPriorityError(''); }
    if (status === 'select') { setStatusError('Status is required'); hasSelectErrors = true; } else { setStatusError(''); }
    
    // Non-mandatory fields simply clear their errors
    setIndustryError('');
    setSizeError('');
    setRegionError('');
    setSourceError('');
    setStageError('');
    setSentimentError('');
    
    // Best Time to Connect is optional
    setBestTimeError('');

    if (!pv.valid || !av.valid || !ev.valid || !isOfficePhoneValid || hasSelectErrors || hasContactError || hasCompanyError || hasRequestDetailsError || hasRequestTypeError) {
      return;
    }

    const officeCountryObj = COUNTRY_CODES.find(c => `${c.iso}|${c.code}` === officePhoneCountry || c.code === officePhoneCountry || c.iso === officePhoneCountry);
    const phoneCountryObj = COUNTRY_CODES.find(c => `${c.iso}|${c.code}` === phoneCountry || c.code === phoneCountry || c.iso === phoneCountry);
    const altCountryObj = COUNTRY_CODES.find(c => `${c.iso}|${c.code}` === altPhoneCountry || c.code === altPhoneCountry || c.iso === altPhoneCountry);

    onSave({
      company,
      projectName,
      designation,
      industry,
      size,
      region,
      requestDetails,
      requestType,
      contact,
      status,
      stage,
      priority,
      source,
      sentiment,
      value: String(value).replace(/[^0-9.-]/g, ''),
      lostReason: status === 'Lost' ? lostReason : '',
      phone,
      altPhone,
      email,
      partners,
      owner,
      officePhone,
      officePhoneCountry: officeCountryObj?.code || officePhoneCountry,
      countryCode: phoneCountryObj?.code || officeCountryObj?.code || '+91',
      alternatePhoneCountry: altCountryObj?.code || altPhoneCountry,
      bestTime,
      linkedinProfileUrl,
      linkedinCompanyPageUrl,
      estimatedRequirementDate,
      lastContactDate,
      nextFollowUp,
      basicRequirements: basicRequirements || requestDetails,
      notes,
      criteria: {
        ...lead?.criteria,
        bestTime
      }
    });
  };
  // ──────────────────────────────────────────────────────────────────

  return (
    <div className="lead-profile-view">
      <div className="profile-header">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
          {isExistingLead ? `Lead Profile: ${String(lead.id).startsWith('L-') ? lead.id : `L-${String(lead.id).padStart(4, '0')}`}` : 'Create New Lead'}
        </h2>
        <div className="profile-actions">
          {isEditMode && (
            <>
              <button className="btn-secondary" onClick={onCancel}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save Changes</button>
            </>
          )}
          {!isEditMode && (
            <button className="btn-secondary" onClick={onCancel}>Close</button>
          )}
        </div>
      </div>

      <fieldset disabled={!isEditMode} className="profile-grid" style={{ border: 'none', padding: 0, margin: 0 }}>
        <div className="profile-main-col">
          {/* ── Company Info ── */}
          <div className="profile-section">
            <h3>Company Info</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Company Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input type="text" value={company} onChange={(e) => { setCompany(e.target.value); setCompanyError(''); }} placeholder="e.g. Acme Corp" required />
                {companyError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{companyError}</p>}
              </div>
              <div className="form-group">
                <label>Project Name</label>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Horizon Retail Omnichannel Commerce Transform" />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>
                    Request Details <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <span 
                    className="word-counter"
                    style={{ 
                      fontSize: '11px',
                      fontWeight: '500',
                      color: (currentWordCount < 10 || currentWordCount > 200) ? 'var(--color-text-muted)' : '#10b981'
                    }}
                  >
                    {currentWordCount} / 200 words {currentWordCount < 10 && <span>(at least 10 words required)</span>}
                  </span>
                </div>
                <textarea
                  value={requestDetails}
                  onChange={handleRequestDetailsChange}
                  onBlur={handleRequestDetailsBlur}
                  placeholder="Provide between 10 to 200 words describing the client request..."
                  style={{ 
                    minHeight: '80px', 
                    resize: 'vertical',
                    borderColor: requestDetailsError ? 'var(--color-danger)' : undefined
                  }}
                  required
                />
                {requestDetailsError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{requestDetailsError}</p>}
              </div>
              <div className="form-group">
                <label>Request Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select value={requestType} onChange={(e) => { setRequestType(e.target.value); setRequestTypeError(''); }} required>
                  <option value="select">Select Request Type</option>
                  <option value="IT Product">IT Product</option>
                  <option value="IT Service">IT Service</option>
                  {requestType && requestType !== 'IT Product' && requestType !== 'IT Service' && requestType !== 'select' && (
                    <option value={requestType}>{requestType}</option>
                  )}
                </select>
                {requestTypeError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{requestTypeError}</p>}
              </div>
              <div onBlur={handleOfficePhoneBlur}>
                <PhoneInput
                  label="Office Phone Number"
                  required
                  value={officePhone}
                  onChange={handleOfficePhoneChange}
                  countryCode={officePhoneCountry}
                  onCountryCodeChange={(val) => {
                    setOfficePhoneCountry(val);
                    const max = getMaxPhoneDigits(val);
                    const truncated = (officePhone || '').replace(/\D/g, '').slice(0, max);
                    setOfficePhone(truncated);
                    if (officePhoneTouched || officePhone) {
                      const msg = validatePhone(truncated, val).message;
                      setOfficePhoneError(msg ? msg.replace('Phone number', 'Office Phone Number') : '');
                    }
                  }}
                  error={officePhoneError}
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <select value={industry} onChange={(e) => { setIndustry(e.target.value); setIndustryError(''); }}>
                  <option value="select">Select Industry</option>
                  <option>Retail</option> 
                  <option>Defence</option> 
                  <option>Consulting</option> 
                  <option>E-commerce</option> 
                  <option>Banking</option> 
                  <option>Technology</option>
                  <option>Logistics</option>
                  <option>Healthcare</option>
                  <option>Finance</option>
                  <option>IT Services</option>  
                  <option>Education</option> 
                  <option>Manufacturing</option> 
                  <option>Real Estate</option>  
                </select>
                {industryError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{industryError}</p>}
              </div>
              <div className="form-group">
                <label>Company Size</label>
                <select value={size} onChange={(e) => { setSize(e.target.value); setSizeError(''); }}>
                  <option value="select">Select Company Size</option>
                  <option>1-10 Employees</option>
                  <option>10-50 Employees</option>
                  <option>50-200 Employees</option>
                  <option>200+ Employees</option>
                </select>
                {sizeError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{sizeError}</p>}
              </div>
              <div className="form-group">
                <label>Region</label>
                <select value={region} onChange={(e) => { setRegion(e.target.value); setRegionError(''); }}>
                  <option value="select">Select Region</option>
                  <option>North America</option>
                  <option>Europe</option>
                  <option>Asia Pacific</option>
                  <option>LATAM</option>
                  <option>India</option> 
                </select>
                {regionError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{regionError}</p>}
              </div>
            </div>
          </div>

          {/* ── KAM Details ── */}
          <div className="profile-section">
            <h3>Key Account Manager (KAM) Details</h3> 
            <div className="form-grid">
              <div className="form-group">
                <label>KAM Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input type="text" value={contact} onChange={(e) => { setContact(e.target.value); setContactError(''); }} placeholder="John Doe" required />
                {contactError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{contactError}</p>}
              </div>
              <div className="form-group">
                <label>Designation </label> 
                <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="VP of Sales" />
              </div>
              <div className="form-group">
                <label>Email <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input 
                  type="text" 
                  value={email} 
                  onChange={handleEmailChange} 
                  onBlur={handleEmailBlur} 
                  placeholder="john@gmail.com" 
                  style={{
                    border: emailError ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                  }}
                />
                {emailError && (
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>
                    {emailError}
                  </p>
                )}
              </div>

              {/* ── Phone with country code & validation ── */}
              <div onBlur={handlePhoneBlur}>
                <PhoneInput
                  label="Phone"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  countryCode={phoneCountry}
                  onCountryCodeChange={(val) => {
                    setPhoneCountry(val);
                    const max = getMaxPhoneDigits(val);
                    const truncated = (phone || '').replace(/\D/g, '').slice(0, max);
                    setPhone(truncated);
                    if (phoneTouched || phone) {
                      setPhoneError(validatePhone(truncated, val).message);
                    }
                  }}
                  error={phoneError}
                />
              </div>

              <div className="form-group">
                <label>Best Time to Connect</label>
                <select value={bestTime} onChange={(e) => { setBestTime(e.target.value); setBestTimeError(''); }}>
                  <option value="Select One">Select One</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
                {bestTimeError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{bestTimeError}</p>}
              </div>

              {/* ── Alternate Phone with country code & validation ── */}
              <div onBlur={handleAltPhoneBlur}>
                <PhoneInput
                  label="Alternate Phone"
                  value={altPhone}
                  onChange={handleAltPhoneChange}
                  countryCode={altPhoneCountry}
                  onCountryCodeChange={(val) => {
                    setAltPhoneCountry(val);
                    const max = getMaxPhoneDigits(val);
                    const truncated = (altPhone || '').replace(/\D/g, '').slice(0, max);
                    setAltPhone(truncated);
                    if (altPhoneTouched || altPhone) {
                      setAltPhoneError(truncated ? validatePhone(truncated, val).message : '');
                    }
                  }}
                  error={altPhoneError}
                />
              </div>

              <div className="form-group">
                <label>LinkedIn Profile URL</label>
                <input type="text" value={linkedinProfileUrl} onChange={(e) => setLinkedinProfileUrl(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>LinkedIn Company Page URL</label>
                <input type="text" value={linkedinCompanyPageUrl} onChange={(e) => setLinkedinCompanyPageUrl(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Commercial Section ── */}
          {/* <div className="profile-section">
            <h3>Commercial Section</h3>
            <div className="form-grid three-col">
              <div className="form-group">
                <label>Deal Value / Est. Closing Value</label>
                <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. $150,000" />
              </div>
              <div className="form-group">
                <label>Closing Value</label>
                <input type="number" defaultValue="150000" />
              </div>
              <div className="form-group">
                <label>Tax Status</label>
                <select defaultValue="Without Tax">
                  <option>With Tax</option>
                  <option>Without Tax</option>
                </select>
              </div>
              <div className="form-group">
                <label>Commission %</label>
                <input type="number" defaultValue="5" />
              </div>
              <div className="form-group">
                <label>Commission Amount</label>
                <input type="number" defaultValue="7500" />
              </div>
              <div className="form-group">
                <label>GST Tracking No.</label>
                <input type="text" />
              </div>
            </div>
          </div> */}

          {/* ── Timeline & Attachments ── */}
          <div className="profile-section">
            <h3>Timeline &amp; Attachments</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Est. Requirement Date</label>
                <input type="date" value={estimatedRequirementDate} onChange={(e) => setEstimatedRequirementDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Contact Date</label>
                <input type="date" value={lastContactDate} onChange={(e) => setLastContactDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Next Follow-Up</label>
                <input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Created Date</label>
                <input type="date" value={lead?.createdAt ? lead.createdAt.substring(0, 10) : ''} disabled style={{ backgroundColor: '#F1F5F9', color: 'var(--color-text-muted)', cursor: 'not-allowed' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Basic Requirements</label>
              <textarea placeholder="List any additional basic requirements..." value={basicRequirements} onChange={(e) => setBasicRequirements(e.target.value)} style={{ minHeight: '60px' }}></textarea>
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Notes</label>
              <textarea placeholder="Enter notes here..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: '60px' }}></textarea>
            </div>

            <div
              className="drag-drop-zone"
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer', border: selectedFile ? '2px solid var(--color-primary)' : undefined }}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
              <Upload size={24} color="var(--color-text-muted)" />
              {selectedFile ? (
                <p style={{ color: 'var(--color-primary)', fontWeight: '500' }}>Selected: {selectedFile}</p>
              ) : (
                <p>Drag &amp; Drop Requirement Documents, Quotations, or Contracts<br /><span style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'underline' }}>Choose Files</span></p>
              )}
            </div>
          </div>
        </div>

        {/* ── Side Column ── */}
        <div className="profile-side-col">
          <div className="profile-section">
            <h3>Classification</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Lead Owner <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select value={owner} onChange={(e) => { setOwner(e.target.value); setOwnerError(''); }}>
                <option value="select">Select Owner</option>
                {usersList && usersList.length > 0 ? (
                  usersList.map(user => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                  ))
                ) : (
                  <>
                    <option value="D. Ghosh">D. Ghosh</option>
                    <option value="S. Mishra">S. Mishra</option>
                    <option value="H. Kumar">H. Kumar</option>
                    <option value="P. Sharma">P. Sharma</option>
                    <option value="R. Nair">R. Nair</option>
                  </>
                )}
              </select>
              {ownerError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{ownerError}</p>}
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Lifecycle Template</label>
              <select 
                value={pipelineType} 
                onChange={(e) => {
                  const newType = e.target.value;
                  setPipelineType(newType);
                  setStage(LIFECYCLE_PIPELINES[newType].stages[0]);
                }}
              >
                <option value="enterprise">Enterprise Sales</option>
                <option value="inbound">Inbound / Self-Serve</option>
                <option value="partner">Partner Referral</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Status <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select value={status} onChange={(e) => { handleStatusChange(e); setStatusError(''); }}>
                <option value="select">Select Status</option>
                <option>Open</option>
                <option>New</option>
                <option>Contacted</option>
                <option>Analysis</option>
                <option>Interested</option>
                <option>Negotiation</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
              {statusError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{statusError}</p>}
            </div>
            {status === 'Lost' && (
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Lost Reason <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input 
                  type="text" 
                  value={lostReason} 
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="e.g. Budget Constraints"
                  required 
                />
              </div>
            )}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Stage</label>
              <select value={stage} disabled style={{ backgroundColor: '#F1F5F9', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}>
                <option value="select">Select Stage</option>
                {stagesList && stagesList.length > 0 ? (
                  stagesList.map(stg => (
                    <option key={stg.id} value={stg.name}>{stg.name}</option>
                  ))
                ) : (
                  pipelineType && LIFECYCLE_PIPELINES[pipelineType] && LIFECYCLE_PIPELINES[pipelineType].stages.map(stg => (
                    <option key={stg} value={stg}>{stg}</option>
                  ))
                )}
              </select>
              {stageError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{stageError}</p>}
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Priority <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select value={priority} onChange={(e) => { setPriority(e.target.value); setPriorityError(''); }}>
                <option value="select">Select Priority</option>
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
              {priorityError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{priorityError}</p>}
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Lead Source</label>
              <select value={source} onChange={(e) => { setSource(e.target.value); setSourceError(''); }}>
                <option value="select">Select Lead Source</option>
                <option>Website</option>
                <option>Referral</option>
                <option>Cold Call</option>
                <option>LinkedIn</option>
              </select>
              {sourceError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{sourceError}</p>}
            </div>
            <div className="form-group">
              <label>Sentiment</label>
              <select value={sentiment} onChange={(e) => { setSentiment(e.target.value); setSentimentError(''); }}>
                <option value="select">Select Sentiment</option>
                <option>Positive</option>
                <option>Neutral</option>
                <option>Negative</option>
                <option>Interested</option>
                <option>Not Interested</option>
              </select>
              {sentimentError && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-danger)' }}>{sentimentError}</p>}
            </div>
          </div>

          {/* ── Lead Lifecycle Stepper ── */}
          <div className="profile-section">
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              Lead Lifecycle
              <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-primary)', backgroundColor: 'var(--color-info-bg)', padding: '2px 8px', borderRadius: '12px' }}>
                {LIFECYCLE_PIPELINES[pipelineType]?.name}
              </span>
            </h3>

            <div className="lifecycle-stepper" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '8px' }}>
              {/* Vertical connecting line */}
              <div style={{
                position: 'absolute',
                left: '19px',
                top: '12px',
                bottom: '12px',
                width: '2px',
                backgroundColor: 'var(--color-border)',
                zIndex: 0
              }}></div>

              {(stagesList && stagesList.length > 0 ? [...stagesList].sort((a, b) => a.sortOrder - b.sortOrder) : LIFECYCLE_PIPELINES.enterprise.stages.map((s, idx) => ({ id: idx, name: s }))).map((stageItem, index) => {
                const stgName = typeof stageItem === 'string' ? stageItem : stageItem.name;
                const pipelineStages = stagesList && stagesList.length > 0 ? [...stagesList].sort((a, b) => a.sortOrder - b.sortOrder).map(s => s.name) : LIFECYCLE_PIPELINES.enterprise.stages;
                const currentStageIndex = pipelineStages.indexOf(stage);
                const isCompleted = index < currentStageIndex;
                const isActive = index === currentStageIndex;
                
                let dotStyle = {
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  zIndex: 1,
                  cursor: isEditMode ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                };

                if (isCompleted) {
                  dotStyle.backgroundColor = stgName === 'Closed Lost' ? 'var(--color-danger)' : 'var(--color-success)';
                  dotStyle.color = '#fff';
                  dotStyle.border = 'none';
                } else if (isActive) {
                  if (stgName === 'Closed Lost') {
                    dotStyle.backgroundColor = 'var(--color-danger)';
                    dotStyle.color = '#fff';
                    dotStyle.border = 'none';
                    dotStyle.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.2)';
                  } else {
                    dotStyle.backgroundColor = 'var(--color-primary)';
                    dotStyle.color = '#fff';
                    dotStyle.border = 'none';
                    dotStyle.boxShadow = '0 0 0 4px rgba(29, 78, 216, 0.2)';
                  }
                } else {
                  dotStyle.backgroundColor = '#fff';
                  dotStyle.color = 'var(--color-text-muted)';
                  dotStyle.border = '2px solid var(--color-border)';
                }

                const handleStepperClick = () => {
                  if (isEditMode) {
                    setStage(stgName);
                    const matchedStatus = (stagesList && stagesList.length > 0)
                      ? stagesList.find(s => s.name === stgName)?.status
                      : null;
                    if (matchedStatus) {
                      setStatus(matchedStatus);
                    } else {
                      const fallbackBackMap = {
                        'Prospecting': 'Open',
                        'Qualification': 'New',
                        'Initial Discussion': 'Contacted',
                        'Needs Analysis': 'Analysis',
                        'Proposal': 'Interested',
                        'Negotiation': 'Negotiation',
                        'Closed Won': 'Won',
                        'Closed Lost': 'Lost'
                      };
                      setStatus(fallbackBackMap[stgName] || 'New');
                    }
                  }
                };

                return (
                  <div key={stgName} style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                    <div 
                      style={dotStyle}
                      onClick={handleStepperClick}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: isActive ? '600' : '500',
                        color: isActive ? (stgName === 'Closed Lost' ? 'var(--color-danger)' : 'var(--color-primary)') : (isCompleted ? (stgName === 'Closed Lost' ? 'var(--color-danger)' : 'var(--color-text-main)') : 'var(--color-text-muted)'),
                        cursor: isEditMode ? 'pointer' : 'default'
                      }}
                      onClick={handleStepperClick}
                      >
                        {stgName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="profile-section">
            <h3>Associated Partners</h3>
            {partners.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {partners.map(p => (
                  <span key={p} style={{ padding: '4px 12px', backgroundColor: 'var(--color-border)', borderRadius: '16px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {p}
                    <button type="button" onClick={() => handleRemovePartner(p)} style={{ background: 'none', border: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={12} /></button>
                  </span>
                ))}
                <button type="button" onClick={() => isEditMode && setIsPartnerModalOpen(true)} style={{ padding: '4px 12px', border: '1px dashed var(--color-text-muted)', borderRadius: '16px', fontSize: '13px', backgroundColor: 'transparent', cursor: isEditMode ? 'pointer' : 'default', color: 'var(--color-text-main)', opacity: isEditMode ? 1 : 0.5 }}>+ Add Partner</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>No partners linked yet.</p>
                <button type="button" className="btn-secondary" onClick={() => isEditMode && setIsPartnerModalOpen(true)} style={{ padding: '4px 12px', fontSize: '12px', opacity: isEditMode ? 1 : 0.5 }}>Link a Partner</button>
              </div>
            )}
          </div>

          <div className="profile-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h3 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Activity Timeline</h3>
              <button type="button" className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px', opacity: isEditMode ? 1 : 0.5 }} onClick={() => isEditMode && setIsActivityModalOpen(true)}>Log Activity</button>
            </div>

            <div className="timeline-items">
              {activities.map((act, i) => (
                <div key={i} className="timeline-item" style={{ opacity: act.completed ? 0.6 : 1 }}>
                  <div className={`timeline-icon ${act.iconClass}`} style={{ width: '12px', height: '12px', minWidth: '12px', minHeight: '12px', border: 'none', background: act.completed ? 'var(--color-success)' : act.iconBg }}></div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontWeight: '500', textDecoration: act.completed ? 'line-through' : 'none' }}>{act.type} <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>by {act.user}</span></p>
                      {act.id && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: act.completed ? 'default' : 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={!!act.completed} 
                            disabled={!!act.completed}
                            onChange={async () => {
                              if (!act.completed) {
                                try {
                                  await completeActivity(act.id, true);
                                  const res = await fetchLeadActivities(lead.id);
                                  if (res.success && res.data) {
                                    const fetchedActs = res.data.map(a => ({
                                      id: a.id,
                                      type: a.type || 'System Log',
                                      user: 'You',
                                      time: a.dueDate || a.createdAt || 'Recently',
                                      note: a.desc || a.note || '',
                                      completed: a.completed,
                                      iconClass: (a.type || '').toLowerCase().includes('email') ? 'email' : ((a.type || '').toLowerCase().includes('call') ? 'call' : 'system'),
                                      iconBg: 'var(--color-primary)'
                                    }));
                                    setActivities(fetchedActs);
                                    showToast('Activity marked as completed', 'success');
                                  }
                                } catch (err) {
                                  console.error('Failed to complete activity:', err);
                                  showToast(err.message || 'Failed to complete activity.', 'error');
                                }
                              }
                            }}
                          />
                          <span>{act.completed ? 'Done' : 'Complete'}</span>
                        </label>
                      )}
                    </div>
                    <span className="timeline-date">{act.time}</span>
                    <div style={{ background: '#F1F5F9', padding: '8px 12px', borderRadius: '4px', marginTop: '8px', fontSize: '12px' }}>
                      {act.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Log Activity Modal ── */}
      {isActivityModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Log Activity</h3>
              <button onClick={() => setIsActivityModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleLogActivity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Activity Type</label>
                <select name="type" required>
                  <option>Call Made</option>
                  <option>Email Sent</option>
                  <option>Meeting Held</option>
                  <option>Note Added</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes / Description</label>
                <textarea name="note" placeholder="What happened?" required style={{ minHeight: '100px' }}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsActivityModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Partner Modal ── */}
      {isPartnerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Add Associated Partner</h3>
              <button onClick={() => setIsPartnerModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPartner} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Partner Name</label>
                <input name="partnerName" type="text" placeholder="e.g. Consulting Corp" required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsPartnerModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}