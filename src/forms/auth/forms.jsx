import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { PasswordInput } from '@/components/forms/password-input';

export function LoginForm({ form, onSubmit, isLoading, error }) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && <FormMessage className="flex flex-col items-start text-base">{error}</FormMessage>}
        <FormField
          control={form.control}
          name="username"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel className="text-base">Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel className="text-base font-large">Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          <span className="text-base font-large">Log In</span>
        </Button>
      </form>
    </Form>
  );
}

export function Verify2FAForm({ form, onSubmit, isLoading, error }) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && <FormMessage className="flex flex-col items-start text-base">{error}</FormMessage>}
        <FormField
          control={form.control}
          name="totpToken"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormControl>
                <InputOTP
                  maxLength={6} {...field}
                  pattern={REGEXP_ONLY_DIGITS}
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
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          <span className="text-base font-large">Verify</span>
        </Button>
      </form>
    </Form>
  );
}

export function PasswordChangeForm({ form, onSubmit, isLoading, error }) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && <FormMessage className="flex flex-col items-start text-base">{error}</FormMessage>}
        <FormField
          control={form.control}
          name="currentPassword"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel className="text-base font-medium">Current Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              {form.formState.errors.currentPassword && (
                <FormMessage>{form.formState.errors.currentPassword.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel className="text-base font-medium">New Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              {form.formState.errors.newPassword && (
                <FormMessage>{form.formState.errors.newPassword.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel className="text-base font-medium">Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              {form.formState.errors.confirmPassword && (
                <FormMessage>{form.formState.errors.confirmPassword.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          <span className="text-base font-medium">Update Password</span>
        </Button>
      </form>
    </Form>
  );
}
