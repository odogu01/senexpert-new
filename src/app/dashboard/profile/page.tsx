'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getProfile } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/supabase';
import { User, Mail, Shield, Calendar, Camera, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<{
    full_name: string;
    role: UserRole;
    avatar_url: string;
    created_at: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { user: authUser } = await getCurrentUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser({ id: authUser.id, email: authUser.email || '' });

      const profileResponse = await getProfile(authUser.id);
      if (profileResponse.success && profileResponse.data) {
        const profileData = profileResponse.data;
        setProfile({
          full_name: profileData.full_name || '',
          role: profileData.role,
          avatar_url: (profileData as unknown as { avatar_url?: string }).avatar_url || '',
          created_at: profileData.created_at,
        });
        setFormData({
          full_name: profileData.full_name || '',
          avatar_url: (profileData as unknown as { avatar_url?: string }).avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabase) return;

    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatar_url: publicUrl });
    } catch (error: unknown) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user || !supabase) return;
    setSaving(true);
    try {
      // Get current profile data for audit log
      const { data: oldProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Log the profile update to audit_logs
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'UPDATE',
        table_name: 'profiles',
        record_id: user.id,
        old_values: oldProfile || {},
        new_values: {
          full_name: formData.full_name,
          avatar_url: formData.avatar_url ? 'avatar_updated' : null,
        },
      });

      alert('Profile updated successfully!');
      await loadProfile();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      super_admin: 'Super Admin',
      admin: 'Administrator',
      hr: 'HR Manager',
      manager: 'Team Manager',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      hr: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0B3C6D] to-[#00AEEF] flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-[#0B3C6D] text-white p-2 rounded-full cursor-pointer hover:bg-[#0a325a] shadow-lg">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={saving}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-3">Click to upload avatar</p>
          </div>

          {/* Role Badge */}
          {profile && (
            <div className="mt-6 flex justify-center">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(profile.role)}`}>
                {getRoleLabel(profile.role)}
              </span>
            </div>
          )}

          {/* User Info */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{user?.email}</span>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Edit Profile</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D] outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
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
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}