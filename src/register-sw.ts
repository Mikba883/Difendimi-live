import { BUILD_TAG } from "@/version";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(`/sw.js?v=${BUILD_TAG}`, { scope: "/" })
    .catch((err) => console.error("SW registration failed:", err));

  navigator.serviceWorker.addEventListener("message", (evt) => {
    if (evt.data?.type === "SW_ACTIVATED") {
      if (!sessionStorage.getItem("sw-reloaded")) {
        sessionStorage.setItem("sw-reloaded", "1");
        window.location.reload();
      }
    }
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!sessionStorage.getItem("sw-reloaded")) {
      sessionStorage.setItem("sw-reloaded", "1");
      window.location.reload();
    }
  });
}
