import React from 'react';
import { Search, Bell, Shield, HelpCircle, ChevronRight, Menu } from 'lucide-react';

interface TopBarProps {
  breadcrumb: string[];
  onOpenMobileMenu?: () => void;
  electionSelector?: {
    current: string;
    options: { id: string; name: string }[];
    onChange: (id: string) => void;
  };
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  breadcrumb,
  onOpenMobileMenu,
  electionSelector,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <header
      style={{
        height: '56px',
        borderBottom: '1px solid #E5E5E2',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            style={{
              display: 'none', // Shown in CSS media query
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#555550',
            }}
            className="mobile-menu-trigger"
          >
            <Menu size={20} />
          </button>
        )}

        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          {breadcrumb.map((crumb, index) => (
            <React.Fragment key={index}>
              <span
                style={{
                  color: index === breadcrumb.length - 1 ? '#242424' : '#777777',
                  fontWeight: index === breadcrumb.length - 1 ? 500 : 400,
                }}
              >
                {crumb}
              </span>
              {index < breadcrumb.length - 1 && (
                <span style={{ color: '#C8C8C4', display: 'flex', alignItems: 'center' }}>
                  /
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {electionSelector && (
          <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#8E8E89' }}>Scope:</span>
            <select
              value={electionSelector.current}
              onChange={(e) => electionSelector.onChange(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #E5E5E2',
                backgroundColor: '#F7F7F5',
                color: '#242424',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {electionSelector.options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Search & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search Input inspired by reference image */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F7F7F5',
            border: '1px solid #E5E5E2',
            borderRadius: '6px',
            padding: '4px 10px',
            width: '220px',
            transition: 'border-color 0.15s ease',
          }}
        >
          <Search size={14} color="#8E8E89" style={{ marginRight: '6px', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search records, voters, policies..."
            value={searchTerm || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '12px',
              color: '#242424',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>

        {/* Security badge indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: '#EDF7EE',
            color: '#1B5E20',
            fontSize: '11px',
            fontWeight: 500,
          }}
          title="Cryptographic verification & secret ballot protocol active"
        >
          <Shield size={12} />
          <span>Audit Enforced</span>
        </div>

        {/* Notifications & Help */}
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6B6B66',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="System notifications"
        >
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
};
