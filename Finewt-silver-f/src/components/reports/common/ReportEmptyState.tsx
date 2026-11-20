import React from 'react';
import {FileQuestion} from 'lucide-react';

export interface ReportEmptyStateProps {
  message?: string;
  colSpan?: number;
  icon?: React.ReactNode;
}

export const ReportEmptyState: React.FC<ReportEmptyStateProps> = ({
  message = 'No records found for the selected criteria.',
  colSpan = 1,
  icon,
}) => {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="text-gray-500 px-4 py-8 text-center text-xs dark:text-slate-400"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {icon || (
            <FileQuestion className="h-6 w-6 text-[#817563]/60 dark:text-slate-500" />
          )}
          <p className="font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
};

export default ReportEmptyState;
