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
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="card-interactive p-4 sm:p-5 lg:p-6 relative overflow-hidden group animate-fadeIn">
      {/* Background gradient effect on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white transition-transform duration-300 group-hover:scale-105">
            {value}
          </h3>
          {trend !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                trend >= 0 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                <span className="text-sm">{trend >= 0 ? '↑' : '↓'}</span>
                <span>{Math.abs(trend)}%</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</span>
            </div>
          )}
        </div>
        
        <div className={`${bgClasses[color]} p-3 sm:p-4 rounded-2xl border-2 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
          <Icon className={`${iconColorClasses[color]} group-hover:animate-pulse`} size={28} strokeWidth={2.5} />
        </div>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -inset-full group-hover:animate-[shimmer_2s_ease-in-out] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
};

export default StatsCard;

