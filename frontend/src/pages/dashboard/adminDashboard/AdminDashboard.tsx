import React, { useState } from 'react';
import Sidebar from '../commentDashboard/components/Sidebar';
import { 
  User, 
  Mail, 
  Shield, 
  Check, 
  Plus, 
  Trash2, 
  History,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
type RoleType = 'Bureaucrat' | 'Minister' | 'Clerk' | 'Custom';

interface Permission {
  id: string;
  label: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  permissions: string[];
  createdAt: string;
  status: 'Active' | 'Inactive';
}

// --- Constants ---
const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: 'view_analytics', label: 'View Analytics' },
  { id: 'manage_users', label: 'Manage Users' },
  { id: 'manage_comments', label: 'Manage Comments' },
  { id: 'generate_reports', label: 'Generate Reports' },
  { id: 'system_config', label: 'System Configuration' },
  { id: 'view_audit_logs', label: 'View Audit Logs' },
];

const TEMPLATES: Record<Exclude<RoleType, 'Custom'>, string[]> = {
  Bureaucrat: ['view_analytics', 'manage_users', 'manage_comments', 'generate_reports', 'view_audit_logs'],
  Minister: ['view_analytics', 'generate_reports'],
  Clerk: ['manage_comments', 'view_analytics'],
};

const AdminDashboard = () => {
  // --- State ---
  const [admins, setAdmins] = useState<AdminUser[]>([
    {
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@gov.in',
      role: 'Bureaucrat',
      permissions: TEMPLATES.Bureaucrat,
      createdAt: new Date('2024-01-15').toLocaleDateString(),
      status: 'Active',
    },
    {
      id: '2',
      name: 'Amit Singh',
      email: 'amit.singh@gov.in',
      role: 'Clerk',
      permissions: TEMPLATES.Clerk,
      createdAt: new Date('2024-02-10').toLocaleDateString(),
      status: 'Active',
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Bureaucrat' as RoleType,
    customPermissions: [] as string[],
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role: RoleType) => {
    setFormData(prev => ({
      ...prev,
      role,
      customPermissions: role === 'Custom' ? [] : [...(TEMPLATES[role as keyof typeof TEMPLATES] || [])]
    }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    if (formData.role !== 'Custom') return;

    setFormData(prev => {
      const current = prev.customPermissions;
      const updated = current.includes(permissionId)
        ? current.filter(id => id !== permissionId)
        : [...current, permissionId];
      return { ...prev, customPermissions: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple Validation
    if (!formData.name || !formData.email) return;

    const newAdmin: AdminUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      permissions: formData.role === 'Custom' ? formData.customPermissions : TEMPLATES[formData.role as keyof typeof TEMPLATES],
      createdAt: new Date().toLocaleDateString(),
      status: 'Active',
    };

    setAdmins(prev => [newAdmin, ...prev]);
    setFormData({
      name: '',
      email: '',
      role: 'Bureaucrat',
      customPermissions: [],
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    setAdminToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (adminToDelete) {
      setAdmins(prev => prev.filter(admin => admin.id !== adminToDelete));
      setDeleteModalOpen(false);
      setAdminToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setAdminToDelete(null);
  };

  return (
    <div className="bg-[#f0f4f8] font-sans relative min-h-screen flex">
      <Sidebar />
      
      <div className="py-2 ml-14 w-full transition-all duration-300">
        <div className="w-full px-2 space-y-3">
          
          {/* Top Section: Header & Stats - Aligned with Grid Below */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Header Block - Matches Left Column Width */}
            <div className="xl:col-span-7 bg-white p-4 border-t-4 border-[#0846AA] shadow-sm flex flex-col justify-center">
              <h1 className="text-3xl font-semibold text-[#092044] flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#0846AA]" />
                Admin Management Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Create, manage, and monitor administrative access controls.</p>
            </div>
            
            {/* Stats Cards - Matches Right Column Width */}
            <div className="xl:col-span-5 flex gap-4">
              <div className="bg-white px-6 py-2 shadow-sm border border-gray-200 flex flex-col items-center justify-center rounded-none border-t-4 border-t-[#0846AA] flex-1">
                <span className="text-3xl font-bold text-[#0846AA]">{admins.length}</span>
                <span className="text-sm text-gray-500 font-semibold uppercase">Total Admins</span>
              </div>
              <div className="bg-white px-6 py-2 shadow-sm border border-gray-200 flex flex-col items-center justify-center rounded-none border-t-4 border-t-green-600 flex-1">
                <span className="text-3xl font-bold text-green-600">
                  {admins.filter(a => a.status === 'Active').length}
                </span>
                <span className="text-sm text-gray-500 font-semibold uppercase">Active Now</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            
            {/* Left Column: Create Admin Form */}
            <div className="xl:col-span-7 space-y-6">
              <div className="bg-white shadow-md border border-gray-200">
                <div className="flex items-center gap-3 p-2 bg-[#0846AA] text-white">
                  <UserPlus className="w-5 h-5 text-white" />
                  <h2 className=" font-semibold text-white">Create New Admin</h2>
                </div>

                <div className="p-4">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Aditi Sharma"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-1 focus:ring-[#0846AA] focus:border-[#0846AA] outline-none transition-all rounded-none"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="e.g. aditi@gov.in"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-1 focus:ring-[#0846AA] focus:border-[#0846AA] outline-none transition-all rounded-none"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700">Select Role Template</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(['Bureaucrat', 'Minister', 'Clerk', 'Custom'] as RoleType[]).map((role) => (
                          <div
                            key={role}
                            onClick={() => handleRoleSelect(role)}
                            className={cn(
                              "cursor-pointer p-3 border-2 text-center transition-all duration-200 hover:shadow-sm rounded-none",
                              formData.role === role 
                                ? "border-[#0846AA] bg-blue-50 text-[#0846AA]" 
                                : "border-gray-200 hover:border-blue-200 text-gray-600"
                            )}
                          >
                            <div className="font-bold text-sm">{role}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Permissions Area */}
                    <div className="space-y-3 bg-gray-50 p-4 border border-gray-200 rounded-none">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700">
                          {formData.role === 'Custom' ? 'Select Permissions' : 'Included Permissions'}
                        </label>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 border border-gray-300 rounded-none">
                          {formData.role === 'Custom' ? 'Editable' : 'Template Locked'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {AVAILABLE_PERMISSIONS.map((perm) => {
                          const isSelected = formData.role === 'Custom' 
                            ? formData.customPermissions.includes(perm.id)
                            : TEMPLATES[formData.role as keyof typeof TEMPLATES]?.includes(perm.id);

                          return (
                            <div 
                              key={perm.id}
                              onClick={() => handlePermissionToggle(perm.id)}
                              className={cn(
                                "flex items-center space-x-3 p-2 transition-colors rounded-none",
                                formData.role === 'Custom' ? "cursor-pointer hover:bg-white" : "cursor-default opacity-80"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 border flex items-center justify-center transition-all rounded-none",
                                isSelected ? "bg-[#0846AA] border-[#0846AA]" : "bg-white border-gray-300"
                              )}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-gray-700">{perm.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#0846AA] hover:bg-blue-700 text-white font-bold py-3 px-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 rounded-none"
                    >
                      <Plus className="w-5 h-5" />
                      Create Administrator
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Column: Admin Log */}
            <div className="xl:col-span-5 space-y-6">
              
              <div className="bg-white shadow-md border border-gray-200 h-fit rounded-none">
                <div className="flex items-center gap-3 p-2 bg-[#0846AA] text-white">
                  <History className="w-5 h-5 text-white" />
                  <h2 className="text-white font-semibold">Admin Log</h2>
                </div>

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  {admins.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No admins created yet.</div>
                  ) : (
                    admins.map((admin) => (
                      <div key={admin.id} className="group p-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-all rounded-none">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-gray-800">{admin.name}</h3>
                            <p className="text-xs text-gray-500">{admin.email}</p>
                          </div>
                          <span className={cn(
                            "px-2 py-1 text-xs font-semibold rounded-none",
                            admin.role === 'Custom' ? "bg-purple-100 text-purple-700" :
                            admin.role === 'Bureaucrat' ? "bg-blue-100 text-blue-700" :
                            admin.role === 'Minister' ? "bg-amber-100 text-amber-700" :
                            "bg-green-100 text-green-700"
                          )}>
                            {admin.role}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-3 mb-3">
                          {admin.permissions.slice(0, 3).map(p => (
                            <span key={p} className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-none">
                              {p.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {admin.permissions.length > 3 && (
                            <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-none">
                              +{admin.permissions.length - 3} more
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2 mt-2">
                          <span className="text-xs text-gray-400">Created: {admin.createdAt}</span>
                          <button 
                            onClick={() => handleDelete(admin.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-none"
                            title="Remove Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 shadow-2xl w-full max-w-md border-t-4 border-red-600 animate-in fade-in zoom-in-95 duration-200 rounded-none">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Revoke Admin Access?</h3>
                <p className="text-gray-500">
                  Are you sure you want to remove this admin? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors rounded-none"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-sm rounded-none"
                >
                  Revoke Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50 rounded-none">
          <Check className="w-5 h-5" />
          <span className="font-semibold">Admin Created Successfully!</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
