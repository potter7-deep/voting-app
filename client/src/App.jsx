import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Vote from './pages/Vote';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/vote" />;
  }

  return children;
};

const AppRoutes = () => {
  const { isLoggedIn, isAdmin } = useAuth();

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={
              isLoggedIn ? (isAdmin ? <Navigate to="/dashboard" /> : <Navigate to="/vote" />) : <Home />
            } />
            <Route path="/login" element={isLoggedIn ? <Navigate to={isAdmin ? "/dashboard" : "/vote"} /> : <Login />} />
            <Route path="/register" element={isLoggedIn ? <Navigate to={isAdmin ? "/dashboard" : "/vote"} /> : <Register />} />
            <Route path="/vote" element={
              <ProtectedRoute>
                <Vote />
              </ProtectedRoute>
            } />
            <Route path="/results" element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute adminOnly>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

