import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import type { CommentStats } from '@/types';

interface SentimentDonutChartProps {
  data: CommentStats;
}

const SentimentDonutChart: React.FC<SentimentDonutChartProps> = ({ data }) => {
  // Calculate percentages
  const positivePercentage = (data.positive).toFixed(1);
  const negativePercentage = (data.negative).toFixed(1);
  const neutralPercentage = (data.neutral).toFixed(1);

  // Prepare data for donut chart
  const chartData = [
    { 
      label: `Positive : ${positivePercentage}%`,
      value: data.positive, 
      color: '#93c5fd', // blue-300
      percentage: positivePercentage
    },
    { 
      label: `Negative : ${negativePercentage}%`, 
      value: data.negative, 
      color: '#3b82f6', // blue-500
      percentage: negativePercentage
    },
    { 
      label: `Neutral :${neutralPercentage}%`, 
      value: data.neutral, 
      color: '#1e40af', // blue-800
      percentage: neutralPercentage
    },
  ];

  const settings = {
    margin: { right: 2, left: 3, top: 2, bottom: 0 },
    width: 150,
    height: 150,
  };

  return (
    <div className="flex flex-col items-center">
      {/* Donut Chart */}
      <div className="mb-4 transition-transform duration-300 hover:scale-105">
        <PieChart
          series={[{ 
            innerRadius: 30, 
            outerRadius: 60, 
            data: chartData,
            highlightScope: { },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
          }]}
          {...settings}
          sx={{
            '& .MuiPieArc-root': {
              stroke: 'white',
              strokeWidth: 2,
              animation: 'expandArc 0.8s ease-out',
              transformOrigin: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                filter: 'brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
                strokeWidth: 3,
              },
            },
            '@keyframes expandArc': {
              '0%': {
                transform: 'scale(0)',
                opacity: 0,
              },
              '50%': {
                transform: 'scale(1.1)',
                opacity: 0.8,
              },
              '100%': {
                transform: 'scale(1)',
                opacity: 1,
              },
            },
          }}
        />
      </div>     
    </div>
  );
};

export default SentimentDonutChart;