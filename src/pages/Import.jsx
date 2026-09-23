import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  UploadCloud, 
  Upload,
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck,
  Zap,
  Layers,
  Info,
  X 
} from 'lucide-react';
import './Import.css';
import { bulkCreateLeads, extractDocumentLeads, fetchCurrentUsers, fetchMasterStages } from '../services/leadService';
import { useToast } from '../context/FeedbackContext';
import { COUNTRY_CODES, getCountryObj, normalizeCountryCode } from '../constants/countries';
import { validatePhoneNumber } from '../utils/phoneValidation';

// Decorative Top-Right Illustration
function CsvHeaderIllustration() {
  return (
    <svg width="88" height="64" viewBox="0 0 88 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="csv-header-illustration">
      {/* Decorative leafy accents */}
      <path d="M74 44C79 37 84 42 84 42C84 42 82 50 76 49C74 48 73 46 74 44Z" fill="#86EFAC" opacity="0.85"/>
      <path d="M78 39C82 32 86 37 86 37C86 37 84 45 79 43Z" fill="#34D399" opacity="0.9"/>
      <path d="M68 48C72 42 77 46 77 46C77 46 75 53 70 51Z" fill="#A7F3D0" opacity="0.75"/>
      
      {/* Small floating dots */}
      <circle cx="10" cy="20" r="2.5" fill="#93C5FD" opacity="0.6"/>
      <circle cx="82" cy="16" r="2" fill="#93C5FD" opacity="0.7"/>
      <circle cx="76" cy="8" r="2.5" fill="#BFDBFE" opacity="0.5"/>

      {/* Document Sheet */}
      <g filter="drop-shadow(0 3px 8px rgba(37,99,235,0.08))">
        <path d="M26 6C26 4.34315 27.3431 3 29 3H54L66 15V56C66 57.6569 64.6569 59 63 59H29C27.3431 59 26 57.6569 26 56V6Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2"/>
        <path d="M54 3V12C54 13.6569 55.3431 15 57 15H66" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.2"/>
        {/* Document lines */}
        <rect x="33" y="24" width="26" height="2" rx="1" fill="#E2E8F0"/>
        <rect x="33" y="29" width="20" height="2" rx="1" fill="#E2E8F0"/>
        <rect x="33" y="34" width="24" height="2" rx="1" fill="#E2E8F0"/>
        
        {/* CSV Blue Badge */}
        <rect x="30" y="19" width="26" height="14" rx="3.5" fill="#0284C7"/>
        <text x="43" y="29.5" fill="#FFFFFF" fontSize="8" fontWeight="800" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.4">CSV</text>
      </g>

      {/* Blue Upload Cloud */}
      <g filter="drop-shadow(0 4px 8px rgba(37,99,235,0.22))">
        <path d="M70 42C70 38.134 66.866 35 63 35C62.3514 35 61.7249 35.0883 61.131 35.2535C59.7171 32.024 56.489 29.75 52.7188 29.75C48.2916 29.75 44.6353 32.928 43.8336 37.1061C43.2486 36.8736 42.6063 36.75 41.9323 36.75C38.5915 36.75 35.8831 39.4922 35.8831 42.875C35.8831 46.2578 38.5915 49 41.9323 49H68.25C70.183 49 71.75 47.433 71.75 45.5C71.75 43.8926 70.6631 42.5392 69.1947 42.1102C69.7112 42.0385 70 42 70 42Z" fill="#3B82F6"/>
        {/* Arrow inside cloud */}
        <path d="M53.5 44.5V37.5M53.5 37.5L50 41M53.5 37.5L57 41" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

// Dropzone Cloud Icon matching reference
function DropzoneCloudIcon() {
  return (
    <svg width="68" height="52" viewBox="0 0 68 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropzone-cloud-svg">
      <path 
        d="M51.5 35.5C54.5376 35.5 57 33.0376 57 30C57 26.9624 54.5376 24.5 51.5 24.5C51.2721 24.5 51.0478 24.5139 50.8277 24.5411C49.8055 18.0694 44.2275 13 37.4583 13C31.7808 13 26.9392 16.4293 24.9835 21.3639C23.9205 20.8358 22.7153 20.5455 21.4375 20.5455C17.2241 20.5455 13.8125 23.9571 13.8125 28.1705C13.8125 32.3838 17.2241 35.7955 21.4375 35.7955H51.5Z" 
        fill="#3B82F6"
      />
      <path 
        d="M35.5 31V21M35.5 21L31 25.5M35.5 21L40 25.5" 
        stroke="#FFFFFF" 
        strokeWidth="2.75" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CSV_REQUIREMENTS = [
  { name: 'Company Name', example: 'e.g. ABC Corp' },
  { name: 'Contact Person', example: 'e.g. John Doe' },
  { name: 'Email Address', example: 'e.g. john@abc.com' },
  { name: 'Phone', example: 'e.g. +91 9876543210' },
  { name: 'Office Phone Number', example: 'e.g. +91 22 12345678' },
  { name: 'Lead Owner', example: 'e.g. Sales Team' },
  { name: 'Stage', example: 'e.g. New Lead' },
  { name: 'Status', example: 'e.g. Open' },
  { name: 'Sentiment', example: 'e.g. Positive' },
  { name: 'Priority', example: 'e.g. High' }
];

const IMPORT_FEATURES = [
  {
    icon: ShieldCheck,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    title: 'Secure',
    desc: 'Your data is safe with us.'
  },
  {
    icon: Zap,
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    title: 'Fast Import',
    desc: 'Import leads in seconds.'
  },
  {
    icon: FileText,
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    title: 'Supports CSV',
    desc: 'Works with standard CSV files.'
  },
  {
    icon: CheckCircle2,
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
    title: 'Easy Mapping',
    desc: 'Match your data with our fields.'
  }
];

export default function Import() {
  const showToast = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [masterStages, setMasterStages] = useState([]);
  
  // Workflow Step: 'upload' | 'preview'
  const [step, setStep] = useState('upload');
  const [extractedLeads, setExtractedLeads] = useState([]);

  // Result Modal States
  const [showResultModal, setShowResultModal] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [failedRows, setFailedRows] = useState([]);
  const [importError, setImportError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCurrentUsers().then(res => {
      if (res.success && res.data) {
        setUsersList(res.data);
      }
    }).catch(err => console.error('Failed to load active users:', err));

    fetchMasterStages().then(res => {
      if (res.success && res.data) {
        setMasterStages(res.data);
      }
    }).catch(err => console.error('Failed to load master stages:', err));
  }, []);

  const mandatoryColumns = [
    'Company Name',
    'Contact Person',
    'Email Address',
    'Phone & Country',
    'Lead Owner',
    'Stage & Status',
    'Priority & Sentiment',
    'Request Type (IT Product/Service)',
    'Request Details'
  ];

  // Canonical CSV Header Mapping
  const headerMap = {
    'company_name': 'company',
    'Company Name': 'company',
    'company': 'company',
    'organization': 'company',
    'project_name': 'projectName',
    'Project Name': 'projectName',
    'contact_person': 'contact',
    'Contact Person': 'contact',
    'contact_name': 'contact',
    'Contact Name': 'contact',
    'name': 'contact',
    'Full Name': 'contact',
    'email_address': 'email',
    'Email Address': 'email',
    'email': 'email',
    'phone': 'phone',
    'phone_number': 'phone',
    'Phone Number': 'phone',
    'mobile': 'phone',
    'contact_number': 'phone',
    'country_code': 'countryCode',
    'Country Code': 'countryCode',
    'country': 'countryCode',
    'Country': 'countryCode',
    'office_phone_number': 'officePhone',
    'office_phone': 'officePhone',
    'Office Phone Number': 'officePhone',
    'office_phone_country': 'officePhoneCountry',
    'Office Phone Country': 'officePhoneCountry',
    'lead_owner': 'owner',
    'Lead Owner': 'owner',
    'owner': 'owner',
    'assigned_to': 'owner',
    'industry': 'industry',
    'Industry': 'industry',
    'company_size': 'size',
    'Company Size': 'size',
    'size': 'size',
    'region': 'region',
    'Region': 'region',
    'lead_source': 'source',
    'Lead Source': 'source',
    'source': 'source',
    'stage': 'stage',
    'Stage': 'stage',
    'status': 'status',
    'Status': 'status',
    'sentiment': 'sentiment',
    'Sentiment': 'sentiment',
    'priority': 'priority',
    'Priority': 'priority',
    'deal_value': 'value',
    'value': 'value',
    'Deal Value': 'value',
    'lost_reason': 'lostReason',
    'lostReason': 'lostReason',
    'Lost Reason': 'lostReason',
    'lifecycle_template': 'lifecycleTemplate',
    'lifecycleTemplate': 'lifecycleTemplate',
    'kam_name': 'kamName',
    'kamName': 'kamName',
    'KAM Name': 'kamName',
    'designation': 'designation',
    'Designation': 'designation',
    'best_time_to_connect': 'bestTimeToConnect',
    'bestTimeToConnect': 'bestTimeToConnect',
    'Best Time to Connect': 'bestTimeToConnect',
    'alternate_phone': 'alternatePhone',
    'alternatePhone': 'alternatePhone',
    'Alternate Phone': 'alternatePhone',
    'alternate_phone_country': 'alternatePhoneCountry',
    'alternatePhoneCountry': 'alternatePhoneCountry',
    'linkedin_profile_url': 'linkedinProfileUrl',
    'linkedinProfileUrl': 'linkedinProfileUrl',
    'LinkedIn Profile URL': 'linkedinProfileUrl',
    'linkedin_company_page_url': 'linkedinCompanyPageUrl',
    'linkedinCompanyPageUrl': 'linkedinCompanyPageUrl',
    'estimated_requirement_date': 'estimatedRequirementDate',
    'estimatedRequirementDate': 'estimatedRequirementDate',
    'Estimated Requirement Date': 'estimatedRequirementDate',
    'est_requirement_date': 'estimatedRequirementDate',
    'last_contact_date': 'lastContactDate',
    'lastContactDate': 'lastContactDate',
    'next_follow_up': 'nextFollowUp',
    'nextFollowUp': 'nextFollowUp',
    'request_type': 'requestType',
    'Request Type': 'requestType',
    'requestType': 'requestType',
    'request_details': 'requestDetails',
    'Request Details': 'requestDetails',
    'requestDetails': 'requestDetails',
    'basic_requirements': 'basicRequirements',
    'basicRequirements': 'basicRequirements',
    'Basic Requirements': 'basicRequirements',
    'notes': 'notes',
    'Notes': 'notes'
  };

  const normalizeKey = (key) => {
    const trimmed = (key || '').trim().replace(/^"|"$/g, '');
    if (headerMap[trimmed]) return headerMap[trimmed];
    const canonical = trimmed.toLowerCase().replace(/[\s-]+/g, '_');
    if (headerMap[canonical]) return headerMap[canonical];
    if (canonical === 'request_type' || canonical === 'requesttype') return 'requestType';
    if (canonical === 'request_details' || canonical === 'requestdetails' || canonical === 'requirement_details') return 'requestDetails';
    if (canonical === 'basic_requirements' || canonical === 'basicrequirements') return 'basicRequirements';
    return trimmed;
  };

  const sanitizePhoneDigits = (val) => {
    if (!val) return '';
    return String(val).replace(/\D/g, '');
  };

  const sanitizeDate = (val) => {
    if (!val) return '';
    const clean = String(val).trim();
    if (clean.includes('T')) {
      return clean.substring(0, 10);
    }
    const parts = clean.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return clean;
  };

  const parseCSV = (text) => {
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const parseRow = (row) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(v => v.replace(/^"|"$/g, ''));
    };

    const headers = parseRow(lines[0]).map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      const rowObj = {};
      headers.forEach((header, idx) => {
        rowObj[header] = values[idx] || '';
      });
      rows.push(rowObj);
    }
    return rows;
  };

  const normalizeRawLead = (rawObj) => {
    const mapped = {};
    Object.keys(rawObj).forEach(key => {
      const mappedKey = normalizeKey(key);
      mapped[mappedKey] = rawObj[key];
    });

    if (!mapped.requestDetails && mapped.basicRequirements) {
      mapped.requestDetails = mapped.basicRequirements;
    }
    if (mapped.requestDetails) {
      mapped.basicRequirements = mapped.requestDetails;
    }

    // Default request details if missing
    if (!mapped.requestDetails) {
      mapped.requestDetails = 'Lead imported from document. Requirements to be discussed during initial qualification.';
      mapped.basicRequirements = mapped.requestDetails;
    }

    // Default Request Type
    let reqType = (mapped.requestType || '').trim();
    if (reqType.toLowerCase() === 'it product' || reqType.toLowerCase() === 'product') {
      mapped.requestType = 'IT Product';
    } else if (reqType.toLowerCase() === 'it service' || reqType.toLowerCase() === 'service') {
      mapped.requestType = 'IT Service';
    } else {
      mapped.requestType = reqType || 'IT Product';
    }

    // Resolve Country & Phone
    const rawCountry = mapped.countryCode || mapped.officePhoneCountry || 'IN|+91';
    mapped.countryCode = normalizeCountryCode(rawCountry, 'IN|+91');
    mapped.phone = sanitizePhoneDigits(mapped.phone);
    mapped.officePhone = sanitizePhoneDigits(mapped.officePhone || mapped.phone);
    mapped.officePhoneCountry = mapped.countryCode;

    if (mapped.alternatePhone) {
      mapped.alternatePhone = sanitizePhoneDigits(mapped.alternatePhone);
      mapped.alternatePhoneCountry = normalizeCountryCode(mapped.alternatePhoneCountry || mapped.countryCode, 'IN|+91');
    }

    // Dates
    if (mapped.estimatedRequirementDate) mapped.estimatedRequirementDate = sanitizeDate(mapped.estimatedRequirementDate);
    if (mapped.lastContactDate) mapped.lastContactDate = sanitizeDate(mapped.lastContactDate);
    if (mapped.nextFollowUp) mapped.nextFollowUp = sanitizeDate(mapped.nextFollowUp);

    // Single-value constraints
    let statusVal = String(mapped.status || 'Open').trim();
    if (statusVal.toLowerCase() === 'open' || statusVal.toLowerCase() === 'new') statusVal = 'Open';
    else if (statusVal.toLowerCase() === 'in progress') statusVal = 'In Progress';
    else if (statusVal.toLowerCase() === 'won') statusVal = 'Won';
    else if (statusVal.toLowerCase() === 'lost') statusVal = 'Lost';
    else statusVal = 'Open';
    mapped.status = statusVal;

    let priorityVal = String(mapped.priority || 'Normal').trim();
    if (priorityVal.toLowerCase() === 'low') priorityVal = 'Low';
    else if (priorityVal.toLowerCase() === 'normal' || priorityVal.toLowerCase() === 'medium') priorityVal = 'Normal';
    else if (priorityVal.toLowerCase() === 'high') priorityVal = 'High';
    else if (priorityVal.toLowerCase() === 'urgent') priorityVal = 'Urgent';
    else priorityVal = 'Normal';
    mapped.priority = priorityVal;

    let sentimentVal = String(mapped.sentiment || 'Neutral').trim();
    if (sentimentVal.toLowerCase() === 'positive') sentimentVal = 'Positive';
    else if (sentimentVal.toLowerCase() === 'neutral') sentimentVal = 'Neutral';
    else if (sentimentVal.toLowerCase() === 'negative') sentimentVal = 'Negative';
    else sentimentVal = 'Neutral';
    mapped.sentiment = sentimentVal;

    mapped.stage = mapped.stage || 'Prospecting';

    // Owner resolution
    let rawOwner = String(mapped.owner || '').trim();
    if (rawOwner) {
      const matchedUser = usersList.find(u => 
        u.name.toLowerCase() === rawOwner.toLowerCase() || 
        u.email.toLowerCase() === rawOwner.toLowerCase()
      );
      if (matchedUser) {
        mapped.owner = matchedUser.name;
      } else {
        // Keep explicit owner string so validation flags it if not in active users
        mapped.owner = rawOwner;
      }
    } else {
      // Case B: No owner in document -> fallback to authenticated user
      let currentUserName = '';
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUserName = currentUser.name || '';
      } catch {
        // ignore parse error
      }
      if (currentUserName) {
        const matchedUser = usersList.find(u => 
          u.name.toLowerCase() === currentUserName.toLowerCase() || 
          u.email?.toLowerCase() === currentUserName.toLowerCase()
        );
        mapped.owner = matchedUser ? matchedUser.name : currentUserName;
      } else {
        mapped.owner = '';
      }
    }

    // Contact person fallback
    if (!mapped.contact && mapped.kamName) {
      mapped.contact = mapped.kamName;
    } else if (!mapped.kamName && mapped.contact) {
      mapped.kamName = mapped.contact;
    }

    return mapped;
  };

  // Row Validator for Preview Stage
  const validateRow = (lead) => {
    const errors = {};

    if (!lead.company || !lead.company.trim()) {
      errors.company = 'Company is required.';
    }
    if (!lead.contact || !lead.contact.trim()) {
      errors.contact = 'Contact person is required.';
    }
    if (!lead.email || !lead.email.trim()) {
      errors.email = 'Email is required.';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(lead.email.trim())) {
        errors.email = 'Invalid email address.';
      }
    }

    // Owner validation
    const ownerName = (lead.owner || '').trim();
    if (!ownerName) {
      errors.owner = 'Lead owner is required.';
    } else if (usersList.length > 0 && !usersList.some(u => u.name.toLowerCase() === ownerName.toLowerCase())) {
      errors.owner = `Lead owner '${lead.owner}' was not found among active users.`;
    }

    // Phone Validation with international support
    const phoneRes = validatePhoneNumber(lead.phone, lead.countryCode, true, 'Phone number is required.');
    if (!phoneRes.valid) {
      errors.phone = phoneRes.message;
    }

    if (lead.requestType !== 'IT Product' && lead.requestType !== 'IT Service') {
      errors.requestType = "Must be 'IT Product' or 'IT Service'.";
    }

    if (!lead.requestDetails || !lead.requestDetails.trim()) {
      errors.requestDetails = 'Request details is required.';
    }

    return errors;
  };

  // Validations across all preview rows
  const rowValidations = useMemo(() => {
    return extractedLeads.map(lead => validateRow(lead));
  }, [extractedLeads]);

  const validationStats = useMemo(() => {
    let validCount = 0;
    let invalidCount = 0;
    rowValidations.forEach(errs => {
      if (Object.keys(errs).length === 0) {
        validCount++;
      } else {
        invalidCount++;
      }
    });
    return {
      total: extractedLeads.length,
      valid: validCount,
      invalid: invalidCount,
    };
  }, [extractedLeads, rowValidations]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const processSelectedFile = (selectedFile) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.csv', '.pdf', '.docx', '.doc'];
    
    if (!allowed.includes(ext)) {
      showToast('Unsupported file format. Please upload CSV, PDF, DOC, or DOCX.', 'error');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast('File size exceeds maximum allowed limit of 10MB.', 'error');
      return;
    }

    setFile(selectedFile);
    extractLeadsFromFile(selectedFile);
  };

  const extractLeadsFromFile = async (uploadedFile) => {
    setIsExtracting(true);
    const ext = uploadedFile.name.substring(uploadedFile.name.lastIndexOf('.')).toLowerCase();

    try {
      if (ext === '.csv') {
        // Client-side CSV extraction
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target.result;
            const rawRows = parseCSV(text);
            if (rawRows.length === 0) {
              showToast('The uploaded CSV contains no readable lead rows.', 'warning');
              setIsExtracting(false);
              return;
            }
            const normalized = rawRows.map(normalizeRawLead);
            setExtractedLeads(normalized);
            setStep('preview');
            showToast(`Extracted ${normalized.length} lead(s) from CSV. Please review and verify.`, 'info');
          } catch (err) {
            console.error('CSV Parsing Error:', err);
            showToast('Failed to parse CSV file: ' + err.message, 'error');
          } finally {
            setIsExtracting(false);
          }
        };
        reader.readAsText(uploadedFile);
      } else {
        // PDF, DOCX, DOC extraction via backend API
        const response = await extractDocumentLeads(uploadedFile);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          const normalized = response.data.map(normalizeRawLead);
          setExtractedLeads(normalized);
          setStep('preview');
          showToast(`Successfully extracted ${normalized.length} lead(s) from ${uploadedFile.name}.`, 'success');
        } else {
          showToast(response.message || 'We couldn\'t identify lead information from this document.', 'warning');
        }
        setIsExtracting(false);
      }
    } catch (err) {
      console.error('Document extraction error:', err);
      showToast(err.message || 'Failed to extract leads from document.', 'error');
      setIsExtracting(false);
    }
  };

  const handleRowChange = (index, field, value) => {
    setExtractedLeads(prev => {
      const updated = [...prev];
      const lead = { ...updated[index] };
      lead[field] = value;

      // Synchronize associated fields
      if (field === 'countryCode') {
        lead.officePhoneCountry = value;
      }
      if (field === 'requestDetails') {
        lead.basicRequirements = value;
      }
      if (field === 'contact' && !lead.kamName) {
        lead.kamName = value;
      }

      updated[index] = lead;
      return updated;
    });
  };

  const handleDeleteRow = (index) => {
    setExtractedLeads(prev => prev.filter((_, idx) => idx !== index));
    showToast('Row removed.', 'info');
  };

  const handleAddNewRow = () => {
    const defaultOwner = usersList.length > 0 ? usersList[0].name : '';
    const newLead = normalizeRawLead({
      company: '',
      contact: '',
      email: '',
      phone: '',
      countryCode: 'IN|+91',
      owner: defaultOwner,
      stage: 'Prospecting',
      status: 'Open',
      priority: 'Normal',
      sentiment: 'Neutral',
      requestType: 'IT Product',
      requestDetails: 'Requirements to be discussed during initial qualification.'
    });
    setExtractedLeads(prev => [...prev, newLead]);
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setFile(null);
    setExtractedLeads([]);
  };

  const handleStartImport = async () => {
    if (extractedLeads.length === 0) {
      showToast('No leads to import.', 'warning');
      return;
    }

    if (validationStats.invalid > 0) {
      showToast(`Please fix the ${validationStats.invalid} invalid lead row(s) highlighted in red before importing.`, 'warning');
      return;
    }

    setIsImporting(true);
    try {
      const payload = extractedLeads.map(lead => ({
        ...lead,
        phone: sanitizePhoneDigits(lead.phone),
        officePhone: sanitizePhoneDigits(lead.officePhone || lead.phone),
        alternatePhone: lead.alternatePhone ? sanitizePhoneDigits(lead.alternatePhone) : undefined,
        requestDetails: lead.requestDetails || lead.basicRequirements,
        basicRequirements: lead.requestDetails || lead.basicRequirements
      }));

      const response = await bulkCreateLeads(payload);
      if (response.success || (response.summary && (response.summary.created > 0 || response.summary.failed > 0))) {
        const summary = response.summary || { created: 0, failed: 0, total: payload.length };
        setImportSummary(summary);
        setFailedRows(response.failed || []);
        setImportError('');
        setShowResultModal(true);
      } else {
        setImportError('Failed to import leads. The server did not process any items.');
        setImportSummary(null);
        setFailedRows([]);
        setShowResultModal(true);
      }
    } catch (err) {
      console.error('Import failed:', err);
      setImportError(err.message || 'Failed to import leads.');
      setImportSummary(null);
      setFailedRows([]);
      setShowResultModal(true);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    if (importSummary && importSummary.created > 0) {
      window.location.href = '/leads';
    }
  };

  const handleDownloadSample = () => {
    const headers = [
      'company_name', 'project_name', 'office_phone_number', 'industry', 'company_size', 'region', 
      'kam_name', 'designation', 'email', 'phone', 'country_code', 'best_time_to_connect', 'alternate_phone', 
      'linkedin_profile_url', 'linkedin_company_page_url', 'est_requirement_date', 'last_contact_date', 
      'next_follow_up', 'request_type', 'request_details', 'notes', 'lead_owner', 'lifecycle_template', 'status', 
      'stage', 'priority', 'lead_source', 'sentiment'
    ];
    const sampleData = [
      headers.join(','),
      `"Acme Technologies","CRM Transformation Project","9876543210","Information Technology","Large","India","John Doe","VP of Sales","john.doe@gmail.com","9876543211","IN|+91","Morning","9876543212","https://www.linkedin.com/in/johndoe","https://www.linkedin.com/company/acme-technologies","15-09-2026","28-08-2026","05-09-2026","IT Product","Client is requesting a full-featured CRM platform for lead tracking and enterprise pipeline analytics. The deployment must integrate seamlessly with existing sales tools and support automated workflow triggers.","Interested in enterprise CRM solution.","User","Enterprise Sales","Open","Prospecting","High","Website","Positive"`,
      `"Horizon Retail","Omnichannel Commerce Transformation","4155552671","Retail","Enterprise","USA","Sarah Jenkins","Director","sarah.jenkins@gmail.com","4155552671","US|+1","Afternoon","","https://www.linkedin.com/in/sarahjenkins","https://www.linkedin.com/company/horizon-retail","20-09-2026","27-08-2026","03-09-2026","IT Service","Customer requires specialized implementation services for retail omnichannel integrations across multiple regional warehouses. The project involves legacy database migration and ongoing operational support.","Requested product demonstration.","User","Enterprise Sales","Open","Qualification","High","Referral","Positive"`
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'leads_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="import-page-container">
      {/* Top Header */}
      <div className="import-header-section">
        <div className="import-header-title-block">
          <h1 className="import-page-title">Import Leads</h1>
          <p className="import-page-subtitle">Upload your CSV file to quickly import leads into the system.</p>
        </div>

        {step === 'upload' && (
          <div className="import-header-action-block">
            <button 
              id="sample-download-btn"
              className="btn-download-sample-pill" 
              onClick={handleDownloadSample}
              type="button"
            >
              <Download size={16} strokeWidth={2} />
              <span>Download Sample CSV</span>
            </button>

            <div className="header-illustration-wrap" title="CSV Document Upload">
              <CsvHeaderIllustration />
            </div>
          </div>
        )}
      </div>

      {step === 'upload' ? (
        <div className="import-main-grid">
          {/* Left Column: Dropzone + 4 Features */}
          <div className="import-white-card upload-panel-card">
            <div 
              className={`modern-csv-dropzone ${isDragging ? 'dragging' : ''} ${isExtracting ? 'extracting' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isExtracting && fileInputRef.current.click()}
              role="button"
              tabIndex={0}
            >
              <input 
                type="file" 
                accept=".csv,.pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/csv" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileInput}
                disabled={isExtracting}
              />
              
              {isExtracting ? (
                <div className="dropzone-extracting-state">
                  <RefreshCw size={44} className="text-primary spin" />
                  <h3>Extracting lead data from document...</h3>
                  <p className="text-muted">Analyzing document tables, contact entries, and phone numbers</p>
                </div>
              ) : (
                <div className="dropzone-idle-content">
                  <div className="dropzone-cloud-icon-container">
                    <UploadCloud size={48} color="#2563EB" strokeWidth={2} />
                  </div>
                  <h3 className="dropzone-main-heading">Upload CSV, PDF, or Word document</h3>
                  <p className="dropzone-sub-instruction">Drag & drop your file here, or click to browse</p>
                  
                  <div className="dropzone-format-pills">
                    <span className="dropzone-pill">CSV (.csv)</span>
                    <span className="dropzone-pill">PDF (.pdf)</span>
                    <span className="dropzone-pill">Word (.docx / .doc)</span>
                  </div>

                  <p className="dropzone-size-limit">Maximum file size: 10MB</p>
                </div>
              )}
            </div>

            {/* 4 Feature Highlights Row */}
            <div className="import-features-grid">
              {IMPORT_FEATURES.map((feat, idx) => {
                const IconComp = feat.icon;
                return (
                  <div key={idx} className="import-feature-item">
                    <div 
                      className="feature-icon-squircle"
                      style={{ backgroundColor: feat.iconBg, color: feat.iconColor }}
                    >
                      <IconComp size={18} strokeWidth={2.4} />
                    </div>
                    <div className="feature-text-block">
                      <h4 className="feature-heading">{feat.title}</h4>
                      <p className="feature-description">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: CSV Format Requirements */}
          <div className="import-white-card requirements-panel-card">
            <div className="requirements-card-header">
              <div className="requirements-layers-icon-box">
                <Layers size={22} color="#2563EB" strokeWidth={2.2} />
              </div>
              <div className="requirements-header-text">
                <h3 className="requirements-card-title">CSV Format Requirements</h3>
                <p className="requirements-card-subtitle">Your CSV must include the following columns.</p>
              </div>
            </div>

            <div className="requirements-table-list">
              {CSV_REQUIREMENTS.map((req, idx) => (
                <div key={idx} className="requirement-list-row">
                  <div className="requirement-field-left">
                    <CheckCircle2 size={16} className="requirement-check-circle" strokeWidth={2.5} />
                    <span className="requirement-field-name">{req.name}</span>
                  </div>
                  <div className="requirement-example-right">
                    {req.example}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Callout Info Banner */}
            <div 
              className="requirements-info-callout" 
              onClick={handleDownloadSample}
              role="button"
              tabIndex={0}
            >
              <Info size={17} className="callout-info-icon" strokeWidth={2.2} />
              <span className="callout-info-text">
                Need help? Download the sample CSV file to see the required format.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Preview & Review Table Step */
        <div className="preview-container">
          <div className="preview-toolbar">
            <button className="btn-secondary" onClick={handleBackToUpload} disabled={isImporting}>
              <ArrowLeft size={16} />
              Upload Different File
            </button>

            <div className="preview-stats-bar">
              <div className="stat-badge">
                <span>Total Extracted:</span>
                <strong>{validationStats.total}</strong>
              </div>
              <div className="stat-badge success">
                <span>Valid:</span>
                <strong>{validationStats.valid}</strong>
              </div>
              {validationStats.invalid > 0 && (
                <div className="stat-badge danger">
                  <span>Needs Fix:</span>
                  <strong>{validationStats.invalid}</strong>
                </div>
              )}
            </div>

            <div className="preview-action-buttons">
              <button className="btn-secondary" onClick={handleAddNewRow} disabled={isImporting}>
                <Plus size={16} />
                Add Lead Row
              </button>
              <button 
                className="btn-primary" 
                onClick={handleStartImport} 
                disabled={isImporting || extractedLeads.length === 0}
              >
                {isImporting ? 'Importing...' : `Import ${extractedLeads.length} Lead(s)`}
              </button>
            </div>
          </div>

          {validationStats.invalid > 0 && (
            <div className="preview-warning-banner">
              <AlertTriangle size={18} className="text-warning" />
              <span>Some fields could not be confidently identified or are invalid. Please review and correct the highlighted fields before importing.</span>
            </div>
          )}

          <div className="table-responsive preview-table-card">
            <table className="preview-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ width: '80px' }}>Status</th>
                  <th style={{ minWidth: '170px' }}>Company *</th>
                  <th style={{ minWidth: '160px' }}>Contact Person *</th>
                  <th style={{ minWidth: '180px' }}>Email *</th>
                  <th style={{ minWidth: '220px' }}>Country & Phone *</th>
                  <th style={{ minWidth: '150px' }}>Owner</th>
                  <th style={{ minWidth: '140px' }}>Stage</th>
                  <th style={{ minWidth: '120px' }}>Priority</th>
                  <th style={{ minWidth: '140px' }}>Request Type *</th>
                  <th style={{ minWidth: '220px' }}>Request Details *</th>
                  <th style={{ minWidth: '110px' }}>Value</th>
                  <th style={{ width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {extractedLeads.map((lead, idx) => {
                  const errors = rowValidations[idx] || {};
                  const hasErrors = Object.keys(errors).length > 0;

                  return (
                    <tr key={idx} className={hasErrors ? 'row-invalid' : 'row-valid'}>
                      <td className="text-muted text-center">{idx + 1}</td>
                      <td>
                        {hasErrors ? (
                          <span className="status-badge error" title={Object.values(errors).join(' | ')}>
                            <AlertCircle size={14} /> Error
                          </span>
                        ) : (
                          <span className="status-badge valid">
                            <CheckCircle2 size={14} /> Ready
                          </span>
                        )}
                      </td>
                      <td>
                        <input 
                          type="text"
                          className={`table-input ${errors.company ? 'input-error' : ''}`}
                          value={lead.company || ''}
                          placeholder="Company Name"
                          onChange={(e) => handleRowChange(idx, 'company', e.target.value)}
                        />
                        {errors.company && <span className="field-error-text">{errors.company}</span>}
                      </td>
                      <td>
                        <input 
                          type="text"
                          className={`table-input ${errors.contact ? 'input-error' : ''}`}
                          value={lead.contact || ''}
                          placeholder="Contact Person"
                          onChange={(e) => handleRowChange(idx, 'contact', e.target.value)}
                        />
                        {errors.contact && <span className="field-error-text">{errors.contact}</span>}
                      </td>
                      <td>
                        <input 
                          type="email"
                          className={`table-input ${errors.email ? 'input-error' : ''}`}
                          value={lead.email || ''}
                          placeholder="name@example.com"
                          onChange={(e) => handleRowChange(idx, 'email', e.target.value)}
                        />
                        {errors.email && <span className="field-error-text">{errors.email}</span>}
                      </td>
                      <td>
                        <div className="phone-country-group">
                          <select 
                            className="country-select"
                            value={lead.countryCode || 'IN|+91'}
                            onChange={(e) => handleRowChange(idx, 'countryCode', e.target.value)}
                          >
                            {COUNTRY_CODES.map((c, cIdx) => (
                              <option key={cIdx} value={`${c.iso}|${c.code}`}>
                                {c.flag} {c.iso} ({c.code})
                              </option>
                            ))}
                          </select>
                          <input 
                            type="tel"
                            className={`table-input phone-input ${errors.phone ? 'input-error' : ''}`}
                            value={lead.phone || ''}
                            placeholder="Phone number"
                            onChange={(e) => handleRowChange(idx, 'phone', e.target.value)}
                          />
                        </div>
                        {errors.phone && <span className="field-error-text">{errors.phone}</span>}
                      </td>
                      <td>
                        <select 
                          className={`table-input ${errors.owner ? 'input-error' : ''}`}
                          value={lead.owner || ''}
                          onChange={(e) => handleRowChange(idx, 'owner', e.target.value)}
                        >
                          <option value="">-- Select Owner --</option>
                          {lead.owner && !usersList.some(u => u.name === lead.owner) && (
                            <option value={lead.owner} disabled>
                              {lead.owner} (Not in active users)
                            </option>
                          )}
                          {usersList.map((u, uIdx) => (
                            <option key={uIdx} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                        {errors.owner && <span className="field-error-text">{errors.owner}</span>}
                      </td>
                      <td>
                        <select 
                          className="table-input"
                          value={lead.stage || 'Prospecting'}
                          onChange={(e) => handleRowChange(idx, 'stage', e.target.value)}
                        >
                          {masterStages.length > 0 ? (
                            masterStages.map((stg, sIdx) => (
                              <option key={sIdx} value={stg.name}>{stg.name}</option>
                            ))
                          ) : (
                            <>
                              <option value="Prospecting">Prospecting</option>
                              <option value="Qualification">Qualification</option>
                              <option value="Proposal Sent">Proposal Sent</option>
                              <option value="Negotiation">Negotiation</option>
                              <option value="Won">Won</option>
                              <option value="Lost">Lost</option>
                            </>
                          )}
                        </select>
                      </td>
                      <td>
                        <select 
                          className="table-input"
                          value={lead.priority || 'Normal'}
                          onChange={(e) => handleRowChange(idx, 'priority', e.target.value)}
                        >
                          <option value="Low">Low</option>
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </td>
                      <td>
                        <select 
                          className={`table-input ${errors.requestType ? 'input-error' : ''}`}
                          value={lead.requestType || 'IT Product'}
                          onChange={(e) => handleRowChange(idx, 'requestType', e.target.value)}
                        >
                          <option value="IT Product">IT Product</option>
                          <option value="IT Service">IT Service</option>
                        </select>
                        {errors.requestType && <span className="field-error-text">{errors.requestType}</span>}
                      </td>
                      <td>
                        <input 
                          type="text"
                          className={`table-input ${errors.requestDetails ? 'input-error' : ''}`}
                          value={lead.requestDetails || ''}
                          placeholder="Requirement details"
                          onChange={(e) => handleRowChange(idx, 'requestDetails', e.target.value)}
                        />
                        {errors.requestDetails && <span className="field-error-text">{errors.requestDetails}</span>}
                      </td>
                      <td>
                        <input 
                          type="text"
                          className="table-input"
                          value={lead.value || ''}
                          placeholder="50000"
                          onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <button 
                          type="button"
                          className="delete-row-btn"
                          title="Remove this lead"
                          onClick={() => handleDeleteRow(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Result Modal */}
      {showResultModal && (
        <div className="import-modal-overlay">
          <div className="import-modal-card">
            <div className="import-modal-header">
              <h3>Import Leads Summary</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="import-modal-body">
              {importError ? (
                <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontWeight: '500' }}>
                  ❌ {importError}
                </div>
              ) : (
                <>
                  <div className="import-summary-stats">
                    <div className="stat-item">
                      <span className="stat-val">{importSummary?.total || 0}</span>
                      <span className="stat-label">Total Rows</span>
                    </div>
                    <div className="stat-item created">
                      <span className="stat-val created">{importSummary?.created || 0}</span>
                      <span className="stat-label">Created</span>
                    </div>
                    <div className="stat-item failed">
                      <span className="stat-val failed">{importSummary?.failed || 0}</span>
                      <span className="stat-label">Failed</span>
                    </div>
                  </div>

                  {failedRows.length > 0 && (
                    <div>
                      <h4 style={{ marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Failed Rows Detail:</h4>
                      <ul className="error-details-list">
                        {failedRows.map((item, idx) => {
                          const errString = typeof item.errors === 'string' 
                            ? item.errors 
                            : JSON.stringify(item.errors);
                          return (
                            <li key={idx}>
                              <strong>Row {item.index !== undefined ? item.index + 1 : idx + 1} ({item.company || 'Unknown Company'}):</strong> {errString}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="import-modal-footer">
              <button className="btn-primary" onClick={handleCloseModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
