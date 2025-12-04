import { useAppSelector, useAppDispatch } from '../../../../hooks/redux';
import { updateSocketCommentCounts } from '../../../../store/slices/commentSlice';
import { useSocketProgress } from '../../../../hooks/useSocketProgress';
import { useEffect, useState } from 'react';
import { socketUrl } from '../../../../utils/baseApi';
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function CommentHeading() {
  const { commentCounts } = useAppSelector(state => state.comment);
  const dispatch = useAppDispatch();
  const [liveData, setLiveData] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0
  });
  
  // Initialize socket for real-time updates
  const { isConnected, data: socketData } = useSocketProgress({
    endpoint: `${socketUrl}`,
    eventName: 'total-count-update',
    initialData: {
      positive: commentCounts?.positive || 0,
      negative: commentCounts?.negative || 0,
      neutral: commentCounts?.neutral || 0,
      total: commentCounts?.total || 0
    },
    autoConnect: true
  }); 

  // Update Redux store when socket data changes
  useEffect(() => {
    if (socketData && isConnected) {
      dispatch(updateSocketCommentCounts(socketData));
    }
  }, [socketData, isConnected, dispatch]);

  // Update live data when socket data changes or Redux state changes
  useEffect(() => {
    if (socketData && isConnected) {
      setLiveData({
        total: socketData.total,
        positive: socketData.positive,
        negative: socketData.negative,
        neutral: socketData.neutral
      });
    } else if (commentCounts) {
      setLiveData({
        total: commentCounts.total || 0,
        positive: commentCounts.positive || 0,
        negative: commentCounts.negative || 0,
        neutral: commentCounts.neutral || 0
      });
    }
  }, [socketData, isConnected, commentCounts]);
  
  // Use live data for display
  const totalComments = liveData.total;
  const positiveComments = liveData.positive;
  const negativeComments = liveData.negative;
  const neutralComments = liveData.neutral;

  return (
    <div className="w-full bg-white rounded-none border border-gray-200 px-6 py-5 shadow-sm">
      <div className="flex flex-wrap items-center">
        
        {/* Total Comments */}
        <div className="flex-1 pr-6 border-r border-gray-200 min-w-[120px]">
          <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Total Comments</p>
          <div className="flex items-center gap-2 mt-1">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <p className="text-2xl font-bold text-blue-900">{totalComments.toLocaleString()}</p>
          </div>
        </div>

        {/* Positive */}
        <div className="flex-1 px-6 border-r border-gray-200 min-w-[120px]">
          <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Positive</p>
          <div className="flex items-center gap-2 mt-1">
            <ThumbsUp className="w-5 h-5 text-gray-600" />
            <p className="text-2xl font-bold text-green-600">{positiveComments.toLocaleString()}</p>
          </div>
        </div>

        {/* Negative */}
        <div className="flex-1 px-6 border-r border-gray-200 min-w-[120px]">
          <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Negative</p>
          <div className="flex items-center gap-2 mt-1">
            <ThumbsDown className="w-5 h-5 text-gray-600" />
            <p className="text-2xl font-bold text-red-600">{negativeComments.toLocaleString()}</p>
          </div>
        </div>

        {/* Neutral */}
        <div className="flex-1 pl-6 min-w-[120px]">
          <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Neutral</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-semi-bold text-gray-600 leading-none">~</span>
            <p className="text-2xl font-bold text-yellow-500">{neutralComments.toLocaleString()}</p>
          </div>
        </div>

      </div>
    </div>
  );
}