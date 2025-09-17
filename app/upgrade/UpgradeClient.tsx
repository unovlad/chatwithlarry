"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface UpgradeClientProps {
  success?: string;
}

export default function UpgradeClient({ success }: UpgradeClientProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();
  }, [supabase.auth]);

  const handleContinue = () => {
    router.push("/chat");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (success === "premium") {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-800">
              Subscription Activated!
            </CardTitle>
            <CardDescription className="text-green-600">
              Congratulations! Your premium subscription has been successfully
              activated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-green-700">
              <p>You now have access to:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Unlimited chats</li>
                <li>Advanced AI capabilities</li>
                <li>Priority support</li>
              </ul>
            </div>
            <Button onClick={handleContinue} className="w-full">
              Start Using
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-800">Activation Error</CardTitle>
          <CardDescription className="text-red-600">
            Something went wrong with subscription activation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-red-700">
            <p>Please try again or contact support.</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push("/plans")}
              className="flex-1"
            >
              To Plans
            </Button>
            <Button onClick={handleContinue} className="flex-1">
              To Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
