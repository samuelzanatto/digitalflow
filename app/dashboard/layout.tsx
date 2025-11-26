import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { PageHeaderProvider } from "@/components/page-header-context"
import { UnreadMessagesProvider } from "@/contexts/unread-messages"
import { UserProvider } from "@/contexts/user-context"
import { OnlineUsersProvider } from "@/contexts/online-users-context"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div suppressHydrationWarning>
      <UserProvider>
        <OnlineUsersProvider>
          <UnreadMessagesProvider>
            <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset>
              <PageHeaderProvider>
                <SiteHeader />
                <div className="flex flex-1 flex-col rounded-b-2xl bg-black">
                  {children}
                </div>
              </PageHeaderProvider>
            </SidebarInset>
          </SidebarProvider>
          </UnreadMessagesProvider>
        </OnlineUsersProvider>
      </UserProvider>
    </div>
  )
}
