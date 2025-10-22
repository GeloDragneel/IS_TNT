import React from 'react';
import { Megaphone, Calendar, Plus } from 'lucide-react';

const Announcement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Company Announcements</h3>
        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Create Announcement</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {[
          {
            title: 'Q4 Company Meeting',
            content: 'All-hands meeting scheduled for December 15th at 2:00 PM in the main conference room.',
            date: '2024-12-10',
            priority: 'high'
          },
          {
            title: 'Holiday Schedule Update',
            content: 'Updated holiday schedule for the upcoming season. Please review the new dates.',
            date: '2024-12-08',
            priority: 'medium'
          },
          {
            title: 'New Employee Benefits',
            content: 'Enhanced health insurance coverage and additional wellness programs now available.',
            date: '2024-12-05',
            priority: 'low'
          }
        ].map((announcement, i) => (
          <div key={i} className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-600 bg-opacity-20 rounded-lg">
                  <Megaphone className="h-5 w-5 text-cyan-400" />
                </div>
                <h4 className="text-lg font-semibold text-white">{announcement.title}</h4>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                announcement.priority === 'high' ? 'bg-red-600 bg-opacity-20 text-red-400' :
                announcement.priority === 'medium' ? 'bg-amber-600 bg-opacity-20 text-amber-400' :
                'bg-emerald-600 bg-opacity-20 text-emerald-400'
              }`}>
                {announcement.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-200 mb-3">{announcement.content}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Calendar className="h-4 w-4" />
              <span>{announcement.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcement;