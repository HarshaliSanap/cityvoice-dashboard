import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import ThemeSync from "./components/ThemeSync";

export const metadata: Metadata = {
  title: "CityVoice Admin",
  description: "CityVoice admin dashboard",
  icons: {
    icon: [{ url: "/vercel.svg?v=cityvoice", type: "image/svg+xml" }],
    shortcut: "/vercel.svg?v=cityvoice",
    apple: "/vercel.svg?v=cityvoice",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeSync />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
