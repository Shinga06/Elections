import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  FileText, 
  Download, 
  ShieldCheck,
  Check,
  X,
  UserPlus,
  RefreshCw,
  Trash2,
  Edit2
} from 'lucide-react';
import { VoterRegisterBatch, RegisteredStudent, Residence } from '../../types/election';
import { parseVoterRegisterFile, exportErrorReportCsv, ParseResult } from '../../utils/registerParser';

interface VoterRegistersProps {
  batches: VoterRegisterBatch[];
  students: RegisteredStudent[];
  residences: Residence[];
  onApproveBatch: (batch: VoterRegisterBatch, newStudents: RegisteredStudent[], replaceExisting: boolean) => void;
  onRejectBatch: (batchId: string) => void;
  onAddManualStudent: (student: RegisteredStudent) => void;
  onResetToDemoData: () => void;
  onClearRegister: (residenceId: string) => void;
}

export const VoterRegistersView: React.FC<VoterRegistersProps> = ({
  batches,
  students,
  residences,
  onApproveBatch,
  onRejectBatch,
  onAddManualStudent,
  onResetToDemoData,
  onClearRegister,
}) => {
  const [selectedResidenceId, setSelectedResidenceId] = useState<string>(residences[0]?.id || 'res-a');
  const [selectedBatch, setSelectedBatch] = useState<VoterRegisterBatch | null>(batches[0] || null);
  const [pendingParseResult, setPendingParseResult] = useState<ParseResult | null>(null);
  const [replaceExistingMode, setReplaceExistingMode] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);

  // Manual student form state
  const [manualName, setManualName] = useState('');
  const [manualSurname, setManualSurname] = useState('');
  const [manualStudentNumber, setManualStudentNumber] = useState('');
  const [manualResidenceId, setManualResidenceId] = useState(residences[0]?.id || 'res-a');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedResidence = residences.find(r => r.id === selectedResidenceId) || residences[0];
  const residenceStudents = students.filter(s => s.residenceId === selectedResidenceId);

  // Handle file selection (Excel or CSV)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const existingStudentNumbers = new Set(
        students.filter(s => s.residenceId !== selectedResidenceId).map(s => s.studentNumber)
      );

      const result = await parseVoterRegisterFile(
        file,
        selectedResidence.id,
        selectedResidence.name,
        existingStudentNumbers
      );

      setPendingParseResult(result);
    } catch (err: any) {
      alert(`Error reading file: ${err.message || 'Invalid format'}`);
    }
  };

  const handleApprovePendingUpload = () => {
    if (!pendingParseResult) return;

    const newBatch: VoterRegisterBatch = {
      id: `batch-${Date.now()}`,
      fileName: pendingParseResult.fileName,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      uploadedBy: 'Dr. E. Vance (Chief Electoral Officer)',
      status: 'Approved',
      residenceId: selectedResidence.id,
      residenceName: selectedResidence.name,
      totalRows: pendingParseResult.totalRows,
      validRows: pendingParseResult.validRows,
      invalidRows: pendingParseResult.invalidRows,
      approvedBy: 'Dr. E. Vance',
      approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      rows: pendingParseResult.rows,
    };

    onApproveBatch(newBatch, pendingParseResult.validStudents, replaceExistingMode);
    setSelectedBatch(newBatch);
    setPendingParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert(`Register imported successfully: ${pendingParseResult.validStudents.length} students enrolled in ${selectedResidence.name}.`);
  };

  const handleCancelPendingUpload = () => {
    setPendingParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualSurname.trim() || !manualStudentNumber.trim()) {
      alert('All fields are mandatory.');
      return;
    }

    // Duplicate check
    const existing = students.find(s => s.studentNumber === manualStudentNumber.trim());
    if (existing) {
      alert(`Student number "${manualStudentNumber}" already exists in ${existing.residenceName}.`);
      return;
    }

    const targetRes = residences.find(r => r.id === manualResidenceId) || residences[0];
    const newStudent: RegisteredStudent = {
      id: `stud-${targetRes.id}-${manualStudentNumber.trim()}`,
      studentNumber: manualStudentNumber.trim(), // string preserves leading zeros!
      name: manualName.trim(),
      surname: manualSurname.trim(),
      fullName: `${manualName.trim()} ${manualSurname.trim()}`,
      email: `${manualStudentNumber.trim()}@dut4life.ac.za`,
      residenceId: targetRes.id,
      residenceName: targetRes.name,
      isEligible: true,
      votingStatus: 'Not Voted',
      isDemoData: false,
    };

    onAddManualStudent(newStudent);
    setShowManualModal(false);
    setManualName('');
    setManualSurname('');
    setManualStudentNumber('');
    alert(`Student ${newStudent.fullName} (#${newStudent.studentNumber}) added to ${targetRes.name} register.`);
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
            Residence Student Registers
          </h1>
          <p style={{ fontSize: '13px', color: '#6B6B66' }}>
            Manage and verify isolated voter rolls for individual residences. Supports Excel (.xlsx) and CSV uploads.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onResetToDemoData}
            className="btn btn-secondary btn-sm"
            title="Reload fictional seed records for Residence A and B"
          >
            <RefreshCw size={13} /> Reset Demo Data
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="btn btn-primary btn-sm"
          >
            <UserPlus size={13} /> Add Student Manually
          </button>
        </div>
      </div>

      {/* Residence Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E5E5E2', paddingBottom: '2px' }}>
        {residences.map((res) => {
          const isActive = res.id === selectedResidenceId;
          const count = students.filter(s => s.residenceId === res.id).length;
          return (
            <button
              key={res.id}
              onClick={() => {
                setSelectedResidenceId(res.id);
                setPendingParseResult(null);
              }}
              style={{
                padding: '8px 16px',
                background: isActive ? '#FFFFFF' : 'transparent',
                border: isActive ? '1px solid #E5E5E2' : '1px solid transparent',
                borderBottom: isActive ? '2px solid #7656C9' : 'none',
                borderRadius: '6px 6px 0 0',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#242424' : '#6B6B66',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{res.name}</span>
              <span
                style={{
                  fontSize: '11px',
                  background: isActive ? '#F3EFFB' : '#EAEAE7',
                  color: isActive ? '#7656C9' : '#555550',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Upload Zone & Scope Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '20px',
        }}
      >
        {/* Upload Box (8 cols) */}
        <div
          className="notion-card"
          style={{
            gridColumn: 'span 8',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #D3D3CE',
            backgroundColor: '#FAF9F8',
            textAlign: 'center',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
          />

          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#F3EFFB',
              color: '#7656C9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
            }}
          >
            <UploadCloud size={24} />
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#242424' }}>
            Upload Register for {selectedResidence.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#6B6B66', maxWidth: '440px', marginTop: '4px' }}>
            Drag and drop an Excel (.xlsx) or CSV file with columns: <strong>Name, Surname, Student No</strong> (Student number is preserved as text with leading zeros).
          </p>

          <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary btn-sm"
            >
              <FileSpreadsheet size={14} /> Browse File (.xlsx / .csv)
            </button>
          </div>
        </div>

        {/* Current Register Summary & Danger Controls (4 cols) */}
        <div
          className="notion-card"
          style={{
            gridColumn: 'span 4',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={18} color="#7656C9" />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
                {selectedResidence.name} Roll Summary
              </h3>
            </div>

            <div style={{ fontSize: '12px', color: '#555550', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Enrolled Students: <strong>{residenceStudents.length}</strong></div>
              <div>Eligible Voters: <strong>{residenceStudents.filter(s => s.isEligible).length}</strong></div>
              <div>Voted Ballots: <strong>{residenceStudents.filter(s => s.votingStatus === 'Voted').length}</strong></div>
              <div>Turnout: <strong>{residenceStudents.filter(s => s.isEligible).length > 0 ? ((residenceStudents.filter(s => s.votingStatus === 'Voted').length / residenceStudents.filter(s => s.isEligible).length) * 100).toFixed(1) : 0}%</strong></div>
            </div>
          </div>

          <div style={{ paddingTop: '14px', borderTop: '1px solid #E5E5E2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to completely clear the student register for ${selectedResidence.name}? This will remove all voter enrollments.`)) {
                  onClearRegister(selectedResidence.id);
                }
              }}
              className="btn btn-danger btn-sm"
              style={{ width: '100%' }}
            >
              <Trash2 size={13} /> Clear Register Records
            </button>
          </div>
        </div>
      </div>

      {/* File Ingestion Preview Modal / Staging Panel (if file parsed) */}
      {pendingParseResult && (
        <div
          className="notion-card"
          style={{
            padding: '20px',
            border: '2px solid #7656C9',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#7656C9', fontWeight: 600, letterSpacing: '0.04em' }}>
                Pre-Import Verification Staging
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424', marginTop: '2px' }}>
                File: {pendingParseResult.fileName}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '12px', background: '#EDF7EE', color: '#1B5E20', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {pendingParseResult.validRows} Valid Records
              </span>
              {pendingParseResult.invalidRows > 0 && (
                <span style={{ fontSize: '12px', background: '#FDE8E8', color: '#9B1C1C', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {pendingParseResult.invalidRows} Error Rows
                </span>
              )}
            </div>
          </div>

          {/* Import Mode: Append vs Replace */}
          <div style={{ background: '#F8F8F6', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: '#242424', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={replaceExistingMode}
                  onChange={(e) => setReplaceExistingMode(e.target.checked)}
                />
                <span><strong>Replace Existing Register:</strong> Overwrite all existing student records for {selectedResidence.name}</span>
              </label>
              <p style={{ fontSize: '11px', color: '#777777', marginLeft: '22px', marginTop: '2px' }}>
                Unchecked = Append valid records to existing register. Checked = Replace current register and log audit trail.
              </p>
            </div>

            {pendingParseResult.invalidRows > 0 && (
              <button
                onClick={() => exportErrorReportCsv(pendingParseResult.fileName, pendingParseResult.rows)}
                className="btn btn-secondary btn-sm"
              >
                <Download size={13} /> Download Error Report (CSV)
              </button>
            )}
          </div>

          {/* Preview rows table */}
          <div className="notion-table-container" style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
            <table className="notion-table">
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>Row</th>
                  <th style={{ width: '18%' }}>Student #</th>
                  <th style={{ width: '22%' }}>Surname</th>
                  <th style={{ width: '22%' }}>First Name</th>
                  <th style={{ width: '30%' }}>Validation Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingParseResult.rows.slice(0, 50).map((r) => (
                  <tr key={r.rowNumber} style={{ backgroundColor: !r.isValid ? '#FFFBFB' : undefined }}>
                    <td>#{r.rowNumber}</td>
                    <td>
                      <code style={{ fontSize: '12px', background: '#F1F1EF', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                        {r.studentNumber || '—'}
                      </code>
                    </td>
                    <td>{r.surname}</td>
                    <td>{r.name}</td>
                    <td>
                      {r.isValid ? (
                        <span style={{ color: '#1B5E20', fontSize: '11px', fontWeight: 500 }}>
                          ✓ Valid Record
                        </span>
                      ) : (
                        <span style={{ color: '#DC2626', fontSize: '11px', fontWeight: 600 }}>
                          ⚠ {r.errors.join('; ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={handleCancelPendingUpload} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleApprovePendingUpload}
              disabled={pendingParseResult.validRows === 0}
              className="btn btn-primary"
            >
              <CheckCircle2 size={14} /> Approve & Enforce Register ({pendingParseResult.validRows} Students)
            </button>
          </div>
        </div>
      )}

      {/* Current Student Register Database */}
      <div className="notion-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>
              Enrolled Students: {selectedResidence.name}
            </h3>
            <span style={{ fontSize: '12px', color: '#777777' }}>
              Individual students authorized to authenticate, second candidates, and cast ballots in {selectedResidence.name}.
            </span>
          </div>
        </div>

        <div className="notion-table-container">
          <table className="notion-table">
            <thead>
              <tr>
                <th style={{ width: '16%' }}>Student Number</th>
                <th style={{ width: '26%' }}>Surname, Name</th>
                <th style={{ width: '28%' }}>University Email</th>
                <th style={{ width: '15%' }}>Voting Participation</th>
                <th style={{ width: '15%' }}>Register Source</th>
              </tr>
            </thead>
            <tbody>
              {residenceStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#8E8E89' }}>
                    No students currently enrolled in {selectedResidence.name}. Upload a CSV/Excel file or add manually.
                  </td>
                </tr>
              ) : (
                residenceStudents.map((stud) => (
                  <tr key={stud.id}>
                    <td>
                      <code style={{ fontSize: '12px', background: '#F1F1EF', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {stud.studentNumber}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{stud.surname}, {stud.name}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#555550' }}>{stud.email}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 500,
                          backgroundColor: stud.votingStatus === 'Voted' ? '#EDF7EE' : (stud.votingStatus === 'Draft Saved' ? '#FFF8E1' : '#F1F1EF'),
                          color: stud.votingStatus === 'Voted' ? '#1B5E20' : (stud.votingStatus === 'Draft Saved' ? '#8D6B00' : '#555550'),
                        }}
                      >
                        {stud.votingStatus}
                      </span>
                    </td>
                    <td>
                      {stud.isDemoData ? (
                        <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          DEMO DATA
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', background: '#EDF7EE', color: '#1B5E20', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          OFFICIAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Student Entry Modal */}
      {showManualModal && (
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
          onClick={() => setShowManualModal(false)}
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
                Add Student to Residence Register
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#8E8E89' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Target Residence:
                </label>
                <select
                  value={manualResidenceId}
                  onChange={(e) => setManualResidenceId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E5E5E2',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  {residences.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.campus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                  Student Number (Stored as text with leading zeros):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 09000045"
                  value={manualStudentNumber}
                  onChange={(e) => setManualStudentNumber(e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#242424', marginBottom: '4px' }}>
                    First Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Test"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
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
                    Surname:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Student"
                    value={manualSurname}
                    onChange={(e) => setManualSurname(e.target.value)}
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
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
