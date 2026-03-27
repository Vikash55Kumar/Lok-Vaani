import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useParams } from 'react-router-dom';
import SentimentBreakdown from './components/SentimentBreakdown';
import SentimentAnalysis from './components/SentimentAnalysis';
import WordCloud from './components/WordCloud';
import CommentHeading from './components/CommentHeading';
// import { FeaturedComment } from './components/FeaturedComment';
import { useEffect, useCallback, useRef } from 'react';
// import { useAuth } from '@/context/useAuth';
import { getCategoryCommentsCountAsync, getCommentsByPostIdAsync, getCommentsCountAsync, getCommentsWeightageAsync } from '@/store/slices/commentSlice';
// import SummariesByCategory from './components/SummariesByCategory';
import { useCommentSocketUpdates } from '@/hooks/useCommentSocketUpdates';
import { CommentSummary, Sidebar } from './components';
import SentimentLineChart from './components/SentimentLineChart';
import AIAgentChatbot from '../AIAgentChatbot';
import { useChatbot } from '../../../context/ChatbotContext';
import { cn } from '@/lib/utils';

import { usePdfExport } from '../../../hooks/usePdfExport'; // Import the hook
import ReportTemplate from '../../../components/dashboard/ReportTemplate'; // Import the template

const dashboardData = {
  alerts: [
    {
      id: '1',
      title: 'High Negative Sentiment Detected',
      description: 'Recent comments show increased negative sentiment. Immediate attention required.',
      count: 23,
      alertType: 'warning' as const
    },
    {
      id: '2',
      title: 'Processing Queue Status',
      description: 'Some comments are pending analysis due to high volume.',
      count: 8,
      alertType: 'info' as const
    }
  ],
  trendData: [
    { week: 'Week 1', positive: 65, negative: 20, neutral: 15 },
    { week: 'Week 2', positive: 70, negative: 15, neutral: 15 },
    { week: 'Week 3', positive: 75, negative: 10, neutral: 15 },
    { week: 'Week 4', positive: 80, negative: 8, neutral: 12 }
  ]
};

const CommentAnalysis = () => {
  const { isOpen } = useChatbot();
  const dispatch = useAppDispatch();
  const { draftId } = useParams<{ draftId: string }>();
  
  // Get Redux state first
  const { 
    loading, 
    error, 
    comments,
    commentCounts,
  } = useAppSelector(state => state.comment);
  
  // Use draftId as postId, with proper validation
  const postId = draftId;

  // PDF Export
  const { exportToPdf, isExporting } = usePdfExport();
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportClick = () => {
    if (reportRef.current) {
      exportToPdf(reportRef, { fileName: `CommentAnalysisReport_${postId}.pdf` });
    }
  };

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
      console.error('🚨 [CommentAnalysis] Socket errors:', errorList);
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

  // Show loading state - always show loading when data is being fetched
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
        <ReportTemplate ref={reportRef} title={`Comment Analysis for Draft ID: ${postId}`} subtitle="Detailed Sentiment and Activity Report">
          {/* Render the key components you want in the PDF */}
          <CommentHeading />
          <div className='w-full bg-white rounded-md shadow-md transition-all duration-300 mt-2'>
            <SentimentLineChart data={dashboardData.trendData} />
          </div>
          <div className='mt-2'>
            <WordCloud />
          </div>
          <SentimentAnalysis />
          <SentimentBreakdown />
          <div className='mt-2'>
            <CommentSummary comments={comments} />
          </div>
        </ReportTemplate>
      </div>

      <Sidebar />
      <div className="py-4 ml-14">
        <div className="w-full px-2">
          {/* Main Heading and Featured Comments */}
          <div className={cn("flex flex-col gap-4 items-start", !isOpen && "xl:flex-row")}>
            <div className={cn("w-full", !isOpen && "xl:w-[60%]")}>
              <CommentHeading />
  
              {/* Sentiment Trends Chart */}
              <div className='w-full bg-white rounded-md shadow-md transition-all duration-300 mt-2'>
                <SentimentLineChart data={dashboardData.trendData} />
              </div>

              {/* Word Cloud Section */}
              <div className='mt-2'>
                 <WordCloud />
              </div>
            </div>
            <div className={cn("w-full", !isOpen && "xl:w-[40%]")}>
              <SentimentAnalysis />
            </div>
          </div>

          {/* Summary of Feedback Section */}
          <section className="mb-14">

            <div className="grid grid-cols-1">
              {/* Sentiment Breakdown Section */}
              <SentimentBreakdown />


           {/* Actionable Insights Section */}
           <div className="mb-4">
              <div className='mt-2'>
            <CommentSummary comments={comments} />
          </div>
             
           </div>
            </div>
          </section>
          <div className="flex justify-center mb-8">
            <button 
              onClick={handleExportClick} 
              disabled={isExporting}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-lg font-medium"
            >
              {isExporting ? 'Exporting...' : 'Export Full Dashboard to PDF'}
            </button>
          </div>
        </div>
      </div>
      <AIAgentChatbot />
    </div>
  );
};

export default CommentAnalysis;