"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Trash2, Save, AlertTriangle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { User as UserType } from "@/types/user";
import { Footer } from "@/components/Footer";

interface SettingsClientProps {
  user: UserType;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteChatsDialogOpen, setIsDeleteChatsDialogOpen] = useState(false);
  const [isDeletingChats, setIsDeletingChats] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const router = useRouter();

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error updating profile");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Error updating profile",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChats = async () => {
    setIsDeletingChats(true);
    try {
      const response = await fetch("/api/user/chats", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error deleting chats");
      }

      toast.success("All chats deleted successfully");

      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (error) {
      console.error("Error deleting chats:", error);
      toast.error(
        error instanceof Error ? error.message : "Error deleting chats",
      );
    } finally {
      setIsDeletingChats(false);
      setIsDeleteChatsDialogOpen(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (confirmEmail !== user.email) {
      toast.error("Email does not match your account");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: confirmEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error deleting profile");
      }

      toast.success("Profile deleted successfully");

      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      router.push("/");
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Error deleting profile",
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setConfirmEmail("");
    }
  };

  const hasChanges = fullName !== (user.full_name || "");

  return (
    <div className="flex flex-col gap-4">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage your profile and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Profile
            </CardTitle>
            <CardDescription className="text-sm">
              Your personal profile settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs sm:text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-xs sm:text-sm font-medium text-gray-700"
              >
                Full name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 text-base sm:text-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              Chat Management
            </CardTitle>
            <CardDescription className="text-sm">
              Delete all your chats and messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                  Delete all chats
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  This action will delete all your chats and messages. Your
                  profile will remain intact.
                </p>
              </div>

              <Dialog
                open={isDeleteChatsDialogOpen}
                onOpenChange={setIsDeleteChatsDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete all chats
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-5 w-5" />
                      Confirm chat deletion
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete all your chats? This
                      action is irreversible and will result in the loss of:
                    </DialogDescription>
                  </DialogHeader>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>All your chats</li>
                    <li>All messages</li>
                    <li>Chat history</li>
                  </ul>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteChatsDialogOpen(false)}
                      disabled={isDeletingChats}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteChats}
                      disabled={isDeletingChats}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeletingChats ? "Deleting..." : "Delete chats"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-red-200">
          <CardContent>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                  Delete account
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Deleting your account will result in the loss of all data,
                  including chats and messages.
                </p>
              </div>

              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Confirm deletion
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete your account? This action
                      is irreversible and will result in the loss of:
                    </DialogDescription>
                  </DialogHeader>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>All your chats</li>
                    <li>All messages</li>
                    <li>Profile settings</li>
                    <li>Access to the service</li>
                  </ul>
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmEmail"
                      className="text-xs sm:text-sm font-medium text-gray-700"
                    >
                      Confirm deletion by entering your email:
                    </label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder={user.email}
                      className="mt-1"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setConfirmEmail("");
                      }}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteProfile}
                      disabled={isDeleting || confirmEmail !== user.email}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "Deleting..." : "Delete account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer fixed marginTop={false} />
    </div>
  );
}
