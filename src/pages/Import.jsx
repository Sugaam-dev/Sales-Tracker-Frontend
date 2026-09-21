import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  UploadCloud, 
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
  X 
} from 'lucide-react';
import './Import.css';
import { bulkCreateLeads, extractDocumentLeads, fetchCurrentUsers, fetchMasterStages } from '../services/leadService';
import { useToast } from '../context/FeedbackContext';
import { COUNTRY_CODES, getCountryObj, normalizeCountryCode } from '../constants/countries';
import { validatePhoneNumber } from '../utils/phoneValidation';

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
    let ownerVal = String(mapped.owner || '').trim();
    const matchedUser = usersList.find(u => 
      u.name.toLowerCase() === ownerVal.toLowerCase() || 
      u.email.toLowerCase() === ownerVal.toLowerCase()
    );
    if (matchedUser) {
      mapped.owner = matchedUser.name;
    } else if (usersList.length > 0) {
      mapped.owner = usersList[0].name;
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
    <div className="import-container">
      <div className="import-header">
        <div>
          <h1 className="page-title">Import Leads</h1>
          <p className="text-sm text-muted">Upload and import leads seamlessly from CSV, PDF, or Word documents (.doc/.docx).</p>
        </div>
        <div className="header-actions">
          {step === 'upload' && (
            <button 
              id="sample-download-btn"
              className="btn-secondary" 
              onClick={handleDownloadSample}
            >
              <Download size={18} />
              Download Sample CSV
            </button>
          )}
        </div>
      </div>

      {step === 'upload' ? (
        <div className="import-content">
          <div className="card upload-card">
            <div 
              className={`drop-zone ${isDragging ? 'dragging' : ''} ${isExtracting ? 'extracting' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isExtracting && fileInputRef.current.click()}
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
                <div className="extracting-prompt">
                  <RefreshCw size={48} className="text-primary spin" />
                  <h3>Extracting lead data from document...</h3>
                  <p className="text-muted">Analyzing document tables, contact entries, and phone numbers</p>
                </div>
              ) : (
                <div className="upload-prompt">
                  <UploadCloud size={52} className="text-primary" />
                  <h3>Upload CSV, PDF, or Word document</h3>
                  <p className="text-muted">Drag & drop your file here, or click to browse</p>
                  <div className="supported-formats-pills">
                    <span className="format-pill">CSV (.csv)</span>
                    <span className="format-pill">PDF (.pdf)</span>
                    <span className="format-pill">Word (.docx / .doc)</span>
                  </div>
                  <span className="text-xs text-muted mt-2">Maximum file size: 10MB</span>
                </div>
              )}
            </div>
          </div>

          <div className="card requirements-card">
            <div className="card-header">
              <h3>Supported Formats & Fields</h3>
              <p className="text-sm text-muted">We extract leads from Tables, Key-Value pairs, and Multi-lead blocks.</p>
            </div>
            <ul className="mandatory-columns-list">
              {mandatoryColumns.map((col, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={16} className="text-success" />
                  <span>{col}</span>
                </li>
              ))}
            </ul>
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
                          className="table-input"
                          value={lead.owner || (usersList[0]?.name || '')}
                          onChange={(e) => handleRowChange(idx, 'owner', e.target.value)}
                        >
                          {usersList.map((u, uIdx) => (
                            <option key={uIdx} value={u.name}>{u.name}</option>
                          ))}
                        </select>
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
