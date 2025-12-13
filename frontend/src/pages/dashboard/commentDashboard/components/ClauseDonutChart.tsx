import React, { useState, useEffect } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  type SelectChangeEvent,
  Box,
  Typography
} from '@mui/material';
import { commentService, type ClauseData } from '../../../../services/commentService';


const ClauseDonutChart: React.FC = () => {
  const [clauses, setClauses] = useState<ClauseData[]>([]);
  const [selectedClauseId, setSelectedClauseId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClauseData = async () => {
      try {
        const result = await commentService.getClauseWiseSentiment();
        if (result && Array.isArray(result.clauses)) {
          setClauses(result.clauses);
          if (result.clauses.length > 0) {
            setSelectedClauseId(result.clauses[0].clause);
          }
        } else {
          setClauses([]);
        }
      } catch (e) {
        setError("Failed to fetch clause data.");
        console.error("Failed to fetch clause data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchClauseData();
  }, []);

  const handleClauseChange = (event: SelectChangeEvent) => {
    setSelectedClauseId(event.target.value);
  };

  const selectedClause = clauses.find(c => c.clause === selectedClauseId);

  if (loading) {
    return <Typography>Loading clauses...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!selectedClause) {
    return <Typography>No data available for the selected clause.</Typography>;
  }

  // Prepare data for donut chart
  const chartData = [
    { 
      label: `Positive : ${selectedClause.positivePercentage.toFixed(1)}%`,
      value: selectedClause.positive, 
      color: '#93c5fd', // blue-300
      percentage: selectedClause.positivePercentage
    },
    { 
      label: `Negative : ${selectedClause.negativePercentage.toFixed(1)}%`, 
      value: selectedClause.negative, 
      color: '#3b82f6', // blue-500
      percentage: selectedClause.negativePercentage
    },
    { 
      label: `Neutral : ${selectedClause.neutralPercentage.toFixed(1)}%`, 
      value: selectedClause.neutral, 
      color: '#1e40af', // blue-800
      percentage: selectedClause.neutralPercentage
    },
  ];

  const settings = {
    margin: { right: 2, left: 3, top: 2, bottom: 0 },
    width: 150,
    height: 150,
  };

  return (
    <div className="flex flex-col items-center w-full">
      <Box sx={{ minWidth: 120, mb: 1, width: '100%', maxWidth: 200 }}>
        <FormControl fullWidth size="small" variant="outlined">
          <InputLabel id="clause-select-label" sx={{ fontSize: '0.8rem', top: -3 }}>Select Clause</InputLabel>
          <Select
            labelId="clause-select-label"
            id="clause-select"
            value={selectedClauseId}
            label="Select Clause"
            onChange={handleClauseChange}
            sx={{
              borderRadius: 0,
              height: 30,
              fontSize: '0.8rem',
              backgroundColor: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e2e8f0', // slate-200
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#94a3b8', // slate-400
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3b82f6', // blue-500
              },
              '& .MuiSelect-select': {
                paddingTop: '4px',
                paddingBottom: '4px',
              }
            }}
          >
            {clauses.map((clause) => (
              <MenuItem key={clause.clause} value={clause.clause} sx={{ minHeight: 32 }}>
                <Typography sx={{ fontSize: '0.8rem' }} noWrap>
                  {clause.clause}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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

export default ClauseDonutChart;