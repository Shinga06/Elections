export type UserRole = 'student' | 'admin' | 'election_officer' | 'system_admin';

export interface User {
  id: string;
  studentNumber?: string;
  name: string;
  email: string;
  residenceId?: string;
  role: UserRole;
  avatarUrl?: string;
}

export type ElectionStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Nominations Open'
  | 'Under Review'
  | 'Voting Open'
  | 'Voting Closed'
  | 'Awaiting Verification'
  | 'Awaiting Certification'
  | 'Published'
  | 'Cancelled';

export interface PortfolioRule {
  id: string;
  title: string;
  description: string;
  requiredCapacityRule: 'above_100' | 'below_100' | 'unresolved_flagged';
}

export interface Residence {
  id: string;
  name: string;
  code: string; // e.g. "RES_A", "RES_B"
  campus: string;
  officialCapacity: number;
  currentOccupancy?: number;
  registeredVoterCount: number;
  electionStatus: ElectionStatus;
  portfolioStructure: string[];
  capacityRuleResolved: boolean;
  isCustomName?: boolean;
}

export type VotingParticipationStatus = 'Not Voted' | 'Draft Saved' | 'Voted' | 'Ineligible';

export interface RegisteredStudent {
  id: string;
  studentNumber: string; // Stored as string to preserve leading zeros!
  name: string;
  surname: string;
  fullName: string;
  email: string;
  residenceId: string;
  residenceName: string;
  isEligible: boolean;
  votingStatus: VotingParticipationStatus;
  submittedAt?: string;
  isDemoData: boolean;
  ineligibilityReason?: string;
}

export interface Election {
  id: string;
  name: string;
  residenceId: string;
  residenceName: string;
  status: ElectionStatus;
  nominationStart: string;
  nominationEnd: string;
  votingStart: string;
  votingEnd: string;
  eligibleVoterCount: number;
  approvedCandidateCount: number;
  totalBallotsCast: number;
  draftBallotCount: number;
  turnoutPercentage: number;
  portfolios: string[];
  capacity: number;
  tieFlagged?: boolean;
  certifiedAt?: string;
  certifiedBy?: string;
  publishedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  resultsCalculatedAt?: string;
  resultsVisibility?: 'hidden' | 'verified' | 'certified' | 'published';
}

export interface DraftBallotRecord {
  id: string;
  studentNumber: string;
  electionId: string;
  residenceId: string;
  selections: Record<string, string>;
  savedAt: string;
  isComplete: boolean;
}

export type NominationStatus =
  | 'Pending Review'
  | 'Collecting Seconders'
  | 'Seconders Met'
  | 'Approved'
  | 'Disqualified'
  | 'Ineligible'
  | 'Withdrawn';

export interface SeconderRecord {
  id: string;
  studentNumber: string;
  studentName: string;
  residenceId: string;
  portfolio: string;
  submittedAt: string;
  verifiedEligible: boolean;
}

export interface CandidateNomination {
  id: string;
  electionId: string;
  electionName: string;
  residenceId: string;
  residenceName: string;
  studentNumber: string;
  fullName: string;
  email: string;
  portfolio: string;
  photoUrl: string;
  statement: string;
  academicGoodStanding: boolean;
  disciplinaryClearance: boolean;
  status: NominationStatus;
  submittedAt: string;
  secondersCount: number;
  requiredSeconders: number;
  seconders: SeconderRecord[];
  reviewReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  uniqueSeconderLink: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  withdrawalPostDeadlineRequest?: {
    requestedAt: string;
    reason: string;
    status: 'Pending Committee Review' | 'Approved by Committee' | 'Rejected by Committee';
    reviewedAt?: string;
    reviewedBy?: string;
    committeeNotes?: string;
  };
}

export interface AnonymousBallotRecord {
  ballotId: string;
  electionId: string;
  residenceId: string;
  timestamp: string;
  receiptHash: string;
  selections: Record<string, string>; // portfolio -> candidateId (or 'ABSTAIN')
  // CRITICAL: voter identity is completely decoupled from this record!
}

export interface TallyCandidateResult {
  candidateId: string;
  candidateName: string;
  photoUrl: string;
  portfolio: string;
  votes: number;
  percentage: number;
  isWinner?: boolean;
  isTied?: boolean;
}

export interface PortfolioResult {
  portfolio: string;
  totalVotesCast: number;
  abstentions: number;
  candidates: TallyCandidateResult[];
  hasTie: boolean;
  tieResolutionDecision?: {
    decidedWinnerId: string;
    decidedBy: string;
    reason: string;
    timestamp: string;
  };
}

export interface VoterRegisterImportRow {
  rowNumber: number;
  name: string;
  surname: string;
  studentNumber: string;
  residence: string;
  isValid: boolean;
  errors: string[];
}

export interface VoterRegisterBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  residenceId: string;
  residenceName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  approvedBy?: string;
  approvedAt?: string;
  rows: VoterRegisterImportRow[];
}

export interface SupportIncident {
  id: string;
  category: 'Login/OTP' | 'Nomination' | 'Seconding' | 'Voting' | 'Eligibility' | 'Other';
  description: string;
  studentIdentifier: string;
  contactMethod?: 'University Email' | 'Phone' | 'Walk-in (Durban Campus)' | 'Walk-in (Midlands Campus)';
  campus?: 'Durban' | 'Midlands';
  residenceName: string;
  createdAt: string;
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved';
  assignedTo?: string;
  escalationLevel?: 'Standard' | 'Urgent' | 'Escalated to Election Committee';
  escalationReason?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolutionTimeMinutes?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'security' | 'critical';
  hash?: string;
  prevHash?: string;
}
