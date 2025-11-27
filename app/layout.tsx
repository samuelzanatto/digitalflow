/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TransitionProvider } from "@/components/transition-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "flow",
  description: "flow - Transformando ideias em experiências digitais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700;900&family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@400;700;900&family=Lora:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700;800&family=Raleway:wght@400;500;600;700;800;900&family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;500;600;700;800;900&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const htmlElement = document.documentElement;
                if (!htmlElement.classList.contains('dark')) {
                  htmlElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="antialiased bg-background text-foreground"
        suppressHydrationWarning
        style={{ fontFamily: "var(--font-poppins, 'Poppins', sans-serif)" }}
      >
        <ThemeProvider>
          <TransitionProvider>
            {children}
          </TransitionProvider>
        </ThemeProvider>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
