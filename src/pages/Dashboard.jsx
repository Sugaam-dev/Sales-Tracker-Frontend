import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Percent, AlertCircle, CheckCircle2, Clock, X, Sparkles, RefreshCw, Trash2, Edit2, PlusCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import KpiCard from '../components/KpiCard';
import { initialLeadsData } from './mockLeads';
import { fetchTasks, createTask, updateTaskStatus, deleteTask } from '../services/leadService';
import './Dashboard.css';

export default function Dashboard() {
  const [activeKpiModal, setActiveKpiModal] = useState(null);
  const navigate = useNavigate();

  const [isAiExpanded, setIsAiExpanded] = useState(() => {
    const saved = sessionStorage.getItem('isAiExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  React.useEffect(() => {
    sessionStorage.setItem('isAiExpanded', JSON.stringify(isAiExpanded));
  }, [isAiExpanded]);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState([
    { icon: '🚀', text: 'Pipeline value increased by 14% this week due to Stark Industries deal sizing.', type: 'trend', badge: 'Revenue Up' },
    { icon: '🔥', text: 'Quantum Tech is ready for closing; schedule the Negotiation review today.', type: 'action', badge: 'Hot Deal' },
    { icon: '🔥', text: 'Zenith Financial has proposal active; high conversion likelihood predicted (75%).', type: 'action', badge: 'Action Recommended' },
    { icon: '⚠️', text: 'Action required: 4 follow-up activities are pending for this week.', type: 'alert', badge: 'Tasks Pending' }
  ]);

  const handleRefreshAi = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      setAiInsights([
        { icon: '🚀', text: 'Stark Industries and Wayne Enterprises represent 36% of your active pipeline.', type: 'trend', badge: 'Insights' },
        { icon: '🔥', text: 'Zenith Financial has proposal active; high conversion likelihood predicted (75%).', type: 'action', badge: 'Action Recommended' },
        { icon: '⚠️', text: 'Action required: 4 follow-up activities are pending for this week.', type: 'alert', badge: 'Tasks Pending' }
      ]);
    }, 1500);
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

  const wonLeads = initialLeadsData.filter(l => l.status === 'Won').map(l => ({
    id: `L-${l.id.toString().padStart(4, '0')}`,
    company: l.company,
    owner: l.owner,
    contact: l.contact,
    stage: 'Won',
    value: l.value,
    wonDate: l.history?.find(h => h.action === 'Deal Won')?.date || l.estDate,
    duration: '35 Days'
  }));

  const closedLostLeads = initialLeadsData.filter(l => l.status === 'Lost').map(l => ({
    id: `L-${l.id.toString().padStart(4, '0')}`,
    company: l.company,
    owner: l.owner,
    contact: l.contact,
    stage: 'Closed Lost',
    value: l.value,
    lostDate: l.history?.find(h => h.action === 'Deal Lost')?.date || l.estDate,
    reason: l.lostReason || 'Budget Constraints'
  }));

  const openLeads = initialLeadsData.filter(l => l.status !== 'Won' && l.status !== 'Lost');

  const overdueTasks = initialLeadsData.filter(l => l.isOverdue || (l.status !== 'Won' && l.status !== 'Lost' && new Date(l.estDate) < new Date('2026-07-07'))).map(l => {
    let taskName = 'Follow-up Call';
    if (l.stage === 'Qualification') taskName = 'Qualification Review';
    if (l.stage === 'Needs Analysis') taskName = 'Requirements Gathering';
    if (l.stage === 'Proposal') taskName = 'Proposal Discussion';
    if (l.stage === 'Negotiation') taskName = 'Contract Negotiation';
    
    const diffTime = Math.abs(new Date('2026-07-07') - new Date(l.estDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      id: `L-${l.id.toString().padStart(4, '0')}`,
      company: l.company,
      owner: l.owner,
      task: taskName,
      dueDate: l.estDate,
      overdue: `${diffDays} Days`,
      priority: l.priority || 'High'
    };
  });

  const upcomingTasks = initialLeadsData.filter(l => l.status !== 'Won' && l.status !== 'Lost' && new Date(l.estDate) >= new Date('2026-07-07')).map(l => {
    let taskName = 'Discovery Call';
    if (l.stage === 'Proposal') taskName = 'Proposal Review';
    if (l.stage === 'Negotiation') taskName = 'Contract Discussion';
    if (l.stage === 'Needs Analysis') taskName = 'Product Demo';

    const diffTime = new Date(l.estDate) - new Date('2026-07-07');
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let dueDateStr = `${diffDays} Days`;
    if (diffDays === 0) dueDateStr = 'Today';
    else if (diffDays === 1) dueDateStr = 'Tomorrow';
    else dueDateStr = `Due in ${diffDays} Days`;

    return {
      id: `L-${l.id.toString().padStart(4, '0')}`,
      company: l.company,
      owner: l.owner,
      task: taskName,
      dueDate: dueDateStr,
      priority: l.priority || 'Normal',
      contact: l.contact
    };
  });

  const totalPipelineVal = openLeads.reduce((sum, l) => {
    const val = parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0;
    return sum + val;
  }, 0);
  
  const expectedPipelineVal = openLeads.reduce((sum, l) => {
    const val = parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0;
    const prob = l.prob || 0;
    return sum + (val * (prob / 100));
  }, 0);

  const stagesList = [
    { name: 'Prospecting', fill: '#93C5FD' },
    { name: 'Qualification', fill: '#A7F3D0' },
    { name: 'Initial Discussion', fill: '#99F6E4' },
    { name: 'Needs Analysis', fill: '#FDE68A' },
    { name: 'Proposal', fill: '#C7D2FE' },
    { name: 'Negotiation', fill: '#FBCFE8' },
    { name: 'Closed Won', fill: '#34D399' },
    { name: 'Closed Lost', fill: '#F87171' }
  ];

  const pipelineStageData = stagesList.map(stg => {
    const count = initialLeadsData.filter(l => l.stage === stg.name).length;
    return { name: stg.name, deals: count, fill: stg.fill };
  });

  const totalLeadsCount = initialLeadsData.length || 1;
  const regionNames = ['North America', 'Europe', 'Asia Pacific', 'LATAM', 'India'];
  const regions = regionNames.map(name => {
    const count = initialLeadsData.filter(l => l.region === name).length;
    const percent = Math.round((count / totalLeadsCount) * 100);
    return { name, percent };
  });

  const kpiData = [
    { title: 'Total Pipeline ', value: `$${totalPipelineVal.toLocaleString()}`, subtext: `${openLeads.length} open deals`, icon: <DollarSign size={18} />, color: '#1D4ED8' },
    { title: 'Expected Value ', value: `$${expectedPipelineVal.toLocaleString()}`, subtext: 'Based on probability', icon: <Percent size={18} />, color: '#10B981' },
    { title: 'Overdue Tasks ', value: `${overdueTasks.length}`, subtext: 'Requires immediate action', icon: <AlertCircle size={18} />, color: '#EF4444' },
    { title: 'Won Leads ', value: `${wonLeads.length}`, subtext: 'Year to date', icon: <CheckCircle2 size={18} />, color: '#F59E0B' },
    { title: 'Closed Lost ', value: `${closedLostLeads.length}`, subtext: 'Year to date', icon: <X size={18} />, color: '#DC2626' }
  ];

  const handleKpiClick = (title) => {
    if (title === 'Total Pipeline') {
      const openDeadsList = openLeads.map(l => `${l.company} - ${l.value}`);
      setActiveKpiModal({ title: `${openLeads.length} Open Deals ($${totalPipelineVal.toLocaleString()})`, data: openDeadsList });
    } else if (title === 'Expected Value') {
      const expectedBreakdown = openLeads.map(l => `${l.company} (${l.prob || 0}%) - $${( (parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0) * ((l.prob || 0)/100) ).toLocaleString()}`);
      setActiveKpiModal({ title: `Expected Value Breakdown ($${expectedPipelineVal.toLocaleString()})`, data: expectedBreakdown });
    } else if (title === 'Overdue Tasks') {
      setActiveKpiModal({ title: `${overdueTasks.length} Overdue Tasks`, data: overdueTasks });
    } else if (title === 'Won Leads') {
      setActiveKpiModal({ title: `${wonLeads.length} Won Leads`, data: wonLeads });
    } else if(title==="Closed Lost"){
      setActiveKpiModal({ title:`${closedLostLeads.length} Closed Lost Leads`,data:closedLostLeads });
    }
  };
  const handleRegionClick = (regionName) => {
    const leadsByRegion = {
      'North America': [
        { id: 'L-0015', company: 'Horizon Retail', value: '$45,000', stage: 'Proposal', contact: 'David Smith', owner: 'Alex Johnson' },
        { id: 'L-0022', company: 'NovaMed Healthcare', value: '$85,000', stage: 'Needs Analysis', contact: 'Jennifer Wu', owner: 'Sarah Jenkins' },
        { id: 'L-0028', company: 'Quantum Tech', value: '$210,000', stage: 'Negotiation', contact: 'Alex Rodriguez', owner: 'Debabrata Ghosh' },
        { id: 'L-0023', company: 'Acme Corp', value: '$55,000', stage: 'Qualification', contact: 'John Doe', owner: 'Sarah Jenkins' },
        { id: 'L-0019', company: 'Wayne Enterprises', value: '$190,000', stage: 'Negotiation', contact: 'Lucius Fox', owner: 'David Miller' },
        { id: 'L-0030', company: 'Stark Industries', value: '$100,000', stage: 'Proposal', contact: 'Pepper Potts', owner: 'Sanjay Mishra' }
      ],
      'Europe': [
        { id: 'L-0016', company: 'Zenith Financial', value: '$120,000', stage: 'Negotiation', contact: 'Alice Cooper', owner: 'Sarah Jenkins' },
        { id: 'L-0018', company: 'Globex Inc', value: '$210,000', stage: 'Won', contact: 'Hank Scorpio', owner: 'Sarah Jenkins' }
      ],
      'Asia Pacific': [
        { id: 'L-0004', company: 'Initech', value: '$350,000', stage: 'Won', contact: 'Peter Gibbons', owner: 'Alex Johnson' },
        { id: 'L-0012', company: 'GlobalTech Solutions', value: '$150,000', stage: 'Proposal', contact: 'Paul Allen', owner: 'Sarah Jenkins' },
        { id: 'L-0008', company: 'Pinnacle Consulting', value: '$90,000', stage: 'Prospecting', contact: 'Jane Smith', owner: 'Alex Johnson' }
      ],
      'LATAM': [
        { id: 'L-0005', company: 'EcoLogistics', value: '$30,000', stage: 'Prospecting', contact: 'David Smith', owner: 'Sanjay Mishra' }
      ],
      'India': [
        { id: 'L-0010', company: 'Mock Company India', value: '$75,000', stage: 'Qualification', contact: 'Contact Tech', owner: 'Sanjay Mishra' }
      ]
    };

    const data = leadsByRegion[regionName] || [];
    setActiveKpiModal({
      title: `${regionName} Region - Lead List`,
      data: data
    });
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
        <h1 className="page-title"> Dashboard </h1>

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
                    {overdueTasks.map((task) => (
                        <div
                            key={task.id}
                            className="task-item overdue"
                            onClick={() =>
                                setActiveKpiModal({
                                    title: `${task.company} - Overdue Task`,
                                    data: [task]
                                })
                            }
                        >
                            <div className="task-icon">
                                <AlertCircle size={16} />
                            </div>
                            <div className="task-info">
                                <p className="task-title">
                                    {task.company}
                                </p>
                                <span className="overdue-text">
                                    {task.overdue} Overdue
                                </span>
                            </div>
                        </div>
                    ))}
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
