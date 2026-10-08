import type { Metadata } from 'next'
import { Providers } from '@/lib/providers'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 错题本 - 智能识别，科学复习',
  description: '使用 AI 技术自动识别和管理错题，让学习更高效',
  keywords: ['错题本', 'AI识别', '学习工具', '教育', '复习'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}
