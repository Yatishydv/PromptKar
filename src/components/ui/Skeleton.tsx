"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps) => {
  return (
    <div 
      className={`bg-slate-100 animate-pulse rounded-md ${className}`}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-card border border-slate-200 p-6 rounded-2xl space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-8 h-8 rounded-lg" />
    </div>
    <Skeleton className="w-full h-6" />
    <Skeleton className="w-2/3 h-6" />
    <div className="pt-4 flex items-center justify-between">
      <Skeleton className="w-24 h-4" />
      <div className="flex gap-2">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
    </div>
  </div>
);
