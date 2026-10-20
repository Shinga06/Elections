import React from 'react';
import { 
  Vote, 
  Building2, 
  Users, 
  UserCheck, 
  FileCheck2, 
  BarChart3, 
  CalendarDays, 
  LifeBuoy, 
  History, 
  Settings, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  FolderOpen,
  FileText,
  User
} from 'lucide-react';
import { UserRole } from '../../types/election';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  count?: number;
}

interface SidebarProps {
  currentPage: string;
  onNavigate: (pageId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  currentRole,
  onSwitchRole,
}) => {
  const adminNavGroups: { title: string; items: NavItem[] }[] = [
    {
      title: 'FAVOURITES',
      items: [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'elections', label: 'Elections', icon: Vote },
        { id: 'voting-mgmt', label: 'Voting Control', icon: ShieldCheck, badge: 'Live' },
      ],
    },
    {
      title: 'WORKSPACE',
      items: [
        { id: 'residences', label: 'Residences', icon: Building2 },
        { id: 'voter-registers', label: 'Voter Registers', icon: Users },
        { id: 'voter-participation', label: 'Voter Participation', icon: FileCheck2, badge: 'Live' },
        { id: 'nominations', label: 'Candidates & Nominations', icon: UserCheck, count: 2 },
        { id: 'results', label: 'Results & Certification', icon: FileCheck2 },
        { id: 'reports', label: 'Reports', icon: FileText },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
        { id: 'support', label: 'Support & Incidents', icon: LifeBuoy, count: 1 },
        { id: 'activity', label: 'Activity Log', icon: History },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings & Roles', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '68px' : '260px',
        backgroundColor: '#F1F1EF',
        borderRight: '1px solid #E5E5E2',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.2s ease',
        userSelect: 'none',
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Top Header / App Brand */}
      <div>
        <div
          style={{
            padding: '16px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E5E5E2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7656C9 0%, #9F85E6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(118, 86, 201, 0.25)',
                flexShrink: 0,
              }}
            >
              <Vote size={18} />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424', lineHeight: 1.2 }}>
                  HC Elections
                </div>
                <div style={{ fontSize: '11px', color: '#777777', letterSpacing: '-0.01em' }}>
                  House Committee Platform
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8E8E89',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Quick Role Switcher Pill for development/demonstration */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E5E2' }}>
          <div
            style={{
              display: 'flex',
              background: '#E6E6E3',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px',
            }}
          >
            <button
              onClick={() => onSwitchRole('admin')}
              style={{
                flex: 1,
                border: 'none',
                background: currentRole === 'admin' ? '#FFFFFF' : 'transparent',
                color: currentRole === 'admin' ? '#242424' : '#6B6B66',
                borderRadius: '4px',
                padding: '4px 0',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: currentRole === 'admin' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {collapsed ? 'Admin' : 'Admin Panel'}
            </button>
            <button
              onClick={() => onSwitchRole('student')}
              style={{
                flex: 1,
                border: 'none',
                background: currentRole === 'student' ? '#FFFFFF' : 'transparent',
                color: currentRole === 'student' ? '#242424' : '#6B6B66',
                borderRadius: '4px',
                padding: '4px 0',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: currentRole === 'student' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {collapsed ? 'Student' : 'Student Voting'}
            </button>
          </div>
        </div>

        {/* Nav list */}
        <div
          style={{
            padding: '12px 8px',
            maxHeight: 'calc(100vh - 210px)',
            overflowY: 'auto',
          }}
        >
          {adminNavGroups.map((group, groupIdx) => (
            <div key={groupIdx} style={{ marginBottom: '16px' }}>
              {!collapsed && (
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#8E8E89',
                    padding: '4px 10px 6px',
                    textTransform: 'uppercase',
                  }}
                >
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = currentPage === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: collapsed ? '10px 0' : '7px 10px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isActive ? '#ECECE9' : 'transparent',
                      color: isActive ? '#242424' : '#555550',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                      position: 'relative',
                    }}
                    title={collapsed ? item.label : undefined}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = '#EAEAE7';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <IconComponent
                      size={16}
                      color={isActive ? '#7656C9' : '#6B6B66'}
                      style={{ flexShrink: 0 }}
                    />
                    {!collapsed && (
                      <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: '#EDF7EE',
                          color: '#1B5E20',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {!collapsed && item.count !== undefined && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: '#E5E5E2',
                          color: '#555550',
                          padding: '1px 6px',
                          borderRadius: '10px',
                        }}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* User profile footer */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid #E5E5E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F1F1EF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#DCDCD8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: '#333330',
              flexShrink: 0,
            }}
          >
            EV
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#242424', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                Dr. E. Vance
              </div>
              <div style={{ fontSize: '10px', color: '#777777', whiteSpace: 'nowrap' }}>
                Chief Electoral Officer
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => onSwitchRole('student')}
            title="Log out or switch view"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8E8E89',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  );
};
