import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Users, 
  Vote, 
  Clock, 
  PauseCircle, 
  FileCheck,
  CheckCircle2,
  ShieldAlert,
  BarChart2
} from 'lucide-react';
import { Election } from '../../types/election';
import { StatusBadge } from '../common/StatusBadge';

interface VotingManagementProps {
  elections: Election[];
  onToggleVoting: (electionId: string, open: boolean) => void;
  onNavigateToResults: () => void;
}

export const VotingManagementView: React.FC<VotingManagementProps> = ({
  elections,
  onToggleVoting,
  onNavigateToResults,
}) => {
  const activeElection = elections.find(e => e.status === 'Voting Open') || elections[0];
  const [selectedElection, setSelectedElection] = useState<Election>(activeElection);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
          Voting Management & Live Integrity Controls
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6B66' }}>
          Supervise active residence ballots, monitor legitimate turnout without compromising secret-ballot privacy, and audit live submission counts.
        </p>
      </div>

      {/* Critical Security Rule Callout */}
      <div
        style={{
          background: '#F3EFFB',
          border: '1px solid #D8CCE8',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
        }}
      >
        <Lock size={20} color="#7656C9" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: '#3A2E59', lineHeight: 1.5 }}>
          <strong>Ballot Secrecy & Neutrality Protocol Enforced:</strong>
          <p style={{ marginTop: '2px' }}>
            In strict compliance with university electoral governance, <strong>no candidate vote totals, rankings, or projected winners are displayed while voting is open</strong>.
            Draft ballots (<strong>{selectedElection.draftBallotCount} in session</strong>) are never counted towards turnout or final tally results.
          </p>
        </div>
      </div>

      {/* Selector & Live Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '20px',
        }}
      >
        {/* Main Status Panel (8 cols) */}
        <div className="notion-card" style={{ gridColumn: 'span 8', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#242424' }}>
                  {selectedElection.name}
                </h3>
              </div>
              <div style={{ fontSize: '12px', color: '#777777', marginTop: '3px' }}>
                Window: {selectedElection.votingStart} to {selectedElection.votingEnd}
              </div>
            </div>
            <StatusBadge status={selectedElection.status} size="md" />
          </div>

          {/* Turnout Gauge Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
            <div style={{ padding: '14px', background: '#F8F8F6', borderRadius: '6px', border: '1px solid #EAEAE7' }}>
              <div style={{ fontSize: '11px', color: '#777777', fontWeight: 500 }}>Turnout Rate</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#7656C9', marginTop: '4px' }}>
                {selectedElection.turnoutPercentage}%
              </div>
              <div style={{ fontSize: '11px', color: '#1B5E20', marginTop: '2px' }}>
                Quorum threshold surpassed
              </div>
            </div>

            <div style={{ padding: '14px', background: '#F8F8F6', borderRadius: '6px', border: '1px solid #EAEAE7' }}>
              <div style={{ fontSize: '11px', color: '#777777', fontWeight: 500 }}>Final Ballots Cast</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#242424', marginTop: '4px' }}>
                {selectedElection.totalBallotsCast}
              </div>
              <div style={{ fontSize: '11px', color: '#6B6B66', marginTop: '2px' }}>
                of {selectedElection.eligibleVoterCount} registered voters
              </div>
            </div>

            <div style={{ padding: '14px', background: '#F8F8F6', borderRadius: '6px', border: '1px solid #EAEAE7' }}>
              <div style={{ fontSize: '11px', color: '#777777', fontWeight: 500 }}>Unsubmitted Drafts</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#B45309', marginTop: '4px' }}>
                {selectedElection.draftBallotCount}
              </div>
              <div style={{ fontSize: '11px', color: '#8E8E89', marginTop: '2px' }}>
                Active student working sessions
              </div>
            </div>
          </div>

          {/* Turnout Progress Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 500, color: '#242424' }}>Voter Participation</span>
              <span style={{ color: '#7656C9', fontWeight: 600 }}>{selectedElection.totalBallotsCast} / {selectedElection.eligibleVoterCount}</span>
            </div>
            <div style={{ width: '100%', height: '12px', background: '#EAEAE7', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${selectedElection.turnoutPercentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #7656C9 0%, #A38BE3 100%)',
                  borderRadius: '6px',
                }}
              />
            </div>
          </div>

          {/* Emergency Controls restricted to authorized CEO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #E5E5E2' }}>
            <div style={{ fontSize: '12px', color: '#8E8E89' }}>
              Schedule closes automatically on Oct 21 at 20:00.
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowOverrideModal(true)}
                className="btn btn-secondary btn-sm"
              >
                <PauseCircle size={14} /> Schedule Override / Emergency Action
              </button>

              {selectedElection.status === 'Voting Closed' || selectedElection.status === 'Awaiting Certification' ? (
                <button onClick={onNavigateToResults} className="btn btn-primary btn-sm">
                  <BarChart2 size={14} /> Proceed to Vote Tally & Certification
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Election Selector & Audited Node Status (4 cols) */}
        <div
          className="notion-card"
          style={{
            gridColumn: 'span 4',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', marginBottom: '12px' }}>
              Select Active Residence Scope
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {elections.map((elec) => (
                <div
                  key={elec.id}
                  onClick={() => setSelectedElection(elec)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: elec.id === selectedElection.id ? '1px solid #7656C9' : '1px solid #E5E5E2',
                    background: elec.id === selectedElection.id ? '#F8F6FC' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>{elec.residenceName}</div>
                    <div style={{ fontSize: '11px', color: '#777777' }}>{elec.turnoutPercentage}% participation</div>
                  </div>
                  <StatusBadge status={elec.status} />
                </div>
              ))}
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', marginBottom: '8px' }}>
              Cryptographic Safeguards
            </h4>
            <div style={{ fontSize: '12px', color: '#555550', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>✓ Blinded Ballot ID hash generation</div>
              <div>✓ One-ballot idempotent constraint</div>
              <div>✓ OTP replay attack prevention</div>
              <div>✓ Voter registry identity isolation</div>
            </div>
          </div>

          <div style={{ paddingTop: '16px', borderTop: '1px solid #E5E5E2', fontSize: '11px', color: '#8E8E89' }}>
            System timestamp: 2026-10-19 15:28 • Node: ZA-JHB-PRI-01
          </div>
        </div>
      </div>

      {/* Emergency Override Modal */}
      {showOverrideModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowOverrideModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              width: '500px',
              maxWidth: '90%',
              padding: '24px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#B91C1C', marginBottom: '14px' }}>
              <ShieldAlert size={22} />
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#242424' }}>
                Authorized Electoral Override
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#555550', lineHeight: 1.5, marginBottom: '14px' }}>
              Overriding voting status or closing an election before its statutory deadline triggers a tamper-evident audit log event recorded with your Chief Electoral Officer credentials.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '6px' }}>
                Reason for Emergency Schedule Override (Required):
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Extended closing deadline by 2 hours due to university network outage..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #E5E5E2',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowOverrideModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!overrideReason) {
                    alert('Please enter a justification reason for audit records.');
                    return;
                  }
                  onToggleVoting(selectedElection.id, false);
                  setShowOverrideModal(false);
                  alert('Voting officially closed. Transitioning election state to "Awaiting Certification".');
                }}
                className="btn btn-danger"
              >
                Close Voting Early & Seal Ballots
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
