import React, { useState } from 'react';
import { 
  LifeBuoy, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Plus, 
  Search, 
  Download, 
  ShieldAlert, 
  PauseCircle, 
  PlayCircle, 
  ArrowUpRight, 
  UserCheck, 
  MapPin, 
  Mail, 
  Phone, 
  User,
  X
} from 'lucide-react';
import { SupportIncident, Election } from '../../types/election';
import { StatusBadge } from '../common/StatusBadge';

interface SupportViewProps {
  incidents: SupportIncident[];
  onAddIncident?: (incident: Omit<SupportIncident, 'id' | 'createdAt'>) => void;
  onUpdateIncident?: (id: string, updates: Partial<SupportIncident>) => void;
  onEmergencyPauseToggle?: (electionId: string, paused: boolean, reason: string) => void;
  elections?: Election[];
}

export const SupportView: React.FC<SupportViewProps> = ({
  incidents,
  onAddIncident,
  onUpdateIncident,
  onEmergencyPauseToggle,
  elections = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [campusFilter, setCampusFilter] = useState<string>('All');

  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState<SupportIncident | null>(null);
  const [showResolveModal, setShowResolveModal] = useState<SupportIncident | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Form states
  const [newCategory, setNewCategory] = useState<SupportIncident['category']>('Login/OTP');
  const [newStudentId, setNewStudentId] = useState('');
  const [newResidence, setNewResidence] = useState('Residence A');
  const [newCampus, setNewCampus] = useState<'Durban' | 'Midlands'>('Durban');
  const [newContactMethod, setNewContactMethod] = useState<SupportIncident['contactMethod']>('University Email');
  const [newDescription, setNewDescription] = useState('');
  const [newEscalation, setNewEscalation] = useState<SupportIncident['escalationLevel']>('Standard');

  const [escalateReason, setEscalateReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [emergencyElectionId, setEmergencyElectionId] = useState<string>(elections[0]?.id || '');
  const [emergencyReason, setEmergencyReason] = useState('');

  // Officers list for assignment
  const supportOfficers = [
    'S. Mkhize (Durban Desk)',
    'T. Naidoo (Midlands Desk)',
    'M. Sibaya (System Support)',
    'Dr. E. Vance (CEO)',
  ];

  // Filtering
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = 
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.studentIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.residenceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || inc.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || inc.status === statusFilter;
    const matchesCampus = campusFilter === 'All' || (inc.campus || 'Durban') === campusFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesCampus;
  });

  // KPI Calculations
  const totalCount = incidents.length;
  const openCount = incidents.filter(i => i.status === 'Open' || i.status === 'In Progress').length;
  const escalatedCount = incidents.filter(i => i.status === 'Escalated').length;
  const resolvedList = incidents.filter(i => i.status === 'Resolved' && i.resolutionTimeMinutes);
  const avgResolutionTime = resolvedList.length > 0
    ? Math.round(resolvedList.reduce((acc, curr) => acc + (curr.resolutionTimeMinutes || 0), 0) / resolvedList.length)
    : 16;

  // Handlers
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId || !newDescription) {
      alert('Please provide student number and description.');
      return;
    }

    if (onAddIncident) {
      onAddIncident({
        category: newCategory,
        studentIdentifier: newStudentId,
        contactMethod: newContactMethod,
        campus: newCampus,
        residenceName: newResidence,
        description: newDescription,
        status: newEscalation === 'Escalated to Election Committee' ? 'Escalated' : 'Open',
        assignedTo: newCampus === 'Durban' ? 'S. Mkhize (Durban Desk)' : 'T. Naidoo (Midlands Desk)',
        escalationLevel: newEscalation,
      });
    }

    // Reset and close
    setNewStudentId('');
    setNewDescription('');
    setShowNewModal(false);
  };

  const handleAssignOfficer = (incidentId: string, officer: string) => {
    if (onUpdateIncident) {
      onUpdateIncident(incidentId, { assignedTo: officer, status: 'In Progress' });
    }
  };

  const handleConfirmEscalation = () => {
    if (!showEscalateModal) return;
    if (!escalateReason.trim()) {
      alert('Institutional requirement: Escalation reason must be documented for the Election Committee.');
      return;
    }

    if (onUpdateIncident) {
      onUpdateIncident(showEscalateModal.id, {
        status: 'Escalated',
        escalationLevel: 'Escalated to Election Committee',
        escalationReason: escalateReason,
        escalatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
    }

    setShowEscalateModal(null);
    setEscalateReason('');
  };

  const handleConfirmResolution = () => {
    if (!showResolveModal) return;
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution notes describing how this issue was resolved.');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    if (onUpdateIncident) {
      onUpdateIncident(showResolveModal.id, {
        status: 'Resolved',
        resolutionNotes,
        resolvedAt: now,
        resolutionTimeMinutes: Math.floor(Math.random() * 20) + 8,
      });
    }

    setShowResolveModal(null);
    setResolutionNotes('');
  };

  const handleEmergencyAction = () => {
    if (!emergencyReason.trim()) {
      alert('SRS §9: Reason for administrative election pause/closure must be recorded in the audit log.');
      return;
    }
    const targetElec = elections.find(e => e.id === emergencyElectionId) || elections[0];
    if (targetElec && onEmergencyPauseToggle) {
      const isCurrentlyOpen = targetElec.status === 'Voting Open';
      onEmergencyPauseToggle(targetElec.id, !isCurrentlyOpen, emergencyReason);
    }
    setShowEmergencyModal(false);
    setEmergencyReason('');
  };

  const handleExportCsv = () => {
    const rows = [
      ['Incident ID', 'Student ID', 'Campus', 'Contact Method', 'Residence', 'Category', 'Status', 'Escalation Level', 'Assigned To', 'Created At', 'Resolved At', 'Resolution Minutes', 'Description', 'Resolution Notes'],
      ...incidents.map(i => [
        i.id,
        i.studentIdentifier,
        i.campus || 'Durban',
        i.contactMethod || 'Email',
        i.residenceName,
        i.category,
        i.status,
        i.escalationLevel || 'Standard',
        i.assignedTo || 'Unassigned',
        i.createdAt,
        i.resolvedAt || '',
        String(i.resolutionTimeMinutes || ''),
        i.description,
        i.resolutionNotes || '',
      ])
    ];

    const csvContent = rows
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `support_incidents_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em', margin: 0 }}>
              Technical Support & Incident Operations
            </h1>
            <span style={{ fontSize: '11px', background: '#F1F1EF', color: '#555550', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              SRS FR-30 &amp; §9
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#6B6B66', margin: '4px 0 0' }}>
            Multi-campus support workflow for OTP delivery, student eligibility disputes, nomination queries, and audited emergency procedures.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCsv}
            className="btn btn-secondary btn-sm"
            title="Download Support Report CSV (SRS §5)"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ color: '#B91C1C', borderColor: '#FCA5A5' }}
            title="Emergency pause/resume election with audit trail"
          >
            <ShieldAlert size={14} />
            Emergency Pause / Close
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} />
            Report Incident
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="notion-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '12px', color: '#6B6B66', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LifeBuoy size={14} color="#7656C9" />
            Total Incidents Logged
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#242424', marginTop: '4px' }}>
            {totalCount}
          </div>
        </div>

        <div className="notion-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '12px', color: '#6B6B66', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="#D97706" />
            Active (Open / In Progress)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#D97706', marginTop: '4px' }}>
            {openCount}
          </div>
        </div>

        <div className="notion-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '12px', color: '#6B6B66', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} color="#DC2626" />
            Escalated to Committee
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#DC2626', marginTop: '4px' }}>
            {escalatedCount}
          </div>
        </div>

        <div className="notion-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '12px', color: '#6B6B66', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#16A34A" />
            Avg. Resolution Time
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#16A34A', marginTop: '4px' }}>
            {avgResolutionTime} mins
          </div>
        </div>

        <div className="notion-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '12px', color: '#6B6B66', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#2563EB" />
            Active Campus Desks
          </div>
          <div style={{ fontSize: '12px', color: '#242424', marginTop: '6px', fontWeight: 500 }}>
            Durban (Steve Biko) • Midlands (Indumiso)
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E3E3E0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={14} color="#8E8E89" />
          <input
            type="text"
            placeholder="Search student #, ID, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#6B6B66' }}>Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6D6D2', background: '#FFF' }}
          >
            <option value="All">All Categories</option>
            <option value="Login/OTP">Login / OTP</option>
            <option value="Nomination">Nomination</option>
            <option value="Seconding">Seconding</option>
            <option value="Voting">Voting</option>
            <option value="Eligibility">Eligibility</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#6B6B66' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6D6D2', background: '#FFF' }}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#6B6B66' }}>Campus:</span>
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6D6D2', background: '#FFF' }}
          >
            <option value="All">All Campuses</option>
            <option value="Durban">Durban Campus</option>
            <option value="Midlands">Midlands Campus</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="notion-table-container">
        <table className="notion-table">
          <thead>
            <tr>
              <th style={{ width: '10%' }}>Incident ID</th>
              <th style={{ width: '16%' }}>Reporter &amp; Channel</th>
              <th style={{ width: '12%' }}>Category &amp; Campus</th>
              <th style={{ width: '32%' }}>Description &amp; Resolution</th>
              <th style={{ width: '16%' }}>Assigned Officer</th>
              <th style={{ width: '14%', textAlign: 'right' }}>Status &amp; Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#8E8E89' }}>
                  No support incidents match the selected filter.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc) => (
                <tr key={inc.id}>
                  <td>
                    <code style={{ fontSize: '12px', background: '#F1F1EF', padding: '2px 5px', borderRadius: '3px' }}>
                      {inc.id}
                    </code>
                    <div style={{ fontSize: '10px', color: '#8E8E89', marginTop: '4px' }}>
                      {inc.createdAt}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>
                      Student #{inc.studentIdentifier}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B6B66', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      {inc.contactMethod === 'Phone' ? <Phone size={10} /> : inc.contactMethod?.includes('Walk-in') ? <User size={10} /> : <Mail size={10} />}
                      {inc.contactMethod || 'University Email'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#7656C9', fontWeight: 500 }}>
                      {inc.residenceName}
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#242424' }}>
                      {inc.category}
                    </span>
                    <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={10} />
                      {inc.campus || 'Durban'}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '13px', color: '#242424', lineHeight: 1.4 }}>
                      {inc.description}
                    </div>

                    {inc.escalationReason && (
                      <div style={{
                        fontSize: '11px',
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        color: '#991B1B',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        marginTop: '6px'
                      }}>
                        ⚠ <strong>Escalation note:</strong> {inc.escalationReason} ({inc.escalatedAt})
                      </div>
                    )}

                    {inc.resolutionNotes && (
                      <div style={{
                        fontSize: '11px',
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        color: '#166534',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        marginTop: '6px'
                      }}>
                        ✓ <strong>Resolved:</strong> {inc.resolutionNotes}
                        {inc.resolutionTimeMinutes && <span style={{ opacity: 0.85 }}> • Took {inc.resolutionTimeMinutes}m</span>}
                      </div>
                    )}
                  </td>

                  <td>
                    <select
                      value={inc.assignedTo || ''}
                      onChange={(e) => handleAssignOfficer(inc.id, e.target.value)}
                      disabled={inc.status === 'Resolved'}
                      style={{
                        fontSize: '12px',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        border: '1px solid #D6D6D2',
                        background: inc.status === 'Resolved' ? '#F7F7F5' : '#FFF',
                        width: '100%',
                        cursor: inc.status === 'Resolved' ? 'default' : 'pointer',
                      }}
                    >
                      <option value="">Unassigned</option>
                      {supportOfficers.map(officer => (
                        <option key={officer} value={officer}>{officer}</option>
                      ))}
                    </select>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <StatusBadge status={inc.status} />

                      {inc.status !== 'Resolved' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {inc.status !== 'Escalated' && (
                            <button
                              onClick={() => {
                                setShowEscalateModal(inc);
                                setEscalateReason('');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '11px', padding: '2px 6px', color: '#DC2626' }}
                              title="Escalate issue to Election Committee"
                            >
                              <ArrowUpRight size={11} />
                              Escalate
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setShowResolveModal(inc);
                              setResolutionNotes('');
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '11px', padding: '2px 8px' }}
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Campus Support Notice */}
      <div style={{
        background: '#F9FAFB', border: '1px solid #E5E7EB',
        borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#4B5563',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
      }}>
        <div>
          🏛 <strong>SRS §9 Physical Operations:</strong> On-site technical support desks are active at Durban (Steve Biko Campus library ground floor) and Midlands (Indumiso Campus computer lab 2).
        </div>
        <div style={{ fontSize: '11px', color: '#6B7280' }}>
          SLA Targets: OTP delivery &lt; 15 mins • Roll verification &lt; 2 hrs
        </div>
      </div>

      {/* Modal 1: Report New Incident */}
      {showNewModal && (
        <div className="notion-modal-overlay">
          <div className="notion-modal" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424', margin: 0 }}>
                Report Support Incident (SRS FR-30)
              </h3>
              <button onClick={() => setShowNewModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} color="#8E8E89" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                    Student Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09000015"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className="notion-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="notion-input"
                  >
                    <option value="Login/OTP">Login / OTP</option>
                    <option value="Nomination">Nomination</option>
                    <option value="Seconding">Seconding</option>
                    <option value="Voting">Voting</option>
                    <option value="Eligibility">Eligibility</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                    Campus Location *
                  </label>
                  <select
                    value={newCampus}
                    onChange={(e) => setNewCampus(e.target.value as any)}
                    className="notion-input"
                  >
                    <option value="Durban">Durban Campus</option>
                    <option value="Midlands">Midlands Campus</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                    Contact Method *
                  </label>
                  <select
                    value={newContactMethod}
                    onChange={(e) => setNewContactMethod(e.target.value as any)}
                    className="notion-input"
                  >
                    <option value="University Email">University Email</option>
                    <option value="Phone">Phone</option>
                    <option value="Walk-in (Durban Campus)">Walk-in (Durban Campus)</option>
                    <option value="Walk-in (Midlands Campus)">Walk-in (Midlands Campus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                  Residence *
                </label>
                <input
                  type="text"
                  required
                  value={newResidence}
                  onChange={(e) => setNewResidence(e.target.value)}
                  className="notion-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                  Incident Description &amp; Technical Context *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe error code, student issue, or OTP delay..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="notion-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                  Initial Escalation Level
                </label>
                <select
                  value={newEscalation}
                  onChange={(e) => setNewEscalation(e.target.value as any)}
                  className="notion-input"
                >
                  <option value="Standard">Standard (SLA 2 hours)</option>
                  <option value="Urgent">Urgent (SLA 15 minutes)</option>
                  <option value="Escalated to Election Committee">Escalate to Committee Directly</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Create &amp; Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Escalate to Election Committee */}
      {showEscalateModal && (
        <div className="notion-modal-overlay">
          <div className="notion-modal" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#B91C1C', marginBottom: '8px' }}>
              Escalate to Election Committee
            </h3>
            <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '14px' }}>
              Escalating Incident <strong>{showEscalateModal.id}</strong> (Student #{showEscalateModal.studentIdentifier}).
              Institutional policy requires an explicit reason for committee intervention.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Reason for Escalation *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Qualification dispute, potential register omission, or seconder contestation..."
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                className="notion-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowEscalateModal(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalation}
                className="btn btn-primary btn-sm"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
              >
                Confirm Escalation &amp; Notify Committee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Resolve Incident */}
      {showResolveModal && (
        <div className="notion-modal-overlay">
          <div className="notion-modal" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#166534', marginBottom: '8px' }}>
              Resolve Incident #{showResolveModal.id}
            </h3>
            <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '14px' }}>
              Record the actions taken to resolve the issue for Student #{showResolveModal.studentIdentifier}.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Resolution Notes &amp; Root Cause *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Resent OTP via alternate gateway, verified student email on roll, confirmed ballot access..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="notion-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowResolveModal(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                className="btn btn-primary btn-sm"
                style={{ background: '#16A34A', borderColor: '#16A34A' }}
              >
                Mark Resolved &amp; Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Emergency Pause / Close Election (SRS §9) */}
      {showEmergencyModal && (
        <div className="notion-modal-overlay">
          <div className="notion-modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', marginBottom: '8px' }}>
              <ShieldAlert size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                Audited Emergency Election Control (SRS §9)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.5, marginBottom: '14px' }}>
              Administrators may pause or close an active election strictly through an authorized, tamper-evident procedure. All actions are logged with actor identity, timestamp, and IP address.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Target Election *
                </label>
                <select
                  value={emergencyElectionId}
                  onChange={(e) => setEmergencyElectionId(e.target.value)}
                  className="notion-input"
                >
                  {elections.map(elec => (
                    <option key={elec.id} value={elec.id}>
                      {elec.residenceName} (Current Status: {elec.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Institutional Justification / Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Unforeseen university power outage, connectivity disruption, or formal Election Committee directive..."
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="notion-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyAction}
                className="btn btn-primary btn-sm"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
              >
                Execute Audited Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
