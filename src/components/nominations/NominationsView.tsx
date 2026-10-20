import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Sparkles,
  UserPlus,
  HeartHandshake,
  LogOut,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { CandidateNomination, Election, RegisteredStudent } from '../../types/election';
import { StatusBadge } from '../common/StatusBadge';
import { 
  validateNominationSubmission, 
  validateSeconderSubmission, 
  evaluateNominationsAtDeadline,
  processCandidateWithdrawal 
} from '../../utils/nominationRules';

interface NominationsProps {
  nominations: CandidateNomination[];
  elections: Election[];
  students: RegisteredStudent[];
  onApprove: (id: string, reason: string) => void;
  onDisqualify: (id: string, reason: string) => void;
  onCreateNomination: (newNom: CandidateNomination) => void;
  onAddSeconder: (nominationId: string, seconder: RegisteredStudent) => void;
  onWithdrawNomination: (nominationId: string, reason: string, isPostDeadline: boolean) => void;
  onTriggerDeadlineEvaluation: () => void;
}

export const NominationsView: React.FC<NominationsProps> = ({
  nominations,
  elections,
  students,
  onApprove,
  onDisqualify,
  onCreateNomination,
  onAddSeconder,
  onWithdrawNomination,
  onTriggerDeadlineEvaluation,
}) => {
  const [selectedNomination, setSelectedNomination] = useState<CandidateNomination | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [decisionReason, setDecisionReason] = useState<string>('');

  // Modals state
  const [showNominationModal, setShowNominationModal] = useState<boolean>(false);
  const [showSeconderModal, setShowSeconderModal] = useState<boolean>(false);
  const [targetNomForSeconder, setTargetNomForSeconder] = useState<CandidateNomination | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [targetNomForWithdraw, setTargetNomForWithdraw] = useState<CandidateNomination | null>(null);

  // New Nomination Form State
  const [nomStudentNumber, setNomStudentNumber] = useState<string>('09000005');
  const [nomElectionId, setNomElectionId] = useState<string>(elections[0]?.id || 'elec-res-a');
  const [nomPortfolio, setNomPortfolio] = useState<string>('Chairperson');
  const [nomPhotoUrl, setNomPhotoUrl] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
  const [nomStatement, setNomStatement] = useState<string>('Committed to resident welfare, safety improvements, and active communication.');
  const [nomFormError, setNomFormError] = useState<string | null>(null);

  // Seconding Form State
  const [seconderStudentNo, setSeconderStudentNo] = useState<string>('09000006');
  const [seconderError, setSeconderError] = useState<string | null>(null);
  const [seconderSuccess, setSeconderSuccess] = useState<string | null>(null);

  // Withdrawal Form State
  const [withdrawReason, setWithdrawReason] = useState<string>('Personal academic commitments');

  const filteredNominations = nominations.filter((n) => {
    if (statusFilter === 'all') return true;
    return n.status === statusFilter;
  });

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard?.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit New Nomination (Rule 4.1 & 4.2)
  const handleSubmitNomination = (e: React.FormEvent) => {
    e.preventDefault();
    setNomFormError(null);

    // Rule 4.1 validation
    const valResult = validateNominationSubmission(
      nomStudentNumber,
      nomElectionId,
      nomPortfolio,
      nomPhotoUrl,
      nomStatement,
      nominations
    );

    if (!valResult.isValid) {
      setNomFormError(valResult.error || 'Validation failed');
      return;
    }

    // Verify student exists on roll
    const student = students.find(s => s.studentNumber === nomStudentNumber.trim());
    if (!student) {
      setNomFormError(`Student #${nomStudentNumber} was not found on any approved register.`);
      return;
    }

    const election = elections.find(e => e.id === nomElectionId) || elections[0];
    if (student.residenceId !== election.residenceId) {
      setNomFormError(`Student belongs to ${student.residenceName}, but election is for ${election.residenceName}. Cross-residence nomination blocked.`);
      return;
    }

    const newNomId = `nom-${Date.now()}`;
    const newNom: CandidateNomination = {
      id: newNomId,
      electionId: election.id,
      electionName: election.name,
      residenceId: election.residenceId,
      residenceName: election.residenceName,
      studentNumber: student.studentNumber,
      fullName: student.fullName,
      email: student.email,
      portfolio: nomPortfolio,
      photoUrl: nomPhotoUrl,
      statement: nomStatement,
      academicGoodStanding: true,
      disciplinaryClearance: true,
      status: 'Collecting Seconders',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      secondersCount: 0,
      requiredSeconders: 22,
      seconders: [],
      uniqueSeconderLink: `https://elections.dut.ac.za/second/${newNomId}-token-${student.studentNumber}`,
    };

    onCreateNomination(newNom);
    setShowNominationModal(false);
    alert(`Nomination for ${newNom.fullName} (${newNom.portfolio}) submitted successfully. Unique seconder link generated.`);
  };

  // Submit Seconder (Rule 4.3, 4.4, 4.5)
  const handleSubmitSeconder = (e: React.FormEvent) => {
    e.preventDefault();
    setSeconderError(null);
    setSeconderSuccess(null);

    if (!targetNomForSeconder) return;

    const seconder = students.find(s => s.studentNumber === seconderStudentNo.trim());
    if (!seconder) {
      setSeconderError(`Student #${seconderStudentNo} was not found on the approved voter roll.`);
      return;
    }

    const valResult = validateSeconderSubmission(targetNomForSeconder.id, seconder, nominations);
    if (!valResult.isValid) {
      setSeconderError(valResult.error || 'Seconding validation failed.');
      return;
    }

    onAddSeconder(targetNomForSeconder.id, seconder);
    setSeconderSuccess(`✓ Verified: Student #${seconder.studentNumber} (${seconder.fullName}) added as valid seconder for ${targetNomForSeconder.fullName}.`);
    setTimeout(() => {
      setShowSeconderModal(false);
      setSeconderSuccess(null);
    }, 1800);
  };

  // Withdrawal Submit (Rule 4.8 & 4.9)
  const handleConfirmWithdrawal = () => {
    if (!targetNomForWithdraw) return;
    const election = elections.find(e => e.id === targetNomForWithdraw.electionId) || elections[0];
    const withdrawResult = processCandidateWithdrawal(targetNomForWithdraw, election, withdrawReason);

    onWithdrawNomination(targetNomForWithdraw.id, withdrawReason, withdrawResult.requiresCommitteeReview);
    setShowWithdrawModal(false);
    alert(withdrawResult.message);
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
            Candidates & Nominations
          </h1>
          <p style={{ fontSize: '13px', color: '#6B6B66' }}>
            Vetting workspace enforcing 1-nomination-per-student, 22-seconder threshold, 1-seconder-per-portfolio, and withdrawal procedures.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onTriggerDeadlineEvaluation}
            className="btn btn-secondary btn-sm"
            title="Simulate nomination deadline close: Marks nominations < 22 seconders as Ineligible (Rule 4.6)"
          >
            <Clock size={13} /> Trigger Nomination Close Evaluation
          </button>
          <button
            onClick={() => {
              setNomFormError(null);
              setShowNominationModal(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <UserPlus size={13} /> Nominate Candidate
          </button>
        </div>
      </div>

      {/* Rules Notice */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E5E2',
          borderRadius: '8px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} color="#7656C9" />
          <span style={{ fontSize: '12px', color: '#444440' }}>
            <strong>Rules Enforced:</strong> 1 portfolio nomination per student • 22 valid residence seconders required before deadline • 1 candidate support per portfolio per student • Auto-ineligibility for &lt;22 at deadline.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#777777' }}>Filter:</span>
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
            }}
          >
            <option value="all">All Nominations ({nominations.length})</option>
            <option value="Approved">Approved</option>
            <option value="Seconders Met">Seconders Met (Ready for Review)</option>
            <option value="Collecting Seconders">Collecting Seconders</option>
            <option value="Ineligible">Ineligible (&lt;22 Seconders)</option>
            <option value="Withdrawn">Withdrawn</option>
            <option value="Disqualified">Disqualified</option>
          </select>
        </div>
      </div>

      {/* Nominations Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredNominations.map((nom) => {
          const secondersProgress = Math.min(100, Math.round((nom.secondersCount / nom.requiredSeconders) * 100));

          return (
            <div
              key={nom.id}
              className="notion-card"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: nom.status === 'Withdrawn' || nom.status === 'Ineligible' ? 0.75 : 1,
              }}
            >
              <div>
                {/* Candidate Photo & Info */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <img
                    src={nom.photoUrl}
                    alt={nom.fullName}
                    style={{
                      width: '56px',
                      height: '68px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      border: '1px solid #E5E5E2',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#242424', lineHeight: 1.2 }}>
                      {nom.fullName}
                    </h4>
                    <div style={{ fontSize: '11px', color: '#7656C9', fontWeight: 600, marginTop: '2px' }}>
                      {nom.portfolio}
                    </div>
                    <div style={{ fontSize: '11px', color: '#777777', marginTop: '1px' }}>
                      {nom.residenceName} • #{nom.studentNumber}
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <StatusBadge status={nom.status} />
                    </div>
                  </div>
                </div>

                {/* Post-Deadline Withdrawal Request Notice if active */}
                {nom.withdrawalPostDeadlineRequest && nom.status !== 'Withdrawn' && (
                  <div style={{ marginTop: '10px', padding: '8px 10px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '4px', fontSize: '11px', color: '#92400E' }}>
                    <strong>Post-Deadline Withdrawal Requested:</strong>
                    <div>Reason: "{nom.withdrawalPostDeadlineRequest.reason}" (Awaiting Committee Action)</div>
                  </div>
                )}

                {/* Seconder Collection Meter */}
                <div style={{ margin: '14px 0', padding: '10px 12px', background: '#F8F8F6', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                    <span style={{ color: '#555550' }}>Verified Residence Seconders</span>
                    <span style={{ fontWeight: 600, color: nom.secondersCount >= 22 ? '#1B5E20' : '#8D6B00' }}>
                      {nom.secondersCount} / {nom.requiredSeconders}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#EAEAE7', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${secondersProgress}%`,
                        height: '100%',
                        background: nom.secondersCount >= 22 ? '#10B981' : '#F59E0B',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>

                {/* Statement snippet */}
                <p style={{ fontSize: '12px', color: '#555550', fontStyle: 'italic', lineHeight: 1.4, marginBottom: '12px' }}>
                  "{nom.statement.slice(0, 95)}..."
                </p>

                {/* Seconders List preview if any */}
                {nom.seconders.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#777777', marginBottom: '8px' }}>
                    Seconders: {nom.seconders.map(s => s.studentName).join(', ')}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #EAEAE7', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => handleCopyLink(nom.uniqueSeconderLink, nom.id)}
                    className="btn btn-secondary btn-sm"
                    title="Copy candidate's unique seconder collection URL"
                  >
                    {copiedId === nom.id ? <Check size={12} color="#1B5E20" /> : <Copy size={12} />}
                    <span>{copiedId === nom.id ? 'Copied!' : 'Copy Seconder Link'}</span>
                  </button>
                </div>

                {/* FR-10: Visible, navigable unique seconder link */}
                <div style={{
                  marginTop: '6px',
                  padding: '6px 10px',
                  background: '#F3EFFB',
                  borderRadius: '5px',
                  border: '1px solid #D8CCE8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{ fontSize: '10px', color: '#7656C9', fontWeight: 600, whiteSpace: 'nowrap' }}>🔗 Seconder URL:</span>
                  <a
                    href={nom.uniqueSeconderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '10px',
                      color: '#5B3EAA',
                      textDecoration: 'underline',
                      wordBreak: 'break-all',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '180px',
                      display: 'inline-block',
                    }}
                    title={nom.uniqueSeconderLink}
                  >
                    {nom.uniqueSeconderLink}
                  </a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  {nom.status !== 'Withdrawn' && (
                    <button
                      onClick={() => {
                        setTargetNomForSeconder(nom);
                        setSeconderError(null);
                        setSeconderSuccess(null);
                        setShowSeconderModal(true);
                      }}
                      className="btn btn-secondary btn-sm"
                      title="Second this candidate"
                    >
                      <HeartHandshake size={12} /> Second Candidate
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {nom.status !== 'Withdrawn' ? (
                    <button
                      onClick={() => {
                        setTargetNomForWithdraw(nom);
                        setShowWithdrawModal(true);
                      }}
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: '11px' }}
                    >
                      <LogOut size={12} /> Withdraw
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#9B1C1C', fontStyle: 'italic' }}>
                      Withdrawn ({nom.withdrawnAt ? nom.withdrawnAt.split(' ')[0] : 'Recorded'})
                    </span>
                  )}

                  {nom.status !== 'Withdrawn' && nom.status !== 'Ineligible' && (
                    <button
                      onClick={() => {
                        setSelectedNomination(nom);
                        setDecisionReason('');
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Create Nomination Modal (Rule 4.1 & 4.2) */}
      {showNominationModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowNominationModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              width: '500px',
              maxWidth: '92%',
              padding: '24px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#242424' }}>
                Submit Candidate Nomination
              </h3>
              <button
                onClick={() => setShowNominationModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#8E8E89' }}
              >
                ×
              </button>
            </div>

            {nomFormError && (
              <div style={{ background: '#FDE8E8', border: '1px solid #F8B4B4', padding: '10px 14px', borderRadius: '6px', color: '#9B1C1C', fontSize: '12px', marginBottom: '14px' }}>
                {nomFormError}
              </div>
            )}

            <form onSubmit={handleSubmitNomination} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Target Election:
                </label>
                <select
                  value={nomElectionId}
                  onChange={(e) => setNomElectionId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '13px' }}
                >
                  {elections.map((elec) => (
                    <option key={elec.id} value={elec.id}>
                      {elec.name} ({elec.residenceName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Student Number (Must exist on approved roll; max 1 nomination per student):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 09000005"
                  value={nomStudentNumber}
                  onChange={(e) => setNomStudentNumber(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Portfolio Selection:
                </label>
                <select
                  value={nomPortfolio}
                  onChange={(e) => setNomPortfolio(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '13px' }}
                >
                  <option value="Chairperson">Chairperson</option>
                  <option value="Project Officer">Project Officer</option>
                  <option value="Secretary">Secretary</option>
                  <option value="House Representative 1">House Representative 1</option>
                  <option value="House Representative 2">House Representative 2</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  ID-Size Photograph URL (Required):
                </label>
                <input
                  type="url"
                  required
                  value={nomPhotoUrl}
                  onChange={(e) => setNomPhotoUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Candidate Statement / Manifesto (Required):
                </label>
                <textarea
                  rows={2}
                  required
                  value={nomStatement}
                  onChange={(e) => setNomStatement(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowNominationModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Nomination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Second Candidate Modal (Rule 4.3, 4.4, 4.5) */}
      {showSeconderModal && targetNomForSeconder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowSeconderModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              width: '480px',
              maxWidth: '92%',
              padding: '24px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#7656C9', fontWeight: 600 }}>
                  Unique Seconder Link Opened
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#242424' }}>
                  Second Candidate: {targetNomForSeconder.fullName}
                </h3>
                <div style={{ fontSize: '12px', color: '#6B6B66' }}>
                  Portfolio: {targetNomForSeconder.portfolio} • {targetNomForSeconder.residenceName}
                </div>
              </div>
              <button onClick={() => setShowSeconderModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#8E8E89' }}>
                ×
              </button>
            </div>

            {seconderError && (
              <div style={{ background: '#FDE8E8', border: '1px solid #F8B4B4', padding: '10px 14px', borderRadius: '6px', color: '#9B1C1C', fontSize: '12px', marginBottom: '14px' }}>
                {seconderError}
              </div>
            )}

            {seconderSuccess && (
              <div style={{ background: '#EDF7EE', border: '1px solid #C8E6C9', padding: '10px 14px', borderRadius: '6px', color: '#1B5E20', fontSize: '12px', marginBottom: '14px' }}>
                {seconderSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitSeconder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#F8F8F6', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#555550' }}>
                <strong>Eligibility Rules:</strong>
                <div>1. Seconder must belong to <strong>{targetNomForSeconder.residenceName}</strong>.</div>
                <div>2. A student may second only <strong>one candidate per portfolio</strong> in this election.</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Seconder Student Number:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 09000006"
                  value={seconderStudentNo}
                  onChange={(e) => setSeconderStudentNo(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowSeconderModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Validate & Record Seconder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Candidate Withdrawal Confirmation (Rule 4.8 & 4.9) */}
      {showWithdrawModal && targetNomForWithdraw && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowWithdrawModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              width: '460px',
              maxWidth: '92%',
              padding: '24px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#B91C1C', marginBottom: '14px' }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#242424' }}>
                Candidate Withdrawal Request
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#555550', lineHeight: 1.5, marginBottom: '14px' }}>
              Are you sure you wish to withdraw <strong>{targetNomForWithdraw.fullName}</strong> from the <strong>{targetNomForWithdraw.portfolio}</strong> election?
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                Reason for Withdrawal:
              </label>
              <textarea
                rows={2}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowWithdrawModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmWithdrawal} className="btn btn-danger">
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedNomination && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setSelectedNomination(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              width: '560px',
              maxWidth: '92%',
              padding: '24px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img
                  src={selectedNomination.photoUrl}
                  alt={selectedNomination.fullName}
                  style={{ width: '48px', height: '60px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#242424' }}>
                    {selectedNomination.fullName}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#7656C9', fontWeight: 500 }}>
                    Nominated for {selectedNomination.portfolio} ({selectedNomination.residenceName})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNomination(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#8E8E89' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ background: '#F8F8F6', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', fontWeight: 600 }}>
                  Candidate Manifest
                </div>
                <p style={{ marginTop: '4px', color: '#242424', lineHeight: 1.5 }}>
                  {selectedNomination.statement}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ border: '1px solid #E5E5E2', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#777777' }}>Seconders Status</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#242424', marginTop: '2px' }}>
                    {selectedNomination.secondersCount} / 22 Verified
                  </div>
                  <div style={{ fontSize: '11px', color: selectedNomination.secondersCount >= 22 ? '#1B5E20' : '#B45309' }}>
                    {selectedNomination.secondersCount >= 22 ? '✓ Minimum quorum met' : '⚠ Below 22 threshold'}
                  </div>
                </div>

                <div style={{ border: '1px solid #E5E5E2', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#777777' }}>Institutional Standing</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1B5E20', marginTop: '2px' }}>
                    Approved
                  </div>
                  <div style={{ fontSize: '11px', color: '#777777' }}>Academic & Conduct Cleared</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Adjudication Decision Reason (Mandatory under institutional policy):
                </label>
                <textarea
                  rows={2}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="e.g., Verified valid seconders on official roll, verified academic good standing..."
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #E5E5E2' }}>
                <button
                  onClick={() => {
                    if (!decisionReason) {
                      alert('Please record an adjudication reason for institutional audit.');
                      return;
                    }
                    onDisqualify(selectedNomination.id, decisionReason);
                    setSelectedNomination(null);
                  }}
                  className="btn btn-danger"
                >
                  <XCircle size={14} /> Disqualify Candidate
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setSelectedNomination(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!decisionReason) {
                        alert('Please record an adjudication reason for institutional audit.');
                        return;
                      }
                      onApprove(selectedNomination.id, decisionReason);
                      setSelectedNomination(null);
                    }}
                    className="btn btn-primary"
                  >
                    <CheckCircle2 size={14} /> Approve for Ballot
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
