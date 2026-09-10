import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend as RechartsLegend,
} from 'recharts';
import { Sparkles, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import LeadHeatMap from './LeadHeatMap';
import { fetchReportsAnalytics } from '../services/leadService';
import './Reports.css';

const CACHE_KEY = 'sales_crm_cached_reports_analytics';

export default function Reports() {
  const [cachedData] = useState(() => {
    try {
      const item = sessionStorage.getItem(CACHE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(!cachedData);
  const [isBackgroundUpdating, setIsBackgroundUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(() => {
    const saved = sessionStorage.getItem('isAiExpanded_reports');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [reportsData, setReportsData] = useState(() => {
    if (cachedData) return cachedData;
    return {
      revenue_summary: {
        total_revenue: 0,
        current_period_revenue: 0,
        previous_period_revenue: 0,
        growth_percent: 0,
        revenue_momentum_text: '+0.0% MoM'
      },
      conversion_analytics: {
        win_rate_percent: 0,
        avg_sales_cycle_days: 0,
        won_count: 0,
        lost_count: 0
      },
      pipeline_by_stage: [],
      pipeline_by_region: [],
      rep_performance: [],
      activity_breakdown: [],
      priority_breakdown: []
    };
  });

  useEffect(() => {
    sessionStorage.setItem('isAiExpanded_reports', JSON.stringify(isAiExpanded));
  }, [isAiExpanded]);

  useEffect(() => {
    let isMounted = true;
    if (cachedData) {
      setIsBackgroundUpdating(true);
    }
    fetchReportsAnalytics()
      .then((resp) => {
        if (isMounted && resp && resp.data) {
          setReportsData(resp.data);
          setError(null);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(resp.data));
          } catch (e) {
            console.warn('Failed to cache reports data', e);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load reports analytics:', err);
          if (!cachedData) {
            setError(err.message || 'Failed to load reports analytics.');
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
          setIsBackgroundUpdating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefreshAi = () => {
    setIsAiLoading(true);
    fetchReportsAnalytics()
      .then((resp) => {
        if (resp && resp.data) {
          setReportsData(resp.data);
          setError(null);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(resp.data));
          } catch (e) {
            console.warn('Failed to cache reports data', e);
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        setIsAiLoading(false);
      });
  };

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

  const pipelineStageData = (reportsData.pipeline_by_stage || []).map(stg => ({
    name: stg.name,
    value: stg.value !== undefined ? stg.value : (stg.deals || 0),
    fill: stg.fill || defaultStageColors[stg.name] || '#93C5FD'
  }));

  const regionColors = {
    'North America': '#1D4ED8',
    'Europe': '#0EA5E9',
    'EMEA': '#0EA5E9',
    'Asia Pacific': '#14B8A6',
    'APAC': '#14B8A6',
    'LATAM': '#F59E0B',
    'India': '#8B5CF6'
  };

  const regionData = (reportsData.pipeline_by_region || []).map(r => ({
    name: r.name === 'Europe' ? 'EMEA' : r.name === 'Asia Pacific' ? 'APAC' : r.name,
    value: r.percent !== undefined ? r.percent : (r.value || 0),
    fill: r.fill || regionColors[r.name] || '#6B7280'
  }));

  const activityColors = {
    'Calls': '#10B981',
    'Emails': '#3B82F6',
    'Meetings': '#F59E0B',
    'Demos': '#8B5CF6',
    'Other': '#6B7280'
  };

  const activityData = (reportsData.activity_breakdown || []).map(act => ({
    name: act.name,
    value: act.percent !== undefined ? act.percent : (act.value || 0),
    count: act.count,
    fill: act.fill || activityColors[act.name] || '#10B981'
  }));

  const repPerformanceData = (reportsData.rep_performance || []).map(rep => ({
    name: rep.name,
    won: rep.won || 0,
    lost: rep.lost || 0,
    pipeline: rep.pipeline || 0,
    total_deals: rep.total_deals
  }));

  const priorityColors = {
    'Critical': 'badge-danger',
    'Urgent': 'badge-danger',
    'High': 'badge-warning',
    'Medium': 'badge-info',
    'Normal': 'badge-info',
    'Low': 'badge-success'
  };

  const priorityLeads = (reportsData.priority_breakdown || []).map(item => {
    const tierName = item.tier || (item.priority === 'Urgent' ? 'Critical' : item.priority === 'Normal' ? 'Medium' : item.priority || 'Normal');
    const valFormatted = typeof item.value === 'number' 
      ? `$${item.value.toLocaleString()}` 
      : (item.value || (item.numeric_value ? `$${item.numeric_value.toLocaleString()}` : '$0'));

    return {
      tier: tierName,
      count: item.count || 0,
      value: valFormatted,
      color: item.color || priorityColors[tierName] || 'badge-info',
      actionStatus: item.action_status || (tierName === 'Critical' ? 'Requires Daily Review' : tierName === 'High' ? 'Weekly Follow-up' : 'Standard Cycle')
    };
  });

  const revenueMomentumText = reportsData.revenue_summary?.revenue_momentum_text || 
    (reportsData.revenue_summary?.growth_percent !== undefined ? `${reportsData.revenue_summary.growth_percent >= 0 ? '+' : ''}${reportsData.revenue_summary.growth_percent}% MoM` : '+0.0% MoM');
  
  const currentRevenue = reportsData.revenue_summary?.total_revenue || reportsData.revenue_summary?.current_period_revenue || 0;
  const winRate = reportsData.conversion_analytics?.win_rate_percent || 0;
  const avgCycle = reportsData.conversion_analytics?.avg_sales_cycle_days || 0;

  const formatCurrency = (val) => `$${(val / 1000)}k`;

  return (
    <div className="reports-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Reports &amp; Analytics</h1>
        {isBackgroundUpdating ? (
          <span className="ai-pulse-indicator">
            <RefreshCw size={13} style={{ animation: 'rotateSparkle 1.5s infinite linear' }} />
            Updating live data...
          </span>
        ) : loading ? (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Loading analytics...</span>
        ) : null}
      </div>

      {error && (
        <div style={{ margin: '16px 0', padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', color: '#991B1B', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={handleRefreshAi} style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {loading && !cachedData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
          <div className="reports-skeleton-card" style={{ height: '140px' }}>
            <div className="skeleton-shimmer" style={{ width: '40%', height: '24px' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', flex: 1 }}>
              <div className="skeleton-shimmer" style={{ height: '100%' }}></div>
              <div className="skeleton-shimmer" style={{ height: '100%' }}></div>
              <div className="skeleton-shimmer" style={{ height: '100%' }}></div>
            </div>
          </div>
          <div className="charts-grid">
            <div className="reports-skeleton-card">
              <div className="skeleton-shimmer" style={{ width: '35%', height: '20px' }}></div>
              <div className="skeleton-shimmer" style={{ flex: 1 }}></div>
            </div>
            <div className="reports-skeleton-card">
              <div className="skeleton-shimmer" style={{ width: '35%', height: '20px' }}></div>
              <div className="skeleton-shimmer" style={{ flex: 1 }}></div>
            </div>
            <div className="reports-skeleton-card">
              <div className="skeleton-shimmer" style={{ width: '35%', height: '20px' }}></div>
              <div className="skeleton-shimmer" style={{ flex: 1 }}></div>
            </div>
            <div className="reports-skeleton-card">
              <div className="skeleton-shimmer" style={{ width: '35%', height: '20px' }}></div>
              <div className="skeleton-shimmer" style={{ flex: 1 }}></div>
            </div>
          </div>
        </div>
      ) : (
        <>

      {/* AI Summary Card for Reports */}
      <div className="card ai-summary-premium-card" style={{ marginTop: '16px' }}>
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
                <div className="ai-premium-stat-value" style={{ color: '#34D399' }}>{revenueMomentumText}</div>
                <div className="ai-premium-stat-desc">${currentRevenue.toLocaleString()} Total Value</div>
              </div>
              <div className="ai-premium-stat-box">
                <div className="ai-premium-stat-title">Conversion Analytics</div>
                <div className="ai-premium-stat-value" style={{ color: '#93C5FD' }}>{winRate}% Win Rate</div>
                <div className="ai-premium-stat-desc">Average cycle: {avgCycle} days</div>
              </div>
              <div className="ai-premium-recommendation-box">
                <div className="ai-premium-recommendation-title">Strategic Close Recommendation</div>
                <div className="ai-premium-recommendation-text">
                  📈 **Channel Velocity:** Real-time analytics indicates highest revenue velocity across qualified proposals. Ensure high-tier opportunities receive dedicated executive review.
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
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
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
    </>
  )}
</div>
  );
}