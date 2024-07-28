"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema, ResetPasswordValues } from "@/lib/validations";
import { resetPasswordAction } from "./action";
import Loading from "@/components/Loading";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setError(undefined);
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    startTransition(async () => {
      const response = await resetPasswordAction(values);
      if (response?.error) {
        setError(response.error);
      } else {
        form.reset();
        setSuccess(response?.success);
      }
    });
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(onSubmit)();
        }}
        className="space-y-3"
      >
        {error && <p className="p-2 text-center text-destructive">{error}</p>}
        {success && <p className="p-2 text-center">{success}</p>}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-3"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
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
                    {...field}
                    type={showPassword ? "text" : "password"}
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-3"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Loading type="submit" className="w-full" isLoading={isPending}>
          {isPending ? "Resetting..." : "Reset Password"}
        </Loading>
      </form>
    </Form>
  );
}
