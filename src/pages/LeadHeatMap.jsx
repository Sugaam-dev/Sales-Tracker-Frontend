import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initialLeadsData } from './Leads';

const matchRep = (leadOwner, repName) => {
  if (!leadOwner) return false;
  return leadOwner.toLowerCase() === repName.toLowerCase();
};

// ─── Data ────────────────────────────────────────────────────────────────────
const STAGES = [
  'Prospecting',
  'Qualification',
  'Needs Analysis',
  'Proposal',
  'Negotiation',
  'Closed Won',
];

const REP_NAMES = ['D. Ghosh', 'S. Mishra', 'H. Kumar', 'P. Sharma', 'R. Nair'];

const REPS = REP_NAMES.map(name => {
  const cells = STAGES.map(stage => {
    const matching = initialLeadsData.filter(l => {
      const isStageMatch = l.stage.toLowerCase() === stage.toLowerCase();
      const isRepMatch = matchRep(l.owner, name);
      return isStageMatch && isRepMatch;
    });
    
    const value = matching.reduce((sum, l) => {
      const num = parseInt(l.value.replace(/[^0-9]/g, ''), 10) || 0;
      return sum + num;
    }, 0);
    
    return { value, leads: matching.length };
  });
  
  return { name, cells };
});

// Global min/max for tooltip intensity label (always based on value)
const allValues = REPS.flatMap(r => r.cells.map(c => c.value));
const MIN_VAL   = Math.min(...allValues) || 0;
const MAX_VAL   = Math.max(...allValues) || 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function heatColor(normalized) {
  const stops = [
    { t: 0,    r: 219, g: 234, b: 254 },
    { t: 0.35, r: 147, g: 197, b: 253 },
    { t: 0.6,  r: 251, g: 191, b: 36  },
    { t: 0.8,  r: 239, g: 68,  b: 68  },
    { t: 1,    r: 127, g: 29,  b: 29  },
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (normalized >= stops[i].t && normalized <= stops[i + 1].t) {
      lo = stops[i]; hi = stops[i + 1]; break;
    }
  }
  const range = hi.t - lo.t || 1;
  const f = (normalized - lo.t) / range;
  const r = Math.round(lo.r + f * (hi.r - lo.r));
  const g = Math.round(lo.g + f * (hi.g - lo.g));
  const b = Math.round(lo.b + f * (hi.b - lo.b));
  return { bg: `rgb(${r},${g},${b})`, text: normalized > 0.55 ? '#fff' : '#1e293b' };
}

function fmt(val) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000)    return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function HeatTooltip({ cell, rep, stage, x, y }) {
  if (!cell) return null;
  const norm      = (cell.value - MIN_VAL) / (MAX_VAL - MIN_VAL);
  const intensity = norm < 0.33 ? 'Low' : norm < 0.66 ? 'Medium' : 'High';
  return (
    <div style={{
      position: 'fixed', left: x + 14, top: y - 10, zIndex: 1000,
      background: '#1e293b', color: '#f8fafc',
      borderRadius: '8px', padding: '10px 14px',
      fontSize: '12px', lineHeight: 1.6,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      pointerEvents: 'none', minWidth: '160px',
    }}>
      <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '13px' }}>{rep} · {stage}</div>
      <div>💰 Pipeline: <strong>{fmt(cell.value)}</strong></div>
      <div>🔥 Leads: <strong>{cell.leads}</strong></div>
      <div>📊 Intensity: <strong>{intensity}</strong></div>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────
function HeatLegend() {
  const steps = 6;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
      <span>Low</span>
      <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', height: '14px', width: '120px' }}>
        {Array.from({ length: steps }).map((_, i) => {
          const { bg } = heatColor(i / (steps - 1));
          return <div key={i} style={{ flex: 1, background: bg }} />;
        })}
      </div>
      <span>High</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LeadHeatMap() {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState(null);
  const [metric, setMetric]   = useState('value'); // 'value' | 'leads'
  const [selectedCellLeads, setSelectedCellLeads] = useState(null); // { rep, stage, leads: [...] }
  const [showAllLeads, setShowAllLeads] = useState(false);

  const handleCellClick = (repName, stageName) => {
    const cellLeads = initialLeadsData.filter(l => {
      const isStageMatch = l.stage.toLowerCase() === stageName.toLowerCase();
      const isRepMatch = matchRep(l.owner, repName);
      return isStageMatch && isRepMatch;
    });

    setSelectedCellLeads({
      rep: repName,
      stage: stageName,
      leads: cellLeads
    });
  };

  const metricValues = REPS.flatMap(r => r.cells.map(c => c[metric]));
  const minM = Math.min(...metricValues);
  const maxM = Math.max(...metricValues);
  const normalize = (v) => maxM === minM ? 0.5 : (v - minM) / (maxM - minM);

  const stageTotals = STAGES.map((_, si) => ({
    value: REPS.reduce((s, r) => s + r.cells[si].value, 0),
    leads: REPS.reduce((s, r) => s + r.cells[si].leads, 0),
  }));

  const repTotals = REPS.map(r => ({
    value: r.cells.reduce((s, c) => s + c.value, 0),
    leads: r.cells.reduce((s, c) => s + c.leads, 0),
  }));

  const grandTotal = {
    value: stageTotals.reduce((s, t) => s + t.value, 0),
    leads: stageTotals.reduce((s, t) => s + t.leads, 0),
  };

  return (
    <div className="card full-width-card" style={{ marginTop: '24px' }}>

      {/* ── Header ── */}
      <div className="card-header" style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '10px',
      }}>
        <div>
          <h3 style={{ margin: 0 }}>Lead Heat Map</h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Pipeline intensity by rep × stage — hover a cell for details
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Metric toggle */}
          <div style={{
            display: 'flex', background: 'var(--color-border)',
            borderRadius: '8px', padding: '2px', gap: '2px',
          }}>
            {[['value', '$ Value'], ['leads', '# Leads']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                style={{
                  padding: '4px 12px', fontSize: '12px', fontWeight: 600,
                  border: 'none', borderRadius: '6px', cursor: 'pointer',
                  background: metric === key ? 'var(--color-primary)' : 'transparent',
                  color: metric === key ? '#fff' : 'var(--color-text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <HeatLegend />
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ overflowX: 'auto', padding: '0 16px 16px' }}>
        <table style={{
          width: '100%', borderCollapse: 'separate',
          borderSpacing: '3px', minWidth: '600px',
        }}>
          <thead>
            <tr>
              <th style={{
                width: '110px', textAlign: 'left', fontSize: '11px',
                color: 'var(--color-text-muted)', fontWeight: 600,
                paddingBottom: '6px', paddingLeft: '4px',
              }}>
                REP ↓ &nbsp; STAGE →
              </th>
              {STAGES.map(s => (
                <th key={s} style={{
                  fontSize: '11px', color: 'var(--color-text-muted)',
                  fontWeight: 600, textAlign: 'center',
                  paddingBottom: '6px', whiteSpace: 'nowrap',
                }}>
                  {s}
                </th>
              ))}
              <th style={{
                fontSize: '11px', color: 'var(--color-text-muted)',
                fontWeight: 600, textAlign: 'center',
                paddingBottom: '6px', width: '80px',
              }}>
                TOTAL
              </th>
            </tr>
          </thead>

          <tbody>
            {REPS.map((rep, ri) => (
              <tr key={rep.name}>
                {/* Rep name */}
                <td style={{
                  padding: '2px 4px', fontSize: '13px', fontWeight: 600,
                  color: 'var(--color-text-main)', whiteSpace: 'nowrap',
                }}>
                  {rep.name}
                </td>

                {/* Heat cells */}
                {rep.cells.map((cell, si) => {
                  const norm = normalize(cell[metric]);
                  const { bg, text } = heatColor(norm);
                  return (
                    <td
                      key={si}
                      onClick={() => handleCellClick(rep.name, STAGES[si])}
                      onMouseMove={(e) => setTooltip({
                        cell, rep: rep.name, stage: STAGES[si],
                        x: e.clientX, y: e.clientY,
                      })}
                      onMouseLeave={() => setTooltip(null)}
                      onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.88)'}
                      onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                      style={{
                        background: bg, borderRadius: '6px',
                        height: '52px', textAlign: 'center',
                        cursor: 'pointer', padding: '0 4px',
                        verticalAlign: 'middle',
                        transition: 'filter 0.15s',
                      }}
                    >
                      <div style={{ color: text, lineHeight: 1.3 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>
                          {metric === 'value' ? fmt(cell.value) : cell.leads}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                          {metric === 'value' ? `${cell.leads} leads` : fmt(cell.value)}
                        </div>
                      </div>
                    </td>
                  );
                })}

                {/* Row total */}
                <td style={{
                  textAlign: 'center', fontSize: '12px', fontWeight: 700,
                  color: 'var(--color-text-main)',
                  background: 'var(--color-border)',
                  borderRadius: '6px', padding: '0 6px',
                }}>
                  <div>{metric === 'value' ? fmt(repTotals[ri].value) : repTotals[ri].leads}</div>
                  <div style={{ fontSize: '10px', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                    {metric === 'value' ? `${repTotals[ri].leads} leads` : fmt(repTotals[ri].value)}
                  </div>
                </td>
              </tr>
            ))}

            {/* Stage totals row */}
            <tr>
              <td style={{
                fontSize: '11px', fontWeight: 700,
                color: 'var(--color-text-muted)',
                paddingLeft: '4px', paddingTop: '4px',
              }}>
                STAGE TOTAL
              </td>
              {stageTotals.map((t, si) => (
                <td key={si} style={{
                  textAlign: 'center', fontSize: '12px', fontWeight: 700,
                  color: 'var(--color-text-main)',
                  background: 'var(--color-border)',
                  borderRadius: '6px', padding: '6px 4px',
                }}>
                  <div>{metric === 'value' ? fmt(t.value) : t.leads}</div>
                  <div style={{ fontSize: '10px', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                    {metric === 'value' ? `${t.leads} leads` : fmt(t.value)}
                  </div>
                </td>
              ))}

              {/* Grand total */}
              <td style={{
                textAlign: 'center', fontSize: '13px', fontWeight: 800,
                color: 'var(--color-primary)',
                background: 'var(--color-border)',
                borderRadius: '6px', padding: '6px',
              }}>
                <div>{metric === 'value' ? fmt(grandTotal.value) : grandTotal.leads}</div>
                <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                  Grand Total
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Tooltip ── */}
      {tooltip && (
        <HeatTooltip
          cell={tooltip.cell}
          rep={tooltip.rep}
          stage={tooltip.stage}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}

      {/* Leads List Modal Popup */}
      {selectedCellLeads && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff', width: '700px', maxWidth: '90%',
            borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A', fontWeight: '700' }}>
                  {showAllLeads ? 'All System Leads' : `Leads for ${selectedCellLeads.rep} (${selectedCellLeads.stage})`}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                  {showAllLeads ? 'Showing all active leads in database' : `Showing leads matching stage "${selectedCellLeads.stage}" owned by ${selectedCellLeads.rep}`}
                </p>
              </div>
              <button 
                onClick={() => { setSelectedCellLeads(null); setShowAllLeads(false); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {/* Toggle Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                onClick={() => setShowAllLeads(false)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                  border: showAllLeads ? '1px solid #E2E8F0' : 'none',
                  background: showAllLeads ? '#FFFFFF' : 'var(--color-primary)',
                  color: showAllLeads ? '#475569' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                Cell Leads ({selectedCellLeads.leads.length})
              </button>
              <button 
                onClick={() => setShowAllLeads(true)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                  border: !showAllLeads ? '1px solid #E2E8F0' : 'none',
                  background: !showAllLeads ? '#FFFFFF' : 'var(--color-primary)',
                  color: !showAllLeads ? '#475569' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                All Leads ({initialLeadsData.length})
              </button>
            </div>

            {/* Leads Table */}
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                    <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Lead ID</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Company</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Contact</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Owner</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllLeads ? initialLeadsData : selectedCellLeads.leads).length > 0 ? (
                    (showAllLeads ? initialLeadsData : selectedCellLeads.leads).map(l => (
                      <tr 
                        key={l.id}
                        onClick={() => {
                          setSelectedCellLeads(null);
                          setShowAllLeads(false);
                          navigate('/leads', { state: { selectedLeadId: l.id } });
                        }}
                        style={{ borderBottom: '1px solid #E2E8F0', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)' }}>L-{l.id.toString().padStart(4, '0')}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{l.company}</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>{l.contact}</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>{l.owner}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{l.value}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                        No leads matched this criteria in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <button 
                onClick={() => { setSelectedCellLeads(null); setShowAllLeads(false); }}
                style={{
                  padding: '8px 16px', background: '#FFFFFF', border: '1px solid #CBD5E1',
                  borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}