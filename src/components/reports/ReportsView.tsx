import React from 'react';
import { 
  BarChart, 
  Download, 
  FileSpreadsheet, 
  Users, 
  Vote, 
  Award, 
  ShieldCheck, 
  TrendingUp 
} from 'lucide-react';
import { Election, CandidateNomination, Residence } from '../../types/election';

interface ReportsViewProps {
  elections: Election[];
  nominations: CandidateNomination[];
  residences: Residence[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  elections,
  nominations,
  residences,
}) => {
  const exportReport = (title: string) => {
    alert(`Generating certified institutional report: "${title}" in CSV and signed PDF format.`);
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
          Electoral Analytics & Audit Reports
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6B66' }}>
          Statutory compliance reports, turnout verification records, and candidate nomination registers for university senate review.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="notion-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7656C9', marginBottom: '8px' }}>
              <Users size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#242424' }}>
                Eligible Voter Roll Audit
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#6B6B66', lineHeight: 1.5 }}>
              Breakdown of student counts by residence, campus, validation status, and verified @univ.ac.za accounts.
            </p>
          </div>
          <button
            onClick={() => exportReport('Eligible Voter Roll Audit 2026')}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px' }}
          >
            <Download size={13} /> Export CSV / PDF
          </button>
        </div>

        <div className="notion-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7656C9', marginBottom: '8px' }}>
              <TrendingUp size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#242424' }}>
                Turnout & Participation Matrix
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#6B6B66', lineHeight: 1.5 }}>
              Comparative turnout percentages, time-of-day participation curves, and quorum compliance by residence.
            </p>
          </div>
          <button
            onClick={() => exportReport('Turnout & Participation Matrix')}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px' }}
          >
            <Download size={13} /> Export CSV / PDF
          </button>
        </div>

        <div className="notion-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7656C9', marginBottom: '8px' }}>
              <Award size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#242424' }}>
                Candidate Nominations & Seconders
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#6B6B66', lineHeight: 1.5 }}>
              Official record of all submitted nominations, 22-seconder qualification logs, and committee clearance reasons.
            </p>
          </div>
          <button
            onClick={() => exportReport('Candidate Nominations & Seconders Log')}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px' }}
          >
            <Download size={13} /> Export CSV / PDF
          </button>
        </div>

        <div className="notion-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7656C9', marginBottom: '8px' }}>
              <ShieldCheck size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#242424' }}>
                Cryptographic Ballot Audit Trail
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#6B6B66', lineHeight: 1.5 }}>
              Anonymized receipt hash sequence, timestamp logs, and zero-knowledge proof verification records.
            </p>
          </div>
          <button
            onClick={() => exportReport('Cryptographic Ballot Audit Trail')}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px' }}
          >
            <Download size={13} /> Export CSV / PDF
          </button>
        </div>
      </div>
    </div>
  );
};
