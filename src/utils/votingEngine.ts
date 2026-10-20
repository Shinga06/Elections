/**
 * Voting Engine — Core Rules for Sections 3.3, 3.4, and 3.5
 *
 * 3.3 Voting: Period enforcement, residence-scoped ballots, draft save/resume,
 *     review/lock, duplicate prevention, network-safe idempotency, post-close rejection.
 * 3.4 Winner Determination: Highest vote wins per portfolio, separate tallies by
 *     residence and portfolio, tie flagging (never auto-select), committee decision recording.
 * 3.5 Result Confidentiality: No live counts for students, background calculation,
 *     authorized access only, manual publication with audit trail.
 */

import {
  Election,
  RegisteredStudent,
  CandidateNomination,
  AnonymousBallotRecord,
  PortfolioResult,
  TallyCandidateResult,
  AuditLogEntry,
} from '../types/election';

// ─── 3.3 Voting Period Enforcement ────────────────────────────────────────

export interface VotingPeriodCheck {
  isOpen: boolean;
  reason: string;
  minutesRemaining?: number;
}

/**
 * Check whether the voting period is currently open for a given election.
 */
export function checkVotingPeriod(election: Election, nowIso?: string): VotingPeriodCheck {
  const now = nowIso ? new Date(nowIso) : new Date();
  const start = new Date(election.votingStart.replace(' ', 'T'));
  const end = new Date(election.votingEnd.replace(' ', 'T'));

  if (election.status !== 'Voting Open') {
    return {
      isOpen: false,
      reason: `Election status is "${election.status}". Voting is not currently available.`,
    };
  }

  if (now < start) {
    return {
      isOpen: false,
      reason: `Voting has not yet opened. The voting window begins on ${election.votingStart}.`,
    };
  }

  if (now > end) {
    return {
      isOpen: false,
      reason: `The voting period closed on ${election.votingEnd}. No ballot may be finally submitted after voting closes.`,
    };
  }

  const minutesRemaining = Math.floor((end.getTime() - now.getTime()) / 60000);
  return {
    isOpen: true,
    reason: `Voting is open. ${minutesRemaining} minutes remaining until ${election.votingEnd}.`,
    minutesRemaining,
  };
}

// ─── 3.3 Ballot Validation (Pre-Submission Checks) ───────────────────────

export interface BallotValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a ballot before final submission.
 * Enforces: voter on register, eligibility, residence match, duplicate detection,
 * voting period open, all portfolios addressed (candidate or ABSTAIN).
 */
export function validateBallotSubmission(
  studentNumber: string,
  electionId: string,
  residenceId: string,
  selections: Record<string, string>,
  students: RegisteredStudent[],
  elections: Election[],
  existingBallots: AnonymousBallotRecord[],
  approvedCandidates: CandidateNomination[],
  nowIso?: string
): BallotValidationResult {
  const errors: string[] = [];

  // 1. Student must exist on approved register
  const voter = students.find(s => s.studentNumber === studentNumber);
  if (!voter) {
    return { valid: false, errors: [`Student "${studentNumber}" not found on approved voter register.`] };
  }

  // 2. Eligibility
  if (!voter.isEligible) {
    return { valid: false, errors: [`Student "${studentNumber}" is marked ineligible: ${voter.ineligibilityReason || 'Policy exclusion'}.`] };
  }

  // 3. Duplicate detection — already voted
  if (voter.votingStatus === 'Voted') {
    return {
      valid: false,
      errors: [`Duplicate submission rejected: Student "${studentNumber}" has already cast a final ballot (submitted ${voter.submittedAt || 'previously'}). One vote per student enforced.`],
    };
  }

  // 4. Residence match — each voter accesses only their registered residence election
  if (voter.residenceId !== residenceId) {
    return {
      valid: false,
      errors: [`Cross-residence submission prohibited. Student is registered at residence "${voter.residenceId}", not "${residenceId}".`],
    };
  }

  // 5. Election exists and is for the correct residence
  const election = elections.find(e => e.id === electionId);
  if (!election) {
    return { valid: false, errors: [`Election "${electionId}" does not exist.`] };
  }
  if (election.residenceId !== residenceId) {
    return { valid: false, errors: [`Election "${electionId}" is for residence "${election.residenceId}", not "${residenceId}".`] };
  }

  // 6. Voting period check
  const periodCheck = checkVotingPeriod(election, nowIso);
  if (!periodCheck.isOpen) {
    return { valid: false, errors: [periodCheck.reason] };
  }

  // 7. Network-safe idempotency — check if a ballot already exists for this election+voter
  // We use a submission token pattern: check if voter is already marked as Voted
  // (already handled in step 3, but double-check anonymous ballot records for the residence)
  // Note: We CANNOT match by student number in anonymous ballots (ballot secrecy!).
  // Duplicate prevention relies on the voter.votingStatus flag.

  // 8. Validate selections — ballots should reference only approved candidates for the correct residence+portfolio
  const electionPortfolios = election.portfolios;
  for (const portfolio of electionPortfolios) {
    const candidateId = selections[portfolio];
    if (!candidateId) {
      // Not yet selected — will be treated as ABSTAIN if confirmed
      continue;
    }
    if (candidateId === 'ABSTAIN') {
      continue;
    }
    // Must be an approved candidate for this portfolio and residence
    const validCandidate = approvedCandidates.find(
      c => c.id === candidateId && c.portfolio === portfolio && c.residenceId === residenceId && c.status === 'Approved'
    );
    if (!validCandidate) {
      errors.push(`Invalid candidate selection for "${portfolio}": Candidate "${candidateId}" is not an approved candidate for this portfolio in residence "${residenceId}".`);
    }
  }

  // 9. Check for selections referencing portfolios not part of this election
  for (const portfolio of Object.keys(selections)) {
    if (!electionPortfolios.includes(portfolio)) {
      errors.push(`Portfolio "${portfolio}" is not part of election "${electionId}".`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── 3.3 Draft Ballot Management ─────────────────────────────────────────

export interface DraftBallot {
  id: string;
  studentNumber: string;
  electionId: string;
  residenceId: string;
  selections: Record<string, string>;
  savedAt: string;
  isComplete: boolean; // true if all portfolios have selections
}

/**
 * Save or update a draft ballot session. Drafts are NOT official votes and do
 * NOT count toward turnout. Validates that the voting period is still open.
 */
export function saveDraftBallot(
  studentNumber: string,
  electionId: string,
  residenceId: string,
  selections: Record<string, string>,
  elections: Election[],
  students: RegisteredStudent[],
  nowIso?: string
): { success: boolean; error?: string; draft?: DraftBallot } {
  const voter = students.find(s => s.studentNumber === studentNumber);
  if (!voter) {
    return { success: false, error: 'Student not on register.' };
  }

  if (voter.votingStatus === 'Voted') {
    return { success: false, error: 'Cannot save draft: ballot already finally submitted.' };
  }

  const election = elections.find(e => e.id === electionId);
  if (!election) {
    return { success: false, error: 'Election not found.' };
  }

  const periodCheck = checkVotingPeriod(election, nowIso);
  if (!periodCheck.isOpen) {
    return { success: false, error: `Cannot save draft: ${periodCheck.reason}` };
  }

  const isComplete = election.portfolios.every(p => !!selections[p]);

  const draft: DraftBallot = {
    id: `draft-${studentNumber}-${Date.now()}`,
    studentNumber,
    electionId,
    residenceId,
    selections: { ...selections },
    savedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    isComplete,
  };

  return { success: true, draft };
}

// ─── 3.3 Network-Safe Final Submission ────────────────────────────────────

export interface SubmissionResult {
  success: boolean;
  error?: string;
  receiptHash?: string;
  isDuplicate?: boolean;
}

/**
 * Checks submission status before retrying (network-safe).
 * Returns true if the student has already voted (meaning the prior attempt succeeded).
 */
export function checkSubmissionStatus(
  studentNumber: string,
  students: RegisteredStudent[]
): { alreadySubmitted: boolean; submittedAt?: string } {
  const voter = students.find(s => s.studentNumber === studentNumber);
  if (!voter) {
    return { alreadySubmitted: false };
  }
  if (voter.votingStatus === 'Voted') {
    return { alreadySubmitted: true, submittedAt: voter.submittedAt };
  }
  return { alreadySubmitted: false };
}

// ─── 3.4 Winner Determination & Tie Detection ────────────────────────────

/**
 * Calculate results for a single election from anonymous ballot records.
 * Results are calculated separately by residence and portfolio.
 * Ties are flagged for Election Committee decision — system NEVER auto-selects a winner.
 */
export function calculateElectionResults(
  electionId: string,
  residenceId: string,
  portfolios: string[],
  anonymousBallots: AnonymousBallotRecord[],
  approvedCandidates: CandidateNomination[]
): PortfolioResult[] {
  // Filter ballots for this specific election and residence
  const relevantBallots = anonymousBallots.filter(
    b => b.electionId === electionId && b.residenceId === residenceId
  );

  return portfolios.map(portfolio => {
    // Get approved candidates for this portfolio and residence
    const portfolioCandidates = approvedCandidates.filter(
      c => c.portfolio === portfolio && c.residenceId === residenceId && c.status === 'Approved'
    );

    // Count votes per candidate
    const voteCounts: Record<string, number> = {};
    let abstentionCount = 0;

    portfolioCandidates.forEach(c => {
      voteCounts[c.id] = 0;
    });

    relevantBallots.forEach(ballot => {
      const selection = ballot.selections[portfolio];
      if (!selection || selection === 'ABSTAIN') {
        abstentionCount++;
      } else if (voteCounts[selection] !== undefined) {
        voteCounts[selection]++;
      }
    });

    // Build candidate results
    const totalVotesCast = relevantBallots.length;
    const candidateResults: TallyCandidateResult[] = portfolioCandidates.map(c => ({
      candidateId: c.id,
      candidateName: c.fullName,
      photoUrl: c.photoUrl,
      portfolio,
      votes: voteCounts[c.id] || 0,
      percentage: totalVotesCast > 0 ? parseFloat(((voteCounts[c.id] / totalVotesCast) * 100).toFixed(1)) : 0,
    }));

    // Sort by vote count descending
    candidateResults.sort((a, b) => b.votes - a.votes);

    // Determine winner and detect ties
    let hasTie = false;
    if (candidateResults.length >= 2) {
      const topVoteCount = candidateResults[0].votes;
      if (topVoteCount > 0) {
        const tiedCandidates = candidateResults.filter(c => c.votes === topVoteCount);
        if (tiedCandidates.length > 1) {
          // TIE DETECTED — flag for committee, system must NOT automatically select a winner
          hasTie = true;
          tiedCandidates.forEach(c => { c.isTied = true; });
        } else {
          // Clear winner
          candidateResults[0].isWinner = true;
        }
      }
    } else if (candidateResults.length === 1 && candidateResults[0].votes > 0) {
      candidateResults[0].isWinner = true;
    }

    return {
      portfolio,
      totalVotesCast,
      abstentions: abstentionCount,
      candidates: candidateResults,
      hasTie,
    };
  });
}

// ─── 3.4 Tie Resolution Recording ────────────────────────────────────────

export interface TieResolutionInput {
  portfolio: string;
  decidedWinnerId: string;
  decidedBy: string;
  reason: string;
}

/**
 * Validate a tie resolution decision. The system must not automatically select a winner.
 * The committee decision, reason, authorized decision-maker and timestamp must be recorded.
 */
export function validateTieResolution(
  input: TieResolutionInput,
  results: PortfolioResult[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const portfolioResult = results.find(r => r.portfolio === input.portfolio);
  if (!portfolioResult) {
    errors.push(`Portfolio "${input.portfolio}" not found in results.`);
    return { valid: false, errors };
  }

  if (!portfolioResult.hasTie) {
    errors.push(`Portfolio "${input.portfolio}" does not have a tie. Tie resolution not applicable.`);
    return { valid: false, errors };
  }

  if (portfolioResult.tieResolutionDecision) {
    errors.push(`Tie for "${input.portfolio}" has already been resolved by ${portfolioResult.tieResolutionDecision.decidedBy}.`);
    return { valid: false, errors };
  }

  if (!input.decidedBy || !input.decidedBy.trim()) {
    errors.push('Authorized decision-maker identity is required for audit record.');
  }

  if (!input.reason || !input.reason.trim()) {
    errors.push('Committee decision reason is required for permanent audit record.');
  }

  // Verify the chosen winner is actually one of the tied candidates
  const tiedCandidates = portfolioResult.candidates.filter(c => c.isTied);
  const chosenCandidate = tiedCandidates.find(c => c.candidateId === input.decidedWinnerId);
  if (!chosenCandidate) {
    errors.push(`Candidate "${input.decidedWinnerId}" is not among the tied candidates for "${input.portfolio}".`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── 3.5 Result Confidentiality & Publication ─────────────────────────────

export type ResultVisibility = 'hidden' | 'verified' | 'certified' | 'published';

export interface ResultAccessCheck {
  canView: boolean;
  visibility: ResultVisibility;
  reason: string;
}

/**
 * Check whether results can be viewed based on election status and user role.
 * Students must NEVER see live vote counts, rankings, projected winners, or preliminary results.
 * Results remain hidden until officially published by the Election Committee.
 */
export function checkResultAccess(
  election: Election,
  userRole: 'student' | 'admin' | 'election_officer' | 'system_admin'
): ResultAccessCheck {
  // Students can never see results until published
  if (userRole === 'student') {
    if (election.status === 'Published') {
      return {
        canView: true,
        visibility: 'published',
        reason: 'Results have been officially published by the Election Committee.',
      };
    }
    return {
      canView: false,
      visibility: 'hidden',
      reason: 'Results are confidential. Only the Election Committee can view and publish results.',
    };
  }

  // Admin roles
  switch (election.status) {
    case 'Voting Open':
      return {
        canView: false,
        visibility: 'hidden',
        reason: 'Voting is still in progress. No vote counts, candidate rankings, or projected winners may be viewed.',
      };
    case 'Voting Closed':
    case 'Awaiting Verification':
      return {
        canView: true,
        visibility: 'verified',
        reason: 'Voting closed. Results available for authorized verification only.',
      };
    case 'Awaiting Certification':
      return {
        canView: true,
        visibility: 'certified',
        reason: 'Results verified. Awaiting official certification by authorized officials.',
      };
    case 'Published':
      return {
        canView: true,
        visibility: 'published',
        reason: 'Results officially published.',
      };
    default:
      return {
        canView: false,
        visibility: 'hidden',
        reason: `Election status "${election.status}" does not permit result viewing.`,
      };
  }
}

/**
 * Generate audit trail entries for result lifecycle actions.
 * Records: calculation, verification, certification, and publication events.
 */
export function createResultAuditEntry(
  action: 'calculated' | 'verified' | 'certified' | 'published',
  electionName: string,
  actorName: string,
  details: string
): AuditLogEntry {
  const actionLabels: Record<string, string> = {
    'calculated': 'Results Calculated (Background)',
    'verified': 'Results Verified by Authorized Official',
    'certified': 'Election Results Officially Certified',
    'published': 'Results Published to Student Portal',
  };

  const severityMap: Record<string, 'info' | 'warning' | 'security' | 'critical'> = {
    'calculated': 'info',
    'verified': 'info',
    'certified': 'security',
    'published': 'critical',
  };

  return {
    id: `audit-result-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorName,
    actorRole: action === 'calculated' ? 'Automated Tally Service' : 'Authorized Electoral Official',
    action: actionLabels[action],
    details,
    ipAddress: action === 'calculated' ? '127.0.0.1' : '192.168.1.10',
    severity: severityMap[action],
  };
}

/**
 * Transition election through the result lifecycle stages.
 * Closing voting does NOT automatically publish results.
 */
export function transitionElectionToResultPhase(
  election: Election,
  targetStatus: 'Voting Closed' | 'Awaiting Verification' | 'Awaiting Certification' | 'Published'
): { success: boolean; error?: string; updatedElection?: Election } {
  const validTransitions: Record<string, string[]> = {
    'Voting Open': ['Voting Closed'],
    'Voting Closed': ['Awaiting Verification'],
    'Awaiting Verification': ['Awaiting Certification'],
    'Awaiting Certification': ['Published'],
  };

  const allowed = validTransitions[election.status] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      success: false,
      error: `Cannot transition from "${election.status}" to "${targetStatus}". Valid transitions: ${allowed.join(', ') || 'none'}.`,
    };
  }

  const updatedElection: Election = { ...election, status: targetStatus };

  if (targetStatus === 'Published') {
    updatedElection.publishedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  return { success: true, updatedElection };
}
