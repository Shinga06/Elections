import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ElectionsList } from './components/elections/ElectionsList';
import { CreateElectionWizard } from './components/elections/CreateElectionWizard';
import { ResidencesView } from './components/residences/ResidencesView';
import { VoterRegistersView } from './components/voters/VoterRegistersView';
import { VoterParticipationView } from './components/voters/VoterParticipationView';
import { NominationsView } from './components/nominations/NominationsView';
import { VotingManagementView } from './components/voting/VotingManagementView';
import { ResultsCertificationView } from './components/results/ResultsCertificationView';
import { StudentVotingExperience } from './components/student/StudentVotingExperience';
import { ReportsView } from './components/reports/ReportsView';
import { CalendarView } from './components/calendar/CalendarView';
import { SupportView } from './components/support/SupportView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { SettingsView } from './components/settings/SettingsView';

import { 
  INITIAL_RESIDENCES, 
  INITIAL_REGISTERED_STUDENTS,
  INITIAL_ELECTIONS, 
  INITIAL_NOMINATIONS, 
  INITIAL_VOTER_BATCHES, 
  INITIAL_PORTFOLIO_RESULTS,
  INITIAL_SUPPORT_INCIDENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ANONYMOUS_BALLOTS
} from './data/mockData';
import { 
  UserRole, 
  Election, 
  Residence,
  CandidateNomination, 
  VoterRegisterBatch, 
  PortfolioResult, 
  RegisteredStudent,
  AnonymousBallotRecord 
} from './types/election';
import { evaluateNominationsAtDeadline } from './utils/nominationRules';

export const App: React.FC = () => {
  // Navigation & Role State
  const [currentPage, setCurrentPage] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Primary Domain State
  const [residences, setResidences] = useState(INITIAL_RESIDENCES);
  const [students, setStudents] = useState<RegisteredStudent[]>(INITIAL_REGISTERED_STUDENTS);
  const [elections, setElections] = useState<Election[]>(INITIAL_ELECTIONS);
  const [nominations, setNominations] = useState<CandidateNomination[]>(INITIAL_NOMINATIONS);
  const [voterBatches, setVoterBatches] = useState<VoterRegisterBatch[]>(INITIAL_VOTER_BATCHES);
  const [resultsData, setResultsData] = useState<PortfolioResult[]>(INITIAL_PORTFOLIO_RESULTS);
  const [anonymousBallots, setAnonymousBallots] = useState<AnonymousBallotRecord[]>(INITIAL_ANONYMOUS_BALLOTS);
  const [incidents, setIncidents] = useState(INITIAL_SUPPORT_INCIDENTS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Selected Scope
  const [selectedElectionId, setSelectedElectionId] = useState<string>(elections[0]?.id || 'elec-res-a');

  // Residence Rename Handler
  const handleRenameResidence = (id: string, newName: string, newCampus: string) => {
    setResidences(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          name: newName,
          campus: newCampus || r.campus,
          isCustomName: true,
        };
      }
      return r;
    }));

    // Cascade name to elections, students, and batches
    setElections(prev => prev.map(e => {
      if (e.residenceId === id) {
        return { ...e, residenceName: newName, name: `${newName} House Committee Election 2026/27` };
      }
      return e;
    }));

    setStudents(prev => prev.map(s => {
      if (s.residenceId === id) {
        return { ...s, residenceName: newName };
      }
      return s;
    }));

    setVoterBatches(prev => prev.map(b => {
      if (b.residenceId === id) {
        return { ...b, residenceName: newName };
      }
      return b;
    }));

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: 'Dr. E. Vance',
        actorRole: 'Chief Electoral Officer',
        action: 'Residence Renamed',
        details: `Updated residence ${id} to official DUT title: "${newName}" (${newCampus}).`,
        ipAddress: '192.168.1.10',
        severity: 'info',
      },
      ...prev,
    ]);
  };

  // Register Batch Import / Replacement Handler
  const handleApproveVoterBatch = (batch: VoterRegisterBatch, newStudents: RegisteredStudent[], replaceExisting: boolean) => {
    setVoterBatches(prev => [batch, ...prev]);

    if (replaceExisting) {
      // Replace all students in this residence with new batch
      setStudents(prev => [
        ...prev.filter(s => s.residenceId !== batch.residenceId),
        ...newStudents
      ]);

      setAuditLogs(prev => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          actorName: 'Dr. E. Vance',
          actorRole: 'Chief Electoral Officer',
          action: 'Register Replaced',
          details: `Replaced voter register for ${batch.residenceName} with file ${batch.fileName}. ${newStudents.length} students enrolled.`,
          ipAddress: '192.168.1.10',
          severity: 'warning',
        },
        ...prev,
      ]);
    } else {
      // Append new students avoiding duplicates
      setStudents(prev => {
        const existingNumbers = new Set(prev.map(s => s.studentNumber));
        const filteredNew = newStudents.filter(ns => !existingNumbers.has(ns.studentNumber));
        return [...prev, ...filteredNew];
      });

      setAuditLogs(prev => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          actorName: 'Dr. E. Vance',
          actorRole: 'Chief Electoral Officer',
          action: 'Register Appended',
          details: `Appended ${newStudents.length} student records to ${batch.residenceName} register from ${batch.fileName}.`,
          ipAddress: '192.168.1.10',
          severity: 'info',
        },
        ...prev,
      ]);
    }

    // Recalculate residence registered count
    setResidences(prev => prev.map(r => {
      if (r.id === batch.residenceId) {
        return {
          ...r,
          registeredVoterCount: replaceExisting 
            ? newStudents.length 
            : r.registeredVoterCount + newStudents.length,
        };
      }
      return r;
    }));
  };

  const handleRejectVoterBatch = (batchId: string) => {
    setVoterBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: 'Rejected' } : b));
  };

  const handleAddManualStudent = (newStudent: RegisteredStudent) => {
    setStudents(prev => [newStudent, ...prev]);
    setResidences(prev => prev.map(r => {
      if (r.id === newStudent.residenceId) {
        return { ...r, registeredVoterCount: r.registeredVoterCount + 1 };
      }
      return r;
    }));

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: 'Dr. E. Vance',
        actorRole: 'Chief Electoral Officer',
        action: 'Manual Student Enrollment',
        details: `Manually added ${newStudent.fullName} (#${newStudent.studentNumber}) to ${newStudent.residenceName} register.`,
        ipAddress: '192.168.1.10',
        severity: 'info',
      },
      ...prev,
    ]);
  };

  const handleResetToDemoData = () => {
    if (confirm('Reset registers for Residence A and Residence B to initial DEMO DATA?')) {
      setStudents(INITIAL_REGISTERED_STUDENTS);
      setAnonymousBallots(INITIAL_ANONYMOUS_BALLOTS);
      alert('Registers reset to fictional seed demo records.');
    }
  };

  const handleClearRegister = (residenceId: string) => {
    setStudents(prev => prev.filter(s => s.residenceId !== residenceId));
    setResidences(prev => prev.map(r => r.id === residenceId ? { ...r, registeredVoterCount: 0 } : r));

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: 'Dr. E. Vance',
        actorRole: 'Chief Electoral Officer',
        action: 'Register Cleared',
        details: `Completely purged student voter register records for residence ${residenceId}.`,
        ipAddress: '192.168.1.10',
        severity: 'critical',
      },
      ...prev,
    ]);
  };

  // Student Draft Session Saving
  const handleSaveDraftSession = (studentNumber: string, _selections: Record<string, string>) => {
    setStudents(prev => prev.map(s => {
      if (s.studentNumber === studentNumber && s.votingStatus !== 'Voted') {
        return { ...s, votingStatus: 'Draft Saved' };
      }
      return s;
    }));
  };

  // Student Final Ballot Commit (Strict Duplicate Prevention & Anonymity Enforced!)
  const handleSubmitFinalBallot = (
    studentNumber: string, 
    electionId: string, 
    residenceId: string, 
    selections: Record<string, string>
  ) => {
    // 1. Find voter record
    const voter = students.find(s => s.studentNumber === studentNumber);
    if (!voter) {
      return { success: false, error: 'Student number not on approved register.' };
    }

    if (!voter.isEligible) {
      return { success: false, error: 'Student marked as ineligible.' };
    }

    // 2. Strict duplicate check
    if (voter.votingStatus === 'Voted') {
      // Audit security log
      setAuditLogs(prev => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          actorName: 'Security Sentinel',
          actorRole: 'Ballot Gatekeeper',
          action: 'Duplicate Submission Blocked',
          details: `Rejected secondary ballot attempt for student #${studentNumber}. Status already marked Voted.`,
          ipAddress: '10.200.4.15',
          severity: 'security',
        },
        ...prev,
      ]);
      return { success: false, error: 'Duplicate submission rejected: Ballot already committed for this student.' };
    }

    // 3. Residence check
    if (voter.residenceId !== residenceId) {
      return { success: false, error: 'Cross-residence submission prohibited.' };
    }

    // 4. Generate decoupled receipt and store anonymous ballot
    const receiptHash = '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newAnonymousBallot: AnonymousBallotRecord = {
      ballotId: `sealed-bal-${Date.now()}`,
      electionId,
      residenceId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      receiptHash,
      selections, // DECOUPLED FROM VOTER IDENTITY
    };

    setAnonymousBallots(prev => [newAnonymousBallot, ...prev]);

    // 5. Update voter participation status to Voted (Locking future attempts)
    const commitTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setStudents(prev => prev.map(s => {
      if (s.studentNumber === studentNumber) {
        return {
          ...s,
          votingStatus: 'Voted',
          submittedAt: commitTime,
        };
      }
      return s;
    }));

    // 6. Recalculate election turnout
    setElections(prev => prev.map(e => {
      if (e.id === electionId) {
        const newCast = e.totalBallotsCast + 1;
        const turnout = e.eligibleVoterCount > 0 ? ((newCast / e.eligibleVoterCount) * 100) : 0;
        return {
          ...e,
          totalBallotsCast: newCast,
          draftBallotCount: Math.max(0, e.draftBallotCount - 1),
          turnoutPercentage: parseFloat(turnout.toFixed(1)),
        };
      }
      return e;
    }));

    // 7. Audit log of sealed transaction (Student choices NEVER logged!)
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: commitTime,
        actorName: 'Cryptographic Core',
        actorRole: 'Ballot Sealer',
        action: 'Ballot Submitted & Sealed',
        details: `Final ballot committed for ${voter.residenceName}. Receipt ${receiptHash}. Voter identity detached from ballot record.`,
        ipAddress: '127.0.0.1',
        severity: 'info',
      },
      ...prev,
    ]);

    return { success: true, receiptHash };
  };

  // Multi-Residence Election Creation with Synchronized Schedule (Rule 2)
  const handleCreateElectionSave = (newElec: Election, allParticipatingResidenceIds?: string[]) => {
    const targetIds = allParticipatingResidenceIds && allParticipatingResidenceIds.length > 0
      ? allParticipatingResidenceIds
      : [newElec.residenceId];

    // For all participating residences, create or synchronize election records with the EXACT same opening/closing timetable
    const createdElections: Election[] = targetIds.map(resId => {
      const res = residences.find(r => r.id === resId) || residences[0];
      return {
        ...newElec,
        id: `elec-${resId}-${Date.now()}`,
        name: `${res.name} House Committee Election 2026/27`,
        residenceId: res.id,
        residenceName: res.name,
        capacity: res.officialCapacity,
        portfolios: res.portfolioStructure,
        eligibleVoterCount: res.registeredVoterCount,
      };
    });

    setElections(prev => [...createdElections, ...prev]);
    setCurrentPage('elections');

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: 'Dr. E. Vance',
        actorRole: 'Chief Electoral Officer',
        action: 'Synchronized Election Schedule Configured',
        details: `Created synchronized election across ${targetIds.length} residences. Unified Schedule: Nominations [${newElec.nominationStart} to ${newElec.nominationEnd}], Voting [${newElec.votingStart} to ${newElec.votingEnd}].`,
        ipAddress: '192.168.1.10',
        severity: 'info',
      },
      ...prev,
    ]);
  };

  // Residence Capacity and Management (Rule 3)
  const handleUpdateResidence = (id: string, newName: string, newCampus: string, newCapacity: number) => {
    setResidences(prev => prev.map(r => {
      if (r.id === id) {
        const portfolios = newCapacity > 100 
          ? ['Chairperson', 'Project Officer', 'Secretary']
          : (newCapacity < 100 ? ['House Representative 1', 'House Representative 2'] : ['Awaiting Policy Determination (100 Cap)']);
        return {
          ...r,
          name: newName,
          campus: newCampus || r.campus,
          officialCapacity: newCapacity,
          portfolioStructure: portfolios,
          capacityRuleResolved: newCapacity !== 100,
          isCustomName: true,
        };
      }
      return r;
    }));

    // Cascade name and capacity to elections
    setElections(prev => prev.map(e => {
      if (e.residenceId === id) {
        return { ...e, residenceName: newName, capacity: newCapacity };
      }
      return e;
    }));

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: 'Dr. E. Vance',
        actorRole: 'Chief Electoral Officer',
        action: 'Residence Capacity & Portfolio Updated',
        details: `Updated residence ${id}: Name "${newName}", Official Capacity ${newCapacity}.`,
        ipAddress: '192.168.1.10',
        severity: 'info',
      },
      ...prev,
    ]);
  };

  const handleAddResidence = (newRes: Residence) => {
    setResidences(prev => [...prev, newRes]);
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: 'Dr. E. Vance',
        actorRole: 'Chief Electoral Officer',
        action: 'New Residence Enrolled',
        details: `Created residence record: "${newRes.name}" (${newRes.campus}), Capacity: ${newRes.officialCapacity}.`,
        ipAddress: '192.168.1.10',
        severity: 'info',
      },
      ...prev,
    ]);
  };

  // Candidate Nomination Handlers (Rule 4)
  const handleCreateNomination = (newNom: CandidateNomination) => {
    setNominations(prev => [newNom, ...prev]);
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: newNom.fullName,
        actorRole: 'Student Candidate',
        action: 'Nomination Submitted',
        details: `Submitted nomination for ${newNom.portfolio} in ${newNom.residenceName}. Unique seconder link active: ${newNom.uniqueSeconderLink}.`,
        ipAddress: '127.0.0.1',
        severity: 'info',
      },
      ...prev,
    ]);
  };

  const handleAddSeconder = (nominationId: string, seconder: RegisteredStudent) => {
    setNominations(prev => prev.map(nom => {
      if (nom.id === nominationId) {
        const newSecRecord = {
          id: `sec-${Date.now()}`,
          studentNumber: seconder.studentNumber,
          studentName: seconder.fullName,
          residenceId: seconder.residenceId,
          portfolio: nom.portfolio,
          submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          verifiedEligible: true,
        };
        const updatedSeconders = [...nom.seconders, newSecRecord];
        const newCount = updatedSeconders.length;
        // Check if reaching 22 transitions status to 'Seconders Met'
        const newStatus = (newCount >= nom.requiredSeconders && nom.status === 'Collecting Seconders')
          ? 'Seconders Met' as const
          : nom.status;

        return {
          ...nom,
          seconders: updatedSeconders,
          secondersCount: newCount,
          status: newStatus,
        };
      }
      return nom;
    }));

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: seconder.fullName,
        actorRole: 'Student Seconder',
        action: 'Valid Seconder Recorded',
        details: `Verified eligible student #${seconder.studentNumber} seconded nomination ${nominationId}.`,
        ipAddress: '127.0.0.1',
        severity: 'info',
      },
      ...prev,
    ]);
  };

  const handleWithdrawNomination = (nominationId: string, reason: string, isPostDeadline: boolean) => {
    setNominations(prev => prev.map(nom => {
      if (nom.id === nominationId) {
        if (!isPostDeadline) {
          // Pre-deadline: marked Withdrawn and removed from active ballot
          return {
            ...nom,
            status: 'Withdrawn' as const,
            withdrawnAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            withdrawalReason: reason,
          };
        } else {
          // Post-deadline: committee review procedure initiated, not automatically removed
          return {
            ...nom,
            withdrawalPostDeadlineRequest: {
              requestedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              reason,
              status: 'Pending Committee Review' as const,
            }
          };
        }
      }
      return nom;
    }));

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: 'Candidate / Committee',
        actorRole: 'Nomination Workflow',
        action: isPostDeadline ? 'Post-Deadline Withdrawal Requested' : 'Candidate Nomination Withdrawn',
        details: `Nomination ${nominationId}: Reason "${reason}". Post-deadline: ${isPostDeadline}.`,
        ipAddress: '127.0.0.1',
        severity: 'warning',
      },
      ...prev,
    ]);
  };

  const handleTriggerDeadlineEvaluation = () => {
    const evalResult = evaluateNominationsAtDeadline(nominations);
    setNominations(evalResult.updatedNominations);
    alert(`Nomination Deadline Evaluated (Rule 4.6):\n- ${evalResult.newlyIneligibleCount} nominations marked Ineligible (< 22 valid seconders).\n- ${evalResult.secondersMetCount} nominations proceed to Committee Review (>= 22 seconders).`);

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: 'Automated Deadline Service',
        actorRole: 'Electoral Core',
        action: 'Nomination Close Evaluated',
        details: `Evaluated nominations at deadline: ${evalResult.newlyIneligibleCount} set Ineligible (<22 seconders), ${evalResult.secondersMetCount} moved to Seconders Met.`,
        ipAddress: '127.0.0.1',
        severity: 'info',
      },
      ...prev,
    ]);
  };

  const handleApproveNomination = (id: string, reason: string) => {
    setNominations(prev => prev.map(n => n.id === id ? { ...n, status: 'Approved', reviewReason: reason } : n));
  };

  const handleDisqualifyNomination = (id: string, reason: string) => {
    setNominations(prev => prev.map(n => n.id === id ? { ...n, status: 'Disqualified', reviewReason: reason } : n));
  };

  const handleVerifyResults = (electionId: string, verifierName: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setElections(prev => prev.map(e => e.id === electionId ? {
      ...e,
      status: 'Awaiting Certification',
      verifiedAt: now,
      verifiedBy: verifierName,
      resultsVisibility: 'verified',
    } : e));
    setAuditLogs(prev => [{
      id: `audit-${Date.now()}`,
      timestamp: now,
      actorName: verifierName,
      actorRole: 'Electoral Officer',
      action: 'Results Verified',
      details: `Election ${electionId} results verified by ${verifierName}. Results remain hidden from students pending certification.`,
      ipAddress: '192.168.1.10',
      severity: 'info',
    }, ...prev]);
  };

  const handleCertifyResults = (electionId: string, certifierName: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setElections(prev => prev.map(e => e.id === electionId ? {
      ...e,
      status: 'Awaiting Certification',
      certifiedAt: now,
      certifiedBy: certifierName,
      resultsVisibility: 'certified',
    } : e));
    setAuditLogs(prev => [{
      id: `audit-${Date.now()}`,
      timestamp: now,
      actorName: certifierName,
      actorRole: 'Chief Electoral Officer',
      action: 'Results Certified',
      details: `Election ${electionId} results officially certified by ${certifierName}. Results remain hidden until publication.`,
      ipAddress: '192.168.1.10',
      severity: 'info',
    }, ...prev]);
  };

  const handlePublishResults = (electionId: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setElections(prev => prev.map(e => e.id === electionId ? {
      ...e,
      status: 'Published',
      publishedAt: now,
      resultsVisibility: 'published',
    } : e));
    setAuditLogs(prev => [{
      id: `audit-${Date.now()}`,
      timestamp: now,
      actorName: 'Dr. E. Vance',
      actorRole: 'Chief Electoral Officer',
      action: 'Results Officially Published',
      details: `Election ${electionId} results published to students. Official announcement active on student portal.`,
      ipAddress: '192.168.1.10',
      severity: 'info',
    }, ...prev]);
  };

  const handleToggleVoting = (electionId: string, open: boolean) => {
    setElections(prev => prev.map(e => e.id === electionId ? { ...e, status: open ? 'Voting Open' : 'Awaiting Certification' } : e));
  };

  const handleResolveTie = (portfolio: string, winnerId: string, reason: string) => {
    setResultsData(prev => prev.map(res => {
      if (res.portfolio === portfolio) {
        return {
          ...res,
          hasTie: false,
          tieResolutionDecision: {
            decidedWinnerId: winnerId,
            decidedBy: 'Dr. E. Vance & Committee',
            reason: reason,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          },
        };
      }
      return res;
    }));
  };

  // If Student role is active, render student voting flow without admin chrome
  if (currentRole === 'student') {
    // Derive draft ballots from student statuses (FR-19/FR-20)
    const draftBallots = students
      .filter(s => s.votingStatus === 'Draft Saved')
      .map(s => ({
        id: `draft-${s.studentNumber}`,
        studentNumber: s.studentNumber,
        electionId: elections.find(e => e.residenceId === s.residenceId)?.id || '',
        residenceId: s.residenceId,
        selections: {},
        savedAt: new Date().toISOString(),
        isComplete: false,
      }));

    return (
      <StudentVotingExperience
        students={students}
        elections={elections}
        candidates={nominations}
        residences={residences}
        draftBallots={draftBallots}
        onSaveDraftSession={(studentNumber, electionId, residenceId, selections) =>
          handleSaveDraftSession(studentNumber, selections)
        }
        onSubmitFinalBallot={handleSubmitFinalBallot}
        onExitToAdmin={() => setCurrentRole('admin')}
      />
    );
  }

  // Breadcrumbs generator
  const getBreadcrumbs = () => {
    const titles: Record<string, string> = {
      'overview': 'Overview',
      'elections': 'Elections',
      'create-election': 'Create Election',
      'residences': 'Residences',
      'voter-registers': 'Voter Registers',
      'voter-participation': 'Voter Participation',
      'nominations': 'Candidates & Nominations',
      'voting-mgmt': 'Voting Management',
      'results': 'Results & Certification',
      'reports': 'Reports',
      'calendar': 'Calendar',
      'support': 'Support & Incidents',
      'activity': 'Activity Log',
      'settings': 'Settings',
    };
    return ['Dashboard', titles[currentPage] || 'Overview'];
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F7F5' }}>
      {/* Notion-Style Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(p) => setCurrentPage(p)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentRole={currentRole}
        onSwitchRole={(r) => setCurrentRole(r)}
      />

      {/* Main Administrative Surface */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <TopBar
          breadcrumb={getBreadcrumbs()}
          electionSelector={{
            current: selectedElectionId,
            options: elections.map(e => ({ id: e.id, name: e.residenceName })),
            onChange: (id) => setSelectedElectionId(id),
          }}
          searchTerm={globalSearch}
          onSearchChange={(v) => setGlobalSearch(v)}
        />

        <main style={{ padding: '24px 32px', flex: 1 }}>
          {currentPage === 'overview' && (
            <DashboardOverview
              elections={elections}
              nominations={nominations}
              residences={residences}
              incidents={incidents}
              onNavigate={(p) => setCurrentPage(p)}
              onCreateElection={() => setCurrentPage('create-election')}
            />
          )}

          {currentPage === 'elections' && (
            <ElectionsList
              elections={elections}
              onSelectElection={(elec) => {
                setSelectedElectionId(elec.id);
                setCurrentPage('voting-mgmt');
              }}
              onCreateElection={() => setCurrentPage('create-election')}
              searchTerm={globalSearch}
            />
          )}

          {currentPage === 'create-election' && (
            <CreateElectionWizard
              residences={residences}
              onSaveElection={handleCreateElectionSave}
              onCancel={() => setCurrentPage('elections')}
            />
          )}

          {currentPage === 'residences' && (
            <ResidencesView 
              residences={residences} 
              students={students}
              onRenameResidence={handleRenameResidence}
              onUpdateResidence={handleUpdateResidence}
              onAddResidence={handleAddResidence}
            />
          )}

          {currentPage === 'voter-registers' && (
            <VoterRegistersView
              batches={voterBatches}
              students={students}
              residences={residences}
              onApproveBatch={handleApproveVoterBatch}
              onRejectBatch={handleRejectVoterBatch}
              onAddManualStudent={handleAddManualStudent}
              onResetToDemoData={handleResetToDemoData}
              onClearRegister={handleClearRegister}
            />
          )}

          {currentPage === 'voter-participation' && (
            <VoterParticipationView
              students={students}
              residences={residences}
            />
          )}

          {currentPage === 'nominations' && (
            <NominationsView
              nominations={nominations}
              elections={elections}
              students={students}
              onApprove={handleApproveNomination}
              onDisqualify={handleDisqualifyNomination}
              onCreateNomination={handleCreateNomination}
              onAddSeconder={handleAddSeconder}
              onWithdrawNomination={handleWithdrawNomination}
              onTriggerDeadlineEvaluation={handleTriggerDeadlineEvaluation}
            />
          )}

          {currentPage === 'voting-mgmt' && (
            <VotingManagementView
              elections={elections}
              onToggleVoting={handleToggleVoting}
              onNavigateToResults={() => setCurrentPage('results')}
            />
          )}

          {currentPage === 'results' && (() => {
            const selectedElec = elections.find(e => e.id === selectedElectionId) || elections[0];
            return (
              <ResultsCertificationView
                election={selectedElec}
                results={resultsData}
                onVerify={(name) => handleVerifyResults(selectedElec.id, name)}
                onCertify={(name) => handleCertifyResults(selectedElec.id, name)}
                onPublish={() => handlePublishResults(selectedElec.id)}
                onResolveTie={handleResolveTie}
              />
            );
          })()}

          {currentPage === 'reports' && (
            <ReportsView
              elections={elections}
              nominations={nominations}
              residences={residences}
              students={students}
              auditLogs={auditLogs}
            />
          )}

          {currentPage === 'calendar' && (
            <CalendarView />
          )}

          {currentPage === 'support' && (
            <SupportView incidents={incidents} />
          )}

          {currentPage === 'activity' && (
            <ActivityLogView logs={auditLogs} />
          )}

          {currentPage === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
