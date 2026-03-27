"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

const ContextMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  anchor: { x: number; y: number } | null
  setAnchor: (anchor: { x: number; y: number } | null) => void
} | null>(null)

function useContextMenu() {
  const context = React.useContext(ContextMenuContext)
  if (!context) {
    throw new Error("useContextMenu must be used within a ContextMenu")
  }
  return context
}

function ContextMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [anchor, setAnchor] = React.useState<{ x: number; y: number } | null>(null)

  return (
    <ContextMenuContext.Provider value={{ open, setOpen, anchor, setAnchor }}>
      {children}
    </ContextMenuContext.Provider>
  )
}

function ContextMenuTrigger({
  children,
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const context = React.useContext(ContextMenuContext)
  
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!context) return
    e.preventDefault()
    context.setAnchor({ x: e.clientX, y: e.clientY })
    context.setOpen(true)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>
    const childProps = children.props as {
      className?: string
      onContextMenu?: (e: React.MouseEvent) => void
    }

    return React.cloneElement(child, {
      ...props,
      onContextMenu: (e: React.MouseEvent) => {
        childProps.onContextMenu?.(e)
        handleContextMenu(e)
      },
      className: cn(childProps.className, className),
    })
  }

  return (
    <div
      data-slot="context-menu-trigger"
      className={cn("contents", className)}
      onContextMenu={handleContextMenu}
      {...props}
    >
      {children}
    </div>
  )
}

function ContextMenuContent({
  className,
  ...props
}: MenuPrimitive.Popup.Props) {
  const context = React.useContext(ContextMenuContext)
  if (!context) return null

  // Always render portal in document.body to avoid invalid DOM in tables
  return (
    <MenuPrimitive.Root open={context.open} onOpenChange={context.setOpen}>
      <MenuPrimitive.Portal container={typeof window !== 'undefined' ? document.body : undefined}>
        <MenuPrimitive.Positioner
          anchor={{
            getBoundingClientRect: () =>
              ({
                width: 0,
                height: 0,
                top: context.anchor?.y ?? 0,
                bottom: context.anchor?.y ?? 0,
                left: context.anchor?.x ?? 0,
                right: context.anchor?.x ?? 0,
                x: context.anchor?.x ?? 0,
                y: context.anchor?.y ?? 0,
                toJSON: () => {},
              }) as DOMRect,
          }}
        >
          <MenuPrimitive.Popup
            data-slot="context-menu-content"
            className={cn(
              "z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              className
            )}
            {...props}
          />
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

function ContextMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="context-menu-group" {...props} />
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.Group>
      <MenuPrimitive.GroupLabel
        data-slot="context-menu-label"
        data-inset={inset}
        className={cn(
          "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7",
          className
        )}
        {...props}
      />
    </MenuPrimitive.Group>
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/context-menu-item relative flex min-h-10 md:min-h-8 cursor-default items-center gap-2 rounded-md px-2 py-2 md:px-1.5 md:py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/context-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  useContextMenu,
}
