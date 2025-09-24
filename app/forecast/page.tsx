import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plane,
  Search,
  MapPin,
  Clock,
  AlertTriangle,
  Route,
} from "lucide-react";
import { TurbulenceForm } from "../turbulence/TurbulenceForm";
import { Footer } from "@/components/Footer";

export default function TurbulencePage() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Plane className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Turbulence Forecast
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter flight number to get turbulence forecast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TurbulenceForm />
          </CardContent>
        </Card>

        {/* What You'll Get Card */}
        <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              What You&apos;ll Get
            </CardTitle>
            <CardDescription className="text-gray-600">
              Comprehensive flight information and turbulence forecast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Flight Timeline */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Flight Timeline</h4>
                  <p className="text-sm text-gray-600">
                    Complete departure and arrival schedule with airport details
                  </p>
                </div>
              </div>

              {/* Turbulence Forecast */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">
                    Turbulence Forecast
                  </h4>
                  <p className="text-sm text-gray-600">
                    Real-time turbulence predictions for each route segment
                  </p>
                </div>
              </div>

              {/* Flight Details */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plane className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Flight Details</h4>
                  <p className="text-sm text-gray-600">
                    Aircraft type, airline, distance, and estimated duration
                  </p>
                </div>
              </div>

              {/* Route Information */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Route className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Route Analysis</h4>
                  <p className="text-sm text-gray-600">
                    Detailed segment-by-segment turbulence analysis
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer fixed />
    </div>
  );
}
