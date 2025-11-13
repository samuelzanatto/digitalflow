"use client"

import React, { createContext, useState, ReactNode, useCallback } from "react"

export interface PageHeaderContextType {
  title: string
  description?: string
  action?: React.ReactNode
  setPageHeader: (title: string, description?: string, action?: React.ReactNode) => void
}

export const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined)

export function PageHeaderProvider({
  children,
  title: initialTitle = "Dashboard",
  description: initialDescription,
  action: initialAction,
}: {
  children: ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [action, setAction] = useState(initialAction)

  const setPageHeader = useCallback((newTitle: string, newDescription?: string, newAction?: React.ReactNode) => {
    setTitle(newTitle)
    setDescription(newDescription)
    setAction(newAction)
  }, [])

  return (
    <PageHeaderContext.Provider value={{ title, description, action, setPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  )
}
