import React, { useState } from 'react';
import { LifeBuoy, AlertCircle, CheckCircle2, Clock, Filter, Plus } from 'lucide-react';
import { SupportIncident } from '../../types/election';
import { StatusBadge } from '../common/StatusBadge';

interface SupportViewProps {
  incidents: SupportIncident[];
}

export const SupportView: React.FC<SupportViewProps> = ({ incidents }) => {
  const [incidentList, setIncidentList] = useState<SupportIncident[]>(incidents);

  const resolveIncident = (id: string) => {
    setIncidentList(prev => prev.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status: 'Resolved',
          resolutionNotes: 'Investigation completed. Resolution confirmed with student.',
        };
      }
      return inc;
    }));
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
          Support & Incident Response
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6B66' }}>
          Real-time tracking of OTP delivery latency, student roll eligibility disputes, and seconding inquiries.
        </p>
      </div>

      <div className="notion-table-container">
        <table className="notion-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>Incident ID</th>
              <th style={{ width: '14%' }}>Category</th>
              <th style={{ width: '38%' }}>Description & Context</th>
              <th style={{ width: '14%' }}>Assigned Officer</th>
              <th style={{ width: '10%' }}>Status</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidentList.map((inc) => (
              <tr key={inc.id}>
                <td>
                  <code style={{ fontSize: '12px', background: '#F1F1EF', padding: '1px 5px', borderRadius: '3px' }}>
                    {inc.id}
                  </code>
                </td>
                <td>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#242424' }}>
                    {inc.category}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: '13px', color: '#242424' }}>{inc.description}</div>
                  <div style={{ fontSize: '11px', color: '#777777', marginTop: '2px' }}>
                    Student: {inc.studentIdentifier} • {inc.residenceName} • {inc.createdAt}
                  </div>
                  {inc.resolutionNotes && (
                    <div style={{ fontSize: '11px', color: '#1B5E20', marginTop: '4px' }}>
                      ✓ {inc.resolutionNotes}
                    </div>
                  )}
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: '#555550' }}>{inc.assignedTo || 'Unassigned'}</span>
                </td>
                <td>
                  <StatusBadge status={inc.status} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  {inc.status !== 'Resolved' && (
                    <button
                      onClick={() => resolveIncident(inc.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
