"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchApi, warmApi } from "@/lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiWaking, setApiWaking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void warmApi().then(() => {
      if (active) setApiWaking(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await fetchApi("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center">Create an Account</h1>
        {apiWaking && (
          <p role="status" aria-live="polite" className="text-sm text-center text-gray-600">
            Starting the study service. You can enter your details while it wakes.
          </p>
        )}
        {error && <div role="alert" aria-live="polite" className="p-3 text-sm text-red-700 bg-red-50 rounded">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="register-name"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="register-email"
              type="email"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Registering..." : "Register"}
          </Button>
        </form>

        <div className="text-sm text-center">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}
