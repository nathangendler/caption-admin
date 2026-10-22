import type { Metadata } from "next";
import "./globals.css";
import { AdminHeader } from "@/components/AdminHeaderServer";

export const metadata: Metadata = {
  title: "Caption admin",
  description: "Admin area for the Caption This app",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <AdminHeader />
        <div className="p-6">{children}</div>
      </body>
    </html>
  );
}
