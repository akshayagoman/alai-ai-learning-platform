"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error during auth callback:", error)
        // Notify original tab of failure
        if (window.BroadcastChannel) {
          const channel = new BroadcastChannel("auth-confirmation");
          channel.postMessage({ status: "error" });
          channel.close();
        } else {
          localStorage.setItem("auth-confirmation", JSON.stringify({ status: "error", ts: Date.now() }));
        }
        router.replace("/login?error=Authentication%20failed")
        return
      }

      if (data.session) {
        // Check if user settings exist
        const { data: userSettings, error: settingsError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", data.session.user.id)
          .single()

        if (settingsError && settingsError.code !== "PGRST116") {
          console.error("Error checking user settings:", settingsError)
        }

        // If no settings exist, create them
        if (!userSettings) {
          const userData = data.session.user
          const name = userData.user_metadata.full_name || userData.user_metadata.name || ""

          await supabase.from("user_settings").insert({
            user_id: userData.id,
            syllabus_type: "cbse",
            preferred_language: "english",
            username: userData.email?.split("@")[0] || `user_${Math.floor(Math.random() * 10000)}`,
            first_name: name.split(" ")[0] || "",
            last_name: name.split(" ").length > 1 ? name.split(" ").slice(1).join(" ") : null,
          })
        }

        // Notify original tab of success
        if (window.BroadcastChannel) {
          const channel = new BroadcastChannel("auth-confirmation");
          channel.postMessage({ status: "success" });
          channel.close();
        } else {
          localStorage.setItem("auth-confirmation", JSON.stringify({ status: "success", ts: Date.now() }));
        }

        // Show message and allow user to close tab
        // router.replace("/login?verified=1")
      } else {
        // Notify original tab of failure
        if (window.BroadcastChannel) {
          const channel = new BroadcastChannel("auth-confirmation");
          channel.postMessage({ status: "error" });
          channel.close();
        } else {
          localStorage.setItem("auth-confirmation", JSON.stringify({ status: "error", ts: Date.now() }));
        }
        router.replace("/login")
      }
    }

    handleAuthCallback()
  }, [router])

  // Listen for close tab action
  const handleCloseTab = () => {
    window.close()
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Email Confirmed!</h2>
        <p className="mb-2">You can now return to the original tab. If it doesn't reload automatically, please refresh it or click the button below.</p>
        <button onClick={handleCloseTab} className="mt-4 px-4 py-2 bg-primary text-white rounded">Close this tab</button>
      </div>
    </div>
  )
}