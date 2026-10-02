"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchApi, warmApi } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"warming" | "ready" | "unavailable">("warming");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void warmApi().then((available) => {
      if (active) setApiStatus(available ? "ready" : "unavailable");
    });

    return () => {
      active = false;
    };
  }, []);

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
    setLoading(true);
    try {
      await authenticate(loginEmail, loginPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center">Login to Study Assistant</h1>
        {loading && (
          <p role="status" aria-live="polite" className="text-sm text-center text-gray-600">
            {apiStatus === "ready"
              ? "Checking your account..."
              : "Connecting to the study service. The free API can take up to a minute to wake after inactivity."}
          </p>
        )}
        {!loading && apiStatus === "warming" && (
          <p role="status" aria-live="polite" className="text-sm text-center text-gray-600">
            Starting the study service. You can enter your details while it wakes.
          </p>
        )}
        {!loading && apiStatus === "unavailable" && (
          <p role="status" aria-live="polite" className="text-sm text-center text-amber-700">
            The study service is not responding yet. You can still try logging in.
          </p>
        )}
        {error && <div role="alert" aria-live="polite" className="p-3 text-sm text-red-700 bg-red-50 rounded">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="login-email"
              type="email"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="login-password"
              type="password"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connecting..." : "Login"}
          </Button>
        </form>

        <div className="text-sm text-center">
          Don&apos;t have an account? <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
        </div>
      </div>
    </div>
  );
}
