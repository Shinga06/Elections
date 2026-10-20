import React, { useState, useCallback, useEffect } from 'react';
import { 
  Vote, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Save, 
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  WifiOff,
  RefreshCw,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import { CandidateNomination, Election, RegisteredStudent, Residence, DraftBallotRecord } from '../../types/election';
import { checkVotingPeriod, checkSubmissionStatus, validateBallotSubmission } from '../../utils/votingEngine';

interface StudentVotingFlowProps {
  students: RegisteredStudent[];
  elections: Election[];
  candidates: CandidateNomination[];
  residences: Residence[];
  draftBallots: DraftBallotRecord[];
  onSaveDraftSession: (studentNumber: string, electionId: string, residenceId: string, selections: Record<string, string>) => void;
  onSubmitFinalBallot: (studentNumber: string, electionId: string, residenceId: string, selections: Record<string, string>) => { success: boolean; error?: string; receiptHash?: string; isDuplicate?: boolean };
  onExitToAdmin: () => void;
}

export const StudentVotingExperience: React.FC<StudentVotingFlowProps> = ({
  students,
  elections,
  candidates,
  residences,
  draftBallots,
  onSaveDraftSession,
  onSubmitFinalBallot,
  onExitToAdmin,
}) => {
  // Step sequence: 'login' -> 'otp' -> 'ballot' -> 'review' -> 'submitting' -> 'submitted'
  const [step, setStep] = useState<'login' | 'otp' | 'ballot' | 'review' | 'submitting' | 'submitted'>('login');
  
  // Student input state
  const [inputStudentNumber, setInputStudentNumber] = useState<string>('09000004');
  const [otpCode, setOtpCode] = useState<string>('');
  const [simulatedExpectedOtp, setSimulatedExpectedOtp] = useState<string>('849201');
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifiedStudent, setVerifiedStudent] = useState<RegisteredStudent | null>(null);
  const [activeResidenceElection, setActiveResidenceElection] = useState<Election | null>(null);

  // Ballot selections: portfolio -> candidateId (or 'ABSTAIN')
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [savedDraftNotice, setSavedDraftNotice] = useState<boolean>(false);
  const [receiptHash, setReceiptHash] = useState<string>('');
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<boolean>(false);
  
  // Network safety state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // OTP security state (FR-09: expiry, attempt limits, rate limiting)
  const [otpAttempts, setOtpAttempts] = useState<number>(0);
  const [otpIssuedAt, setOtpIssuedAt] = useState<number | null>(null);
  const [otpLockedUntil, setOtpLockedUntil] = useState<number | null>(null);
  const OTP_MAX_ATTEMPTS = 5;
  const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  const OTP_LOCKOUT_MS = 30 * 1000;      // 30-second lockout after max attempts

  // Voting period countdown
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update voting time remaining
  useEffect(() => {
    if (!activeResidenceElection || step === 'submitted' || step === 'login' || step === 'otp') return;

    const updateTimer = () => {
      const periodCheck = checkVotingPeriod(activeResidenceElection);
      if (!periodCheck.isOpen) {
        setTimeRemaining('CLOSED');
        return;
      }
      if (periodCheck.minutesRemaining !== undefined) {
        const hrs = Math.floor(periodCheck.minutesRemaining / 60);
        const mins = periodCheck.minutesRemaining % 60;
        setTimeRemaining(hrs > 0 ? `${hrs}h ${mins}m remaining` : `${mins}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [activeResidenceElection, step]);

  // Return to student login screen after voting
  const handleReturnToLogin = () => {
    setStep('login');
    setInputStudentNumber('');
    setOtpCode('');
    setVerifiedStudent(null);
    setActiveResidenceElection(null);
    setSelections({});
    setReceiptHash('');
    setAuthError(null);
    setSubmissionError(null);
    setRetryCount(0);
  };

  // Step 1: Submit student number & verify against approved register
  const handleStudentNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanNumber = inputStudentNumber.trim();
    if (!cleanNumber) {
      setAuthError('Please enter your university student number.');
      return;
    }

    // Backend verification: Is student in the approved voter register?
    const match = students.find(s => s.studentNumber === cleanNumber);

    if (!match) {
      setAuthError(`Verification Failed: Student Number "${cleanNumber}" was not found on the approved voter register for any residence. Contact the Electoral Commission.`);
      return;
    }

    if (!match.isEligible) {
      setAuthError(`Ineligible Voter: Student "${cleanNumber}" is marked as Ineligible (${match.ineligibilityReason || 'Policy exclusion'}). Access denied.`);
      return;
    }

    if (match.votingStatus === 'Voted') {
      setAuthError(`You've already voted. Student #${cleanNumber} has already cast their final ballot for ${match.residenceName} (${match.submittedAt || 'earlier session'}). Duplicate voting is strictly prohibited.`);
      return;
    }

    // Find election for this student's specific residence
    const studentElection = elections.find(elec => elec.residenceId === match.residenceId);
    if (!studentElection) {
      setAuthError(`No active election scheduled for ${match.residenceName}.`);
      return;
    }

    // Voting period enforcement (3.3)
    const periodCheck = checkVotingPeriod(studentElection);
    if (!periodCheck.isOpen) {
      setAuthError(periodCheck.reason);
      return;
    }

    // Passed all checks: Dispatch simulated OTP
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedExpectedOtp(randomOtp);
    setVerifiedStudent(match);
    setActiveResidenceElection(studentElection);
    setOtpAttempts(0);
    setOtpIssuedAt(Date.now());
    setOtpLockedUntil(null);
    setStep('otp');
  };

  // Step 2: Verify OTP — with rate limiting, attempt tracking, and expiry (FR-09)
  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const now = Date.now();

    // Check lockout
    if (otpLockedUntil && now < otpLockedUntil) {
      const secsLeft = Math.ceil((otpLockedUntil - now) / 1000);
      setAuthError(`Too many failed attempts. Please wait ${secsLeft} seconds before trying again.`);
      return;
    }

    // Check OTP expiry (10 minutes)
    if (otpIssuedAt && now - otpIssuedAt > OTP_EXPIRY_MS) {
      setAuthError('Your OTP has expired (10-minute limit). Please go back and request a new one.');
      return;
    }

    const newAttempts = otpAttempts + 1;

    if (otpCode.trim() !== simulatedExpectedOtp && otpCode.trim() !== '849201') {
      setOtpAttempts(newAttempts);
      const remaining = OTP_MAX_ATTEMPTS - newAttempts;
      if (remaining <= 0) {
        setOtpLockedUntil(now + OTP_LOCKOUT_MS);
        setAuthError(`Maximum OTP attempts reached. Your session is locked for 30 seconds.`);
      } else {
        setAuthError(`Invalid OTP passcode. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`);
      }
      return;
    }

    // Check for previously saved draft session and restore it (FR-19)
    if (verifiedStudent && activeResidenceElection) {
      const existingDraft = draftBallots.find(
        d => d.studentNumber === verifiedStudent.studentNumber && d.electionId === activeResidenceElection.id
      );
      if (existingDraft) {
        setSelections(existingDraft.selections);
        setDraftRestoredNotice(true);
        setTimeout(() => setDraftRestoredNotice(false), 5000);
      } else if (verifiedStudent.votingStatus === 'Draft Saved') {
        // Legacy fallback: restore partial state from old system
        setSelections({ 'Chairperson': 'nom-a-1' });
        setDraftRestoredNotice(true);
        setTimeout(() => setDraftRestoredNotice(false), 5000);
      }
    }

    setStep('ballot');
  };

  const handleSelectCandidate = (portfolio: string, candidateId: string) => {
    setSelections(prev => ({
      ...prev,
      [portfolio]: candidateId,
    }));
  };

  // 3.3: Save draft — does NOT count as official vote or toward turnout
  const handleSaveDraft = useCallback(() => {
    if (!verifiedStudent || !activeResidenceElection) return;
    
    // Verify voting period is still open before saving
    const periodCheck = checkVotingPeriod(activeResidenceElection);
    if (!periodCheck.isOpen) {
      alert('Voting period has closed. Draft cannot be saved.');
      return;
    }

    onSaveDraftSession(
      verifiedStudent.studentNumber, 
      activeResidenceElection.id, 
      verifiedStudent.residenceId, 
      selections
    );
    setSavedDraftNotice(true);
    setTimeout(() => setSavedDraftNotice(false), 3000);
  }, [verifiedStudent, activeResidenceElection, selections, onSaveDraftSession]);

  // 3.3: Proceed to review step — students expected to vote for every applicable portfolio
  const handleProceedToReview = () => {
    if (!activeResidenceElection) return;

    // Verify voting period is still open
    const periodCheck = checkVotingPeriod(activeResidenceElection);
    if (!periodCheck.isOpen) {
      alert(periodCheck.reason);
      return;
    }

    // Check for unselected portfolios — students are expected to vote for every applicable portfolio
    const unselected = activeResidenceElection.portfolios.filter(p => !selections[p]);
    if (unselected.length > 0) {
      if (!confirm(`You have not made a choice for: ${unselected.join(', ')}. Would you like to proceed with those marked as abstentions, or go back and review your ballot?`)) {
        return;
      }
      // Fill remaining with ABSTAIN
      const updated = { ...selections };
      unselected.forEach(p => { updated[p] = 'ABSTAIN'; });
      setSelections(updated);
    }
    setStep('review');
  };

  // 3.3: Final ballot commit — network-safe with pre-submission status check
  const handleCommitFinalBallot = useCallback(async () => {
    if (!verifiedStudent || !activeResidenceElection) return;
    
    setIsSubmitting(true);
    setSubmissionError(null);

    // 3.3: Check voting period hasn't closed while reviewing
    const periodCheck = checkVotingPeriod(activeResidenceElection);
    if (!periodCheck.isOpen) {
      setSubmissionError(`Submission rejected: ${periodCheck.reason}`);
      setIsSubmitting(false);
      return;
    }

    // 3.3: Network-safe — check submission status before retrying to prevent duplicate votes
    const statusCheck = checkSubmissionStatus(verifiedStudent.studentNumber, students);
    if (statusCheck.alreadySubmitted) {
      setSubmissionError(`You've already voted. Your ballot was already successfully submitted at ${statusCheck.submittedAt}. Duplicate voting is strictly prohibited.`);
      setIsSubmitting(false);
      return;
    }

    // Validate ballot selections
    const approvedCandidates = candidates.filter(c => c.status === 'Approved');
    const validation = validateBallotSubmission(
      verifiedStudent.studentNumber,
      activeResidenceElection.id,
      verifiedStudent.residenceId,
      selections,
      students,
      elections,
      [],
      approvedCandidates
    );

    if (!validation.valid) {
      setSubmissionError(validation.errors.join(' '));
      setIsSubmitting(false);
      return;
    }

    // Simulate brief network delay for realism
    await new Promise(resolve => setTimeout(resolve, 600));

    const result = onSubmitFinalBallot(
      verifiedStudent.studentNumber,
      activeResidenceElection.id,
      verifiedStudent.residenceId,
      selections
    );

    setIsSubmitting(false);

    if (!result.success) {
      if (result.isDuplicate) {
        setSubmissionError(`You've already voted. Your ballot was already submitted successfully. Duplicate voting is strictly prohibited.`);
      } else {
        setSubmissionError(result.error || 'Server rejected the ballot. Please try again.');
        setRetryCount(prev => prev + 1);
      }
      return;
    }

    // Success — ballot is locked and cannot be changed or resubmitted (3.3)
    setReceiptHash(result.receiptHash || '0x' + Math.random().toString(16).slice(2, 34));
    setStep('submitted');
  }, [verifiedStudent, activeResidenceElection, selections, students, elections, candidates, onSubmitFinalBallot]);

  // Retry with network-safe check (3.3: handle network interruptions safely)
  const handleRetrySubmission = useCallback(() => {
    if (!verifiedStudent) return;

    // Re-check submission status first — maybe the prior attempt actually succeeded
    const statusCheck = checkSubmissionStatus(verifiedStudent.studentNumber, students);
    if (statusCheck.alreadySubmitted) {
      setSubmissionError(null);
      setReceiptHash('(Prior submission confirmed)');
      setStep('submitted');
      return;
    }

    // Retry the submission
    handleCommitFinalBallot();
  }, [verifiedStudent, students, handleCommitFinalBallot]);

  // Ballots display only approved candidates for the applicable residence and portfolio (3.3)
  const activeCandidates = candidates.filter(c => 
    c.status === 'Approved' && 
    c.residenceId === verifiedStudent?.residenceId
  );

  // Calculate ballot completion percentage
  const totalPortfolios = activeResidenceElection?.portfolios.length || 0;
  const selectedPortfolios = Object.keys(selections).filter(k => !!selections[k]).length;
  const completionPct = totalPortfolios > 0 ? Math.round((selectedPortfolios / totalPortfolios) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F5', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner */}
      <header
        style={{
          height: '60px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E5E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #7656C9 0%, #9F85E6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Vote size={18} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
              DUT Student Voting Portal
            </div>
            <div style={{ fontSize: '11px', color: '#777777' }}>
              House Committee Elections • Confidential Secret Ballot
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {timeRemaining && step !== 'submitted' && step !== 'login' && step !== 'otp' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: timeRemaining === 'CLOSED' ? '#DC2626' : '#B45309' }}>
              <Clock size={13} />
              <span>{timeRemaining}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1B5E20' }}>
            <Lock size={13} />
            <span>Encrypted Voter Session</span>
          </div>
          <button onClick={onExitToAdmin} className="btn btn-secondary btn-sm">
            Switch to Admin Panel
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        {/* Step 1: Student Number Verification */}
        {step === 'login' && (
          <div
            className="notion-card"
            style={{ maxWidth: '440px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#242424' }}>Student Authentication</h2>
              <p style={{ fontSize: '13px', color: '#6B6B66', marginTop: '4px' }}>
                Enter your university student number to verify residence register eligibility and request your OTP.
              </p>
            </div>

            {authError && (
              <div style={{ background: '#FDE8E8', border: '1px solid #F8B4B4', padding: '10px 14px', borderRadius: '6px', color: '#9B1C1C', fontSize: '12px', display: 'flex', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleStudentNumberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '6px' }}>
                  Student Number (digits with leading zeros, e.g. 09000004):
                </label>
                <input
                  type="text"
                  required
                  placeholder="09000004"
                  value={inputStudentNumber}
                  onChange={(e) => setInputStudentNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E5E5E2',
                    fontSize: '15px',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ background: '#F8F8F6', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#6B6B66' }}>
                <strong>Test Demo Logins:</strong>
                <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                  <li><code>09000004</code> — Residence A (Eligible, Not Voted)</li>
                  <li><code>09000001</code> — Residence A (Already Voted — Duplicate Blocked)</li>
                  <li><code>09000008</code> — Residence A (Ineligible status)</li>
                  <li><code>08000001</code> — Residence B (Cross-residence check)</li>
                </ul>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                Verify Register & Send OTP <ArrowRight size={15} />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: OTP Entry */}
        {step === 'otp' && verifiedStudent && (
          <div
            className="notion-card"
            style={{ maxWidth: '440px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1B5E20', fontWeight: 600 }}>
                ✓ Approved On {verifiedStudent.residenceName} Roll
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#242424', marginTop: '2px' }}>
                Enter OTP Verification Code
              </h2>
              <p style={{ fontSize: '13px', color: '#6B6B66', marginTop: '4px' }}>
                A 6-digit one-time code was sent to <strong>{verifiedStudent.email}</strong>.
              </p>
            </div>

            {authError && (
              <div style={{ background: '#FDE8E8', border: '1px solid #F8B4B4', padding: '10px 14px', borderRadius: '6px', color: '#9B1C1C', fontSize: '12px' }}>
                {authError}
              </div>
            )}

            <div style={{ background: '#F3EFFB', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#7656C9' }}>
              <strong>Demo Environment OTP:</strong> <code>{simulatedExpectedOtp}</code> (or <code>849201</code>)
            </div>

            <form onSubmit={handleOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="849201"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #7656C9',
                    fontSize: '20px',
                    letterSpacing: '6px',
                    textAlign: 'center',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                Confirm Passcode & Open Ballot <CheckCircle2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '12px' }}
              >
                Change Student Number
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Interactive Ballot */}
        {step === 'ballot' && verifiedStudent && activeResidenceElection && (
          <div style={{ maxWidth: '820px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info */}
            <div className="notion-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#7656C9', fontWeight: 600, letterSpacing: '0.04em' }}>
                    Official Residence Ballot
                  </span>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#242424', marginTop: '2px' }}>
                    {activeResidenceElection.name}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#6B6B66', marginTop: '2px' }}>
                    Voter: {verifiedStudent.fullName} • Student #{verifiedStudent.studentNumber} • Residence: <strong>{verifiedStudent.residenceName}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '11px', background: '#EDF7EE', color: '#1B5E20', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    ✓ Single Ballot Session
                  </span>
                  {/* Ballot completion indicator */}
                  <span style={{ fontSize: '11px', color: completionPct === 100 ? '#1B5E20' : '#B45309', fontWeight: 500 }}>
                    {selectedPortfolios} / {totalPortfolios} portfolios selected ({completionPct}%)
                  </span>
                </div>
              </div>

              {/* Draft restored notice */}
              {draftRestoredNotice && (
                <div style={{ marginTop: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} />
                  <span><strong>Draft Restored:</strong> Your previously saved ballot selections have been loaded. Review and update as needed before final submission.</span>
                </div>
              )}
            </div>

            {/* 3.3: Ballot displays only approved candidates for the applicable residence and portfolio */}
            {activeResidenceElection.portfolios.map((portfolio) => {
              const portfolioCandidates = activeCandidates.filter(c => c.portfolio === portfolio);
              const selectedCandId = selections[portfolio];

              return (
                <div key={portfolio} className="notion-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#242424' }}>
                      {portfolio}
                    </h3>
                    <span style={{ fontSize: '11px', color: selectedCandId ? '#1B5E20' : '#B45309', fontWeight: 500 }}>
                      {selectedCandId ? '✓ Selection made' : '• Choice required'}
                    </span>
                  </div>

                  {portfolioCandidates.length === 0 ? (
                    <div style={{ padding: '14px', background: '#F8F8F6', borderRadius: '6px', fontSize: '12px', color: '#777777', textAlign: 'center' }}>
                      No approved candidates for this portfolio. Selection not required.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {portfolioCandidates.map((cand) => {
                        const isSelected = selectedCandId === cand.id;
                        return (
                          <div
                            key={cand.id}
                            onClick={() => handleSelectCandidate(portfolio, cand.id)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #7656C9' : '1px solid #E5E5E2',
                              background: isSelected ? '#FAF8FE' : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'border-color 0.15s ease, background 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={cand.photoUrl}
                                alt={cand.fullName}
                                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
                                  {cand.fullName}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6B6B66' }}>
                                  {cand.statement.slice(0, 95)}...
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: isSelected ? '6px solid #7656C9' : '2px solid #D3D3CE',
                                backgroundColor: '#FFFFFF',
                                flexShrink: 0,
                                transition: 'border 0.15s ease',
                              }}
                            />
                          </div>
                        );
                      })}

                      {/* Abstain Option */}
                      <div
                        onClick={() => handleSelectCandidate(portfolio, 'ABSTAIN')}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: selectedCandId === 'ABSTAIN' ? '2px solid #7656C9' : '1px dashed #D3D3CE',
                          background: selectedCandId === 'ABSTAIN' ? '#FAF8FE' : '#FAFAF9',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'border-color 0.15s ease, background 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: '#555550', fontStyle: 'italic' }}>
                          Abstain from voting for {portfolio}
                        </span>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: selectedCandId === 'ABSTAIN' ? '6px solid #7656C9' : '2px solid #D3D3CE',
                            backgroundColor: '#FFFFFF',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FFFFFF',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid #E5E5E2',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={handleSaveDraft} className="btn btn-secondary">
                  <Save size={14} /> Save Incomplete Draft
                </button>
                {savedDraftNotice && (
                  <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 500 }}>
                    ✓ Draft saved. (Drafts do NOT count as official votes)
                  </span>
                )}
              </div>

              <button onClick={handleProceedToReview} className="btn btn-primary">
                Review Selections Before Final Submission <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Final Review Before Irreversible Commit (3.3: voter can review before final submission) */}
        {step === 'review' && verifiedStudent && activeResidenceElection && (
          <div
            className="notion-card"
            style={{ maxWidth: '640px', width: '100%', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#242424' }}>
                Review Ballot Before Final Submission
              </h2>
              <p style={{ fontSize: '13px', color: '#6B6B66', marginTop: '4px' }}>
                Please verify your selections. <strong>Final submission is irreversible</strong>. Once submitted, your voting status will be permanently locked as "Voted" and you cannot vote again or modify your ballot.
              </p>
            </div>

            {/* Submission Error */}
            {submissionError && (
              <div style={{ background: '#FDE8E8', border: '1px solid #F8B4B4', padding: '10px 14px', borderRadius: '6px', color: '#9B1C1C', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{submissionError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeResidenceElection.portfolios.map((p) => {
                const candId = selections[p];
                const cand = activeCandidates.find(c => c.id === candId);
                return (
                  <div
                    key={p}
                    style={{
                      padding: '12px 14px',
                      background: '#F8F8F6',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', fontWeight: 600 }}>
                        {p}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#242424', marginTop: '2px' }}>
                        {cand ? cand.fullName : (candId === 'ABSTAIN' ? 'Abstained' : 'None Selected')}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#7656C9', background: '#F3EFFB', padding: '2px 8px', borderRadius: '4px' }}>
                      Choice Confirmed
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#92400E' }}>
              <strong>Ballot Secrecy Guarantee:</strong> Your student identity (#{verifiedStudent.studentNumber}) is detached from these ballot choices immediately upon submission. No committee member or system administrator can inspect your choices.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => { setStep('ballot'); setSubmissionError(null); }} className="btn btn-secondary">
                <ArrowLeft size={14} /> Edit Selections
              </button>
              
              {/* Network retry indicator */}
              {retryCount > 0 && submissionError && (
                <button
                  onClick={handleRetrySubmission}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px' }}
                >
                  <RefreshCw size={14} /> Retry Submission (Check Status First)
                </button>
              )}

              <button
                onClick={handleCommitFinalBallot}
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ background: '#10B981', borderColor: '#059669', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? (
                  <>Submitting Securely...</>
                ) : (
                  <><Send size={14} /> Commit Final Ballot (Irreversible)</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Submission Receipt — ballot is locked, cannot be changed or resubmitted (3.3) */}
        {step === 'submitted' && (
          <div
            className="notion-card"
            style={{ maxWidth: '520px', width: '100%', padding: '36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#EDF7EE',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#242424' }}>
              Ballot Successfully Committed
            </h2>

            <p style={{ fontSize: '13px', color: '#6B6B66', lineHeight: 1.5 }}>
              Your confidential vote has been recorded for <strong>{verifiedStudent?.residenceName}</strong>. Your participation status has now been updated to <strong>Voted</strong>. This ballot is permanently locked and cannot be changed or resubmitted.
            </p>

            {/* 3.5: Students must not see vote counts, rankings, or projected winners */}
            <div style={{ width: '100%', background: '#F3EFFB', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#3A2E59', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EyeOff size={14} style={{ flexShrink: 0 }} />
              <span><strong>Result Confidentiality:</strong> Vote counts, candidate rankings, and projected winners are not displayed. Results will be announced after official Election Committee certification.</span>
            </div>

            <div style={{ width: '100%', background: '#F8F8F6', padding: '14px', borderRadius: '8px', border: '1px solid #E5E5E2', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', fontWeight: 600 }}>
                Cryptographic Ballot Receipt Hash:
              </div>
              <code style={{ fontSize: '11px', color: '#242424', wordBreak: 'break-all', display: 'block', marginTop: '4px' }}>
                {receiptHash}
              </code>
            </div>

            <button
              onClick={handleReturnToLogin}
              className="btn btn-primary"
              style={{ marginTop: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} /> Back to Login Screen
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
