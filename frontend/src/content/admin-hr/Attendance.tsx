import React from 'react';
import { Clock, UserCheck, AlertCircle } from 'lucide-react';

const Attendance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Attendance Management</h3>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm">
            Export Report
          </button>
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors shadow-sm">
            Mark Attendance
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Present Today</p>
              <p className="text-2xl font-bold text-emerald-400">234</p>
            </div>
            <div className="p-3 bg-emerald-600 bg-opacity-20 rounded-lg">
              <UserCheck className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Absent Today</p>
              <p className="text-2xl font-bold text-red-400">13</p>
            </div>
            <div className="p-3 bg-red-600 bg-opacity-20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">On Leave</p>
              <p className="text-2xl font-bold text-amber-400">8</p>
            </div>
            <div className="p-3 bg-amber-600 bg-opacity-20 rounded-lg">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
        <h4 className="text-lg font-semibold text-white mb-4">Today's Attendance</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 text-gray-200 font-medium">Employee</th>
                <th className="text-left py-3 text-gray-200 font-medium">Department</th>
                <th className="text-left py-3 text-gray-200 font-medium">Check In</th>
                <th className="text-left py-3 text-gray-200 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'John Smith', dept: 'Engineering', checkIn: '09:15 AM', status: 'Present' },
                { name: 'Sarah Johnson', dept: 'Marketing', checkIn: '09:22 AM', status: 'Present' },
                { name: 'Mike Wilson', dept: 'Sales', checkIn: '09:45 AM', status: 'Present' },
                { name: 'Emily Davis', dept: 'HR', checkIn: '-', status: 'Absent' }
              ].map((employee, i) => (
                <tr key={i} className="border-b border-gray-600">
                  <td className="py-3 text-white font-medium">{employee.name}</td>
                  <td className="py-3 text-gray-300">{employee.dept}</td>
                  <td className="py-3 text-gray-300">{employee.checkIn}</td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      employee.status === 'Present' ? 'bg-emerald-600 bg-opacity-20 text-emerald-400' : 'bg-red-600 bg-opacity-20 text-red-400'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;