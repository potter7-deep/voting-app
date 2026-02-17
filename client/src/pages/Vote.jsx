import { useState, useEffect } from 'react';
import { electionsAPI, candidatesAPI, votesAPI } from '../services/api';

const Vote = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState(null);
  const [coalitions, setCoalitions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [votingFor, setVotingFor] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteMessage, setVoteMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchActiveElections();
  }, []);

  const fetchActiveElections = async () => {
    try {
      const response = await electionsAPI.getActive();
      if (response.data.success) {
        setElections(response.data.elections);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  };

  const openVotingModal = async (election) => {
    setSelectedElection(election);
    setModalOpen(true);
    setVoteMessage({ type: '', text: '' });

    try {
      const [candidatesRes, voteRes] = await Promise.all([
        candidatesAPI.getByElection(election.id),
        votesAPI.check(election.id)
      ]);

      if (candidatesRes.data.success) {
        setCoalitions(candidatesRes.data.coalitions);
      }
      if (voteRes.data.success) {
        setHasVoted(voteRes.data.hasVoted);
      }
    } catch (error) {
      console.error('Error fetching election data:', error);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedElection(null);
    setCoalitions([]);
    setHasVoted(false);
    setVoteMessage({ type: '', text: '' });
  };

  const castVote = async (coalitionId) => {
    if (!selectedElection) return;

    setVotingFor(coalitionId);
    try {
      const response = await votesAPI.cast({
        electionId: selectedElection.id,
        coalitionId
      });

      if (response.data.success) {
        setVoteMessage({ type: 'success', text: response.data.message });
        setHasVoted(true);
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        setVoteMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setVoteMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error casting vote' 
      });
    } finally {
      setVotingFor(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPosition = (position) => {
    return position.replace(/_/g, ' ').split(' ').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10b981]"></div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
        Active Elections
      </h1>

      {elections.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1e293b] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Active Elections
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            There are currently no active elections. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.map((election) => (
            <div
              key={election.id}
              className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10b981] to-[#14b8a6]"></div>
              
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex-1">
                  {election.title}
                </h2>
                <span className="status-badge active">Active</span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {election.description}
              </p>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>Ends: {formatDate(election.endDate)}</span>
              </div>
              
              <button
                onClick={() => openVotingModal(election)}
                className="btn btn-primary w-full"
              >
                View Candidates & Vote
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Voting Modal */}
      {modalOpen && selectedElection && (
        <div className="modal-overlay" onClick={closeModal}>
          <div 
            className="modal-content max-w-4xl w-full mx-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
              {selectedElection.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {selectedElection.description}
            </p>

            {voteMessage.text && (
              <div className={`mb-6 p-4 rounded-lg ${
                voteMessage.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {voteMessage.text}
              </div>
            )}

            {hasVoted ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-[#10b981] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  You Have Already Voted
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Thank you for participating in this election.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select a coalition to cast your vote:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                  {coalitions.map((coalition) => (
                    <div
                      key={coalition.id}
                      className="border-2 rounded-xl p-4 bg-white dark:bg-[#1e293b] transition-all hover:shadow-lg"
                      style={{ borderColor: coalition.color || '#10b981' }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                          {coalition.name}
                        </h3>
                        <span className="px-2 py-1 bg-[#10b981] text-white text-xs font-semibold rounded-full">
                          {coalition.members?.length || 0} Members
                        </span>
                      </div>

                      <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                        {coalition.members?.map((member) => (
                          <div key={member.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            {member.imageUrl ? (
                              <img
                                src={member.imageUrl}
                                alt={member.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-[#10b981]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                {formatPosition(member.position)}
                              </p>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {member.name}
                              </p>
                              {member.bio && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 line-clamp-2">
                                  "{member.bio}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {coalition.members?.length > 0 && (
                        <button
                          onClick={() => castVote(coalition.id)}
                          disabled={votingFor === coalition.id}
                          className="btn btn-primary w-full text-sm"
                        >
                          {votingFor === coalition.id ? 'Voting...' : 'Vote for this Coalition'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
              <p>Election ends: {formatDate(selectedElection.endDate)}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Vote;

