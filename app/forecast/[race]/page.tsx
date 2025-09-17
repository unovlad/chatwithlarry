import { Button } from "@/components/ui/button";

import { ArrowLeft } from "lucide-react";
import { ForecastDisplay } from "./ForecastDisplay";
import { Footer } from "@/components/Footer";
import BlueGradientBackground from "@/components/BlueGradientBackground";

interface ForecastPageProps {
  params: Promise<{
    race: string;
  }>;
}

export default async function ForecastPage({ params }: ForecastPageProps) {
  const { race } = await params;
  const flightNumber = race;

  return (
    <div className="min-h-screen py-4 sm:py-12 px-4 ">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}

        {/* Forecast Display */}
        <ForecastDisplay flightNumber={flightNumber} />
      </div>
      <Footer fixed />
    </div>
  );
}
