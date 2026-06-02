'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, User, Camera, Loader2, Check, Key, Trash2 } from 'lucide-react';
import { useUsers, useCreateUser, useDeleteUser, useResetUserPassword, useProfile, useUpdateProfile } from '@/hooks/api';
import type { UserRole } from '@/lib/database.types';

export default function UsersPage() {
  const { data: profiles = [] } = useUsers();
  const { data: profile } = useProfile();
  const { mutateAsync: createUser } = useCreateUser();
  const { mutateAsync: deleteUser } = useDeleteUser();
  const { mutateAsync: resetPassword } = useResetUserPassword();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const currentUser = profile
    ? { id: profile.id, role: profile.role }
    : null;

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', role: 'field' as UserRole });
  const [profileForm, setProfileForm] = useState({ full_name: profile?.full_name || '', avatar_url: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; role: UserRole } | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');

  const users = (profiles as Array<{ id: string; full_name: string; role: UserRole; created_at: Date; email?: string }>).map(p => ({
    id: p.id,
    name: p.full_name || 'Unknown',
    email: '',
    role: p.role,
    status: 'active' as const,
    lastLogin: p.created_at,
  }));

  const filteredUsers = users.filter(user => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const canAddUser = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const handleAddUser = async () => {
    if (!formData.name || !formData.email) { setFormError('Please fill in all required fields'); return; }
    if (!currentUser) return;
    setFormLoading(true);
    setFormError('');
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!';
    try {
      await createUser({ email: formData.email, password, full_name: formData.name, role: formData.role });
      setGeneratedPassword(password);
      setShowAddUserModal(false);
      setShowPasswordModal(true);
      setFormData({ name: '', email: '', role: 'field' });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploadingAvatar(true);
    try {
      setProfileForm({ ...profileForm, avatar_url: `/placeholder-avatar.jpg` });
    } catch (err) {
      console.error('Failed to update avatar:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setFormLoading(true);
    try {
      await updateProfile({ full_name: profileForm.full_name, avatar_url: profileForm.avatar_url });
      setIsProfileModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !resetPasswordInput) return;
    setFormLoading(true);
    try {
      await resetPassword({ id: selectedUser.id, newPassword: resetPasswordInput });
      setShowResetPasswordModal(false);
      setResetPasswordInput('');
      setSelectedUser(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      hr: 'bg-blue-100 text-blue-800',
      field: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-4 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <User className="w-4 h-4" /> My Profile
          </button>
          {canAddUser && (
            <button onClick={() => setShowAddUserModal(true)} className="px-3 lg:px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] transition-colors text-sm lg:text-base flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add User
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm lg:text-base" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm lg:text-base">
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="accountant">Accountant</option>
              <option value="hr">HR</option>
              <option value="field">Field</option>
              <option value="operator">Operator</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 hidden lg:table-header-group">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <React.Fragment key={user.id}>
                  <tr className="lg:hidden hover:bg-gray-50">
                    <td colSpan={4}>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedUser(user); setShowResetPasswordModal(true); }} className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                            <Key className="w-3 h-3" /> Reset
                          </button>
                          <button onClick={() => { if (confirm('Are you sure you want to delete this user?')) handleDeleteUser(user.id); }} className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="hidden lg:table-row hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>{user.role.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedUser(user); setShowResetPasswordModal(true); }} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Reset Password">
                          <Key className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Are you sure you want to delete this user?')) handleDeleteUser(user.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500"><User className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No users found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">Showing {filteredUsers.length} of {users.length} users</span>
        </div>
      </div>

      {/* My Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsProfileModalOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">My Profile</h2>
                  <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {profileForm.avatar_url ? (
                      <img src={profileForm.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center"><User className="w-12 h-12 text-blue-600" /></div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-[#0B3C6D] text-white p-2 rounded-full cursor-pointer hover:bg-[#0a325a]">
                      {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={uploadingAvatar} />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Click to upload avatar</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" placeholder="Enter your full name" />
                </div>
                {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{formError}</div>}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={formLoading} className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50 flex items-center justify-center gap-2">
                    {formLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddUserModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
                  <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" placeholder="Enter full name" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" placeholder="Enter email address" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20">
                    <option value="field">Field</option>
                    <option value="accountant">Accountant</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="operator">Operator</option>
                  </select>
                </div>
                {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{formError}</div>}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowAddUserModal(false); setFormError(''); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleAddUser} disabled={formLoading} className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50 flex items-center justify-center gap-2">
                    {formLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Add User'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Reveal Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-600" /></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">User Created!</h2>
                <p className="text-gray-500 mb-4">Copy the temporary password below:</p>
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                  <p className="text-2xl font-mono font-bold text-gray-800 text-center select-all">{generatedPassword}</p>
                </div>
                <p className="text-xs text-gray-400 mb-4">Share this password with the user. They should change it after first login.</p>
                <button onClick={() => setShowPasswordModal(false)} className="w-full px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]">Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetPasswordModal && selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); setResetPasswordInput(''); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Reset Password</h2>
                <button onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); setResetPasswordInput(''); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-gray-500 mb-4">Enter a new password for <span className="font-medium text-gray-900">{selectedUser.name}</span></p>
              {formError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formError}</div>}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input type="password" value={resetPasswordInput} onChange={(e) => setResetPasswordInput(e.target.value)} placeholder="Enter new password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D]" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); setResetPasswordInput(''); setFormError(''); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleResetPassword} disabled={formLoading || !resetPasswordInput} className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {formLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : <><Key className="w-4 h-4" /> Reset Password</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
