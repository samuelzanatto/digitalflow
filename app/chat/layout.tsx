import { PageHeaderProvider } from "@/components/page-header-context"
import { Navbar } from "@/components/navbar"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageHeaderProvider
      title="Chat com Especialista"
      description="Converse com nosso especialista sobre sua estratégia digital"
    >
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto">
          {children}
        </main>
      </div>
    </PageHeaderProvider>
  )
}
