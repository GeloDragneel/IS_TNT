import React from 'react';
import { Users, Plus, Search } from 'lucide-react';

const Employees: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Employee Management</h3>
        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>
      
      <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-white">Employee Directory</h4>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              style={{ backgroundColor: '#404040', borderColor: '#666666' }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'John Smith', role: 'Senior Developer', dept: 'Engineering', email: 'john@company.com' },
            { name: 'Sarah Johnson', role: 'Marketing Manager', dept: 'Marketing', email: 'sarah@company.com' },
            { name: 'Mike Wilson', role: 'Sales Representative', dept: 'Sales', email: 'mike@company.com' },
            { name: 'Emily Davis', role: 'HR Specialist', dept: 'HR', email: 'emily@company.com' },
            { name: 'David Brown', role: 'Product Manager', dept: 'Product', email: 'david@company.com' },
            { name: 'Lisa Anderson', role: 'Designer', dept: 'Design', email: 'lisa@company.com' }
          ].map((employee, i) => (
            <div key={i} className="p-4 rounded-lg border shadow-sm" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{employee.name.charAt(0)}</span>
                </div>
                <div>
                  <h5 className="text-white font-semibold">{employee.name}</h5>
                  <p className="text-gray-300 text-sm">{employee.role}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-300">Department: <span className="text-white font-medium">{employee.dept}</span></p>
                <p className="text-gray-300">Email: <span className="text-white font-medium">{employee.email}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Employees;