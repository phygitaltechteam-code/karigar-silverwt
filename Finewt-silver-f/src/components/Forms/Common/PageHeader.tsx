// components/Common/PageHeader.tsx
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={className}>
      <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="text-on-surface-variant text-xs tracking-wide sm:text-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageHeader;
