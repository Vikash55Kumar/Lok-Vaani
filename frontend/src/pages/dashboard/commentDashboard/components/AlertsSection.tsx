import React from 'react';
import AlertCard from './AlertCard';
import type { AlertData } from '@/types';

interface AlertsSectionProps {
  alerts: AlertData[];
}

const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Calculate total alert count
  const totalAlerts = alerts.reduce((sum, alert) => sum + alert.count, 0);

  return (
    <div className="bg-white shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-sans">
            Alerts
          </h2>
          <p className="text-sm text-gray-600 font-sans">
            System notifications about comment processing and data quality
          </p>
        </div>
        
        {/* Total alert summary */}
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {totalAlerts}
            </div>
            <div className="text-xs text-gray-500">
              Total Issues
            </div>
          </div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Alert Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            title={alert.title}
            description={alert.description}
            count={alert.count}
            alertType={alert.alertType}
          />
        ))}
      </div>

      {/* Footer with additional info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
          <p>
            Regular monitoring helps maintain data quality and system performance.
          </p>
          <div className="mt-2 sm:mt-0">
            <span className="inline-flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              System monitoring active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsSection;