import React from 'react';

interface LoadingSpinnerTbodyProps {
  rowsCount: number;
}

export const LoadingSpinnerTbody: React.FC<LoadingSpinnerTbodyProps> = ({ rowsCount }) => {
  return (
    <tbody>
      {Array.from({ length: rowsCount }).map((_, idx) => (
        <tr key={idx} className="bg-transparent-900 border-b border-gray-700">
          <td className="text-center py-3 px-4">
            <div className="h-6 bg-gray-700 rounded w-5 mx-auto"></div>
          </td>
          <td className="py-3 px-4 flex items-center space-x-3 min-w-[300px]">
            <div className="w-10 h-10 rounded-lg bg-gray-700" />
            <div className="flex flex-col space-y-2 py-1 flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2"></div>
            </div>
          </td>
          <td className="text-center items-center py-3 px-4">
            <div className="flex flex-col space-y-2 py-1 flex-1">
              <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
              <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
            </div>
          </td>
          <td className="text-center py-3 px-4">
            <div className="flex flex-col space-y-2 py-1 flex-1">
              <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
              <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
            </div>
          </td>
          <td className="text-center py-3 px-4">
            <div className="flex flex-col space-y-2 py-1 flex-1">
              <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
              <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
            </div>
          </td>
          <td className="text-center py-3 px-4">
            <div className="flex flex-col space-y-2 py-1 flex-1">
              <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
              <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
            </div>
          </td>
          <td className="text-center py-3 px-4">
            <div className="h-6 bg-gray-700 rounded w-20 mx-auto"></div>
          </td>
          <td className="text-center py-3 px-4">
            <div className="h-4 bg-gray-700 rounded w-8 mx-auto"></div>
          </td>
          <td className="text-center py-3 px-4">
            <div className="h-6 bg-gray-700 rounded w-10 mx-auto"></div>
          </td>
          <td className="text-center py-3 px-4">
            <div className="h-6 bg-gray-700 rounded w-10 mx-auto"></div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export default LoadingSpinnerTbody;
