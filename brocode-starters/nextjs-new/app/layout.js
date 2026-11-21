export const metadata = {
  title: 'Next.js Starter',
  description: 'Generated in VibeCode',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
