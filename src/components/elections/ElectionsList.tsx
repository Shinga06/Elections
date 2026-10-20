import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Users, 
  Vote, 
  CheckCircle2, 
  ChevronRight,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Election, ElectionStatus } from '../../types/election';

interface ElectionsListProps {
  elections: Election[];
  onSelectElection: (election: Election) => void;
  onCreateElection: () => void;
  searchTerm?: string;
}

export const ElectionsList: React.FC<ElectionsListProps> = ({
  elections,
  onSelectElection,
  onCreateElection,
  searchTerm = '',
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>(searchTerm);

  const filteredElections = elections.filter((e) => {
    const matchesSearch = 
      e.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      e.residenceName.toLowerCase().includes(localSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#242424', letterSpacing: '-0.02em' }}>
            Elections
          </h1>
          <p style={{ fontSize: '13px', color: '#6B6B66' }}>
            Manage residence House Committee electoral cycles, schedule periods, and oversee balloting.
          </p>
        </div>
        <button onClick={onCreateElection} className="btn btn-primary">
          <Plus size={15} />
          Create New Election
        </button>
      </div>

      {/* Notion Database Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          background: '#FFFFFF',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid #E5E5E2',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search size={15} color="#8E8E89" />
          <input
            type="text"
            placeholder="Filter elections by residence or title..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              width: '100%',
              color: '#242424',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#777777' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #E5E5E2',
              backgroundColor: '#F7F7F5',
              color: '#242424',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Statuses ({elections.length})</option>
            <option value="Voting Open">Voting Open</option>
            <option value="Nominations Open">Nominations Open</option>
            <option value="Awaiting Certification">Awaiting Certification</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Database Table View */}
      <div className="notion-table-container">
        <table className="notion-table">
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Election Title & Residence</th>
              <th style={{ width: '15%' }}>Status</th>
              <th style={{ width: '18%' }}>Nomination Window</th>
              <th style={{ width: '18%' }}>Voting Window</th>
              <th style={{ width: '9%' }}>Voters</th>
              <th style={{ width: '8%', textAlign: 'right' }}>Turnout</th>
            </tr>
          </thead>
          <tbody>
            {filteredElections.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#8E8E89' }}>
                  No elections found matching criteria.
                </td>
              </tr>
            ) : (
              filteredElections.map((election) => (
                <tr
                  key={election.id}
                  onClick={() => onSelectElection(election)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: '#242424', fontSize: '13px' }}>
                      {election.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#777777', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{election.residenceName}</span>
                      <span>•</span>
                      <span>{election.portfolios.length} Portfolios</span>
                      {election.tieFlagged && (
                        <span style={{ color: '#DC2626', fontWeight: 600 }}>• Tie Flagged</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={election.status} />
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#555550' }}>{election.nominationStart.split(' ')[0]}</div>
                    <div style={{ fontSize: '11px', color: '#8E8E89' }}>to {election.nominationEnd.split(' ')[0]}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#555550' }}>{election.votingStart.split(' ')[0]}</div>
                    <div style={{ fontSize: '11px', color: '#8E8E89' }}>to {election.votingEnd.split(' ')[0]}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#242424' }}>
                      {election.eligibleVoterCount}
                    </div>
                    <div style={{ fontSize: '10px', color: '#8E8E89' }}>
                      {election.approvedCandidateCount} cands
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: election.turnoutPercentage > 0 ? '#7656C9' : '#8E8E89' }}>
                      {election.turnoutPercentage}%
                    </div>
                    <div style={{ fontSize: '10px', color: '#8E8E89' }}>
                      {election.totalBallotsCast} ballots
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
