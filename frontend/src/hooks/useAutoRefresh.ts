import {
  useEffect,
  useRef,
} from "react";

interface AutoRefreshOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export function useAutoRefresh(
  callback: () => void | Promise<void>,
  {
    intervalMs = 30_000,
    enabled = true,
  }: AutoRefreshOptions = {},
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timer: number | undefined;

    const refresh = () => {
      if (
        document.visibilityState === "visible"
      ) {
        void callbackRef.current();
      }
    };

    const start = () => {
      window.clearInterval(timer);

      timer = window.setInterval(
        refresh,
        intervalMs,
      );
    };

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible"
      ) {
        refresh();
        start();
      } else {
        window.clearInterval(timer);
      }
    };

    const handleFocus = () => {
      refresh();
    };

    start();

    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );

    window.addEventListener(
      "focus",
      handleFocus,
    );

    return () => {
      window.clearInterval(timer);

      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );

      window.removeEventListener(
        "focus",
        handleFocus,
      );
    };
  }, [enabled, intervalMs]);
}
