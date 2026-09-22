import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Phone, 
  Mail, 
  Calendar, 
  MonitorPlay, 
  Globe, 
  Plus, 
  X, 
  Play, 
  Pause, 
  Paperclip, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Send,
  Check,
  CheckSquare,
  Square,
  User,
  Building,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchLeads, 
  fetchActivitiesFeed, 
  fetchActivitiesSummary, 
  logGlobalActivity,
  completeActivity 
} from '../services/leadService';
import { normalizeError } from '../services/apiError';
import { useToast } from '../context/FeedbackContext';
import { useMasterData } from '../context/MasterDataContext';
import { SkeletonCard, SkeletonBlock, SkeletonText } from '../components/common/Skeleton';
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
      return { icon: <CheckCircle2 size={14} />, colorClass: 'task-icon' };
  }
};

// Email Templates Presets
const EMAIL_TEMPLATES = [
  {
    name: 'Introduction & Value Prop',
    subject: 'Accelerating Revenue Operations with PMRG Sales Tracker',
    body: `Hi {contact},

I noticed {company} is scaling its B2B revenue and sales operations. 

PMRG Sales Tracker provides an automated CRM with AI forecasting, real-time pipeline visualization, and commercial estimations tailored to high-growth teams.

Would you be open to a brief 10-minute discovery discussion next week?

Best regards,\nPMRG Sales Team`
  },
  {
    name: 'Post-Call Follow-up',
    subject: 'Summary of our discussion & Next Steps for {company}',
    body: `Hi {contact},

Thank you for taking the time to speak with us today regarding {company}'s CRM and revenue pipeline requirements.

As discussed, I am attaching our platform overview and enterprise security documentation. Let's reconnect for the live architecture demonstration.

Best regards,\nPMRG Sales Team`
  },
  {
    name: 'Demo Invitation & Deck',
    subject: 'Live Platform Walkthrough Invitation: PMRG Sales Tracker',
    body: `Hi {contact},

Following up on our conversation, I'd like to invite you and your team to a customized demonstration of PMRG Sales Tracker.

We'll cover automated lead scoring, revenue forecasting models, and commercial quote builders. Let me know what time works best for you!

Best regards,\nPMRG Sales Team`
  },
  {
    name: 'Commercial Proposal Follow-up',
    subject: 'Commercial Proposal & Custom Deployment Plan for {company}',
    body: `Hi {contact},

I am pleased to share the tailored commercial estimation and proposal for {company}.

Our package includes full platform access, dedicated SLA support, and seamless CRM data migration. Please let me know if you have any questions.

Best regards,\nPMRG Sales Team`
  }
];

export default function Activities() {
  const { usersList: masterUsersList } = useMasterData();
  const showToast = useToast();
  const navigate = useNavigate();

  // Filters
  const [activeFilter, setActiveFilter] = useState('All Activity Types');
  const [userFilter, setUserFilter] = useState('All Users');
  const [leadFilter, setLeadFilter] = useState('All Leads');
  const [geoFilter, setGeoFilter] = useState('All Geographies');
  const [industryFilter, setIndustryFilter] = useState('All Industries');
  const [sizeFilter, setSizeFilter] = useState('All Deal Sizes');
  
  // Data states
  const [leadsList, setLeadsList] = useState([]);
  const usersList = masterUsersList;
  const [activitiesData, setActivitiesData] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);
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

  // Selected Activity Details Modal & Playback states
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [demoProgress, setDemoProgress] = useState(0);

  // =========================================================================
  // Automation & Initiation Hub State
  // =========================================================================
  const [initiateModal, setInitiateModal] = useState({
    isOpen: false,
    type: 'Call', // 'Call' | 'Email' | 'Meeting' | 'Demo' | 'LinkedIn' | 'Proposal Sent' | 'Task' | 'Other'
    leadId: '',
    leadName: '',
    company: '',
    contact: '',
    phone: '',
    email: '',
    subject: '',
    desc: '',
    outcome: '',
    dueDate: '',
    meetingPlatform: 'Google Meet',
    callOutcome: 'Connected - Follow-up Requested',
    callDuration: '10 mins',
    demoType: 'Full Platform Tour',
    proposalValue: '$15,000',
    isCustomLead: false,
  });
  const [initiateLoading, setInitiateLoading] = useState(false);
  const [initiateError, setInitiateError] = useState('');

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

  // Parallelized initial data loading on mount
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [leadsRes, summaryRes] = await Promise.all([
          fetchLeads({ limit: 100 }),
          fetchActivitiesSummary()
        ]);
        if (isMounted) {
          if (leadsRes) {
            const lData = leadsRes.data || leadsRes.leads || (Array.isArray(leadsRes) ? leadsRes : []);
            if (Array.isArray(lData) && lData.length > 0) {
              setLeadsList(lData);
            }
          }
          if (summaryRes) {
            const sData = summaryRes.data || summaryRes;
            if (sData) {
              setSummaryData(sData);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial activities data:', err);
      }
    };
    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  // Fetch Activities Summary Metrics
  const loadSummary = useCallback(async () => {
    try {
      const res = await fetchActivitiesSummary();
      const sData = res?.data || res;
      if (sData) {
        setSummaryData(sData);
      }
    } catch (err) {
      console.error('Failed to load activities summary:', err);
    }
  }, []);

  // Fetch Activities Feed from Backend with Filters & Pagination
  const loadActivitiesFeed = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
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
      setActivitiesError(normalizeError(err, 'Failed to load activity feed.'));
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

  // Toggle Activity Completion directly in Database
  const handleToggleComplete = async (activityId, currentStatus, e) => {
    if (e) e.stopPropagation();
    try {
      await completeActivity(activityId, !currentStatus);
      showToast(`✓ Activity marked as ${!currentStatus ? 'Completed' : 'Open'} in database!`, 'success');
      await Promise.allSettled([loadActivitiesFeed(), loadSummary()]);
    } catch (err) {
      console.error('Failed to update activity status:', err);
      showToast(err.message || 'Failed to update activity completion.', 'error');
    }
  };

  // Comprehensive selectable leads: combination of backend leadsList and feed activity entities
  const allSelectableLeads = useMemo(() => {
    const map = new Map();
    if (Array.isArray(leadsList)) {
      leadsList.forEach(l => {
        const id = String(l.leadId || l.id || l.company || l.contact);
        if (id && !map.has(id)) {
          map.set(id, {
            id: l.leadId || l.id,
            leadId: l.leadId || l.id,
            company: l.company || l.name || '',
            contact: l.contact || l.name || '',
            phone: l.phone || l.officePhone || '',
            email: l.email || '',
            stage: l.stage || 'Lead',
          });
        }
      });
    }
    if (Array.isArray(activitiesData)) {
      activitiesData.forEach(a => {
        const name = a.company || a.lead;
        const id = String(a.leadId || name);
        if (id && name && name !== 'Unknown Lead' && !map.has(id)) {
          map.set(id, {
            id: a.leadId || id,
            leadId: a.leadId || id,
            company: a.company || a.lead,
            contact: a.lead || a.company,
            phone: '',
            email: '',
            stage: 'Active',
          });
        }
      });
    }
    return Array.from(map.values());
  }, [leadsList, activitiesData]);

  // Open the Tailored Action Initiation Modal
  const handleOpenInitiate = (type, targetLead = null) => {
    setInitiateError('');
    const leadObj = targetLead;

    const leadId = leadObj ? String(leadObj.leadId || leadObj.id || '') : '';
    const company = leadObj?.company || '';
    const contact = leadObj?.contact || leadObj?.name || '';
    const phone = leadObj?.phone || leadObj?.officePhone || '';
    const email = leadObj?.email || '';

    let defaultSubject = '';
    let defaultDesc = '';
    let defaultOutcome = '';
    let defaultDueDate = '';

    const displayName = contact || company || '';

    if (type === 'Call') {
      defaultSubject = displayName ? `Call with ${displayName}` : 'Discovery Call';
      defaultDesc = displayName ? `Conducted discovery call with ${displayName} regarding software requirements.` : 'Conducted discovery call regarding software requirements.';
      defaultOutcome = 'Connected - Follow-up Requested';
    } else if (type === 'Email') {
      defaultSubject = company ? `PMRG Solution for ${company}` : 'PMRG Revenue Acceleration Solution';
      defaultDesc = displayName ? `Sent introductory value proposition email to ${displayName}.` : 'Sent introductory value proposition email.';
      defaultOutcome = 'Email Delivered';
    } else if (type === 'Meeting') {
      defaultSubject = company ? `Strategy & Architecture Review with ${company}` : 'Strategy & Architecture Review';
      defaultDesc = displayName ? `Scheduled virtual consultation with ${displayName} and decision makers.` : 'Scheduled virtual consultation via Google Meet with decision makers.';
      defaultOutcome = 'Meeting Confirmed';
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      defaultDueDate = tmrw.toISOString().split('T')[0];
    } else if (type === 'Demo') {
      defaultSubject = company ? `Product Demonstration with ${company}` : 'Platform Product Demonstration';
      defaultDesc = displayName ? `Demonstrated live pipeline management and tools to ${displayName}.` : 'Demonstrated live pipeline management and commercial estimation tools.';
      defaultOutcome = 'Demo Completed Successfully';
    } else if (type === 'LinkedIn') {
      defaultSubject = displayName ? `LinkedIn Outreach to ${displayName}` : 'LinkedIn Outreach Message';
      defaultDesc = displayName ? `Connected and shared product overview note with ${displayName} on LinkedIn.` : 'Connected and shared product overview note on LinkedIn.';
      defaultOutcome = 'InMail Sent';
    } else if (type === 'Proposal Sent') {
      defaultSubject = company ? `Enterprise Commercial Proposal for ${company}` : 'Enterprise Commercial Proposal';
      defaultDesc = company ? `Dispatched commercial quotation with volume breakdown to ${company}.` : 'Dispatched commercial quotation with volume discount breakdown.';
      defaultOutcome = 'Proposal Under Client Review';
    } else {
      defaultSubject = company ? `Follow-up Task for ${company}` : 'Follow-up Action Task';
      defaultDesc = displayName ? `Follow up on open action items with ${displayName}.` : 'Follow up on open action items and review requirements.';
      defaultOutcome = 'Task Open';
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 3);
      defaultDueDate = nextWeek.toISOString().split('T')[0];
    }

    setInitiateModal({
      isOpen: true,
      type,
      leadId,
      leadName: displayName,
      company,
      contact,
      phone,
      email,
      isCustomLead: false,
      subject: defaultSubject,
      desc: defaultDesc,
      outcome: defaultOutcome,
      dueDate: defaultDueDate,
      meetingPlatform: 'Google Meet',
      callOutcome: 'Connected - Follow-up Requested',
      callDuration: '10 mins',
      demoType: 'Full Platform Tour',
      proposalValue: '$15,000',
    });
  };

  // Lead selection change inside initiation modal
  const handleInitiateLeadChange = (leadIdValue) => {
    if (!leadIdValue) {
      setInitiateModal(prev => {
        let genericSubject = 'Activity';
        let genericDesc = 'Activity notes';
        if (prev.type === 'Call') {
          genericSubject = 'Discovery Call';
          genericDesc = 'Conducted discovery call regarding software requirements.';
        } else if (prev.type === 'Email') {
          genericSubject = 'PMRG Revenue Acceleration Solution';
          genericDesc = 'Sent introductory value proposition email.';
        } else if (prev.type === 'Meeting') {
          genericSubject = 'Strategy & Architecture Review';
          genericDesc = 'Scheduled virtual consultation via Google Meet with decision makers.';
        } else if (prev.type === 'Demo') {
          genericSubject = 'Platform Product Demonstration';
          genericDesc = 'Demonstrated live pipeline management and commercial estimation tools.';
        } else if (prev.type === 'LinkedIn') {
          genericSubject = 'LinkedIn Outreach Message';
          genericDesc = 'Connected and shared product overview note on LinkedIn.';
        } else if (prev.type === 'Proposal Sent') {
          genericSubject = 'Enterprise Commercial Proposal';
          genericDesc = 'Dispatched commercial quotation with volume discount breakdown.';
        } else {
          genericSubject = 'Follow-up Action Task';
          genericDesc = 'Follow up on open action items and review requirements.';
        }
        return {
          ...prev,
          leadId: '',
          leadName: '',
          company: '',
          contact: '',
          phone: '',
          email: '',
          subject: genericSubject,
          desc: genericDesc
        };
      });
      return;
    }

    const matched = allSelectableLeads.find(l => String(l.leadId || l.id) === String(leadIdValue));
    if (matched) {
      const company = matched.company || '';
      const contact = matched.contact || matched.name || '';
      const displayName = contact || company || '';
      const phone = matched.phone || matched.officePhone || '';
      const email = matched.email || '';

      setInitiateModal(prev => {
        let updatedDesc = prev.desc;
        let updatedSubject = prev.subject;

        if (prev.type === 'Call') {
          updatedSubject = `Call with ${displayName}`;
          updatedDesc = `Conducted discovery call with ${displayName} regarding software requirements.`;
        } else if (prev.type === 'Email') {
          updatedSubject = `PMRG Solution for ${company || displayName}`;
          updatedDesc = `Sent introductory value proposition email to ${displayName}.`;
        } else if (prev.type === 'Meeting') {
          updatedSubject = `Strategy & Architecture Review with ${company || displayName}`;
          updatedDesc = `Scheduled virtual consultation via Google Meet with ${displayName}.`;
        } else if (prev.type === 'Demo') {
          updatedSubject = `Product Demonstration with ${company || displayName}`;
          updatedDesc = `Demonstrated live pipeline management and tools to ${displayName}.`;
        } else if (prev.type === 'LinkedIn') {
          updatedSubject = `LinkedIn Outreach to ${displayName}`;
          updatedDesc = `Connected and shared product overview note with ${displayName} on LinkedIn.`;
        } else if (prev.type === 'Proposal Sent') {
          updatedSubject = `Enterprise Commercial Proposal for ${company || displayName}`;
          updatedDesc = `Dispatched commercial quotation with volume breakdown to ${company || displayName}.`;
        } else {
          updatedSubject = `Follow-up Task for ${company || displayName}`;
          updatedDesc = `Follow up on open action items with ${displayName}.`;
        }

        return {
          ...prev,
          leadId: String(matched.leadId || matched.id),
          leadName: displayName,
          company,
          contact,
          phone,
          email,
          subject: updatedSubject,
          desc: updatedDesc
        };
      });
    }
  };

  // Apply Email Template
  const handleApplyEmailTemplate = (template) => {
    const comp = initiateModal.company || 'Client';
    const cont = initiateModal.contact || 'Team';
    const formattedSubject = template.subject.replace('{company}', comp).replace('{contact}', cont);
    const formattedBody = template.body.replace(/\{company\}/g, comp).replace(/\{contact\}/g, cont);

    setInitiateModal(prev => ({
      ...prev,
      subject: formattedSubject,
      desc: formattedBody
    }));
  };

  // Execute and Save Activity directly to Database
  const handleExecuteInitiate = async (e) => {
    e.preventDefault();
    if (!initiateModal.leadId && !initiateModal.company) {
      setInitiateError('Please select a target lead or enter a company name.');
      return;
    }
    setInitiateLoading(true);
    setInitiateError('');

    try {
      const payload = {
        type: initiateModal.type,
        lead: initiateModal.company || initiateModal.leadName || 'Lead',
        leadId: initiateModal.leadId || undefined,
        desc: initiateModal.desc || initiateModal.subject || `${initiateModal.type} executed`,
        outcome: initiateModal.outcome || undefined,
        dueDate: initiateModal.dueDate || undefined,
      };

      await logGlobalActivity(payload);
      showToast(`✓ ${initiateModal.type} saved successfully!`, 'success');
      setInitiateModal(prev => ({ ...prev, isOpen: false }));
      setCurrentPage(1);
      loadActivitiesFeed();
      loadSummary();
    } catch (err) {
      console.error('Failed to execute activity:', err);
      setInitiateError(err.message || 'Failed to execute and log activity.');
    } finally {
      setInitiateLoading(false);
    }
  };

  // Tasks Health modal states
  const [activeActivityModal, setActiveActivityModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actSearch, setActSearch] = useState('');
  const [actOwnerFilter, setActOwnerFilter] = useState('');
  const [actPriorityFilter, setActPriorityFilter] = useState('');
  const [actTypeFilter, setActTypeFilter] = useState('');
  const [actPage, setActPage] = useState(1);
  const actItemsPerPage = 5;

  const handleOpenActivityModal = async (title) => {
    const isOverdue = title === 'Overdue Tasks';
    setActiveActivityModal({ title, list: [] });
    setActSearch('');
    setActOwnerFilter('');
    setActPriorityFilter('');
    setActTypeFilter('');
    setActPage(1);
    setModalLoading(true);

    try {
      const res = await fetchActivitiesFeed({
        due_status: isOverdue ? 'overdue' : 'upcoming',
        limit: 100,
      });

      if (res && res.success && res.data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(23, 59, 59, 999);

        const filteredItems = res.data.filter(item => {
          if (item.completed) return false;
          if (!item.dueDate) return false;
          const due = new Date(item.dueDate);
          due.setHours(0, 0, 0, 0);

          if (isOverdue) {
            return due < today;
          } else {
            return due >= today && due <= nextWeek;
          }
        });

        const mapped = filteredItems.map(item => {
          let diffDays = 0;
          let scheduledDate = 'This Week';
          let overdueBy = '';

          if (item.dueDate) {
            const due = new Date(item.dueDate);
            due.setHours(0, 0, 0, 0);
            const diffTime = due.getTime() - today.getTime();
            const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
            diffDays = Math.abs(days);

            if (days < 0) {
              overdueBy = `${Math.abs(days)} Day${Math.abs(days) > 1 ? 's' : ''}`;
            } else if (days === 0) {
              scheduledDate = 'Today';
            } else if (days === 1) {
              scheduledDate = 'Tomorrow';
            } else if (days <= 7) {
              scheduledDate = 'This Week';
            } else {
              scheduledDate = 'Next Week';
            }
          }

          let actType = item.type || 'Call';
          let actDesc = item.desc || (isOverdue ? 'Overdue follow-up' : 'Scheduled activity');

          return {
            id: item.id,
            actId: `ACT-${String(item.leadId || item.id).substring(0, 8)}`,
            leadId: item.leadId,
            company: item.company || 'Unknown Company',
            contact: item.leadName || '',
            type: actType,
            desc: actDesc,
            owner: item.rep || 'Unassigned',
            dueDate: item.dueDate || '',
            overdueBy: overdueBy || `${diffDays} Day${diffDays > 1 ? 's' : ''}`,
            diffDays,
            scheduledDate,
            scheduledDateRaw: item.dueDate || '',
            scheduledTime: '10:00 AM',
            priority: item.priority || (isOverdue ? 'High' : 'Normal'),
            status: item.completed ? 'Completed' : (item.status || 'Open'),
            leadRaw: { id: item.leadId }
          };
        });

        setActiveActivityModal({ title, list: mapped });
      }
    } catch (err) {
      console.error('Failed to load modal activities:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const getFilteredModalActivities = () => {
    if (!activeActivityModal) return [];
    let list = [...activeActivityModal.list];

    if (actSearch.trim()) {
      const q = actSearch.toLowerCase();
      list = list.filter(a => 
        (a.company && a.company.toLowerCase().includes(q)) || 
        (a.desc && a.desc.toLowerCase().includes(q)) ||
        (a.actId && a.actId.toLowerCase().includes(q)) ||
        (a.contact && a.contact.toLowerCase().includes(q))
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

  const uniqueUsers = usersList.length > 0
    ? Array.from(new Set(usersList.map(u => u.name))).filter(Boolean).sort()
    : Array.from(new Set(allSelectableLeads.map(l => l.owner || l.contact))).filter(Boolean).sort();
  const uniqueLeads = Array.from(new Set(allSelectableLeads.map(l => l.company || l.contact))).filter(Boolean).sort();
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

  return (
    <div className="activities-container">
      {/* Header */}
      <div className="activities-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Activities Timeline</h1>
          
        </div>
        <button 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px' }} 
          onClick={() => handleOpenInitiate('Call')}
        >
          <Plus size={16} /> Quick Action
        </button>
      </div>

      {/* =========================================================================
         Activity Automation & Initiation Hub Bar
         ========================================================================= */}
      <div className="initiate-activity-hub">
        <div className="initiate-hub-header">
          <div className="initiate-hub-title">
            <Zap size={18} style={{ color: '#2563EB' }} />
            <span>Initiate & Automate Activities</span>
          </div>
        </div>

        <div className="initiate-actions-grid">
          <button 
            type="button" 
            className="initiate-action-btn btn-act-call"
            onClick={() => handleOpenInitiate('Call')}
            title="Place or log a phone call"
          >
            <Phone size={15} /> Place Call
          </button>
          
          <button 
            type="button" 
            className="initiate-action-btn btn-act-email"
            onClick={() => handleOpenInitiate('Email')}
            title="Send template email to lead"
          >
            <Mail size={15} /> Send Email
          </button>

          <button 
            type="button" 
            className="initiate-action-btn btn-act-meeting"
            onClick={() => handleOpenInitiate('Meeting')}
            title="Schedule calendar meeting"
          >
            <Calendar size={15} /> Schedule Meeting
          </button>

          <button 
            type="button" 
            className="initiate-action-btn btn-act-demo"
            onClick={() => handleOpenInitiate('Demo')}
            title="Book or conduct product demo"
          >
            <MonitorPlay size={15} /> Run Demo
          </button>

          <button 
            type="button" 
            className="initiate-action-btn btn-act-linkedin"
            onClick={() => handleOpenInitiate('LinkedIn')}
            title="Log LinkedIn outreach message"
          >
            <Globe size={15} /> LinkedIn Pitch
          </button>

          <button 
            type="button" 
            className="initiate-action-btn btn-act-proposal"
            onClick={() => handleOpenInitiate('Proposal Sent')}
            title="Dispatch commercial estimation & proposal"
          >
            <FileText size={15} /> Send Proposal
          </button>

          <button 
            type="button" 
            className="initiate-action-btn btn-act-task"
            onClick={() => handleOpenInitiate('Other')}
            title="Create next follow-up task"
          >
            <CheckCircle2 size={15} /> Create Task
          </button>

          <button 
            type="button" 
            className="initiate-action-btn btn-act-custom"
            onClick={() => handleOpenInitiate('Call')}
            title="Custom activity log"
          >
            <Plus size={15} /> Custom Log
          </button>
        </div>
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
                  <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleOpenActivityModal('Overdue Tasks')}>⚠️ {summaryData.overdue_count} Overdue</span>
                  <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleOpenActivityModal('Upcoming Tasks')}>📅 {summaryData.upcoming_count} Upcoming</span>
                </div>
              </div>
              <div className="ai-premium-recommendation-box">
                <div className="ai-premium-recommendation-title">AI Performance Recommendation</div>
                <div className="ai-premium-recommendation-text">
                  ⚡ **Automated Execution:** Log calls and send proposals directly from this page to maintain seamless CRM audit history and shorten sales velocity cycles.
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

      {/* =========================================================================
         Main Activity Log Timeline Card
         ========================================================================= */}
      <div className="activities-main-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)', margin: 0 }}>
            Activity Log & Audit Trail
          </h2>
          
        </div>
        
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
          ) : activitiesError ? (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #F87171', margin: '16px 0' }}>
              <p style={{ color: '#DC2626', fontWeight: '500', margin: '0 0 12px 0', fontSize: '14px' }}>{activitiesError}</p>
              <button 
                onClick={loadActivitiesFeed}
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : activitiesData.length > 0 ? (
            activitiesData.map(activity => {
              const matchedLead = leadsList.find(l => l.leadId === activity.leadId || l.company === activity.company || l.contact === activity.lead);
              
              return (
                <div key={activity.id} className="global-timeline-item">
                  <div className={`timeline-circle ${activity.colorClass}`}>
                    {activity.icon}
                  </div>
                  <div 
                    className="timeline-item-card interactive"
                    onClick={() => setSelectedActivity(activity)}
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

                    {/* Interactive Action Bar on each timeline item */}
                    <div className="timeline-card-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="timeline-action-group">
                        <button 
                          type="button" 
                          className="quick-action-pill"
                          onClick={() => handleOpenInitiate('Call', matchedLead || { company: activity.lead, contact: activity.lead })}
                          title="Place call to this lead"
                        >
                          <Phone size={12} /> Call
                        </button>
                        <button 
                          type="button" 
                          className="quick-action-pill"
                          onClick={() => handleOpenInitiate('Email', matchedLead || { company: activity.lead, contact: activity.lead })}
                          title="Send follow-up email"
                        >
                          <Mail size={12} /> Email
                        </button>
                        <button 
                          type="button" 
                          className="quick-action-pill"
                          onClick={() => handleOpenInitiate('Meeting', matchedLead || { company: activity.lead, contact: activity.lead })}
                          title="Schedule meeting"
                        >
                          <Calendar size={12} /> Meeting
                        </button>
                        <button 
                          type="button" 
                          className="quick-action-pill"
                          onClick={() => handleOpenInitiate('Proposal Sent', matchedLead || { company: activity.lead, contact: activity.lead })}
                          title="Send proposal"
                        >
                          <FileText size={12} /> Proposal
                        </button>
                      </div>

                      <div className="timeline-action-group">
                        <button 
                          type="button" 
                          className={`quick-action-pill ${activity.completed ? 'complete-pill' : ''}`}
                          onClick={(e) => handleToggleComplete(activity.id, activity.completed, e)}
                          title="Toggle completion status in database"
                        >
                          {activity.completed ? (
                            <>
                              <CheckSquare size={13} style={{ color: '#059669' }} /> Completed
                            </>
                          ) : (
                            <>
                              <Square size={13} /> Mark Done
                            </>
                          )}
                        </button>

                        <button 
                          type="button" 
                          className="quick-action-pill"
                          onClick={() => setSelectedActivity(activity)}
                          style={{ color: '#1D4ED8', fontWeight: 700 }}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
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

      {/* =========================================================================
         Tailored Activity Initiation & Automation Modal (Database Connected)
         ========================================================================= */}
      {initiateModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={`timeline-circle ${getActivityMeta(initiateModal.type).colorClass}`} style={{ width: '28px', height: '28px', boxShadow: 'none' }}>
                  {getActivityMeta(initiateModal.type).icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                    {initiateModal.type === 'Call' && 'Initiate & Log Phone Call'}
                    {initiateModal.type === 'Email' && 'Dispatch & Log Email'}
                    {initiateModal.type === 'Meeting' && 'Schedule & Log Client Meeting'}
                    {initiateModal.type === 'Demo' && 'Book & Log Product Demonstration'}
                    {initiateModal.type === 'LinkedIn' && 'Log LinkedIn Outreach Message'}
                    {initiateModal.type === 'Proposal Sent' && 'Dispatch Commercial Proposal'}
                    {initiateModal.type === 'Other' && 'Create Follow-up Action Task'}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Record and track activity in client timeline.
                  </span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setInitiateModal(prev => ({ ...prev, isOpen: false }))}>
                <X size={20} />
              </button>
            </div>

            {initiateError && (
              <div style={{ color: 'var(--color-danger)', padding: '12px 24px 0', fontSize: '13px', fontWeight: '500' }}>
                ❌ {initiateError}
              </div>
            )}

            <form onSubmit={handleExecuteInitiate} className="modal-form" style={{ padding: '20px 24px' }}>
              {/* Target Lead Selector */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <label style={{ margin: 0 }}>Target Lead / Client <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <button
                    type="button"
                    onClick={() => setInitiateModal(prev => ({ 
                      ...prev, 
                      isCustomLead: !prev.isCustomLead,
                      leadId: prev.isCustomLead ? '' : prev.leadId,
                      company: prev.isCustomLead ? '' : prev.company,
                      contact: prev.isCustomLead ? '' : prev.contact
                    }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    {initiateModal.isCustomLead ? '← Select from Existing Leads' : '+ Custom / Direct Client'}
                  </button>
                </div>

                {!initiateModal.isCustomLead ? (
                  <select 
                    value={initiateModal.leadId} 
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setInitiateModal(prev => ({ ...prev, isCustomLead: true, leadId: '', company: '', contact: '' }));
                      } else {
                        handleInitiateLeadChange(e.target.value);
                      }
                    }}
                    required={!initiateModal.isCustomLead}
                    style={{ fontSize: '13px', padding: '9px 12px' }}
                  >
                    <option value="">Select a Lead...</option>
                    {allSelectableLeads.map(lead => (
                      <option key={lead.leadId || lead.id} value={String(lead.leadId || lead.id)}>
                        {lead.company || lead.name || 'Company'} {lead.contact && lead.contact !== lead.company ? `— ${lead.contact}` : ''} ({lead.stage || 'Active'})
                      </option>
                    ))}
                    <option value="__custom__">✏️ + Enter Custom / Unlisted Client...</option>
                  </select>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '8px' }}>
                    <input 
                      type="text"
                      placeholder="Company / Client Name *"
                      value={initiateModal.company}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInitiateModal(prev => ({
                          ...prev,
                          company: val,
                          leadName: prev.contact || val,
                          subject: prev.type === 'Call' ? `Call with ${prev.contact || val}` : prev.subject
                        }));
                      }}
                      required
                      style={{ fontSize: '13px', padding: '9px 12px' }}
                    />
                    <input 
                      type="text"
                      placeholder="Contact Person (Optional)"
                      value={initiateModal.contact}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInitiateModal(prev => ({
                          ...prev,
                          contact: val,
                          leadName: val || prev.company,
                          subject: prev.type === 'Call' ? `Call with ${val || prev.company}` : prev.subject
                        }));
                      }}
                      style={{ fontSize: '13px', padding: '9px 12px' }}
                    />
                  </div>
                )}

                {initiateModal.leadId && !initiateModal.isCustomLead && (initiateModal.company || initiateModal.contact) && (
                  <div className="lead-select-badge">
                    <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>
                      🏢 {initiateModal.company || initiateModal.contact} {initiateModal.contact && initiateModal.company ? `(${initiateModal.contact})` : ''}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {initiateModal.phone ? `📞 ${initiateModal.phone}` : ''} {initiateModal.email ? `✉️ ${initiateModal.email}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Activity Type Switcher */}
              <div className="form-group">
                <label>Activity Action Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select 
                  value={initiateModal.type} 
                  onChange={(e) => handleOpenInitiate(e.target.value, allSelectableLeads.find(l => String(l.leadId || l.id) === String(initiateModal.leadId)))}
                  required
                >
                  <option value="Call">📞 Phone Call</option>
                  <option value="Email">✉️ Email</option>
                  <option value="Meeting">📅 Meeting</option>
                  <option value="Demo">🖥️ Product Demo</option>
                  <option value="LinkedIn">🌐 LinkedIn Message</option>
                  <option value="Proposal Sent">📄 Commercial Proposal</option>
                  <option value="Other">📝 Task / Follow-up</option>
                </select>
              </div>

              {/* Call-specific controls */}
              {initiateModal.type === 'Call' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Call Status / Outcome</label>
                    <select 
                      value={initiateModal.outcome} 
                      onChange={(e) => setInitiateModal(prev => ({ ...prev, outcome: e.target.value }))}
                      style={{ fontSize: '13px', padding: '8px 10px' }}
                    >
                      <option value="Connected - Follow-up Requested">Connected - Follow-up</option>
                      <option value="Connected - Scheduled Demo">Connected - Scheduled Demo</option>
                      <option value="Connected - Proposal Requested">Connected - Proposal Requested</option>
                      <option value="Left Voicemail">Left Voicemail</option>
                      <option value="Gatekeeper / Busy">Gatekeeper / Busy</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Call Duration</label>
                    <select 
                      value={initiateModal.callDuration}
                      onChange={(e) => setInitiateModal(prev => ({ ...prev, callDuration: e.target.value }))}
                      style={{ fontSize: '13px', padding: '8px 10px' }}
                    >
                      <option value="2 mins">Quick Check (2 mins)</option>
                      <option value="5 mins">Discovery (5 mins)</option>
                      <option value="15 mins">Detailed Qual (15 mins)</option>
                      <option value="30 mins">Strategic (30 mins)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Email-specific template selector */}
              {initiateModal.type === 'Email' && (
                <div className="form-group">
                  <label>1-Click Email Template Presets</label>
                  <div className="preset-chips-row">
                    {EMAIL_TEMPLATES.map((tmpl, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        className="preset-chip"
                        onClick={() => handleApplyEmailTemplate(tmpl)}
                      >
                        ⚡ {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting-specific platform selector */}
              {initiateModal.type === 'Meeting' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Meeting Platform</label>
                    <select 
                      value={initiateModal.meetingPlatform}
                      onChange={(e) => setInitiateModal(prev => ({ ...prev, meetingPlatform: e.target.value }))}
                    >
                      <option value="Google Meet">Google Meet (Auto-link)</option>
                      <option value="Zoom">Zoom Video</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="In-Person">In-Person at Client Office</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Meeting Outcome / Target</label>
                    <input 
                      type="text" 
                      value={initiateModal.outcome} 
                      onChange={(e) => setInitiateModal(prev => ({ ...prev, outcome: e.target.value }))}
                      placeholder="e.g. Architectural Sign-off"
                    />
                  </div>
                </div>
              )}

              {/* Proposal-specific deal value */}
              {initiateModal.type === 'Proposal Sent' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Estimated Quote Value ($)</label>
                    <input 
                      type="text" 
                      value={initiateModal.proposalValue}
                      onChange={(e) => setInitiateModal(prev => ({ ...prev, proposalValue: e.target.value }))}
                      placeholder="$25,000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Proposal Status</label>
                    <input 
                      type="text" 
                      value={initiateModal.outcome} 
                      onChange={(e) => setInitiateModal(prev => ({ ...prev, outcome: e.target.value }))}
                      placeholder="Under Review"
                    />
                  </div>
                </div>
              )}

              {/* Description & Action Notes */}
              <div className="form-group">
                <label>
                  {initiateModal.type === 'Email' ? 'Email Message Body' : 'Activity Description & Notes'} 
                  <span style={{ color: 'var(--color-danger)' }}> *</span>
                </label>
                <textarea 
                  value={initiateModal.desc} 
                  onChange={(e) => setInitiateModal(prev => ({ ...prev, desc: e.target.value }))}
                  required 
                  rows={4}
                  placeholder="Provide detailed notes or discussion points..."
                />
              </div>

              {/* Follow-up / Due Date */}
              <div className="form-group">
                <label>Scheduled Follow-up Date (Optional)</label>
                <input 
                  type="date" 
                  value={initiateModal.dueDate} 
                  onChange={(e) => setInitiateModal(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="modal-actions" style={{ marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  disabled={initiateLoading} 
                  onClick={() => setInitiateModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={initiateLoading}
                >
                  {initiateLoading ? 'Saving...' : 'Save'}
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
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Database Record ID: #{selectedActivity.id}</span>
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
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={() => {
                        setSelectedActivity(null);
                        handleOpenInitiate('Email', leadsList.find(l => l.company === selectedActivity.company || l.leadId === selectedActivity.leadId));
                      }}
                    >
                      Reply to Email
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={async () => {
                        await logGlobalActivity({
                          type: 'Email',
                          lead: selectedActivity.lead,
                          leadId: selectedActivity.leadId,
                          desc: `Resent: ${selectedActivity.desc}`,
                          outcome: 'Delivered'
                        });
                        showToast('Email resent & logged to database!', 'success');
                        setSelectedActivity(null);
                        loadActivitiesFeed();
                      }}
                    >
                      Resend Email & Log
                    </button>
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

                  {/* Quick Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={() => {
                        setSelectedActivity(null);
                        handleOpenInitiate('Call', leadsList.find(l => l.company === selectedActivity.company || l.leadId === selectedActivity.leadId));
                      }}
                    >
                      Call Back Lead
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={() => {
                        setSelectedActivity(null);
                        handleOpenInitiate('Meeting', leadsList.find(l => l.company === selectedActivity.company || l.leadId === selectedActivity.leadId));
                      }}
                    >
                      Schedule Follow-up Meeting
                    </button>
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

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={() => {
                        setSelectedActivity(null);
                        handleOpenInitiate('Proposal Sent', leadsList.find(l => l.company === selectedActivity.company || l.leadId === selectedActivity.leadId));
                      }}
                    >
                      Send Commercial Proposal
                    </button>
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

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={() => {
                        setSelectedActivity(null);
                        handleOpenInitiate('Meeting', leadsList.find(l => l.company === selectedActivity.company || l.leadId === selectedActivity.leadId));
                      }}
                    >
                      Schedule Follow-up Meeting
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={async () => {
                        await logGlobalActivity({
                          type: 'Email',
                          lead: selectedActivity.lead,
                          leadId: selectedActivity.leadId,
                          desc: `Thank you note sent following meeting with ${selectedActivity.lead}`,
                          outcome: 'Delivered'
                        });
                        showToast('Thank you note sent and logged!', 'success');
                        setSelectedActivity(null);
                        loadActivitiesFeed();
                      }}
                    >
                      Send Thank You Email & Log
                    </button>
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
                      Open LinkedIn Profile <ExternalLink size={14} style={{ marginLeft: '4px' }} />
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
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={() => {
                        setSelectedActivity(null);
                        handleOpenInitiate('Proposal Sent', leadsList.find(l => l.company === selectedActivity.company || l.leadId === selectedActivity.leadId));
                      }}
                    >
                      Revise Proposal
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={async () => {
                        await logGlobalActivity({
                          type: 'Proposal Sent',
                          lead: selectedActivity.lead,
                          leadId: selectedActivity.leadId,
                          desc: `Proposal approved for ${selectedActivity.lead}`,
                          outcome: 'Approved by Client'
                        });
                        showToast('Proposal marked as Approved and logged!', 'success');
                        setSelectedActivity(null);
                        loadActivitiesFeed();
                      }}
                    >
                      Mark as Approved & Log
                    </button>
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
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }} 
                      onClick={() => {
                        setSelectedActivity(null);
                        handleOpenInitiate('Other', leadsList.find(l => l.company === selectedActivity.company || l.leadId === selectedActivity.leadId));
                      }}
                    >
                      Create Follow-up Task
                    </button>
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
                AI Productivity Assistant: {activeActivityModal.title} ({modalLoading ? '...' : `${activeActivityModal.list.length} Items`})
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
                  {modalLoading ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>Loading activities...</td>
                    </tr>
                  ) : getFilteredModalActivities().length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>No activities found.</td>
                    </tr>
                  ) : (
                    getFilteredModalActivities().slice((actPage - 1) * actItemsPerPage, actPage * actItemsPerPage).map(a => {
                      const isOverdueView = activeActivityModal.title === 'Overdue Tasks';
                      const leadObj = leadsList.find(l => l.leadId === a.leadId || l.company === a.company);

                      return (
                        <tr key={a.actId + '-' + (a.leadId || a.id)} style={{ cursor: 'pointer' }} onClick={() => navigate('/leads', { state: { selectedLeadId: a.leadRaw?.id } })}>
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
                            <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="btn-primary" 
                                style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: '#059669', borderColor: '#059669' }}
                                onClick={async () => {
                                  if (a.id) {
                                    await completeActivity(a.id, true);
                                    showToast('✓ Task completed in database!', 'success');
                                    handleOpenActivityModal(activeActivityModal.title);
                                    loadSummary();
                                    loadActivitiesFeed();
                                  }
                                }}
                              >
                                ✓ Done
                              </button>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                                onClick={() => {
                                  setActiveActivityModal(null);
                                  handleOpenInitiate('Call', leadObj || { company: a.company, contact: a.contact });
                                }}
                              >
                                Call
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
