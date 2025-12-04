import React from 'react';
import { Cloud } from 'lucide-react';

const WordCloud: React.FC = () => {
  return (
    <div className="w-full mt-2 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 bg-blue-900 flex items-center shrink-0">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Cloud className="w-5 h-5 text-white" />
          Word Cloud Analysis
        </h3>
      </div>
      
      {/* Content */}
      <div className="p-6">
          {/* Word Cloud Image */}
          <div className="flex justify-center">
            <div className="w-full max-w-5xl">
              <img 
                src="/assets/wordcloud.jpeg" 
                alt="Word Cloud Analysis - Most frequently used words in comments"
                className="w-full h-auto rounded-lg shadow-sm"
                style={{ maxHeight: '400px', }}
              />
            </div>
          </div>
          
          {/* Optional Description */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 font-sans">
              Visual representation of the most frequently used words in analyzed comments
            </p>
          </div>
      </div>
    </div>
  );
};

export default WordCloud;