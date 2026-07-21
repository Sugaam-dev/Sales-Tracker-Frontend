import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend as RechartsLegend,
} from 'recharts';
import { Sparkles, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import LeadHeatMap from './LeadHeatMap';
import { initialLeadsData } from './mockLeads';
import './Reports.css';

export default function Reports() {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(() => {
    const saved = sessionStorage.getItem('isAiExpanded_reports');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    sessionStorage.setItem('isAiExpanded_reports', JSON.stringify(isAiExpanded));
  }, [isAiExpanded]);

  const handleRefreshAi = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
    }, 1000);
  };

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
    const valueSum = initialLeadsData
      .filter(l => l.stage === stg.name)
      .reduce((sum, l) => sum + (parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0), 0);
    return { name: stg.name, value: valueSum, fill: stg.fill };
  });

  const totalValueSum = initialLeadsData.reduce((sum, l) => sum + (parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0), 0) || 1;
  const regionColors = {
    'North America': '#1D4ED8',
    'Europe': '#0EA5E9',
    'Asia Pacific': '#14B8A6',
    'LATAM': '#F59E0B',
    'India': '#8B5CF6'
  };
  const regionNames = ['North America', 'Europe', 'Asia Pacific', 'LATAM', 'India'];
  const regionData = regionNames.map(name => {
    const valueSum = initialLeadsData
      .filter(l => l.region === name)
      .reduce((sum, l) => sum + (parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0), 0);
    const percent = Math.round((valueSum / totalValueSum) * 100);
    return { name: name === 'Europe' ? 'EMEA' : name === 'Asia Pacific' ? 'APAC' : name, value: percent, fill: regionColors[name] || '#6B7280' };
  });

  const callsCount = initialLeadsData.filter(l => ['Cold Call', 'Referral', 'Partner'].includes(l.source)).length;
  const emailsCount = initialLeadsData.filter(l => ['LinkedIn', 'Outbound', 'Newsletter'].includes(l.source)).length;
  const meetingsCount = initialLeadsData.filter(l => ['Webinar', 'Event', 'Conference'].includes(l.source)).length;
  const demosCount = initialLeadsData.filter(l => ['Website', 'Web', 'Google', 'Direct'].includes(l.source)).length;
  const totalAct = (callsCount + emailsCount + meetingsCount + demosCount) || 1;

  const activityData = [
    { name: 'Calls', value: Math.round((callsCount / totalAct) * 100), fill: '#10B981' },
    { name: 'Emails', value: Math.round((emailsCount / totalAct) * 100), fill: '#3B82F6' },
    { name: 'Meetings', value: Math.round((meetingsCount / totalAct) * 100), fill: '#F59E0B' },
    { name: 'Demos', value: Math.round((demosCount / totalAct) * 100), fill: '#8B5CF6' },
  ];

  const repNames = [
    { label: 'D. Ghosh', search: 'Debabrata Ghosh' },
    { label: 'S. Mishra', search: 'Sanjay Mishra' },
    { label: 'H. Kumar', search: 'Hemant Kumar' },
    { label: 'P. Sharma', search: 'Prashant Sharma' },
    { label: 'R. Nair', search: 'Rajesh Nair' }
  ];

  const repPerformanceData = repNames.map(rep => {
    const leadsForRep = initialLeadsData.filter(l => l.owner === rep.search || l.owner === rep.label);
    const won = leadsForRep
      .filter(l => l.status === 'Won')
      .reduce((sum, l) => sum + (parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0), 0);
    const lost = leadsForRep
      .filter(l => l.status === 'Lost')
      .reduce((sum, l) => sum + (parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0), 0);
    const pipeline = leadsForRep
      .filter(l => l.status !== 'Won' && l.status !== 'Lost')
      .reduce((sum, l) => sum + (parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0), 0);
    
    return { name: rep.label, won, lost, pipeline };
  });

  const priorityList = [
    { tier: 'Urgent', label: 'Critical', color: 'badge-danger' },
    { tier: 'High', label: 'High', color: 'badge-warning' },
    { tier: 'Normal', label: 'Medium', color: 'badge-info' },
    { tier: 'Low', label: 'Low', color: 'badge-success' }
  ];

  const priorityLeads = priorityList.map(item => {
    const matching = initialLeadsData.filter(l => l.priority === item.tier || (item.tier === 'Normal' && l.priority === 'Medium'));
    const count = matching.length;
    const valueSum = matching.reduce((sum, l) => sum + (parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0), 0);
    return {
      tier: item.label,
      count,
      value: `$${valueSum.toLocaleString()}`,
      color: item.color
    };
  });

  const formatCurrency = (val) => `$${(val / 1000)}k`;

  return (
    <div className="reports-container">
      <h1 className="page-title">Reports &amp; Analytics</h1>

      {/* AI Summary Card for Reports */}
      <div className="card ai-summary-premium-card">
        <div className="ai-card-glow"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: '#FFFFFF' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'white' }}>AI Revenue &amp; Growth Insights</h3>
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
                <div className="ai-premium-stat-title">Revenue Momentum</div>
                <div className="ai-premium-stat-value" style={{ color: '#34D399' }}>+18.4% MoM</div>
                <div className="ai-premium-stat-desc">$1,075,000 Total Value</div>
              </div>
              <div className="ai-premium-stat-box">
                <div className="ai-premium-stat-title">Conversion Analytics</div>
                <div className="ai-premium-stat-value" style={{ color: '#93C5FD' }}>22.4% Win Rate</div>
                <div className="ai-premium-stat-desc">Average cycle: 14.5 days</div>
              </div>
              <div className="ai-premium-recommendation-box">
                <div className="ai-premium-recommendation-title">Strategic Close Recommendation</div>
                <div className="ai-premium-recommendation-text">
                  📈 **Channel Velocity:** The Inbound / Self-Serve channel has a 34% shorter cycle length than Enterprise. Shifting 15% of outbound marketing to self-serve landing pages is projected to yield an additional $85k in revenue by Q3.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="charts-grid">
        {/* Pipeline by Stage (Vertical Bar) */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Pipeline by Stage</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineStageData} margin={{ top: 10, right: 10, left: 30, bottom: 35 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={70} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                 <Tooltip 
                   formatter={(value) => `$${value.toLocaleString()}`} 
                   contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px' }}
                   labelStyle={{ color: 'var(--color-text-main)', fontWeight: 'bold' }}
                   itemStyle={{ color: 'var(--color-primary)' }}
                 />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pipelineStageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline by Region (Donut) */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Pipeline by Region</h3>
          </div>
          <div className="chart-wrapper pie-chart-layout">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value}%`} 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px' }}
                  labelStyle={{ color: 'var(--color-text-main)', fontWeight: 'bold' }}
                  itemStyle={{ color: 'var(--color-primary)' }}
                />
                <RechartsLegend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rep Performance (Stacked Horizontal) */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Rep Performance ($)</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repPerformanceData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                <Tooltip 
                  cursor={{ fill: 'rgba(226, 232, 240, 0.3)' }} 
                  formatter={(value) => `$${value.toLocaleString()}`} 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px' }}
                  labelStyle={{ color: 'var(--color-text-main)', fontWeight: 'bold' }}
                  itemStyle={{ color: 'var(--color-primary)' }}
                />
                <RechartsLegend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="won" name="Won" stackId="a" fill="#10B981" />
                <Bar dataKey="pipeline" name="Pipeline" stackId="a" fill="#3B82F6" />
                <Bar dataKey="lost" name="Lost" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Breakdown (Pie) */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Activity Breakdown</h3>
          </div>
          <div className="chart-wrapper pie-chart-layout">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value}%`} 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px' }}
                  labelStyle={{ color: 'var(--color-text-main)', fontWeight: 'bold' }}
                  itemStyle={{ color: 'var(--color-primary)' }}
                />
                <RechartsLegend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Lead Heat Map ── */}
      <LeadHeatMap />

      {/* Leads by Priority table */}
      <div className="card full-width-card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3>Leads by Priority</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Priority Tier</th>
                <th>Total Leads</th>
                <th>Total Pipeline Value</th>
                <th>Action Status</th>
              </tr>
            </thead>
            <tbody>
              {priorityLeads.map((tier, index) => (
                <tr key={index}>
                  <td><span className={`badge ${tier.color}`}>{tier.tier}</span></td>
                  <td className="font-medium">{tier.count}</td>
                  <td className="font-semibold">{tier.value}</td>
                  <td>
                    {tier.tier === 'Critical' ? 'Requires Daily Review' :
                     tier.tier === 'High' ? 'Weekly Follow-up' :
                     'Standard Cycle'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}