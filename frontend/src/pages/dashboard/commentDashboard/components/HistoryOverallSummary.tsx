import { useState, useEffect } from 'react';
import { History, Clock, Activity } from 'lucide-react';
import { getHistoryByCategory, type HistoryItem, type CategoryType } from '../../../../services/summaryService';

interface HistoryOverallSummaryProps {
  category: CategoryType;
}

const HistoryOverallSummary: React.FC<HistoryOverallSummaryProps> = ({ category }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Fetch history for the selected category
    const items = getHistoryByCategory(category);
    setHistoryItems(items);
    setActiveId(null); // Reset selection when category changes
  }, [category]);

  return (
    <div className="w-full bg-white border border-gray-200 shadow-sm rounded-none flex flex-col h-[600px]">
      <div className="px-3 py-2 bg-blue-900 flex items-center justify-between shrink-0">
        <h3 className="text-base font-medium text-white flex items-center gap-1.5">
          <History className="w-4 h-4 text-white" />
          History - {category}
        </h3>
        <span className="text-xs text-white/80 bg-white/10 px-2 py-0.5 rounded-none">
          Recent Activity
        </span>
      </div>
      
      <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
        {historyItems.map((item) => {
            const datePart = `${item.date} ${item.time}`;
            const isActive = item.id === activeId;

            return (
                <div 
                  key={item.id} 
                  onClick={() => setActiveId(item.id)}
                  className={`px-4 py-3 transition-colors duration-200 cursor-pointer border-l-4 ${
                    isActive 
                      ? 'bg-blue-50 border-l-blue-600' 
                      : 'hover:bg-gray-50 border-l-transparent'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                    <div className="flex items-start gap-3 w-full">
                        <div className="mt-1 shrink-0">
                            <Activity className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-900'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="mb-1.5">
                                <p className={`text-sm font-medium leading-relaxed line-clamp-1 ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {item.name}
                                </p>
                            </div>
                            
                            <div className="flex flex-row items-center gap-2">
                                <span className="text-blue-600 text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {datePart}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  )
}

export default HistoryOverallSummary