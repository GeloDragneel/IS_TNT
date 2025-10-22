import React from 'react';
import { Users, UserCheck, DollarSign, AlertCircle, Calendar } from 'lucide-react';

const HRDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Total Employees</p>
              <p className="text-2xl font-bold text-white">247</p>
            </div>
            <div className="p-3 bg-cyan-600 bg-opacity-20 rounded-lg">
              <Users className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <p className="text-cyan-400 text-sm mt-2 font-medium">+5 new hires this month</p>
        </div>
        
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Attendance Rate</p>
              <p className="text-2xl font-bold text-white">94.2%</p>
            </div>
            <div className="p-3 bg-emerald-600 bg-opacity-20 rounded-lg">
              <UserCheck className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-emerald-400 text-sm mt-2 font-medium">+2.1% from last month</p>
        </div>
        
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Payroll Cost</p>
              <p className="text-2xl font-bold text-white">$89,450</p>
            </div>
            <div className="p-3 bg-amber-600 bg-opacity-20 rounded-lg">
              <DollarSign className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <p className="text-amber-400 text-sm mt-2 font-medium">Monthly total</p>
        </div>
        
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Open Positions</p>
              <p className="text-2xl font-bold text-white">12</p>
            </div>
            <div className="p-3 bg-red-600 bg-opacity-20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <p className="text-red-400 text-sm mt-2 font-medium">Urgent hiring needed</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Department Overview</h3>
          <div className="space-y-3">
            {[
              { dept: 'Engineering', count: 45, color: 'cyan' },
              { dept: 'Sales', count: 32, color: 'emerald' },
              { dept: 'Marketing', count: 18, color: 'violet' },
              { dept: 'HR', count: 8, color: 'amber' }
            ].map((dept, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
                <span className="text-gray-200 font-medium">{dept.dept}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{dept.count}</span>
                  <div className={`w-3 h-3 rounded-full bg-${dept.color}-500`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Recent HR Activities</h3>
          <div className="space-y-3">
            {[
              'New employee onboarding completed',
              'Performance review cycle started',
              'Benefits enrollment deadline reminder',
              'Training session scheduled'
            ].map((activity, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span className="text-gray-200 text-sm">{activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;