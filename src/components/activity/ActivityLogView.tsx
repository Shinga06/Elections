import React from 'react';
import { History, Shield, AlertOctagon, Info, FileText } from 'lucide-react';
import { AuditLogEntry } from '../../types/election';

interface ActivityLogViewProps {
  logs: AuditLogEntry[];
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs }) => {
  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
          Tamper-Evident Electoral Activity Log
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6B66' }}>
          Cryptographically hashed timeline of institutional officer actions, register imports, and schedule modifications.
        </p>
      </div>

      <div className="notion-table-container">
        <table className="notion-table">
          <thead>
            <tr>
              <th style={{ width: '16%' }}>Timestamp</th>
              <th style={{ width: '18%' }}>Actor / Authority</th>
              <th style={{ width: '22%' }}>Action Event</th>
              <th style={{ width: '32%' }}>Details & Cryptographic Integrity</th>
              <th style={{ width: '12%' }}>Severity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span style={{ fontSize: '12px', color: '#555550' }}>{log.timestamp}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#242424' }}>{log.actorName}</div>
                  <div style={{ fontSize: '11px', color: '#8E8E89' }}>{log.actorRole}</div>
                </td>
                <td>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#242424' }}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: '12px', color: '#555550' }}>{log.details}</div>
                  <div style={{ fontSize: '10px', color: '#8E8E89', marginTop: '2px' }}>
                    IP: {log.ipAddress}
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      background: log.severity === 'security' ? '#FDE8E8' : '#F1F1EF',
                      color: log.severity === 'security' ? '#9B1C1C' : '#555550',
                    }}
                  >
                    {log.severity.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
