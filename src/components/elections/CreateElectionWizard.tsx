import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Residence, Election } from '../../types/election';

interface CreateElectionWizardProps {
  residences: Residence[];
  onSaveElection: (newElection: Election, allParticipatingResidenceIds?: string[]) => void;
  onCancel: () => void;
}

export const CreateElectionWizard: React.FC<CreateElectionWizardProps> = ({
  residences,
  onSaveElection,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [electionName, setElectionName] = useState<string>('DUT General House Committee Elections 2026/27');
  const [isMultiResidence, setIsMultiResidence] = useState<boolean>(true);
  const [selectedResIds, setSelectedResIds] = useState<string[]>(residences.map(r => r.id));
  const [singleResId, setSingleResId] = useState<string>(residences[0]?.id || 'res-a');

  // Shared schedule configured across all participating residences
  const [nomStart, setNomStart] = useState<string>('2026-10-25 08:00');
  const [nomEnd, setNomEnd] = useState<string>('2026-11-04 17:00');
  const [voteStart, setVoteStart] = useState<string>('2026-11-08 08:00');
  const [voteEnd, setVoteEnd] = useState<string>('2026-11-10 20:00');

  const selectedResidence = residences.find(r => r.id === singleResId) || residences[0];
  const selectedPortfolios = selectedResidence?.portfolioStructure || ['Chairperson', 'Deputy Chairperson', 'Secretary', 'Treasurer'];

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    const targetResIds = isMultiResidence ? selectedResIds : [singleResId];
    if (targetResIds.length === 0) {
      alert('Please select at least one participating residence.');
      return;
    }

    // Pass the primary election and array of all participating residences
    const primaryRes = residences.find(r => r.id === targetResIds[0]) || residences[0];
    const newElection: Election = {
      id: `elec-${Date.now()}`,
      name: isMultiResidence ? electionName : `${primaryRes.name} HC Election 2026/27`,
      residenceId: primaryRes.id,
      residenceName: primaryRes.name,
      status: 'Scheduled',
      nominationStart: nomStart,
      nominationEnd: nomEnd,
      votingStart: voteStart,
      votingEnd: voteEnd,
      eligibleVoterCount: primaryRes.registeredVoterCount,
      approvedCandidateCount: 0,
      totalBallotsCast: 0,
      draftBallotCount: 0,
      turnoutPercentage: 0,
      portfolios: primaryRes.portfolioStructure,
      capacity: primaryRes.officialCapacity,
    };
    onSaveElection(newElection, targetResIds);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
          Create New Residence Election Cycle
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6B66' }}>
          Guided wizard enforcing statutory nomination intervals, portfolio tiering rules, and schedule ordering.
        </p>
      </div>

      {/* Stepper Progress */}
      <div
        className="notion-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: currentStep >= 1 ? '#7656C9' : '#E5E5E2',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              1
            </span>
            <span style={{ fontSize: '13px', fontWeight: currentStep === 1 ? 600 : 400, color: '#242424' }}>
              Basic Info & Residence
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: currentStep >= 2 ? '#7656C9' : '#E5E5E2',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              2
            </span>
            <span style={{ fontSize: '13px', fontWeight: currentStep === 2 ? 600 : 400, color: '#242424' }}>
              Portfolio Tiering
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: currentStep >= 3 ? '#7656C9' : '#E5E5E2',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              3
            </span>
            <span style={{ fontSize: '13px', fontWeight: currentStep === 3 ? 600 : 400, color: '#242424' }}>
              Schedules
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: currentStep >= 4 ? '#7656C9' : '#E5E5E2',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              4
            </span>
            <span style={{ fontSize: '13px', fontWeight: currentStep === 4 ? 600 : 400, color: '#242424' }}>
              Review & Launch
            </span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="notion-card" style={{ padding: '24px' }}>
        {/* Step 1 */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>
              Step 1: Election Identification & Target Residence
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '6px' }}>
                Election Official Title:
              </label>
              <input
                type="text"
                value={electionName}
                onChange={(e) => setElectionName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #E5E5E2',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '6px' }}>
                Election Scope Configuration:
              </label>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scopeMode"
                    checked={isMultiResidence}
                    onChange={() => setIsMultiResidence(true)}
                  />
                  <span><strong>Multi-Residence Election</strong> (Synchronized shared schedule across all residences)</span>
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scopeMode"
                    checked={!isMultiResidence}
                    onChange={() => setIsMultiResidence(false)}
                  />
                  <span>Single Residence Only</span>
                </label>
              </div>

              {isMultiResidence ? (
                <div style={{ background: '#F8F8F6', padding: '14px', borderRadius: '6px', border: '1px solid #E5E5E2' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#242424', display: 'block', marginBottom: '8px' }}>
                    Select Participating Residences (All will follow the exact same opening/closing timetable):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {residences.map((r) => {
                      const isChecked = selectedResIds.includes(r.id);
                      return (
                        <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedResIds([...selectedResIds, r.id]);
                              } else {
                                setSelectedResIds(selectedResIds.filter(id => id !== r.id));
                              }
                            }}
                          />
                          <span><strong>{r.name}</strong> ({r.campus}) — Capacity: {r.officialCapacity}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <select
                  value={singleResId}
                  onChange={(e) => setSingleResId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E5E5E2',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                >
                  {residences.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.campus}) — Capacity: {r.officialCapacity}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>
              Step 2: Capacity Threshold & Portfolios
            </h3>

            <div style={{ padding: '14px', background: '#F8F8F6', borderRadius: '6px', border: '1px solid #EAEAE7' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>
                {selectedResidence.name} (Official Capacity: {selectedResidence.officialCapacity})
              </div>
              <div style={{ fontSize: '12px', color: '#6B6B66', marginTop: '4px' }}>
                {selectedResidence.officialCapacity > 100 ? (
                  <span>Executive Structure Applied (Above 100 students rule): Chairperson, Project Officer, Secretary.</span>
                ) : selectedResidence.officialCapacity < 100 ? (
                  <span>Representative Tier Applied (Below 100 students rule): House Rep 1, House Rep 2.</span>
                ) : (
                  <span style={{ color: '#DC2626', fontWeight: 600 }}>
                    Capacity is exactly 100. Unresolved policy requires committee decision prior to ballot publishing.
                  </span>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '6px' }}>
                Active Portfolios for this Ballot:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedPortfolios.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#F3EFFB',
                      color: '#7656C9',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: '1px solid #D8CCE8',
                    }}
                  >
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>
              Step 3: Schedule Ordering & Statutory Windows
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Nominations Open:
                </label>
                <input
                  type="text"
                  value={nomStart}
                  onChange={(e) => setNomStart(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Nominations Close:
                </label>
                <input
                  type="text"
                  value={nomEnd}
                  onChange={(e) => setNomEnd(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Voting Opens:
                </label>
                <input
                  type="text"
                  value={voteStart}
                  onChange={(e) => setVoteStart(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Voting Closes:
                </label>
                <input
                  type="text"
                  value={voteEnd}
                  onChange={(e) => setVoteEnd(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E5E2', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>
              Step 4: Review Configuration & Schedule Launch
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F1EF' }}>
                <span style={{ color: '#777777' }}>Title:</span>
                <span style={{ fontWeight: 600 }}>{electionName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F1EF' }}>
                <span style={{ color: '#777777' }}>Residence:</span>
                <span style={{ fontWeight: 600 }}>{selectedResidence.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F1EF' }}>
                <span style={{ color: '#777777' }}>Eligible Registered Roll:</span>
                <span style={{ fontWeight: 600 }}>{selectedResidence.registeredVoterCount} students</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F1EF' }}>
                <span style={{ color: '#777777' }}>Portfolios:</span>
                <span style={{ fontWeight: 600 }}>{selectedPortfolios.join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E5E2' }}>
          {currentStep > 1 ? (
            <button onClick={handleBack} className="btn btn-secondary">
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <button onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
          )}

          {currentStep < 4 ? (
            <button onClick={handleNext} className="btn btn-primary">
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn btn-primary">
              <CheckCircle2 size={14} /> Initialize Election Cycle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
