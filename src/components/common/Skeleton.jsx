import React from 'react';
import './Skeleton.css';

export function SkeletonBlock({ width = '100%', height = '1rem', borderRadius, style = {}, className = '' }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius: borderRadius || undefined,
        ...style
      }}
    />
  );
}

export function SkeletonText({ lines = 1, width = '100%', height = '0.875rem', gap = '0.5rem', className = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, width: '100%' }} className={className}>
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBlock
          key={idx}
          width={idx === lines - 1 && lines > 1 ? '70%' : width}
          height={height}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = '130px', className = '' }) {
  return (
    <div className={`skeleton-card ${className}`} style={{ minHeight: height }}>
      <div className="skeleton-card-header">
        <SkeletonBlock width="40%" height="0.875rem" />
        <SkeletonBlock width="32px" height="32px" borderRadius="50%" />
      </div>
      <SkeletonBlock width="60%" height="1.75rem" style={{ marginTop: '0.25rem' }} />
      <SkeletonBlock width="45%" height="0.75rem" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5, className = '' }) {
  return (
    <div className={`skeleton-table-container ${className}`}>
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <div key={colIdx} style={{ flex: 1 }}>
            <SkeletonBlock width="70%" height="0.875rem" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} style={{ flex: 1 }}>
              <SkeletonBlock width={colIdx === 0 ? '85%' : '60%'} height="1rem" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = '280px', bars = 6, className = '' }) {
  return (
    <div className={`skeleton-chart-box ${className}`} style={{ minHeight: height }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBlock width="35%" height="1.25rem" />
        <SkeletonBlock width="20%" height="0.875rem" />
      </div>
      <div className="skeleton-chart-bars">
        {Array.from({ length: bars }).map((_, idx) => {
          const randomHeight = 30 + ((idx * 17) % 60);
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
              <SkeletonBlock width="60%" height={`${randomHeight}%`} borderRadius="4px 4px 0 0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
