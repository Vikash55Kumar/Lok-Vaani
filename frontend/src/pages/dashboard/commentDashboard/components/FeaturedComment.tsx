import { ThumbsUp, ThumbsDown, Minus, Star } from 'lucide-react';
import type { CommentProps } from '@/types';

// Dummy data matching CommentProps structure
const FEATURED_COMMENTS: CommentProps[] = [
  {
    id: '1',
    raw_comment: " The new policy implementation in the rural sector has shown remarkable results. Transparency has improved significantly.",
    updatedAt: "2025-12-02T10:30:00",
    sentiment: 'Positive',
    company: "Rural Dev Corp",
    language: "English",
    categoryType: "Business",
    bussiness_category: "Agriculture"
  },
  {
    id: '2',
    raw_comment: "While the initiative is good, the execution on the ground level needs more monitoring. Local officials need better training.",
    updatedAt: "2025-12-02T09:15:00",
    sentiment: 'Neutral',
    company: "Municipal Corp",
    language: "English",
    categoryType: "User",
    bussiness_category: "Governance"
  },
  {
    id: '3',
    raw_comment: "Digital literacy programs are finally reaching the remote villages. Great to see the youth getting involved.",
    updatedAt: "2025-12-01T16:45:00",
    sentiment: 'Positive',
    company: "EduTech India",
    language: "English",
    categoryType: "Business",
    bussiness_category: "Education"
  },
  {
    id: '4',
    raw_comment: "We need more focus on water conservation techniques in this region. The current measures are insufficient.",
    updatedAt: "2025-12-01T14:20:00",
    sentiment: 'Negative',
    company: "Water Works",
    language: "Hindi",
    categoryType: "User",
    bussiness_category: "Environment"
  },
  {
    id: '5',
    raw_comment: "Excellent dashboard for tracking public sentiment. It really helps in understanding the pulse of the people.",
    updatedAt: "2025-12-01T11:10:00",
    sentiment: 'Positive',
    company: "GovTech",
    language: "English",
    categoryType: "Business",
    bussiness_category: "Technology"
  }
];

export const FeaturedComment = () => {
  return (
    <div className="w-full bg-white border border-gray-200 shadow-sm rounded-none flex flex-col h-full">
      <div className="px-3 py-2 bg-blue-900 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium text-white flex items-center gap-1.5">
          <Star className="w-3 h-3 text-white fill-white" />
          Featured Comments
        </h3>
        <span className="text-[10px] text-white/80 bg-white/10 px-1.5 py-0.5 rounded-none">
          Top 5
        </span>
      </div>
      
      <div className="divide-y divide-gray-100 flex-1">
        {FEATURED_COMMENTS.map((comment) => {
            // Safely parse updatedAt for date and time
            let datePart = comment.updatedAt;
            if (comment.updatedAt && comment.updatedAt.includes('T')) {
                const [date] = comment.updatedAt.split('T');
                datePart = date;
            }

            // Choose icon and color for sentiment using switch
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
                <div key={comment.id} className="px-3 py-2 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start gap-3 w-full">
                        {/* Icon */}
                        <div className="mt-0.5 shrink-0">
                            <SentimentIcon className="w-3.5 h-3.5 text-gray-900" />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                            <div className="mb-1">
                                <p className="text-gray-800 text-xs leading-relaxed line-clamp-2">
                                    {comment.raw_comment}
                                </p>
                            </div>
                            
                            <div className="flex flex-row items-center gap-2">
                                <span className="text-blue-600 text-[10px] font-medium truncate">{comment.company}</span>
                                <span className="text-gray-500 text-[10px]">|</span>
                                <span className="text-blue-600 text-[10px]">{datePart}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
