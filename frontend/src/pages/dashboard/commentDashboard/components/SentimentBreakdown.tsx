import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../hooks/redux';
import { updateSocketCategoryData } from '../../../../store/slices/commentSlice';
import StakeholderCard from './StakeholderCard';
import { useSocketProgress } from '../../../../hooks/useSocketProgress';
import type { StakeholderData } from '@/types';
import { socketUrl } from '@/utils/baseApi';

const SentimentBreakdown: React.FC = () => {
  const { categoryCommentCounts } = useAppSelector(state => state.comment);
  const dispatch = useAppDispatch();

  // Socket connection for normal users
  const { data: normalSocketData, isConnected: normalConnected } = useSocketProgress({
    endpoint: `${socketUrl}`,
    eventName: 'normal-count-update',
    initialData: {
      positive: categoryCommentCounts?.user.positive || 0,
      negative: categoryCommentCounts?.user.negative || 0,
      neutral: categoryCommentCounts?.user.neutral || 0,
      total: 0
    },
    autoConnect: true
  });

  // Socket connection for industrialist users  
  const { data: industrialistSocketData, isConnected: industrialistConnected } = useSocketProgress({
    endpoint: `${socketUrl}`,
    eventName: 'industrialist-count-update',
    initialData: {
      positive: categoryCommentCounts?.business.positive || 0,
      negative: categoryCommentCounts?.business.negative || 0,
      neutral: categoryCommentCounts?.business.neutral || 0,
      total: 0
    },
    autoConnect: true
  });

  // Update Redux store when socket data changes
  useEffect(() => {
    if (normalSocketData && normalConnected) {
      dispatch(updateSocketCategoryData({
        type: 'normal',
        data: normalSocketData
      }));
    }
  }, [normalSocketData, normalConnected, dispatch]);

  useEffect(() => {
    if (industrialistSocketData && industrialistConnected) {
      dispatch(updateSocketCategoryData({
        type: 'industrialist',
        data: industrialistSocketData
      }));
    }
  }, [industrialistSocketData, industrialistConnected, dispatch]);

  // Transform API data to component format
  const normalUsersData: StakeholderData = {
    totalComments: categoryCommentCounts 
      ? categoryCommentCounts.user.positive + categoryCommentCounts.user.negative + categoryCommentCounts.user.neutral
      : 0,
    stats: {
      positive: categoryCommentCounts?.user.positive || 0,
      negative: categoryCommentCounts?.user.negative || 0,
      neutral: categoryCommentCounts?.user.neutral || 0
    }
  };

  const industrialistsData: StakeholderData = {
    totalComments: categoryCommentCounts 
      ? categoryCommentCounts.business.positive + categoryCommentCounts.business.negative + categoryCommentCounts.business.neutral
      : 0,
    stats: {
      positive: categoryCommentCounts?.business.positive || 0,
      negative: categoryCommentCounts?.business.negative || 0,
      neutral: categoryCommentCounts?.business.neutral || 0
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 transition-shadow duration-300">

      {/* Stakeholder Cards Grid */}
      {/* <div className="w-full flex flex-col md:flex-row gap-4 justify-center items-stretch">
        <StakeholderCard
          title="Comments from Normal Users"
          data={normalUsersData}
          type="normal"
          enableRealtime={true}
        />
        <StakeholderCard
          title="Comments from Businessmen"
          data={industrialistsData}
          type="industrialist"
          enableRealtime={true}
        />
      </div> */}
    </div>
  );
};

export default SentimentBreakdown;