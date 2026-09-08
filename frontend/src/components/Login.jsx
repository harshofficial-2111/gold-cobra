import React from "react";
import { Lock, User } from "lucide-react";

export default function Login({
  username,
  password,
  setUsername,
  setPassword,
  onLogin,
  error,
  loading,
}) {
  return (
    <main className="min-h-[100dvh] w-full bg-gradient-to-br from-slate-100 to-gray-200 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex min-h-[calc(100dvh-3rem)] items-center justify-center sm:min-h-[calc(100dvh-4rem)]">
        <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          
          {/* Logo */}
          <div className="mb-7 text-center sm:mb-8">
            <img
              src="/logo.png"
              alt="Gold Cobra"
              className="mx-auto h-auto w-[210px] max-w-full object-contain sm:w-[230px]"
            />

            <p className="mt-3 text-sm text-gray-500 sm:text-base">
              Project management portal
            </p>
          </div>

          {/* Login form */}
          <form className="space-y-5" onSubmit={onLogin}>
            <Field
              icon={User}
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="Enter username"
              autoComplete="username"
            />

            <Field
              icon={Lock}
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter password"
              autoComplete="current-password"
            />

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-5 text-red-600"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      <span className="mb-2 block">{label}</span>

      <span className="relative block">
        <Icon
          size={19}
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          required
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pl-10 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500"
        />
      </span>
    </label>
  );
}