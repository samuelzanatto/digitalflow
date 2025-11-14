'use client'

import React, { useState } from 'react'
import { useEditor } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown } from 'lucide-react'

export function PropertiesPanel() {
  const { selectedNodeId } = useEditor((state) => {
    const selected = Array.from(state.events.selected)
    return {
      selectedNodeId: selected.length > 0 ? selected[0] : null,
    }
  })

  if (!selectedNodeId) {
    return (
      <div className="h-full flex flex-col border-l bg-card">
        <div className="px-4 py-3 border-b bg-background">
          <h2 className="text-sm font-semibold">Propriedades</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Selecione um elemento para editar</p>
        </div>
      </div>
    )
  }

  return <PropertyPanelContent nodeId={selectedNodeId} />
}

interface PropertyPanelContentProps {
  nodeId: string
}

// Categorizar propriedades em seções
function categorizeProps(props: Record<string, unknown>) {
  const sections: Record<string, Record<string, unknown>> = {
    'Conteúdo': {},
    'Dimensões': {},
    'Layout': {},
    'Cores & Estilos': {},
    'Outro': {},
  }

  const dimensionKeys = ['width', 'height', 'padding', 'margin', 'flex']
  const layoutKeys = ['display', 'flexDirection', 'gap', 'justifyContent', 'alignItems']
  const colorKeys = ['backgroundColor', 'textColor', 'color', 'borderColor']
  const contentKeys = ['text', 'content', 'title', 'subtitle', 'link']
  const styleKeys = ['fontSize', 'borderRadius', 'borderWidth', 'alignment']

  Object.entries(props).forEach(([key, value]) => {
    if (contentKeys.includes(key)) sections['Conteúdo'][key] = value
    else if (dimensionKeys.includes(key)) sections['Dimensões'][key] = value
    else if (layoutKeys.includes(key)) sections['Layout'][key] = value
    else if (colorKeys.includes(key)) sections['Cores & Estilos'][key] = value
    else if (styleKeys.includes(key)) sections['Cores & Estilos'][key] = value
    else sections['Outro'][key] = value
  })

  return Object.fromEntries(Object.entries(sections).filter(([, v]) => Object.keys(v).length > 0))
}

function PropertyPanelContent({ nodeId }: PropertyPanelContentProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const { actions: { setProp }, props, data } = useEditor((state) => {
    const node = state.nodes[nodeId]
    return {
      props: node?.data.props || {},
      data: node?.data || {},
    }
  })

  const displayName = (data as Record<string, unknown>)?.displayName || 'Componente'
  const sections = categorizeProps(props as Record<string, unknown>)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const renderPropertyInput = (key: string, value: unknown, allProps: Record<string, unknown>) => {
    // Cores
    if (typeof value === 'string' && value.startsWith('#')) {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr[key] = e.target.value
                })
              }
              className="w-12 h-8 rounded border cursor-pointer"
            />
            <Input
              value={value || '#000000'}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr[key] = e.target.value
                })
              }
              className="flex-1 text-xs"
              placeholder="#000000"
            />
          </div>
        </div>
      )
    }

    // Números (sliders para propriedades específicas)
    if (typeof value === 'number') {
      const isSlider = [
        'fontSize',
        'padding',
        'margin',
        'borderRadius',
        'borderWidth',
        'gap',
        'flex',
        'width',
        'height',
      ].includes(key)

      if (isSlider) {
        const maxValues: Record<string, number> = {
          fontSize: 72,
          padding: 100,
          margin: 100,
          borderRadius: 50,
          borderWidth: 10,
          gap: 50,
          flex: 10,
          width: 1200,
          height: 800,
        }

        // Se width e fullWidth está ativo, desabilita o controle
        const isWidthAndFullWidth = key === 'width' && (allProps.fullWidth as boolean)

        const sliderContent = (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0
                    const max = maxValues[key] || 100
                    const clampedValue = Math.min(Math.max(newValue, 0), max)
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr[key] = clampedValue
                    })
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={maxValues[key] || 100}
                  disabled={isWidthAndFullWidth}
                />
                {(key === 'width' || key === 'height') && (
                  <span className="text-xs text-muted-foreground">px</span>
                )}
              </div>
            </div>
            {!isWidthAndFullWidth && (
              <Slider
                min={0}
                max={maxValues[key] || 100}
                step={key === 'flex' ? 0.1 : 1}
                value={[value]}
                onValueChange={(v) =>
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr[key] = v[0]
                  })
                }
              />
            )}
            {isWidthAndFullWidth && (
              <p className="text-xs text-muted-foreground italic">Full Width ativado</p>
            )}
            {/* Mostrar Full Width checkbox abaixo do width slider */}
            {key === 'width' && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Label className="text-xs font-medium">Full Width</Label>
                <input
                  type="checkbox"
                  checked={allProps.fullWidth as boolean}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.fullWidth = e.target.checked
                    })
                  }
                  className="w-4 h-4 rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        )

        return sliderContent
      }

      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr[key] = parseInt(e.target.value)
              })
            }
            className="text-xs"
          />
        </div>
      )
    }

    // Selects para enum
    if (
      key === 'alignment' ||
      key === 'display' ||
      key === 'flexDirection' ||
      key === 'justifyContent' ||
      key === 'alignItems'
    ) {
      const options: Record<string, string[]> = {
        alignment: ['left', 'center', 'right'],
        display: ['block', 'flex', 'grid'],
        flexDirection: ['row', 'column'],
        justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
        alignItems: ['flex-start', 'center', 'flex-end', 'stretch'],
      }

      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <Select value={value as string} onValueChange={(v) => setProp(nodeId, (pr: Record<string, unknown>) => { pr[key] = v })}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options[key]?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    // Booleans (checkboxes)
    if (typeof value === 'boolean') {
      // Não renderizar fullWidth aqui, pois já está renderizado com o width
      if (key === 'fullWidth') {
        return null
      }

      return (
        <div key={key} className="flex items-center justify-between">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr[key] = e.target.checked
              })
            }
            className="w-4 h-4 rounded cursor-pointer"
          />
        </div>
      )
    }

    // Texto genérico
    return (
      <div key={key} className="space-y-2">
        <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
        <Input
          type="text"
          value={String(value) || ''}
          onChange={(e) =>
            setProp(nodeId, (pr: Record<string, unknown>) => {
              pr[key] = e.target.value
            })
          }
          className="text-xs"
          placeholder={`${key}...`}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col border-l bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-background sticky top-0">
        <h2 className="text-sm font-semibold">Propriedades</h2>
        <p className="text-xs text-muted-foreground">{String(displayName)}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {Object.entries(sections).map(([sectionName, sectionProps]) => {
          const isExpanded = expandedSections[sectionName] ?? true
          return (
            <div key={sectionName} className="border rounded">
              <button
                onClick={() => toggleSection(sectionName)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                />
                <span className="text-xs font-semibold">{sectionName}</span>
              </button>

              {isExpanded && (
                <div className="px-3 py-2 space-y-3 border-t bg-muted/30">
                  {Object.entries(sectionProps).map(([key, value]) => renderPropertyInput(key, value, props as Record<string, unknown>))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
