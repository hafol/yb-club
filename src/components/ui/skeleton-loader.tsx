import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = "", 
  width, 
  height, 
  borderRadius = "1rem" 
}) => {
  return (
    <div 
      className={`skeleton-shimmer ${className}`}
      style={{ 
        width: width ?? "100%", 
        height: height ?? "1rem",
        borderRadius 
      }}
    />
  );
};

export const SkeletonBox: React.FC<{ cards?: number }> = ({ cards = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="liquid-glass p-6 rounded-[2rem] space-y-4">
          <Skeleton height="2rem" width="60%" />
          <Skeleton height="1rem" width="90%" />
          <Skeleton height="1rem" width="80%" />
          <div className="flex gap-2 pt-4">
            <Skeleton height="1.5rem" width="4rem" borderRadius="0.5rem" />
            <Skeleton height="1.5rem" width="4rem" borderRadius="0.5rem" />
          </div>
        </div>
      ))}
    </div>
  );
};
