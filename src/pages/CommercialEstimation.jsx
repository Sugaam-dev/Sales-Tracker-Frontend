import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calculator, DollarSign, Calendar, Clock, Plus, Trash2, TrendingUp, 
  ArrowLeft, FileText, Download, CheckCircle, BarChart3, PieChart as PieIcon, LineChart as LineIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line
} from 'recharts';
import './CommercialEstimation.css';

export default function CommercialEstimation() {
  const location = useLocation();
  const navigate = useNavigate();
  const lead = location.state?.lead;

  // 1. Project Information State
  const [projectInfo, setProjectInfo] = useState({
    proposalId: `PROP-${lead?.id || 1015}`,
    leadName: lead?.contact || 'David Smith',
    clientName: lead?.company || 'Horizon Retail',
    projectName: lead?.projectName || 'Enterprise CRM Upgrade',
    salesExecutive: lead?.owner || 'Alex Johnson',
    currency: 'select',
    billingType: 'Fixed Price',
    duration: 12,
    startDate: '2026-08-01',
    endDate: '2027-08-01'
  });

  // 2. Resource Estimation State
  const gradeDailyCostMap = {
    L1: 180,
    L2: 220,
    L3: 380,
    L4: 520
  };

  const [resources, setResources] = useState([
    { id: 1, role: 'Senior Architect', grade: 'L3', onsiteDays: 20, offshoreDays: 40, dailyCost: gradeDailyCostMap.L3, billingRate: 650 },
    { id: 2, role: 'Software Developer', grade: 'L1', onsiteDays: 10, offshoreDays: 120, dailyCost: gradeDailyCostMap.L1, billingRate: 300 },
    { id: 3, role: 'QA Lead', grade: 'L2', onsiteDays: 5, offshoreDays: 60, dailyCost: gradeDailyCostMap.L2, billingRate: 380 },
    { id: 4, role: 'Project Manager', grade: 'L3', onsiteDays: 15, offshoreDays: 30, dailyCost: gradeDailyCostMap.L3, billingRate: 580 }
  ]);

  // 3. Expense Estimation State
  const [expenses, setExpenses] = useState([
    { id: 1, type: 'Travel', cost: 6500, remarks: 'Client site visits' },
    { id: 2, type: 'Accommodation', cost: 8000, remarks: 'Hotel stays for onsite crew' },
    { id: 3, type: 'Cloud Hosting', cost: 2400, remarks: 'AWS testing infrastructure' },
    { id: 4, type: 'Software Licenses', cost: 1800, remarks: 'Vite & Recharts premium toolsets' },
    { id: 5, type: 'Third Party APIs', cost: 1500, remarks: 'Payment Gateway Integration' },
    { id: 6, type: 'Miscellaneous', cost: 1200, remarks: 'Contingency backup' }
  ]);

  // 4. Scenario Analysis & Financials State
  const [scenario, setScenario] = useState({
    targetMargin: 35,
    discount: 5,
    markup: 25,
    manualSellingPrice: 0,
    useManualPrice: false
  });

  // 5. Phase-wise Allocation State (Default values)
  const defaultPhases = [
    { phase: 'Project Management', weight: 10 },
    { phase: 'Requirement Analysis', weight: 8 },
    { phase: 'Design', weight: 12 },
    { phase: 'Development', weight: 35 },
    { phase: 'Integration', weight: 7 },
    { phase: 'Testing', weight: 12 },
    { phase: 'UAT', weight: 6 },
    { phase: 'Deployment', weight: 4 },
    { phase: 'Go Live', weight: 3 },
    { phase: 'Warranty', weight: 3 }
  ];
  
  const [phases, setPhases] = useState(
    defaultPhases.map((p, idx) => ({ id: idx, phase: p.phase, manDays: 0, percentage: p.weight }))
  );

  // Auto Recalculations
  const [totals, setTotals] = useState({
    onsiteDays: 0,
    offshoreDays: 0,
    totalManDays: 0,
    resourceCost: 0,
    resourceRevenue: 0,
    expenseCost: 0,
    totalCost: 0,
    baseRevenue: 0,
    sellingPrice: 0,
    grossProfit: 0,
    margin: 0,
    roi: 0,
    npv: 0,
    breakeven: 0,
    maxCashOut: 0
  });

  useEffect(() => {
    // Totals from Resources
    let resOnsite = 0;
    let resOffshore = 0;
    let resCost = 0;
    let resRevenue = 0;

    resources.forEach(r => {
      const days = (Number(r.onsiteDays) || 0) + (Number(r.offshoreDays) || 0);
      resOnsite += (Number(r.onsiteDays) || 0);
      resOffshore += (Number(r.offshoreDays) || 0);
      resCost += days * (Number(r.dailyCost) || 0);
      resRevenue += days * (Number(r.billingRate) || 0);
    });

    const totalManDays = resOnsite + resOffshore;

    // Totals from Expenses
    const expCost = expenses.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);

    const totalCost = resCost + expCost;
    const baseRevenue = resRevenue + expCost;

    // Calculate Selling Price based on Scenario Analysis
    let sellingPrice = 0;
    if (scenario.useManualPrice && scenario.manualSellingPrice > 0) {
      sellingPrice = scenario.manualSellingPrice;
    } else {
      // Calculate based on Markup and Discount
      const markedUp = totalCost * (1 + (scenario.markup / 100));
      sellingPrice = markedUp * (1 - (scenario.discount / 100));
    }

    const grossProfit = sellingPrice - totalCost;
    const margin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
    const roi = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

    // NPV Calculation (Mock: 10% discount rate over project duration months)
    const monthlyRate = 0.10 / 12;
    const monthlyRevenue = sellingPrice / Number(projectInfo.duration);
    const monthlyCost = totalCost / Number(projectInfo.duration);
    const netMonthlyInflow = monthlyRevenue - monthlyCost;
    
    let npvVal = 0;
    for (let m = 1; m <= Number(projectInfo.duration); m++) {
      npvVal += netMonthlyInflow / Math.pow(1 + monthlyRate, m);
    }

    // Break-even month
    const breakevenVal = netMonthlyInflow > 0 ? Math.min(Number(projectInfo.duration), Math.max(1, Math.round(totalCost / monthlyRevenue))) : Number(projectInfo.duration);
    
    // Max Cash Out (Estimated peak negative cashflow)
    const maxCashOutVal = totalCost * 0.35;

    setTotals({
      onsiteDays: resOnsite,
      offshoreDays: resOffshore,
      totalManDays,
      resourceCost: resCost,
      resourceRevenue: resRevenue,
      expenseCost: expCost,
      totalCost,
      baseRevenue,
      sellingPrice,
      grossProfit,
      margin,
      roi,
      npv: npvVal,
      breakeven: breakevenVal,
      maxCashOut: maxCashOutVal
    });

    // Update Phase man days based on Total Man Days & weight
    setPhases(prev => prev.map(p => ({
      ...p,
      manDays: Math.round((totalManDays * p.percentage) / 100)
    })));

  }, [resources, expenses, scenario, projectInfo.duration]);

  const lastProjectInfoField = useRef(null);

  const formatDate = (date) => {
    const isoDate = new Date(date);
    if (Number.isNaN(isoDate.getTime())) return '';
    const year = isoDate.getFullYear();
    const month = String(isoDate.getMonth() + 1).padStart(2, '0');
    const day = String(isoDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addMonths = (date, months) => {
    const result = new Date(date);
    const day = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const maxDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, maxDay));
    return result;
  };

  const parseDate = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const calculateDurationMonths = (start, end) => {
    if (!start || !end || end < start) return null;
    let months = 0;
    while (true) {
      const candidate = addMonths(start, months + 1);
      if (candidate >= end || months > 120) {
        return months + 1;
      }
      months += 1;
    }
  };

  const handleProjectInfoChange = (field, val) => {
    const previousField = lastProjectInfoField.current;
    lastProjectInfoField.current = field;

    setProjectInfo(prev => {
      const updated = { ...prev, [field]: val };
      const parsedStart = parseDate(updated.startDate);
      const parsedEnd = parseDate(updated.endDate);
      const durationValue = Number(updated.duration);
      const hasDuration = !Number.isNaN(durationValue) && durationValue >= 1;

      if (field === 'startDate') {
        const preserveDuration = previousField === 'duration' || previousField === null;
        if (parsedStart && hasDuration && preserveDuration) {
          updated.endDate = formatDate(addMonths(parsedStart, durationValue));
        } else if (parsedStart && parsedEnd) {
          const calculatedDuration = calculateDurationMonths(parsedStart, parsedEnd);
          if (calculatedDuration !== null) {
            updated.duration = calculatedDuration;
          }
        }
      }

      if (field === 'duration') {
        const preserveEnd = previousField === 'endDate';
        if (parsedEnd && hasDuration && preserveEnd) {
          updated.startDate = formatDate(addMonths(parsedEnd, -durationValue));
        } else if (parsedStart && hasDuration) {
          updated.endDate = formatDate(addMonths(parsedStart, durationValue));
        } else if (parsedEnd && hasDuration) {
          updated.startDate = formatDate(addMonths(parsedEnd, -durationValue));
        }
      }

      if (field === 'endDate') {
        const preserveDuration = previousField === 'duration';
        if (parsedStart && parsedEnd && !preserveDuration) {
          const calculatedDuration = calculateDurationMonths(parsedStart, parsedEnd);
          if (calculatedDuration !== null) {
            updated.duration = calculatedDuration;
          }
        } else if (parsedEnd && hasDuration) {
          updated.startDate = formatDate(addMonths(parsedEnd, -durationValue));
        }
      }

      return updated;
    });
  };

  // Resource Actions
  const handleResourceChange = (id, field, val) => {
    setResources(prev => prev.map(r => {
      if (r.id === id) {
        let cleanVal = val;
        if (field === 'onsiteDays' || field === 'offshoreDays' || field === 'billingRate') {
          cleanVal = val.replace(/\D/g, ''); // Numbers only validation
        }

        if (field === 'grade') {
          const updatedGrade = val;
          return {
            ...r,
            grade: updatedGrade,
            dailyCost: gradeDailyCostMap[updatedGrade] || r.dailyCost
          };
        }

        if (field === 'dailyCost') {
          return r; // prevent manual daily cost edits
        }

        return { ...r, [field]: cleanVal };
      }
      return r;
    }));
  };

  const handleAddResource = () => {
    const nextId = resources.length > 0 ? Math.max(...resources.map(r => r.id)) + 1 : 1;
    setResources(prev => [
      ...prev,
      { id: nextId, role: 'Software Engineer', grade: 'L1', onsiteDays: 0, offshoreDays: 80, dailyCost: gradeDailyCostMap.L1, billingRate: 250 }
    ]);
  };

  const handleRemoveResource = (id) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  // Expense Actions
  const handleExpenseChange = (id, field, val) => {
    setExpenses(prev => prev.map(e => {
      if (e.id === id) {
        let cleanVal = val;
        if (field === 'cost') {
          cleanVal = val.replace(/\D/g, ''); // Restrict to numbers only
        }
        return { ...e, [field]: cleanVal };
      }
      return e;
    }));
  };

  const handleAddExpense = () => {
    const nextId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    setExpenses(prev => [
      ...prev,
      { id: nextId, type: 'Miscellaneous', cost: 0, remarks: '' }
    ]);
  };

  const handleRemoveExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Scenario Updates
  const handleScenarioSlider = (field, val) => {
    setScenario(prev => {
      const updated = { ...prev, [field]: Number(val), useManualPrice: false };
      return updated;
    });
  };

  const handleManualPriceChange = (val) => {
    const cleanPrice = val.replace(/\D/g, '');
    setScenario(prev => ({
      ...prev,
      manualSellingPrice: Number(cleanPrice),
      useManualPrice: true
    }));
  };

  // Phase allocation update
  const handlePhaseDaysChange = (id, days) => {
    const cleanDays = Number(days.replace(/\D/g, '')) || 0;
    setPhases(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, manDays: cleanDays } : p);
      const newTotal = updated.reduce((sum, p) => sum + p.manDays, 0);
      return updated.map(p => ({
        ...p,
        percentage: newTotal > 0 ? Math.round((p.manDays / newTotal) * 100) : 0
      }));
    });
  };

  // Group resources grade-wise for Allocation table
  const getGradeAllocation = () => {
    const grades = {};
    resources.forEach(r => {
      const totalDays = (Number(r.onsiteDays) || 0) + (Number(r.offshoreDays) || 0);
      grades[r.grade] = (grades[r.grade] || 0) + totalDays;
    });
    const totalDays = Object.values(grades).reduce((sum, d) => sum + d, 0);
    return Object.keys(grades).map(g => ({
      grade: g,
      manDays: grades[g],
      percentage: totalDays > 0 ? Math.round((grades[g] / totalDays) * 100) : 0
    }));
  };

  // Recharts Helper Data
  const getCostPieData = () => {
    const resCost = totals.resourceCost;
    const expenseData = expenses.map(e => ({ name: e.type, value: Number(e.cost) || 0 }));
    return [
      { name: 'Resource Cost', value: resCost },
      ...expenseData.filter(d => d.value > 0)
    ];
  };

  const getRevVsCostData = () => {
    // Onsite and Offshore splits
    let onsiteCost = 0;
    let onsiteRev = 0;
    let offshoreCost = 0;
    let offshoreRev = 0;

    resources.forEach(r => {
      onsiteCost += (Number(r.onsiteDays) || 0) * (Number(r.dailyCost) || 0);
      onsiteRev += (Number(r.onsiteDays) || 0) * (Number(r.billingRate) || 0);
      offshoreCost += (Number(r.offshoreDays) || 0) * (Number(r.dailyCost) || 0);
      offshoreRev += (Number(r.offshoreDays) || 0) * (Number(r.billingRate) || 0);
    });

    return [
      { name: 'Onsite', Revenue: onsiteRev, Cost: onsiteCost },
      { name: 'Offshore', Revenue: offshoreRev, Cost: offshoreCost },
      { name: 'Expenses', Revenue: totals.expenseCost, Cost: totals.expenseCost } // assuming expenses pass-through
    ];
  };

  const getMonthlyCashflowData = () => {
    const data = [];
    const monthlyRev = totals.sellingPrice / Number(projectInfo.duration || 12);
    const monthlyCost = totals.totalCost / Number(projectInfo.duration || 12);
    
    let cumRevenue = 0;
    let cumCost = 0;

    for (let m = 1; m <= Number(projectInfo.duration || 12); m++) {
      cumRevenue += monthlyRev;
      cumCost += monthlyCost;
      data.push({
        name: `Month ${m}`,
        Revenue: Math.round(cumRevenue),
        Cost: Math.round(cumCost),
        Cashflow: Math.round(cumRevenue - cumCost)
      });
    }
    return data;
  };

  const COLORS = ['#1D4ED8', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#64748B'];
  const currencyLabel = projectInfo.currency === 'select' ? '' : projectInfo.currency;
  const currencyDisplay = currencyLabel ? ` (${currencyLabel})` : '';

  return (
    <div className="estimation-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span onClick={() => navigate('/dashboard')}>Dashboard</span> &gt; 
        <span onClick={() => navigate('/leads')}> Leads</span> &gt; 
        <strong> Commercial Estimation</strong>
      </div>

      {/* Header */}
      <div className="estimation-header">
        <div className="estimation-title-sec">
          <h1>Commercial Estimation</h1>
        </div>
        <div className="estimation-header-actions">
          <button className="btn-outline" onClick={() => navigate('/leads')}>
            <ArrowLeft size={16} /> Back to Leads
          </button>
          <button className="btn-outline" onClick={() => alert('Draft saved successfully!')}>Save Draft</button>
          <button className="btn-outline" onClick={() => alert('Proposal successfully generated!')}>Generate Proposal</button>
          <button className="btn-primary-blue" onClick={() => window.print()}>Export PDF</button>
        </div>
      </div>

      {/* 2. Project Information Card */}
      <div className="estimation-card">
        <h2>Project Information</h2>
        <div className="grid-4" style={{ rowGap: '16px' }}>
          <div className="form-field">
            <label>Proposal ID</label>
            <input type="text" value={projectInfo.proposalId} readOnly />
          </div>
          <div className="form-field">
            <label>KAM </label>
            <input type="text" value={projectInfo.leadName} onChange={(e) => handleProjectInfoChange('leadName', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Company Name</label>
            <input type="text" value={projectInfo.clientName} readOnly />
          </div>
          <div className="form-field">
            <label>Project Name</label>
            <input type="text" value={projectInfo.projectName} onChange={(e) => handleProjectInfoChange('projectName', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Sales Executive</label>
            <input type="text" value={projectInfo.salesExecutive} readOnly />
          </div>
          <div className="form-field">
            <label>Currency</label>
            <select value={projectInfo.currency} onChange={(e) => handleProjectInfoChange('currency', e.target.value)}>
              <option value="select">Select Currency</option>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div className="form-field">
            <label>Billing Type</label>
            <select value={projectInfo.billingType} onChange={(e) => handleProjectInfoChange('billingType', e.target.value)}>
              <option value="Fixed Price">Fixed Price</option>
              <option value="Time & Material">Time & Material</option>
            </select>
          </div>
          <div className="form-field">
            <label>Est Project Duration (Months)</label>
            <input type="number" min="1" max="60" value={projectInfo.duration} onChange={(e) => handleProjectInfoChange('duration', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Start Date</label>
            <input type="date" value={projectInfo.startDate} onChange={(e) => handleProjectInfoChange('startDate', e.target.value)} /> 
          </div>
          <div className="form-field">
            <label>Est End Date</label>
            <input type="date" value={projectInfo.endDate} onChange={(e) => handleProjectInfoChange('endDate', e.target.value)} />
          </div>
        </div>
      </div>

      {/* 3. Resource Estimation */}
      <div className="estimation-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2>Resource Estimation</h2>
          <button className="btn-primary-blue" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={handleAddResource}>
            <Plus size={14} /> Add Resource
          </button>
        </div>
        <div className="table-container">
          <table className="estimation-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Grade</th>
                <th>Onsite Days</th>
                <th>Offshore Days</th>
                <th>Daily Cost{currencyDisplay}</th>
                <th>Billing Rate{currencyDisplay}</th>
                <th>Total Cost</th>
                <th>Total Revenue</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(r => {
                const totalDays = (Number(r.onsiteDays) || 0) + (Number(r.offshoreDays) || 0);
                const totalCostVal = totalDays * (Number(r.dailyCost) || 0);
                const totalRevVal = totalDays * (Number(r.billingRate) || 0);
                return (
                  <tr key={r.id}>
                    <td className="role-column">
                      <input type="text" value={r.role} onChange={(e) => handleResourceChange(r.id, 'role', e.target.value)} />
                    </td>
                    <td className="grade-column">
                      <select value={r.grade} onChange={(e) => handleResourceChange(r.id, 'grade', e.target.value)}>
                        <option value="L1">L1 (Junior)</option>
                        <option value="L2">L2 (Mid)</option>
                        <option value="L3">L3 (Senior)</option>
                        <option value="L4">L4 (Principal)</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" value={r.onsiteDays} onChange={(e) => handleResourceChange(r.id, 'onsiteDays', e.target.value)} />
                    </td>
                    <td>
                      <input type="text" value={r.offshoreDays} onChange={(e) => handleResourceChange(r.id, 'offshoreDays', e.target.value)} />
                    </td>
                    <td className="daily-cost-column">
                      <input type="text" value={r.dailyCost} readOnly />
                    </td>
                    <td>
                      <input type="text" value={r.billingRate} onChange={(e) => handleResourceChange(r.id, 'billingRate', e.target.value)} />
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {totalCostVal.toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '600', color: '#1D4ED8' }}>
                      {totalRevVal.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="action-btn-del" onClick={() => handleRemoveResource(r.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td colSpan="2">Totals</td>
                <td>{totals.onsiteDays}</td>
                <td>{totals.offshoreDays}</td>
                <td colSpan="2">-</td>
                <td>{totals.resourceCost.toLocaleString()}</td>
                <td style={{ color: '#1D4ED8' }}>{totals.resourceRevenue.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Expense Estimation */}
      <div className="estimation-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2>Expense Estimation</h2>
          <button className="btn-primary-blue" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={handleAddExpense}>
            <Plus size={14} /> Add Expense
          </button>
        </div>
        <div className="table-container">
          <table className="estimation-table">
            <thead>
              <tr>
                <th>Expense Type</th>
                <th>Cost ({projectInfo.currency})</th>
                <th>Remarks</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td>
                    <input type="text" value={e.type} onChange={(e) => handleExpenseChange(e.id, 'type', e.target.value)} />
                  </td>
                  <td style={{ width: '200px' }}>
                    <input type="text" value={e.cost} onChange={(e) => handleExpenseChange(e.id, 'cost', e.target.value)} />
                  </td>
                  <td>
                    <input type="text" value={e.remarks} onChange={(e) => handleExpenseChange(e.id, 'remarks', e.target.value)} placeholder="Add comments here" />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="action-btn-del" onClick={() => handleRemoveExpense(e.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total Expenses</td>
                <td style={{ color: '#1D4ED8' }}>{totals.expenseCost.toLocaleString()}</td>
                <td colSpan="2">Sum of all non-resource deliverables &amp; hosting</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Financial Summary */}
      <div className="estimation-card">
        <h2>Financial Summary</h2>
        <div className="grid-4" style={{ rowGap: '16px' }}>
          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
              <DollarSign size={22} />
            </div>
            <div className="kpi-info-wrapper">
              <span className="kpi-val">{totals.totalCost.toLocaleString()}</span>
              <span className="kpi-lbl">Total Project Cost</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
              <TrendingUp size={22} />
            </div>
            <div className="kpi-info-wrapper">
              <span className="kpi-val">{Math.round(totals.sellingPrice).toLocaleString()}</span>
              <span className="kpi-lbl">Selling Price</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
              <CheckCircle size={22} />
            </div>
            <div className="kpi-info-wrapper">
              <span className="kpi-val" style={{ color: totals.grossProfit >= 0 ? '#16A34A' : '#EF4444' }}>
                {Math.round(totals.grossProfit).toLocaleString()}
              </span>
              <span className="kpi-lbl">Gross Profit</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ backgroundColor: '#FDF2F8', color: '#DB2777' }}>
              <Clock size={22} />
            </div>
            <div className="kpi-info-wrapper">
              <span className="kpi-val" style={{ color: totals.margin >= 30 ? '#10B981' : '#F59E0B' }}>
                {totals.margin.toFixed(1)}%
              </span>
              <span className="kpi-lbl">Margin %</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <BarChart3 size={22} />
            </div>
            <div className="kpi-info-wrapper">
              <span className="kpi-val">{totals.roi.toFixed(1)}%</span>
              <span className="kpi-lbl">ROI (Return on Investment)</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ backgroundColor: '#F5F5F5', color: '#737373' }}>
              <Calendar size={22} />
            </div>
            <div className="kpi-info-wrapper">
              <span className="kpi-val">Month {totals.breakeven}</span>
              <span className="kpi-lbl">Break-even Month</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>
              <TrendingUp size={22} />
            </div>
            <div className="kpi-info-wrapper">
              <span className="kpi-val">{Math.round(totals.maxCashOut).toLocaleString()}</span>
              <span className="kpi-lbl">Maximum Cash Out</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
              <DollarSign size={22} />
            </div>
            <div className="kpi-info-wrapper">
              <span className="kpi-val">{Math.round(totals.npv).toLocaleString()}</span>
              <span className="kpi-lbl">Net Present Value (NPV)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Scenario Analysis */}
      <div className="estimation-card">
        <h2>Scenario Analysis</h2>
        <div className="grid-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="slider-group">
              <div className="slider-header">
                <span>Markup %</span>
                <span className="slider-val">{scenario.markup}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={scenario.markup} 
                onChange={(e) => handleScenarioSlider('markup', e.target.value)} 
                className="slider-input" 
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>Discount %</span>
                <span className="slider-val">{scenario.discount}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="50" 
                value={scenario.discount} 
                onChange={(e) => handleScenarioSlider('discount', e.target.value)} 
                className="slider-input" 
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>Target Margin % (reference)</span>
                <span className="slider-val">{scenario.targetMargin}%</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="80" 
                value={scenario.targetMargin} 
                onChange={(e) => handleScenarioSlider('targetMargin', e.target.value)} 
                className="slider-input" 
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div className="form-field" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#1E293B' }}>Or Override Selling Price Manually</label>
              <input 
                type="text" 
                value={scenario.useManualPrice ? scenario.manualSellingPrice : ''} 
                onChange={(e) => handleManualPriceChange(e.target.value)} 
                placeholder={`Auto calculated: ${Math.round(totals.sellingPrice).toLocaleString()}`}
                style={{ fontSize: '1.125rem', padding: '10px 14px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
              <span>Target Margin Selling Price:</span>
              <strong style={{ color: '#0F172A' }}>
                {(totals.totalCost / (1 - (scenario.targetMargin / 100))).toLocaleString([], {maximumFractionDigits: 0})}
              </strong>
            </div>
            {scenario.useManualPrice && (
              <button 
                className="btn-outline" 
                style={{ marginTop: '12px', padding: '6px 12px', justifyContent: 'center' }}
                onClick={() => setScenario(prev => ({ ...prev, useManualPrice: false }))}
              >
                Reset to Auto Calculated Price
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 7. Resource Allocation */}
      <div className="tables-flex" style={{ marginBottom: '24px' }}>
        {/* Grade-wise */}
        <div className="estimation-card" style={{ margin: 0 }}>
          <h2>Grade-wise Allocation</h2>
          <div className="table-container">
            <table className="estimation-table">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Man-days</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {getGradeAllocation().map((g, idx) => (
                  <tr key={idx}>
                    <td><span className="est-badge est-badge-blue">{g.grade}</span></td>
                    <td>{g.manDays}</td>
                    <td style={{ fontWeight: '600' }}>{g.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phase-wise */}
        <div className="estimation-card" style={{ margin: 0 }}>
          <h2>Phase-wise Allocation (SDLC)</h2>
          <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="estimation-table">
              <thead>
                <tr>
                  <th>SDLC Phase</th>
                  <th>Man-days</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {phases.map(p => (
                  <tr key={p.id}>
                    <td>{p.phase}</td>
                    <td>
                      <input 
                        type="text" 
                        value={p.manDays} 
                        onChange={(e) => handlePhaseDaysChange(p.id, e.target.value)} 
                        style={{ padding: '4px 8px', maxWidth: '100px' }}
                      />
                    </td>
                    <td style={{ fontWeight: '600' }}>{p.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 8. Dashboard Analytics */}
      <div className="charts-grid-container">
        {/* Pie Cost breakdown */}
        <div className="chart-card-wrapper">
          <h3>Cost Breakdown{currencyDisplay}</h3>
          <div className="chart-canvas-mock">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getCostPieData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {getCostPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Revenue vs Cost */}
        <div className="chart-card-wrapper">
          <h3>Revenue vs Cost</h3>
          <div className="chart-canvas-mock">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getRevVsCostData()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Revenue" fill="#1D4ED8" />
                <Bar dataKey="Cost" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SDLC Distribution */}
        <div className="chart-card-wrapper">
          <h3>SDLC Effort Distribution (Man-days)</h3>
          <div className="chart-canvas-mock">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phases.filter(p => p.manDays > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="manDays"
                  nameKey="phase"
                  label={({ phase, percent }) => `${phase} (${(percent * 100).toFixed(0)}%)`}
                >
                  {phases.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} Man-days`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cashflow Line Chart */}
        <div className="chart-card-wrapper">
          <h3>Cumulative Cash Flow Projection</h3>
          <div className="chart-canvas-mock">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getMonthlyCashflowData()} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#1D4ED8" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Cost" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Cashflow" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 9. Commercial Summary Highlight */}
      <div className="estimation-highlight-card">
        <h2>Commercial Summary Highlight</h2>
        <div className="summary-metrics-grid">
          <div className="metric-item">
            <span className="metric-lbl">Total Project Cost</span>
            <span className="metric-val">{totals.totalCost.toLocaleString()}{currencyLabel ? ` ${currencyLabel}` : ''}</span>
          </div>
          <div className="metric-item">
            <span className="metric-lbl">Total Revenue</span>
            <span className="metric-val">{Math.round(totals.sellingPrice).toLocaleString()}{currencyLabel ? ` ${currencyLabel}` : ''}</span>
          </div>
          <div className="metric-item">
            <span className="metric-lbl">Profit Margin</span>
            <span className="metric-val" style={{ color: totals.margin >= 30 ? '#34D399' : '#FBBF24' }}>
              {totals.margin.toFixed(1)}%
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-lbl">Net Present Value (NPV)</span>
            <span className="metric-val">{Math.round(totals.npv).toLocaleString()}{currencyLabel ? ` ${currencyLabel}` : ''}</span>
          </div>
          <div className="metric-item" style={{ marginTop: '12px' }}>
            <span className="metric-lbl">Total Effort (Effort-days)</span>
            <span className="metric-val">{totals.totalManDays} Man-days</span>
          </div>
          <div className="metric-item" style={{ marginTop: '12px' }}>
            <span className="metric-lbl">Avg Revenue/Employee</span>
            <span className="metric-val">
              {totals.totalManDays > 0 ? Math.round(totals.sellingPrice / (totals.totalManDays / 22)).toLocaleString() : 0} {projectInfo.currency}
            </span>
          </div>
          <div className="metric-item" style={{ marginTop: '12px' }}>
            <span className="metric-lbl">Est. Break-even</span>
            <span className="metric-val">Month {totals.breakeven}</span>
          </div>
          <div className="metric-item" style={{ marginTop: '12px' }}>
            <span className="metric-lbl">ROI Rate</span>
            <span className="metric-val">{totals.roi.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* 10. Sticky Footer Actions */}
      <div className="sticky-footer-actions">
        <div className="left-actions">
          <button className="btn-outline" onClick={() => alert('Draft saved!')}>Save Draft</button>
          <button className="btn-outline" onClick={() => alert('Recalculated successfully!')}>Recalculate</button>
        </div>
        <div className="right-actions">
          <button className="btn-outline" onClick={() => alert('Excel sheet successfully exported!')}>Export Excel</button>
          <button className="btn-outline" onClick={() => alert('Proposal documents generated!')}>Generate Proposal</button>
          <button className="btn-success-green" onClick={() => alert('Submitted for executive level approval!')}>Submit for Approval</button>
          <button className="btn-primary-blue" onClick={() => window.print()}>Export PDF</button>
        </div>
      </div>
    </div>
  );
}
