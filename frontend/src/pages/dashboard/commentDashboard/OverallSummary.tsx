import SummariesByCategory from "./components/SummariesByCategory"
import { Sidebar } from "./components"
// import AIAgentChatbot from "../AIAgentChatbot"
import { useChatbot } from "../../../context/ChatbotContext"

const OverallSummary = () => {
  const { isOpen } = useChatbot();

  return (
    <div className={`min-h-screen bg-gray-50/50 transition-all duration-300 ${isOpen ? 'w-1/2' : 'w-full'}`}>
        <Sidebar />
        <main className="ml-14 p-6">
          <div className="w-full">
            <SummariesByCategory />
          </div>
        </main>
        {/* <AIAgentChatbot /> */}
    </div>
  )
}

export default OverallSummary