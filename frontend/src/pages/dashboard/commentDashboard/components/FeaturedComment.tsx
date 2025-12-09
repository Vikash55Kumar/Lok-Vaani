import { ThumbsUp, ThumbsDown, Minus, Star } from 'lucide-react';
import type { CommentProps } from '@/types';
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_FEAUTURED_COMMENTS;

export const FeaturedComment = () => {
  const [comments, setComments] = useState<CommentProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch comments');
        const data = await res.json();
        // API returns { statusCode, data: { comments: [...] } }
        let items: any[] = data?.data?.comments || [];
        // Map API response to CommentProps structure
        const mapped = items.map((item) => ({
          id: item.id,
          raw_comment: item.rawComment,
          updatedAt: item.createdAt,
          sentiment: item.sentiment,
          company: item.company?.name || '',
          language: item.language || '',
          categoryType: item.company?.businessCategory?.categoryType || '',
          bussiness_category: item.company?.businessCategory?.name || '',
        }));
        setComments(mapped.slice(0, 5));
      } catch (err: any) {
        setError(err.message || 'Error fetching comments');
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, []);

  return (
    <div className="w-full bg-white border border-gray-200 shadow-sm rounded-none flex flex-col h-full">
      <div className="px-3 py-2 bg-blue-900 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium text-white flex items-center gap-1.5">
          <Star className="w-3 h-3 text-white fill-white" />
          Featured Negative Comment
        </h3>
        <span className="text-[10px] text-white/80 bg-white/10 px-1.5 py-0.5 rounded-none">
          Top 5
        </span>
      </div>

      <div className="divide-y divide-gray-100 flex-1">
        {loading ? (
          <div className="px-3 py-4 text-xs text-gray-500">Loading...</div>
        ) : error ? (
          <div className="px-3 py-4 text-xs text-red-500">{error}</div>
        ) : comments.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-500">No featured comments found.</div>
        ) : (
          comments.map((comment) => {
            let datePart = comment.updatedAt;
            if (comment.updatedAt && comment.updatedAt.includes('T')) {
              const [date] = comment.updatedAt.split('T');
              datePart = date;
            }

            let SentimentIcon = ThumbsUp;
            let iconStyles = "bg-green-100 text-green-600";
            switch (comment.sentiment) {
              case 'Negative':
                SentimentIcon = ThumbsDown;
                iconStyles = "bg-red-100 text-red-600";
                break;
              case 'Neutral':
                SentimentIcon = Minus;
                iconStyles = "bg-yellow-100 text-yellow-600";
                break;
              case 'Positive':
              default:
                SentimentIcon = ThumbsUp;
                iconStyles = "bg-green-100 text-green-600";
                break;
            }

            return (
              <div key={comment.id} className="px-3 py-2 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start gap-3 w-full">
                  {/* Icon */}
                  <div className={`mt-0.5 shrink-0 p-1 rounded-full ${iconStyles}`}>
                    <SentimentIcon className="w-3 h-3" />
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
          })
        )}
      </div>
    </div>
  );
};
