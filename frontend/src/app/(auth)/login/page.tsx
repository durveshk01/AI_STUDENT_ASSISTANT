"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState<"login" | "test" | null>(null);
  const loading = loadingAction !== null;
  const router = useRouter();

  const authenticate = async (loginEmail: string, loginPassword: string) => {
    const data = await fetchApi<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: loginEmail, password: loginPassword }),
    });
    window.localStorage.setItem("token", data.access_token);
    router.push("/dashboard");
  };

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setError("");
    setLoadingAction("login");
    try {
      await authenticate(loginEmail, loginPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const handleQuickTest = async () => {
    setError("");
    setLoadingAction("test");

    try {
      try {
        await fetchApi("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name: "Test User", email: "test@test.com", password: "test1234" }),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (!message.includes("already exists")) throw err;
      }
      await authenticate("test@test.com", "test1234");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in to the test account. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center">Login to Study Assistant</h1>
        {error && <div role="alert" aria-live="polite" className="p-3 text-sm text-red-700 bg-red-50 rounded">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loadingAction === "login" ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">or</span></div>
        </div>

        <Button
          variant="outline"
          className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
          disabled={loading}
          onClick={handleQuickTest}
        >
          <Zap className="w-4 h-4 mr-2" />
          {loadingAction === "test" ? "Signing in..." : "Quick Test Login"}
        </Button>

        <div className="text-sm text-center">
          Don&apos;t have an account? <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
        </div>
      </div>
    </div>
  );
}
