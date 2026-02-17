import { useState, useEffect } from 'react';
import { electionsAPI, coalitionsAPI, candidatesAPI, usersAPI, resultsAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalElections: 0, totalVotes: 0 });
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('elections');
  const [selectedElection, setSelectedElection] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showElectionModal, setShowElectionModal] = useState(false);

  // Form states
  const [electionForm, setElectionForm] = useState({ title: '', description: '', startDate: '', endDate: '' });
  const [coalitionForm, setCoalitionForm] = useState({ name: '', symbol: '', color: '#10b981' });
  const [candidateForm, setCandidateForm] = useState({ name: '', position: '', bio: '', image: null });
  const [activeCoalitionTab, setActiveCoalitionTab] = useState('coalitions');
  const [addingCoalition, setAddingCoalition] = useState(false);
  const [electionResults, setElectionResults] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch stats (may fail if not admin)
      try {
        const statsRes = await usersAPI.getStats();
        if (statsRes.data.success) setStats(statsRes.data.stats);
      } catch (statsError) {
        console.log('Stats fetch failed (may not be admin):', statsError.message);
        // Set default stats so dashboard still works
        setStats({ totalUsers: 0, totalElections: 0, totalVotes: 0 });
      }
      
      // Fetch elections (should work for any authenticated user)
      try {
        const electionsRes = await electionsAPI.getAll();
        if (electionsRes.data.success) {
          console.log('Elections fetched:', electionsRes.data.elections);
          setElections(electionsRes.data.elections);
        }
      } catch (electionsError) {
        console.error('Error fetching elections:', electionsError);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await electionsAPI.create(electionForm);
      if (response.data.success) {
        alert(response.data.message || 'Election created successfully!');
        setShowCreateModal(false);
        setElectionForm({ title: '', description: '', startDate: '', endDate: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Create election error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error creating election';
      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (electionId, status) => {
    try {
      const response = await electionsAPI.updateStatus(electionId, status);
      if (response.data.success) {
        fetchData();
      }
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleDeleteElection = async (electionId) => {
    if (!confirm('Are you sure you want to delete this election?')) return;
    try {
      const response = await electionsAPI.delete(electionId);
      if (response.data.success) {
        fetchData();
      }
    } catch (error) {
      alert('Error deleting election');
    }
  };

  const handleAddCoalition = async (e) => {
    e.preventDefault();
    if (!selectedElection) return;
    
    setAddingCoalition(true);
    try {
      const response = await coalitionsAPI.create({
        electionId: selectedElection.id,
        ...coalitionForm
      });
      if (response.data.success) {
        alert('Coalition added successfully!');
        setCoalitionForm({ name: '', symbol: '', color: '#10b981' });
        
        // Close the current modal and reopen to refresh data
        setShowElectionModal(false);
        
        // Small delay to ensure state is cleared before reopening
        setTimeout(async () => {
          await openElectionModal(selectedElection.id);
          setShowElectionModal(true);
        }, 100);
      }
    } catch (error) {
      console.error('Add coalition error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error adding coalition';
      alert(errorMessage);
    } finally {
      setAddingCoalition(false);
    }
  };

  const handleDeleteCoalition = async (coalitionId) => {
    if (!confirm('Are you sure you want to delete this coalition?')) return;
    try {
      const response = await coalitionsAPI.delete(coalitionId);
      if (response.data.success) {
        openElectionModal(selectedElection.id);
      }
    } catch (error) {
      alert('Error deleting coalition');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!selectedElection) return;
    try {
      const formData = new FormData();
      formData.append('electionId', selectedElection.id);
      if (candidateForm.coalitionId) formData.append('coalitionId', candidateForm.coalitionId);
      formData.append('name', candidateForm.name);
      formData.append('position', candidateForm.position);
      formData.append('bio', candidateForm.bio);
      if (candidateForm.image) formData.append('image', candidateForm.image);

      const response = await candidatesAPI.create(formData);
      if (response.data.success) {
        alert('Candidate added successfully!');
        setCandidateForm({ name: '', position: '', bio: '', image: null });
        openElectionModal(selectedElection.id);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding candidate');
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!confirm('Are you sure you want to remove this candidate?')) return;
    try {
      const response = await candidatesAPI.delete(candidateId);
      if (response.data.success) {
        openElectionModal(selectedElection.id);
      }
    } catch (error) {
      alert('Error deleting candidate');
    }
  };

  const openElectionModal = async (electionId) => {
    try {
      const response = await electionsAPI.getById(electionId);
      if (response.data.success) {
        setSelectedElection(response.data.election);
        
        // Use candidatesAPI to get coalitions WITH their members
        const coalitionsRes = await candidatesAPI.getByElection(electionId);
        if (coalitionsRes.data.success) {
          setSelectedElection(prev => ({ 
            ...prev, 
            coalitions: coalitionsRes.data.coalitions 
          }));
        }
        
        // Fetch results for this election
        try {
          const resultsRes = await resultsAPI.getByElection(electionId);
          if (resultsRes.data.success) {
            setElectionResults(resultsRes.data);
          }
        } catch (err) {
          console.log('No results yet');
          setElectionResults(null);
        }
        
        setShowElectionModal(true);
      }
    } catch (error) {
      console.error('Error fetching election:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    try {
      const response = await usersAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (response.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    }
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
        Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-[#10b981] to-[#14b8a6] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <div>
              <p className="text-sm opacity-90">Total Users</p>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#8b5cf6] to-[#6ee7b7] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm opacity-90">Total Elections</p>
              <p className="text-3xl font-bold">{stats.totalElections}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm opacity-90">Total Votes</p>
              <p className="text-3xl font-bold">{stats.totalVotes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="mb-8 p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#10b981] font-medium">
            Remember: Newly created elections start as "Upcoming". Change the status to "Active" in the Manage section to make them visible to voters.
          </p>
        </div>
      </div>

      {/* Elections Section */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Elections Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Create Election
          </button>
        </div>

        {elections.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">No elections created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#10b981] to-[#14b8a6] text-white">
                  <th className="px-4 py-3 text-left rounded-l-xl">Title</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Votes</th>
                  <th className="px-4 py-3 text-left">Start Date</th>
                  <th className="px-4 py-3 text-left">End Date</th>
                  <th className="px-4 py-3 text-left rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
{elections.map((election) => (
                  <tr key={election.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-medium">{election.title}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${election.status}`}>
                        {election.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{election.totalVotes || 0}</td>
                    <td className="px-4 py-3">{formatDate(election.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(election.endDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openElectionModal(election.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => handleDeleteElection(election.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Change Password</h2>
        
        {passwordError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
            {passwordError}
          </div>
        )}
        
        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-300 rounded-lg">
            {passwordSuccess}
          </div>
        )}
        
        <form onSubmit={handleChangePassword} className="max-w-md">
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input"
              required
              minLength={6}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="input"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Change Password</button>
        </form>
      </div>

      {/* Create Election Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-red-500"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Create Election</h2>
            <form onSubmit={handleCreateElection}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  value={electionForm.title}
                  onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={electionForm.description}
                  onChange={(e) => setElectionForm({ ...electionForm, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Start Date</label>
                  <input
                    type="datetime-local"
                    value={electionForm.startDate}
                    onChange={(e) => setElectionForm({ ...electionForm, startDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">End Date</label>
                  <input
                    type="datetime-local"
                    value={electionForm.endDate}
                    onChange={(e) => setElectionForm({ ...electionForm, endDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Create Election'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Election Management Modal */}
      {showElectionModal && selectedElection && (
        <div className="modal-overlay" onClick={() => setShowElectionModal(false)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowElectionModal(false)}
              className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-red-500"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{selectedElection.title}</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              {['coalitions', 'results', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCoalitionTab(tab)}
                  className={`px-4 py-2 font-semibold capitalize ${
                    activeCoalitionTab === tab
                      ? 'text-[#10b981] border-b-2 border-[#10b981]'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Coalitions Tab */}
            {activeCoalitionTab === 'coalitions' && (
              <div>
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h3 className="font-bold mb-4 text-gray-800 dark:text-white">Add Coalition</h3>
                  <form onSubmit={handleAddCoalition} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Coalition Name"
                        value={coalitionForm.name}
                        onChange={(e) => setCoalitionForm({ ...coalitionForm, name: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Symbol"
                        value={coalitionForm.symbol}
                        onChange={(e) => setCoalitionForm({ ...coalitionForm, symbol: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <input
                        type="color"
                        value={coalitionForm.color}
                        onChange={(e) => setCoalitionForm({ ...coalitionForm, color: e.target.value })}
                        className="h-10 w-16 rounded cursor-pointer"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={addingCoalition}>
                      {addingCoalition ? 'Adding...' : 'Add'}
                    </button>
                  </form>
                </div>

                {/* Add Candidate Section */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h3 className="font-bold mb-4 text-gray-800 dark:text-white">Add Candidate</h3>
                  <form onSubmit={handleAddCandidate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <select
                          value={candidateForm.coalitionId || ''}
                          onChange={(e) => setCandidateForm({ ...candidateForm, coalitionId: e.target.value })}
                          className="input"
                          required
                        >
                          <option value="">Select Coalition</option>
                          {selectedElection.coalitions?.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={candidateForm.position}
                          onChange={(e) => setCandidateForm({ ...candidateForm, position: e.target.value })}
                          className="input"
                          required
                        >
                          <option value="">Select Position</option>
                          <option value="chairperson">Chairperson</option>
                          <option value="vice_chair">Vice Chair</option>
                          <option value="secretary">Secretary</option>
                          <option value="sports_person">Sports Person</option>
                          <option value="treasurer">Treasurer</option>
                          <option value="gender_representative">Gender Representative</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Name"
                        value={candidateForm.name}
                        onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                        className="input"
                        required
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCandidateForm({ ...candidateForm, image: e.target.files[0] })}
                        className="input"
                      />
                    </div>
                    <textarea
                      placeholder="Bio"
                      value={candidateForm.bio}
                      onChange={(e) => setCandidateForm({ ...candidateForm, bio: e.target.value })}
                      className="input"
                      rows="2"
                    />
                    <button type="submit" className="btn btn-primary">Add Candidate</button>
                  </form>
                </div>

                {/* Coalitions List */}
                <div className="space-y-4">
                  {selectedElection.coalitions?.map((coalition) => (
                    <div key={coalition.id} className="p-4 border rounded-xl bg-white dark:bg-gray-800">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-white">{coalition.name}</h4>
                          <p className="text-sm text-gray-500">{coalition.symbol || 'No symbol'}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteCoalition(coalition.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {/* Show coalition members */}
                      {coalition.members && coalition.members.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Members ({coalition.members.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {coalition.members.map((member) => (
                              <div key={member.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                                {member.imageUrl ? (
                                  <img 
                                    src={member.imageUrl} 
                                    alt={member.name}
                                    className="w-8 h-8 rounded-full object-cover border border-[#10b981]"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.position.replace(/_/g, ' ')}</p>
                                  <p className="text-sm font-medium text-gray-800 dark:text-white">{member.name}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteCandidate(member.id)}
                                  className="ml-2 text-red-400 hover:text-red-600"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(!coalition.members || coalition.members.length === 0) && (
                        <p className="text-sm text-gray-400 italic mt-2">No members added yet</p>
                      )}
                    </div>
                  ))}
                  {(!selectedElection.coalitions || selectedElection.coalitions.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No coalitions added yet. Add a coalition above.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Tab */}
            {activeCoalitionTab === 'results' && (
              <div>
                {electionResults && electionResults.results?.length > 0 ? (
                  <>
                    {/* Stats */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-[#10b981] to-[#14b8a6] rounded-xl p-4 text-white">
                        <p className="text-sm opacity-90">Total Votes</p>
                        <p className="text-2xl font-bold">{electionResults.totalVotes}</p>
                      </div>
                      <div className="bg-gradient-to-r from-[#8b5cf6] to-[#6ee7b7] rounded-xl p-4 text-white">
                        <p className="text-sm opacity-90">Status</p>
                        <p className="text-2xl font-bold capitalize">{selectedElection.status}</p>
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Doughnut Chart</h4>
                        <div className="h-48">
                          <Doughnut 
                            data={{
                              labels: electionResults.results.map(r => r.name),
                              datasets: [{
                                data: electionResults.results.map(r => r.voteCount),
                                backgroundColor: electionResults.results.map(r => r.color),
                                borderColor: '#fff',
                                borderWidth: 2
                              }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Bar Chart</h4>
                        <div className="h-48">
                          <Bar 
                            data={{
                              labels: electionResults.results.map(r => r.name),
                              datasets: [{
                                label: 'Votes',
                                data: electionResults.results.map(r => r.voteCount),
                                backgroundColor: electionResults.results.map(r => r.color),
                              }]
                            }}
                            options={{ 
                              responsive: true, 
                              maintainAspectRatio: false,
                              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Results List */}
                    <div className="space-y-3">
                      {electionResults.results.map((result) => {
                        const percentage = electionResults.totalVotes > 0 
                          ? (result.voteCount / electionResults.totalVotes) * 100 
                          : 0;
                        return (
                          <div
                            key={result.id}
                            className="p-4 rounded-xl border-l-4 bg-gray-50 dark:bg-gray-800"
                            style={{ borderLeftColor: result.color }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-gray-800 dark:text-white">
                                {result.name}
                              </h4>
                              <span className="text-lg font-bold text-[#10b981]">
                                {result.voteCount} votes
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                              <div
                                className="h-2.5 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: result.color 
                                }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-right">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">
                      No voting data available yet. Votes will appear here once the election starts.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeCoalitionTab === 'settings' && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    value={selectedElection.status}
                    onChange={(e) => handleUpdateStatus(selectedElection.id, e.target.value)}
                    className="input"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Start: {formatDate(selectedElection.startDate)}</p>
                  <p className="text-sm text-gray-500">End: {formatDate(selectedElection.endDate)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;

