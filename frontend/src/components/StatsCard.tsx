import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  const bgClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20'
  };

  return (
    <div className="card p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-fadeIn">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {value}
          </h3>
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</span>
            </div>
          )}
        </div>
        
        <div className={`${bgClasses[color]} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`bg-gradient-to-br ${colorClasses[color]} bg-clip-text text-transparent`} size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

