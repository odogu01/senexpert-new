'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, X, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMaintenance } from '@/hooks/api';
import type { Maintenance } from '@/lib/database.types';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
}

export default function CalendarPage() {
  const { data: maintenanceData = [] } = useMaintenance();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'month' | 'week'>('month');

  const mockMeetings: Meeting[] = (maintenanceData as Maintenance[]).map(m => ({
    id: m.id || '',
    title: `${m.maintenance_type.charAt(0).toUpperCase() + m.maintenance_type.slice(1)} - ${(m.description || '').slice(0, 20)}`,
    date: m.scheduled_date?.split('T')[0] || '',
    time: '09:00',
    location: m.tool_name || 'Workshop',
    status: m.status,
  }));

  const upcomingMeetings = mockMeetings.filter(m => m.status === 'scheduled' || m.status === 'in_progress');
  const completedMeetings = mockMeetings.filter(m => m.status === 'completed');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getMeetingsForDay = (day: number | null) => {
    if (!day) return [];
    const ds = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return mockMeetings.filter(m => m.date === ds);
  };

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1));
      return d;
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Schedule and manage meetings</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] transition-colors text-sm">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Create Meeting</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-4">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-800">{monthName}</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="text-sm text-[#0B3C6D] hover:underline">Today</button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(d => <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const dayMeetings = getMeetingsForDay(day);
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                return (
                  <div key={idx} className={`min-h-[80px] p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${day === null ? 'bg-gray-50' : ''}`}>
                    {day && (
                      <>
                        <div className={`text-sm font-medium ${isToday ? 'bg-[#0B3C6D] text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>{day}</div>
                        {dayMeetings.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayMeetings.slice(0, 2).map(m => (
                              <div key={m.id} className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded truncate">{m.title}</div>
                            ))}
                            {dayMeetings.length > 2 && <div className="text-xs text-gray-500">+{dayMeetings.length - 2} more</div>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Upcoming Meetings</h3>
            <div className="space-y-3">
              {upcomingMeetings.slice(0, 5).map(m => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <h4 className="text-sm font-medium text-gray-800">{m.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500"><Clock className="w-3 h-3" />{m.time}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{m.location}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">This Month</span><span className="text-sm font-medium text-gray-800">{upcomingMeetings.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Completed</span><span className="text-sm font-medium text-gray-800">{completedMeetings.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Total Attendees</span><span className="text-sm font-medium text-gray-800">24</span></div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Create Meeting</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Time</label><input type="time" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label><input type="text" placeholder="Enter attendee names" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]">Create</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
