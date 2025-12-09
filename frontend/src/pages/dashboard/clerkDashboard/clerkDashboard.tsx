import { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useChatbot } from '../../../context/ChatbotContext';
// import { usePdfExport } from '../../../hooks/usePdfExport';

import { 
  getCategoryCommentsCountAsync, 
  getCommentsByPostIdAsync, 
  getCommentsCountAsync, 
  getCommentsWeightageAsync 
} from '@/store/slices/commentSlice';
import { useCommentSocketUpdates } from '@/hooks/useCommentSocketUpdates';

// Components
import AlertsSection from '../commentDashboard/components/AlertsSection';
import CommentSummary from '../commentDashboard/components/CommentSummary';
import { FeaturedComment } from '../commentDashboard/components/FeaturedComment';

// import AIAgentChatbot from '../AIAgentChatbot';
import ReportTemplate from '../../../components/dashboard/ReportTemplate';
import { UserCheck } from 'lucide-react';

const dashboardData = {
  alerts: [
    {
      id: '1',
      title: 'New Policy Update',
      description: 'Review the latest circular regarding digital archiving protocols.',
      count: 1,
      alertType: 'info' as const
    },
    {
      id: '2',
      title: 'Pending Approvals',
      description: 'You have 5 comment moderation requests pending.',
      count: 5,
      alertType: 'warning' as const
    }
  ]
};

const ClerkDashboard = () => {
  const { isOpen } = useChatbot();
  const dispatch = useAppDispatch();
  const params = useParams<{ draftId: string }>();
  // Use param draftId or fallback to default demo ID
  const draftId = params.draftId || 'a90315d4-b2b1-4836-a848-b47e318a5fa5';
  
  // Get Redux state first
  const { 
    loading, 
    error, 
    comments,
    commentCounts,
  } = useAppSelector(state => state.comment);
  
  // Use draftId as postId
  const postId = draftId;

  // PDF Export
//   const { exportToPdf } = usePdfExport();
  const reportRef = useRef<HTMLDivElement>(null);

//   const handleExportClick = () => {
//     if (reportRef.current) {
//       exportToPdf(reportRef, { fileName: `ClerkReport_${postId}.pdf` });
//     }
//   };

  // Initialize comprehensive socket connection for real-time updates
  const { connections, errors } = useCommentSocketUpdates({
    initialData: {
      positive: commentCounts?.positive || 0,
      negative: commentCounts?.negative || 0,
      neutral: commentCounts?.neutral || 0,
      total: commentCounts?.total || 0
    },
    autoConnect: true
  });

  // Log socket connection status
  useEffect(() => {
    const errorList = Object.entries(errors)
      .filter(([, error]) => error)
      .map(([type, error]) => `${type}: ${error}`);
    
    if (errorList.length > 0) {
      console.error('🚨 [ClerkDashboard] Socket errors:', errorList);
    }
  }, [connections, errors]);
  
  // Create stable fetch function
  const fetchData = useCallback(() => {
    if (postId) {
      dispatch(getCommentsCountAsync(postId));
      dispatch(getCategoryCommentsCountAsync(postId));
      dispatch(getCommentsWeightageAsync(postId));
      dispatch(getCommentsByPostIdAsync(postId));
    }
  }, [dispatch, postId]);
  
  // Fetch data immediately when component mounts or postId changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show loading for invalid postId
  if (!postId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7fafd] to-[#eaf1fb] font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Draft ID</h2>
          <p className="text-gray-600 mb-4">The draft you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7fafd] to-[#eaf1fb] font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0846AA] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Dashboard Data...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching analytics for draft: {postId}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7fafd] to-[#eaf1fb] font-sans flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-500 text-sm mb-4">Draft ID: {postId}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#0846AA] text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white font-sans relative min-h-screen transition-all duration-300 ${isOpen ? 'w-1/2' : 'w-full'}`}>    
      {/* Hidden Report Template for PDF export */}
      <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
        <ReportTemplate ref={reportRef} title={`Clerk Report for Draft ID: ${postId}`} subtitle="Comment Moderation and Analysis">
          <AlertsSection alerts={dashboardData.alerts} />
          <div className="mt-4">
            <FeaturedComment />
          </div>
          <div className="mt-4">
            <CommentSummary comments={comments} />
          </div>
        </ReportTemplate>
      </div>

      {/* No Sidebar for Clerk Dashboard as requested */}
      <div className="py-4 w-full">
        <div className="w-full px-6">
          
          {/* Role Template Indicator */}
          <div className="mb-6 bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3 border-t-4 border-t-[#0846AA]">
            <div className="bg-blue-50 p-2 rounded-full">
                <UserCheck className="w-6 h-6 text-[#0846AA]" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[#092044]">Role Template: Clerk</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Moderation Access</p>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="space-y-6">
            
            {/* Alerts Section */}
            <section>
              <AlertsSection alerts={dashboardData.alerts} />
            </section>

            {/* Featured & Comments Grid */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column: Featured Negative Comments (Smaller width) */}
              <div className="xl:col-span-4">
                <FeaturedComment />
              </div>

              {/* Right Column: Latest Comments List (Larger width) */}
              <div className="xl:col-span-8">
                <CommentSummary comments={comments} />
              </div>
            </section>

          </div>

          {/* <div className="flex justify-center mt-10 mb-8">
            <button 
              onClick={handleExportClick} 
              disabled={isExporting}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-lg font-medium shadow-md transition-transform hover:scale-105"
            >
              {isExporting ? 'Exporting...' : 'Export Clerk Report to PDF'}
            </button>
          </div> */}
        </div>
      </div>
      {/* <AIAgentChatbot /> */}
    </div>
  );
};

export default ClerkDashboard;
