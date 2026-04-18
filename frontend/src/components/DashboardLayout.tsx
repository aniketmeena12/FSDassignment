import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

export const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen w-full bg-surface-base text-text-bright">
    <AppSidebar />
    <main className="flex-1 flex flex-col min-w-0 bg-surface-panel">{children}</main>
  </div>
);
