import { useEffect } from "react"

// Listen for auth confirmation in the original tab
if (typeof window !== "undefined") {
  if (window.BroadcastChannel) {
    const channel = new BroadcastChannel("auth-confirmation");
    channel.onmessage = (event) => {
      if (event.data.status === "success") {
        window.location.href = "/login?verified=1";
      } else if (event.data.status === "error") {
        window.location.href = "/login?error=Authentication%20failed";
      }
    };
  } else {
    window.addEventListener("storage", (e) => {
      if (e.key === "auth-confirmation" && e.newValue) {
        const data = JSON.parse(e.newValue);
        if (data.status === "success") {
          window.location.href = "/login?verified=1";
        } else if (data.status === "error") {
          window.location.href = "/login?error=Authentication%20failed";
        }
      }
    });
  }
}