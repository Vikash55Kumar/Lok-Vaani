import React from 'react';
import { ThumbsUp, ChevronDown, ThumbsDown, Minus } from 'lucide-react';
import type { CommentProps } from '@/types';

const CommentCard: React.FC<CommentProps> = ({
  raw_comment,
  categoryType,
  bussiness_category,
  sentiment,
  language,
  summary,
  company,
  updatedAt
}) => {

  const getCategoryColor = (category: string) => {
    switch ((category || '').toUpperCase()) {
      case 'USER':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'BUSINESS':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const [expanded, setExpanded] = React.useState(false);
  const handleToggle = () => setExpanded((prev) => !prev);

  // Language color coding
  const getLanguageColor = (lang: string) => {
    switch ((lang || '').toLowerCase()) {
      case 'hindi':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'english':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'hinenglish':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  // Safely parse updatedAt for date and time
  let datePart = updatedAt;
  if (updatedAt && updatedAt.includes('T')) {
    const [date] = updatedAt.split('T');
    datePart = date;
  }

  // Choose icon and color for sentiment using switch
  let SentimentIcon = ThumbsUp;
  switch (sentiment) {
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
    <div className="w-full p-4 hover:bg-gray-50 transition-colors duration-200 group">
      <div className="flex items-start gap-3 w-full">
        {/* Icon */}
        <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-gray-50 border border-gray-100">
          <SentimentIcon className="w-3.5 h-3.5 text-gray-700" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header with Company, Date, Tags and Expand */}
          <div className="flex items-center justify-between mb-2 gap-2">
             <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-900 text-sm font-semibold truncate">{company}</span>
                <span className="text-gray-300 text-xs">•</span>
                <span className="text-gray-500 text-xs truncate">{bussiness_category}</span>
                <span className="text-gray-300 text-xs">•</span>
                <span className="text-gray-500 text-xs whitespace-nowrap">{datePart}</span>
             </div>
             
             <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getLanguageColor(language || '')}`}>{language}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryColor(categoryType || '')}`}>{categoryType}</span>
                </div>
                <button 
                    onClick={handleToggle}
                    className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
                > 
                    <ChevronDown className={`w-4 h-4 transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} /> 
                </button>
             </div>
          </div>

          <div className="mb-1">
            <p 
                className={`text-gray-600 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}
                onClick={handleToggle}
                style={{ cursor: 'pointer' }}
            >
              {raw_comment}
            </p>
            {expanded && summary && (
                <div className="mt-2 mb-2 p-3 bg-blue-50 rounded-md border border-blue-100 text-sm text-gray-700 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="block text-blue-900 font-semibold mb-1">Summary:</span>
                  {summary}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;