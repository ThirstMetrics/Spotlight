"use client";

import { useState } from "react";
import Image from "next/image";

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement actual authentication against Supabase Auth
    // For now, this is a placeholder that simulates a login attempt
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Redirect to portal dashboard on success
      // router.push("/dashboard");
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-200 bg-white p-10 shadow-lg">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logos/spotlight-horizontal-navy.svg"
            alt="Spotlight"
            width={200}
            height={48}
            priority
          />
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#06113e]">
            Partner Portal
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to access your distributor or supplier dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#06113e] focus:outline-none focus:ring-1 focus:ring-[#06113e]"
                placeholder="partner@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#06113e] focus:outline-none focus:ring-1 focus:ring-[#06113e]"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-[#06113e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#06113e]/90 focus:outline-none focus:ring-2 focus:ring-[#06113e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center">
            <a
              href="#"
              className="text-sm font-medium text-[#5ad196] hover:text-[#5ad196]/80 transition-colors"
            >
              Forgot your password?
            </a>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400">
            Spotlight Beverage Management Platform
          </p>
        </div>
      </div>
    </div>
  );
}
