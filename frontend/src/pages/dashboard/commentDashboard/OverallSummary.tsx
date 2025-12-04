import SummariesByCategory from "./components/SummariesByCategory"
import HistoryOverallSummary from "./components/HistoryOverallSummary"
import { Sidebar } from "./components"

const OverallSummary = () => {
  return (
    <div className="min-h-screen bg-gray-50/50">
        <Sidebar />
        <main className="ml-14 p-6">
          <div className="flex gap-6 items-start">
            <div className="w-80 shrink-0 sticky top-6">
              <HistoryOverallSummary />
            </div>
            <div className="flex-1 min-w-0">
              <SummariesByCategory />
            </div>
          </div>
        </main>
    </div>
  )
}

export default OverallSummary