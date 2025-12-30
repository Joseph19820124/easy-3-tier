import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";
import UserMenu from "@/components/auth/UserMenu";

export const metadata: Metadata = {
  title: "Todo List",
  description: "A simple todo list app with Next.js and Google Sheets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <SessionProvider>
          <header className="bg-white shadow-sm">
            <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-800">Todo List</h1>
              <UserMenu />
            </div>
          </header>
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
