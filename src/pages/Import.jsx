import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, X } from 'lucide-react';
import './Import.css';
import { bulkCreateLeads, fetchCurrentUsers } from '../services/leadService';

export default function Import() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [usersList, setUsersList] = useState([]);
  
  // Custom Result Modal States
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
  }, []);

  const mandatoryColumns = [
    'Company Name',
    'Contact Person',
    'Email Address',
    'Phone',
    'Office Phone Number',
    'Lead Owner',
    'Stage',
    'Status',
    'Sentiment',
    'Priority',
    'KAM Name',
    'Basic Requirements'
  ];

  // Map of snake_case or human headers to target CreateLeadRequest fields
  const headerMap = {
    'company_name': 'company',
    'Company Name': 'company',
    'project_name': 'projectName',
    'Project Name': 'projectName',
    'contact_person': 'contact',
    'Contact Person': 'contact',
    'email_address': 'email',
    'Email Address': 'email',
    'email': 'email',
    'phone': 'phone',
    'office_phone_number': 'officePhone',
    'office_phone': 'officePhone',
    'Office Phone Number': 'officePhone',
    'office_phone_country': 'officePhoneCountry',
    'Office Phone Country': 'officePhoneCountry',
    'lead_owner': 'owner',
    'Lead Owner': 'owner',
    'owner': 'owner',
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
    'Lifecycle Template': 'lifecycleTemplate',
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
    'Alternate Phone Country': 'alternatePhoneCountry',
    'linkedin_profile_url': 'linkedinProfileUrl',
    'linkedinProfileUrl': 'linkedinProfileUrl',
    'LinkedIn Profile URL': 'linkedinProfileUrl',
    'linkedin_company_page_url': 'linkedinCompanyPageUrl',
    'linkedinCompanyPageUrl': 'linkedinCompanyPageUrl',
    'LinkedIn Company Page URL': 'linkedinCompanyPageUrl',
    'estimated_requirement_date': 'estimatedRequirementDate',
    'estimatedRequirementDate': 'estimatedRequirementDate',
    'Estimated Requirement Date': 'estimatedRequirementDate',
    'est_requirement_date': 'estimatedRequirementDate',
    'last_contact_date': 'lastContactDate',
    'lastContactDate': 'lastContactDate',
    'Last Contact Date': 'lastContactDate',
    'next_follow_up': 'nextFollowUp',
    'nextFollowUp': 'nextFollowUp',
    'Next Follow-Up': 'nextFollowUp',
    'basic_requirements': 'basicRequirements',
    'basicRequirements': 'basicRequirements',
    'Basic Requirements': 'basicRequirements',
    'notes': 'notes',
    'Notes': 'notes'
  };

  const sanitizePhone = (val) => {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '');
    if (digits.length > 10) {
      return digits.slice(-10); // Extract last 10 digits
    }
    return digits;
  };

  const sanitizeDate = (val) => {
    if (!val) return '';
    const clean = String(val).trim();
    // Check if ISO format already
    if (clean.includes('T')) {
      return clean.substring(0, 10);
    }
    const parts = clean.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return clean;
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
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

    const headers = parseRow(lines[0]);
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (uploadedFile) => {
    if (uploadedFile.type === 'text/csv' || uploadedFile.name.endsWith('.csv')) {
      setFile(uploadedFile);
    } else {
      alert('Please upload a valid CSV file.');
    }
  };

  const handleDownloadSample = () => {
    const headers = [
      'company_name', 'project_name', 'office_phone_number', 'industry', 'company_size', 'region', 
      'kam_name', 'designation', 'email', 'phone', 'best_time_to_connect', 'alternate_phone', 
      'linkedin_profile_url', 'linkedin_company_page_url', 'est_requirement_date', 'last_contact_date', 
      'next_follow_up', 'basic_requirements', 'notes', 'lead_owner', 'lifecycle_template', 'status', 
      'stage', 'priority', 'lead_source', 'sentiment'
    ];
    const sampleData = [
      headers.join(','),
      `"Acme Technologies","CRM Transformation Project","9876543210","Information Technology","Large","India","John Doe","VP of Sales","john.doe@gmail.com","9876543211","Morning","9876543212","https://www.linkedin.com/in/johndoe","https://www.linkedin.com/company/acme-technologies","15-09-2026","28-08-2026","05-09-2026","CRM implementation and sales automation","Interested in enterprise CRM solution.","User","Enterprise Sales","Open","Prospecting","High","Website","Positive"`,
      `"Horizon Retail","Omnichannel Commerce Transformation","9876543220","Retail","Enterprise","India","Sarah Jenkins","Director","sarah.jenkins@gmail.com","9876543221","Afternoon","9876543222","https://www.linkedin.com/in/sarahjenkins","https://www.linkedin.com/company/horizon-retail","20-09-2026","27-08-2026","03-09-2026","Omnichannel sales and customer management","Requested product demonstration.","User","Enterprise Sales","Open","Qualification","High","Referral","Positive"`
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'leads_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartImport = async (e) => {
    e.stopPropagation();
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rawRows = parseCSV(text);

        const parsedLeads = rawRows.map(row => {
          const mapped = {};
          Object.keys(row).forEach(key => {
            const mappedKey = headerMap[key] || key;
            mapped[mappedKey] = row[key];
          });

          // 1. Sanitize phone numbers
          mapped.phone = sanitizePhone(mapped.phone);
          mapped.officePhone = sanitizePhone(mapped.officePhone);
          if (mapped.alternatePhone) {
            mapped.alternatePhone = sanitizePhone(mapped.alternatePhone);
          }

          // 2. Format dates
          if (mapped.estimatedRequirementDate) mapped.estimatedRequirementDate = sanitizeDate(mapped.estimatedRequirementDate);
          if (mapped.lastContactDate) mapped.lastContactDate = sanitizeDate(mapped.lastContactDate);
          if (mapped.nextFollowUp) mapped.nextFollowUp = sanitizeDate(mapped.nextFollowUp);

          // 3. Normalize single-value constraints
          let statusVal = String(mapped.status || 'Open').trim();
          if (statusVal.toLowerCase() === 'open') statusVal = 'Open';
          else if (statusVal.toLowerCase() === 'in progress' || statusVal.toLowerCase() === 'new') statusVal = 'Open';
          else if (statusVal.toLowerCase() === 'won') statusVal = 'Won';
          else if (statusVal.toLowerCase() === 'lost') statusVal = 'Lost';
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
          mapped.sentiment = sentimentVal;

          // 4. Map owner to active user
          let ownerVal = String(mapped.owner || '').trim();
          const matchedUser = usersList.find(u => 
            u.name.toLowerCase() === ownerVal.toLowerCase() || 
            u.email.toLowerCase() === ownerVal.toLowerCase()
          );
          if (matchedUser) {
            mapped.owner = matchedUser.name;
          } else if (usersList.length > 0) {
            // Default to the first active user
            mapped.owner = usersList[0].name;
          }

          // 5. Ensure contact is set
          if (!mapped.contact && mapped.kamName) {
            mapped.contact = mapped.kamName;
          } else if (!mapped.kamName && mapped.contact) {
            mapped.kamName = mapped.contact;
          }

          return mapped;
        });

        const response = await bulkCreateLeads(parsedLeads);
        if (response.success || (response.summary && (response.summary.created > 0 || response.summary.failed > 0))) {
          const summary = response.summary || { created: 0, failed: 0, total: parsedLeads.length };
          setImportSummary(summary);
          setFailedRows(response.failed || []);
          setImportError('');
          setShowResultModal(true);
          setFile(null);
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
    reader.readAsText(file);
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    // If successfully imported some leads, redirect to leads page
    if (importSummary && importSummary.created > 0) {
      window.location.href = '/leads';
    }
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <h1 className="page-title">Import Leads</h1>
        <button 
          id="sample-download-btn"
          className="btn-secondary" 
          onClick={handleDownloadSample}
        >
          <Download size={18} />
          Download Sample CSV
        </button>
      </div>

      <div className="import-content">
        <div className="card upload-card">
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isImporting && fileInputRef.current.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileInput}
              disabled={isImporting}
            />
            
            {file ? (
              <div className="file-info">
                <FileSpreadsheet size={48} className="text-primary" />
                <h3>{file.name}</h3>
                <p className="text-muted">{(file.size / 1024).toFixed(2)} KB</p>
                <div className="mt-4">
                  <button className="btn-primary" onClick={handleStartImport} disabled={isImporting}>
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="upload-prompt">
                <UploadCloud size={48} className="text-muted" />
                <h3>Drop your CSV here, or click to browse</h3>
                <p className="text-muted">Maximum file size: 10MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="card requirements-card">
          <div className="card-header">
            <h3>Format Requirements</h3>
            <p className="text-sm text-muted">Your CSV must include the following columns.</p>
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

      {/* Interactive Result Modal Overlay */}
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
                              <strong>Row {item.index + 2} ({item.company || 'Unknown Company'}):</strong> {errString}
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
