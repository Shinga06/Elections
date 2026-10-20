import React, { useState } from 'react';
import { 
  FileCheck2, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Globe, 
  Lock, 
  Printer, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { PortfolioResult, Election } from '../../types/election';
import { StatusBadge } from '../common/StatusBadge';

interface ResultsCertificationProps {
  election: Election;
  results: PortfolioResult[];
  onCertify: (certifierName: string) => void;
  onPublish: () => void;
  onResolveTie: (portfolio: string, winnerId: string, reason: string) => void;
}

export const ResultsCertificationView: React.FC<ResultsCertificationProps> = ({
  election,
  results,
  onCertify,
  onPublish,
  onResolveTie,
}) => {
  const [activeTab, setActiveTab] = useState<'tally' | 'checklist' | 'tie-resolution'>('tally');
  const [selectedTieWinner, setSelectedTieWinner] = useState<string>('marula-cand-1');
  const [tieResolutionReason, setTieResolutionReason] = useState<string>('');
  const [isCertified, setIsCertified] = useState<boolean>(!!election.certifiedAt);
  const [isPublished, setIsPublished] = useState<boolean>(election.status === 'Published');

  const tiedPortfolio = results.find(r => r.hasTie);

  const handleResolveTieSubmit = () => {
    if (!tieResolutionReason) {
      alert('Institutional rule: Committee decision reason must be explicitly recorded.');
      return;
    }
    if (tiedPortfolio) {
      onResolveTie(tiedPortfolio.portfolio, selectedTieWinner, tieResolutionReason);
      alert('Committee decision recorded. Original tied vote counts preserved in official audit log.');
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
              Results, Verification & Official Certification
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#6B6B66' }}>
            {election.residenceName} House Committee Election 2026/27 • Verified Ballots Cast: {election.totalBallotsCast}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => alert('Downloading official election certification report (PDF/CSV)...')}
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
          >
            <Download size={14} /> Export Certified Report
          </button>

          {!isCertified ? (
            <button
              onClick={() => {
                if (tiedPortfolio && !tiedPortfolio.tieResolutionDecision) {
                  alert('Action Blocked: All tied portfolios must have a recorded Election Committee resolution before certification.');
                  return;
                }
                setIsCertified(true);
                onCertify('Dr. E. Vance (Chief Electoral Officer)');
              }}
              className="btn btn-primary"
              style={{ fontSize: '12px' }}
            >
              <Award size={14} /> Certify Election Results
            </button>
          ) : !isPublished ? (
            <button
              onClick={() => {
                setIsPublished(true);
                onPublish();
                alert('Results officially published to university student portal!');
              }}
              className="btn btn-primary"
              style={{ fontSize: '12px', background: '#10B981', borderColor: '#059669' }}
            >
              <Globe size={14} /> Officially Publish to Students
            </button>
          ) : (
            <span style={{ fontSize: '12px', color: '#1B5E20', background: '#EDF7EE', padding: '6px 12px', borderRadius: '6px', fontWeight: 600 }}>
              ✓ Published & Announced
            </span>
          )}
        </div>
      </div>

      {/* Tie Flag Alert Banner if Tie detected */}
      {tiedPortfolio && !tiedPortfolio.tieResolutionDecision && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={22} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B' }}>
                Tie Detected: {tiedPortfolio.portfolio} (117 votes each)
              </div>
              <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '2px' }}>
                Rule 6.4: The system will never automatically select a winner in a tie. Official committee determination and justification reason are strictly required before results certification.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('tie-resolution')}
            className="btn btn-danger btn-sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            Resolve Tie with Committee
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E5E5E2', gap: '20px' }}>
        <button
          onClick={() => setActiveTab('tally')}
          style={{
            padding: '8px 0',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'tally' ? '2px solid #7656C9' : '2px solid transparent',
            color: activeTab === 'tally' ? '#242424' : '#777777',
            fontWeight: activeTab === 'tally' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Tally & Candidate Breakdown
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          style={{
            padding: '8px 0',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'checklist' ? '2px solid #7656C9' : '2px solid transparent',
            color: activeTab === 'checklist' ? '#242424' : '#777777',
            fontWeight: activeTab === 'checklist' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Integrity & Audit Verification Checklist
        </button>
        {tiedPortfolio && (
          <button
            onClick={() => setActiveTab('tie-resolution')}
            style={{
              padding: '8px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'tie-resolution' ? '2px solid #DC2626' : '2px solid transparent',
              color: activeTab === 'tie-resolution' ? '#991B1B' : '#777777',
              fontWeight: activeTab === 'tie-resolution' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Tie Resolution Committee Decision
          </button>
        )}
      </div>

      {/* Tab: Tally Breakdown */}
      {activeTab === 'tally' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {results.map((pr) => (
            <div key={pr.portfolio} className="notion-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>
                    {pr.portfolio} Portfolio
                  </h3>
                  <div style={{ fontSize: '12px', color: '#777777', marginTop: '2px' }}>
                    Total valid ballots cast: <strong>{pr.totalVotesCast}</strong> • Neutral Abstentions: <strong>{pr.abstentions}</strong>
                  </div>
                </div>
                {pr.hasTie && !pr.tieResolutionDecision && (
                  <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    ⚠ Tie Pending Decision
                  </span>
                )}
                {pr.tieResolutionDecision && (
                  <span style={{ fontSize: '11px', background: '#F3EFFB', color: '#7656C9', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    ✓ Committee Determined
                  </span>
                )}
              </div>

              {/* Candidate rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pr.candidates.map((cand) => {
                  const isElected = cand.isWinner || (pr.tieResolutionDecision?.decidedWinnerId === cand.candidateId);
                  return (
                    <div
                      key={cand.candidateId}
                      style={{
                        padding: '12px 16px',
                        background: isElected ? '#F7FBF8' : '#FAF9F8',
                        border: isElected ? '1px solid #A7F3D0' : '1px solid #EAEAE7',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                          src={cand.photoUrl}
                          alt={cand.candidateName}
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
                              {cand.candidateName}
                            </span>
                            {isElected && (
                              <span style={{ fontSize: '11px', background: '#10B981', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                ELECTED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#777777', marginTop: '2px' }}>
                            {cand.votes} votes ({cand.percentage}%)
                          </div>
                        </div>
                      </div>

                      {/* Vote share bar */}
                      <div style={{ width: '200px' }}>
                        <div style={{ width: '100%', height: '8px', background: '#E5E5E2', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${cand.percentage}%`,
                              height: '100%',
                              background: isElected ? '#10B981' : '#7656C9',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Committee decision documentation if tie was resolved */}
              {pr.tieResolutionDecision && (
                <div style={{ marginTop: '14px', padding: '10px 14px', background: '#F8F8F6', borderRadius: '6px', fontSize: '12px', color: '#555550', borderLeft: '3px solid #7656C9' }}>
                  <strong>Official Committee Tie Resolution Record:</strong>
                  <div style={{ marginTop: '2px' }}>
                    Reason: <em>"{pr.tieResolutionDecision.reason}"</em> — Certified by {pr.tieResolutionDecision.decidedBy} at {pr.tieResolutionDecision.timestamp}.
                    (Original equal vote totals of 117 each remain permanently archived for statutory audit).
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Verification Checklist */}
      {activeTab === 'checklist' && (
        <div className="notion-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424', marginBottom: '16px' }}>
            Pre-Certification Electoral Integrity Audit
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: '#F8F8F6', borderRadius: '6px' }}>
              <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>
                  Ballot Idempotency & Duplicate Elimination
                </div>
                <div style={{ fontSize: '12px', color: '#6B6B66' }}>
                  Verified zero duplicate submissions across the student roll. All 246 ballots were single authenticated events.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: '#F8F8F6', borderRadius: '6px' }}>
              <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>
                  Student Identity & Ballot Decoupling
                </div>
                <div style={{ fontSize: '12px', color: '#6B6B66' }}>
                  Cryptographic verification confirms student records and ballot choices were detached at ingress.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: '#F8F8F6', borderRadius: '6px' }}>
              <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>
                  Quorum Participation Standard
                </div>
                <div style={{ fontSize: '12px', color: '#6B6B66' }}>
                  Turnout reached 82.0%, comfortably exceeding the institutional statutory requirement of 25%.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tie Resolution */}
      {activeTab === 'tie-resolution' && tiedPortfolio && (
        <div className="notion-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424', marginBottom: '8px' }}>
            Election Committee Tie Adjudication Panel
          </h3>
          <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '16px' }}>
            Under institutional election rule 6.4, ties for the highest count are not settled randomly. The Election Committee must vote or apply the constitutionally prescribed deadlock protocol, recording the rationale for the permanent record.
          </p>

          <div style={{ background: '#F8F8F6', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#242424', marginBottom: '8px' }}>
              Select Candidate Determined as Winner by Committee:
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {tiedPortfolio.candidates.map((cand) => (
                <label
                  key={cand.candidateId}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: selectedTieWinner === cand.candidateId ? '2px solid #7656C9' : '1px solid #E5E5E2',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <input
                    type="radio"
                    name="tieWinner"
                    checked={selectedTieWinner === cand.candidateId}
                    onChange={() => setSelectedTieWinner(cand.candidateId)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{cand.candidateName}</div>
                    <div style={{ fontSize: '11px', color: '#777777' }}>117 valid votes cast</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#242424', marginBottom: '6px' }}>
              Committee Resolution Justification & Constitutional Reference:
            </label>
            <textarea
              rows={3}
              value={tieResolutionReason}
              onChange={(e) => setTieResolutionReason(e.target.value)}
              placeholder="e.g., Decided by majority vote of the Election Review Committee following constitution clause 12.3 secondary review..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #E5E5E2',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          <button onClick={handleResolveTieSubmit} className="btn btn-primary">
            Record Committee Determination
          </button>
        </div>
      )}
    </div>
  );
};
