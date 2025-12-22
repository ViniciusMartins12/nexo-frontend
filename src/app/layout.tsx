import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nexo",
  description: "Plataforma de recrutamento",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
