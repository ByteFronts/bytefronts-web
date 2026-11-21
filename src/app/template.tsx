import { ViewTransition } from "react";

// Re-runs on every navigation. <ViewTransition> cross-fades between pages using the
// browser's View Transitions API, and does nothing where it isn't supported.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition>
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
