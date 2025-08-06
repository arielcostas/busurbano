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
      // First, unregister any old service workers to start fresh
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.scope.includes(window.location.origin)) {
          console.log("Unregistering old service worker:", registration.scope);
          await registration.unregister();
        }
      }

      // Register the new worker with a fresh name
      this.registration = await navigator.serviceWorker.register("/pwa-worker.js", {
        updateViaCache: 'none' // Disable caching for the SW file itself
      });
      console.log("PWA Worker registered with scope:", this.registration.scope);

      // Implement proper updatefound detection (web.dev pattern)
      await this.detectSWUpdate();

      // Check for updates periodically
      setInterval(() => {
        this.checkForUpdates();
      }, 30 * 1000);

      // Check when page becomes visible
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          this.checkForUpdates();
        }
      });

    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  private async detectSWUpdate() {
    if (!this.registration) return;

    // Listen for new service worker discovery
    this.registration.addEventListener("updatefound", () => {
      const newSW = this.registration!.installing;
      if (!newSW) return;

      console.log("New service worker found, monitoring installation...");

      newSW.addEventListener("statechange", () => {
        console.log("New SW state:", newSW.state);
        
        if (newSW.state === "installed") {
          if (navigator.serviceWorker.controller) {
            // New service worker is installed, but old one is still controlling
            // This means an update is available
            console.log("New service worker installed - update available!");
            this.updateAvailable = true;
            this.onUpdateCallback?.();
          } else {
            // First install, no controller yet
            console.log("Service worker installed for the first time");
          }
        }

        if (newSW.state === "activated") {
          console.log("New service worker activated");
          // Optionally notify about successful update
        }
      });
    });

    // Also listen for controller changes
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("Service worker controller changed - reloading page");
      window.location.reload();
    });
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

  async clearCache(): Promise<void> {
    try {
      // Delete all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log("All caches cleared");
    } catch (error) {
      console.error("Failed to clear cache:", error);
      throw error;
    }
  }

  // Nuclear option: completely reset the PWA
  async resetPWA(): Promise<void> {
    try {
      console.log("Resetting PWA completely...");
      
      // 1. Unregister ALL service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      
      // 2. Clear all caches
      await this.clearCache();
      
      // 3. Clear local storage (optional)
      localStorage.clear();
      sessionStorage.clear();
      
      console.log("PWA reset complete - reloading...");
      
      // 4. Force reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error("Failed to reset PWA:", error);
      throw error;
    }
  }
}

export const swManager = new ServiceWorkerManager();
