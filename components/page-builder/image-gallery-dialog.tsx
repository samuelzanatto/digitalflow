'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { 
  Upload, 
  Image as ImageIcon, 
  Link, 
  Trash2, 
  Loader2, 
  Check,
  Search,
  X,
  AlertCircle
} from 'lucide-react'

interface GalleryImage {
  id: string
  name: string
  url: string
  size: number
  contentType: string
  createdAt: string
}

interface ImageGalleryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectImage: (url: string) => void
  currentUrl?: string
}

export function ImageGalleryDialog({
  open,
  onOpenChange,
  onSelectImage,
  currentUrl
}: ImageGalleryDialogProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'url' | 'upload'>('gallery')
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // Carregar imagens da galeria
  const loadImages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/gallery')
      if (!response.ok) {
        throw new Error('Erro ao carregar imagens')
      }
      const data = await response.json()
      setImages(data.images || [])
    } catch (err) {
      console.error('Erro ao carregar galeria:', err)
      setError('Não foi possível carregar a galeria')
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar imagens quando o dialog abrir
  useEffect(() => {
    if (open) {
      loadImages()
      setSelectedImage(currentUrl || null)
      setExternalUrl(currentUrl || '')
    }
  }, [open, loadImages, currentUrl])

  // Upload de arquivo
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    const uploadedImages: GalleryImage[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} não é uma imagem válida`)
        continue
      }

      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} excede o limite de 10MB`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/gallery', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro no upload')
        }

        const data = await response.json()
        uploadedImages.push(data.image)
        setUploadProgress(((i + 1) / files.length) * 100)
      } catch (err) {
        console.error('Erro no upload:', err)
        setError(`Erro ao enviar ${file.name}`)
      }
    }

    setUploading(false)
    
    if (uploadedImages.length > 0) {
      setImages(prev => [...uploadedImages, ...prev])
      setActiveTab('gallery')
      if (uploadedImages.length === 1) {
        setSelectedImage(uploadedImages[0].url)
      }
    }
  }

  // Deletar imagem
  const handleDelete = async (image: GalleryImage) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return

    try {
      // Extrair o path da URL
      const urlParts = image.url.split('/gallery/')
      const path = urlParts[1]

      const response = await fetch(`/api/gallery?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir')
      }

      setImages(prev => prev.filter(img => img.id !== image.id))
      if (selectedImage === image.url) {
        setSelectedImage(null)
      }
    } catch (err) {
      console.error('Erro ao excluir:', err)
      setError('Não foi possível excluir a imagem')
    }
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleUpload(e.dataTransfer.files)
  }

  // Confirmar seleção
  const handleConfirm = () => {
    if (activeTab === 'url' && externalUrl) {
      onSelectImage(externalUrl)
    } else if (selectedImage) {
      onSelectImage(selectedImage)
    }
    onOpenChange(false)
  }

  // Filtrar imagens pela busca
  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Selecionar Imagem
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Galeria
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              URL Externa
            </TabsTrigger>
          </TabsList>

          {/* Galeria */}
          <TabsContent value="gallery" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar imagens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button variant="outline" size="icon" onClick={loadImages} disabled={loading}>
                <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <ScrollArea className="flex-1 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhuma imagem encontrada</p>
                  <Button
                    variant="link"
                    onClick={() => setActiveTab('upload')}
                    className="mt-2"
                  >
                    Fazer upload de imagens
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
                  {filteredImages.map((image) => (
                    <div
                      key={image.id}
                      className={cn(
                        "group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                        selectedImage === image.url
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                      )}
                      onClick={() => setSelectedImage(image.url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Overlay com informações */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(image)
                            }}
                            className="p-1.5 rounded-full bg-destructive/80 hover:bg-destructive text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-white text-xs truncate">
                          <div className="font-medium truncate">{image.name}</div>
                          <div className="text-white/70">{formatFileSize(image.size)}</div>
                        </div>
                      </div>

                      {/* Indicador de seleção */}
                      {selectedImage === image.url && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Upload */}
          <TabsContent value="upload" className="flex-1 mt-4">
            <div
              className={cn(
                "flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed rounded-lg transition-colors",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="font-medium">Enviando...</p>
                    <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
                  </div>
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Arraste imagens aqui
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    ou clique para selecionar
                  </p>
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files)}
                    />
                    <Button asChild variant="outline">
                      <span>Selecionar Arquivos</span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-4">
                    JPG, PNG, GIF, WebP ou SVG • Máximo 10MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Imagens são otimizadas automaticamente
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mt-4 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </TabsContent>

          {/* URL Externa */}
          <TabsContent value="url" className="flex-1 mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  URL da Imagem
                </label>
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
              </div>

              {externalUrl && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={externalUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer com botões */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              (activeTab === 'gallery' && !selectedImage) ||
              (activeTab === 'url' && !externalUrl)
            }
          >
            Selecionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
