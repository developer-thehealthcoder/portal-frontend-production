"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
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
import { toast } from "sonner";

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post(
        `/auth/forgot-password?email=${data.email}`
      );
      return res.data;
    },
  });
}

const formSchema = z.object({
  email: z.string().email({
    message: "Invalid email address.",
  }),
});

const ForgotPasswordForm = () => {
  const forgotPasswordMutation = useForgotPassword();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values) {
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Password reset email sent");
        form.reset();
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.detail || "Failed to send reset email"
        );
      },
    });
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
            Forgot Password
          </h1>
          <p className="text-sm text-gray-500">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 w-full"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="user@example.com"
                      className="bg-white"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 cursor-pointer"
              disabled={forgotPasswordMutation.isPending}
              type="submit"
            >
              {forgotPasswordMutation.isPending ? (
                <Spinner className="text-white" />
              ) : (
                "Request reset link"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
