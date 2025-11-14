'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar a página</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message || 'Ocorreu um erro inesperado'}
          </AlertDescription>
        </Alert>
        
        <button
          onClick={reset}
          className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
