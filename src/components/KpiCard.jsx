import React from 'react';
import './KpiCard.css';

export default function KpiCard({
  title,
  value,
  subtext,
  icon,
  highlightColor,
  onClick,
}) {
  return (
    <div
      className={`kpi-card card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="kpi-header">
        <h4 className="kpi-title">{title}</h4>

        {icon && (
          <div
            className="kpi-icon"
            style={{
              color: highlightColor,
              backgroundColor: `${highlightColor}20`,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="kpi-value">
        {value}
      </div>

      {subtext && (
        <div className="kpi-subtext">
          {subtext}
        </div>
      )}
    </div>
  );
}