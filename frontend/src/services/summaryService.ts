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

// Backend API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

// Backend response types
interface BackendTimelineItem {
  summaryId: string;
  generatedAt: string;
  summary: {
    summaryText: string;
    totalComments: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    weightedScore: number;
    topKeywords: string[];
    categoriesCount?: number; // Only for overall
  };
}

interface BackendCategory {
  categoryId: string;
  categoryName: string;
  categoryType: 'OVERALL' | 'BUSINESS';
  timeline: BackendTimelineItem[];
}

interface BackendHistoryResponse {
  categories: BackendCategory[];
}

// Cache for history data
let historyCache: BackendHistoryResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Fetch all history from backend
const fetchAllHistory = async (): Promise<BackendHistoryResponse> => {
  const now = Date.now();
  if (historyCache && (now - lastFetchTime) < CACHE_DURATION) {
    return historyCache;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/summaries/history-all`);
    historyCache = response.data.data;
    lastFetchTime = now;
    return historyCache!;
  } catch (error) {
    console.error('Error fetching history from backend:', error);
    throw error;
  }
};

// Clear cache (useful when generating new summaries)
export const clearHistoryCache = () => {
  historyCache = null;
  lastFetchTime = 0;
};

// Map category name from frontend to backend format
const mapCategoryName = (frontendCategory: string): string => {
  if (frontendCategory === 'Overall Summary') return 'Overall';
  return frontendCategory;
};

// Get history for a specific category
export const getHistoryByCategory = async (category: string): Promise<HistoryItem[]> => {
  try {
    const historyData = await fetchAllHistory();
    const mappedCategory = mapCategoryName(category);
    
    const categoryData = historyData.categories.find(
      cat => cat.categoryName === mappedCategory
    );

    if (!categoryData || categoryData.timeline.length === 0) {
      return [];
    }

    return categoryData.timeline.map((item, index) => {
      const date = new Date(item.generatedAt);
      return {
        id: item.summaryId,
        name: `Summary #${categoryData.timeline.length - index}`,
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().split(' ')[0].substring(0, 5),
        category: category
      };
    });
  } catch (error) {
    console.error('Error in getHistoryByCategory:', error);
    return [];
  }
};

// Fetch summary data from a specific history item
export const fetchHistorySummary = async (historyItem: HistoryItem): Promise<SummaryData> => {
  try {
    const historyData = await fetchAllHistory();
    const mappedCategory = mapCategoryName(historyItem.category);
    
    const categoryData = historyData.categories.find(
      cat => cat.categoryName === mappedCategory
    );

    if (!categoryData) {
      throw new Error(`Category ${mappedCategory} not found`);
    }

    const timelineItem = categoryData.timeline.find(
      item => item.summaryId === historyItem.id
    );

    if (!timelineItem) {
      throw new Error(`Summary ${historyItem.id} not found`);
    }

    return {
      id: timelineItem.summaryId,
      category: historyItem.category,
      summaryText: timelineItem.summary.summaryText,
      lastUpdated: new Date(timelineItem.generatedAt).toLocaleString(),
      updateType: 'Manual'
    };
  } catch (error) {
    console.error('Error in fetchHistorySummary:', error);
    throw error;
  }
};

// Fetch summary from API (GET) - Get latest summary for a category
export const fetchSummary = async (category: string, signal?: AbortSignal): Promise<SummaryData> => {
  try {
    const mappedCategory = mapCategoryName(category);
    
    // For overall, use the overall endpoint
    if (mappedCategory === 'Overall') {
      const response = await axios.get(
        `${API_BASE_URL}/summaries/overall`,
        { signal }
      );
      
      return {
        id: `overall_${Date.now()}`,
        category: category,
        summaryText: response.data.data.summaryText || response.data.data.summary || '',
        lastUpdated: new Date().toLocaleString(),
        updateType: 'Manual'
      };
    }
    
    // For specific categories, get the latest summary
    const historyData = await fetchAllHistory();
    const categoryData = historyData.categories.find(
      cat => cat.categoryName === mappedCategory
    );

    if (!categoryData || categoryData.timeline.length === 0) {
      throw new Error(`No summary found for category: ${mappedCategory}`);
    }

    const latestSummary = categoryData.timeline[0]; // Timeline is already sorted by desc
    
    return {
      id: latestSummary.summaryId,
      category: category,
      summaryText: latestSummary.summary.summaryText,
      lastUpdated: new Date(latestSummary.generatedAt).toLocaleString(),
      updateType: 'Manual'
    };
  } catch (error) {
    if (!axios.isCancel(error)) {
      console.error("Error fetching summary:", error);
    }
    throw error;
  }
};

// Post summary to API (POST) - Generate new summaries for all categories
export const postSummary = async (category: string, _summaryText: string): Promise<void> => {
  try {
    console.log(`[POST Summary] Generating new summary for category: ${category}`);
    
    // Call the backend to generate a new summary
    await axios.post(`${API_BASE_URL}/summaries`);
    
    // Clear cache to force refetch
    clearHistoryCache();
    
    console.log(`[POST Summary] Successfully generated new summary`);
  } catch (error) {
    console.error("Error posting summary:", error);
    throw error;
  }
};

// Refresh summary: Generate new summary, then fetch latest
export const refreshSummary = async (
  category: string, 
  _currentSummary: string | undefined,
  signal?: AbortSignal
): Promise<SummaryData> => {
  try {
    const mappedCategory = mapCategoryName(category);
    console.log(`[Refresh Summary] Starting refresh for category: ${category}`);
    
    // For Overall category, call the overall endpoint
    if (mappedCategory === 'Overall') {
      await axios.get(`${API_BASE_URL}/summaries/overall`);
    } else {
      // For specific categories, generate summaries for all categories
      await axios.post(`${API_BASE_URL}/summaries`);
    }
    
    // Clear cache to get fresh data
    clearHistoryCache();
    
    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fetch the latest summary
    return await fetchSummary(category, signal);
  } catch (error) {
    if (!axios.isCancel(error)) {
      console.error("Error refreshing summary:", error);
    }
    throw error;
  }
};

// Generate all categories summaries at once
export const generateAllCategoriesSummaries = async (): Promise<void> => {
  try {
    console.log('[Generate All] Generating summaries for all categories');
    
    // Call the backend to generate summaries for all categories
    await axios.post(`${API_BASE_URL}/summaries`);
    
    // Clear cache to force refetch
    clearHistoryCache();
    
    console.log('[Generate All] Successfully generated summaries for all categories');
  } catch (error) {
    console.error("Error generating all summaries:", error);
    throw error;
  }
};
