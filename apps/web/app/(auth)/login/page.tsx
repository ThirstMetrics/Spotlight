"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/hooks/use-auth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { theme, resolvedColors } = useTheme();
  const { login, isLoading, error } = useAuth();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/overview";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(email, password);
    // Redirect on success — check store directly since state update is async
    const state = useAuth.getState();
    if (state.user) {
      window.location.href = returnTo;
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12"
        style={{ backgroundColor: resolvedColors.primary }}
      >
        <div className="max-w-md text-center space-y-8">
          <Image
            src={theme.logo.horizontal}
            alt={theme.label}
            width={280}
            height={64}
            className="mx-auto h-16 w-auto object-contain"
            priority
          />
          <p
            className="text-lg leading-relaxed"
            style={{ color: resolvedColors.primaryForeground, opacity: 0.85 }}
          >
            Multi-outlet beverage program management for hotels, casinos, and
            resorts. Track compliance, optimize margins, and streamline
            operations across every outlet.
          </p>
          <div
            className="flex items-center justify-center gap-8 pt-4"
            style={{ color: resolvedColors.primaryForeground, opacity: 0.6 }}
          >
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: resolvedColors.accent }}>
                100%
              </p>
              <p className="text-xs uppercase tracking-wider">Compliance</p>
            </div>
            <div
              className="h-8 w-px"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            />
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: resolvedColors.accent }}>
                Real-time
              </p>
              <p className="text-xs uppercase tracking-wider">Alerts</p>
            </div>
            <div
              className="h-8 w-px"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            />
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: resolvedColors.accent }}>
                360&deg;
              </p>
              <p className="text-xs uppercase tracking-wider">Visibility</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 lg:hidden">
              <Image
                src="/logos/spotlight-horizontal-navy.svg"
                alt={theme.label}
                width={180}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
            <div className="hidden lg:block mb-2">
              <Image
                src="/logos/spotlight-icon-navy.svg"
                alt={theme.label}
                width={48}
                height={48}
                className="mx-auto h-12 w-12 object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your {theme.label} account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@hotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs hover:underline"
                    style={{ color: resolvedColors.primary }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full text-white font-medium"
                disabled={isLoading}
                style={{
                  backgroundColor: resolvedColors.primary,
                  borderColor: resolvedColors.primary,
                }}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium hover:underline"
                  style={{ color: resolvedColors.primary }}
                >
                  Request access
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
