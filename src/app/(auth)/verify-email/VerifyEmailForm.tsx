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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifyEmailAction } from "./action";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VerifyEmailValues, verifyEmailSchema } from "@/lib/validations";
import ResendOTPForm from "@/app/(auth)/(resend-otp)/ResendOTPForm";

export default function VerifyEmailForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  async function onSubmit(values: VerifyEmailValues) {
    setError(undefined);
    startTransition(async () => {
      const { error } = await verifyEmailAction(values);
      if (error) setError(error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {error && (
          <p className="p-2 text-center bg-red-400 text-zinc-100 rounded-2xl">
            {error}
          </p>
        )}
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
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-900">OTP</FormLabel>
              <FormControl>
                <InputOTP
                  value={field.value}
                  onChange={field.onChange}
                  minLength={6}
                  maxLength={6}
                  inputMode="numeric"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Loading type="submit" className="w-full" isLoading={isPending}>
          {isPending ? "Verifying..." : "Verify Email"}
        </Loading>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="px-0">
              Resend OTP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resend OTP</DialogTitle>
              <DialogDescription>
                Enter your email to receive a new OTP.
              </DialogDescription>
            </DialogHeader>
            <ResendOTPForm />
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}
