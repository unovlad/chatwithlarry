import React from "react";

interface BlueGradientBackgroundProps {
  className?: string;
}

export default function BlueGradientBackground({
  className = "",
}: BlueGradientBackgroundProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Синій градієнт від центру до країв */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/30 via-blue-200/5 to-transparent" />
    </div>
  );
}
