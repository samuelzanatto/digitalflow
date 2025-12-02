import { UserProvider } from "@/contexts/user-context"
import { CollaborationProvider } from "@/contexts/collaboration-context"

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <CollaborationProvider>
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
          {children}
        </div>
      </CollaborationProvider>
    </UserProvider>
  )
}
