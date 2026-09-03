import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Mail, Calendar, MonitorPlay, Globe, Plus, X, Play, Pause, Paperclip, FileText, CheckCircle2, Clock, Sparkles, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLeads, fetchCurrentUsers, fetchActivitiesFeed, fetchActivitiesSummary, logGlobalActivity } from '../services/leadService';
import './Activities.css';

// Helper to determine icon and color class for activity types
const getActivityMeta = (type) => {
  switch (type) {
    case 'Email':
      return { icon: <Mail size={14} />, colorClass: 'email-icon' };
    case 'Call':
      return { icon: <Phone size={14} />, colorClass: 'call-icon' };
    case 'Meeting':
      return { icon: <Calendar size={14} />, colorClass: 'meeting-icon' };
    case 'Demo':
      return { icon: <MonitorPlay size={14} />, colorClass: 'demo-icon' };
    case 'LinkedIn':
      return { icon: <Globe size={14} />, colorClass: 'linkedin-icon' };
    case 'Proposal Sent':
      return { icon: <Mail size={14} />, colorClass: 'proposal-icon' };
    default:
      return { icon: <FileText size={14} />, colorClass: 'other-icon' };
  }
};

export default function Activities() {
  const [activeFilter, setActiveFilter] = useState('All Activity Types');
  const [userFilter, setUserFilter] = useState('All Users');
  const [leadFilter, setLeadFilter] = useState('All Leads');
  const [geoFilter, setGeoFilter] = useState('All Geographies');
  const [industryFilter, setIndustryFilter] = useState('All Industries');
  const [sizeFilter, setSizeFilter] = useState('All Deal Sizes');
  
  // Data states
  const [leadsList, setLeadsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activitiesData, setActivitiesData] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [typeCounts, setTypeCounts] = useState({
    all: 0,
    call: 0,
    email: 0,
    meeting: 0,
    demo: 0,
    linkedin: 0,
    proposal_sent: 0,
    other: 0,
  });
  const [summaryData, setSummaryData] = useState({
    velocity_today_logged: 0,
    velocity_today_completed: 0,
    velocity_today_planned: 0,
    overdue_count: 0,
    upcoming_count: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & Interaction states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [logModalLoading, setLogModalLoading] = useState(false);
  const [logModalError, setLogModalError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [demoProgress, setDemoProgress] = useState(0);

  // Audio / Video playback simulation
  useEffect(() => {
    let interval = null;
    if (isPlaying && selectedActivity) {
      interval = setInterval(() => {
        if (selectedActivity.type === 'Call') {
          setPlaybackTime((prev) => (prev >= 165 ? 0 : prev + 1));
        } else if (selectedActivity.type === 'Demo') {
          setDemoProgress((prev) => {
            if (prev >= 100) {
              setIsPlaying(false);
              return 0;
            }
            return prev + 4;
          });
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedActivity]);

  useEffect(() => {
    setIsPlaying(false);
    setPlaybackTime(0);
    setDemoProgress(0);
  }, [selectedActivity]);

  // AI Insights Expand state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(() => {
    const saved = sessionStorage.getItem('isAiExpanded_activities');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    sessionStorage.setItem('isAiExpanded_activities', JSON.stringify(isAiExpanded));
  }, [isAiExpanded]);

  // Load Initial Users & Leads for dropdown options
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [leadsRes, usersRes] = await Promise.allSettled([
          fetchLeads({ limit: 100 }),
          fetchCurrentUsers(),
        ]);
        if (leadsRes.status === 'fulfilled' && leadsRes.value?.success && leadsRes.value?.data) {
          setLeadsList(leadsRes.value.data);
        }
        if (usersRes.status === 'fulfilled' && usersRes.value?.success && usersRes.value?.data) {
          setUsersList(usersRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
      }
    };
    loadDropdownData();
  }, []);

  // Fetch Activities Summary Metrics
  const loadSummary = useCallback(async () => {
    try {
      const res = await fetchActivitiesSummary();
      if (res.success && res.data) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error('Failed to load activities summary:', err);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Fetch Activities Feed from Backend with Filters & Pagination
  const loadActivitiesFeed = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const query = {
        page: currentPage,
        limit: 20,
      };

      if (activeFilter && activeFilter !== 'All Activity Types' && activeFilter !== 'All') {
        query.type = activeFilter;
      }
      if (userFilter && userFilter !== 'All Users') {
        query.rep = userFilter;
      }
      if (leadFilter && leadFilter !== 'All Leads') {
        // Find matching lead ID if selected by contact/company
        const matched = leadsList.find(l => l.contact === leadFilter || l.company === leadFilter);
        if (matched) {
          query.lead_id = matched.leadId || matched.id;
        }
      }
      if (geoFilter && geoFilter !== 'All Geographies') {
        query.geography = geoFilter;
      }
      if (industryFilter && industryFilter !== 'All Industries') {
        query.industry = industryFilter;
      }
      if (sizeFilter && sizeFilter !== 'All Deal Sizes') {
        query.deal_size = sizeFilter;
      }

      const res = await fetchActivitiesFeed(query);
      if (res.success && res.data) {
        const mapped = res.data.map(item => {
          const meta = getActivityMeta(item.type);
          return {
            id: item.id,
            type: item.type,
            desc: item.desc,
            lead: item.leadName || item.company || 'Unknown Lead',
            leadId: item.leadId,
            company: item.company,
            rep: item.rep || 'System',
            time: item.timestamp ? item.timestamp.replace('T', ' ').substring(0, 16) : '',
            outcome: item.outcome || '',
            geo: item.geography || 'Unknown',
            industry: item.industry || 'Unknown',
            dealSize: item.dealSize || 'Medium',
            dueDate: item.dueDate || '',
            completed: item.completed,
            icon: meta.icon,
            colorClass: meta.colorClass,
          };
        });
        setActivitiesData(mapped);

        if (res.type_counts) {
          setTypeCounts(res.type_counts);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load activities feed:', err);
    } finally {
      setActivitiesLoading(false);
    }
  }, [currentPage, activeFilter, userFilter, leadFilter, geoFilter, industryFilter, sizeFilter, leadsList]);

  useEffect(() => {
    loadActivitiesFeed();
  }, [loadActivitiesFeed]);

  const handleRefreshAi = async () => {
    setIsAiLoading(true);
    await Promise.allSettled([loadSummary(), loadActivitiesFeed()]);
    setIsAiLoading(false);
  };

  const [activeActivityModal, setActiveActivityModal] = useState(null);
  const [actSearch, setActSearch] = useState('');
  const [actOwnerFilter, setActOwnerFilter] = useState('');
  const [actPriorityFilter, setActPriorityFilter] = useState('');
  const [actTypeFilter, setActTypeFilter] = useState('');
  const [actPage, setActPage] = useState(1);
  const actItemsPerPage = 5;
  const navigate = useNavigate();

  const handleOpenActivityModal = (title, list) => {
    setActiveActivityModal({ title, list });
    setActSearch('');
    setActOwnerFilter('');
    setActPriorityFilter('');
    setActTypeFilter('');
    setActPage(1);
  };

  const getFilteredModalActivities = () => {
    if (!activeActivityModal) return [];
    let list = [...activeActivityModal.list];

    if (actSearch.trim()) {
      const q = actSearch.toLowerCase();
      list = list.filter(a => 
        (a.company && a.company.toLowerCase().includes(q)) || 
        (a.desc && a.desc.toLowerCase().includes(q)) ||
        (a.actId && a.actId.toLowerCase().includes(q))
      );
    }

    if (actOwnerFilter) {
      list = list.filter(a => a.owner === actOwnerFilter);
    }

    if (actPriorityFilter) {
      list = list.filter(a => a.priority === actPriorityFilter);
    }

    if (actTypeFilter) {
      list = list.filter(a => a.type === actTypeFilter);
    }

    return list;
  };

  const getLeadDate = (l) => {
    return l.nextFollowUp || l.estimatedRequirementDate || l.lastContactDate || '';
  };

  const overdueActivitiesList = leadsList.filter(l => l.status !== 'Won' && l.status !== 'Lost' && getLeadDate(l) && new Date(getLeadDate(l)) < new Date()).map(l => {
    let actType = 'Call';
    let actDesc = 'Follow-up Call';
    if (l.stage === 'Proposal') { actType = 'Proposal Sent'; actDesc = 'Proposal Follow-up'; }
    if (l.stage === 'Negotiation') { actType = 'Meeting'; actDesc = 'Contract Discussion'; }
    if (l.stage === 'Needs Analysis') { actType = 'Demo'; actDesc = 'Product Demo'; }

    const diffTime = Math.abs(new Date() - new Date(getLeadDate(l)));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      actId: `ACT-${String(l.id).substring(0, 8)}`,
      leadId: l.id,
      company: l.company,
      contact: l.contact,
      type: actType,
      desc: actDesc,
      owner: l.owner,
      dueDate: getLeadDate(l),
      overdueBy: `${diffDays} Day${diffDays > 1 ? 's' : ''}`,
      diffDays,
      priority: l.priority || 'High',
      status: l.status,
      leadRaw: l
    };
  });

  const upcomingActivitiesList = leadsList.filter(l => l.status !== 'Won' && l.status !== 'Lost' && getLeadDate(l) && new Date(getLeadDate(l)) >= new Date()).map(l => {
    let actType = 'Call';
    let actDesc = 'Follow-up Call';
    if (l.stage === 'Proposal') { actType = 'Proposal Sent'; actDesc = 'Proposal Review'; }
    if (l.stage === 'Negotiation') { actType = 'Meeting'; actDesc = 'Contract Discussion'; }
    if (l.stage === 'Needs Analysis') { actType = 'Demo'; actDesc = 'Product Walkthrough'; }

    const diffTime = new Date(getLeadDate(l)) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let scheduledDate = 'This Week';
    if (diffDays === 0) scheduledDate = 'Today';
    else if (diffDays === 1) scheduledDate = 'Tomorrow';
    else if (diffDays > 7) scheduledDate = 'Next Week';

    return {
      actId: `ACT-${String(l.id).substring(0, 8)}`,
      leadId: l.id,
      company: l.company,
      contact: l.contact,
      type: actType,
      desc: actDesc,
      owner: l.owner,
      scheduledDate,
      scheduledDateRaw: getLeadDate(l),
      scheduledTime: '10:00 AM',
      priority: l.priority || 'Normal',
      status: l.status,
      leadRaw: l
    };
  });

  const uniqueUsers = usersList.length > 0
    ? Array.from(new Set(usersList.map(u => u.name))).filter(Boolean).sort()
    : Array.from(new Set(leadsList.map(l => l.owner))).filter(Boolean).sort();
  const uniqueLeads = Array.from(new Set(leadsList.map(l => l.contact))).filter(Boolean).sort();
  const uniqueGeos = ['North America', 'Europe', 'Asia Pacific', 'LATAM', 'India'];
  const uniqueIndustries = ['Retail', 'Defence', 'Consulting', 'E-commerce', 'Banking', 'Technology', 'Logistics', 'Healthcare', 'Finance', 'IT Services', 'Education', 'Manufacturing', 'Real Estate'];

  const pillTypes = [
    { name: 'All', value: 'All Activity Types', countKey: 'all' },
    { name: 'Call', value: 'Call', countKey: 'call' },
    { name: 'Email', value: 'Email', countKey: 'email' },
    { name: 'Meeting', value: 'Meeting', countKey: 'meeting' },
    { name: 'Demo', value: 'Demo', countKey: 'demo' },
    { name: 'LinkedIn', value: 'LinkedIn', countKey: 'linkedin' },
    { name: 'Proposal Sent', value: 'Proposal Sent', countKey: 'proposal_sent' },
    { name: 'Other', value: 'Other', countKey: 'other' }
  ];

  const getPillCount = (countKey) => {
    return typeCounts[countKey] || 0;
  };

  const handleLogActivity = async (e) => {
    e.preventDefault();
    setLogModalLoading(true);
    setLogModalError('');
    try {
      const form = e.target;
      const type = form.elements.type.value;
      const lead = form.elements.lead.value;
      const desc = form.elements.desc.value;
      const outcome = form.elements.outcome?.value || '';
      const dueDate = form.elements.dueDate?.value || '';

      await logGlobalActivity({
        type,
        lead,
        desc,
        outcome: outcome || undefined,
        dueDate: dueDate || undefined,
      });

      setIsActivityModalOpen(false);
      form.reset();
      setCurrentPage(1);
      await Promise.allSettled([loadActivitiesFeed(), loadSummary()]);
    } catch (err) {
      console.error('Failed to log activity:', err);
      setLogModalError(err.message || 'Failed to log activity.');
    } finally {
      setLogModalLoading(false);
    }
  };

  return (
    <div className="activities-container">
      <div className="activities-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Activities Timeline</h1>
        <button 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '14px' }} 
          onClick={() => { setLogModalError(''); setIsActivityModalOpen(true); }}
        >
          <Plus size={14} /> Log Activity
        </button>
      </div>

      {/* AI Summary Card for Activities */}
      <div className="card ai-summary-premium-card">
        <div className="ai-card-glow"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: '#FFFFFF' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'white' }}>AI Productivity Assistant</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={handleRefreshAi} 
              disabled={isAiLoading} 
              title="Refresh AI Insights"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#FFFFFF' }}
            >
              <RefreshCw size={18} style={{ animation: isAiLoading ? 'rotateSparkle 1.5s infinite linear' : 'none' }} />
            </button>
            <button 
              onClick={() => setIsAiExpanded(!isAiExpanded)} 
              title={isAiExpanded ? "Collapse Insights" : "Expand Insights"}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#FFFFFF' }}
            >
              {isAiExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        <div 
          style={{ 
            maxHeight: isAiExpanded ? '500px' : '0px', 
            overflow: 'hidden', 
            transition: 'max-height 300ms ease-in-out, opacity 300ms ease-in-out, padding 300ms ease-in-out',
            opacity: isAiExpanded ? 1 : 0
          }}
        >
          {isAiLoading ? (
            <div className="ai-skeleton-loader" style={{ padding: '16px 0' }}>
              <div className="skeleton-item" style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px', width: '80%' }}></div>
              <div className="skeleton-item" style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px', width: '60%' }}></div>
              <div className="skeleton-item" style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '40%' }}></div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingTop: '16px' }}>
              <div className="ai-premium-stat-box">
                <div className="ai-premium-stat-title">Today's Velocity</div>
                <div className="ai-premium-stat-value" style={{ color: '#34D399' }}>{summaryData.velocity_today_logged} Logged</div>
                <div className="ai-premium-stat-desc">{summaryData.velocity_today_completed} Completed · {summaryData.velocity_today_planned} Planned</div>
              </div>
              <div className="ai-premium-stat-box">
                <div className="ai-premium-stat-title">Tasks Health</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px' }}>
                  <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleOpenActivityModal('Overdue Tasks', overdueActivitiesList)}>⚠️ {summaryData.overdue_count || overdueActivitiesList.length} Overdue</span>
                  <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleOpenActivityModal('Upcoming Tasks', upcomingActivitiesList)}>📅 {summaryData.upcoming_count || upcomingActivitiesList.length} Upcoming</span>
                </div>
              </div>
              <div className="ai-premium-recommendation-box">
                <div className="ai-premium-recommendation-title">AI Performance Recommendation</div>
                <div className="ai-premium-recommendation-text">
                  ⚡ **Follow-up Velocity is Key:** Your team average response speed is consistent. Engage leads within 24 hours of demonstration to improve win rates across pipeline stages.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Filter Dropdowns */}
      <div className="activities-filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', backgroundColor: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        {/* Search by User */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search by User</label>
          <select 
            value={userFilter} 
            onChange={(e) => { setUserFilter(e.target.value); setCurrentPage(1); }} 
            className="activities-select" 
            style={{ width: '100%', minWidth: 'auto', padding: '8px 12px' }}
          >
            <option>All Users</option>
            {uniqueUsers.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>

        {/* Lead Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lead Name</label>
          <select 
            value={leadFilter} 
            onChange={(e) => { setLeadFilter(e.target.value); setCurrentPage(1); }} 
            className="activities-select" 
            style={{ width: '100%', minWidth: 'auto', padding: '8px 12px' }}
          >
            <option>All Leads</option>
            {uniqueLeads.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Geography */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Geography</label>
          <select 
            value={geoFilter} 
            onChange={(e) => { setGeoFilter(e.target.value); setCurrentPage(1); }} 
            className="activities-select" 
            style={{ width: '100%', minWidth: 'auto', padding: '8px 12px' }}
          >
            <option>All Geographies</option>
            {uniqueGeos.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        {/* Industry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Industry</label>
          <select 
            value={industryFilter} 
            onChange={(e) => { setIndustryFilter(e.target.value); setCurrentPage(1); }} 
            className="activities-select" 
            style={{ width: '100%', minWidth: 'auto', padding: '8px 12px' }}
          >
            <option>All Industries</option>
            {uniqueIndustries.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>

        {/* Deal Size */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deal Size</label>
          <select 
            value={sizeFilter} 
            onChange={(e) => { setSizeFilter(e.target.value); setCurrentPage(1); }} 
            className="activities-select" 
            style={{ width: '100%', minWidth: 'auto', padding: '8px 12px' }}
          >
            <option>All Deal Sizes</option>
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </div>
      </div>

      {/* Activities Timeline list (main card) */}
      <div className="activities-main-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)', margin: '0 0 16px 0' }}>Activity Log</h2>
        
        {/* Filter Pills inside card */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '26px' }}>
          {pillTypes.map(pill => {
            const isSelected = activeFilter === pill.value;
            const count = getPillCount(pill.countKey);
            return (
              <button 
                key={pill.name} 
                onClick={() => { setActiveFilter(pill.value); setCurrentPage(1); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '24px',
                  border: isSelected ? 'none' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isSelected ? 'white' : 'var(--color-text-muted)',
                  fontWeight: '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{pill.name}</span>
                <span style={{ 
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : '#F1F5F9', 
                  color: isSelected ? 'white' : 'var(--color-text-muted)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginLeft: '2px'
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="global-timeline-container">
          <div className="timeline-line"></div>
          {activitiesLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Loading activities...
            </div>
          ) : activitiesData.length > 0 ? (
            activitiesData.map(activity => {
              const isInteractive = true;
              return (
                <div key={activity.id} className="global-timeline-item">
                  <div className={`timeline-circle ${activity.colorClass}`}>
                    {activity.icon}
                  </div>
                  <div 
                    className={`timeline-item-card ${isInteractive ? 'interactive' : ''}`}
                    onClick={() => isInteractive && setSelectedActivity(activity)}
                  >
                    <div className="timeline-item-header">
                      <div>
                        <span className="timeline-item-type">{activity.type}</span> with <span className="timeline-item-lead">{activity.lead}</span>
                      </div>
                      <span className="timeline-item-time">{activity.time}</span>
                    </div>
                    <div className="timeline-item-rep">Logged by {activity.rep}</div>
                    
                    <div className="timeline-item-desc">
                      {activity.desc}
                    </div>
                    
                    {activity.outcome && (
                      <div className="timeline-item-outcome">
                        Outcome: {activity.outcome}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-activities">
              <p>No activities found matching the selected filters.</p>
            </div>
          )}
        </div>

        {/* Server Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total activities)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-secondary" 
                disabled={currentPage <= 1 || activitiesLoading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '13px' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button 
                className="btn-secondary" 
                disabled={currentPage >= pagination.totalPages || activitiesLoading}
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '13px' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log New Activity Modal */}
      {isActivityModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log New Activity</h3>
              <button className="icon-btn" onClick={() => setIsActivityModalOpen(false)}><X size={20} /></button>
            </div>
            {logModalError && (
              <div style={{ color: 'var(--color-danger)', padding: '12px 24px 0', fontSize: '13px', fontWeight: '500' }}>
                ❌ {logModalError}
              </div>
            )}
            <form onSubmit={handleLogActivity} className="modal-form">
              <div className="form-group">
                <label>Activity Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select name="type" required defaultValue="Call">
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Demo">Demo</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Lead / Company <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input name="lead" type="text" required placeholder="e.g. Acme Corp or Contact Name" />
              </div>
              <div className="form-group">
                <label>Description <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea name="desc" required placeholder="What happened in this activity?" rows={3}></textarea>
              </div>
              <div className="form-group">
                <label>Outcome</label>
                <input name="outcome" type="text" placeholder="e.g. Scheduled Demo, Follow-up agreed" />
              </div>
              <div className="form-group">
                <label>Due / Follow-up Date</label>
                <input name="dueDate" type="date" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" disabled={logModalLoading} onClick={() => setIsActivityModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={logModalLoading}>
                  {logModalLoading ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Activity Details Modal */}
      {selectedActivity && (
        <div className="detail-modal-overlay" onClick={() => setSelectedActivity(null)}>
          <div className="detail-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div className="detail-modal-title">
                <div className={`timeline-circle ${selectedActivity.colorClass}`} style={{ boxShadow: 'none' }}>
                  {selectedActivity.icon}
                </div>
                <div>
                  <h3 className="detail-modal-title-text">{selectedActivity.type} Detail</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>ID: #{selectedActivity.id}</span>
                </div>
              </div>
              <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => setSelectedActivity(null)}><X size={20} /></button>
            </div>

            <div className="detail-modal-body">
              {/* Metadata Grid */}
              <div className="detail-meta-grid">
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Associated Lead</span>
                  <span className="detail-meta-value" style={{ color: '#4F46E5', fontWeight: '600' }}>{selectedActivity.lead}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Logged By</span>
                  <span className="detail-meta-value">{selectedActivity.rep}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Date & Time</span>
                  <span className="detail-meta-value">{selectedActivity.time}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Outcome</span>
                  <div className="detail-meta-value">
                    <span style={{
                      backgroundColor: '#EEF2FF',
                      color: '#4F46E5',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>{selectedActivity.outcome || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Detail Content depending on Activity Type */}
              {selectedActivity.type === 'Email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="email-thread-box">
                    <div className="email-thread-header">
                      <div><strong>From:</strong> {selectedActivity.rep === 'You' ? 'sales@pmrg.com' : `${String(selectedActivity.rep).toLowerCase().replace(' ', '.')}@pmrg.com`}</div>
                      <div><strong>To:</strong> contact@{String(selectedActivity.lead).toLowerCase().replace(' ', '')}.com</div>
                      <div className="email-thread-subject"><strong>Subject:</strong> {selectedActivity.desc}</div>
                    </div>
                    <div className="email-thread-body">
                      {`Hi Team,

Thanks for taking the time to speak with us. As discussed, I am sharing the updated pricing and catalog details regarding your query for ${selectedActivity.lead}.

We would love to set up a follow-up discussion to go through the custom deployment. Let me know what times work best for you next week.

Best regards,
${selectedActivity.rep}`}
                    </div>
                    <div className="email-attachments">
                      <Paperclip size={14} />
                      <span>Attachments (1):</span>
                      <div className="attachment-chip">
                        <FileText size={14} style={{ color: '#4F46E5' }} />
                        <span>PMRG_Enterprise_Proposal.pdf (1.8 MB)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => alert('Reply simulation started!')}>Reply</button>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => alert('Email resent successfully!')}>Resend Email</button>
                  </div>
                </div>
              )}

              {selectedActivity.type === 'Call' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-main)' }}>Recording & Audio Transcript</div>
                  
                  {/* Call Audio Player Simulation */}
                  <div className="call-player-container">
                    <div className="player-info">
                      <span>Recorded Call Segment</span>
                      <span>Duration: 02:45</span>
                    </div>
                    
                    <div className="waveform-mock">
                      {Array.from({ length: 28 }).map((_, idx) => {
                        const heights = [20, 35, 15, 40, 25, 45, 10, 30, 20, 35, 48, 15, 25, 30, 40, 15, 25, 35, 45, 10, 25, 35, 15, 40, 25, 30, 15, 20];
                        const barHeight = heights[idx] || 25;
                        const isActive = isPlaying && (playbackTime % 28) >= idx;
                        return (
                          <div 
                            key={idx} 
                            className={`waveform-bar ${isActive ? 'active' : ''}`} 
                            style={{ height: `${barHeight}%` }}
                          />
                        );
                      })}
                    </div>
                    
                    <div className="player-controls">
                      <button className="play-pause-btn" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: '2px' }} />}
                      </button>
                      <div className="player-time">
                        {`00:${playbackTime < 10 ? '0' + playbackTime : playbackTime} / 02:45`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', backgroundColor: '#1E293B', padding: '4px 8px', borderRadius: '4px' }}>
                        Sentiment: <span style={{ color: '#10B981', fontWeight: 'bold' }}>Positive</span>
                      </div>
                    </div>
                  </div>

                  {/* Conversation Summary Notes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-main)' }}>Key Points Highlighted:</span>
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '14px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="checklist-item">
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                        <span>Lead expressed strong interest in workflow automation solutions.</span>
                      </div>
                      <div className="checklist-item">
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                        <span>Identified key decision makers: Lead VP of Tech & Regional Director.</span>
                      </div>
                      <div className="checklist-item">
                        <Clock size={14} style={{ color: '#F59E0B' }} />
                        <span>Next Step: Deliver tailored sandboxed environment details by next Friday.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedActivity.type === 'Demo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-main)' }}>Demo Playback & Presentation Deck</div>
                  
                  {/* Demo Video Player Simulation */}
                  <div className="demo-player-container">
                    {!isPlaying ? (
                      <div className="demo-video-placeholder">
                        <MonitorPlay size={48} style={{ color: '#818CF8' }} />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Demo Session with {selectedActivity.lead}</span>
                        <button className="demo-play-btn" onClick={() => setIsPlaying(true)}>
                          <Play size={20} fill="white" style={{ marginLeft: '3px' }} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {/* Mock Screen Share Interface */}
                        <div style={{ 
                          position: 'absolute', 
                          top: 0, left: 0, right: 0, bottom: 0,
                          background: 'radial-gradient(circle, #312E81 0%, #111827 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '24px'
                        }}>
                          <div style={{ border: '2px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '20px', width: '80%', backgroundColor: 'rgba(0,0,0,0.4)', textAlign: 'center' }}>
                            <Globe size={32} style={{ color: '#818CF8', marginBottom: '8px' }} />
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>Sales Platform Demonstration</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Sharing Screen - {selectedActivity.rep}</div>
                          </div>
                        </div>
                        
                        <div className="demo-progress-bar">
                          <div className="demo-progress-fill" style={{ width: `${demoProgress}%` }} />
                        </div>
                        
                        <div className="demo-video-hud">
                          <button 
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                            onClick={() => setIsPlaying(false)}
                          >
                            <Pause size={14} fill="white" />
                          </button>
                          <span>{`00:${demoProgress < 10 ? '0' + Math.floor(demoProgress/4) : Math.floor(demoProgress/4)} / 00:25`}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Checklist of Covered Features */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '8px' }}>Features Demonstrated:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <div className="checklist-item">
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                        <span>Interactive Lifecycle Pipelines</span>
                      </div>
                      <div className="checklist-item">
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                        <span>Custom Stepper Stages</span>
                      </div>
                      <div className="checklist-item">
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                        <span>Multi-factor Filters</span>
                      </div>
                      <div className="checklist-item">
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                        <span>Deal Size & Geo Segments</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedActivity.type === 'Meeting' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-main)' }}>Meeting Overview & Agenda</div>
                  
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Meeting Type</span>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-main)', marginTop: '2px' }}>Client Strategy Session</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Summary of Discussion</span>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-main)', marginTop: '4px', lineHeight: '1.5' }}>
                        {selectedActivity.desc}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-main)' }}>Action Items Checklist:</span>
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '14px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="checklist-item">
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                        <span>Delivered enterprise architectural diagram walkthrough.</span>
                      </div>
                      <div className="checklist-item">
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                        <span>Addressed data localization and security compliance queries.</span>
                      </div>
                      <div className="checklist-item">
                        <Clock size={14} style={{ color: '#F59E0B' }} />
                        <span>Next follow-up planned within upcoming milestone timeline.</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => alert('Calendar event logged!')}>View in Calendar</button>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => alert('Thank you note sent to client!')}>Send Thank You Note</button>
                  </div>
                </div>
              )}

              {selectedActivity.type === 'LinkedIn' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-main)' }}>LinkedIn Connect Message</div>
                  
                  <div className="email-thread-box">
                    <div className="email-thread-header" style={{ backgroundColor: '#F0F9FF' }}>
                      <div style={{ color: '#0369A1', fontWeight: '600' }}>LinkedIn Direct Message Thread</div>
                      <div><strong>To:</strong> contact@{String(selectedActivity.lead).toLowerCase().replace(' ', '')}.com</div>
                    </div>
                    <div className="email-thread-body" style={{ fontStyle: 'italic', color: '#334155' }}>
                      {selectedActivity.desc}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#0077B5', border: 'none' }} onClick={() => window.open('https://linkedin.com', '_blank')}>
                      Open LinkedIn Profile
                    </button>
                  </div>
                </div>
              )}

              {selectedActivity.type === 'Proposal Sent' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-main)' }}>Proposal Details</div>
                  
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '16px', backgroundColor: '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-text-main)' }}>Commercial Proposal Document</span>
                      <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Delivered</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                      {selectedActivity.desc}
                    </div>
                  </div>

                  <div className="email-attachments">
                    <Paperclip size={14} />
                    <span>Attached Document:</span>
                    <div className="attachment-chip">
                      <FileText size={14} style={{ color: '#059669' }} />
                      <span>Commercial_Proposal_{String(selectedActivity.lead).replace(' ', '_')}.pdf (2.4 MB)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => alert('SLA document generated!')}>Edit Document</button>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => alert('Proposal approved and status updated!')}>Mark as Approved</button>
                  </div>
                </div>
              )}

              {!['Email', 'Call', 'Demo', 'Meeting', 'LinkedIn', 'Proposal Sent'].includes(selectedActivity.type) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-main)' }}>Activity Log Entry Details</div>
                  
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '16px', fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text-main)' }}>
                    {selectedActivity.desc}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => alert('Task generated successfully!')}>Convert to Task</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Drill-down Modal for Tasks Health */}
      {activeActivityModal && (
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
                AI Productivity Assistant: {activeActivityModal.title} ({activeActivityModal.list.length} Items)
              </h3>
              <button onClick={() => setActiveActivityModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>

            {/* Filters Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: 'var(--color-background)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              {/* Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Activities</label>
                <input 
                  type="text" 
                  value={actSearch} 
                  onChange={(e) => { setActSearch(e.target.value); setActPage(1); }} 
                  placeholder="Company, description..." 
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                />
              </div>

              {/* Owner Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Owner</label>
                <select 
                  value={actOwnerFilter} 
                  onChange={(e) => { setActOwnerFilter(e.target.value); setActPage(1); }}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                >
                  <option value="">All Owners</option>
                  {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Priority Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Priority</label>
                <select 
                  value={actPriorityFilter} 
                  onChange={(e) => { setActPriorityFilter(e.target.value); setActPage(1); }}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Type Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Type</label>
                <select 
                  value={actTypeFilter} 
                  onChange={(e) => { setActTypeFilter(e.target.value); setActPage(1); }}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                >
                  <option value="">All Types</option>
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Demo">Demo</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="table-wrapper" style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  {activeActivityModal.title === 'Overdue Tasks' ? (
                    <tr>
                      <th>Activity ID</th>
                      <th>Lead ID</th>
                      <th>Company Name</th>
                      <th>Activity Type</th>
                      <th>Assigned Owner</th>
                      <th>Due Date</th>
                      <th>Overdue By</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Activity ID</th>
                      <th>Lead ID</th>
                      <th>Company Name</th>
                      <th>Activity Type</th>
                      <th>Assigned Owner</th>
                      <th>Scheduled Date</th>
                      <th>Scheduled Time</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {getFilteredModalActivities().slice((actPage - 1) * actItemsPerPage, actPage * actItemsPerPage).map(a => {
                    const isOverdueView = activeActivityModal.title === 'Overdue Tasks';
                    return (
                      <tr key={a.actId} style={{ cursor: 'pointer' }} onClick={() => navigate('/leads', { state: { selectedLeadId: a.leadRaw.id } })}>
                        <td style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{a.actId}</td>
                        <td style={{ color: 'var(--color-text-muted)', fontWeight: 'bold' }}>{a.leadId}</td>
                        <td style={{ fontWeight: '500' }}>{a.company}</td>
                        <td>{a.type}</td>
                        <td>{a.owner}</td>
                        {isOverdueView ? (
                          <>
                            <td>{a.dueDate}</td>
                            <td>
                              {a.diffDays <= 1 && <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>1 Day</span>}
                              {a.diffDays === 2 && <span style={{ backgroundColor: '#FFEDD5', color: '#EA580C', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>2 Days</span>}
                              {a.diffDays > 2 && a.diffDays <= 5 && <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{a.diffDays} Days</span>}
                              {a.diffDays > 5 && <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>7+ Days</span>}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <span className={`badge ${a.scheduledDate === 'Today' ? 'badge-danger' : a.scheduledDate === 'Tomorrow' ? 'badge-warning' : 'badge-info'}`}>
                                {a.scheduledDate}
                              </span>
                            </td>
                            <td>{a.scheduledTime}</td>
                          </>
                        )}
                        <td><span className="badge badge-info">{a.priority}</span></td>
                        <td><span className="badge badge-success">{a.status}</span></td>
                        <td>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '2px 8px', fontSize: '12px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/leads', { state: { selectedLeadId: a.leadRaw.id } });
                            }}
                          >
                            Open Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {getFilteredModalActivities().length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>No activities found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {getFilteredModalActivities().length > actItemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <button 
                  disabled={actPage === 1} 
                  className="btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '13px' }}
                  onClick={() => setActPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: '13px' }}>Page {actPage} of {Math.ceil(getFilteredModalActivities().length / actItemsPerPage)}</span>
                <button 
                  disabled={actPage >= Math.ceil(getFilteredModalActivities().length / actItemsPerPage)} 
                  className="btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '13px' }}
                  onClick={() => setActPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <button className="btn-secondary" onClick={() => setActiveActivityModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
