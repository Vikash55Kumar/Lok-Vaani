import React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import type { WeightageData } from '@/types';

interface SentimentWeightageChartProps {
  data: WeightageData[];
}

const SentimentWeightageChart: React.FC<SentimentWeightageChartProps> = ({ data }) => {
  // Extract categories and data for chart
  const categories = data.map(item => item.category);
  const positiveData = data.map(item => item.positive);
  const negativeData = data.map(item => item.negative);
  const neutralData = data.map(item => item.neutral);

  return (
    <div className="w-full transition-transform duration-300 hover:scale-[1.02]">
      <BarChart
        xAxis={[{ 
          data: categories,
          scaleType: 'band',
          tickLabelStyle: {
            fontSize: 14,
            fill: '#64748b', // slate-500
            fontWeight: 500,
          }
        }]}
        series={[
          { 
            data: positiveData, 
            label: 'Positive',
            color: '#93c5fd', // blue-300
          },
          { 
            data: negativeData, 
            label: 'Negative',
            color: '#3b82f6', // blue-500
          },
          { 
            data: neutralData, 
            label: 'Neutral',
            color: '#1e40af', // blue-800
          }
        ]}
        height={270}
        margin={{ left: 20, right: 20, top: 20, bottom: 0 }}
        yAxis={[{
          tickLabelStyle: {
            fontSize: 12,
            fill: '#64748b', // slate-500
          }
        }]}
        sx={{
          '& .MuiChartsAxis-line': {
            stroke: '#e2e8f0', // slate-200
          },
          '& .MuiChartsAxis-tick': {
            stroke: '#e2e8f0', // slate-200
          },
          '& .MuiChartsLegend-root': {
            fontSize: '14px',
            fontWeight: 500,
          },
          '& .MuiBarElement-root': {
            rx: 0,
            animation: 'growUp 0.8s ease-out',
            transformOrigin: 'bottom',
            transition: 'all 0.3s ease',
            '&:hover': {
              filter: 'brightness(1.15) drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              transform: 'scaleY(1.05)',
            },
          },
        }}
        grid={{ horizontal: true, vertical: false }}
      />
    </div>
  );
};

export default SentimentWeightageChart;