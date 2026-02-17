import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-br from-white to-[#f0fdf4] dark:from-[#1e293b] dark:to-[#0f3d2a] border-b-2 border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/img/test.png" 
              alt="K" 
              className="w-60 h-10 object-contain bg-transparent"
            />
            
            {/* <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase">
                Dedan Kimathi University
              </span>
              <span className="text-lg font-bold bg-gradient-to-r from-[#10b981] to-[#14b8a6] bg-clip-text text-transparent">
                Voting System
              </span>
            </div> */}
          </Link>

          {/* Menu */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full bg-gradient-to-r from-[#10b981] to-[#14b8a6] text-white shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300"
              title="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            {isLoggedIn ? (
              <>
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium hidden sm:block">
                  Welcome, {user?.name}
                </span>
                
                {isAdmin ? (
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 text-[#10b981] font-semibold hover:bg-[#10b981]/10 rounded-lg transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/vote"
                    className="px-4 py-2 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Vote Now
                  </Link>
                )}
                
                <Link
                  to="/results"
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Results
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-[#10b981] to-[#14b8a6] text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

