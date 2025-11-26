import * as React from "react"
import type { Editor } from "@tiptap/react"
import type { VariantProps } from "class-variance-authority"
import type { toggleVariants } from "@/components/ui/toggle"
import {
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  TextAlignJustifyIcon,
} from "@radix-ui/react-icons"
import { ToolbarButton } from "../toolbar-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface AlignmentSectionProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
}

const alignments = [
  { value: "left", label: "Alinhar à esquerda", icon: TextAlignLeftIcon },
  { value: "center", label: "Centralizar", icon: TextAlignCenterIcon },
  { value: "right", label: "Alinhar à direita", icon: TextAlignRightIcon },
  { value: "justify", label: "Justificar", icon: TextAlignJustifyIcon },
]

export const AlignmentSection: React.FC<AlignmentSectionProps> = ({
  editor,
  size,
  variant,
}) => {
  const currentAlignment = alignments.find((a) =>
    editor.isActive({ textAlign: a.value })
  ) || alignments[0]

  const CurrentIcon = currentAlignment.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          isActive={editor.isActive({ textAlign: currentAlignment.value })}
          tooltip="Alinhamento"
          aria-label="Alinhamento"
          size={size}
          variant={variant}
          className="gap-1"
        >
          <CurrentIcon className="size-5" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {alignments.map((alignment) => {
          const Icon = alignment.icon
          const isActive = editor.isActive({ textAlign: alignment.value })
          return (
            <DropdownMenuItem
              key={alignment.value}
              onClick={() =>
                editor.chain().focus().setTextAlign(alignment.value).run()
              }
              className={cn("flex items-center gap-2", isActive && "bg-accent")}
            >
              <Icon className="size-4" />
              <span>{alignment.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

AlignmentSection.displayName = "AlignmentSection"

export default AlignmentSection
