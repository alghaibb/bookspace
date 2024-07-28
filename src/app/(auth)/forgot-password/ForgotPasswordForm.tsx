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
import { forgotPasswordSchema, ForgotPasswordValues } from "@/lib/validations";
import { forgotPasswordAction } from "./action";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setError(undefined);
    setSuccess(undefined);
    startTransition(async () => {
      const { error, success } = await forgotPasswordAction(values);
      if (error) setError(error);
      if (success) setSuccess(success);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {error && <p className="p-2 text-center text-destructive">{error}</p>}
        {success && <p className="p-2 text-center">{success}</p>}
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
          {isPending ? "Sending..." : "Send Reset Link"}
        </Loading>
      </form>
    </Form>
  );
}
