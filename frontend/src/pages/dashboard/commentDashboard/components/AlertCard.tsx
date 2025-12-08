import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AlertCardProps {
  title: string;
  description: string;
  alertType: 'warning' | 'error' | 'info';
  count?: number;
}

const AlertCard: React.FC<AlertCardProps> = ({ title, description, alertType, count }) => {
  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          containerClass: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
          iconClass: 'text-yellow-600',
          titleClass: 'text-yellow-800',
          descriptionClass: 'text-yellow-700',
          countClass: 'bg-yellow-100 text-yellow-800'
        };
      case 'error':
        return {
          containerClass: 'bg-red-50 border-red-200 hover:bg-red-100',
          iconClass: 'text-red-600',
          titleClass: 'text-red-800',
          descriptionClass: 'text-red-700',
          countClass: 'bg-red-100 text-red-800'
        };
      case 'info':
        return {
          containerClass: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
          iconClass: 'text-blue-600',
          titleClass: 'text-blue-800',
          descriptionClass: 'text-blue-700',
          countClass: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          containerClass: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
          iconClass: 'text-gray-600',
          titleClass: 'text-gray-800',
          descriptionClass: 'text-gray-700',
          countClass: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const styles = getAlertStyles(alertType);

  return (
    <div className={`flex items-start gap-3 p-4 border transition-colors duration-200 ${styles.containerClass}`}>
      {/* Alert Icon */}
      <div className={`flex-shrink-0 ${styles.iconClass}`}>
        <ExclamationTriangleIcon className="h-5 w-5" />
      </div>

      {/* Alert Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-sm font-semibold ${styles.titleClass}`}>
            {title}
          </h3>
          {count !== undefined && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles.countClass}`}>
              {count}
            </span>
          )}
        </div>
        <p className={`text-sm ${styles.descriptionClass}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default AlertCard;