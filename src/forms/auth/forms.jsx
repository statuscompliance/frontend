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
import logo from '@/assets/status.svg';

export function LoginForm({ form, onSubmit, isLoading, error }) {
  return (
    // Removed min-h-screen to prevent excessive height, keeping flex for centering
    <div className="p-4 flex flex-col items-center justify-center h-50% bg-white">
      {/* Site Icon at the very top */}
      <div className="flex items-center w-50% h-50% justify-center"> {/* Added p-2 for padding */}
        <img
          src={logo}
          alt="Site Logo" // Changed alt text for clarity
          className="max-w-full max-h-full object-contain" // Ensure image scales within its container
        />
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        {/* Centered Title */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Log In</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {error && <FormMessage className="flex flex-col items-start text-base text-red-500">{error}</FormMessage>}
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
                  <FormLabel className="font-large text-base">Password</FormLabel>
                  <FormControl>
                    <PasswordInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white" type="submit" disabled={isLoading}>
              {isLoading && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              <span className="font-large text-base">Log In</span>
            </Button>
          </form>
        </Form>
      </div>
      {/* Copyright phrase */}
      <p className="text-sm text-gray-500 mt-6">University of Seville. All rights reserved.</p>
    </div>
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
          {/* Wrapped children in a span to ensure single child */}
          <span>
            {isLoading && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            <span className="font-large text-base">Verify</span>
          </span>
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
          {/* Wrapped children in a span to ensure single child */}
          <span>
            {isLoading && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            <span className="text-base font-medium">Update Password</span>
          </span>
        </Button>
      </form>
    </Form>
  );
}
