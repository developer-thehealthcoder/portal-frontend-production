"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Spinner from "@/components/common/loader/Spinner";
import { company } from "@/components/config/company";
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
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post(`/auth/reset-password`, data);
      return res.data;
    },
  });
}

const formSchema = z.object({
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmNewPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

const ResetPasswordForm = ({ token }) => {
  const resetPasswordMutation = useResetPassword();
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(values) {
    if (values.newPassword !== values.confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }
    resetPasswordMutation.mutate(
      {
        token,
        new_password: values.newPassword,
      },
      {
        onSuccess: () => {
          toast.success("Password reset successful");
          form.reset();
          router.push("/login");
        },
        onError: (error) => {
          toast.error(
            error.response?.data?.detail || "Failed to reset password"
          );
        },
      }
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6 w-full bg-gray-50 dark:bg-gray-950">
      <div className="flex w-full flex-col items-start sm:max-w-sm gap-5">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <ArrowLeft size={16} />
          <div className="hover:underline">Back to Login</div>
        </Link>
        <div>
          <Image
            src={company.logo}
            alt="logo"
            width={56}
            height={56}
            className="rounded-lg shadow-xl"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500">Enter your new password</p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 w-full"
          >
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
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
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmNewPassword ? "text" : "password"}
                        placeholder="Enter confirm new password"
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
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 cursor-pointer"
              disabled={resetPasswordMutation.isPending}
              type="submit"
            >
              {resetPasswordMutation.isPending ? (
                <Spinner className="text-white" />
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
