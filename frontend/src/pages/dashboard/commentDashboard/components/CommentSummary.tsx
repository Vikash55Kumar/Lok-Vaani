import React, { useMemo, useState } from 'react';
import type { CommentProps } from '@/types';
import type { Comment } from '@/services/commentService';
import Button from '@/components/common/Button';
import { MoveRight, ThumbsUp, ThumbsDown, Minus, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Helper for language colors
const getLanguageColor = (lang: string | undefined) => {
  switch ((lang || '').toLowerCase()) {
    case 'hindi':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'english':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'hinenglish':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

// Helper for category colors
const getCategoryColor = (category: string | undefined) => {
  switch ((category || '').toUpperCase()) {
    case 'USER':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'BUSINESS':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

const CommentItem: React.FC<{ comment: CommentProps }> = ({ comment }) => {
  const [expanded, setExpanded] = useState(false);

  // Safely parse updatedAt for date
  let datePart = comment.updatedAt;
  if (comment.updatedAt && comment.updatedAt.includes('T')) {
      const [date] = comment.updatedAt.split('T');
      datePart = date;
  }

  // Choose icon and color for sentiment
  let SentimentIcon = ThumbsUp;
  switch (comment.sentiment) {
      case 'Negative':
      SentimentIcon = ThumbsDown;
      break;
      case 'Neutral':
      SentimentIcon = Minus;
      break;
      case 'Positive':
      default:
      SentimentIcon = ThumbsUp;
      break;
  }

  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-0 group">
        <div className="flex items-start gap-3">
            {/* Icon - Added background for visual anchor */}
            <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-gray-50 border border-gray-100">
                <SentimentIcon className="w-3.5 h-3.5 text-gray-700" />
            </div>

            <div className="flex-1 min-w-0">
                {/* Header: Company, Date, Tags */}
                <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-gray-900 text-sm font-semibold truncate">{comment.company}</span>
                        <span className="text-gray-300 text-xs">•</span>
                        <span className="text-gray-500 text-xs whitespace-nowrap">{datePart}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                         {comment.language && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getLanguageColor(comment.language)}`}>
                                {comment.language}
                            </span>
                         )}
                         {comment.categoryType && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryColor(comment.categoryType)}`}>
                                {comment.categoryType}
                            </span>
                         )}
                    </div>
                </div>

                {/* Main content - Lighter text color to reduce heaviness */}
                <div className="mb-2">
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {comment.raw_comment}
                    </p>
                </div>

                {/* Summary Toggle */}
                <div>
                    <button 
                        onClick={() => setExpanded(!expanded)} 
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{expanded ? 'Hide Summary' : 'View Summary'}</span>
                    </button>
                    
                    {expanded && comment.summary && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-100 text-sm text-gray-700 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                            <span className="font-semibold text-blue-900 block mb-1">Summary:</span>
                            {comment.summary}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

const CommentSummary: React.FC<{ comments: Comment[] }> = ({ comments }) => {
  const navigate = useNavigate();
  
  // Only show the latest 5 comments, sorted by date descending
  // Map backend Comment to CommentProps for UI components
  const mappedComments = (comments || []).map((c: Comment): CommentProps => ({
    id: c.id,
    raw_comment: c.rawComment,
    language: c.language === null ? undefined : c.language,
    categoryType: c.company?.businessCategory?.name ?? '',
    bussiness_category: c.company?.businessCategory?.name ?? '',
    sentiment: c.sentiment,
    date: c.createdAt,
    state: c.status,
    summary: c.summary === null ? undefined : c.summary,
    company: c.company?.name ?? '',
    createdAt: c.createdAt,
    updatedAt: c.createdAt,
  }));

  const latestComments = useMemo(() => {
    return [...mappedComments]
      .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
      .slice(0, 5);
  }, [mappedComments]);

  return (
    <div className="w-full bg-white border border-gray-200 shadow-sm rounded-none flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 bg-blue-900 flex items-center justify-between shrink-0">
        <h3 className="text-base font-medium text-white flex items-center gap-1.5">
          <Star className="w-4 h-4 text-white fill-white" />
          Latest Comments
        </h3>
        <div className="flex items-center gap-2">
            <span className="text-xs text-white/80">
                Total: {comments.length}
            </span>
        </div>
      </div>

      {/* Comments List */}
      <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
        {latestComments.length > 0 ? (
          latestComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm font-medium">No comments found</p>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <Button
          variant="secondary"
          className="w-full text-sm h-9 bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-sm"
          onClick={() => {
            navigate('/drafts/comments-list', { 
              state: { 
                comments: mappedComments 
              } 
            });
          }}
        >
          <span className="flex items-center justify-center gap-2">
            View All Comments <MoveRight className='w-4 h-4' />
          </span>
        </Button>
      </div>
    </div>
  );
};

export default CommentSummary;