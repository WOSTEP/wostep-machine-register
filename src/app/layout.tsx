import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import { LangProvider } from "@/lib/i18n/LangProvider";
import { ToastProvider, ToastHost } from "@/lib/toast";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "WOSTEP Machine Register",
  description:
    "Machine register and service history for the Fondation WOSTEP workshops.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#efefed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={jost.variable}>
      <body>
        <LangProvider>
          <ToastProvider>
            {children}
            <ToastHost />
          </ToastProvider>
        </LangProvider>
      </body>
    </html>
  );
}
