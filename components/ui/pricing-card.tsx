import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import { cn } from "@/utils/cn";

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  active?: boolean;
  popular?: boolean;
  blue?: boolean;
  onClick?: () => void;
  href?: string;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  active = false,
  popular = false,
  blue = false,
  onClick,
  href,
}: PricingCardProps) {
  const cardContent = (
    <Card
      className={cn(
        "relative transition-all duration-200 hover:shadow-lg",
        active && "ring-2 ring-blue-500 shadow-lg",
        popular && "ring-2 ring-orange-500 shadow-lg scale-105",
        blue && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Star className="h-3 w-3" />
            Most Popular
          </div>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-gray-600 ml-1">/{period}</span>}
        </div>
        <CardDescription className="text-gray-600 mt-2">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4">
          <Button
            className={cn(
              "w-full",
              active && "bg-gray-100 text-gray-500 cursor-not-allowed",
              popular &&
                !active &&
                "bg-orange-500 hover:bg-orange-600 text-white",
              blue && !active && "bg-blue-500 hover:bg-blue-600 text-white",
              !active &&
                !popular &&
                !blue &&
                "bg-gray-900 hover:bg-gray-800 text-white",
            )}
            onClick={onClick}
            disabled={active}
          >
            {cta}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (href && !onClick) {
    return (
      <a href={href} className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}
