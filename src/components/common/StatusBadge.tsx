import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  FileEdit, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { ElectionStatus, NominationStatus } from '../../types/election';

interface StatusBadgeProps {
  status: ElectionStatus | NominationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'Voting Open':
      case 'Approved':
      case 'Seconders Met':
      case 'Published':
      case 'Resolved':
        return {
          bg: '#EDF7EE',
          color: '#1B5E20',
          border: '#C8E6C9',
          icon: CheckCircle2,
        };
      case 'Nominations Open':
      case 'Collecting Seconders':
      case 'Under Review':
      case 'In Progress':
        return {
          bg: '#FFF8E1',
          color: '#8D6B00',
          border: '#FFE082',
          icon: Clock,
        };
      case 'Awaiting Verification':
      case 'Awaiting Certification':
      case 'Pending Review':
      case 'Pending Approval':
        return {
          bg: '#F3EFFB',
          color: '#7656C9',
          border: '#D8CCE8',
          icon: Sparkles,
        };
      case 'Draft':
      case 'Scheduled':
        return {
          bg: '#F1F1EF',
          color: '#555550',
          border: '#E2E2DE',
          icon: FileEdit,
        };
      case 'Disqualified':
      case 'Ineligible':
      case 'Rejected':
      case 'Cancelled':
        return {
          bg: '#FDE8E8',
          color: '#9B1C1C',
          border: '#F8B4B4',
          icon: XCircle,
        };
      case 'Escalated':
      case 'Tie Flagged':
        return {
          bg: '#FEF2F2',
          color: '#B91C1C',
          border: '#FECACA',
          icon: ShieldAlert,
        };
      default:
        return {
          bg: '#F1F1EF',
          color: '#555550',
          border: '#E2E2DE',
          icon: AlertCircle,
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 7px' : '4px 10px',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        borderRadius: '4px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <IconComponent size={size === 'sm' ? 11 : 13} />
      {status}
    </span>
  );
};
