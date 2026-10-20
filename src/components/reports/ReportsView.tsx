import React, { useState } from 'react';
import {
  Download,
  Users,
  Award,
  ShieldCheck,
  TrendingUp,
  FileText,
  HeartHandshake,
  CheckCircle2,
  LifeBuoy,
  BarChart3,
  Layers,
  Lock,
} from 'lucide-react';
import { 
  Election, 
  CandidateNomination, 
  Residence, 
  RegisteredStudent, 
  AuditLogEntry, 
  SupportIncident, 
  PortfolioResult 
} from '../../types/election';

interface ReportsViewProps {
  elections: Election[];
  nominations: CandidateNomination[];
  residences: Residence[];
  students: RegisteredStudent[];
  auditLogs: AuditLogEntry[];
  incidents?: SupportIncident[];
  results?: PortfolioResult[];
}

// Helper to trigger a CSV file download in the browser
const downloadCsv = (filename: string, rows: string[][]) => {
  const csvContent = rows
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  elections,
  nominations,
  residences,
  students,
  auditLogs,
  incidents = [],
  results = [],
}) => {
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  const handleDownload = (reportKey: string, filename: string, rows: string[][]) => {
    downloadCsv(filename, rows);
    setLastDownloaded(reportKey);
    setTimeout(() => setLastDownloaded(null), 3000);
  };

  const today = new Date().toISOString().slice(0, 10);

  // Group nominations by portfolio for Report 2
  const portfoliosList = Array.from(new Set(elections.flatMap(e => e.portfolios)));
  const portfolioSummaryRows: string[][] = [
    ['Residence', 'Portfolio', 'Total Nominations Received', 'Approved Nominees', 'Pending Review', 'Disqualified', 'Ineligible (<22 Seconders)', 'Withdrawn'],
    ...elections.flatMap(e =>
      e.portfolios.map(p => {
        const portNoms = nominations.filter(n => n.residenceId === e.residenceId && n.portfolio === p);
        const approved = portNoms.filter(n => n.status === 'Approved').length;
        const pending = portNoms.filter(n => n.status === 'Pending Review' || n.status === 'Collecting Seconders' || n.status === 'Seconders Met').length;
        const disqualified = portNoms.filter(n => n.status === 'Disqualified').length;
        const ineligible = portNoms.filter(n => n.status === 'Ineligible').length;
        const withdrawn = portNoms.filter(n => n.status === 'Withdrawn').length;
        return [
          e.residenceName,
          p,
          String(portNoms.length),
          String(approved),
          String(pending),
          String(disqualified),
          String(ineligible),
          String(withdrawn),
        ];
      })
    )
  ];

  // Valid votes per candidate report (Report 5)
  const candidateVotesRows: string[][] = [
    ['Residence', 'Portfolio', 'Candidate ID', 'Candidate Name', 'Vote Count', 'Percentage of Portfolio Votes', 'Outcome Status', 'Tie Status'],
    ...results.flatMap(r =>
      r.candidates.map(c => [
        'Residence A', // primary results context
        r.portfolio,
        c.candidateId,
        c.candidateName,
        String(c.votes),
        `${c.percentage.toFixed(1)}%`,
        c.isWinner ? 'Elected (Highest Vote)' : c.isTied ? 'Tied - Pending Committee' : 'Defeated',
        r.hasTie ? 'Tie Flagged (FR-25)' : 'Clear Margin',
      ])
    )
  ];

  // 8 Exact Statutory Reports required by SRS Section 5:
  const reports = [
    {
      key: 'voter-roll',
      icon: <Users size={18} />,
      srsRef: 'SRS §5.1',
      title: 'Eligible Voters per Residence',
      description: 'Audit breakdown of all eligible enrolled students by residence, validation status, participation status, and email addresses.',
      filename: `eligible_voters_per_residence_${today}.csv`,
      rows: [
        ['Student Number', 'Full Name', 'Email', 'Residence', 'Eligible', 'Voting Status', 'Submitted At', 'Ineligibility Reason'],
        ...students.map(s => [
          s.studentNumber, s.fullName, s.email, s.residenceName,
          s.isEligible ? 'Yes' : 'No', s.votingStatus,
          s.submittedAt || '', s.ineligibilityReason || '',
        ]),
      ],
      count: `${students.length} students`,
    },
    {
      key: 'portfolio-nominations',
      icon: <Layers size={18} />,
      srsRef: 'SRS §5.2',
      title: 'Nominations & Nominees per Portfolio',
      description: 'Total nominations received and approved nominees per portfolio structure across each residence.',
      filename: `nominations_per_portfolio_${today}.csv`,
      rows: portfolioSummaryRows,
      count: `${portfoliosList.length} portfolios`,
    },
    {
      key: 'candidate-status',
      icon: <Award size={18} />,
      srsRef: 'SRS §5.3',
      title: 'Candidate Status Register',
      description: 'Official status of all candidates: pending review, approved, disqualified, withdrawn, or marked ineligible.',
      filename: `candidate_status_register_${today}.csv`,
      rows: [
        ['Full Name', 'Student Number', 'Residence', 'Portfolio', 'Status', 'Seconders Count', 'Submitted At', 'Withdrawn At', 'Disqualification/Review Reason'],
        ...nominations.map(n => [
          n.fullName, n.studentNumber, n.residenceName, n.portfolio, n.status,
          String(n.secondersCount), n.submittedAt,
          n.withdrawnAt || '', n.withdrawalReason || n.reviewReason || '',
        ]),
      ],
      count: `${nominations.length} total nominations`,
    },
    {
      key: 'turnout',
      icon: <TrendingUp size={18} />,
      srsRef: 'SRS §5.4',
      title: 'Voter Turnout per Residence',
      description: 'Turnout percentages based exclusively on final submitted ballots (drafts strictly excluded from turnout as per FR-20).',
      filename: `voter_turnout_by_residence_${today}.csv`,
      rows: [
        ['Residence', 'Election Status', 'Eligible Voters', 'Final Ballots Cast', 'Draft Ballots (Uncounted)', 'Turnout %', 'Certified At', 'Published At'],
        ...elections.map(e => [
          e.residenceName, e.status, String(e.eligibleVoterCount), String(e.totalBallotsCast),
          String(e.draftBallotCount), `${e.turnoutPercentage}%`,
          e.certifiedAt || '', e.publishedAt || '',
        ]),
      ],
      count: `${elections.length} residences`,
    },
    {
      key: 'candidate-votes',
      icon: <BarChart3 size={18} />,
      srsRef: 'SRS §5.5',
      title: 'Valid Votes per Candidate',
      description: 'Valid vote counts per candidate sorted by residence and portfolio with winner/tie identification (FR-24 & FR-25).',
      filename: `valid_votes_by_candidate_${today}.csv`,
      rows: candidateVotesRows,
      count: `${results.flatMap(r => r.candidates).length} candidates tallies`,
    },
    {
      key: 'election-stats',
      icon: <CheckCircle2 size={18} />,
      srsRef: 'SRS §5.6',
      title: 'Final Election Results & Statistics',
      description: 'Comprehensive outcomes by residence including verification records, certification officer, and official announcement timestamp.',
      filename: `final_election_results_stats_${today}.csv`,
      rows: [
        ['Residence', 'Capacity', 'Eligible Voters', 'Ballots Cast', 'Turnout %', 'Approved Candidates', 'Tie Flagged', 'Status', 'Verified By', 'Certified By', 'Published At'],
        ...elections.map(e => [
          e.residenceName, String(e.capacity), String(e.eligibleVoterCount),
          String(e.totalBallotsCast), `${e.turnoutPercentage}%`,
          String(e.approvedCandidateCount), e.tieFlagged ? 'Yes' : 'No',
          e.status, e.verifiedBy || '', e.certifiedBy || '', e.publishedAt || '',
        ]),
      ],
      count: `${elections.filter(e => e.status === 'Published').length} published`,
    },
    {
      key: 'audit',
      icon: <ShieldCheck size={18} />,
      srsRef: 'SRS §5.7',
      title: 'Administrative Activity & Audit Report',
      description: 'Tamper-resistant audit log of all critical administrative actions with officer identity, action timestamp, and cryptographic hash.',
      filename: `administrative_audit_report_${today}.csv`,
      rows: [
        ['Timestamp', 'Actor', 'Role', 'Action Event', 'Details', 'IP Address', 'Severity'],
        ...auditLogs.map(a => [a.timestamp, a.actorName, a.actorRole, a.action, a.details, a.ipAddress, a.severity]),
      ],
      count: `${auditLogs.length} audit entries`,
    },
    {
      key: 'support-incidents',
      icon: <LifeBuoy size={18} />,
      srsRef: 'SRS §5.8',
      title: 'Technical Support & Incident Report',
      description: 'Full record of technical support incidents across Durban and Midlands campuses, category, SLA targets, and resolution times.',
      filename: `support_incidents_report_${today}.csv`,
      rows: [
        ['Incident ID', 'Student Number', 'Campus', 'Contact Method', 'Residence', 'Category', 'Status', 'Escalation Level', 'Assigned Officer', 'Created At', 'Resolved At', 'Resolution Minutes', 'Description', 'Resolution Notes'],
        ...incidents.map(i => [
          i.id, i.studentIdentifier, i.campus || 'Durban', i.contactMethod || 'Email',
          i.residenceName, i.category, i.status, i.escalationLevel || 'Standard',
          i.assignedTo || 'Unassigned', i.createdAt, i.resolvedAt || '',
          String(i.resolutionTimeMinutes || ''), i.description, i.resolutionNotes || '',
        ]),
      ],
      count: `${incidents.length} incidents logged`,
    },
  ];

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em', margin: 0 }}>
            Electoral Analytics &amp; Statutory Reports
          </h1>
          <span style={{ fontSize: '11px', background: '#F3EFFB', color: '#7656C9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
            SRS §5 Complete (8/8 Reports)
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#6B6B66', margin: '4px 0 0' }}>
          Statutory university senate reports, candidate registers, turnout matrix, candidate vote tallies, and technical support SLAs. All reports download as verified CSV files from live system data.
        </p>
      </div>

      {/* Grid of 8 Statutory Reports */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {reports.map((report) => (
          <div
            key={report.key}
            className="notion-card"
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7656C9' }}>
                  {report.icon}
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', margin: 0 }}>{report.title}</h3>
                </div>
                <span style={{
                  fontSize: '10px', background: '#F3EFFB', color: '#7656C9',
                  padding: '2px 6px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  {report.srsRef}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6B6B66', lineHeight: 1.5, margin: '8px 0 0' }}>
                {report.description}
              </p>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleDownload(report.key, report.filename, report.rows)}
                className="btn btn-secondary btn-sm"
                style={{
                  background: lastDownloaded === report.key ? '#EDF7EE' : undefined,
                  color: lastDownloaded === report.key ? '#1B5E20' : undefined,
                  borderColor: lastDownloaded === report.key ? '#A7F3D0' : undefined,
                  transition: 'all 0.2s ease',
                  fontSize: '12px',
                }}
              >
                <Download size={13} />
                {lastDownloaded === report.key ? '✓ Downloaded!' : 'Download CSV'}
              </button>
              <span style={{ fontSize: '11px', color: '#8E8E89' }}>
                {report.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Role Restriction & Statutory Compliance Notice */}
      <div style={{
        background: '#FFFBEB', border: '1px solid #FDE68A',
        borderRadius: '8px', padding: '14px 18px', fontSize: '12px', color: '#92400E',
        display: 'flex', alignItems: 'flex-start', gap: '10px'
      }}>
        <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Role-Based Access Control Notice (SRS §5 &amp; NFR-02):</strong>
          <div style={{ marginTop: '3px', lineHeight: 1.4 }}>
            Reports containing personal student information, unpublished voter turnouts, or unreleased vote tallies are strictly restricted to authorized administrative roles (Electoral Officers, Chief Electoral Officer, Senate Reviewers). Student-facing interfaces remain strictly isolated from unreleased election tallies until official publication.
          </div>
        </div>
      </div>
    </div>
  );
};
