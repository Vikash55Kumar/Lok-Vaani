import React, { useEffect } from 'react';
import { PieChart, ChartColumnBig } from 'lucide-react';
import SentimentWeightageChart from './SentimentWeightageChart';
import SentimentDonutChart from './SentimentDonutChart';
import { updateSocketWeightage } from '../../../../store/slices/commentSlice';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { useSocketProgress } from '../../../../hooks/useSocketProgress';
import { socketUrl } from '@/utils/baseApi';

import { FeaturedComment } from './FeaturedComment';

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

const SentimentAnalysis: React.FC = () => {
    const { commentsWeightage } = useAppSelector(state => state.comment);
    const dispatch = useAppDispatch();
    
    // Initialize socket for real-time updates
    const { isConnected, data: socketData } = useSocketProgress({
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
    
    // Type assertion for weighted socket data
    const weightedSocketData = socketData as unknown as WeightedSocketData;
  
    // Update Redux store when socket data changes
    useEffect(() => {
      if (socketData && isConnected) {
        // socketData contains the full weighted response structure
        // Type assertion through unknown since the hook expects SocketProgressData but we receive weighted data
        dispatch(updateSocketWeightage(socketData as unknown as WeightedSocketData));
      }
    }, [socketData, isConnected, dispatch]);
    
  return (
    <div >
      {/* Charts Container - Side by Side */}
        <div className="w-full flex flex-row gap-1.5">
          {/* Donut Chart Container */}
          <div className="w-2/4 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
            {/* Chart Header */}
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

          {/* Donut Chart Container */}
          <div className="w-2/4 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
            {/* Chart Header */}
            <div className="px-3 py-2 bg-blue-900 flex items-center shrink-0">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-white"/>
                Overall Sentiment Distribution by Weightage
              </h3>
            </div>
            <div className="pt-4 flex-1">
              <SentimentDonutChart 
                data={weightedSocketData?.weightedPercentages || commentsWeightage?.weightedPercentages || { positive: 0, negative: 0, neutral: 0 }} 
              />
            </div>
          </div>
        </div>

        <div className="w-full mt-2 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
            {/* Chart Header */}
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
          <div className='mt-2'>
            <FeaturedComment />
          </div>
    </div>
  );
};

export default SentimentAnalysis;