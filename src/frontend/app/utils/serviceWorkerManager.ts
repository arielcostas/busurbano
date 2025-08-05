export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private onUpdateCallback?: () => void;

  async initialize() {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Workers not supported");
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered with scope:", this.registration.scope);

      // Listen for updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker is installed and ready
              this.updateAvailable = true;
              this.onUpdateCallback?.();
            }
          });
        }
      });

      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "SW_UPDATED") {
          this.updateAvailable = true;
          this.onUpdateCallback?.();
        }
      });

      // Check for updates periodically
      setInterval(() => {
        this.checkForUpdates();
      }, 60 * 1000); // Check every minute

    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  async checkForUpdates() {
    if (this.registration) {
      try {
        await this.registration.update();
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    }
  }

  activateUpdate() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" });
      this.updateAvailable = false;
    }
  }

  onUpdate(callback: () => void) {
    this.onUpdateCallback = callback;
  }

  isUpdateAvailable() {
    return this.updateAvailable;
  }

  async clearCache() {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({ type: "CLEAR_CACHE" });
    }
  }
}

export const swManager = new ServiceWorkerManager();
