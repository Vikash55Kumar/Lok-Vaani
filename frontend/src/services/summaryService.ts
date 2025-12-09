import axios from 'axios';

// --- TYPE DEFINITIONS ---
export interface SummaryData {
  id: string;
  category: string;
  summaryText: string;
  lastUpdated: string;
  updateType: 'Weekly' | 'Manual';
}

export interface HistoryItem {
  id: string;
  name: string;
  date: string;
  time: string;
  category: string;
}

// Categories list
export const CATEGORIES = [
  'Overall Summary',
  'Corporate Debtor',
  'Personal Guarantor to a Corporate Debtor',
  'Investors',
  'Insolvency Professional Entity',
  'Partnership firms',
  'Others',
  'Academics',
  'User',
  'Insolvency Professional Agency',
  'General',
  'Insolvency Professional',
  'Proprietorship firms',
  'Creditor to a Corporate Debtor',
] as const;

export type CategoryType = typeof CATEGORIES[number];

// Mock history data for each category
const generateMockHistory = (category: string): HistoryItem[] => {
  const baseHistory: HistoryItem[] = [
    {
      id: `${category}-1`,
      name: "Weekly Report",
      date: "2025-12-04",
      time: "09:00",
      category
    },
    {
      id: `${category}-2`,
      name: "Data Sync",
      date: "2025-12-03",
      time: "14:30",
      category
    },
    {
      id: `${category}-3`,
      name: "Analysis Update",
      date: "2025-12-03",
      time: "10:15",
      category
    },
    {
      id: `${category}-4`,
      name: "Monthly Export",
      date: "2025-12-01",
      time: "16:45",
      category
    },
    {
      id: `${category}-5`,
      name: "System Update",
      date: "2025-12-01",
      time: "08:00",
      category
    }
  ];
  return baseHistory;
};

// Get history for a specific category
export const getHistoryByCategory = (category: string): HistoryItem[] => {
  return generateMockHistory(category);
};

// Fetch summary data from a specific history item (dummy API for now)
export const fetchHistorySummary = async (historyItem: HistoryItem): Promise<SummaryData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Dummy response - in production this would fetch actual historical data
  console.log(`[GET History] Fetching history: ${historyItem.name} from ${historyItem.date}`);
  
  return {
    id: historyItem.id,
    category: historyItem.category,
    summaryText: `# Historical Summary: ${historyItem.name}\n\n` +
      `**Date:** ${historyItem.date} at ${historyItem.time}\n\n` +
      `**Category:** ${historyItem.category}\n\n` +
      `## Summary Content\n\n` +
      `This is a historical summary retrieved from the archive. ` +
      `In production, this would contain the actual summary data that was generated at ${historyItem.date} ${historyItem.time}.\n\n` +
      `### Key Points\n\n` +
      `* Historical data point 1 for ${historyItem.category}\n` +
      `* Historical data point 2 for ${historyItem.category}\n` +
      `* Historical data point 3 for ${historyItem.category}\n\n` +
      `> This summary was archived on ${historyItem.date}.`,
    lastUpdated: `${historyItem.date} ${historyItem.time}`,
    updateType: 'Weekly'
  };
};

// Fetch summary from API (GET)
export const fetchSummary = async (category: string, signal?: AbortSignal): Promise<SummaryData> => {
  try {
    const response = await axios.get(import.meta.env.VITE_AI_MODULE3_SUMMARY_API, { signal });
    let summaryText = response.data.data.summary;
    
    // Clean up the summary text
    summaryText = summaryText.replace(/\\n/g, '\n');

    return {
      id: `sum_${category.replace(/\s+/g, '_').toLowerCase()}`,
      category: category,
      summaryText: summaryText,
      lastUpdated: new Date().toLocaleString(),
      updateType: 'Manual'
    };
  } catch (error) {
    if (!axios.isCancel(error)) {
      console.error("Error fetching summary:", error);
    }
    throw error;
  }
};

// Post summary to API (POST) - dummy implementation for now
export const postSummary = async (category: string, summaryText: string): Promise<void> => {
  try {
    // Dummy POST - logs to console for now
    // In production, this would be an actual API call
    console.log(`[POST Summary] Category: ${category}`);
    console.log(`[POST Summary] Summary Text:`, summaryText.substring(0, 100) + '...');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Uncomment below when actual API endpoint is ready
    // await axios.post(import.meta.env.VITE_API_BASE_URL + '/summaries', {
    //   category,
    //   summaryText,
    //   timestamp: new Date().toISOString()
    // });
    
    console.log(`[POST Summary] Successfully posted summary for ${category}`);
  } catch (error) {
    console.error("Error posting summary:", error);
    throw error;
  }
};

// Refresh summary: POST current summary, then GET new summary
export const refreshSummary = async (
  category: string, 
  currentSummary: string | undefined,
  signal?: AbortSignal
): Promise<SummaryData> => {
  // First, POST the current summary (if exists)
  if (currentSummary) {
    await postSummary(category, currentSummary);
  }
  
  // Then, GET the new summary
  return fetchSummary(category, signal);
};
