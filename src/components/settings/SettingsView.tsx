import React from 'react';
import { Settings, Shield, Key, Mail, Database, UserCheck, AlertTriangle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
          Platform Settings & Security Policies
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6B66' }}>
          Configurable election rules, OTP security parameters, university email relay status, and role access controls.
        </p>
      </div>

      {/* Security credentials warning */}
      <div style={{ background: '#F8F8F6', border: '1px solid #E5E5E2', borderRadius: '8px', padding: '16px', fontSize: '12px', color: '#555550' }}>
        <strong>Security & Privacy Rule 8:</strong> All secret keys, database credentials, and raw OTP tokens are handled server-side only and never exposed in the client UI or application logs.
      </div>

      <div className="notion-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>
          Electoral Rule Enforcement Configurations
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ border: '1px solid #E5E5E2', borderRadius: '6px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>Seconder Quorum Requirement</div>
            <div style={{ fontSize: '12px', color: '#777777', margin: '4px 0 8px' }}>
              Minimum valid resident seconders needed before nomination review:
            </div>
            <input
              type="number"
              value={22}
              readOnly
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #E5E5E2', width: '80px', fontWeight: 600 }}
            />
          </div>

          <div style={{ border: '1px solid #E5E5E2', borderRadius: '6px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>OTP Token Expiry Window</div>
            <div style={{ fontSize: '12px', color: '#777777', margin: '4px 0 8px' }}>
              Duration for student authentication one-time codes:
            </div>
            <select style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #E5E5E2', fontSize: '12px' }}>
              <option>120 seconds (2 minutes)</option>
              <option>300 seconds (5 minutes)</option>
            </select>
          </div>

          <div style={{ border: '1px solid #E5E5E2', borderRadius: '6px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>University Email Gateway</div>
            <div style={{ fontSize: '12px', color: '#777777', margin: '4px 0 8px' }}>
              Institutional SMTP relay connected to @univ.ac.za domain:
            </div>
            <span style={{ fontSize: '11px', background: '#EDF7EE', color: '#1B5E20', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
              ● Operational (Active)
            </span>
          </div>

          <div style={{ border: '1px solid #E5E5E2', borderRadius: '6px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>Quorum Minimum Threshold</div>
            <div style={{ fontSize: '12px', color: '#777777', margin: '4px 0 8px' }}>
              Minimum turnout % required for automatic election validity:
            </div>
            <input
              type="text"
              value="25% of registered roll"
              readOnly
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #E5E5E2', width: '160px', fontSize: '12px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
