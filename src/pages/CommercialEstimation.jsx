import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, Calendar, Clock, Plus, Trash2, TrendingUp, 
  ArrowLeft, CheckCircle, BarChart3, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line
} from 'recharts';
import { fetchCommercial, updateCommercial, fetchCommercialAnalytics } from '../services/commercialService';
import './CommercialEstimation.css';

const STANDARD_ROLES = [
  'Senior Fullstack Developer',
  'Junior / Mid Fullstack Developer',
  'Frontend Developer',
  'Backend Developer',
  'QA / Test Engineer',
  'DevOps Engineer',
  'Solution Architect',
  'UI/UX Designer',
  'Project Manager / Scrum Master',
  'Business Analyst',
  'Data Engineer',
  'Technical Lead',
  'Other'
];

const STANDARD_EXPENSE_TYPES = [
  'Travel',
  'Accommodation',
  'Cloud Hosting',
  'Software Licenses',
  'Third Party APIs',
  'Hardware / Equipment',
  'Miscellaneous',
  'Other'
];

const getRoleDropdownState = (role) => {
  const trimmed = (role || '').trim();
  if (!trimmed) {
    return { role: STANDARD_ROLES[0], selectedRole: STANDARD_ROLES[0], customRole: '' };
  }
  const isStandard = STANDARD_ROLES.filter(r => r !== 'Other').includes(trimmed);
  return {
    role: trimmed,
    selectedRole: isStandard ? trimmed : 'Other',
    customRole: isStandard ? '' : (trimmed === 'Other' ? '' : trimmed)
  };
};

const DEFAULT_SDLC_PHASES = [
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

const BASE_GRADE_DAILY_COSTS_USD = {
  L1: 180,
  L2: 220,
  L3: 380,
  L4: 520
};

const CURRENCY_RATES = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.50
};

export default function CommercialEstimation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract lead ID safely
  const leadFromState = location.state?.lead;
  const rawLeadId = leadFromState?.id || leadFromState?.leadId || searchParams.get('leadId') || searchParams.get('id') || 'L-0001';
  const leadId = String(rawLeadId).startsWith('L-') ? String(rawLeadId) : `L-${rawLeadId}`;

  // Page Load / API State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  // 1. Project Information State
  const [projectInfo, setProjectInfo] = useState(() => ({
    proposalId: `PROP-${leadId}`,
    leadName: leadFromState?.contact || '',
    clientName: leadFromState?.company || '',
    projectName: leadFromState?.projectName || 'Enterprise Upgrade',
    salesExecutive: leadFromState?.owner || '',
    currency: 'USD',
    billingType: 'Fixed Price',
    duration: 12,
    startDate: '',
    endDate: '',
    status: 'DRAFT'
  }));

  // 2. Resource Estimation State
  const [resources, setResources] = useState([]);

  // 3. Expense Estimation State
  const [expenses, setExpenses] = useState([]);

  // 4. Scenario Analysis State
  const [scenario, setScenario] = useState({
    targetMargin: 35,
    discount: 0,
    markup: 0,
    manualSellingPrice: 0,
    useManualPrice: false
  });

  // 5. Phase-wise SDLC Allocation State
  const [phases, setPhases] = useState(
    DEFAULT_SDLC_PHASES.map((p, idx) => ({ id: idx + 1, phase: p.phase, manDays: 0, percentage: p.weight }))
  );

  // 6. Real-time Reactive Derived Totals & Financials
  const totals = useMemo(() => {
    let onsiteDays = 0;
    let offshoreDays = 0;
    let resourceCost = 0;
    let resourceRevenue = 0;

    resources.forEach(r => {
      const on = Number(r.onsiteDays) || 0;
      const off = Number(r.offshoreDays) || 0;
      const days = on + off;
      const cost = Number(r.dailyCost) || 0;
      const rate = Number(r.billingRate) || 0;

      onsiteDays += on;
      offshoreDays += off;
      resourceCost += days * cost;
      resourceRevenue += days * rate;
    });

    const totalManDays = onsiteDays + offshoreDays;
    const expenseCost = expenses.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
    const totalCost = resourceCost + expenseCost;

    const sellingPrice = (scenario.useManualPrice && Number(scenario.manualSellingPrice) > 0)
      ? Number(scenario.manualSellingPrice)
      : (totalCost * (1 + (Number(scenario.markup) || 0) / 100)) * (1 - (Number(scenario.discount) || 0) / 100);

    const grossProfit = sellingPrice - totalCost;
    const margin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
    const roi = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

    const duration = Number(projectInfo.duration) || 1;
    const monthlyRevenue = sellingPrice / duration;
    const monthlyCost = totalCost / duration;
    const netMonthly = monthlyRevenue - monthlyCost;
    const breakeven = netMonthly > 0 ? Math.min(duration, Math.max(1, Math.round(totalCost / monthlyRevenue))) : duration;
    const maxCashOut = totalCost * 0.35;

    const monthlyRate = 0.10 / 12;
    let npv = 0;
    for (let m = 1; m <= duration; m++) {
      npv += netMonthly / Math.pow(1 + monthlyRate, m);
    }

    return {
      onsiteDays,
      offshoreDays,
      totalManDays,
      resourceCost,
      resourceRevenue,
      expenseCost,
      totalCost,
      baseRevenue: sellingPrice,
      sellingPrice,
      grossProfit,
      margin,
      roi,
      npv,
      breakeven,
      maxCashOut
    };
  }, [resources, expenses, scenario, projectInfo.duration]);

  // 7. Backend Analytics Data
  const [analyticsData, setAnalyticsData] = useState(null);

  const getGradeDailyCost = useCallback((grade, currency = 'USD') => {
    const base = BASE_GRADE_DAILY_COSTS_USD[grade] || BASE_GRADE_DAILY_COSTS_USD.L1;
    const rate = CURRENCY_RATES[currency] || 1.00;
    return Math.round(base * rate * 100) / 100;
  }, []);

  // Helper to sync state from backend GetCommercialResponse
  const populateFromBackend = useCallback((data, analytics) => {
    const leadCtx = data.leadContext || {};
    const comm = data.commercialEstimation || {};
    const activeCurrency = comm.currency || 'USD';

    setProjectInfo(prev => ({
      ...prev,
      proposalId: comm.id ? `PROP-${leadId}` : prev.proposalId,
      leadName: leadCtx.company || leadFromState?.contact || prev.leadName,
      clientName: leadCtx.company || prev.clientName,
      projectName: leadCtx.projectName || prev.projectName,
      salesExecutive: leadCtx.owner || prev.salesExecutive,
      currency: activeCurrency,
      billingType: comm.billingType || prev.billingType,
      duration: comm.estimatedDurationMonths || prev.duration,
      startDate: comm.startDate ? comm.startDate.split('T')[0] : prev.startDate,
      endDate: comm.estimatedEndDate ? comm.estimatedEndDate.split('T')[0] : prev.endDate,
      status: comm.status || 'DRAFT'
    }));

    // Resources with role dropdown & custom role mapping
    if (Array.isArray(comm.resources) && comm.resources.length > 0) {
      setResources(comm.resources.map((r, i) => {
        const { selectedRole, customRole } = getRoleDropdownState(r.role);
        return {
          id: r.id || `res-${i + 1}`,
          role: r.role || '',
          selectedRole,
          customRole,
          grade: r.grade || 'L1',
          onsiteDays: r.onsiteDays || 0,
          offshoreDays: r.offshoreDays || 0,
          dailyCost: r.dailyCost || getGradeDailyCost(r.grade || 'L1', activeCurrency),
          billingRate: r.billingRate || 0
        };
      }));
    } else {
      setResources([
        { id: 'res-1', role: 'Senior Fullstack Developer', selectedRole: 'Senior Fullstack Developer', customRole: '', grade: 'L3', onsiteDays: 20, offshoreDays: 40, dailyCost: getGradeDailyCost('L3', activeCurrency), billingRate: 650 },
        { id: 'res-2', role: 'Junior / Mid Fullstack Developer', selectedRole: 'Junior / Mid Fullstack Developer', customRole: '', grade: 'L1', onsiteDays: 10, offshoreDays: 120, dailyCost: getGradeDailyCost('L1', activeCurrency), billingRate: 300 }
      ]);
    }

    // Expenses with safe string IDs
    if (Array.isArray(comm.expenses) && comm.expenses.length > 0) {
      setExpenses(comm.expenses.map((e, i) => ({
        id: e.id || `exp-${i + 1}`,
        type: e.expenseType || 'Miscellaneous',
        expenseType: e.expenseType || 'Miscellaneous',
        cost: e.cost !== undefined && e.cost !== null ? e.cost : 0,
        remarks: e.remarks || ''
      })));
    } else {
      setExpenses([
        { id: 'exp-1', type: 'Travel', expenseType: 'Travel', cost: 1500, remarks: 'Client site visits' },
        { id: 'exp-2', type: 'Cloud Hosting', expenseType: 'Cloud Hosting', cost: 800, remarks: 'Infrastructure' }
      ]);
    }

    // Scenario
    setScenario(prev => ({
      ...prev,
      markup: comm.markupPercent !== undefined ? comm.markupPercent : prev.markup,
      discount: comm.discountPercent !== undefined ? comm.discountPercent : prev.discount,
      manualSellingPrice: comm.manualSellingPrice || 0,
      useManualPrice: Boolean(comm.manualSellingPrice && comm.manualSellingPrice > 0)
    }));

    // SDLC Allocations
    if (Array.isArray(comm.sdlcAllocations) && comm.sdlcAllocations.length > 0) {
      setPhases(comm.sdlcAllocations.map((s, idx) => ({
        id: s.id || idx + 1,
        phase: s.phase,
        manDays: s.manDays || 0,
        percentage: s.percentage || 0
      })));
    } else {
      setPhases(DEFAULT_SDLC_PHASES.map((p, idx) => ({
        id: idx + 1,
        phase: p.phase,
        manDays: 0,
        percentage: p.weight
      })));
    }

    if (analytics) {
      setAnalyticsData(analytics);
    }
  }, [leadId, leadFromState, getGradeDailyCost]);

  // Load commercial estimation on mount
  const loadData = useCallback(async (currency = '') => {
    try {
      setLoading(true);
      setError('');
      const [commRes, analyticsRes] = await Promise.all([
        fetchCommercial(leadId, currency),
        fetchCommercialAnalytics(leadId, currency).catch(() => null)
      ]);

      if (commRes.success && commRes.data) {
        populateFromBackend(commRes.data, analyticsRes?.data || null);
      } else {
        throw new Error(commRes.message || 'Failed to load commercial estimation.');
      }
    } catch (err) {
      console.error('Error loading commercial estimation:', err);
      setError(err.message || 'Failed to load commercial estimation from backend.');
    } finally {
      setLoading(false);
    }
  }, [leadId, populateFromBackend]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [commRes, analyticsRes] = await Promise.all([
          fetchCommercial(leadId, ''),
          fetchCommercialAnalytics(leadId, '').catch(() => null)
        ]);
        if (!ignore && commRes.success && commRes.data) {
          populateFromBackend(commRes.data, analyticsRes?.data || null);
        } else if (!ignore) {
          setError(commRes.message || 'Failed to load commercial estimation.');
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load commercial estimation from backend.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [leadId, populateFromBackend]);

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

    if (field === 'currency' && val && val !== 'select') {
      loadData(val);
    }
  };

  // Resource Actions
  const handleResourceChange = (id, field, val) => {
    setResources(prev => prev.map(r => {
      if (r.id === id) {
        if (field === 'selectedRole') {
          const newSelected = val;
          const effectiveRole = newSelected === 'Other' ? (r.customRole?.trim() || 'Other') : newSelected;
          return {
            ...r,
            selectedRole: newSelected,
            role: effectiveRole
          };
        }

        if (field === 'customRole') {
          return {
            ...r,
            customRole: val,
            role: val.trim() || 'Other'
          };
        }

        if (field === 'onsiteDays' || field === 'offshoreDays' || field === 'billingRate') {
          const cleanVal = val.replace(/\D/g, '');
          return { ...r, [field]: cleanVal };
        }

        if (field === 'grade') {
          const updatedGrade = val;
          return {
            ...r,
            grade: updatedGrade,
            dailyCost: getGradeDailyCost(updatedGrade, projectInfo.currency)
          };
        }

        if (field === 'dailyCost') {
          return r;
        }

        return { ...r, [field]: val };
      }
      return r;
    }));
  };

  const handleAddResource = () => {
    const nextId = `res-temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setResources(prev => [
      ...prev,
      { 
        id: nextId, 
        role: 'Senior Fullstack Developer', 
        selectedRole: 'Senior Fullstack Developer',
        customRole: '',
        grade: 'L1', 
        onsiteDays: 0, 
        offshoreDays: 80, 
        dailyCost: getGradeDailyCost('L1', projectInfo.currency), 
        billingRate: 250,
        totalDays: 80,
        totalCost: 0,
        totalRevenue: 0
      }
    ]);
  };

  const handleRemoveResource = (id) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  // Expense Actions
  const handleExpenseChange = (id, field, val) => {
    setExpenses(prev => prev.map(expense => {
      if (expense.id === id) {
        if (field === 'cost') {
          const cleanVal = val.replace(/\D/g, '');
          return { ...expense, cost: cleanVal };
        }
        if (field === 'expenseType' || field === 'type') {
          return { ...expense, expenseType: val, type: val };
        }
        if (field === 'customType') {
          return { ...expense, customType: val };
        }
        return { ...expense, [field]: val };
      }
      return expense;
    }));
  };

  const handleAddExpense = () => {
    const nextId = `exp-temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setExpenses(prev => [
      ...prev,
      { id: nextId, type: 'Travel', expenseType: 'Travel', customType: '', cost: '', remarks: '' }
    ]);
  };

  const handleRemoveExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Scenario Updates
  const handleScenarioSlider = (field, val) => {
    setScenario(prev => ({
      ...prev,
      [field]: Number(val),
      useManualPrice: false
    }));
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
    const cleanDays = Number(String(days).replace(/\D/g, '')) || 0;
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

  // Dynamic Chart Datasets with Backend Analytics Fallback
  const getCostPieData = () => {
    if (analyticsData?.costBreakdown?.labels?.length > 0) {
      const labels = analyticsData.costBreakdown.labels;
      const data = analyticsData.costBreakdown.datasets?.[0]?.data || [];
      return labels.map((label, i) => ({
        name: label,
        value: data[i] || 0
      })).filter(d => d.value > 0);
    }
    const resCost = totals.resourceCost;
    const expenseData = expenses.map(e => ({ name: e.type || e.expenseType, value: Number(e.cost) || 0 }));
    return [
      { name: 'Resource Cost', value: resCost },
      ...expenseData.filter(d => d.value > 0)
    ];
  };

  const getRevVsCostData = () => {
    if (analyticsData?.revenueVsCost?.labels?.length > 0) {
      const labels = analyticsData.revenueVsCost.labels;
      const costData = analyticsData.revenueVsCost.datasets?.find(d => d.label === 'Cost')?.data || [];
      const revData = analyticsData.revenueVsCost.datasets?.find(d => d.label === 'Revenue')?.data || [];
      return labels.map((label, i) => ({
        name: label,
        Cost: costData[i] || 0,
        Revenue: revData[i] || 0
      }));
    }
    let onsiteCost = 0, onsiteRev = 0, offshoreCost = 0, offshoreRev = 0;
    resources.forEach(r => {
      onsiteCost += (Number(r.onsiteDays) || 0) * (Number(r.dailyCost) || 0);
      onsiteRev += (Number(r.onsiteDays) || 0) * (Number(r.billingRate) || 0);
      offshoreCost += (Number(r.offshoreDays) || 0) * (Number(r.dailyCost) || 0);
      offshoreRev += (Number(r.offshoreDays) || 0) * (Number(r.billingRate) || 0);
    });
    return [
      { name: 'Onsite', Revenue: onsiteRev, Cost: onsiteCost },
      { name: 'Offshore', Revenue: offshoreRev, Cost: offshoreCost },
      { name: 'Expenses', Revenue: totals.expenseCost, Cost: totals.expenseCost }
    ];
  };

  const getMonthlyCashflowData = () => {
    if (analyticsData?.cumulativeCashFlow?.labels?.length > 0) {
      const labels = analyticsData.cumulativeCashFlow.labels;
      const costData = analyticsData.cumulativeCashFlow.datasets?.find(d => d.label === 'Cumulative Cost')?.data || [];
      const revData = analyticsData.cumulativeCashFlow.datasets?.find(d => d.label === 'Cumulative Revenue')?.data || [];
      const cashData = analyticsData.cumulativeCashFlow.datasets?.find(d => d.label === 'Cumulative Cash Position')?.data || [];
      return labels.map((label, i) => ({
        name: label,
        Cost: costData[i] || 0,
        Revenue: revData[i] || 0,
        Cashflow: cashData[i] || 0
      }));
    }
    const data = [];
    const monthlyRev = totals.sellingPrice / Number(projectInfo.duration || 12);
    const monthlyCost = totals.totalCost / Number(projectInfo.duration || 12);
    let cumRevenue = 0, cumCost = 0;
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

  // Authoritative Save / Update handler
  const handleSave = async (statusOverride = null, customSuccessMessage = 'Commercial estimation saved successfully!') => {
    try {
      setSaving(true);
      setError('');
      setFeedback(null);

      const activeCurrency = projectInfo.currency === 'select' ? 'USD' : projectInfo.currency;

      const payload = {
        currency: activeCurrency,
        billingType: projectInfo.billingType,
        startDate: projectInfo.startDate,
        estimatedDurationMonths: Number(projectInfo.duration) || 1,
        estimatedEndDate: projectInfo.endDate,
        markupPercent: Number(scenario.markup) || 0,
        discountPercent: Number(scenario.discount) || 0,
        manualSellingPrice: scenario.useManualPrice && Number(scenario.manualSellingPrice) > 0 ? Number(scenario.manualSellingPrice) : null,
        status: statusOverride || projectInfo.status || 'DRAFT',
        resources: resources.map(r => ({
          role: (r.selectedRole === 'Other' ? (r.customRole?.trim() || 'Other') : (r.selectedRole || r.role || 'Senior Fullstack Developer')).trim(),
          grade: r.grade || 'L1',
          onsiteDays: Number(r.onsiteDays) || 0,
          offshoreDays: Number(r.offshoreDays) || 0,
          dailyCost: Number(r.dailyCost) || 0,
          billingRate: Number(r.billingRate) || 0
        })),
        expenses: expenses.map(e => ({
          expenseType: (e.expenseType === 'Other' ? (e.customType?.trim() || 'Other') : (e.expenseType || e.type || 'Miscellaneous')).trim(),
          cost: Number(e.cost) || 0,
          remarks: e.remarks ? String(e.remarks) : null
        })),
        sdlcAllocations: phases.map(p => ({
          phase: p.phase,
          manDays: Number(p.manDays) || 0
        }))
      };

      const [updatedRes, analyticsRes] = await Promise.all([
        updateCommercial(leadId, payload, activeCurrency),
        fetchCommercialAnalytics(leadId, activeCurrency).catch(() => null)
      ]);

      if (updatedRes.success && updatedRes.data) {
        populateFromBackend(updatedRes.data, analyticsRes?.data || null);
        setFeedback({ type: 'success', message: customSuccessMessage });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        throw new Error(updatedRes.message || 'Failed to save changes.');
      }
    } catch (err) {
      console.error('Error saving commercial estimation:', err);
      setError(err.message || 'Failed to save commercial estimation.');
      setFeedback({ type: 'error', message: err.message || 'Failed to save commercial estimation.' });
    } finally {
      setSaving(false);
    }
  };

  const COLORS = ['#1D4ED8', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#64748B'];
  const currencyLabel = projectInfo.currency === 'select' ? '' : projectInfo.currency;
  const currencyDisplay = currencyLabel ? ` (${currencyLabel})` : '';

  if (loading) {
    return (
      <div className="estimation-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#1D4ED8', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '16px' }}>Loading Commercial Estimation for {leadId}...</p>
      </div>
    );
  }

  return (
    <div className="estimation-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span> &gt; 
        <span onClick={() => navigate('/leads')} style={{ cursor: 'pointer' }}> Leads</span> &gt; 
        <strong> Commercial Estimation ({leadId})</strong>
      </div>

      {/* Alerts / Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: feedback.type === 'success' ? '#065F46' : '#991B1B',
          border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {error && !feedback && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FECACA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => loadData()}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="estimation-header">
        <div className="estimation-title-sec">
          <h1>Commercial Estimation</h1>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            padding: '2px 8px', 
            borderRadius: '12px',
            backgroundColor: projectInfo.status === 'SUBMITTED' ? '#FEF3C7' : '#EFF6FF',
            color: projectInfo.status === 'SUBMITTED' ? '#B45309' : '#1D4ED8',
            marginLeft: '12px'
          }}>
            Status: {projectInfo.status}
          </span>
        </div>
        <div className="estimation-header-actions">
          <button className="btn-outline" onClick={() => navigate('/leads')}>
            <ArrowLeft size={16} /> Back to Leads
          </button>
          <button className="btn-outline" disabled={saving} onClick={() => handleSave('DRAFT', 'Draft saved successfully!')}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn-outline" disabled={saving} onClick={() => handleSave(projectInfo.status, 'Commercial recalculated successfully!')}>
            Recalculate
          </button>
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
            <label>KAM / Lead Contact</label>
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
            <label>Sales Executive / Owner</label>
            <input type="text" value={projectInfo.salesExecutive} readOnly />
          </div>
          <div className="form-field">
            <label>Currency</label>
            <select value={projectInfo.currency} onChange={(e) => handleProjectInfoChange('currency', e.target.value)}>
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
              <option value="T&M">Time & Material (T&M)</option>
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
                      <select 
                        value={r.selectedRole || 'Senior Fullstack Developer'} 
                        onChange={(evt) => handleResourceChange(r.id, 'selectedRole', evt.target.value)}
                      >
                        {STANDARD_ROLES.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      {r.selectedRole === 'Other' && (
                        <div style={{ marginTop: '6px' }}>
                          <input 
                            type="text" 
                            placeholder="Enter custom role" 
                            value={r.customRole || ''} 
                            onChange={(evt) => handleResourceChange(r.id, 'customRole', evt.target.value)} 
                          />
                        </div>
                      )}
                    </td>
                    <td className="grade-column">
                      <select value={r.grade} onChange={(evt) => handleResourceChange(r.id, 'grade', evt.target.value)}>
                        <option value="L1">L1 (Junior)</option>
                        <option value="L2">L2 (Mid)</option>
                        <option value="L3">L3 (Senior)</option>
                        <option value="L4">L4 (Principal)</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" value={r.onsiteDays} onChange={(evt) => handleResourceChange(r.id, 'onsiteDays', evt.target.value)} />
                    </td>
                    <td>
                      <input type="text" value={r.offshoreDays} onChange={(evt) => handleResourceChange(r.id, 'offshoreDays', evt.target.value)} />
                    </td>
                    <td className="daily-cost-column">
                      <input type="text" value={r.dailyCost} readOnly />
                    </td>
                    <td>
                      <input type="text" value={r.billingRate} onChange={(evt) => handleResourceChange(r.id, 'billingRate', evt.target.value)} />
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {Math.round(totalCostVal).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '600', color: '#1D4ED8' }}>
                      {Math.round(totalRevVal).toLocaleString()}
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
                <td>{Math.round(totals.resourceCost).toLocaleString()}</td>
                <td style={{ color: '#1D4ED8' }}>{Math.round(totals.resourceRevenue).toLocaleString()}</td>
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
              {expenses.map((expense) => {
                const currentType = expense.expenseType || expense.type || 'Travel';
                const isCustomType = currentType === 'Other' || (!STANDARD_EXPENSE_TYPES.includes(currentType) && currentType !== '');
                return (
                  <tr key={expense.id}>
                    <td className="expense-type-column">
                      <select
                        value={isCustomType ? 'Other' : currentType}
                        onChange={(evt) => handleExpenseChange(expense.id, 'expenseType', evt.target.value)}
                      >
                        {STANDARD_EXPENSE_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {isCustomType && (
                        <div style={{ marginTop: '6px' }}>
                          <input
                            type="text"
                            placeholder="Enter custom expense type"
                            value={expense.customType !== undefined ? expense.customType : (currentType === 'Other' ? '' : currentType)}
                            onChange={(evt) => handleExpenseChange(expense.id, 'customType', evt.target.value)}
                          />
                        </div>
                      )}
                    </td>
                    <td style={{ width: '200px' }}>
                      <input
                        type="text"
                        value={expense.cost !== undefined && expense.cost !== null ? expense.cost : ''}
                        placeholder="0"
                        onChange={(evt) => handleExpenseChange(expense.id, 'cost', evt.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={expense.remarks || ''}
                        onChange={(evt) => handleExpenseChange(expense.id, 'remarks', evt.target.value)}
                        placeholder="Add comments here"
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="action-btn-del" onClick={() => handleRemoveExpense(expense.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
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
          <button className="btn-outline" disabled={saving} onClick={() => handleSave('DRAFT', 'Draft saved successfully!')}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn-outline" disabled={saving} onClick={() => handleSave(projectInfo.status, 'Commercial recalculated successfully!')}>
            Recalculate
          </button>
        </div>
        <div className="right-actions">
          <button className="btn-outline" onClick={() => alert('Excel sheet successfully exported!')}>Export Excel</button>
          <button className="btn-outline" onClick={() => alert('Proposal documents generated!')}>Generate Proposal</button>
          <button 
            className="btn-success-green" 
            disabled={saving} 
            onClick={() => handleSave('SUBMITTED', 'Submitted for executive approval!')}
          >
            Submit for Approval
          </button>
          <button className="btn-primary-blue" onClick={() => window.print()}>Export PDF</button>
        </div>
      </div>
    </div>
  );
}

