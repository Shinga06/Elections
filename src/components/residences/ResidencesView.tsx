import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Edit3, 
  Check, 
  X, 
  Info,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Residence, RegisteredStudent } from '../../types/election';
import { StatusBadge } from '../common/StatusBadge';

interface ResidencesProps {
  residences: Residence[];
  students: RegisteredStudent[];
  onRenameResidence: (id: string, newName: string, newCampus: string) => void;
  onUpdateResidence?: (id: string, newName: string, newCampus: string, newCapacity: number) => void;
  onAddResidence?: (newRes: Residence) => void;
}

export const ResidencesView: React.FC<ResidencesProps> = ({ 
  residences,
  students,
  onRenameResidence,
  onUpdateResidence,
  onAddResidence
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editCampus, setEditCampus] = useState<string>('');
  const [editCapacity, setEditCapacity] = useState<string>('');
  const [capacityError, setCapacityError] = useState<string | null>(null);

  // Add Residence Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>('');
  const [addCampus, setAddCampus] = useState<string>('Steve Biko Campus');
  const [addCapacity, setAddCapacity] = useState<string>('150');
  const [addError, setAddError] = useState<string | null>(null);

  const validateCapacity = (val: string): { isValid: boolean; num?: number; error?: string } => {
    if (!val || val.trim() === '') {
      return { isValid: false, error: 'Capacity is required.' };
    }
    const num = Number(val);
    if (!Number.isInteger(num) || num <= 0) {
      return { isValid: false, error: 'Capacity must be a valid positive whole number (e.g. 150).' };
    }
    return { isValid: true, num };
  };

  const handleStartEdit = (res: Residence) => {
    setEditingId(res.id);
    setEditName(res.name);
    setEditCampus(res.campus);
    setEditCapacity(res.officialCapacity.toString());
    setCapacityError(null);
  };

  const handleSaveEdit = (resId: string) => {
    if (!editName.trim()) {
      alert('Residence name is required.');
      return;
    }
    const capCheck = validateCapacity(editCapacity);
    if (!capCheck.isValid) {
      setCapacityError(capCheck.error || 'Invalid capacity');
      return;
    }

    if (onUpdateResidence) {
      onUpdateResidence(resId, editName.trim(), editCampus.trim(), capCheck.num!);
    } else {
      onRenameResidence(resId, editName.trim(), editCampus.trim());
    }
    setEditingId(null);
  };

  const handleCreateResidence = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addName.trim()) {
      setAddError('Residence name is required.');
      return;
    }
    const capCheck = validateCapacity(addCapacity);
    if (!capCheck.isValid) {
      setAddError(capCheck.error || 'Invalid capacity.');
      return;
    }

    const capacityNum = capCheck.num!;
    const portfolios = capacityNum > 100 
      ? ['Chairperson', 'Project Officer', 'Secretary']
      : (capacityNum < 100 ? ['House Representative 1', 'House Representative 2'] : ['Awaiting Policy Determination (100 Cap)']);

    const newRes: Residence = {
      id: `res-${Date.now()}`,
      name: addName.trim(),
      code: `RES_${addName.trim().toUpperCase().replace(/\s+/g, '_').slice(0, 8)}`,
      campus: addCampus.trim() || 'DUT Campus',
      officialCapacity: capacityNum,
      registeredVoterCount: 0,
      electionStatus: 'Draft',
      portfolioStructure: portfolios,
      capacityRuleResolved: capacityNum !== 100,
      isCustomName: true,
    };

    if (onAddResidence) {
      onAddResidence(newRes);
    }
    setShowAddModal(false);
    setAddName('');
    setAddCapacity('150');
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
            Residence Directory & DUT Configuration
          </h1>
          <p style={{ fontSize: '13px', color: '#6B6B66' }}>
            Configurable university residences with strict capacity thresholds. Authorized administrators can add residences and configure capacity.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-sm"
        >
          <Building2 size={14} /> Add New Residence
        </button>
      </div>

      {/* Isolation Notice */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E5E2',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        <ShieldCheck size={20} color="#7656C9" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: '#555550', lineHeight: 1.5 }}>
          <strong>Strict Cross-Residence Voter Isolation:</strong>
          Each residence possesses its own dedicated, authenticated voter register. Students enrolled in <strong>Residence A</strong> are strictly ineligible to vote or second candidates in <strong>Residence B</strong>, and vice versa.
        </div>
      </div>

      {/* Residence Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '16px',
        }}
      >
        {residences.map((res) => {
          const isEditing = editingId === res.id;
          const resStudents = students.filter(s => s.residenceId === res.id);
          const votedCount = resStudents.filter(s => s.votingStatus === 'Voted').length;
          const eligibleCount = resStudents.filter(s => s.isEligible).length;

          return (
            <div
              key={res.id}
              className="notion-card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginRight: '10px' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Alpine Road Residence"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: '1px solid #7656C9',
                          fontSize: '15px',
                          fontWeight: 600,
                          outline: 'none',
                        }}
                      />
                      <input
                        type="text"
                        value={editCampus}
                        onChange={(e) => setEditCampus(e.target.value)}
                        placeholder="Campus (e.g. ML Sultan Campus)"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #E5E5E2',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      />
                      <div>
                        <label style={{ fontSize: '11px', color: '#777777', display: 'block', marginBottom: '2px' }}>
                          Official Capacity (Positive whole number):
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editCapacity}
                          onChange={(e) => {
                            setEditCapacity(e.target.value);
                            setCapacityError(null);
                          }}
                          placeholder="e.g. 180"
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: capacityError ? '1px solid #DC2626' : '1px solid #E5E5E2',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        />
                        {capacityError && (
                          <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '2px', display: 'block' }}>
                            {capacityError}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <button
                          onClick={() => handleSaveEdit(res.id)}
                          className="btn btn-primary btn-sm"
                        >
                          <Check size={12} /> Save Residence
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn btn-secondary btn-sm"
                        >
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#242424' }}>{res.name}</h3>
                        <button
                          onClick={() => handleStartEdit(res)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#8E8E89',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          title="Rename to DUT Residence"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                      <div style={{ fontSize: '12px', color: '#777777', marginTop: '2px' }}>{res.campus}</div>
                    </div>
                  )}

                  {!isEditing && <StatusBadge status={res.electionStatus} />}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0', padding: '12px', background: '#F8F8F6', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#777777' }}>Official Capacity</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>{res.officialCapacity}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#777777' }}>Enrolled Students</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>{resStudents.length}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#8E8E89', letterSpacing: '0.04em', marginBottom: '6px' }}>
                    Portfolio Configuration
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {res.portfolioStructure.map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px',
                          background: '#F1F1EF',
                          color: '#444440',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 500,
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #EAEAE7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#1B5E20', fontWeight: 500 }}>
                  Turnout: {eligibleCount > 0 ? ((votedCount / eligibleCount) * 100).toFixed(1) : 0}% ({votedCount}/{eligibleCount})
                </div>
                {!isEditing && (
                  <button
                    onClick={() => handleStartEdit(res)}
                    className="btn btn-secondary btn-sm"
                  >
                    Rename Residence
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Residence Modal */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#242424' }}>
                Add University Residence Record
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#8E8E89' }}
              >
                ×
              </button>
            </div>

            {addError && (
              <div style={{ background: '#FDE8E8', border: '1px solid #F8B4B4', padding: '10px 14px', borderRadius: '6px', color: '#9B1C1C', fontSize: '12px', marginBottom: '14px' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateResidence} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Residence Name (Required):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campbell Hall"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E5E5E2',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Campus:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Steve Biko Campus"
                  value={addCampus}
                  onChange={(e) => setAddCampus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E5E5E2',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Official Capacity (Required positive whole number):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="150"
                  value={addCapacity}
                  onChange={(e) => setAddCapacity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E5E5E2',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Residence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
