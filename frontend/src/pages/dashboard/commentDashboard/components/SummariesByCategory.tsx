import React, { useState, useEffect, useMemo } from 'react';

// --- TYPE DEFINITIONS ---
type SummaryData = {
  id: string; // Using a unique ID is better for keys
  category: string;
  summaryText: string;
  lastUpdated: string;
  updateType: 'Weekly' | 'Manual';
};

const mockSummaries: SummaryData[] = [
  {
    id: 'sum_overall',
    category: 'Overall Summary',
    summaryText: 'The public comments reveal a deep engagement with the proposed digital competition regulations, highlighting both strong support for proactive measures and significant concerns about the potential negative impacts of an ex-ante framework. Some Stackholders advocates for a more detailed and prescriptive ex-ante regime, emphasizing fairness, transparency, and specific mandates. Conversely, Some  argues for the sufficiency of existing ex-post competition law, prioritizing flexibility and avoiding the stifling of innovation. The predominantly negative sentiment towards the proposed framework underscores the need for careful reconsideration and refinement. The recommendations provided aim to address the critical issues raised, focusing on enhancing objectivity in designation, strengthening transparency and accountability, ensuring practical implementation of mandates, and balancing regulatory intervention with the need to foster innovation and support smaller market players. A balanced approach that incorporates the lessons learned from both ex-ante and ex-post regulatory philosophies, with a strong emphasis on clarity, proportionality, and evidence-based enforcement, will be crucial for developing effective digital competition regulations that promote a fair and dynamic digital economy.',
    lastUpdated: '29-Sep-2025 09:00 AM',
    updateType: 'Weekly',
  }
  // ,
  // {
  //   id: 'sum_corporate_debtor',
  //   category: 'Corporate Debtor',
  //   summaryText: 'Corporate Debtors largely support the MDP proposal, seeing it as a way to access more integrated and cost-effective advisory services for restructuring and compliance, which could simplify the insolvency process.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_personal_guarantor',
  //   category: 'Personal Guarantor to a Corporate Debtor',
  //   summaryText: 'Feedback from Personal Guarantors indicates support for the MDP framework, as they believe integrated professional services could lead to better and more efficient corporate resolution outcomes, thereby reducing their personal liability risk.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_investors',
  //   category: 'Investors',
  //   summaryText: 'Investors are cautiously optimistic, supporting the potential for MDPs to create stronger, globally competitive Indian firms. However, they express significant concerns about maintaining audit independence and corporate governance standards within a multidisciplinary setup.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_insolvency_professional_entity',
  //   category: 'Insolvency Professional Entity',
  //   summaryText: 'Insolvency Professional Entities are strongly in favor of the draft, viewing it as a landmark reform. They highlight that MDPs will enable them to form strategic alliances with legal and financial experts to offer comprehensive, end-to-end resolution services.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_partnership_firms',
  //   category: 'Partnership firms',
  //   summaryText: 'Existing partnership firms welcome the opportunity to expand their service offerings through MDPs. Their suggestions focus on ensuring the new framework provides a level playing field and does not create undue advantages for larger, foreign-affiliated networks.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_others',
  //   category: 'Others',
  //   summaryText: 'Comments from the "Others" category show a mixed but generally positive sentiment. The feedback includes a variety of niche suggestions and concerns that do not fall into the other predefined stakeholder groups.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_academics',
  //   category: 'Academics',
  //   summaryText: 'Academics support the proposal in principle, citing international precedents for MDPs. Their feedback strongly recommends a cautious, phased implementation with a robust regulatory framework to address potential ethical conflicts and monopolistic practices.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_user',
  //   category: 'User',
  //   summaryText: 'General users view the MDP initiative positively, focusing on the "Atmanirbhar Bharat" aspect. They believe creating strong Indian firms will generate more high-skilled jobs and enhance national prestige in the global professional services market.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_insolvency_professional_agency',
  //   category: 'Insolvency Professional Agency',
  //   summaryText: 'Regulatory agencies for Insolvency Professionals express a neutral but cautious stance. Their primary concern is maintaining professional standards, ethics, and disciplinary oversight in a complex multi-disciplinary environment.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_general',
  //   category: 'General',
  //   summaryText: 'General comments provide a balanced overview of public sentiment. There is broad support for the goal of strengthening Indian firms, coupled with suggestions for ensuring the reforms are implemented carefully and fairly.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_insolvency_professional',
  //   category: 'Insolvency Professional',
  //   summaryText: 'Individual Insolvency Professionals are highly enthusiastic about the MDP draft. They see it as a significant opportunity to broaden their practice, collaborate with other experts, and offer more holistic solutions to clients.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_proprietorship_firms',
  //   category: 'Proprietorship firms',
  //   summaryText: 'Proprietorship firms express mixed feelings. While some see potential for collaboration and growth, many are concerned about being outcompeted by new, large-scale MDPs and advocate for protective measures for smaller entities.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
  // {
  //   id: 'sum_creditor_corporate_debtor',
  //   category: 'Creditor to a Corporate Debtor',
  //   summaryText: 'Creditors are largely supportive of the MDP proposal. They believe that integrated advisory firms can lead to more efficient and successful corporate resolutions, which in turn improves the chances of better and faster debt recovery.',
  //   lastUpdated: '29-Sep-2025 09:00 AM',
  //   updateType: 'Weekly',
  // },
];
interface TabButtonProps {
  category: string;
  isActive: boolean;
  onClick: (category: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ category, isActive, onClick }) => {
  const activeClasses = 'border-blue-600 text-blue-700 bg-blue-50';
  const inactiveClasses = 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-200';
  
  return (
    <button
      onClick={() => onClick(category)}
      className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-t-md
        ${isActive ? activeClasses : inactiveClasses}
      `}
      style={{ minWidth: '140px' }}
      aria-current={isActive ? 'page' : undefined}
    >
      {category}
    </button>
  );
};


// --- Main Optimized Component ---
const SummariesByCategory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // In a real app, you would fetch this from your backend
    setSummaries(mockSummaries);
    setActiveTab(mockSummaries[0]?.category || '');
  }, []);

  // Optimized: A single handler function for all tabs
  const handleTabClick = (category: string) => {
    setActiveTab(category);
  };

  const handleRefresh = () => {
    console.log(`Refreshing summary for: ${activeTab}`);
    setIsLoading(true);
    setTimeout(() => {
      const updatedSummaries = summaries.map(s => 
        s.category === activeTab 
        ? { ...s, summaryText: `(Refreshed) ${s.summaryText.replace('(Refreshed) ','')}`, lastUpdated: new Date().toLocaleString(), updateType: 'Manual' as const }
        : s
      );
      setSummaries(updatedSummaries);
      setIsLoading(false);
    }, 2000);
  };

  // Optimized: Memoize the result of the .find() operation
  const activeSummaryData = useMemo(() => 
    summaries.find(s => s.category === activeTab),
    [summaries, activeTab]
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 w-full max-w-7xl mx-auto font-sans text-gray-900">
      <h2 className="text-xl font-bold mb-4 text-gray-800">AI-Generated Summaries by Category</h2>

      {/* Tab Navigation - with a fade effect to indicate scrollability */}
      <div className="relative border-b border-gray-200 mb-4">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100">
            <nav className="pb-[2px] flex space-x-4 min-w-max" aria-label="Tabs">
            {summaries.map((summary) => (
                <TabButton
                key={summary.id}
                category={summary.category}
                isActive={activeTab === summary.category}
                onClick={handleTabClick}
                />
            ))}
            </nav>
        </div>
        <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white pointer-events-none"></div>
      </div>


      {/* Summary Content Area */}
      <div className="relative min-h-[150px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 rounded-md z-10">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-700">Generating new summary, this may take a moment...</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 leading-relaxed">
              {activeSummaryData?.summaryText || 'No summary available.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between text-sm text-gray-500">
        <div>
          <span>Last updated: {activeSummaryData?.lastUpdated}</span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${activeSummaryData?.updateType === 'Weekly' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
            {activeSummaryData?.updateType}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 4l-5 5M4 20l5-5" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default SummariesByCategory;
