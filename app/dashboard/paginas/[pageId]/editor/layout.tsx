import React from 'react'

export default function EditorPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {children}
    </div>
  )
}
