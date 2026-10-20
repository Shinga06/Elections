import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string;
    isPositive?: boolean;
    period?: string;
  };
  icon?: LucideIcon;
  badge?: string;
  highlight?: boolean;
  sparklineData?: number[];
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  badge,
  highlight = false,
  sparklineData = [12, 19, 15, 25, 22, 30, 28, 38],
}) => {
  // Generate SVG path for a mini sparkline
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const points = sparklineData
    .map((d, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((d - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: highlight ? '1px solid #7656C9' : '1px solid #E5E5E2',
        borderRadius: '10px',
        padding: '16px 18px',
        boxShadow: highlight 
          ? '0 4px 14px rgba(118, 86, 201, 0.08)' 
          : '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B6B66' }}>
          {title}
        </span>
        {badge && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              background: '#F3EFFB',
              color: '#7656C9',
              borderRadius: '4px',
              fontWeight: 500,
            }}
          >
            {badge}
          </span>
        )}
        {Icon && !badge && (
          <div style={{ color: '#8E8E89' }}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: '#8E8E89', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
          {change && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '6px' }}>
              <span
                style={{
                  color: change.isPositive ? '#1B5E20' : '#9B1C1C',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {change.isPositive ? '↑' : '↓'} {change.value}
              </span>
              {change.period && (
                <span style={{ color: '#8E8E89' }}>{change.period}</span>
              )}
            </div>
          )}
        </div>

        {sparklineData && (
          <svg width={width} height={height} style={{ overflow: 'visible', opacity: 0.85 }}>
            <polyline
              fill="none"
              stroke={highlight ? '#7656C9' : '#8E8E89'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        )}
      </div>
    </div>
  );
};
