import "./globals.scss";
import { ThemeProvider } from "@/lib/ThemeContext";
import { UnreadMessagesProvider } from "@/lib/UnreadMessagesContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <UnreadMessagesProvider>{children}</UnreadMessagesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
