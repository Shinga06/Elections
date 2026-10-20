import { CandidateNomination, SeconderRecord, RegisteredStudent, Election } from '../types/election';

/**
 * Validates whether a student can submit a nomination for a given portfolio in an election.
 * Rule 4.1: Each student may nominate themselves for only one portfolio per election.
 * Rule 4.2: Required portfolio, student details, and ID-size photograph.
 */
export function validateNominationSubmission(
  studentNumber: string,
  electionId: string,
  portfolio: string,
  photoUrl: string,
  statement: string,
  existingNominations: CandidateNomination[]
): { isValid: boolean; error?: string } {
  if (!studentNumber || !studentNumber.trim()) {
    return { isValid: false, error: 'Student number is required.' };
  }
  if (!portfolio || !portfolio.trim()) {
    return { isValid: false, error: 'A valid portfolio selection is required.' };
  }
  if (!photoUrl || !photoUrl.trim()) {
    return { isValid: false, error: 'An ID-size photograph is required for candidate nomination.' };
  }
  if (!statement || !statement.trim()) {
    return { isValid: false, error: 'Candidate manifesto statement is required.' };
  }

  // Rule 4.1: Each student may nominate themselves for only one portfolio per election.
  // Check if student already has a non-withdrawn nomination in this election
  const activeNomination = existingNominations.find(
    n => n.electionId === electionId && 
         n.studentNumber === studentNumber.trim() && 
         n.status !== 'Withdrawn'
  );

  if (activeNomination) {
    return {
      isValid: false,
      error: `Rule 4.1 Violation: Student ${studentNumber} has already submitted a nomination for "${activeNomination.portfolio}" in this election. Only one nomination per student per election is permitted.`
    };
  }

  return { isValid: true };
}

/**
 * Validates a seconder request for a nomination.
 * Rule 4.3: Unique link identifies nomination, but seconder must authenticate & pass eligibility.
 * Rule 4.4: Count valid seconders, must be in the same residence as the candidate.
 * Rule 4.5: A student may second only one candidate per portfolio in an election.
 *           (Can second across different portfolios, but not multiple candidates for the same portfolio).
 */
export function validateSeconderSubmission(
  nominationId: string,
  seconderStudent: RegisteredStudent,
  allNominations: CandidateNomination[]
): { isValid: boolean; error?: string } {
  const targetNomination = allNominations.find(n => n.id === nominationId);
  if (!targetNomination) {
    return { isValid: false, error: 'Nomination record not found.' };
  }

  // Check nomination status
  if (targetNomination.status === 'Withdrawn' || targetNomination.status === 'Disqualified' || targetNomination.status === 'Ineligible') {
    return { isValid: false, error: `Cannot second a nomination that is ${targetNomination.status}.` };
  }

  // Rule 4.3 / 4.4: Seconder must be an eligible student
  if (!seconderStudent.isEligible) {
    return { isValid: false, error: `Ineligible student: ${seconderStudent.ineligibilityReason || 'Failed eligibility verification'}.` };
  }

  // Candidate cannot second themselves
  if (seconderStudent.studentNumber === targetNomination.studentNumber) {
    return { isValid: false, error: 'A candidate cannot second their own nomination.' };
  }

  // Rule 4.4: Ensure the seconder belongs to the same residence as the candidate
  if (seconderStudent.residenceId !== targetNomination.residenceId) {
    return { 
      isValid: false, 
      error: `Rule 4.4 Violation: Cross-residence seconding prohibited. Candidate is registered at ${targetNomination.residenceName}, but seconder belongs to ${seconderStudent.residenceName}.`
    };
  }

  // Rule 4.5: One seconder per candidate portfolio in an election.
  // Check if this seconder has already seconded ANY candidate for this same portfolio in this election
  const alreadySecondedForPortfolio = allNominations.some(nom => {
    if (nom.electionId !== targetNomination.electionId) return false;
    if (nom.portfolio !== targetNomination.portfolio) return false;
    return nom.seconders.some(sec => sec.studentNumber === seconderStudent.studentNumber);
  });

  if (alreadySecondedForPortfolio) {
    return {
      isValid: false,
      error: `Rule 4.5 Violation: Student ${seconderStudent.studentNumber} has already seconded a candidate for the "${targetNomination.portfolio}" portfolio in this election. A student may second only one candidate per portfolio.`
    };
  }

  return { isValid: true };
}

/**
 * Rule 4.6: Automatic ineligibility at nomination close.
 * When nominations close:
 * - Nominations with fewer than 22 valid seconders are automatically set to 'Ineligible'.
 * - Nominations with at least 22 valid seconders move to 'Seconders Met' (NOT automatically approved).
 * Idempotent: running more than once does not corrupt statuses.
 */
export function evaluateNominationsAtDeadline(
  nominations: CandidateNomination[],
  timestamp: string = new Date().toISOString().replace('T', ' ').slice(0, 19)
): { updatedNominations: CandidateNomination[]; newlyIneligibleCount: number; secondersMetCount: number } {
  let newlyIneligibleCount = 0;
  let secondersMetCount = 0;

  const updatedNominations = nominations.map(nom => {
    // Only evaluate nominations that are in active collection and not already settled
    if (nom.status === 'Collecting Seconders' || nom.status === 'Pending Review') {
      if (nom.secondersCount < nom.requiredSeconders) { // Less than 22
        newlyIneligibleCount++;
        return {
          ...nom,
          status: 'Ineligible' as const,
          reviewReason: `Rule 4.6: Automatically marked Ineligible at nomination close (Accumulated ${nom.secondersCount}/${nom.requiredSeconders} valid seconders).`,
          reviewedAt: timestamp,
          reviewedBy: 'Automated Electoral Deadline Service',
        };
      } else {
        // Reached >= 22 seconders -> Moves to 'Seconders Met' awaiting committee review
        secondersMetCount++;
        return {
          ...nom,
          status: 'Seconders Met' as const,
        };
      }
    }
    return nom;
  });

  return { updatedNominations, newlyIneligibleCount, secondersMetCount };
}

/**
 * Rule 4.8 & 4.9: Candidate withdrawal handler.
 * - Before nomination deadline: Self-service confirmed withdrawal -> marks 'Withdrawn', removed from active list.
 * - After nomination deadline: Requests committee-controlled procedure -> records withdrawal request.
 */
export function processCandidateWithdrawal(
  nomination: CandidateNomination,
  election: Election,
  reason: string,
  currentTime: string = new Date().toISOString().replace('T', ' ').slice(0, 19)
): { success: boolean; requiresCommitteeReview: boolean; updatedNomination: CandidateNomination; message: string } {
  const isBeforeDeadline = currentTime <= election.nominationEnd;

  if (isBeforeDeadline) {
    // Rule 4.8: Immediate self-service withdrawal before nominations close
    const updatedNomination: CandidateNomination = {
      ...nomination,
      status: 'Withdrawn',
      withdrawnAt: currentTime,
      withdrawalReason: reason,
    };
    return {
      success: true,
      requiresCommitteeReview: false,
      updatedNomination,
      message: `Nomination successfully withdrawn. Candidate removed from active election list.`
    };
  } else {
    // Rule 4.9: After nomination deadline, normal student self-service cannot bypass deadline.
    // Record withdrawal request for Election Committee adjudication
    const updatedNomination: CandidateNomination = {
      ...nomination,
      withdrawalPostDeadlineRequest: {
        requestedAt: currentTime,
        reason,
        status: 'Pending Committee Review',
      }
    };
    return {
      success: true,
      requiresCommitteeReview: true,
      updatedNomination,
      message: `Rule 4.9 Notice: The nomination deadline has passed (${election.nominationEnd}). Your withdrawal request has been submitted to the Election Committee for formal review. The ballot remains unchanged until committee resolution.`
    };
  }
}
