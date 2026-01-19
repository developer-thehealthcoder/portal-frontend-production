"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import { toast } from "sonner";
import Spinner from "@/components/common/loader/Spinner";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Current password is required.",
  }),
  newPassword: z.string().min(8, {
    message: "New password must be at least 8 characters.",
  }),
  confirmNewPassword: z.string().min(8, {
    message: "Confirm new password must be at least 8 characters.",
  }),
});

const googleAppPasswordFormSchema = z.object({
  appPassword: z.string().min(1, {
    message: "App password is required.",
  }),
});

export function SettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appPasswordLoading, setAppPasswordLoading] = useState(false);
  const [hasAppPassword, setHasAppPassword] = useState(false);

  const passwordForm = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const googleAppPasswordForm = useForm({
    resolver: zodResolver(googleAppPasswordFormSchema),
    defaultValues: {
      appPassword: "",
    },
  });

  useEffect(() => {
    // Check if user has a stored Google app password
    const checkAppPassword = async () => {
      try {
        const response = await axiosInstance.get("/auth/check-app-password");
        if (response.data?.has_app_password) {
          setHasAppPassword(true);
        }
      } catch (error) {
        // If endpoint doesn't exist or returns 404, assume no app password
        setHasAppPassword(false);
      }
    };
    checkAppPassword();
  }, []);

  async function onSubmitPassword(values) {
    if (values.newPassword !== values.confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.post("/auth/change-password", {
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });
      if (response) {
        toast.success("Password updated successfully");
        passwordForm.reset();
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update password");
      setLoading(false);
    }
  }

  async function onSubmitAppPassword(values) {
    try {
      setAppPasswordLoading(true);
      const response = await axiosInstance.post(
        "/auth/change-app-password",
        values.appPassword
      );
      if (response) {
        toast.success(
          hasAppPassword
            ? "Google app password updated successfully"
            : "Google app password saved successfully"
        );
        googleAppPasswordForm.reset();
        setHasAppPassword(true);
        setAppPasswordLoading(false);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to save Google app password"
      );
      setAppPasswordLoading(false);
    }
  }

  return (
    <div className="w-full p-4">
      <div className="">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Google App Password</h2>
            <Separator className="mb-6" />
            {hasAppPassword && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You have a Google app password stored. Update it below or leave
                the field empty to keep the existing one.
              </p>
            )}
            <Form {...googleAppPasswordForm}>
              <form
                onSubmit={googleAppPasswordForm.handleSubmit(
                  onSubmitAppPassword
                )}
                className="space-y-4"
              >
                <FormField
                  control={googleAppPasswordForm.control}
                  name="appPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {hasAppPassword
                          ? "Update App Password"
                          : "App Password"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter Google app password"
                            type={showAppPassword ? "text" : "password"}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAppPassword(!showAppPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            {showAppPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={appPasswordLoading}>
                    {appPasswordLoading ? (
                      <Spinner className="!text-white" />
                    ) : hasAppPassword ? (
                      "Update App Password"
                    ) : (
                      "Save App Password"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <Separator className="mb-6" />
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter current password"
                            type={showCurrentPassword ? "text" : "password"}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter new password"
                            type={showNewPassword ? "text" : "password"}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Confirm new password"
                            type={showConfirmNewPassword ? "text" : "password"}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmNewPassword(!showConfirmNewPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            {showConfirmNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <Spinner className="!text-white" />
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
