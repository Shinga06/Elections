import React from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const events = [
    {
      date: 'Oct 01 - Oct 12',
      title: 'Olympus Hall Nominations Window',
      category: 'Nominations',
      status: 'Completed',
      desc: '22 verified seconders required per nominee.',
    },
    {
      date: 'Oct 14 - Oct 24',
      title: 'Acacia House Nominations Window',
      category: 'Nominations',
      status: 'Active',
      desc: 'Collecting seconders on West Campus roll.',
    },
    {
      date: 'Oct 18 - Oct 21',
      title: 'Olympus Hall Voting Period',
      category: 'Voting',
      status: 'Active',
      desc: 'Secret ballot voting across Chairperson, Project Officer, Secretary.',
    },
    {
      date: 'Oct 26, 14:00',
      title: 'Marula Heights Tie Resolution Session',
      category: 'Committee',
      status: 'Scheduled',
      desc: 'Election Review Committee meeting to resolve Chairperson deadlock.',
    },
    {
      date: 'Oct 28 - Oct 30',
      title: 'Acacia House Voting Period',
      category: 'Voting',
      status: 'Scheduled',
      desc: 'Representative tier voting (House Rep 1 & 2).',
    },
    {
      date: 'Nov 02',
      title: 'Official Results Publication to Senate',
      category: 'Publication',
      status: 'Scheduled',
      desc: 'Certified results published on public student portal.',
    },
  ];

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
          Electoral Calendar & Timelines
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6B66' }}>
          Statutory deadlines, nomination periods, voting windows, and committee review sessions.
        </p>
      </div>

      <div className="notion-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>
            October - November 2026 Schedule
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm"><ChevronLeft size={14} /></button>
            <button className="btn btn-secondary btn-sm"><ChevronRight size={14} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {events.map((ev, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '8px',
                background: ev.status === 'Active' ? '#F7F4FD' : '#FAF9F8',
                border: ev.status === 'Active' ? '1px solid #D8CCE8' : '1px solid #EAEAE7',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E5E2',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#242424',
                    minWidth: '130px',
                    textAlign: 'center',
                  }}
                >
                  {ev.date}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B6B66', marginTop: '2px' }}>
                    {ev.desc}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: ev.status === 'Active' ? '#EDF7EE' : (ev.status === 'Completed' ? '#F1F1EF' : '#FFF8E1'),
                  color: ev.status === 'Active' ? '#1B5E20' : (ev.status === 'Completed' ? '#555550' : '#8D6B00'),
                }}
              >
                {ev.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
