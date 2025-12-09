import { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useChatbot } from '../../../context/ChatbotContext';
import { usePdfExport } from '../../../hooks/usePdfExport';
import { cn } from '@/lib/utils';
import { 
  getCategoryCommentsCountAsync, 
  getCommentsByPostIdAsync, 
  getCommentsCountAsync, 
  getCommentsWeightageAsync,
  updateSocketWeightage
} from '@/store/slices/commentSlice';
import { useCommentSocketUpdates } from '@/hooks/useCommentSocketUpdates';
import { useSocketProgress } from '@/hooks/useSocketProgress';
import { socketUrl } from '@/utils/baseApi';

// Components
import CommentHeading from '../commentDashboard/components/CommentHeading';
import SentimentLineChart from '../commentDashboard/components/SentimentLineChart';
import WordCloud from '../commentDashboard/components/WordCloud';
import SentimentDonutChart from '../commentDashboard/components/SentimentDonutChart';
import ClauseDonutChart from '../commentDashboard/components/ClauseDonutChart';
import SentimentWeightageChart from '../commentDashboard/components/SentimentWeightageChart';
import { FeaturedComment } from '../commentDashboard/components/FeaturedComment';
import SummariesByCategory from '../commentDashboard/components/SummariesByCategory';

import AIAgentChatbot from '../AIAgentChatbot';
import ReportTemplate from '../../../components/dashboard/ReportTemplate';
import { Landmark, PieChart, ChartColumnBig } from 'lucide-react';

// Interface for weighted socket data
interface WeightedSocketData {
  totalAnalyzedComments: number;
  totalWeightedScore: number;
  weightedPercentages: {
    positive: number;
    negative: number;
    neutral: number;
  };
  categoryBreakdown?: {
    user: {
      positive: number;
      negative: number;
      neutral: number;
      totalWeight: number;
    };
    business: {
      positive: number;
      negative: number;
      neutral: number;
      totalWeight: number;
    };
  };
  rawWeights?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

const dashboardData = {
  trendData: [
    { week: 'Week 1', positive: 65, negative: 20, neutral: 15 },
    { week: 'Week 2', positive: 70, negative: 15, neutral: 15 },
    { week: 'Week 3', positive: 75, negative: 10, neutral: 15 },
    { week: 'Week 4', positive: 80, negative: 8, neutral: 12 }
  ]
};

const MinistryDashboard = () => {
  const { isOpen } = useChatbot();
  const dispatch = useAppDispatch();
  const params = useParams<{ draftId: string }>();
  // Use param draftId or fallback to default demo ID
  const draftId = params.draftId || 'a90315d4-b2b1-4836-a848-b47e318a5fa5';
  
  // Get Redux state first
  const { 
    loading, 
    error, 
    commentCounts,
    commentsWeightage
  } = useAppSelector(state => state.comment);
  
  // Use draftId as postId
  const postId = draftId;

  // PDF Export
  const { exportToPdf, isExporting } = usePdfExport();
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportClick = () => {
    if (reportRef.current) {
      exportToPdf(reportRef, { fileName: `MinistryReport_${postId}.pdf` });
    }
  };

  // 1. Initialize comprehensive socket connection for basic counts
  const { connections, errors } = useCommentSocketUpdates({
    initialData: {
      positive: commentCounts?.positive || 0,
      negative: commentCounts?.negative || 0,
      neutral: commentCounts?.neutral || 0,
      total: commentCounts?.total || 0
    },
    autoConnect: true
  });

  // 2. Initialize socket for weighted analysis updates
  const { isConnected: isWeightedConnected, data: weightedSocketDataRaw } = useSocketProgress({
    endpoint: `${socketUrl}`,
    eventName: 'weighted-total-count-update',
    initialData: {
      positive: commentsWeightage?.weightedPercentages?.positive || 0,
      negative: commentsWeightage?.weightedPercentages?.negative || 0,
      neutral: commentsWeightage?.weightedPercentages?.neutral || 0,
      total: commentsWeightage?.totalAnalyzedComments || 0
    },
    autoConnect: true
  });

  const weightedSocketData = weightedSocketDataRaw as unknown as WeightedSocketData;

  // Update Redux store when weighted socket data changes
  useEffect(() => {
    if (weightedSocketDataRaw && isWeightedConnected) {
      dispatch(updateSocketWeightage(weightedSocketDataRaw as unknown as WeightedSocketData));
    }
  }, [weightedSocketDataRaw, isWeightedConnected, dispatch]);

  // Log socket connection status
  useEffect(() => {
    const errorList = Object.entries(errors)
      .filter(([, error]) => error)
      .map(([type, error]) => `${type}: ${error}`);
    
    if (errorList.length > 0) {
      console.error('🚨 [MinistryDashboard] Socket errors:', errorList);
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
        <ReportTemplate ref={reportRef} title={`Ministry Report for Draft ID: ${postId}`} subtitle="Comprehensive Sentiment Analysis and Feedback">
          <CommentHeading />
          <div className='w-full bg-white rounded-md shadow-md transition-all duration-300 mt-2'>
            <SentimentLineChart data={dashboardData.trendData} />
          </div>
          <div className='mt-2'>
            <WordCloud />
          </div>
          {/* Charts for PDF */}
          <div className="w-full flex flex-row gap-1.5 mt-2">
            <div className="w-2/4 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
              <div className="px-3 py-2 bg-blue-900 flex items-center shrink-0">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-white" />
                  Overall Sentiment Distribution by Weightage
                </h3>
              </div>
              <div className="pt-4 flex-1">
                <SentimentDonutChart 
                  data={weightedSocketData?.weightedPercentages || commentsWeightage?.weightedPercentages || { positive: 0, negative: 0, neutral: 0 }} 
                />
              </div>
            </div>
            <div className="w-2/4 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
              <div className="px-3 py-2 bg-blue-900 flex items-center shrink-0">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-white"/>
                  Clause By Analysis
                </h3>
              </div>
              <div className="pt-4 flex-1">
                <ClauseDonutChart />
              </div>
            </div>
          </div>
          <div className="w-full mt-2 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
            <div className="px-3 py-2 bg-blue-900 flex items-center shrink-0">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <ChartColumnBig className="w-5 h-5 text-white"/>
                Overall Sentiment Distribution by Category
              </h3>
            </div>
            <div className="pt-1 flex-1">
              <SentimentWeightageChart data={[
                { category: 'Users', positive: 45, negative: 25, neutral: 30 },
              ]} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <FeaturedComment />
            <SummariesByCategory />
          </div>
        </ReportTemplate>
      </div>

      {/* No Sidebar for Ministry Dashboard */}
      <div className="py-4 w-full">
        <div className="w-full px-6">
          
          {/* Role Template Indicator */}
          <div className="mb-6 bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3 border-t-4 border-t-[#0846AA]">
            <div className="bg-blue-50 p-2 rounded-full">
                <Landmark className="w-6 h-6 text-[#0846AA]" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[#092044]">Role Template: Ministry</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Strategic Access</p>
            </div>
          </div>

          {/* --- VISUAL ANALYTICS SECTION --- */}
          <div className={cn("flex flex-col gap-4 items-start mb-8", !isOpen && "xl:flex-row")}>
            
            {/* Left Column (60%) - Trends & WordCloud */}
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

            {/* Right Column (40%) - Donut & Bar Charts */}
            <div className={cn("w-full", !isOpen && "xl:w-[40%]")}>
              <div className="w-full flex flex-row gap-1.5">
                {/* Weighted Donut Chart */}
                <div className="w-2/4 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
                  <div className="px-3 py-2 bg-blue-900 flex items-center shrink-0">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-white" />
                      Weightage Dist.
                    </h3>
                  </div>
                  <div className="pt-4 flex-1">
                    <SentimentDonutChart 
                      data={weightedSocketData?.weightedPercentages || commentsWeightage?.weightedPercentages || { positive: 0, negative: 0, neutral: 0 }} 
                    />
                  </div>
                </div>

                {/* Clause Donut Chart */}
                <div className="w-2/4 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
                  <div className="px-3 py-2 bg-blue-900 flex items-center shrink-0">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-white"/>
                      Clause Analysis
                    </h3>
                  </div>
                  <div className="pt-4 flex-1">
                    <ClauseDonutChart />
                  </div>
                </div>
              </div>

              {/* Weightage Bar Chart */}
              <div className="w-full mt-2 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
                <div className="px-3 py-2 bg-blue-900 flex items-center shrink-0">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <ChartColumnBig className="w-5 h-5 text-white"/>
                    Overall Sentiment Distribution by Category
                  </h3>
                </div>
                <div className="pt-1 flex-1">
                  <SentimentWeightageChart data={[
                    { category: 'Users', positive: 45, negative: 25, neutral: 30 },
                  ]} />
                </div>
              </div>
            </div>
          </div>

          {/* --- OPERATIONAL SECTION (Featured & Summaries) --- */}
          <div className="space-y-6">
            
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left: Featured Negative Comments (Smaller width) */}
              <div className="xl:col-span-4">
                <FeaturedComment />
              </div>

              {/* Right: Overall Summary (Larger width) */}
              <div className="xl:col-span-8">
                <SummariesByCategory />
              </div>
            </section>

          </div>

          <div className="flex justify-center mt-10 mb-8">
            <button 
              onClick={handleExportClick} 
              disabled={isExporting}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-lg font-medium shadow-md transition-transform hover:scale-105"
            >
              {isExporting ? 'Exporting...' : 'Export Ministry Report to PDF'}
            </button>
          </div>
        </div>
      </div>
      <AIAgentChatbot />
    </div>
  );
};

export default MinistryDashboard;
