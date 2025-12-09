import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { getCurrentUserAsync } from './store/slices/authSlice';
import { useSocketProgress } from './hooks/useSocketProgress';


// Public Pages
import About from './pages/general/About';
import Pricing from './pages/general/Pricing';
// import Help from './pages/general/Help';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Private Pages
// import Dashboard from './pages/dashboard/Dashboard';
import AdminDashboard from './pages/dashboard/adminDashboard/AdminDashboard';
import BureaucratsDashboard from './pages/dashboard/bureaucratsDashboard/BureaucratsDashboard';
import ClerkDashboard from './pages/dashboard/clerkDashboard/clerkDashboard';
import MinistryDashboard from './pages/dashboard/ministryDashboard/ministryDashboard';
import DraftPage from './pages/general/drafts';
// import UserReports from './pages/dashboard/userDashboard/UserReports';
// import SearchHistory from './pages/dashboard/userDashboard/SearchHistory';
import HomePage from './pages/home/HomePage';
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import CommentList from './pages/dashboard/commentDashboard/CommentList';
import { getPostsAsync } from './store/slices/postSlice';
import CommentAnalysis from './pages/dashboard/commentDashboard/CommentAnalysis';
import { socketUrl } from './utils/baseApi';

import OverallSummary from './pages/dashboard/commentDashboard/OverallSummary';
import Alerts from './pages/dashboard/commentDashboard/Alerts';
import UserCommentPage from './pages/usercomment/UserCommentPage';

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);

  // Get comment data for socket initialization
  const { commentCounts } = useAppSelector(state => state.comment);
  
  // Initialize global socket connection
  const { isConnected, error: socketError } = useSocketProgress({
    endpoint: `${socketUrl}`,
    eventName: 'total-count-update',
    initialData: {
      positive: commentCounts?.positive || 0,
      negative: commentCounts?.negative || 0,
      neutral: commentCounts?.neutral || 0,
      total: commentCounts?.total || 0
    },
    autoConnect: true // Auto-connect globally
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUserAsync());
    }
    dispatch(getPostsAsync());
  }, [dispatch]);

  // Log socket connection status
  useEffect(() => {
    if (isConnected) {
      console.log('🌐 [App] Global socket connection established');
    }
    if (socketError) {
      console.error('🚨 [App] Global socket error:', socketError);
    }
  }, [isConnected, socketError]);

  return (
    <>
      <ToastContainer 
        position="top-center"  // This will show the toast in the center of the screen
        autoClose={3000}  // Toast will disappear after 3 seconds
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        closeButton={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/drafts" element={isAuthenticated ? <DraftPage /> : <Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/drafts/comment-analysis/:draftId" element={isAuthenticated ? <CommentAnalysis /> : <Login />} />
            <Route path="/drafts/comments-list" element={isAuthenticated ? <CommentList /> : <Login />} />
            <Route path="/drafts/overall-summary" element={isAuthenticated ? <OverallSummary /> : <Login />} />
            <Route path="/drafts/alerts" element={isAuthenticated ? <Alerts /> : <Login />} />
            <Route path="/user-comment" element={isAuthenticated ? <UserCommentPage /> : <Login />} />
            <Route path="/bdashboard" element={isAuthenticated ? <BureaucratsDashboard /> : <Login />} />
            <Route path="/cdashboard" element={isAuthenticated ? <ClerkDashboard /> : <Login />} />
            <Route path="/mdashboard" element={isAuthenticated ? <MinistryDashboard /> : <Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/active" element={<div>frontend active</div>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main> 
        <Footer />
      </div>
    </>
  );
}

export default App;
