import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resultsAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Results = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchResults(selectedElection.id);
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      const response = await resultsAPI.getAll();
      if (response.data.success) {
        setElections(response.data.elections);
        if (response.data.elections.length > 0) {
          setSelectedElection(response.data.elections[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (electionId) => {
    try {
      const response = await resultsAPI.getByElection(electionId);
      if (response.data.success) {
        setResults(response.data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
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

  const chartData = {
    labels: results?.results?.map(r => r.name) || [],
    datasets: [{
      data: results?.results?.map(r => r.voteCount) || [],
      backgroundColor: results?.results?.map(r => r.color) || [],
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  const barChartData = {
    labels: results?.results?.map(r => r.name) || [],
    datasets: [{
      label: 'Votes Received',
      data: results?.results?.map(r => r.voteCount) || [],
      backgroundColor: results?.results?.map(r => r.color) || [],
      borderColor: results?.results?.map(r => r.color) || [],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
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
        Voting Results
      </h1>

      {elections.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1e293b] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Elections Available
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            There are currently no completed or active elections to view results for.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Elections Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sticky top-24">
              <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Elections</h3>
              <div className="space-y-2">
                {elections.map((election) => (
                  <button
                    key={election.id}
                    onClick={() => setSelectedElection(election)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedElection?.id === election.id
                        ? 'bg-gradient-to-r from-[#10b981] to-[#14b8a6] text-white shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm line-clamp-1">{election.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        election.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {election.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="lg:col-span-3">
            {results && selectedElection && (
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
                  {results.election.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {results.election.description}
                </p>

                {/* Stats */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-gradient-to-r from-[#10b981] to-[#14b8a6] rounded-xl p-4 text-white">
                    <p className="text-sm opacity-90">Total Votes</p>
                    <p className="text-3xl font-bold">{results.totalVotes}</p>
                  </div>
                  <div className="bg-gradient-to-r from-[#8b5cf6] to-[#6ee7b7] rounded-xl p-4 text-white">
                    <p className="text-sm opacity-90">Status</p>
                    <p className="text-3xl font-bold capitalize">{results.election.status}</p>
                  </div>
                </div>

                {/* Charts */}
                {results.totalVotes > 0 && results.results?.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
                        Vote Distribution - Doughnut Chart
                      </h3>
                      <div className="h-64">
                        <Doughnut data={chartData} options={chartOptions} />
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
                        Vote Distribution - Bar Chart
                      </h3>
                      <div className="h-64">
                        <Bar data={barChartData} options={barChartOptions} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Results List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Coalition Results
                  </h3>
                  {results.results?.map((result) => {
                    const percentage = results.totalVotes > 0 
                      ? (result.voteCount / results.totalVotes) * 100 
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
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Results;

