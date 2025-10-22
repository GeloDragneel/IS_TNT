import React from 'react';
import { Users, Clock, MapPin, CheckCircle } from 'lucide-react';

const StaffMovement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
        <h3 className="text-lg font-semibold text-white mb-4">Staff Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
            <p className="text-2xl font-bold text-emerald-400">24</p>
            <p className="text-gray-300 text-sm font-medium">Present</p>
          </div>
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
            <p className="text-2xl font-bold text-red-400">3</p>
            <p className="text-gray-300 text-sm font-medium">Absent</p>
          </div>
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
            <p className="text-2xl font-bold text-amber-400">2</p>
            <p className="text-gray-300 text-sm font-medium">On Leave</p>
          </div>
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
            <p className="text-2xl font-bold text-cyan-400">1</p>
            <p className="text-gray-300 text-sm font-medium">Remote</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Check-ins</h3>
          <div className="space-y-3">
            {[
              { name: 'John Smith', time: '09:15 AM', status: 'checked-in' },
              { name: 'Sarah Johnson', time: '09:22 AM', status: 'checked-in' },
              { name: 'Mike Wilson', time: '09:45 AM', status: 'checked-in' },
              { name: 'Emily Davis', time: '10:12 AM', status: 'checked-in' }
            ].map((staff, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{staff.name.charAt(0)}</span>
                  </div>
                  <span className="text-white font-medium">{staff.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-gray-200 text-sm font-medium">{staff.time}</p>
                  <p className="text-emerald-400 text-xs font-medium">Present</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Department Status</h3>
          <div className="space-y-3">
            {[
              { dept: 'Engineering', present: 12, total: 15, percentage: 80 },
              { dept: 'Sales', present: 8, total: 10, percentage: 80 },
              { dept: 'Marketing', present: 5, total: 6, percentage: 83 },
              { dept: 'HR', present: 3, total: 4, percentage: 75 }
            ].map((dept, i) => (
              <div key={i} className="p-3 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{dept.dept}</span>
                  <span className="text-gray-300 text-sm">{dept.present}/{dept.total}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${dept.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffMovement;