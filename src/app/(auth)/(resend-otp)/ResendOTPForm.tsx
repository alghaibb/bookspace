"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resendOTPSchema, ResendOTPValues } from "@/lib/validations";
import { resendOTPAction } from "./action";
import Loading from "@/components/Loading";
import CustomMessage from "@/components/CustomMessage";

export default function ResendOTPForm() {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResendOTPValues>({
    resolver: zodResolver(resendOTPSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ResendOTPValues) {
    setError(undefined);
    setSuccess(undefined);
    startTransition(async () => {
      const { error, success } = await resendOTPAction(values);
      if (error) setError(error);
      if (success) setSuccess(success);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {error && <CustomMessage type="info" message={error} />}
        {success && <CustomMessage type="success" message={success} />}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-900">Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Loading type="submit" className="w-full" isLoading={isPending}>
          {isPending ? "Resending..." : "Resend OTP"}
        </Loading>
      </form>
    </Form>
  );
}
