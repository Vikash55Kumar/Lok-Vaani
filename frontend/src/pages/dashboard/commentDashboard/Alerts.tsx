import { AlertsSection, Sidebar } from './components';
import AIAgentChatbot from '../AIAgentChatbot';
import { useChatbot } from '../../../context/ChatbotContext';

const Alerts = () => {
    const { isOpen } = useChatbot();

    const alerts = [
    {
      id: '1',
      title: 'High Negative Sentiment Detected',
      description: 'Recent comments show increased negative sentiment. Immediate attention required.',
      count: 23,
      alertType: 'warning' as const
    },
    {
      id: '2',
      title: 'Processing Queue Status',
      description: 'Some comments are pending analysis due to high volume.',
      count: 8,
      alertType: 'info' as const
    }
  ]

  return (
    <div className={`bg-white font-sans relative min-h-screen transition-all duration-300 ${isOpen ? 'w-1/2' : 'w-full'}`}>
      <Sidebar />
      <div className="py-4 ml-14">
        <div className='mt-3'>
            {/* Alerts Section */}
            <AlertsSection alerts={alerts} />
        </div>
      </div>
      <AIAgentChatbot />
    </div>
  )
}

export default Alerts