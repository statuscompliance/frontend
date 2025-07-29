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
              <FormLabel className="font-large text-base">Password</FormLabel>
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
          <span className="font-large text-base">Sign In</span>
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
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={field.value}
                  onChange={field.onChange}
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
          <span className="font-large text-base">Verify Code</span>
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
                <FormMessage />
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
                <FormMessage />
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
                <FormMessage />
              )}
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          <span className="text-base font-medium">Change Password</span>
        </Button>
      </form>
    </Form>
  );
}

export function Disable2FAForm({ form, onSubmit, isLoading, error }) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <FormMessage className="flex flex-col items-start text-base">{error}</FormMessage>
        )}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel className="text-base font-medium">Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="totpToken"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel className="text-base font-medium">2FA Code</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={field.value}
                  onChange={field.onChange}
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
          {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          <span className="text-base font-medium">Turn Off 2FA</span>
        </Button>
      </form>
    </Form>
  );
}