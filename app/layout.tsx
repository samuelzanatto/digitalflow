import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TransitionProvider } from "@/components/transition-provider";
import {
  inter,
  roboto,
  poppins,
  playfair,
  lora,
  montserrat,
  openSans,
  raleway,
  merriweather,
  sourceSans,
} from "@/lib/fonts";

export const metadata: Metadata = {
  title: "flow",
  description: "flow - Transformando ideias em experiências digitais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontClassNames = [
    poppins.variable,
    inter.variable,
    roboto.variable,
    playfair.variable,
    lora.variable,
    montserrat.variable,
    openSans.variable,
    raleway.variable,
    merriweather.variable,
    sourceSans.variable,
  ].join(" ");

  return (
    <html lang="en" suppressHydrationWarning className={`dark ${fontClassNames}`}>
      <head>
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
        className={`${poppins.className} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <TransitionProvider>
            {children}
          </TransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
