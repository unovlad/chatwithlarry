import React from "react";

interface BlueGradientBackgroundProps {
  className?: string;
}

export default function BlueGradientBackground({
  className = "",
}: BlueGradientBackgroundProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <div className="absolute inset-0 z-3 bg-gradient-radial from-blue-500/30 via-blue-200/20 to-transparent w-full md:w-auto" />
    </div>
  );
}
