'use client';

import { useState } from 'react';
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/api';
import { User, Mail, Shield, Calendar, Camera, Loader2, Save, Lock, EyeOff, Eye, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserRole } from '@/lib/database.types';

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  // Get email from localStorage since profile doesn't return it
  const storedUser = typeof window !== 'undefined'
    ? localStorage.getItem('senexpert_user')
    : null;
  const userEmail = storedUser ? JSON.parse(storedUser).email : '';

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
  });

  // ── Change Password ──
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const { mutateAsync: changePassword, isPending: changingPassword } = useChangePassword();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await updateProfile({ avatar_url: base64 });
        setFormData(prev => ({ ...prev, avatar_url: base64 }));
        setSaving(false);
      };
      reader.onerror = () => { setSaving(false); };
      reader.readAsDataURL(file);
    } catch {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile({ full_name: formData.full_name, avatar_url: formData.avatar_url });
      const stored = localStorage.getItem('senexpert_profile');
      if (stored) {
        const p = JSON.parse(stored);
        p.full_name = formData.full_name;
        p.avatar_url = formData.avatar_url;
        localStorage.setItem('senexpert_profile', JSON.stringify(p));
      }
      window.dispatchEvent(new Event('auth-change'));
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMessage(null);
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMessage({ type: 'success', text: 'Password changed successfully.' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPwMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      super_admin: 'Super Admin', admin: 'Administrator', accountant: 'Accountant',
      hr: 'HR', field: 'Field', operator: 'Operator', dev: 'Developer',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      super_admin: 'bg-purple-100 text-purple-800', admin: 'bg-red-100 text-red-800',
      accountant: 'bg-yellow-100 text-yellow-800', hr: 'bg-blue-100 text-blue-800',
      field: 'bg-green-100 text-green-800', operator: 'bg-orange-100 text-orange-800',
      dev: 'bg-slate-800 text-white',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and avatar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0B3C6D] to-[#00AEEF] flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-[#0B3C6D] text-white p-2 rounded-full cursor-pointer hover:bg-[#0a325a] shadow-lg">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={saving} />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-3">Click to upload avatar</p>
          </div>

          {profile && (
            <div className="mt-6 flex justify-center">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(profile.role)}`}>
                {getRoleLabel(profile.role)}
              </span>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{userEmail}</span>
            </div>
            {profile?.created_at && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Edit Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Edit Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D] outline-none" placeholder="Enter your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" value={userEmail} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${profile ? getRoleColor(profile.role) : ''}`}>
                  {profile ? getRoleLabel(profile.role) : 'Loading...'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Contact admin to change role</p>
            </div>
            <div className="pt-4">
              <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-6 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h2>

          {pwMessage && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
              pwMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {pwMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {pwMessage.text}
            </div>
          )}

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D] outline-none"
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D] outline-none"
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D] outline-none"
                placeholder="Confirm new password"
              />
            </div>
            <div className="pt-2">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full sm:w-auto px-6 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {changingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Changing...</> : <><Lock className="w-4 h-4" /> Change Password</>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
