import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Percent, AlertCircle, CheckCircle2, X, Sparkles, RefreshCw, Trash2, Edit2, PlusCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import KpiCard from '../components/KpiCard';
import { initialLeadsData } from './mockLeads';
import { fetchDashboardSummary, fetchLeads, fetchCurrentUsers, fetchTasks, createTask, updateTaskStatus, deleteTask } from '../services/leadService';
import './Dashboard.css';

export default function Dashboard() {
  const [activeKpiModal, setActiveKpiModal] = useState(null);
  const navigate = useNavigate();

  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    pipeline_value: 0,
    open_deals_count: 0,
    expected_value: 0,
    overdue_count: 0,
    won_leads_count: 0,
    lost_leads_count: 0,
    stage_distribution: [],
    region_distribution: []
  });

  // Filters State
  const [ownerFilter, setOwnerFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [usersList, setUsersList] = useState([]);

  const [isAiExpanded, setIsAiExpanded] = useState(() => {
    const saved = sessionStorage.getItem('isAiExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    sessionStorage.setItem('isAiExpanded', JSON.stringify(isAiExpanded));
  }, [isAiExpanded]);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState([
    { icon: '🚀', text: 'Pipeline value tracking active deals in real-time from the database.', type: 'trend', badge: 'Revenue Active' },
    { icon: '🔥', text: 'High probability deals in Proposal & Negotiation ready for closing.', type: 'action', badge: 'Hot Deals' },
    { icon: '⚠️', text: 'Check overdue activities and follow-ups to maintain deal velocity.', type: 'alert', badge: 'Action Required' }
  ]);

  useEffect(() => {
    fetchCurrentUsers().then(resp => {
      if (resp && resp.data) setUsersList(resp.data);
    }).catch(err => console.error('Failed to load users for filter:', err));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const queryParams = {};
    if (ownerFilter) queryParams.owner = ownerFilter;
    if (regionFilter) queryParams.region = regionFilter;

    fetchDashboardSummary(queryParams)
      .then((resp) => {
        if (isMounted && resp && resp.data) {
          setDashboardData(resp.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load dashboard summary:', err);
          setError(err.message || 'Failed to load dashboard summary.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ownerFilter, regionFilter]);

  const handleRefreshAi = () => {
    setIsAiLoading(true);
    const queryParams = {};
    if (ownerFilter) queryParams.owner = ownerFilter;
    if (regionFilter) queryParams.region = regionFilter;

    fetchDashboardSummary(queryParams)
      .then((resp) => {
        if (resp && resp.data) {
          setDashboardData(resp.data);
        }
      })
      .catch(console.error)
      .finally(() => {
        setIsAiLoading(false);
        setAiInsights([
          { icon: '🚀', text: `Active pipeline value: $${(dashboardData.pipeline_value || 0).toLocaleString()} across ${dashboardData.open_deals_count || 0} open deals.`, type: 'trend', badge: 'Live Insights' },
          { icon: '🔥', text: `Expected close value estimated at $${(dashboardData.expected_value || 0).toLocaleString()} based on stage probabilities.`, type: 'action', badge: 'Forecast' },
          { icon: '⚠️', text: `${dashboardData.overdue_count || 0} tasks or follow-ups require immediate attention.`, type: 'alert', badge: 'Tasks Pending' }
        ]);
      });
  };

  // Task To-Do list state
  const [tasks, setTasks] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('Normal');
  const [editingTaskId, setEditingTaskId] = useState(null);

  useEffect(() => {
    loadBackendTasks();
  }, []);

  const loadBackendTasks = async () => {
    try {
      const res = await fetchTasks();
      if (res && res.data) {
        const mapped = res.data.map(t => ({
          id: t.id,
          text: t.text,
          date: t.dueDate || 'No Date',
          priority: t.priority === 'High' ? 'Urgent' : t.priority === 'Medium' ? 'Normal' : t.priority,
          completed: t.completed
        }));
        setTasks(mapped);
      }
    } catch (err) {
      console.error('Failed to load tasks from backend:', err);
    }
  };

  const handleToggleTask = async (id) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const newStatus = !target.completed;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newStatus } : t));

    try {
      await updateTaskStatus(id, newStatus);
    } catch (err) {
      console.error('Failed to update task status:', err);
      // revert on error
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !newStatus } : t));
    }
  };

  const handleDeleteTask = async (id) => {
    const prevTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await deleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setTasks(prevTasks);
    }
  };

  const parseFlexibleDate = (input) => {
    if (!input) return undefined;
    const str = input.trim().toLowerCase();
    const today = new Date();
    if (str === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    if (str === 'today') {
      return today.toISOString().split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
      return input.trim();
    }
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return undefined;
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    let mappedPriority = 'Medium';
    if (taskPriority === 'Urgent' || taskPriority === 'High') mappedPriority = 'High';
    else if (taskPriority === 'Low') mappedPriority = 'Low';

    const payload = {
      text: taskText.trim(),
      dueDate: parseFlexibleDate(taskDate),
      priority: mappedPriority
    };

    try {
      const res = await createTask(payload);
      if (res && res.data) {
        const newTask = {
          id: res.data.id,
          text: res.data.text,
          date: res.data.dueDate || 'No Date',
          priority: res.data.priority === 'High' ? 'Urgent' : res.data.priority === 'Medium' ? 'Normal' : res.data.priority,
          completed: res.data.completed
        };
        setTasks(prev => [newTask, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task: ' + err.message);
    }

    setTaskText('');
    setTaskDate('');
    setTaskPriority('Normal');
    setIsAddingTask(false);
  };

  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setTaskText(task.text);
    setTaskDate(task.date !== 'No Date' ? task.date : '');
    setTaskPriority(task.priority);
    setIsAddingTask(true);
  };

  // Stage Colors Mapping
  const defaultStageColors = {
    'Prospecting': '#93C5FD',
    'Qualification': '#A7F3D0',
    'Initial Discussion': '#99F6E4',
    'Needs Analysis': '#FDE68A',
    'Proposal': '#C7D2FE',
    'Negotiation': '#FBCFE8',
    'Closed Won': '#34D399',
    'Closed Lost': '#F87171'
  };

  const pipelineStageData = (dashboardData.stage_distribution || []).map(stg => ({
    name: stg.name,
    deals: stg.deals !== undefined ? stg.deals : (stg.count || 0),
    fill: stg.fill || defaultStageColors[stg.name] || '#93C5FD'
  }));

  const regions = (dashboardData.region_distribution || []).map(r => ({
    name: r.name,
    percent: r.percent !== undefined ? r.percent : (r.count || 0),
    value: r.value,
    count: r.count
  }));

  const totalPipelineVal = dashboardData.pipeline_value || 0;
  const expectedPipelineVal = dashboardData.expected_value || 0;
  const openDealsCount = dashboardData.open_deals_count || 0;
  const overdueCount = dashboardData.overdue_count || 0;
  const wonCount = dashboardData.won_leads_count || 0;
  const lostCount = dashboardData.lost_leads_count || 0;

  const kpiData = [
    { title: 'Total Pipeline ', value: `$${totalPipelineVal.toLocaleString()}`, subtext: `${openDealsCount} open deals`, icon: <DollarSign size={18} />, color: '#1D4ED8' },
    { title: 'Expected Value ', value: `$${expectedPipelineVal.toLocaleString()}`, subtext: 'Based on probability', icon: <Percent size={18} />, color: '#10B981' },
    { title: 'Overdue Tasks ', value: `${overdueCount}`, subtext: 'Requires immediate action', icon: <AlertCircle size={18} />, color: '#EF4444' },
    { title: 'Won Leads ', value: `${wonCount}`, subtext: 'Year to date', icon: <CheckCircle2 size={18} />, color: '#F59E0B' },
    { title: 'Closed Lost ', value: `${lostCount}`, subtext: 'Year to date', icon: <X size={18} />, color: '#DC2626' }
  ];

  const handleKpiClick = async (title) => {
    try {
      if (title.includes('Total Pipeline')) {
        const resp = await fetchLeads({ limit: 50 });
        const open = (resp.data || []).filter(l => l.status !== 'Won' && l.status !== 'Lost');
        const list = open.map(l => `${l.company} - $${(l.value || 0).toLocaleString()}`);
        setActiveKpiModal({ title: `${open.length} Open Deals ($${totalPipelineVal.toLocaleString()})`, data: list });
      } else if (title.includes('Expected Value')) {
        const resp = await fetchLeads({ limit: 50 });
        const open = (resp.data || []).filter(l => l.status !== 'Won' && l.status !== 'Lost');
        const list = open.map(l => `${l.company} (${l.stage || 'Open'}) - $${(l.value || 0).toLocaleString()}`);
        setActiveKpiModal({ title: `Expected Value Breakdown ($${expectedPipelineVal.toLocaleString()})`, data: list });
      } else if (title.includes('Overdue Tasks')) {
        const resp = await fetchLeads({ limit: 50 });
        const open = (resp.data || []).filter(l => l.status !== 'Won' && l.status !== 'Lost');
        const overdue = open.map(l => ({
          id: l.leadId || `L-${l.id}`,
          company: l.company,
          owner: l.owner || 'Unassigned',
          task: 'Follow-up Required',
          dueDate: l.estimatedRequirementDate || l.nextFollowUp || 'Past Due',
          overdue: 'Action Pending',
          priority: l.priority || 'High'
        }));
        setActiveKpiModal({ title: `${overdue.length} Overdue Actions`, data: overdue });
      } else if (title.includes('Won Leads')) {
        const resp = await fetchLeads({ stage: 'Closed Won', limit: 50 });
        const list = (resp.data || []).map(l => ({
          id: l.leadId || `L-${l.id}`,
          company: l.company,
          owner: l.owner || 'Unassigned',
          contact: l.contact || 'N/A',
          stage: 'Won',
          value: `$${(l.value || 0).toLocaleString()}`,
          wonDate: l.updatedAt ? l.updatedAt.substring(0, 10) : 'Recent',
          duration: 'Closed'
        }));
        setActiveKpiModal({ title: `${list.length} Won Leads`, data: list });
      } else if (title.includes('Closed Lost')) {
        const resp = await fetchLeads({ stage: 'Closed Lost', limit: 50 });
        const list = (resp.data || []).map(l => ({
          id: l.leadId || `L-${l.id}`,
          company: l.company,
          owner: l.owner || 'Unassigned',
          contact: l.contact || 'N/A',
          stage: 'Closed Lost',
          value: `$${(l.value || 0).toLocaleString()}`,
          lostDate: l.updatedAt ? l.updatedAt.substring(0, 10) : 'Recent',
          reason: l.lostReason || 'Not Specified'
        }));
        setActiveKpiModal({ title: `${list.length} Closed Lost Leads`, data: list });
      }
    } catch (err) {
      console.error('Failed to load drilldown data:', err);
    }
  };

  const handleRegionClick = async (regionName) => {
    try {
      const resp = await fetchLeads({ limit: 50 });
      const regionLeads = (resp.data || []).filter(l => l.region && l.region.toLowerCase() === regionName.toLowerCase()).map(l => ({
        id: l.leadId || `L-${l.id}`,
        company: l.company,
        value: `$${(l.value || 0).toLocaleString()}`,
        stage: l.stage || 'Open',
        contact: l.contact || 'N/A',
        owner: l.owner || 'Unassigned'
      }));
      setActiveKpiModal({
        title: `${regionName} Region - Lead List`,
        data: regionLeads
      });
    } catch (err) {
      console.error('Failed to load region drilldown:', err);
    }
  };

  const handleModalItemClick = (item) => {
    let companyName = "";
    let leadId = null;

    if (typeof item === "string") {
      const cleanString = item.replace(/\(.*\)/, '');
      const parts = cleanString.split('-');
      companyName = parts[0].trim();
    } else if (item && typeof item === "object") {
      companyName = item.company;
      if (item.id) {
        const numericId = parseInt(item.id.replace('L-', ''), 10);
        if (!isNaN(numericId)) {
          leadId = numericId;
        }
      }
    }

    if (companyName) {
      setActiveKpiModal(null);
      navigate('/leads', { 
        state: { 
          selectedLeadId: leadId,
          selectLeadCompany: companyName 
        } 
      });
    }
  };

  return (
    <div className="dashboard-container">
        {/* Dashboard Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h1 className="page-title" style={{ margin: 0 }}> Dashboard </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {usersList.length > 0 && (
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
              >
                <option value="">All Owners</option>
                {usersList.map((u, i) => (
                  <option key={i} value={u.name || u.email}>{u.name || u.email}</option>
                ))}
              </select>
            )}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
            >
              <option value="">All Regions</option>
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
              <option value="Asia Pacific">Asia Pacific</option>
              <option value="LATAM">LATAM</option>
              <option value="India">India</option>
            </select>
            {loading && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Updating...</span>}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', color: '#991B1B', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button onClick={handleRefreshAi} style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="kpi-grid">
            {kpiData.map((kpi, index) => (
                <KpiCard
                    key={index}
                    title={kpi.title}
                    value={kpi.value}
                    subtext={kpi.subtext}
                    icon={kpi.icon}
                    highlightColor={kpi.color}
                    onClick={() => handleKpiClick(kpi.title.trim())}
                />
            ))}
        </div>

        {/* AI Summary Card */}
        <div className="card ai-summary-card" style={{ marginBottom: '24px' }}>
          <div className="ai-card-glow"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: '#FFFFFF' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'white' }}>AI Sales Insights & Summary</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="ai-sparkle-btn" onClick={handleRefreshAi} disabled={isAiLoading} title="Refresh AI Insights">
                <RefreshCw size={18} className={isAiLoading ? 'spin' : ''} style={{ animation: isAiLoading ? 'rotateSparkle 1.5s infinite linear' : 'none' }} />
              </button>
              <button 
                className="ai-sparkle-btn" 
                onClick={() => setIsAiExpanded(!isAiExpanded)} 
                title={isAiExpanded ? "Collapse Insights" : "Expand Insights"}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              opacity: isAiExpanded ? 1 : 0,
              paddingTop: isAiExpanded ? '16px' : '0px'
            }}
          >
            {isAiLoading ? (
              <div className="ai-skeleton-loader">
                <div className="skeleton-item"></div>
                <div className="skeleton-item"></div>
                <div className="skeleton-item"></div>
              </div>
            ) : (
              <div className="ai-insights-list">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="ai-insight-item">
                    <div className="ai-insight-icon">{insight.icon}</div>
                    <div className="ai-insight-content">
                      <span className="ai-insight-badge">{insight.badge}</span>
                      <p className="ai-insight-text">{insight.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pipeline & Up Next */}
        <div className="dashboard-row">
            <div className="card flex-2">
                <div className="card-header">
                    <h3>Lead by Stage</h3>
                </div>
                <div className="chart-container">
                    <ResponsiveContainer
                        width="100%"
                        height={420}
                    >
                        <BarChart
                            data={pipelineStageData}
                            layout="vertical"
                            margin={{
                                top: 20,
                                right: 30,
                                left: 10,
                                bottom: 5
                            }}
                        >
                            <XAxis type="number" />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={130}
                                tick={{
                                    fill: "var(--color-text-muted)",
                                    fontSize: 12
                                }}
                            />
                             <Tooltip
                                cursor={{ fill: "rgba(226, 232, 240, 0.3)" }}
                                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px' }}
                                labelStyle={{ color: 'var(--color-text-main)', fontWeight: 'bold' }}
                                itemStyle={{ color: 'var(--color-primary)' }}
                             />
                            <Bar
                                dataKey="deals"
                                radius={[0, 4, 4, 0]}
                                barSize={32}
                            >
                                {pipelineStageData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={entry.fill}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="card flex-1 todo-sticky-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-text-main)' }}>AI Smart To-Do List</h3>
                <button 
                  onClick={() => setIsAddingTask(!isAddingTask)} 
                  style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.813rem', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}
                >
                  <PlusCircle size={16} /> Add Task
                </button>
              </div>

              {isAddingTask && (
                <form onSubmit={handleAddTask} className="todo-add-form" style={{ marginBottom: '16px' }}>
                  <input 
                    type="text" 
                    placeholder="Task name..." 
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #FEF08A' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Due date (e.g. Tomorrow)" 
                      value={taskDate}
                      onChange={(e) => setTaskDate(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #FEF08A' }}
                    />
                    <select 
                      value={taskPriority} 
                      onChange={(e) => setTaskPriority(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #FEF08A', width: 'auto' }}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => { setIsAddingTask(false); setEditingTaskId(null); setTaskText(''); }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>{editingTaskId ? 'Save' : 'Add'}</button>
                  </div>
                </form>
              )}

              <div className="todo-list-wrapper">
                {tasks.map(task => (
                  <div key={task.id} className={`todo-item ${task.completed ? 'completed' : ''}`}>
                    <div className="todo-left">
                      <input 
                        type="checkbox" 
                        className="todo-check-input"
                        checked={task.completed} 
                        onChange={() => handleToggleTask(task.id)}
                      />
                      <div className="todo-content-col">
                        <span className="todo-text">{task.text}</span>
                        <div className="todo-meta">
                          <span>{task.date}</span>
                          <span className={`todo-priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                        </div>
                      </div>
                    </div>
                    <div className="todo-actions">
                      <button className="todo-icon-btn" onClick={() => handleStartEdit(task)} title="Edit Task">
                        <Edit2 size={13} />
                      </button>
                      <button className="todo-icon-btn delete" onClick={() => handleDeleteTask(task.id)} title="Delete Task">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Pipeline by Region & Overdue Actions */}
        <div className="dashboard-row">
            <div className="card flex-2">
                <div className="card-header">
                    <h3>Pipeline by Region</h3>
                </div>

                <div className="region-bars">
                    {regions.map((region, index) => (
                        <div
                            key={index}
                            className="region-bar-container interactive"
                            onClick={() => handleRegionClick(region.name)}
                            style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'background-color 0.2s ease', margin: '4px 0' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <div className="region-labels">
                                <span className="region-name">
                                    {region.name}
                                </span>

                                <span className="region-percent">
                                    {region.percent}%
                                </span>
                            </div>

                            <div className="progress-bg">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${region.percent}%`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="card flex-1">
                <div className="card-header">
                    <h3>Overdue Actions</h3>
                </div>
                <div className="task-list">
                    {overdueCount === 0 ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                          No overdue actions pending.
                        </div>
                    ) : (
                        <div
                            className="task-item overdue"
                            onClick={() => handleKpiClick('Overdue Tasks')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="task-icon">
                                <AlertCircle size={16} />
                            </div>
                            <div className="task-info">
                                <p className="task-title">
                                    {overdueCount} Actions Pending Attention
                                </p>
                                <span className="overdue-text">
                                    Requires Immediate Review
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* KPI Details Modal */}
        {activeKpiModal && (
            <div className="kpi-modal-overlay">
                <div className="kpi-modal">
                    {/* Modal Header */}
                    <div className="kpi-modal-header">
                        <h2>
                            {activeKpiModal.title}
                        </h2>
                        <button
                            className="kpi-close-btn"
                            onClick={() => setActiveKpiModal(null)}
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="kpi-modal-body">
                        {activeKpiModal.data.map((item, index) => {
                            // String Renderer
                            if (typeof item === "string") {
                                return (
                                    <div
                                        key={index}
                                        className="kpi-modal-card interactive"
                                        onClick={() => handleModalItemClick(item)}
                                    >
                                        {item}
                                    </div>
                                );
                            }

                             // Overdue Task Card
                            if (item.task) {
                                return (
                                    <div
                                        key={item.id}
                                        className="kpi-modal-card interactive"
                                        onClick={() => handleModalItemClick(item)}
                                    >
                                        <div className="kpi-card-header">
                                            <span className="kpi-id">
                                                {item.id}
                                            </span>
                                            <span className="status-badge badge-overdue">
                                                {item.overdue} Overdue
                                            </span>
                                        </div>
                                        <div className="kpi-company">
                                            {item.company}
                                        </div>
                                        <div className="kpi-details-grid">
                                            <div>
                                                <strong>Owner:</strong>{" "}
                                                {item.owner}
                                            </div>
                                            <div>
                                                <strong>Task:</strong>{" "}
                                                {item.task}
                                            </div>
                                            <div>
                                                <strong>Due Date:</strong>{" "}
                                                {item.dueDate}
                                            </div>
                                            <div>
                                                <strong>Priority:</strong>{" "}
                                                {item.priority}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            // Upcoming Follow-up
                            if (item.task && item.dueDate && !item.stage ) {
                                return(
                                    <div
                                        key={item.id}
                                        className="kpi-modal-card interactive"
                                        onClick={() => handleModalItemClick(item)}
                                    >
                                        <div className="kpi-card-header">
                                            <span className="kpi-id">
                                                {item.id}
                                            </span>
                                            <span className="status-badge badge-upcoming">
                                                Upcoming
                                            </span>
                                        </div>
                                        <div className="kpi-company">
                                            {item.company}
                                        </div>
                                        <div className="kpi-details-grid">
                                            <div>
                                                <strong>Owner:</strong> {item.owner}
                                            </div>
                                            <div>
                                                <strong>Contact:</strong> {item.contact}
                                            </div>
                                            <div>
                                                <strong>Task:</strong> {item.task}
                                            </div>
                                            <div>
                                                <strong>Due Date:</strong> {item.dueDate}
                                            </div>

                                            <div>
                                                <strong>Priority:</strong> {item.priority}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // Won Lead / Closed Lost Card
                            return (
                                <div
                                    key={item.id}
                                    className="kpi-modal-card interactive"
                                    onClick={() => handleModalItemClick(item)}
                                >

                                    <div className="kpi-card-header">
                                        <span className="kpi-id">
                                            {item.id}
                                        </span>

                                        <span
                                            className={`status-badge ${
                                                item.stage === "Won"
                                                    ? "badge-won"
                                                    : (item.stage === "Lost" || item.stage === "Closed Lost")
                                                    ? "badge-lost"
                                                    : "badge-upcoming"
                                            }`}
                                        >
                                            {item.stage}
                                        </span>
                                    </div>

                                    <div className="kpi-company">
                                        {item.company}
                                    </div>

                                    <div className="kpi-details-grid">
                                        <div>
                                            <strong>Owner:</strong>{" "}
                                            {item.owner}
                                        </div>

                                        <div>
                                            <strong>Contact:</strong>{" "}
                                            {item.contact}
                                        </div>

                                        <div>
                                            <strong>Deal Value:</strong>{" "}
                                            {item.value}
                                        </div>

                                        <div>
                                            <strong>Stage:</strong>{" "}
                                            {item.stage}
                                        </div>

                                        <div>
                                            <strong>
                                                {item.stage === "Won"
                                                    ? "Won On:"
                                                    : "Lost On:"}
                                            </strong>{" "}
                                            {item.stage === "Won"
                                                ? item.wonDate
                                                : item.lostDate}
                                        </div>
                                        <div>
                                            <strong>
                                                {item.stage === "Won"
                                                    ? "Sales Cycle:"
                                                    : "Reason:"}
                                            </strong>{" "}
                                            {item.stage === "Won"
                                                ? item.duration
                                                : item.reason}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                      </div>

                    {/* Modal Footer */}
                    <div className="kpi-modal-footer">
                        <button
                            className="btn-primary"
                            onClick={() => setActiveKpiModal(null)}
                        > Close
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
);
}
