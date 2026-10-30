import type { Metadata } from "next";
import { Geist_Mono, Manrope, Press_Start_2P, Silkscreen } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import { RoleProvider } from "@/context/RoleContext";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusPulse",
  description: "Campus issue resolution hub",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${pressStart.variable} ${silkscreen.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <RoleProvider>
          <Navbar />
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}
