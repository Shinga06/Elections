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
} from 'lucide-react';
import { Election, CandidateNomination, Residence, RegisteredStudent, AuditLogEntry } from '../../types/election';

interface ReportsViewProps {
  elections: Election[];
  nominations: CandidateNomination[];
  residences: Residence[];
  students: RegisteredStudent[];
  auditLogs: AuditLogEntry[];
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
}) => {
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  const handleDownload = (reportKey: string, filename: string, rows: string[][]) => {
    downloadCsv(filename, rows);
    setLastDownloaded(reportKey);
    setTimeout(() => setLastDownloaded(null), 3000);
  };

  const today = new Date().toISOString().slice(0, 10);

  const reports = [
    {
      key: 'voter-roll',
      icon: <Users size={18} />,
      title: 'Eligible Voter Roll Audit',
      description: 'Breakdown of all students by residence, validation status, voting status, and verified email accounts.',
      filename: `voter_roll_audit_${today}.csv`,
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
      key: 'turnout',
      icon: <TrendingUp size={18} />,
      title: 'Turnout & Participation Matrix',
      description: 'Comparative turnout percentages and quorum compliance by residence with certification timestamps.',
      filename: `turnout_matrix_${today}.csv`,
      rows: [
        ['Residence', 'Election Status', 'Eligible Voters', 'Final Ballots Cast', 'Draft Ballots', 'Turnout %', 'Certified At', 'Published At'],
        ...elections.map(e => [
          e.residenceName, e.status, String(e.eligibleVoterCount), String(e.totalBallotsCast),
          String(e.draftBallotCount), `${e.turnoutPercentage}%`,
          e.certifiedAt || '', e.publishedAt || '',
        ]),
      ],
      count: `${elections.length} elections`,
    },
    {
      key: 'nominations',
      icon: <HeartHandshake size={18} />,
      title: 'Nominations & Seconders Log',
      description: 'Official record of all submitted nominations, seconder qualification logs, and committee clearance reasons.',
      filename: `nominations_log_${today}.csv`,
      rows: [
        ['Nomination ID', 'Full Name', 'Student Number', 'Residence', 'Portfolio', 'Status', 'Seconders', 'Required', 'Submitted At', 'Review Reason', 'Reviewed By'],
        ...nominations.map(n => [
          n.id, n.fullName, n.studentNumber, n.residenceName, n.portfolio, n.status,
          String(n.secondersCount), String(n.requiredSeconders), n.submittedAt,
          n.reviewReason || '', n.reviewedBy || '',
        ]),
      ],
      count: `${nominations.length} nominations`,
    },
    {
      key: 'candidate-status',
      icon: <Award size={18} />,
      title: 'Candidate Status Register',
      description: 'Candidate status: pending review, approved, disqualified, withdrawn, or ineligible — as required by SRS §5.',
      filename: `candidate_status_${today}.csv`,
      rows: [
        ['Full Name', 'Student Number', 'Residence', 'Portfolio', 'Status', 'Seconders', 'Submitted At', 'Withdrawn At', 'Withdrawal Reason'],
        ...nominations.map(n => [
          n.fullName, n.studentNumber, n.residenceName, n.portfolio, n.status,
          String(n.secondersCount), n.submittedAt,
          n.withdrawnAt || '', n.withdrawalReason || '',
        ]),
      ],
      count: `${nominations.filter(n => n.status === 'Approved').length} approved`,
    },
    {
      key: 'election-stats',
      icon: <CheckCircle2 size={18} />,
      title: 'Final Election Results & Statistics',
      description: 'Election outcomes by residence including voter counts, turnout, certifier and publication records.',
      filename: `election_results_${today}.csv`,
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
      title: 'Activity & Administrative Audit Log',
      description: 'Tamper-resistant audit trail of all key administrative actions with actor, timestamp, and severity.',
      filename: `audit_log_${today}.csv`,
      rows: [
        ['Timestamp', 'Actor', 'Role', 'Action', 'Details', 'IP Address', 'Severity'],
        ...auditLogs.map(a => [a.timestamp, a.actorName, a.actorRole, a.action, a.details, a.ipAddress, a.severity]),
      ],
      count: `${auditLogs.length} entries`,
    },
  ];

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
          Electoral Analytics &amp; Audit Reports
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6B66' }}>
          Statutory compliance reports, turnout verification records, and candidate registers for university senate review.
          All reports download as real CSV files from live system data.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
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
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#242424' }}>{report.title}</h3>
                </div>
                <span style={{
                  fontSize: '11px', background: '#F3EFFB', color: '#7656C9',
                  padding: '2px 8px', borderRadius: '4px', fontWeight: 500, whiteSpace: 'nowrap',
                }}>
                  {report.count}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6B6B66', lineHeight: 1.5 }}>{report.description}</p>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleDownload(report.key, report.filename, report.rows)}
                className="btn btn-secondary btn-sm"
                style={{
                  background: lastDownloaded === report.key ? '#EDF7EE' : undefined,
                  color: lastDownloaded === report.key ? '#1B5E20' : undefined,
                  borderColor: lastDownloaded === report.key ? '#A7F3D0' : undefined,
                  transition: 'all 0.2s ease',
                }}
              >
                <Download size={13} />
                {lastDownloaded === report.key ? '✓ Downloaded!' : 'Download CSV'}
              </button>
              <span style={{ fontSize: '10px', color: '#9B9B96' }}>
                <FileText size={10} style={{ display: 'inline', marginRight: '3px' }} />
                {report.filename}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#FFFBEB', border: '1px solid #FDE68A',
        borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#92400E',
      }}>
        ⚠ <strong>Access Restriction (SRS §5):</strong> Reports containing personal information or unreleased results are restricted to authorised roles only. Do not share externally without Election Committee approval.
      </div>
    </div>
  );
};
