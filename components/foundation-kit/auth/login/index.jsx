"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email({
    message: "Invalid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

const fetchUserDetails = async () => {
  try {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { push } = useRouter();
  const [userInstitutions, setUserInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // login page

  const handleLogin = async (values) => {
    const params = new URLSearchParams();
    params.append("username", values.email);
    params.append("password", values.password);

    try {
      const userExists = await axiosInstance.post("/auth/user-exists", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (userExists.data?.user_institutions?.length > 1) {
        setUserInstitutions(userExists.data?.user_institutions);
      }

      if (
        !selectedInstitution &&
        userExists.data?.user_institutions?.length > 1
      ) {
        toast.info("Please select an institution");
        return;
      } else {
        const { data } = await axiosInstance.post(
          `/auth/login-with-institution?institution_id=${
            selectedInstitution?.id || userExists.data?.user_institutions[0]?.id
          }`,
          params,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
        toast.success("Login successful");
        Cookies.set(
          "selectedInstitution",
          selectedInstitution?.id || userExists.data?.user_institutions[0]?.id,
          {
            expires: 30,
            secure: true,
            sameSite: "Lax",
          }
        );
        Cookies.set("accessToken", data.access_token, {
          expires: 30,
          secure: true,
          sameSite: "Lax",
        });
        Cookies.set("refreshToken", data.refresh_token, {
          expires: 30,
          secure: true,
          sameSite: "Lax",
        });
        Cookies.set("tokenType", data.token_type, {
          expires: 30,
          secure: true,
          sameSite: "Lax",
        });

        const userDetails = await fetchUserDetails();
        Cookies.set("userDetails", JSON.stringify(userDetails), {
          expires: 30,
          secure: true,
          sameSite: "Lax",
        });

        push("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6 w-full bg-gray-50 dark:bg-gray-950">
      <div className="flex w-full flex-col items-start sm:max-w-sm gap-5">
        <div>
          <Image
            src={company.logo}
            alt="logo"
            width={56}
            height={56}
            className="rounded-lg shadow-xl"
          />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Login to {company.name}
        </h1>
        <Form {...form}>
          <form
            className="space-y-8 w-full"
            onSubmit={form.handleSubmit(handleLogin)}
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Password"
                        className="bg-white pr-10"
                        type={showPassword ? "text" : "password"}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        {showPassword ? (
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
            {userInstitutions?.length > 0 && (
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          const selectedValue = userInstitutions?.find(
                            (institution) => institution.name === value
                          );
                          setSelectedInstitution(selectedValue);
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an institution" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userInstitutions?.map((institution) => (
                            <SelectItem
                              key={institution.id}
                              value={institution.name}
                            >
                              {institution.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                        <FormMessage />
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 cursor-pointer"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Spinner /> : "Continue"}
            </Button>
          </form>
        </Form>
        <div className="w-full h-[1px] bg-gray-200"></div>
        <div className="flex justify-between items-center">
          <div>Forgot your password?</div>
          <Button variant="link" asChild>
            <Link href="/forgot-password">Reset Password</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
