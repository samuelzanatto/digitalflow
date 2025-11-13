"use client"

import { useContext } from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { PageHeaderContext } from "@/components/page-header-context"

export function SiteHeader() {
  const pageHeader = useContext(PageHeaderContext)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-20">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-6"
        />
        <div className="flex flex-col">
          <h1 className="text-base md:text-lg font-semibold">
            {pageHeader?.title ?? "Dashboard"}
          </h1>
          {pageHeader?.description && (
            <p className="hidden md:block text-xs text-muted-foreground">{pageHeader.description}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {pageHeader?.action}
        </div>
      </div>
    </header>
  )
}
