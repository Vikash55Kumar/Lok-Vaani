import React, { useState, useEffect, useRef } from 'react';
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { usePdfExport } from '../../../../hooks/usePdfExport';
import ReportTemplate from '../../../../components/dashboard/ReportTemplate';
import SystemOverview from './SystemOverview';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: string[];
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ON_DEMAND';
  isActive: boolean;
  lastGenerated?: string;
  nextScheduled?: string;
}

interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  category: string;
  generatedAt: string;
  generatedBy: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  fileSize: number;
  downloadCount: number;
  expiresAt: string;
}

const Reports: React.FC = () => {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'generated'>('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // PDF Export hooks
  const { exportToPdf } = usePdfExport();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // TODO: Replace with actual API calls
      const mockTemplates: ReportTemplate[] = [
        {
          id: '1',
          name: 'User Activity Report',
          description: 'Comprehensive report on user registrations, logins, and search activities',
          category: 'User Analytics',
          parameters: ['date_range', 'user_type', 'activity_type'],
          frequency: 'WEEKLY',
          isActive: true,
          lastGenerated: '2024-01-20T10:00:00Z',
          nextScheduled: '2024-01-27T10:00:00Z'
        },
        {
          id: '2',
          name: 'Search Performance Report',
          description: 'Analysis of search queries, response times, and accuracy metrics',
          category: 'System Performance',
          parameters: ['date_range', 'query_type', 'performance_metrics'],
          frequency: 'DAILY',
          isActive: true,
          lastGenerated: '2024-01-21T06:00:00Z',
          nextScheduled: '2024-01-22T06:00:00Z'
        },
        {
          id: '3',
          name: 'NCO Code Usage Report',
          description: 'Statistics on most searched NCO codes and classification trends',
          category: 'Business Intelligence',
          parameters: ['date_range', 'nco_groups', 'usage_metrics'],
          frequency: 'MONTHLY',
          isActive: true,
          lastGenerated: '2024-01-01T12:00:00Z',
          nextScheduled: '2024-02-01T12:00:00Z'
        },
        {
          id: '4',
          name: 'System Health Report',
          description: 'Infrastructure metrics, error rates, and system availability',
          category: 'System Performance',
          parameters: ['date_range', 'service_components', 'health_metrics'],
          frequency: 'WEEKLY',
          isActive: true,
          lastGenerated: '2024-01-19T08:00:00Z',
          nextScheduled: '2024-01-26T08:00:00Z'
        }
      ];

      const mockGenerated: GeneratedReport[] = [
        {
          id: '1',
          templateId: '1',
          templateName: 'User Activity Report',
          category: 'User Analytics',
          generatedAt: '2024-01-20T10:00:00Z',
          generatedBy: 'System Scheduler',
          status: 'COMPLETED',
          fileSize: 2.3 * 1024 * 1024, // 2.3 MB
          downloadCount: 12,
          expiresAt: '2024-02-20T10:00:00Z'
        },
        {
          id: '2',
          templateId: '2',
          templateName: 'Search Performance Report',
          category: 'System Performance',
          generatedAt: '2024-01-21T06:00:00Z',
          generatedBy: 'System Scheduler',
          status: 'COMPLETED',
          fileSize: 1.8 * 1024 * 1024, // 1.8 MB
          downloadCount: 8,
          expiresAt: '2024-02-21T06:00:00Z'
        },
        {
          id: '3',
          templateId: '3',
          templateName: 'NCO Code Usage Report',
          category: 'Business Intelligence',
          generatedAt: '2024-01-21T14:30:00Z',
          generatedBy: 'Admin User',
          status: 'PROCESSING',
          fileSize: 0,
          downloadCount: 0,
          expiresAt: '2024-02-21T14:30:00Z'
        }
      ];

      setReportTemplates(mockTemplates);
      setGeneratedReports(mockGenerated);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['ALL', 'User Analytics', 'System Performance', 'Business Intelligence', 'Compliance'];

  const filteredTemplates = reportTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredGenerated = generatedReports.filter(report => {
    const matchesSearch = report.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || report.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyBadge = (frequency: string): string => {
    switch (frequency) {
      case 'DAILY': return 'bg-blue-100 text-blue-800';
      case 'WEEKLY': return 'bg-green-100 text-green-800';
      case 'MONTHLY': return 'bg-purple-100 text-purple-800';
      case 'QUARTERLY': return 'bg-orange-100 text-orange-800';
      case 'YEARLY': return 'bg-red-100 text-red-800';
      case 'ON_DEMAND': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    // Generate PDF for the "User Activity Report" (using SystemOverview as mock)
    console.log('Generating report for template:', templateId);
    await exportToPdf(reportRef, { fileName: 'System_Report.pdf' });
  };

  const handleDownloadReport = async (reportId: string) => {
    // Re-download the PDF
    console.log('Downloading report:', reportId);
    await exportToPdf(reportRef, { fileName: 'System_Report_Downloaded.pdf' });
  };

  const CreateReportModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Create Report Template</h3>
          <button
            onClick={() => setShowCreateModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="">Select category</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Describe what this report includes"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="ON_DEMAND">On Demand</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output Format</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="PDF">PDF</option>
                <option value="EXCEL">Excel</option>
                <option value="CSV">CSV</option>
                <option value="JSON">JSON</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parameters</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <label className="text-sm text-gray-700">Date Range</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <label className="text-sm text-gray-700">User Type Filter</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <label className="text-sm text-gray-700">Performance Metrics</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <label className="text-sm text-gray-700">NCO Code Groups</label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Create Template
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden Report Template for Printing */}
      <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
        <ReportTemplate ref={reportRef} title="System Overview Report" subtitle="Comprehensive Analysis of System Metrics">
          <SystemOverview />
        </ReportTemplate>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-600">Generate and manage system reports</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Analytics Dashboard
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <DocumentChartBarIcon className="h-5 w-5 mr-2" />
            Create Template
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">{reportTemplates.length}</div>
          <div className="text-sm text-gray-600">Report Templates</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-blue-600">{generatedReports.length}</div>
          <div className="text-sm text-gray-600">Generated Reports</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-green-600">
            {reportTemplates.filter(t => t.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Templates</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-purple-600">
            {generatedReports.reduce((acc, report) => acc + report.downloadCount, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Downloads</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates ({reportTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('generated')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generated'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generated Reports ({generatedReports.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'ALL' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFrequencyBadge(template.frequency)}`}>
                            {template.frequency.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="text-xs text-gray-500 mb-3">Category: {template.category}</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Parameters:</span>
                          <div className="text-gray-600">{template.parameters.join(', ')}</div>
                        </div>
                        {template.lastGenerated && (
                          <div>
                            <span className="font-medium text-gray-700">Last Generated:</span>
                            <div className="text-gray-600">
                              {new Date(template.lastGenerated).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {template.nextScheduled && (
                          <div>
                            <span className="font-medium text-gray-700">Next Scheduled:</span>
                            <div className="text-gray-600">
                              {new Date(template.nextScheduled).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => handleGenerateReport(template.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Generate Now
                      </button>
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'generated' && (
            <div className="space-y-4">
              {filteredGenerated.map((report) => (
                <div key={report.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{report.templateName}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-3">Category: {report.category}</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Generated:</span>
                          <div className="text-gray-600">
                            {new Date(report.generatedAt).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Generated By:</span>
                          <div className="text-gray-600">{report.generatedBy}</div>
                        </div>
                        {report.fileSize > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">File Size:</span>
                            <div className="text-gray-600">{formatFileSize(report.fileSize)}</div>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Downloads:</span>
                          <div className="text-gray-600">{report.downloadCount}</div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Expires: {new Date(report.expiresAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      {report.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleDownloadReport(report.id)}
                          className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      )}
                      {report.status === 'PROCESSING' && (
                        <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Processing...
                        </div>
                      )}
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {((activeTab === 'templates' && filteredTemplates.length === 0) ||
            (activeTab === 'generated' && filteredGenerated.length === 0)) && (
            <div className="text-center py-12">
              <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab === 'templates' ? 'templates' : 'reports'} found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && <CreateReportModal />}
    </div>
  );
};

export default Reports;
