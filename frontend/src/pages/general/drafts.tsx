import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  FileText,
  Clock,
  X,
  CheckCircle,
  XCircle,
  Download,
  Search,
  MessageSquare,
  Calendar
} from 'lucide-react';

import { useAppSelector } from '@/hooks/redux';

interface Draft {
  id: string;
  title: string;
  description: string;
  postedDate: string;
  closingDate: string;
  category: string;
  status: 'Open' | 'Closed' | 'Upcoming';
  commentsCount: number;
  participants: number;
  analysisScore: number;
  pdfBase64?: string;
}

// Map API post to Draft shape
const mapPostToDraft = (post: any): Draft => ({
  id: post.id,
  title: post.title,
  description: post.description,
  postedDate: post.issueDate || post.createdAt || '',
  closingDate: post.deadline || post.updatedAt || '',
  category: post.postType || 'Other',
  status: post.status === 'Open' || post.status === 'Closed' || post.status === 'Upcoming' ? post.status : 'Open',
  commentsCount: post._count?.comments || 0,
  participants: post._count?.summaries || 0,
  analysisScore: 0, // Update if you have a field
  pdfBase64: post.pdfBase64 || undefined,
});

const Drafts: React.FC = () => {

  const { posts, loading } = useAppSelector(state => state.post);
  const drafts: Draft[] = useMemo(() => posts.map(mapPostToDraft), [posts]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [filteredDrafts, setFilteredDrafts] = useState<Draft[]>([]);

  // Helper functions
  const getDaysRemaining = (closingDate: string) => {
    const today = new Date();
    const closing = new Date(closingDate);
    const diffTime = closing.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed': return 'bg-red-100 text-red-800 border-red-200';
      case 'Upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <CheckCircle className="h-3 w-3" />;
      case 'Closed': return <XCircle className="h-3 w-3" />;
      case 'Upcoming': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Corporate Law': 'bg-purple-100 text-purple-800',
      'Digital Governance': 'bg-blue-100 text-blue-800',
      'Environment': 'bg-green-100 text-green-800',
      'Business Policy': 'bg-orange-100 text-orange-800',
      'Financial Policy': 'bg-yellow-100 text-yellow-800',
      'Technology Policy': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Corporate Law': '⚖️',
      'Digital Governance': '💻',
      'Environment': '🌍',
      'Business Policy': '📊',
      'Financial Policy': '💰',
      'Technology Policy': '🔧'
    };
    return icons[category as keyof typeof icons] || '📄';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter and sort logic
  useEffect(() => {
    const filtered = drafts.filter(draft => {
      const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draft.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || draft.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || draft.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'Newest':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        case 'Oldest':
          return new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime();
        case 'Closing Soon':
          return new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime();
        case 'Most Comments':
          return b.commentsCount - a.commentsCount;
        default:
          return 0;
      }
    });

    setFilteredDrafts(sorted);
  }, [drafts, searchTerm, selectedCategory, selectedStatus, sortBy]);

  // Get unique categories for filter dropdown - memoized to prevent recreation
  const categories = useMemo(() => ['All', ...Array.from(new Set(drafts.map(draft => draft.category)))], [drafts]);
  const statuses = ['All', 'Open', 'Closed', 'Upcoming'];

  // Active filters - memoized to prevent recreation
  const activeFilters = useMemo(() => [
    selectedCategory !== 'All' && selectedCategory,
    selectedStatus !== 'All' && selectedStatus,
    searchTerm && `Search: "${searchTerm}"`
  ].filter(Boolean), [selectedCategory, selectedStatus, searchTerm]);

  const navigate = useNavigate();
  const handleDraftClick = (draftId: string) => {
    // Navigate to the draft details page using path param
    navigate(`/drafts/comment-analysis/${draftId}`);
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Hero Section */}
      <motion.div 
        className="w-full bg-blue-50 py-12 px-4 sm:px-6 lg:px-8 mb-8 border-b border-blue-100"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Policy Drafts
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            Review and analyze government draft policies and regulations open for public consultation. 
            Your feedback shapes the future of governance.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:w-1/4 flex-shrink-0">
            <div className="sticky top-8">
              <motion.div 
                className="bg-white shadow-lg border border-slate-200 border-t-4 border-t-blue-600 p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="space-y-6">
                  {/* Search Input */}
                  <div className="w-full">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Search Drafts</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white hover:bg-slate-50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Filter Controls */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Sort Dropdown */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Sort By</label>
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="appearance-none bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full transition-all duration-200 cursor-pointer"
                        >
                          <option value="Newest">Newest First</option>
                          <option value="Oldest">Oldest First</option>
                          <option value="Closing Soon">Closing Soon</option>
                          <option value="Most Comments">Most Comments</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="appearance-none bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full transition-all duration-200 cursor-pointer"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category === 'All' ? 'All Categories' : category}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                      <div className="relative">
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="appearance-none bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full transition-all duration-200 cursor-pointer"
                        >
                          {statuses.map(status => (
                            <option key={status} value={status}>
                              {status === 'All' ? 'All Status' : status}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {activeFilters.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 mt-6">
                    <div className="flex flex-col gap-3">
                      <span className="text-sm text-slate-600 font-medium">Active Filters:</span>
                      <div className="flex flex-wrap gap-2">
                        {activeFilters.map((filter, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                          >
                            <span className="truncate max-w-[120px]">{filter}</span>
                            <button
                              onClick={() => {
                                if (filter === selectedCategory) setSelectedCategory('All');
                                if (filter === selectedStatus) setSelectedStatus('All');
                                if (typeof filter === 'string' && filter.startsWith('Search:')) setSearchTerm('');
                              }}
                              className="flex-shrink-0 hover:text-blue-900 transition-colors rounded-full p-0.5 hover:bg-blue-200"
                              aria-label={`Remove ${filter} filter`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('All');
                            setSelectedStatus('All');
                          }}
                          className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors px-2 py-1 rounded hover:bg-slate-100"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Right Side - Drafts List */}
          <div className="lg:w-3/4">

        {/* Results Summary and Stats */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredDrafts.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{drafts.length}</span> drafts
            </p>
            {activeFilters.length > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''} applied
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Live updates</span>
            </div>
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              Last updated: {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>

        {/* Draft Cards List */}
        <div className="space-y-6 mb-12">
          {filteredDrafts.length === 0 ? (
            <>{loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
                <span className="text-blue-600 text-lg font-semibold">Loading drafts...</span>
              </div>
            )}
            {!loading && (
             <div className="text-center py-20 bg-slate-50 border border-slate-200 border-dashed">
                <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <FileText className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No drafts found</h3>
                <p className="text-slate-600 max-w-md mx-auto">Try adjusting your search terms or filter criteria to find relevant draft policies.</p>
              </div>
            )}
            </>
          ) : (
            filteredDrafts.map((draft, index) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">

                    {/* Left Section - Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Status and Category Header */}
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(draft.status)}`}>
                          {getStatusIcon(draft.status)}
                          {draft.status}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(draft.category)}`}>
                          <span>{getCategoryIcon(draft.category)}</span>
                          <span>{draft.category}</span>
                        </span>
                        {draft.status === 'Open' && (
                          <span className="text-xs text-orange-600 font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getDaysRemaining(draft.closingDate)} days left
                          </span>
                        )}
                      </div>

                      {/* Title and Description */}
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-700 transition-colors cursor-pointer"
                          onClick={() => handleDraftClick(draft.id)}
                        >
                          {draft.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed line-clamp-2 text-base">
                          {draft.description}
                        </p>
                      </div>

                      {/* Timeline */}
                      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 mb-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Posted: {formatDate(draft.postedDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Closes: {formatDate(draft.closingDate)}</span>
                        </div>
                      </div>

                      {/* Engagement Metrics */}
                      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <span className="font-bold text-slate-700">{draft.commentsCount.toLocaleString()}</span>
                          <span>comments</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Status & Actions */}
                    <div className="flex-shrink-0 flex lg:flex-col gap-3 lg:items-end justify-between h-full">
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4 lg:mt-0">
                        <button
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium text-sm"
                          title="Download Draft"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!draft.pdfBase64) {
                              alert('No PDF available for this draft.');
                              return;
                            }
                            // Decode base64 and trigger download
                            const byteCharacters = atob(draft.pdfBase64);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                              byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${draft.title || 'draft'}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            setTimeout(() => {
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            }, 100);
                          }}
                        >
                          <Download className="h-4 w-4" />
                          <span>PDF</span>
                        </button>
                        
                        <button
                          onClick={() => handleDraftClick(draft.id)}
                          className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-bold text-sm shadow-md"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {filteredDrafts.length > 0 && filteredDrafts.length < drafts.length && (
          <div className="text-center pt-8 pb-12">
            <button className="inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 font-bold shadow-md hover:shadow-xl group">
              <span>Load More Drafts</span>
              <ChevronDown className="h-4 w-4 group-hover:animate-bounce" />
            </button>
            <p className="text-sm text-slate-500 mt-3">
              Showing {filteredDrafts.length} of {drafts.length} total drafts
            </p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drafts;