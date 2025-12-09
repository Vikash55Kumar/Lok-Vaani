import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentMagnifyingGlassIcon,
//   Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import SystemOverview from './components/SystemOverview';
import UserManagement from './components/UserManagement';
import NCOCodeManagement from './components/NCOCodeManagement';
import DatasetManagement from './components/DatasetManagement';
import Reports from './components/Reports';
// import SystemConfiguration from './components/SystemConfiguration';
import AuditLogs from './components/AuditLogs';
import AIAgentChatbot from '../AIAgentChatbot';
import { useChatbot } from '../../../context/ChatbotContext';
import { cn } from '@/lib/utils';

type AdminTab = 
  | 'overview' 
  | 'users' 
  | 'nco-codes' 
  | 'searches' 
  | 'datasets' 
  | 'config' 
  | 'reports' 
  | 'audit';

const AdminDashboard: React.FC = () => {
  const { isOpen } = useChatbot();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const adminTabs = [
    { id: 'overview', name: 'System Overview', icon: ChartBarIcon, component: SystemOverview },
    { id: 'users', name: 'User Management', icon: UsersIcon, component: UserManagement },
    { id: 'nco-codes', name: 'NCO Codes', icon: DocumentMagnifyingGlassIcon, component: NCOCodeManagement },
    // { id: 'searches', name: 'Search Management', icon: FolderIcon, component: SearchManagement },
    { id: 'datasets', name: 'Datasets', icon: ClipboardDocumentListIcon, component: DatasetManagement },
    // { id: 'config', name: 'System Config', icon: Cog6ToothIcon, component: SystemConfiguration },
    { id: 'reports', name: 'Reports', icon: ClipboardDocumentListIcon, component: Reports },
    { id: 'audit', name: 'Audit Logs', icon: ShieldCheckIcon, component: AuditLogs },
  ];

  const currentTab = adminTabs.find(tab => tab.id === activeTab);
  const CurrentComponent = currentTab?.component;

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${isOpen ? 'w-1/2' : 'w-full'}`}>
      {/* Enhanced Admin Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div
                    className="flex items-center justify-center h-16 w-16 rounded-xl shadow-lg ring-4 ring-white"
                    style={{ 
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
                    }}
                  >
                    <ShieldCheckIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    Administrator Control Panel
                  </h1>
                  <p className="text-gray-600 font-medium">
                    National Classification of Occupations Portal
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    System Management & Monitoring Dashboard
                  </p>
                </div>
              </div>
              
              {/* System Status & Controls */}
              <div className="hidden lg:flex flex-col items-end space-y-3">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="absolute top-0 left-0 h-3 w-3 bg-red-400 rounded-full animate-ping"></div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-800">
                        Administrative Access
                      </div>
                      <div className="text-xs text-red-600">
                        Full System Control
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(currentTime, 'EEEE, MMMM do, yyyy • h:mm a')}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded-md">
                    Admin Portal v2.1
                  </span>
                </div>
              </div>
            </div>
            
            {/* Mobile Admin Status */}
            <div className="lg:hidden mt-4">
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="absolute top-0 left-0 h-2 w-2 bg-red-400 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-sm font-medium text-red-800">Admin Mode Active</span>
                  </div>
                  <span className="text-xs text-gray-500">v2.1</span>
                </div>
              </div>
            </div>
            
            {/* System Health & Quick Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CpuChipIcon className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-green-900">System Health</h3>
                    <p className="text-xs text-green-700">All services operational</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UsersIcon className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Active Users</h3>
                    <p className="text-xs text-blue-700">Real-time monitoring</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-purple-900">Security Status</h3>
                    <p className="text-xs text-purple-700">Protected & monitored</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-900">Performance</h3>
                    <p className="text-xs text-amber-700">Optimal response times</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={cn("flex", isOpen ? "flex-col space-y-8" : "space-x-8")}>
          {/* Sidebar Navigation */}
          <div className={cn("flex-shrink-0", isOpen ? "w-full" : "w-64")}>
            <nav className={cn("space-y-2", isOpen && "grid grid-cols-2 gap-2 space-y-0")}>
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AdminTab)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-[600px]">
            {CurrentComponent && <CurrentComponent />}
          </div>
        </div>
      </div>
      <AIAgentChatbot />
    </div>
  );
};

export default AdminDashboard;
