import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Pensala Media Team | Workflow Tracker",
  description: "Comprehensive content workflow pipeline tracker for the Pensala Media Team.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="font-sans antialiased text-[#1f2937] min-h-screen bg-[#F9FAFB]">
        <AuthProvider>
          <MainLayoutWrapper>
            {children}
          </MainLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
