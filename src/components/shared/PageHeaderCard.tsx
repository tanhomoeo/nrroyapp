'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface PageHeaderCardProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode; // For content within the card
  className?: string;
}

export function PageHeaderCard({ title, description, actions, children, className }: PageHeaderCardProps) {
  return (
    <Card className={`mb-6 shadow-sm ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="font-headline text-2xl md:text-3xl text-primary">{title}</CardTitle>
          {description && <CardDescription className="text-muted-foreground">{description}</CardDescription>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
