import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileCheck,
  TrendingUp,
  ShieldCheck,
  Lock,
  Building2
} from 'lucide-react';
import { RegisteredStudent, Residence, VotingParticipationStatus } from '../../types/election';

interface VoterParticipationProps {
  students: RegisteredStudent[];
  residences: Residence[];
  onExportCsv?: () => void;
}

export const VoterParticipationView: React.FC<VoterParticipationProps> = ({
  students,
  residences,
}) => {
  const [selectedResId, setSelectedResId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter students based on selection
  const filteredStudents = students.filter((s) => {
    const matchesRes = selectedResId === 'all' || s.residenceId === selectedResId;
    const matchesStatus = statusFilter === 'all' || s.votingStatus === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      s.fullName.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q);
    return matchesRes && matchesStatus && matchesSearch;
  });

  // Calculate metrics for currently selected residence scope
  const targetStudents = selectedResId === 'all' 
    ? students 
    : students.filter(s => s.residenceId === selectedResId);

  const totalRegistered = targetStudents.length;
  const eligibleVoters = targetStudents.filter(s => s.isEligible).length;
  const submittedBallots = targetStudents.filter(s => s.votingStatus === 'Voted').length;
  const draftSaved = targetStudents.filter(s => s.votingStatus === 'Draft Saved').length;
  const notVoted = targetStudents.filter(s => s.votingStatus === 'Not Voted' && s.isEligible).length;
  const ineligibleCount = targetStudents.filter(s => !s.isEligible || s.votingStatus === 'Ineligible').length;

  // Exact turnout formula: final submitted ballots / eligible voters
  const turnoutPercentage = eligibleVoters > 0 
    ? ((submittedBallots / eligibleVoters) * 100).toFixed(1) 
    : '0.0';

  const handleExportCsv = () => {
    const headers = ['Student Number', 'Surname', 'Name', 'Residence', 'Eligibility', 'Voting Status', 'Final Submission Time'];
    const rows = filteredStudents.map(s => [
      `"${s.studentNumber}"`,
      `"${s.surname}"`,
      `"${s.name}"`,
      `"${s.residenceName}"`,
      s.isEligible ? 'Eligible' : 'Ineligible',
      s.votingStatus,
      s.submittedAt || 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Voter_Participation_${selectedResId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: VotingParticipationStatus) => {
    switch (status) {
      case 'Voted':
        return {
          bg: '#EDF7EE',
          color: '#1B5E20',
          border: '#C8E6C9',
          icon: CheckCircle2,
          label: 'Voted',
        };
      case 'Draft Saved':
        return {
          bg: '#FFF8E1',
          color: '#8D6B00',
          border: '#FFE082',
          icon: Clock,
          label: 'Draft Saved',
        };
      case 'Not Voted':
        return {
          bg: '#F1F1EF',
          color: '#555550',
          border: '#E2E2DE',
          icon: Clock,
          label: 'Not Voted',
        };
      case 'Ineligible':
        return {
          bg: '#FDE8E8',
          color: '#9B1C1C',
          border: '#F8B4B4',
          icon: XCircle,
          label: 'Ineligible',
        };
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
            Voter Participation Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: '#6B6B66' }}>
            Real-time voter turnout tracking, voter status logs, and participation verification across residence rolls.
          </p>
        </div>

        <button onClick={handleExportCsv} className="btn btn-secondary" style={{ fontSize: '12px' }}>
          <Download size={14} /> Export Participation Report (CSV)
        </button>
      </div>

      {/* Secret Ballot Privacy Banner (Strict requirement 6) */}
      <div
        style={{
          background: '#F3EFFB',
          border: '1px solid #D8CCE8',
          borderRadius: '8px',
          padding: '14px 18px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <Lock size={18} color="#7656C9" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: '#3A2E59', lineHeight: 1.5 }}>
          <strong>Ballot Privacy & Anonymity Protocol Active:</strong> The Election Committee may verify <em>who</em> has cast a final ballot to ensure quorum and prevent duplicate submissions, but <strong>cannot see how any student voted</strong>. Voter identity records remain strictly decoupled from ballot candidate choices.
        </div>
      </div>

      {/* Turnout & Participation Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div className="notion-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '12px', color: '#777777', fontWeight: 500 }}>Turnout Percentage</span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#7656C9', marginTop: '4px' }}>
            {turnoutPercentage}%
          </div>
          <span style={{ fontSize: '11px', color: '#8E8E89' }}>
            Based on {submittedBallots} submitted / {eligibleVoters} eligible
          </span>
        </div>

        <div className="notion-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '12px', color: '#777777', fontWeight: 500 }}>Eligible Voters</span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#242424', marginTop: '4px' }}>
            {eligibleVoters}
          </div>
          <span style={{ fontSize: '11px', color: '#1B5E20' }}>
            {totalRegistered} total on official registers
          </span>
        </div>

        <div className="notion-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '12px', color: '#777777', fontWeight: 500 }}>Final Ballots Cast</span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#1B5E20', marginTop: '4px' }}>
            {submittedBallots}
          </div>
          <span style={{ fontSize: '11px', color: '#1B5E20' }}>
            ✓ Verified irreversible votes
          </span>
        </div>

        <div className="notion-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '12px', color: '#777777', fontWeight: 500 }}>Not Voted Yet</span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#242424', marginTop: '4px' }}>
            {notVoted}
          </div>
          <span style={{ fontSize: '11px', color: '#8E8E89' }}>
            Eligible students remaining
          </span>
        </div>

        <div className="notion-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '12px', color: '#777777', fontWeight: 500 }}>Active Drafts</span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#B45309', marginTop: '4px' }}>
            {draftSaved}
          </div>
          <span style={{ fontSize: '11px', color: '#B45309' }}>
            Drafts NOT counted in turnout
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          background: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #E5E5E2',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={15} color="#8E8E89" />
          <input
            type="text"
            placeholder="Search by student number (e.g. 09000001) or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              width: '100%',
              color: '#242424',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#777777' }}>Residence:</span>
            <select
              value={selectedResId}
              onChange={(e) => setSelectedResId(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #E5E5E2',
                backgroundColor: '#F7F7F5',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Residences ({residences.length})</option>
              {residences.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#777777' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #E5E5E2',
                backgroundColor: '#F7F7F5',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses ({targetStudents.length})</option>
              <option value="Voted">Voted ({submittedBallots})</option>
              <option value="Draft Saved">Draft Saved ({draftSaved})</option>
              <option value="Not Voted">Not Voted ({notVoted})</option>
              <option value="Ineligible">Ineligible ({ineligibleCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participation Database Table */}
      <div className="notion-table-container">
        <table className="notion-table">
          <thead>
            <tr>
              <th style={{ width: '16%' }}>Student Number</th>
              <th style={{ width: '24%' }}>Surname & First Name</th>
              <th style={{ width: '20%' }}>Assigned Residence</th>
              <th style={{ width: '14%' }}>Eligibility</th>
              <th style={{ width: '14%' }}>Voting Status</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Submitted Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#8E8E89' }}>
                  No voter records match the current filters.
                </td>
              </tr>
            ) : (
              filteredStudents.map((stud) => {
                const badge = getStatusBadge(stud.votingStatus);
                const IconComponent = badge.icon;
                return (
                  <tr key={stud.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code style={{ fontSize: '12px', background: '#F1F1EF', padding: '2px 5px', borderRadius: '4px', fontWeight: 600 }}>
                          {stud.studentNumber}
                        </code>
                        {stud.isDemoData && (
                          <span style={{ fontSize: '9px', background: '#FEF3C7', color: '#92400E', padding: '1px 4px', borderRadius: '3px', fontWeight: 600 }}>
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#242424' }}>
                        {stud.surname}, {stud.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8E8E89' }}>
                        {stud.email}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: '13px' }}>{stud.residenceName}</span>
                    </td>
                    <td>
                      {stud.isEligible ? (
                        <span style={{ fontSize: '11px', color: '#1B5E20', background: '#EDF7EE', padding: '2px 7px', borderRadius: '4px', fontWeight: 500, border: '1px solid #C8E6C9' }}>
                          ✓ Eligible
                        </span>
                      ) : (
                        <span
                          style={{ fontSize: '11px', color: '#9B1C1C', background: '#FDE8E8', padding: '2px 7px', borderRadius: '4px', fontWeight: 500, border: '1px solid #F8B4B4' }}
                          title={stud.ineligibilityReason}
                        >
                          ✕ Ineligible
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 500,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        <IconComponent size={12} />
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: stud.submittedAt ? '#242424' : '#8E8E89' }}>
                        {stud.submittedAt ? stud.submittedAt.split(' ')[1] : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
