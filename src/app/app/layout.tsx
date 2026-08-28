import { ScreenShell } from "@/components/ScreenShell";
import { TabBar } from "@/components/TabBar";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <ScreenShell background="var(--white)">
      {children}
      <TabBar />
    </ScreenShell>
  );
}
