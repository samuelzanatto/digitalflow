"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { IconDeviceFloppy, IconCamera, IconTrash, IconLoader2 } from "@tabler/icons-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"

export default function ConfiguracoesPage() {
  const { setPageHeader } = usePageHeader()
  const { user: contextUser, updateUserData } = useUser()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [nome, setNome] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null
    return createSupabaseBrowserClient()
  }, [])

  useEffect(() => {
    setPageHeader("Configurações", "Gerencie suas preferências")
  }, [setPageHeader])

  // Sincronizar nome local com o contexto
  useEffect(() => {
    if (contextUser?.full_name) {
      setNome(contextUser.full_name)
    }
  }, [contextUser?.full_name])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida")
      return
    }

    // Validação de tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload")
      }

      // Adiciona cache-buster para forçar recarregar a imagem
      const avatarUrlWithCacheBuster = `${data.avatarUrl}?t=${Date.now()}`
      
      // Atualiza o contexto global do usuário
      updateUserData({ avatar_url: avatarUrlWithCacheBuster })

      toast.success("Avatar atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload do avatar")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleAvatarDelete = async () => {
    if (!contextUser?.avatar_url) return

    setIsDeleting(true)

    try {
      const response = await fetch("/api/avatar", {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover avatar")
      }

      // Atualiza o contexto global do usuário
      updateUserData({ avatar_url: undefined })

      toast.success("Avatar removido com sucesso!")
    } catch (error) {
      console.error("Erro ao remover avatar:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao remover avatar")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!contextUser || !supabase) return

    setIsSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nome }
      })

      if (error) throw error

      // Atualiza o contexto global do usuário
      updateUserData({ full_name: nome })

      toast.success("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      toast.error("Erro ao salvar alterações")
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-6">
        {/* Perfil */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Perfil</h2>
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-muted">
                  <AvatarImage src={contextUser?.avatar_url} alt={nome || "Avatar"} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {nome ? getInitials(nome) : "?"}
                  </AvatarFallback>
                </Avatar>
                
                {/* Overlay para hover */}
                <div 
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <IconLoader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <IconCamera className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <IconCamera className="h-4 w-4 mr-2" />
                        {contextUser?.avatar_url ? "Trocar foto" : "Adicionar foto"}
                      </>
                    )}
                  </Button>

                  {contextUser?.avatar_url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAvatarDelete}
                      disabled={isDeleting}
                      className="text-destructive hover:text-destructive"
                    >
                      {isDeleting ? (
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconTrash className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou GIF. Máximo 5MB.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Form Fields */}
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input 
                id="nome" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-2" 
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={contextUser?.email || ""} 
                disabled
                className="mt-2 bg-muted" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                O email não pode ser alterado
              </p>
            </div>
            <Button 
              className="gap-2" 
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconDeviceFloppy size={16} />
              )}
              Salvar Alterações
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

