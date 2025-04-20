import type { Metadata } from "next";
import "./globals.css";
import {Inter} from 'next/font/google'
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner"

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

const inter=Inter({subsets:["latin"]})

export const metadata: Metadata = {
  title: "TrackIt",
  description: "With intuitive dashboards, real-time expense tracking, smart budget suggestions, and insightful analytics, you'll always know where your money is going — and how to make it work for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={`${inter.className}`}>
        <Header/>
        <main className="min-h-screen">{children}</main>
        <Toaster />
        <footer className="bg-blue-50 py-12">
          <div className="container mx-auto px-4 text-center text-gray-600">
            Made by Abhiram
          </div>
        </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
