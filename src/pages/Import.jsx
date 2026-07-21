import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';
import './Import.css';

export default function Import() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const mandatoryColumns = [
    'Company Name',
    'Contact Person',
    'Email Address',
    'Deal Value',
    'Stage'
  ];

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
    // Mocking a file upload validation
    if (uploadedFile.type === 'text/csv' || uploadedFile.name.endsWith('.csv')) {
      setFile(uploadedFile);
    } else {
      alert('Please upload a valid CSV file.');
    }
  };

  const handleSimulateDownload = () => {
    // Just a UI simulation
    const btn = document.getElementById('sample-download-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="flex items-center gap-2"><CheckCircle2 size="16"/> Downloaded</span>';
    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 2000);
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <h1 className="page-title">Import Leads</h1>
        <button 
          id="sample-download-btn"
          className="btn-secondary" 
          onClick={handleSimulateDownload}
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
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileInput}
            />
            
            {file ? (
              <div className="file-info">
                <FileSpreadsheet size={48} className="text-primary" />
                <h3>{file.name}</h3>
                <p className="text-muted">{(file.size / 1024).toFixed(2)} KB</p>
                <div className="mt-4">
                  <button className="btn-primary" onClick={(e) => { e.stopPropagation(); alert('Mock import started!'); }}>
                    Start Import
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
    </div>
  );
}
