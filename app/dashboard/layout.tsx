import { AppSidebar } from "@/components/app-sidebar"
import { AuroraBanner } from "@/components/aurora-banner"
import { PageHeaderProvider } from "@/components/page-header-context"
import { AuroraBannerProvider } from "@/contexts/aurora-banner-context"
import { UnreadMessagesProvider } from "@/contexts/unread-messages"
import { UserProvider } from "@/contexts/user-context"
import { OnlineUsersProvider } from "@/contexts/online-users-context"
import { CollaborationProvider } from "@/contexts/collaboration-context"
import { ChatNotificationsProvider } from "@/contexts/chat-notifications-context"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DashboardContent } from "./dashboard-content"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div suppressHydrationWarning>
      <UserProvider>
        <OnlineUsersProvider>
          <CollaborationProvider>
            <UnreadMessagesProvider>
              <ChatNotificationsProvider>
                <AuroraBannerProvider>
                  <SidebarProvider
                  style={
                    {
                      "--sidebar-width": "calc(var(--spacing) * 72)",
                      "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                  }
                >
                <AppSidebar variant="inset" />
                <SidebarInset className="relative bg-sidebar">
                  <AuroraBanner />
                    <PageHeaderProvider>
                      <DashboardContent>
                        {children}
                      </DashboardContent>
                    </PageHeaderProvider>
                  </SidebarInset>
                </SidebarProvider>
                </AuroraBannerProvider>
              </ChatNotificationsProvider>
            </UnreadMessagesProvider>
          </CollaborationProvider>
        </OnlineUsersProvider>
      </UserProvider>
    </div>
  )
}
