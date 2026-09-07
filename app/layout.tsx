import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'EXACT ION 2-700 · 拆解实验室',
  icons: { icon: '/favicon.svg' },
  description:
    '基于博世官方三维模型和备件资料，探索 EXACT ION 2-700 的结构、零件和有据可查的操作步骤。',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body>{children}</body>
    </html>
  );
}
