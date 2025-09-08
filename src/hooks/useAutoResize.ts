import { useEffect } from "react";

export function useAutoResize(ref: React.RefObject<HTMLTextAreaElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };

    fit();                              // initial
    el.addEventListener("input", fit);  // grow while typing
    window.addEventListener("resize", fit);

    return () => {
      el.removeEventListener("input", fit);
      window.removeEventListener("resize", fit);
    };
  }, [ref]);
}
