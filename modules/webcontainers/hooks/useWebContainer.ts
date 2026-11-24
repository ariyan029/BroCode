import { useState, useEffect, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/path-to-json";

interface UseWebContainerProps {
  templateData: TemplateFolder;
}

interface UseWebContaierReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  destory: () => void;
}

// Module-level singleton references
let globalWebContainerInstance: WebContainer | null = null;
let globalWebContainerBootPromise: Promise<WebContainer> | null = null;

/**
 * Singleton getter for WebContainer.
 * Ensures WebContainer.boot() is only called ONCE across the entire browser lifecycle,
 * preventing "Only a single WebContainer instance can be booted" errors caused by
 * React StrictMode, Fast Refresh, or page re-renders.
 */
async function getWebContainerSingleton(): Promise<WebContainer> {
  if (typeof window === "undefined") {
    throw new Error("WebContainer can only be initialized on the client side.");
  }

  const win = window as any;

  // 1. Check window cache (survives HMR / hot-module reloads in development)
  if (win.__webcontainer_instance__) {
    globalWebContainerInstance = win.__webcontainer_instance__;
    return win.__webcontainer_instance__;
  }

  // 2. Check module cache
  if (globalWebContainerInstance) {
    win.__webcontainer_instance__ = globalWebContainerInstance;
    return globalWebContainerInstance;
  }

  // 3. Check if boot is already in-flight
  if (win.__webcontainer_boot_promise__) {
    return win.__webcontainer_boot_promise__;
  }

  if (globalWebContainerBootPromise) {
    return globalWebContainerBootPromise;
  }

  // 4. Boot a single instance
  const bootPromise = WebContainer.boot()
    .then((inst) => {
      globalWebContainerInstance = inst;
      win.__webcontainer_instance__ = inst;
      globalWebContainerBootPromise = null;
      win.__webcontainer_boot_promise__ = null;
      return inst;
    })
    .catch((err) => {
      // Clear promises on error so it can be retried
      globalWebContainerBootPromise = null;
      win.__webcontainer_boot_promise__ = null;

      // If the error indicates an instance was already booted elsewhere, reuse it
      if (err?.message?.includes("Only a single WebContainer instance can be booted")) {
        if (globalWebContainerInstance) {
          return globalWebContainerInstance;
        }
        if (win.__webcontainer_instance__) {
          globalWebContainerInstance = win.__webcontainer_instance__;
          return win.__webcontainer_instance__;
        }
      }
      throw err;
    });

  globalWebContainerBootPromise = bootPromise;
  win.__webcontainer_boot_promise__ = bootPromise;

  return bootPromise;
}

export const useWebContainer = ({
  templateData,
}: UseWebContainerProps): UseWebContaierReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(() => {
    if (typeof window !== "undefined") {
      return (window as any).__webcontainer_instance__ || globalWebContainerInstance || null;
    }
    return null;
  });

  useEffect(() => {
    let mounted = true;

    async function initializeWebContainer() {
      try {
        const webcontainerInstance = await getWebContainerSingleton();

        if (!mounted) return;

        setInstance(webcontainerInstance);
        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        console.error("Failed to initialize WebContainer:", err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize WebContainer"
          );
          setIsLoading(false);
        }
      }
    }

    initializeWebContainer();

    return () => {
      mounted = false;
      // Do NOT call instance.teardown() here!
      // In React Strict Mode or on route changes, tearing down WebContainer
      // causes subsequent boots to fail because WebContainer is an expensive
      // browser-level singleton worker process.
    };
  }, []);

  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      const activeInstance =
        instance ||
        globalWebContainerInstance ||
        (typeof window !== "undefined"
          ? (window as any).__webcontainer_instance__
          : null);

      if (!activeInstance) {
        throw new Error("WebContainer instance is not available");
      }

      try {
        const pathParts = path.split("/");
        const folderPath = pathParts.slice(0, -1).join("/");

        if (folderPath) {
          await activeInstance.fs.mkdir(folderPath, { recursive: true });
        }

        await activeInstance.fs.writeFile(path, content);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to write file";
        console.error(`Failed to write file at ${path}:`, err);
        throw new Error(`Failed to write file at ${path}: ${errorMessage}`);
      }
    },
    [instance]
  );

  const destory = useCallback(() => {
    const activeInstance =
      globalWebContainerInstance ||
      (typeof window !== "undefined"
        ? (window as any).__webcontainer_instance__
        : null);

    if (activeInstance) {
      try {
        activeInstance.teardown();
      } catch (e) {
        console.warn("Error tearing down WebContainer:", e);
      }
      globalWebContainerInstance = null;
      globalWebContainerBootPromise = null;
      if (typeof window !== "undefined") {
        (window as any).__webcontainer_instance__ = null;
        (window as any).__webcontainer_boot_promise__ = null;
      }
      setInstance(null);
      setServerUrl(null);
    }
  }, []);

  return { serverUrl, isLoading, error, instance, writeFileSync, destory };
};
