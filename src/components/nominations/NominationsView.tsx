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
  AlertTriangle,
  Lock,
  Key,
  Mail,
  Fingerprint,
  ExternalLink,
  User,
  CheckCheck,
  FileText,
  Share2,
  Send,
  MessageSquare,
  Award,
  Building2
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

const PORTFOLIO_DESCRIPTIONS: Record<string, { summary: string; responsibilities: string[] }> = {
  'Chairperson': {
    summary: 'Chief Executive Student Leader of the Residence.',
    responsibilities: [
      'Presides over House Committee meetings and coordinates all portfolios',
      'Acts as primary representative of residents to University Management & Housing',
      'Oversees general residence welfare, policy enforcement, and student life'
    ]
  },
  'Project Officer': {
    summary: 'Director of Residence Projects & Student Development.',
    responsibilities: [
      'Organizes academic support workshops, study groups, and mentorship programs',
      'Plans residence developmental, cultural, and community outreach initiatives',
      'Coordinates facility enhancement projects with university maintenance'
    ]
  },
  'Secretary': {
    summary: 'Chief Administrator & Communications Officer of the House Committee.',
    responsibilities: [
      'Records and circulates official meeting minutes and resolution registers',
      'Manages formal correspondence between residents, committee, and university',
      'Maintains residence notice boards, digital communications, and documentation'
    ]
  },
  'House Representative 1': {
    summary: 'Resident Welfare, Facilities & Maintenance Advocate.',
    responsibilities: [
      'Handles student room allocation queries and living condition grievances',
      'Conducts regular floor inspections and escalates maintenance work orders',
      'Promotes an inclusive, healthy living environment for all residents'
    ]
  },
  'House Representative 2': {
    summary: 'Resident Safety, Health & Student Orientation Coordinator.',
    responsibilities: [
      'Liaises with campus security and fire safety compliance teams',
      'Coordinates first-year resident orientation and social integration',
      'Advocates for mental health, wellness, and peer support programs'
    ]
  }
};

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
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [targetNomForShare, setTargetNomForShare] = useState<CandidateNomination | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // New Nomination Form State
  const [nomStudentNumber, setNomStudentNumber] = useState<string>('09000005');
  const [nomElectionId, setNomElectionId] = useState<string>(elections[0]?.id || 'elec-res-a');
  const [nomPortfolio, setNomPortfolio] = useState<string>('Chairperson');
  const [nomPhotoUrl, setNomPhotoUrl] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
  const [nomStatement, setNomStatement] = useState<string>('Committed to resident welfare, safety improvements, and active communication.');
  const [nomFormError, setNomFormError] = useState<string | null>(null);

  // Seconding Portal State (Authentication & Candidate Verification)
  const [seconderStep, setSeconderStep] = useState<'login' | 'verify' | 'success'>('login');
  const [seconderStudentNo, setSeconderStudentNo] = useState<string>('09000006');
  const [seconderPassword, setSeconderPassword] = useState<string>('DUT@Pass2026');
  const [seconderOtp, setSeconderOtp] = useState<string>('849201');
  const [seconderDeclaration, setSeconderDeclaration] = useState<boolean>(false);
  const [authenticatedSeconder, setAuthenticatedSeconder] = useState<RegisteredStudent | null>(null);
  const [seconderReceipt, setSeconderReceipt] = useState<string | null>(null);
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

  const handleOpenShareModal = (nom: CandidateNomination) => {
    setTargetNomForShare(nom);
    setShareCopied(false);
    setShowShareModal(true);
  };

  const generateShareMessage = (nom: CandidateNomination) => {
    return `📢 DUT House Committee Elections 2026/27 — Nomination Endorsement

Hi fellow resident! I, ${nom.fullName} (Student #${nom.studentNumber}), am officially running for the position of "${nom.portfolio}" in ${nom.residenceName}.

🏆 Position Contesting For: ${nom.portfolio}
🏢 Residence: ${nom.residenceName}
📜 Manifesto / Mission: "${nom.statement}"

Please second my nomination using my official authenticated link:
🔗 ${nom.uniqueSeconderLink}

(Note: Requires your DUT student portal login. You must be an enrolled resident of ${nom.residenceName} and can only second one candidate per portfolio). Thank you for your support!`;
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

  // Open Seconder Portal with Candidate Details & Authentication
  const handleOpenSeconderPortal = (nom: CandidateNomination) => {
    setTargetNomForSeconder(nom);
    setSeconderError(null);
    setSeconderSuccess(null);
    setSeconderStep('login');
    // Pre-select an eligible student from candidate's residence who has not yet seconded this portfolio
    const defaultSeconder = students.find(
      s => s.residenceId === nom.residenceId &&
           s.studentNumber !== nom.studentNumber &&
           s.isEligible &&
           !nom.seconders.some(sec => sec.studentNumber === s.studentNumber)
    );
    setSeconderStudentNo(defaultSeconder?.studentNumber || '09000006');
    setSeconderPassword('DUT@Pass2026');
    setSeconderOtp('849201');
    setSeconderDeclaration(false);
    setAuthenticatedSeconder(null);
    setSeconderReceipt(null);
    setShowSeconderModal(true);
  };

  // Step 1: Authenticate Seconder Student Login (Rule 4.3, 4.4, 4.5)
  const handleAuthenticateSeconder = (e: React.FormEvent) => {
    e.preventDefault();
    setSeconderError(null);
    setSeconderSuccess(null);

    if (!targetNomForSeconder) return;

    const seconder = students.find(s => s.studentNumber === seconderStudentNo.trim());
    if (!seconder) {
      setSeconderError(`Student #${seconderStudentNo} was not found on the approved voter roll.`);
      return;
    }

    if (!seconderPassword || seconderPassword.trim().length === 0) {
      setSeconderError('Please enter your DUT Student Portal PIN or password to authenticate.');
      return;
    }

    const valResult = validateSeconderSubmission(targetNomForSeconder.id, seconder, nominations);
    if (!valResult.isValid) {
      setSeconderError(valResult.error || 'Seconding validation failed.');
      return;
    }

    // Authenticated successfully! Proceed to Step 2: Confirmation & Declaration / OTP
    setAuthenticatedSeconder(seconder);
    setSeconderStep('verify');
  };

  // Step 2: Legal Endorsement Declaration & 2FA OTP Confirmation
  const handleConfirmSeconderEndorsement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNomForSeconder || !authenticatedSeconder) return;

    if (!seconderDeclaration) {
      setSeconderError('You must confirm the legal endorsement declaration to proceed.');
      return;
    }

    if (!seconderOtp || seconderOtp.trim().length < 4) {
      setSeconderError('Please enter the 6-digit verification OTP code.');
      return;
    }

    onAddSeconder(targetNomForSeconder.id, authenticatedSeconder);
    const receiptCode = `SEC-DUT-${targetNomForSeconder.id.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    setSeconderReceipt(receiptCode);
    setSeconderSuccess(`✓ Verified & Recorded: Student #${authenticatedSeconder.studentNumber} (${authenticatedSeconder.fullName}) added as valid seconder for ${targetNomForSeconder.fullName}.`);
    setSeconderStep('success');
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleCopyLink(nom.uniqueSeconderLink, nom.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    title="Copy candidate's unique seconder collection URL"
                  >
                    {copiedId === nom.id ? <Check size={12} color="#1B5E20" /> : <Copy size={12} />}
                    <span>{copiedId === nom.id ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>
                  <button
                    onClick={() => handleOpenShareModal(nom)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, color: '#6D28D9', borderColor: '#DDD6FE', background: '#F5F3FF' }}
                    title="Send/Share candidate invitation showing candidate details and position contesting for"
                  >
                    <Share2 size={12} />
                    <span>Send / Share</span>
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
                    href={`#second-${nom.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenSeconderPortal(nom);
                    }}
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
                      cursor: 'pointer',
                    }}
                    title="Click to open authenticated Seconder Portal for this candidate"
                  >
                    {nom.uniqueSeconderLink}
                  </a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  {nom.status !== 'Withdrawn' && (
                    <button
                      onClick={() => handleOpenSeconderPortal(nom)}
                      className="btn btn-secondary btn-sm"
                      title="Open authenticated portal to second this candidate"
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

      {/* Modal 2: Second Candidate Modal & Student Authentication Portal (Rule 4.3, 4.4, 4.5) */}
      {showSeconderModal && targetNomForSeconder && (
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
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowSeconderModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '560px',
              maxWidth: '96%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.22)',
              border: '1px solid #E5E5E2',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    textTransform: 'uppercase', 
                    color: '#7656C9', 
                    fontWeight: 700, 
                    letterSpacing: '0.04em',
                    background: '#F3EFFB',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ShieldCheck size={13} /> DUT Official Seconder Portal
                  </span>
                  <span style={{ fontSize: '11px', color: '#8E8E89' }}>• Rule 4.3 & 4.4 Verification</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#242424', margin: 0 }}>
                  Candidate Seconder Endorsement
                </h3>
              </div>
              <button 
                onClick={() => setShowSeconderModal(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#8E8E89', lineHeight: 1 }}
                title="Close"
              >
                ×
              </button>
            </div>

            {/* CANDIDATE DETAILS DOSSIER (Who is being seconded & Position Contesting For) */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #DDD6FE',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(109, 40, 217, 0.08)',
            }}>
              {/* Prominent Position Contesting For Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #6D28D9 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={12} /> Position Contesting For
                  </div>
                  <div style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '1px' }}>
                    {targetNomForSeconder.portfolio}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontSize: '11px',
                    fontWeight: 600,
                    backdropFilter: 'blur(4px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Building2 size={12} /> {targetNomForSeconder.residenceName}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
                    House Committee Election 2026/27
                  </div>
                </div>
              </div>

              {/* Portfolio Mandate Summary */}
              {PORTFOLIO_DESCRIPTIONS[targetNomForSeconder.portfolio] && (
                <div style={{ background: '#F5F3FF', padding: '8px 14px', borderBottom: '1px solid #EDE9FE', fontSize: '11px', color: '#5B21B6', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <FileText size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Portfolio Mandate:</strong> {PORTFOLIO_DESCRIPTIONS[targetNomForSeconder.portfolio].summary}
                  </div>
                </div>
              )}

              {/* Candidate Info Grid */}
              <div style={{ padding: '14px', background: '#FAFAFD' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img
                    src={targetNomForSeconder.photoUrl}
                    alt={targetNomForSeconder.fullName}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600 }}>
                      Official Nominee Details
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                      {targetNomForSeconder.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '2px' }}>
                      Student Number: <strong>#{targetNomForSeconder.studentNumber}</strong> • {targetNomForSeconder.email}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={10} /> Academic Standing: Good
                      </span>
                      <span style={{ fontSize: '10px', background: '#E0E7FF', color: '#3730A3', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <ShieldCheck size={10} /> Disciplinary Record: Cleared
                      </span>
                    </div>
                  </div>
                </div>

                {/* Candidate Manifesto / Statement */}
                <div style={{ 
                  marginTop: '12px', 
                  padding: '10px 12px', 
                  background: '#FFFFFF', 
                  borderRadius: '6px', 
                  border: '1px solid #E5E7EB',
                  fontSize: '12px', 
                  color: '#374151',
                  lineHeight: 1.45
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.04em' }}>
                    Candidate's Campaign Platform / Manifesto
                  </div>
                  <div style={{ fontStyle: 'italic' }}>
                    "{targetNomForSeconder.statement}"
                  </div>
                </div>

                {/* Seconder Quorum Meter */}
                <div style={{ marginTop: '12px', padding: '10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ color: '#4B5563', fontWeight: 600 }}>Seconders Quorum Progress:</span>
                    <span style={{ fontWeight: 700, color: targetNomForSeconder.secondersCount >= 22 ? '#15803D' : '#6D28D9' }}>
                      {targetNomForSeconder.secondersCount} of {targetNomForSeconder.requiredSeconders} Seconders Verified ({targetNomForSeconder.secondersCount >= 22 ? 'Threshold Met ✓' : `${22 - targetNomForSeconder.secondersCount} more needed`})
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, (targetNomForSeconder.secondersCount / targetNomForSeconder.requiredSeconders) * 100)}%`, 
                        height: '100%', 
                        background: targetNomForSeconder.secondersCount >= 22 ? '#10B981' : '#6D28D9',
                        borderRadius: '3px'
                      }} 
                    />
                  </div>
                </div>

                {/* Unique Seconder Link Reference */}
                <div style={{ marginTop: '10px', fontSize: '10px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px', wordBreak: 'break-all' }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>🔗 Official Seconder Link:</span>
                  <code style={{ background: '#ECE6F6', padding: '2px 6px', borderRadius: '3px', color: '#5B3EAA' }}>
                    {targetNomForSeconder.uniqueSeconderLink}
                  </code>
                </div>
              </div>
            </div>

            {/* Error & Success Alerts */}
            {seconderError && (
              <div style={{ background: '#FDE8E8', border: '1px solid #F8B4B4', padding: '10px 14px', borderRadius: '6px', color: '#9B1C1C', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{seconderError}</div>
              </div>
            )}

            {/* STEP 1: AUTHENTICATION / LOGIN */}
            {seconderStep === 'login' && (
              <form onSubmit={handleAuthenticateSeconder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#4B5563' }}>
                  <div style={{ fontWeight: 600, color: '#1F2937', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} color="#7656C9" /> Seconder Authentication Required (Rule 4.3 & 4.4)
                  </div>
                  <div>• Seconders must authenticate their identity using their DUT Student Portal credentials.</div>
                  <div>• You must be an officially enrolled resident of <strong>{targetNomForSeconder.residenceName}</strong>.</div>
                  <div>• Rule 4.5: You may only second <strong>one candidate per portfolio</strong> in this election.</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#242424', marginBottom: '4px' }}>
                    Seconder Student Number:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#8E8E89" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 09000006"
                      value={seconderStudentNo}
                      onChange={(e) => setSeconderStudentNo(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px', fontWeight: 600 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#242424', marginBottom: '4px' }}>
                    DUT Student Portal Password / PIN:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} color="#8E8E89" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="password"
                      required
                      placeholder="Enter DUT student password or PIN"
                      value={seconderPassword}
                      onChange={(e) => setSeconderPassword(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                    Used to authenticate seconder identity and confirm university registration status.
                  </span>
                </div>

                {/* Quick Demo Test Logins */}
                <div style={{ background: '#F4F5F7', padding: '10px 12px', borderRadius: '6px', fontSize: '11px' }}>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Demo Seconder Logins (Click to autofill):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {students
                      .filter(s => s.residenceId === targetNomForSeconder.residenceId && s.isEligible && s.studentNumber !== targetNomForSeconder.studentNumber)
                      .slice(0, 3)
                      .map(stud => {
                        const alreadySeconded = targetNomForSeconder.seconders.some(s => s.studentNumber === stud.studentNumber);
                        return (
                          <button
                            key={stud.id}
                            type="button"
                            onClick={() => {
                              setSeconderStudentNo(stud.studentNumber);
                              setSeconderPassword('DUT@Pass2026');
                              setSeconderError(null);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#FFFFFF',
                              border: '1px solid #D1D5DB',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: alreadySeconded ? '#9CA3AF' : '#1F2937'
                            }}
                          >
                            <span>#{stud.studentNumber}</span>
                            <span>({stud.fullName})</span>
                            {alreadySeconded && <span style={{ color: '#DC2626' }}>• already seconded</span>}
                          </button>
                        );
                      })}
                    {/* Cross residence test */}
                    {students.find(s => s.residenceId !== targetNomForSeconder.residenceId && s.isEligible) && (
                      <button
                        type="button"
                        onClick={() => {
                          const diffStud = students.find(s => s.residenceId !== targetNomForSeconder.residenceId && s.isEligible);
                          if (diffStud) {
                            setSeconderStudentNo(diffStud.studentNumber);
                            setSeconderPassword('DUT@Pass2026');
                            setSeconderError(null);
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#FEF2F2',
                          border: '1px dashed #F87171',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          color: '#B91C1C'
                        }}
                        title="Test Rule 4.4 cross-residence rejection"
                      >
                        ⚠️ Test Cross-Residence Student
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setShowSeconderModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} /> Authenticate Seconder
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: LEGAL DECLARATION & 2FA OTP CONFIRMATION */}
            {seconderStep === 'verify' && authenticatedSeconder && (
              <form onSubmit={handleConfirmSeconderEndorsement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Authenticated identity card */}
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065F46', fontWeight: 600, fontSize: '13px' }}>
                    <CheckCircle2 size={16} color="#059669" /> Seconder Identity Verified
                  </div>
                  <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: 600, marginTop: '4px' }}>
                    {authenticatedSeconder.fullName} (Student #{authenticatedSeconder.studentNumber})
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857' }}>
                    Residence: <strong>{authenticatedSeconder.residenceName}</strong> (Match Verified ✓) • {authenticatedSeconder.email}
                  </div>
                </div>

                {/* Confirmation prompt */}
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
                  You are about to formally second the nomination of <strong>{targetNomForSeconder.fullName}</strong> for the portfolio of <strong>{targetNomForSeconder.portfolio}</strong> in the {targetNomForSeconder.electionName}.
                </div>

                {/* 2FA OTP Verification Code */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#242424' }}>
                      Two-Factor Verification Code (OTP):
                    </label>
                    <button
                      type="button"
                      onClick={() => setSeconderOtp('849201')}
                      style={{ background: 'transparent', border: 'none', color: '#7656C9', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Autofill Demo Code (849201)
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#8E8E89" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit OTP code"
                      value={seconderOtp}
                      onChange={(e) => setSeconderOtp(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px', letterSpacing: '2px', fontWeight: 600 }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', display: 'block' }}>
                    Sent to registered student email ({authenticatedSeconder.email}) to prevent unauthorized endorsements.
                  </span>
                </div>

                {/* Legal declaration checkbox */}
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  padding: '12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <input
                    type="checkbox"
                    id="seconderDecl"
                    checked={seconderDeclaration}
                    onChange={(e) => setSeconderDeclaration(e.target.checked)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="seconderDecl" style={{ fontSize: '12px', color: '#374151', lineHeight: 1.4, cursor: 'pointer' }}>
                    <strong>Official Declaration:</strong> I affirm under the DUT Student Electoral Code that I am a registered student residing at <strong>{targetNomForSeconder.residenceName}</strong>, and I willingly second this candidate. I have not seconded any other candidate for the portfolio of <em>{targetNomForSeconder.portfolio}</em> in this election.
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSeconderStep('login');
                      setSeconderError(null);
                    }} 
                    className="btn btn-secondary btn-sm"
                  >
                    ← Change Login
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setShowSeconderModal(false)} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#7656C9' }}
                    >
                      <Fingerprint size={14} /> Submit & Seal Digital Endorsement
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS & DIGITAL RECEIPT */}
            {seconderStep === 'success' && authenticatedSeconder && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: '#ECFDF5', 
                  color: '#059669', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}>
                  <CheckCheck size={32} />
                </div>
                <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#1F2937', margin: '0 0 6px 0' }}>
                  Seconding Endorsement Successfully Recorded!
                </h4>
                <p style={{ fontSize: '13px', color: '#4B5563', maxWidth: '440px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  Student <strong>{authenticatedSeconder.fullName}</strong> (#{authenticatedSeconder.studentNumber}) has been formally recorded as a verified seconder for <strong>{targetNomForSeconder.fullName}</strong>.
                </p>

                <div style={{ 
                  background: '#F9FAFB', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px', 
                  padding: '14px', 
                  textAlign: 'left',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280' }}>Candidate Endorsed:</span>
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>{targetNomForSeconder.fullName} ({targetNomForSeconder.portfolio})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280' }}>Residence:</span>
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>{targetNomForSeconder.residenceName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280' }}>Total Valid Seconders:</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>
                      {targetNomForSeconder.secondersCount + 1} / {targetNomForSeconder.requiredSeconders} (Quorum: {targetNomForSeconder.secondersCount + 1 >= 22 ? 'Threshold Met ✓' : 'In Progress'})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280' }}>Cryptographic Receipt Code:</span>
                    <code style={{ fontWeight: 600, color: '#7656C9', background: '#ECE6F6', padding: '2px 6px', borderRadius: '4px' }}>
                      {seconderReceipt}
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280' }}>Timestamp:</span>
                    <span>{new Date().toISOString().replace('T', ' ').slice(0, 19)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowSeconderModal(false);
                    setSeconderStep('login');
                    setAuthenticatedSeconder(null);
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px' }}
                >
                  Done / Return to Nominations
                </button>
              </div>
            )}
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

      {/* Modal 4: Share / Send Seconder Link Modal */}
      {showShareModal && targetNomForShare && (
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
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '580px',
              maxWidth: '96%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.22)',
              border: '1px solid #E5E5E2',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    textTransform: 'uppercase', 
                    color: '#6D28D9', 
                    fontWeight: 700, 
                    background: '#F5F3FF',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Share2 size={13} /> Share Seconder Invitation
                  </span>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>• Ready to Send</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Send Seconder Link for {targetNomForShare.fullName}
                </h3>
              </div>
              <button 
                onClick={() => setShowShareModal(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#8E8E89', lineHeight: 1 }}
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Candidate & Position Spotlight Card */}
            <div style={{
              background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
              border: '1px solid #D8B4FE',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}>
              <img
                src={targetNomForShare.photoUrl}
                alt={targetNomForShare.fullName}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#7E22CE', background: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', marginBottom: '4px' }}>
                  <Award size={12} /> Contesting For: {targetNomForShare.portfolio}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                  {targetNomForShare.fullName} (Student #{targetNomForShare.studentNumber})
                </div>
                <div style={{ fontSize: '12px', color: '#6B21A8', marginTop: '1px' }}>
                  {targetNomForShare.residenceName} • {targetNomForShare.secondersCount} / {targetNomForShare.requiredSeconders} Seconders Collected
                </div>
              </div>
            </div>

            {/* Social Share Preview Card (How it appears in WhatsApp / Messages) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', marginBottom: '6px' }}>
                Recipient Link Preview (WhatsApp / Campus Chat):
              </div>
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderLeft: '4px solid #25D366',
                borderRadius: '8px',
                padding: '12px 14px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <img
                  src={targetNomForShare.photoUrl}
                  alt={targetNomForShare.fullName}
                  style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                    elections.dut.ac.za • Durban University of Technology
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginTop: '1px' }}>
                    {targetNomForShare.fullName} — Candidate for {targetNomForShare.portfolio}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>
                    Official nomination for {targetNomForShare.residenceName} House Committee. Click to authenticate & second.
                  </div>
                </div>
              </div>
            </div>

            {/* Formatted Pre-Written Message */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                  Pre-Written Share Message (Includes candidate info & position):
                </span>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>
                  Ready to paste
                </span>
              </div>
              <textarea
                readOnly
                rows={7}
                value={generateShareMessage(targetNomForShare)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  background: '#F9FAFB',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#1F2937',
                  lineHeight: 1.45,
                  resize: 'none',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(generateShareMessage(targetNomForShare));
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2500);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {shareCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{shareCopied ? 'Copied to Clipboard!' : 'Copy Invitation Message'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyLink(targetNomForShare.uniqueSeconderLink, targetNomForShare.id);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} />
                  <span>Copy Link Only</span>
                </button>
              </div>

              {/* Direct share links */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(generateShareMessage(targetNomForShare))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#047857', borderColor: '#A7F3D0', background: '#ECFDF5' }}
                >
                  <Send size={13} /> Share to WhatsApp
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Nomination Endorsement: ${targetNomForShare.fullName} for ${targetNomForShare.portfolio}`)}&body=${encodeURIComponent(generateShareMessage(targetNomForShare))}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Mail size={13} /> Share via Email
                </a>
              </div>
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
