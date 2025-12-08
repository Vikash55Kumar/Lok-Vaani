import SummariesByCategory from "./components/SummariesByCategory"
import HistoryOverallSummary from "./components/HistoryOverallSummary"
import { Sidebar } from "./components"
import AIAgentChatbot from "../AIAgentChatbot"
import { useChatbot } from "../../../context/ChatbotContext"
import { cn } from "@/lib/utils"

const OverallSummary = () => {
  const { isOpen } = useChatbot();
  return (
    <div className={`min-h-screen bg-gray-50/50 transition-all duration-300 ${isOpen ? 'w-1/2' : 'w-full'}`}>
        <Sidebar />
        <main className="ml-14 p-6">
          <div className={cn("flex gap-6 items-start", isOpen ? "flex-col" : "flex-row")}>
            <div className={cn("shrink-0 sticky top-6", isOpen ? "w-full relative top-0" : "w-80")}>
              <HistoryOverallSummary />
            </div>
            <div className="flex-1 min-w-0 w-full">
              <SummariesByCategory />
            </div>
          </div>
        </main>
        <AIAgentChatbot />
    </div>
  )
}

export default OverallSummary