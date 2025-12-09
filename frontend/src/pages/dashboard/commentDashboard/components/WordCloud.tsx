import React, { useEffect, useState } from 'react';
import { Cloud, Loader2 } from 'lucide-react';

const WordCloud: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    const fetchWordCloud = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = language === 'en' 
          ? import.meta.env.VITE_WORD_CLOUD_API 
          : import.meta.env.VITE_WORD_CLOUD_API_HINDI;

        if (!apiUrl) {
             console.warn(`API URL for ${language} might be missing.`);
        }
        
        if (!apiUrl) throw new Error("API configuration missing");

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch word cloud');
        }
        const data = await response.json();
        if (data.success && data.image) {
          setImageUrl(data.image);
          setLastUpdated(new Date());
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load word cloud');
      } finally {
        setLoading(false);
      }
    };

    fetchWordCloud();
  }, [language]);

  return (
    <div className="w-full mt-2 bg-white border border-gray-200 shadow-sm rounded-none flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 bg-blue-900 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Cloud className="w-5 h-5 text-white" />
          Word Cloud Analysis
        </h3>
        
        {/* Container for Last Updated and Language Selector */}
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-blue-100">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            </div>
          )}

          <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
              className="bg-white text-black text-xs px-2 py-1 border border-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
          </select>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
          {/* Word Cloud Image */}
          <div className="flex justify-center min-h-[400px] items-center">
            <div className="w-full max-w-5xl flex justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span>Generating word cloud...</span>
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm">{error}</div>
              ) : (
                imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt="Word Cloud Analysis - Most frequently used words in comments"
                    className="w-full h-[400px] shadow-sm"
                    style={{ maxHeight: '400px', }}
                  />
                )
              )}
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