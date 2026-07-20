import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import { validateEnv } from "@/lib/env";
import "./globals.css";

// 启动时校验所有必需的环境变量（缺失则立即报错，不静默降级）
validateEnv();

const baseUrl = process.env.BASE_URL
  ? `${process.env.BASE_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "skmint — Distill Your Expertise into AI Personas",
  description:
    "Turn your knowledge and experience into a conversational AI personality. Brew, host, and monetize your expertise with skmint.",
  keywords:
    "AI personality, knowledge distillation, AI persona, skill minting, distill expertise, brew AI, skmint",
  openGraph: {
    title: "skmint — Distill Your Expertise into AI Personas",
    description:
      "Turn your knowledge and experience into a conversational AI personality. Brew, host, and monetize your expertise.",
    type: "website",
    url: baseUrl,
    images: [{ url: `${baseUrl}/images/logo.png`, width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "skmint — Distill Your Expertise into AI Personas",
    description:
      "Turn your knowledge and experience into a conversational AI personality. Brew, host, and monetize your expertise.",
    images: [`${baseUrl}/images/logo.png`],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen">
            <Header user={user} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
