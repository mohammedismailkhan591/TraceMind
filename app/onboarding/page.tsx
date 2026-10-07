"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [informationTypes, setInformationTypes] = useState<string[]>([]);
  const [reminders, setReminders] = useState("Important deadlines");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const types = [
    "Scholarships",
    "Jobs",
    "Hackathons",
    "Education",
    "Technology",
    "Events",
    "Messages",
    "Other",
  ];

  function toggleType(type: string) {
    setInformationTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  }

  async function finishOnboarding() {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!purpose) {
      setError("Please select what you want to use TraceMind for.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: saveError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: name.trim(),
        onboarding_complete: true,
      });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    // Store personalization preferences locally for now.
    // These can later be moved into a dedicated preferences table.
    localStorage.setItem(
      "tracemind_preferences",
      JSON.stringify({
        purpose,
        informationTypes,
        reminders,
      })
    );

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Trace<span className="text-indigo-600">Mind</span>
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Trace what you remember. Find where you saw it.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-10">
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-indigo-600">
              Welcome to TraceMind
            </p>

            <h2 className="text-3xl font-bold text-gray-900">
              Let’s personalize your memory engine.
            </h2>

            <p className="mt-3 leading-6 text-gray-500">
              Tell us a little about how you want to use TraceMind.
              You can change your preferences later.
            </p>
          </div>

          {/* Name */}
          <div className="mb-7">
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              What should we call you?
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Purpose */}
          <div className="mb-7">
            <label className="mb-3 block text-sm font-semibold text-gray-800">
              What do you mainly want TraceMind for?
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Remember useful information",
                "Find things I saw online",
                "Track important deadlines",
                "Organize information",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPurpose(item)}
                  className={`rounded-xl border p-4 text-left text-sm transition ${
                    purpose === item
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Information types */}
          <div className="mb-7">
            <label className="mb-3 block text-sm font-semibold text-gray-800">
              What kind of information do you save?
            </label>

            <div className="flex flex-wrap gap-2">
              {types.map((type) => {
                const selected = informationTypes.includes(type);

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selected
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminders */}
          <div className="mb-8">
            <label className="mb-3 block text-sm font-semibold text-gray-800">
              Reminder preference
            </label>

            <select
              value={reminders}
              onChange={(e) => setReminders(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option>Important deadlines</option>
              <option>All detected deadlines</option>
              <option>Only reminders I create</option>
              <option>No reminders</option>
            </select>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={finishOnboarding}
            disabled={saving}
            className="w-full rounded-xl bg-indigo-600 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Setting up TraceMind..." : "Continue to TraceMind →"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          You can change your preferences later from your profile.
        </p>
      </div>
    </main>
  );
}