import React from 'react';
import { BarChart3, TrendingUp, PieChart, LineChart } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
        <h3 className="text-lg font-semibold text-white mb-4">Sales Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
            <p className="text-2xl font-bold text-cyan-400">$45,231</p>
            <p className="text-gray-300 text-sm font-medium">This Month</p>
          </div>
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
            <p className="text-2xl font-bold text-emerald-400">$38,492</p>
            <p className="text-gray-300 text-sm font-medium">Last Month</p>
          </div>
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
            <p className="text-2xl font-bold text-amber-400">+17.5%</p>
            <p className="text-gray-300 text-sm font-medium">Growth</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-200 font-medium">Revenue Target</span>
                <span className="text-gray-300">78%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-200 font-medium">Customer Satisfaction</span>
                <span className="text-gray-300">92%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-200 font-medium">Order Fulfillment</span>
                <span className="text-gray-300">85%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#2d2d30', borderColor: '#555555' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            {[
              { category: 'Products', amount: '$28,450', percentage: 63, color: 'cyan' },
              { category: 'Services', amount: '$12,230', percentage: 27, color: 'emerald' },
              { category: 'Subscriptions', amount: '$4,551', percentage: 10, color: 'violet' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: '#404040', borderColor: '#666666' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-full bg-gray-600 rounded-full h-2 flex-1 max-w-[100px]">
                    <div 
                      className={`bg-${item.color}-500 h-2 rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-200 text-sm font-medium min-w-[80px]">{item.category}</span>
                </div>
                <span className="text-white font-semibold">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;