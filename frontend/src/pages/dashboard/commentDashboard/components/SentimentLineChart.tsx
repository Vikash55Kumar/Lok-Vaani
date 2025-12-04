import React from 'react';
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts/LineChart';
import { TrendingUp } from 'lucide-react';
import type { TrendData } from '@/types';

interface SentimentLineChartProps {
  data: TrendData[];
}

const SentimentLineChart: React.FC<SentimentLineChartProps> = ({ data }) => {
  // Extract data for chart
  const weeks = data.map(item => item.week);
  const positiveData = data.map(item => item.positive);
  const negativeData = data.map(item => item.negative);
  const neutralData = data.map(item => item.neutral);

  const margin = { right: 22, left: 1, top: 0, bottom: 0 };

  return (
    <div className="w-full bg-white border border-gray-200 shadow-sm rounded-none flex flex-col h-full">
      <div className="px-3 py-2 bg-blue-900 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium text-white flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-white" />
          Sentiment Trends Over Time
        </h3>
      </div>
      
      <div className="flex-1 flex flex-col">
        
        <Box sx={{ 
          width: '100%', 
          flex: 1,
          // minHeight: 265,
          p: 0.5
        }}>
          <LineChart
            height={295}
            sx={{
              '& .MuiAreaElement-root': {
                fillOpacity: 0.7,
              },
            }}
            series={[
              { 
                data: positiveData, 
                label: 'Positive',
                color: '#93c5fd', // blue-300
                curve: 'monotoneX',
                area: true,
                showMark: false,
              },
              { 
                data: negativeData, 
                label: 'Negative',
                color: '#3b82f6', // blue-500
                curve: 'monotoneX',
                area: true,
                showMark: false,
              },
              { 
                data: neutralData, 
                label: 'Neutral',
                color: '#1e40af', // blue-800
                curve: 'monotoneX',
                area: true,
                showMark: false,
              },
            ]}
            xAxis={[{ 
              scaleType: 'point', 
              data: weeks,
              tickSize: 6,
              tickLabelStyle: {
                fontSize: 12,
                fill: '#64748b' // slate-500
              }
            }]}
            yAxis={[{ 
              width: 30,
              tickLabelStyle: {
                fontSize: 12,
                fill: '#64748b' // slate-500
              },
              min: 0,
              max: 80
            }]}
            margin={margin}
            grid={{ horizontal: true, vertical: true }}
          />
        </Box>

      </div>
    </div>
  );
};

export default SentimentLineChart;