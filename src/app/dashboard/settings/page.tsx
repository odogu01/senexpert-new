'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/services/authService';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { user } = await getCurrentUser();
    if (!user) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'general', label: 'General', description: 'Basic system settings' },
    { id: 'security', label: 'Security', description: 'Authentication and access' },
    { id: 'notifications', label: 'Notifications', description: 'Email and alert preferences' },
    { id: 'appearance', label: 'Appearance', description: 'Theme and display options' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-4 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1 text-sm lg:text-base">Configure system preferences and options</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm lg:text-base">{tab.label}</div>
                <div className="text-xs lg:text-sm text-gray-500 hidden lg:block">{tab.description}</div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-6">General Settings</h2>
              
              <div className="space-y-4 lg:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    defaultValue="SenExpert Global"
                    className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>America/Chicago</option>
                    <option>Europe/London</option>
                    <option>Asia/Dubai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>YYYY-MM-DD</option>
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>English</option>
                    <option>Arabic</option>
                    <option>French</option>
                  </select>
                </div>

                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Enable
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Session Timeout</h3>
                    <p className="text-sm text-gray-600">Automatically log out after period of inactivity</p>
                  </div>
                  <select className="px-4 py-2 border border-gray-300 rounded-lg">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Password Requirements</h3>
                    <p className="text-sm text-gray-600">Minimum password length and complexity</p>
                  </div>
                  <select className="px-4 py-2 border border-gray-300 rounded-lg">
                    <option>8 characters</option>
                    <option>12 characters</option>
                    <option>16 characters</option>
                  </select>
                </div>

                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive important updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Request Alerts</h3>
                    <p className="text-sm text-gray-600">Get notified when new requests are submitted</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Maintenance Reminders</h3>
                    <p className="text-sm text-gray-600">Receive alerts for upcoming maintenance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Appearance Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Theme</h3>
                  <div className="flex gap-4">
                    <button className="p-4 border-2 border-blue-500 rounded-lg bg-white">
                      <div className="w-16 h-16 bg-gray-100 rounded mb-2"></div>
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-lg bg-white opacity-50">
                      <div className="w-16 h-16 bg-gray-800 rounded mb-2"></div>
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Accent Color</h3>
                  <div className="flex gap-3">
                    {['#2563EB', '#DC2626', '#16A34A', '#9333EA', '#EA580C'].map((color) => (
                      <button
                        key={color}
                        className={`w-10 h-10 rounded-full ${color === '#2563EB' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Sidebar</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="sidebar" defaultChecked className="text-blue-600" />
                      <span>Expanded</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="sidebar" className="text-blue-600" />
                      <span>Collapsed</span>
                    </label>
                  </div>
                </div>

                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
