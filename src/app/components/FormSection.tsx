import React from 'react';
import { Card } from './ui/card';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, children, className = '' }: FormSectionProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-[#1E2D3B] mb-6 pb-3 border-b border-border">
        {title}
      </h2>
      {children}
    </Card>
  );
}
