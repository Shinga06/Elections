import React from 'react';
import { 
  Plus, 
  Calendar, 
  Users, 
  Vote, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { Election, CandidateNomination, SupportIncident, Residence } from '../../types/election';

interface DashboardOverviewProps {
  elections: Election[];
  nominations: CandidateNomination[];
  residences: Residence[];
  incidents: SupportIncident[];
  onNavigate: (page: string) => void;
  onCreateElection: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  elections,
  nominations,
  residences,
  incidents,
  onNavigate,
  onCreateElection,
}) => {
  const activeElection = elections.find(e => e.status === 'Voting Open') || elections[0];

  const totalEligible = elections.reduce((acc, curr) => acc + curr.eligibleVoterCount, 0);
  const totalApprovedCandidates = nominations.filter(n => n.status === 'Approved').length;
  const pendingNominations = nominations.filter(n => n.status === 'Collecting Seconders' || n.status === 'Seconders Met');

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header section matching reference inspiration: Greeting + Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Good afternoon, Dr. Vance
          </h1>
          <p style={{ fontSize: '13px', color: '#6B6B66' }}>
            University Residence Electoral Commission • Institutional Governance Portal
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onNavigate('results')}
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
          >
            <FileCheck size={14} />
            Review Certifications
          </button>
          <button
            onClick={onCreateElection}
            className="btn btn-primary"
            style={{ fontSize: '12px' }}
          >
            <Plus size={14} />
            Create Election
          </button>
        </div>
      </div>

      {/* Unresolved Policy Alert Banner (Rule: Exactly 100 capacity is unresolved and must be flagged) */}
      <div
        style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#92400E',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
          <div>
            <strong>Policy Exception Detected:</strong> Victoria Manor has an official capacity of exactly 100.
            The portfolio allocation rule (Above 100 vs. Below 100) is unresolved under election rules and requires Electoral Committee determination before ballot generation.
          </div>
        </div>
        <button
          onClick={() => onNavigate('residences')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #FCD34D',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#B45309',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Review Policy
        </button>
      </div>

      {/* Top Metric Cards - 4 Column Layout from Specification */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Active Elections"
          value={elections.filter(e => e.status === 'Voting Open' || e.status === 'Nominations Open').length}
          subtitle="Out of 4 configured residences"
          change={{ value: '2 pending', isPositive: true, period: 'this week' }}
          icon={Vote}
          sparklineData={[1, 1, 2, 2, 3, 2, 2]}
        />
        <MetricCard
          title="Eligible Registered Voters"
          value={totalEligible.toLocaleString()}
          subtitle="Verified via official student rolls"
          change={{ value: '98.2%', isPositive: true, period: 'verified' }}
          icon={Users}
          sparklineData={[180, 200, 240, 290, 310, 324]}
        />
        <MetricCard
          title="Approved Candidates"
          value={totalApprovedCandidates}
          subtitle="Passed academic & conduct checks"
          badge="18 Under Review"
          highlight={true}
          sparklineData={[2, 4, 7, 9, 14, 17]}
        />
        <MetricCard
          title="Live Voter Turnout"
          value={`${activeElection ? activeElection.turnoutPercentage : 0}%`}
          subtitle={activeElection ? `${activeElection.totalBallotsCast} ballots cast (${activeElection.residenceName})` : 'Awaiting open election'}
          change={{ value: '+14.2%', isPositive: true, period: 'vs 2025' }}
          icon={TrendingUp}
          sparklineData={[10, 18, 25, 34, 48, 55, 62]}
        />
      </div>

      {/* Middle Row: Visual Overview + Calendar & Deadlines (Inspired by Reference Grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '20px',
        }}
      >
        {/* Left Column (8 cols): Active Election Lifecycle & Portfolio Monitor */}
        <div
          className="notion-card"
          style={{
            gridColumn: 'span 8',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8E8E89', fontWeight: 600 }}>
                  Featured Election Lifecycle
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424', marginTop: '2px' }}>
                  {activeElection.name}
                </h3>
              </div>
              <StatusBadge status={activeElection.status} />
            </div>

            {/* Stepper Progress bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <span style={{ color: '#242424', fontWeight: 500 }}>Voting in Progress (Closes Oct 21, 20:00)</span>
                <span style={{ color: '#7656C9', fontWeight: 600 }}>{activeElection.turnoutPercentage}% Turnout</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#EAEAE7', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${activeElection.turnoutPercentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #7656C9 0%, #9F85E6 100%)',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#8E8E89' }}>
                <span>1. Roll Verified</span>
                <span>2. Nominations Closed</span>
                <span style={{ color: '#7656C9', fontWeight: 600 }}>● 3. Voting Live</span>
                <span>4. Certification</span>
                <span>5. Publication</span>
              </div>
            </div>

            {/* Mini Portfolio & Candidate breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
              <div style={{ background: '#F8F8F6', border: '1px solid #EAEAE7', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#777777', fontWeight: 500 }}>Chairperson</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#242424', margin: '4px 0' }}>2 Candidates</div>
                <div style={{ fontSize: '11px', color: '#1B5E20' }}>✓ 22 seconders met</div>
              </div>
              <div style={{ background: '#F8F8F6', border: '1px solid #EAEAE7', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#777777', fontWeight: 500 }}>Project Officer</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#242424', margin: '4px 0' }}>1 Candidate</div>
                <div style={{ fontSize: '11px', color: '#1B5E20' }}>✓ 22 seconders met</div>
              </div>
              <div style={{ background: '#F8F8F6', border: '1px solid #EAEAE7', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#777777', fontWeight: 500 }}>Secretary</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#242424', margin: '4px 0' }}>1 Candidate</div>
                <div style={{ fontSize: '11px', color: '#1B5E20' }}>✓ 22 seconders met</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E5E2' }}>
            <div style={{ fontSize: '12px', color: '#6B6B66' }}>
              Draft ballots saved: <strong>{activeElection.draftBallotCount}</strong> (Not counted towards turnout or final tally)
            </div>
            <button
              onClick={() => onNavigate('voting-mgmt')}
              className="btn btn-secondary btn-sm"
            >
              Open Voting Monitor <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Right Column (4 cols): Calendar & Upcoming Milestones (From reference image pattern) */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
                Election Schedule
              </span>
              <span style={{ fontSize: '11px', color: '#7656C9', fontWeight: 500 }}>October 2026</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '38px',
                    height: '42px',
                    background: '#F1F1EF',
                    border: '1px solid #E5E5E2',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#777777' }}>WED</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#242424', lineHeight: 1 }}>21</span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#242424' }}>Voting Closes: Olympus Hall</div>
                  <div style={{ fontSize: '11px', color: '#777777' }}>20:00 • Automated ballot seal</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '38px',
                    height: '42px',
                    background: '#F1F1EF',
                    border: '1px solid #E5E5E2',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#777777' }}>SAT</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#242424', lineHeight: 1 }}>24</span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#242424' }}>Acacia House Nominations Close</div>
                  <div style={{ fontSize: '11px', color: '#777777' }}>17:00 • 22 seconders threshold</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '38px',
                    height: '42px',
                    background: '#F3EFFB',
                    border: '1px solid #D8CCE8',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#7656C9' }}>MON</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#7656C9', lineHeight: 1 }}>26</span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#7656C9' }}>Committee Tie Resolution Session</div>
                  <div style={{ fontSize: '11px', color: '#777777' }}>14:00 • Marula Heights Chairperson</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('calendar')}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '16px' }}
          >
            <Calendar size={13} /> View Full Electoral Calendar
          </button>
        </div>
      </div>

      {/* Bottom Row: Pending Actions & Residence Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '20px',
        }}
      >
        {/* Pending Actions (6 cols) */}
        <div className="notion-card" style={{ gridColumn: 'span 6', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
              Pending Committee Actions
            </span>
            <span style={{ fontSize: '11px', background: '#FDE8E8', color: '#9B1C1C', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              3 Required
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#FBFBFA',
                border: '1px solid #EAEAE7',
                borderRadius: '6px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#242424' }}>
                  Marula Heights: Tied Results for Chairperson
                </div>
                <div style={{ fontSize: '11px', color: '#777777' }}>
                  T. Khumalo (117) vs A. Pillay (117) • Committee decision mandatory
                </div>
              </div>
              <button
                onClick={() => onNavigate('results')}
                className="btn btn-primary btn-sm"
              >
                Resolve Tie
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#FBFBFA',
                border: '1px solid #EAEAE7',
                borderRadius: '6px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#242424' }}>
                  Victoria Manor Student Roll Validation
                </div>
                <div style={{ fontSize: '11px', color: '#777777' }}>
                  Uploaded batch awaiting Chief Electoral Officer sign-off
                </div>
              </div>
              <button
                onClick={() => onNavigate('voter-registers')}
                className="btn btn-secondary btn-sm"
              >
                Inspect Batch
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#FBFBFA',
                border: '1px solid #EAEAE7',
                borderRadius: '6px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#242424' }}>
                  Zoe Van Der Merwe (Acacia House)
                </div>
                <div style={{ fontSize: '11px', color: '#777777' }}>
                  Reached 22 valid seconders • Awaiting formal approval
                </div>
              </div>
              <button
                onClick={() => onNavigate('nominations')}
                className="btn btn-secondary btn-sm"
              >
                Review Candidate
              </button>
            </div>
          </div>
        </div>

        {/* Residence Status Directory (6 cols) */}
        <div className="notion-card" style={{ gridColumn: 'span 6', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
              Residence Portfolio Matrix
            </span>
            <button onClick={() => onNavigate('residences')} className="btn btn-secondary btn-sm">
              View All (4)
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {residences.map((res) => (
              <div
                key={res.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #F1F1EF',
                  background: '#FFFFFF',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>{res.name}</span>
                    <span style={{ fontSize: '11px', color: '#8E8E89' }}>({res.campus})</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B6B66', marginTop: '2px' }}>
                    Capacity: {res.officialCapacity} • Registered Voters: {res.registeredVoterCount}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusBadge status={res.electionStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
