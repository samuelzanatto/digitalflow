"use client"

import { useContext } from "react"
import { PageHeaderContext } from "@/components/page-header-context"

export function usePageHeader() {
  const context = useContext(PageHeaderContext)
  if (!context) {
    throw new Error("usePageHeader must be used within PageHeaderProvider")
  }
  return context
}
