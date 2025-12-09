import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardMinus, Sparkles, Quote, FileText, Clock, ChevronRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CATEGORIES, 
  type SummaryData, 
  type HistoryItem,
  refreshSummary,
  getHistoryByCategory,
  fetchHistorySummary
} from '../../../../services/summaryService';

interface TabButtonProps {
  category: string;
  isActive: boolean;
  onClick: (category: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ category, isActive, onClick }) => {
  const activeClasses = 'border-l-blue-600 text-blue-700 bg-white';
  const inactiveClasses = 'border-l-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50';
  
  return (
    <button
      onClick={() => onClick(category)}
      className={`w-full text-left py-3 px-4 border-l-4 border-b border-b-gray-100 font-medium text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset flex items-center justify-between group
        ${isActive ? activeClasses : inactiveClasses}
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="truncate">{category}</span>
      {isActive ? (
         <ChevronDown className="w-4 h-4 text-blue-600" />
      ) : (
         <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
      )}
    </button>
  );
};

// Accordion History List Component
interface HistoryListProps {
  category: string;
  onSelectHistory: (history: HistoryItem) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ category, onSelectHistory }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (category) {
      const items = getHistoryByCategory(category);
      setHistoryItems(items);
    }
  }, [category]);

  if (historyItems.length === 0) {
      return (
          <div className="py-3 px-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-400 italic text-center">
              No history available.
          </div>
      );
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 shadow-inner max-h-48 overflow-y-auto">
      {historyItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelectHistory(item)}
          className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 text-left group pl-6"
        >
          <div className="shrink-0 mt-0.5">
             <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-700 transition-colors">{item.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span>{item.date}</span>
              <span>•</span>
              <span>{item.time}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

// --- Helper Function for Formatting ---
const formatSummary = (text: string) => {
  if (!text) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <FileText className="w-12 h-12 mb-3 opacity-20" />
      <p className="italic">No summary available yet.</p>
    </div>
  );

  const lines = text.split('\n');
  
  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <div key={index} className="h-2" />;

        // Headings
        if (trimmedLine.startsWith('### ')) {
          return (
            <div key={index} className="flex items-center gap-2 mt-6 mb-3">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600">
                {trimmedLine.replace('### ', '')}
              </h4>
            </div>
          );
        }
        if (trimmedLine.startsWith('## ')) {
          return (
            <div key={index} className="flex items-center gap-2 mt-8 mb-4 pb-2 border-b border-blue-100">
              <h3 className="text-lg font-bold text-gray-800">
                {trimmedLine.replace('## ', '')}
              </h3>
            </div>
          );
        }
        if (trimmedLine.startsWith('# ')) {
          return (
            <div key={index} className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border-l-4 border-blue-600 mt-6 mb-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                {trimmedLine.replace('# ', '')}
              </h2>
            </div>
          );
        }

        // Bold text parsing helper
        const parseBold = (content: string) => {
          const parts = content.split(/(\**.*\**?)/g);
          return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <span key={i} className="font-bold text-blue-900 bg-blue-50 px-1 rounded">{part.slice(2, -2)}</span>;
            }
            return part;
          });
        };

        // Bullet points
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
          const content = trimmedLine.replace(/^[\*\-•]\s*/, '');
          return (
            <div key={index} className="group flex items-start gap-3 ml-2 mb-3 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200">
              <span className="text-gray-700 leading-relaxed text-sm">{parseBold(content)}</span>
            </div>
          );
        }

        // Blockquotes
        if (trimmedLine.startsWith('> ')) {
             const content = trimmedLine.replace(/^>\s*/, '');
             return (
                <div key={index} className="flex gap-3 pl-4 border-l-4 border-gray-300 italic text-gray-600 my-4 py-2 bg-gray-50 rounded-r">
                    <Quote className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                    <p className="text-sm">{parseBold(content)}</p>
                </div>
             )
        }

        // Regular text
        return (
          <p key={index} className="text-gray-600 mb-3 leading-relaxed text-sm pl-1">
            {parseBold(trimmedLine)}
          </p>
        );
      })}
    </div>
  );
};

// --- MOCK DATA (Simulating statusCode 200.docx content) ---
const MOCK_DATA: Record<string, string> = {
  "Overall Summary": `## Policy Analysis Report: Multi-Disciplinary Partnership (MDP) Firms in India

---

### 1. EXECUTIVE SUMMARY

This report analyzes public comments regarding the proposed establishment of Multi-Disciplinary Partnership (MDP) firms in India. The analysis reveals a predominantly neutral sentiment, with a significant positive leaning, towards the concept of MDPs, largely driven by the potential for strengthening India's professional services sector and fostering economic self-reliance ("Atmanirbhar Bharat"). However, a critical and recurring concern across public feedback is the paramount need for **transparency** in the structure, functioning, and oversight of these firms.

Key issues identified include the potential for **conflicts of interest**, the necessity for **clear operational guidelines**, and the establishment of **robust monitoring and accountability mechanisms**. While the benefits of MDPs are acknowledged, the public emphasizes that these advancements must not compromise ethical standards or lead to a reduction in transparency. The recommendations focus on developing comprehensive guidelines, implementing conflict of interest mitigation strategies, and establishing effective oversight bodies to ensure the responsible and ethical growth of MDP firms.

---

### 2. METHODOLOGY

This policy analysis is based on the examination of 1919 unique public comments submitted in response to proposals concerning Multi-Disciplinary Partnership (MDP) firms. The comments were subjected to a clustering process, resulting in the identification of a single dominant cluster (Cluster 0) that encapsulates the primary themes and concerns expressed by the public.

The analysis employed a qualitative approach to identify dominant themes, common concerns, and representative sentiments within the public discourse. The sentiment distribution for the analyzed comments was calculated as follows:

*   **Negative:** 143 comments (7.5%)
*   **Positive:** 573 comments (29.9%)
*   **Neutral:** 1203 comments (62.7%)

The focus of this report is on the insights derived from Cluster 0, which represents the collective voice of concerned citizens and civil society organizations prioritizing transparency. The methodology involved:

*   **Theme Identification:** Identifying recurring topics and ideas within the public comments.
*   **Concern Articulation:** Pinpointing specific anxieties and potential drawbacks raised by stakeholders.
*   **Sentiment Assessment:** Quantifying the overall emotional tone of the comments.
*   **Issue Prioritization:** Determining the most critical issues based on their frequency and emphasis in the feedback.
*   **Actionable Recommendation Formulation:** Developing practical suggestions to address the identified issues.

---

### 3. PUBLIC RESPONSE ANALYSIS

The public response to the proposed establishment of Multi-Disciplinary Partnership (MDP) firms is characterized by a general acceptance of the concept, coupled with a strong emphasis on ensuring responsible implementation.

**Dominant Themes:**

*   **Support for MDP Firms:** A significant portion of the public views MDP firms as a positive development for India's professional services sector. This support is often framed within the context of enhancing global competitiveness, fostering economic sovereignty, and achieving the goals of "Atmanirbhar Bharat" (self-reliant India).
*   **Emphasis on Transparency:** The most prominent and consistently raised theme is the absolute necessity for transparency. Stakeholders are keen to understand the structure.`,

  "Corporate Debtor": `### **Impact on Corporate Debtors**
  Feedback from and regarding Corporate Debtors focuses heavily on the **initiation of insolvency proceedings**.

  *   **Thresholds:** Many argue that the default threshold should be revisited to prevent premature insolvencies for MSMEs.
  *   **Management Control:** Concerns raised about the erosion of promoter control during the resolution process.

  **Specific Feedback:**
  > "Promoters should be given a fair chance to present a revival plan before the company goes into CIRP."
`,

  "Personal Guarantor to a Corporate Debtor": `### **Personal Guarantors Analysis**
  This category has seen a sharp increase in activity due to recent legal precedents.

  ## **Major Concerns**
  1.  **Liability Extent:** Unclear guidelines on the extent of liability when the principal borrower is under resolution.
  2.  **Asset Seizure:** Fears regarding the aggressive seizure of personal assets without adequate appellate remedies.

  *   Stakeholders are asking for a **clearer separation** between personal and corporate liabilities.`,

  "Investors": `### **Investor Perspective**
  Investors are looking for **predictability** and **speed**.

  *   **Value Erosion:** Long delays in the admission and approval of resolution plans are cited as the primary cause of value erosion.
  *   **Clean Slate:** Investors demand stronger guarantees that the "Clean Slate" theory will protect them from past offenses of the corporate debtor.

  **Recommendation:**
  > "Automated approvals for compliant resolution plans could significantly attract more foreign investment."
`,

  "Insolvency Professional": `### **Insolvency Professionals (IP) Feedback**
  IPs face the brunt of operational challenges.

  *   **Fee Structure:** Strong demand for rationalizing the fee structure, especially in cases with low liquidation value.
  *   **Security:** IPs have reported safety concerns when taking over management of hostile corporate debtors.
  *   **Regulatory Compliance:** The compliance burden is described as "excessive" and "distracting" from the core resolution process.`,

  "Operational Creditor": `### **Operational Creditors (OC)**
  OCs continue to feel marginalized in the waterfall mechanism.

  *   **Payment Priority:** Persistent demands for higher priority in the distribution of proceeds.
  *   **Discrimination:** OCs argue they are unfairly treated compared to Financial Creditors.`,
  
  "User": `### **General User Feedback**
  Comments from the general public and miscellaneous users.

  *   **UI/UX:** The portal interface is described as "clunky" and "non-intuitive" by first-time users.
  *   **Accessibility:** Requests for vernacular language support in the documentation.`
};

// --- SERVICE LOGIC ---

// Fetch summary from Mock Data
export const fetchSummary = async (category: string, signal?: AbortSignal): Promise<SummaryData> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Retrieve data from mock object
    // Normalize key lookup if needed (though exact match is preferred here)
    const summaryText = MOCK_DATA[category] || MOCK_DATA["Overall Summary"] || "No summary available for this category.";

    return {
      id: `sum_${category.replace(/\s+/g, '_').toLowerCase()}`,
      category: category,
      summaryText: summaryText,
      lastUpdated: new Date().toLocaleString(),
      updateType: 'Manual'
    };
  } catch (error) {
    console.error("Error fetching summary:", error);
    return {
        id: 'error',
        category,
        summaryText: `Error fetching summary. \n\nTechnical Error: ${error}`,
        lastUpdated: new Date().toLocaleString(),
        updateType: 'Manual'
    };
  }
};

// --- Main Optimized Component ---
const SummariesByCategory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [summaries, setSummaries] = useState<Map<string, SummaryData>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleTabClick = (category: string) => {
    // Toggle active state
    if (activeTab === category) {
      setActiveTab('');
    } else {
      setActiveTab(category);
    }
  };

  const handleSelectHistory = async (history: HistoryItem) => {
    setIsLoading(true);
    // We keep the activeTab as is so the accordion stays open
    try {
      let historySummary: SummaryData;

      if (history.category === 'Overall Summary') {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 600));
        historySummary = {
          id: history.id,
          category: history.category,
          summaryText: MOCK_DATA["Overall Summary"],
          lastUpdated: `${history.date} ${history.time}`,
          updateType: 'Manual'
        };
      } else {
        historySummary = await fetchHistorySummary(history);
      }

      setSummaries(prev => {
        const updated = new Map(prev);
        updated.set(history.category, historySummary);
        return updated;
      });
    } catch (error) {
      console.error("Error fetching history summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!activeTab) return;
    
    setIsLoading(true);
    try {
      const currentSummary = summaries.get(activeTab)?.summaryText;
      const newSummary = await refreshSummary(activeTab, currentSummary);
      
      setSummaries(prev => {
        const updated = new Map(prev);
        updated.set(activeTab, newSummary);
        return updated;
      });
    } catch (error) {
      console.error("Error refreshing summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current active summary data
  const activeSummaryData = useMemo(() => 
    summaries.get(activeTab),
    [summaries, activeTab]
  );

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-none w-full font-sans text-gray-900 overflow-hidden flex flex-col h-[600px]">
      <div className="px-4 py-3 bg-blue-900 flex items-center justify-between shrink-0">
        <h3 className="text-base font-medium text-white flex items-center gap-2">
          <ClipboardMinus className="w-5 h-5 text-white" />
          AI-Generated Summaries by Category
        </h3>
      </div>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Categories with Accordion History */}
        <div className="w-1/4 min-w-[240px] bg-white border-r border-gray-200 overflow-y-auto z-20 shadow-xl relative">
            <nav className="flex flex-col" aria-label="Tabs">
            {CATEGORIES.map((category) => (
                <React.Fragment key={category}>
                    <TabButton
                        category={category}
                        isActive={activeTab === category}
                        onClick={handleTabClick}
                    />
                    <AnimatePresence>
                      {activeTab === category && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden z-30 relative"
                          >
                            <HistoryList 
                                category={category}
                                onSelectHistory={handleSelectHistory}
                            />
                          </motion.div>
                      )}
                    </AnimatePresence>
                </React.Fragment>
            ))}
            </nav>
        </div>

        {/* Middle Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
            <div className="flex-1 p-6 overflow-y-auto relative">
                {!activeTab ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select a category</p>
                    <p className="text-sm">Choose a category from the left to view history and summaries</p>
                </div>
                ) : isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 z-10">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-gray-700">Generating new summary...</p>
                </div>
                ) : (
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{activeSummaryData?.category || activeTab}</h4>
                    <div className="text-gray-700 text-base leading-relaxed">
                    {activeSummaryData ? formatSummary(activeSummaryData.summaryText) : (
                         <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                             <p className="italic">Select a history item from the list to view summary.</p>
                         </div>
                    )}
                    </div>
                </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between text-sm text-gray-500 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span>Last updated: {activeSummaryData?.lastUpdated || 'N/A'}</span>
                {activeSummaryData?.updateType && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${activeSummaryData?.updateType === 'Weekly' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                    {activeSummaryData?.updateType}
                  </span>
                )}
                </div>
                <button
                onClick={handleRefresh}
                disabled={isLoading || !activeTab}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 4l-5 5M4 20l5-5" />
                </svg>
                <span>Refresh</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SummariesByCategory;