import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import LeadProfile, { LIFECYCLE_PIPELINES } from './LeadProfile';
import { X, Edit2, Trash2, Phone, Mail, Calendar, Download, Plus, MoreVertical, Sparkles, Calculator, RotateCcw } from 'lucide-react';
import { fetchCurrentUsers, fetchMasterStages, fetchLeads, fetchLeadById } from '../services/leadService';
import './Leads.css';

import { initialLeadsData } from './mockLeads';
export { initialLeadsData };

export default function Leads() {
  const { id: urlLeadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedLead, setSelectedLead] = useState(null);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(5);
  const [classificationLead, setClassificationLead] = useState(null);
  const [classStatus, setClassStatus] = useState('New');
  const [classStage, setClassStage] = useState('Qualification');
  const [classPipeline, setClassPipeline] = useState('enterprise');
  const [classPriority, setClassPriority] = useState('High');
  const [classSource, setClassSource] = useState('Website');
  const [classSentiment, setClassSentiment] = useState('Positive');
  const [classLostReason, setClassLostReason] = useState(''); 
  const [breakdownModal, setBreakdownModal] = useState(null);
  const [breakdownSearch, setBreakdownSearch] = useState('');
  const [breakdownOwnerFilter, setBreakdownOwnerFilter] = useState('');
  const [breakdownPriorityFilter, setBreakdownPriorityFilter] = useState('');
  const [breakdownStageFilter, setBreakdownStageFilter] = useState('');
  const [breakdownSortField, setBreakdownSortField] = useState('id');
  const [breakdownSortOrder, setBreakdownSortOrder] = useState('asc');
  const [breakdownPage, setBreakdownPage] = useState(1);
  const itemsPerPage = 5;

  const [leads, setLeads] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // API Integration states
  const [usersList, setUsersList] = useState([]);
  const [stagesList, setStagesList] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });

  // Fetch dropdown data on mount
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [usersRes, stagesRes] = await Promise.all([
          fetchCurrentUsers(),
          fetchMasterStages()
        ]);
        if (usersRes.success) setUsersList(usersRes.data || []);
        if (stagesRes.success) setStagesList(stagesRes.data || []);
      } catch (err) {
        console.error('Failed to load filter dropdown lists:', err);
      }
    };
    loadDropdownData();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load leads when query states change
  useEffect(() => {
    const loadLeadsData = async () => {
      setLeadsLoading(true);
      setLeadsError('');
      try {
        const response = await fetchLeads({
          page: currentPage,
          limit: leadsPerPage,
          search: debouncedSearch,
          owner: ownerFilter,
          stage: stageFilter,
          priority: priorityFilter,
          sortBy,
          sortOrder,
        });
        if (response.success) {
          setLeads(response.data || []);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        }
      } catch (err) {
        console.error('Failed to fetch leads:', err);
        if (err.message.includes('400')) {
          setLeadsError('Invalid filter or search parameters.');
        } else {
          setLeadsError('Something went wrong. Please try again.');
        }
      } finally {
        setLeadsLoading(false);
      }
    };
    loadLeadsData();
  }, [currentPage, leadsPerPage, debouncedSearch, ownerFilter, stageFilter, priorityFilter, sortBy, sortOrder]);

  // Load specific lead detail if ID parameter in URL
  useEffect(() => {
    if (urlLeadId) {
      const getLead = async () => {
        setLeadsLoading(true);
        setLeadsError('');
        try {
          const response = await fetchLeadById(urlLeadId);
          if (response.success && response.data) {
            setSelectedLead(response.data);
          } else {
            setLeadsError('Lead not found.');
          }
        } catch (err) {
          console.error('Failed to fetch lead by id:', err);
          setLeadsError('Lead not found.');
        } finally {
          setLeadsLoading(false);
        }
      };
      getLead();
    } else {
      setSelectedLead(null);
    }
  }, [urlLeadId]);  const handleOpenBreakdown = (title, leadsList) => {
    setBreakdownModal({ title, leads: leadsList });
    setBreakdownSearch('');
    setBreakdownOwnerFilter('');
    setBreakdownPriorityFilter('');
    setBreakdownStageFilter('');
    setBreakdownSortField('id');
    setBreakdownSortOrder('asc');
    setBreakdownPage(1);
  };
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (location.state) {
      const selectedId = location.state.selectedLeadId;
      const selectCompany = location.state.selectLeadCompany;

      if (selectedId) {
        const foundLead = leads.find(l => l.id === selectedId);
        if (foundLead) {
          setSelectedLead(foundLead);
        }
      } else if (selectCompany) {
        const foundLead = leads.find(l => l.company.toLowerCase() === selectCompany.toLowerCase());
        if (foundLead) {
          setSelectedLead(foundLead);
        } else {
          // Dynamic fallback mock lead creation with full schema compatibility
          const newMockLead = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            company: selectCompany,
            projectName: `${selectCompany} Digital Transformation`,
            contact: 'Primary KAM',
            stage: 'Qualification',
            status: 'New',
            value: '$120,000',
            industry: 'Technology',
            size: '100-500',
            region: 'North America',
            priority: 'High',
            owner: 'Sanjay Mishra',
            source: 'Web',
            score: 75,
            prob: 20,
            criteria: { bestTime: 'Morning (9 AM - 11 AM)', requirements: 'Migrating legacy system to modern cloud solutions' },
            altContact: { name: 'Support Agent', phone: '+1 555-0999', email: `info@${selectCompany.toLowerCase().replace(/\s+/g, '')}.com` },
            productService: { products: ['SalesTracker Premium'], services: ['Implementation Service'] },
            requestType: { category: 'Product Request', type: 'Enterprise CRM Software' },
            estDate: '2026-08-30',
            linkedin: { profile: 'linkedin.com/in/contact', company: `linkedin.com/company/${selectCompany.toLowerCase().replace(/\s+/g, '')}` },
            commercial: { opportunities: 1, closingValue: '$120,000', estDealValue: '$24,000', valWithTax: '$141,600', valWithoutTax: '$120,000', commPercent: '10%', commAmount: '$12,000' },
            partners: [],
            history: [{ date: '2026-06-29', action: 'Lead Created from Dashboard KPI Click', user: 'System' }]
          };
          setLeads(prevLeads => [newMockLead, ...prevLeads]);
          setSelectedLead(newMockLead);
        }
      }
      // Clear state so it doesn't re-trigger on simple re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Sync state when classificationLead is set
  useEffect(() => {
    if (classificationLead) {
      setClassStatus(classificationLead.status || 'New');
      setClassStage(classificationLead.stage || 'Qualification');
      setClassPipeline(classificationLead.pipelineType || 'enterprise');
      setClassPriority(classificationLead.priority || 'High');
      setClassSource(classificationLead.source || 'Website');
      setClassSentiment(classificationLead.sentiment || 'Positive');
      setClassLostReason(classificationLead.lostReason || classificationLead.reason || '');
    }
  }, [classificationLead]);

  const handleClassificationSave = () => {
    setLeads(prevLeads => prevLeads.map(l => 
      l.id === classificationLead.id 
      ? { 
          ...l, 
          status: classStatus,
          stage: classStage,
          pipelineType: classPipeline,
          priority: classPriority,
          source: classSource,
          sentiment: classSentiment,
          lostReason: classStatus === 'Lost' ? classLostReason : '',
          history: [{ date: new Date().toISOString().split('T')[0], action: `Classification details updated (Status: ${classStatus}, Stage: ${classStage})`, user: 'You' }, ...l.history]
        } 
      : l
    ));
    setClassificationLead(null);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      setLeads(leads.filter(l => l.id !== selectedLead.id));
      setSelectedLead(null);
    }
  };

  const mapStatusToStage = (status) => {
    switch(status) {
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

  const handleEditSave = (e) => {
    e.preventDefault();
    const updatedCompany = e.target.elements.company.value;
    const updatedContact = e.target.elements.contact.value;
    const updatedStatus = e.target.elements.status.value;
    const updatedValue = e.target.elements.value.value;
    
    // Auto map stage based on status
    const autoMappedStage = mapStatusToStage(updatedStatus);

    const newLeads = leads.map(l => 
      l.id === selectedLead.id 
      ? { 
          ...l, 
          company: updatedCompany, 
          contact: updatedContact, 
          status: updatedStatus,
          stage: autoMappedStage, 
          value: updatedValue,
          history: [{ date: new Date().toISOString().split('T')[0], action: `Status updated to ${updatedStatus}`, user: 'You' }, ...l.history]
        } 
      : l
    );
    setLeads(newLeads);
    setSelectedLead(newLeads.find(l => l.id === selectedLead.id));
    setIsEditModalOpen(false);
  };

  const getStageBadgeColor = (stage) => {
    switch(stage) {
      case 'Prospecting': return 'badge-info';
      case 'Qualification': return 'badge-warning';
      case 'Needs Analysis': return 'badge-info';
      case 'Proposal': return 'badge-warning';
      case 'Negotiation': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === 'Open' ? 'badge-success' : 'badge-warning';
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setOwnerFilter('');
    setStageFilter('');
    setPriorityFilter('');
    setCurrentPage(1);
  };

  const currentLeads = leads;
  const totalPages = pagination.totalPages;

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleExportCSV = () => {
    const headers = ['Lead ID', 'Company Name', 'KAM Name', 'Status', 'Deal Value'];
    const csvContent = [
      headers.join(','),
      ...leads.map(l => `L-${l.id.toString().padStart(4, '0')},"${l.company}","${l.contact}","${l.status}","${l.value}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'leads_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hotLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost' && (l.sentiment === 'Positive' || l.sentiment === 'Interested') && (l.priority === 'High' || l.priority === 'Urgent'));
  const coldLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost' && (l.score < 50 || l.sentiment === 'Negative' || l.sentiment === 'Not Interested'));
  const qualifiedLeads = leads.filter(l => l.stage === 'Qualification' || l.status === 'Qualified');
  const lostLeads = leads.filter(l => l.status === 'Lost' || l.stage === 'Closed Lost');

  const getFilteredBreakdownLeads = () => {
    if (!breakdownModal) return [];
    let list = [...breakdownModal.leads];

    if (breakdownSearch.trim()) {
      const q = breakdownSearch.toLowerCase();
      list = list.filter(l => 
        l.company.toLowerCase().includes(q) || 
        l.contact.toLowerCase().includes(q) ||
        `L-${l.id.toString().padStart(4, '0')}`.toLowerCase().includes(q)
      );
    }

    if (breakdownOwnerFilter) {
      list = list.filter(l => l.owner === breakdownOwnerFilter);
    }

    if (breakdownPriorityFilter) {
      list = list.filter(l => l.priority === breakdownPriorityFilter);
    }

    if (breakdownStageFilter) {
      list = list.filter(l => l.stage === breakdownStageFilter);
    }

    list.sort((a, b) => {
      let valA = a[breakdownSortField];
      let valB = b[breakdownSortField];
      
      if (breakdownSortField === 'value') {
        valA = parseInt(a.value.replace(/[^0-9]/g, ''), 10) || 0;
        valB = parseInt(b.value.replace(/[^0-9]/g, ''), 10) || 0;
      }
      
      if (valA < valB) return breakdownSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return breakdownSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  };

  return (
    <div className="leads-container">
      <div className="leads-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Leads Management</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{leads.length} leads total</span>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '14px' }}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '14px' }} onClick={() => { setIsCreatingLead(true); setSelectedLead(null); }}>
            <Plus size={14} /> New Lead
          </button>
        </div>
      </div>

      <div className="leads-content" style={{ display: 'block', height: 'auto', minHeight: 'calc(100vh - 160px)' }}>
        
        {(isCreatingLead || selectedLead) ? (
          <LeadProfile 
            lead={selectedLead}
            isEditing={isEditing}
            usersList={usersList}
            stagesList={stagesList}
            onCancel={() => { 
              setIsCreatingLead(false); 
              setSelectedLead(null); 
              setIsEditing(false); 
              navigate('/leads');
            }}
            onSave={(updatedData) => {
              if (selectedLead) {
                // Edit existing lead
                setLeads(prevLeads => prevLeads.map(l => l.id === selectedLead.id ? { ...l, ...updatedData } : l));
              } else {
                // Create new lead
                const newId = leads.length > 0 ? Math.max(...leads.map(l => l.id)) + 1 : 1;
                const newLead = {
                  id: newId,
                  createdAt: new Date().toISOString(),
                  ...updatedData
                };
                setLeads(prevLeads => [newLead, ...prevLeads]);
              }
              setIsCreatingLead(false);
              setSelectedLead(null);
              setIsEditing(false);
              navigate('/leads');
            }}
          />
        ) : (
          <>
            {/* AI Summary Card for Leads */}
            <div className="card ai-summary-premium-card">
              <div className="ai-card-glow"></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sparkles size={20} style={{ color: '#FFFFFF' }} />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'white' }}>AI Lead Health & Pipeline Assistant</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div className="ai-premium-stat-box">
                  <div className="ai-premium-stat-title">Lead Health Index</div>
                  <div className="ai-premium-stat-value" style={{ color: '#34D399' }}>88% Excellent</div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
                    <div style={{ width: '88%', height: '100%', background: '#34D399' }}></div>
                  </div>
                </div>
                <div className="ai-premium-stat-box">
                  <div className="ai-premium-stat-title">Lead Breakdown</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '13px' }}>
                    <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleOpenBreakdown('Hot Leads', hotLeads)}>🔥 {hotLeads.length} Hot Leads</span>
                    <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleOpenBreakdown('Cold Leads', coldLeads)}>❄️ {coldLeads.length} Cold Leads</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '13px' }}>
                    <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleOpenBreakdown('Qualified Leads', qualifiedLeads)}>✅ {qualifiedLeads.length} Qualified</span>
                    <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleOpenBreakdown('Lost Leads', lostLeads)}>❌ {lostLeads.length} Lost</span>
                  </div>
                </div>
                <div className="ai-premium-recommendation-box">
                  <div className="ai-premium-recommendation-title">AI Recommended Actions</div>
                  <div className="ai-premium-recommendation-text">
                    👉 **Stark Industries** is stalling in Negotiation. Schedule call to discuss the tax waiver. <br/>
                    👉 **Wayne Enterprises** has high close intent (85%). Email draft contract today.
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', backgroundColor: 'var(--color-background)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--color-border)' }}>
              {/* Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Leads</label>
                <input 
                  type="text" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="ID, company, KAM..." 
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                />
              </div>

              {/* Owner Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</label>
                <select 
                  value={ownerFilter} 
                  onChange={(e) => { setOwnerFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                >
                  <option value="">All Owners</option>
                  {usersList.map(user => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Stage Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stage</label>
                <select 
                  value={stageFilter} 
                  onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                >
                  <option value="">All Stages</option>
                  {stagesList.map(stg => (
                    <option key={stg.id} value={stg.name}>{stg.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</label>
                <select 
                  value={priorityFilter} 
                  onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Reset Button */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  onClick={handleResetFilters}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', height: '38px' }}
                >
                  <RotateCcw size={14} /> Clear Filters
                </button>
              </div>
            </div>

            <div className="card leads-table-card" style={{ height: 'calc(100vh - 160px)' }}>
            <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>Lead ID {sortBy === 'id' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('value')}>Deal Value {sortBy === 'value' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                  <th>Expected Value</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>Next Follow-up {sortBy === 'createdAt' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leadsLoading ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '48px' }}>
                      <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '12px' }}>Loading leads...</p>
                      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </td>
                  </tr>
                ) : leadsError ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-danger)' }}>
                      <p style={{ fontWeight: '500' }}>{leadsError}</p>
                    </td>
                  </tr>
                ) : currentLeads.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  currentLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className={selectedLead?.id === lead.id ? 'selected-row' : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Lead ID */}
                    <td 
                       className="font-medium" 
                       style={{ 
                         color: 'var(--color-text-muted)',
                         borderLeft: lead.isOverdue ? '4px solid var(--color-danger)' : 'none',
                         paddingLeft: lead.isOverdue ? '12px' : '16px'
                       }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{lead.id.toString().startsWith('L-') ? lead.id : `L-${lead.id.toString().padStart(4, "0")}`}</span>
                        {lead.isOverdue && <span style={{ color: 'var(--color-warning)', fontSize: '13px' }} title="Action Overdue">⚠️</span>}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="font-medium">
                      {lead.company}
                    </td>

                    {/* Contact */}
                    <td>
                      {lead.contact}
                    </td>

                    {/* Owner */}
                    <td>
                      {lead.owner || "-"}
                    </td>

                    {/* Status */}
                    <td onClick={(e) => {
                      e.stopPropagation();
                      setClassificationLead(lead);
                    }}>
                      <span className={`badge ${getStatusBadgeColor(lead.status)}`} style={{ cursor: 'pointer' }}>
                        {lead.status}
                      </span>
                    </td>

                    {/* Priority */}
                    <td>
                      <span className="badge badge-info">
                        {lead.priority || "-"}
                      </span>
                    </td>

                    {/* Deal Value */}
                    <td className="font-semibold">
                      {lead.value}
                    </td>

                    {/* Expected Value */}
                    <td>
                      {lead.commercial?.estDealValue || "-"}
                    </td>

                    {/* Next Follow-up */}
                    <td>
                      {lead.estDate || "-"}
                    </td>

                    {/* Three Dot Action Dropdown */}
                    <td style={{ position: 'relative', textAlign: 'center' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === lead.id ? null : lead.id);
                        }} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'inline-flex', color: 'var(--color-text-muted)' }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {openMenuId === lead.id && (
                        <div style={{
                          position: 'absolute',
                          right: '24px',
                          top: '32px',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-lg)',
                          zIndex: 1000,
                        }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                              setIsEditing(true);
                              setOpenMenuId(null);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              fontSize: '13px',
                              color: 'var(--color-text-main)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              width: '100%',
                              background: 'none',
                              border: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Edit2 size={14} style={{ color: 'var(--color-text-muted)' }} />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              navigate('/commercial-estimation', { state: { lead } });
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              fontSize: '13px',
                              color: 'var(--color-text-main)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              width: '100%',
                              background: 'none',
                              border: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Calculator size={14} style={{ color: 'var(--color-text-muted)' }} />
                            <span>Commercial Estimation</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              if (window.confirm('Are you sure you want to delete this lead?')) {
                                setLeads(prevLeads => prevLeads.filter(l => l.id !== lead.id));
                                if (selectedLead?.id === lead.id) setSelectedLead(null);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              fontSize: '13px',
                              color: 'var(--color-danger)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              width: '100%',
                              background: 'none',
                              border: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '16px', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '14px', border: 'none', background: 'transparent', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>&larr; Previous</button>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...Array(totalPages || 0)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ 
                    width: '32px', height: '32px', borderRadius: '4px', border: 'none', 
                    backgroundColor: currentPage === i + 1 ? 'var(--color-primary)' : 'transparent',
                    color: currentPage === i + 1 ? 'white' : 'var(--color-text-main)',
                    cursor: 'pointer', fontWeight: '500'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button onClick={handleNextPage} disabled={currentPage === (totalPages || 1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '14px', border: 'none', background: 'transparent', cursor: currentPage === (totalPages || 1) ? 'not-allowed' : 'pointer', color: currentPage === (totalPages || 1) ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>Next &rarr;</button>
            
            <select
              value={leadsPerPage}
              onChange={(e) => {
                setLeadsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>

            <span style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginLeft: '16px' }}>
              Showing {pagination.total === 0 ? 0 : (currentPage - 1) * leadsPerPage + 1}-{Math.min(currentPage * leadsPerPage, pagination.total)} of {pagination.total} leads
            </span>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Edit Lead Modal */}
      {isEditModalOpen && selectedLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Edit Lead</h3>
            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Company Name</label>
                <input name="company" type="text" defaultValue={selectedLead.company} required style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>KAM Name</label>
                <input name="contact" type="text" defaultValue={selectedLead.contact} required style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Status</label>
                <select name="status" defaultValue={selectedLead.status} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Analysis</option>
                  <option>Interested</option>
                  <option>Negotiation</option>
                  <option>Won</option>
                  <option>Lost</option>
                </select>
                <small style={{ color: 'var(--color-text-muted)' }}>Stage will automatically update based on Status</small>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Deal Value</label>
                <input name="value" type="text" defaultValue={selectedLead.value} required style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classification Popup Modal */}
      {classificationLead && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 
        }}>
          <div style={{ 
            backgroundColor: 'var(--color-surface)', padding: '24px', 
            borderRadius: 'var(--radius-lg)', width: '650px', maxWidth: '90%',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                Classification &amp; Lifecycle: {classificationLead.company}
              </h3>
              <button onClick={() => setClassificationLead(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column: Classification Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'var(--color-primary)' }}>Classification</h4>
                
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Lifecycle Template</label>
                  <select 
                    value={classPipeline} 
                    onChange={(e) => {
                      const newType = e.target.value;
                      setClassPipeline(newType);
                      setClassStage(LIFECYCLE_PIPELINES[newType].stages[0]);
                    }}
                  >
                    <option value="enterprise">Enterprise Sales</option>
                    <option value="inbound">Inbound / Self-Serve</option>
                    <option value="partner">Partner Referral</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Status</label>
                  <select 
                    value={classStatus} 
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setClassStatus(newStatus);
                      switch (newStatus) {
                        case 'New':         setClassStage('Qualification');    break;
                        case 'Contacted':   setClassStage('Initial Discussion'); break;
                        case 'Analysis':    setClassStage('Needs Analysis');    break;
                        case 'Interested':  setClassStage('Proposal');          break;
                        case 'Negotiation': setClassStage('Negotiation');       break;
                        case 'Won':         setClassStage('Closed Won');        break;
                        case 'Lost':        setClassStage('Closed Lost');       break;
                        default: break;
                      }
                    }}
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Analysis</option>
                    <option>Interested</option>
                    <option>Negotiation</option>
                    <option>Won</option>
                    <option>Lost</option>
                  </select>
                </div>

                {classStatus === 'Lost' && (
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Lost Reason *</label>
                    <input 
                      type="text" 
                      value={classLostReason} 
                      onChange={(e) => setClassLostReason(e.target.value)}
                      placeholder="e.g. Price Too High"
                      required 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Stage</label>
                  <select value={classStage} onChange={(e) => setClassStage(e.target.value)}>
                    {LIFECYCLE_PIPELINES[classPipeline]?.stages.map(stg => (
                      <option key={stg} value={stg}>{stg}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Priority</label>
                  <select value={classPriority} onChange={(e) => setClassPriority(e.target.value)}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Lead Source</label>
                  <select value={classSource} onChange={(e) => setClassSource(e.target.value)}>
                    <option>Website</option>
                    <option>Referral</option>
                    <option>Cold Call</option>
                    <option>LinkedIn</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Sentiment</label>
                  <select value={classSentiment} onChange={(e) => setClassSentiment(e.target.value)}>
                    <option>Positive</option>
                    <option>Neutral</option>
                    <option>Negative</option>
                    <option>Interested</option>
                    <option>Not Interested</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Lead Lifecycle Stepper */}
              <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Lead Lifecycle
                  <span style={{ fontSize: '11px', fontWeight: '500', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '12px' }}>
                    {LIFECYCLE_PIPELINES[classPipeline]?.name}
                  </span>
                </h4>
                
                <div className="lifecycle-stepper" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '8px' }}>
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

                  {LIFECYCLE_PIPELINES[classPipeline]?.stages.map((stg, index) => {
                    const currentStageIndex = LIFECYCLE_PIPELINES[classPipeline].stages.indexOf(classStage);
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
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      userSelect: 'none'
                    };

                    if (isCompleted) {
                      dotStyle.backgroundColor = stg === 'Closed Lost' ? 'var(--color-danger)' : 'var(--color-success)';
                      dotStyle.color = '#fff';
                      dotStyle.border = 'none';
                    } else if (isActive) {
                      if (stg === 'Closed Lost') {
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

                    return (
                      <div key={stg} style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                        <div 
                          style={dotStyle}
                          onClick={() => {
                            setClassStage(stg);
                            if (classPipeline === 'enterprise') {
                              switch (stg) {
                                case 'Qualification': setClassStatus('New'); break;
                                case 'Initial Discussion': setClassStatus('Contacted'); break;
                                case 'Needs Analysis': setClassStatus('Analysis'); break;
                                case 'Proposal': setClassStatus('Interested'); break;
                                case 'Negotiation': setClassStatus('Negotiation'); break;
                                case 'Closed Won': setClassStatus('Won'); break;
                                case 'Closed Lost': setClassStatus('Lost'); break;
                                default: break;
                              }
                            }
                          }}
                        >
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: isActive ? '600' : '500',
                          color: isActive ? (stg === 'Closed Lost' ? 'var(--color-danger)' : 'var(--color-primary)') : (isCompleted ? (stg === 'Closed Lost' ? 'var(--color-danger)' : 'var(--color-text-main)') : 'var(--color-text-muted)'),
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setClassStage(stg);
                          if (classPipeline === 'enterprise') {
                            switch (stg) {
                              case 'Qualification': setClassStatus('New'); break;
                              case 'Initial Discussion': setClassStatus('Contacted'); break;
                              case 'Needs Analysis': setClassStatus('Analysis'); break;
                              case 'Proposal': setClassStatus('Interested'); break;
                              case 'Negotiation': setClassStatus('Negotiation'); break;
                              case 'Closed Won': setClassStatus('Won'); break;
                              case 'Closed Lost': setClassStatus('Lost'); break;
                              default: break;
                            }
                          }
                        }}
                        >
                          {stg}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <button type="button" className="btn-secondary" onClick={() => setClassificationLead(null)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleClassificationSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {/* Breakdown Modal */}
      {breakdownModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 
        }}>
          <div style={{ 
            backgroundColor: 'var(--color-surface)', padding: '24px', 
            borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '1200px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
                AI Pipeline Assistant: {breakdownModal.title} ({breakdownModal.leads.length} Leads)
              </h3>
              <button onClick={() => setBreakdownModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>

            {/* Filters Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: 'var(--color-background)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              {/* Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Leads</label>
                <input 
                  type="text" 
                  value={breakdownSearch} 
                  onChange={(e) => { setBreakdownSearch(e.target.value); setBreakdownPage(1); }} 
                  placeholder="ID, company, KAM..." 
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                />
              </div>

              {/* Owner Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Owner</label>
                <select 
                  value={breakdownOwnerFilter} 
                  onChange={(e) => { setBreakdownOwnerFilter(e.target.value); setBreakdownPage(1); }}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                >
                  <option value="">All Owners</option>
                  <option value="D. Ghosh">D. Ghosh</option>
                  <option value="S. Mishra">S. Mishra</option>
                  <option value="H. Kumar">H. Kumar</option>
                  <option value="P. Sharma">P. Sharma</option>
                  <option value="R. Nair">R. Nair</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Priority</label>
                <select 
                  value={breakdownPriorityFilter} 
                  onChange={(e) => { setBreakdownPriorityFilter(e.target.value); setBreakdownPage(1); }}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Stage Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Stage</label>
                <select 
                  value={breakdownStageFilter} 
                  onChange={(e) => { setBreakdownStageFilter(e.target.value); setBreakdownPage(1); }}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                >
                  <option value="">All Stages</option>
                  <option value="Prospecting">Prospecting</option>
                  <option value="Qualification">Qualification</option>
                  <option value="Initial Discussion">Initial Discussion</option>
                  <option value="Needs Analysis">Needs Analysis</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="table-wrapper" style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1 }}>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => { setBreakdownSortField('id'); setBreakdownSortOrder(breakdownSortOrder === 'asc' ? 'desc' : 'asc'); }}>Lead ID {breakdownSortField === 'id' ? (breakdownSortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => { setBreakdownSortField('company'); setBreakdownSortOrder(breakdownSortOrder === 'asc' ? 'desc' : 'asc'); }}>Company Name {breakdownSortField === 'company' ? (breakdownSortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                    <th>KAM</th>
                    <th>Owner</th>
                    <th>Current Stage</th>
                    <th>Priority</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => { setBreakdownSortField('value'); setBreakdownSortOrder(breakdownSortOrder === 'asc' ? 'desc' : 'asc'); }}>Deal Value {breakdownSortField === 'value' ? (breakdownSortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                    <th>Expected Value</th>
                    <th>Next Follow-up</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredBreakdownLeads().slice((breakdownPage - 1) * itemsPerPage, breakdownPage * itemsPerPage).map(l => (
                    <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedLead(l); setBreakdownModal(null); }}>
                      <td style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>L-{l.id.toString().padStart(4, '0')}</td>
                      <td style={{ fontWeight: '500' }}>{l.company}</td>
                      <td>{l.contact}</td>
                      <td>{l.owner}</td>
                      <td>{l.stage}</td>
                      <td><span className="badge badge-info">{l.priority}</span></td>
                      <td className="font-semibold">{l.value}</td>
                      <td>{l.commercial?.estDealValue || '-'}</td>
                      <td>{l.estDate || '-'}</td>
                      <td><span className={`badge ${getStatusBadgeColor(l.status)}`}>{l.status}</span></td>
                      <td>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '2px 8px', fontSize: '12px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(l);
                            setBreakdownModal(null);
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {getFilteredBreakdownLeads().length === 0 && (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>No leads found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {getFilteredBreakdownLeads().length > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <button 
                  disabled={breakdownPage === 1} 
                  className="btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '13px' }}
                  onClick={() => setBreakdownPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: '13px' }}>Page {breakdownPage} of {Math.ceil(getFilteredBreakdownLeads().length / itemsPerPage)}</span>
                <button 
                  disabled={breakdownPage >= Math.ceil(getFilteredBreakdownLeads().length / itemsPerPage)} 
                  className="btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '13px' }}
                  onClick={() => setBreakdownPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <button className="btn-secondary" onClick={() => setBreakdownModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
