import { useEffect } from "react";

export function useTitlePrefix(title: string): void {
  useEffect(() => {
    if (!title) return;
    const prevTitle = document.title;
    document.title = title + " - " + prevTitle;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
