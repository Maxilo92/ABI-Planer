"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  asChild,
  render,
  children,
  nativeButton,
  ...props
}: DialogPrimitive.Trigger.Props & { asChild?: boolean }) {
  const isNativeButton = 
    (asChild && React.isValidElement(children) && children.type === "button") ||
    (React.isValidElement(render) && render.type === "button")
  
  const resolvedNativeButton = nativeButton ?? (isNativeButton ? true : (asChild || render ? false : undefined))

  const resolvedRender = asChild && React.isValidElement(children) 
    ? React.cloneElement(children as React.ReactElement<any>, { 
        ...(typeof children.type !== "string" ? { nativeButton: resolvedNativeButton } : {})
      }) 
    : (React.isValidElement(render) 
        ? React.cloneElement(render as React.ReactElement<any>, { 
            ...(typeof render.type !== "string" ? { nativeButton: resolvedNativeButton } : {})
          }) 
        : undefined)

  return (
    <DialogPrimitive.Trigger
      data-slot="sheet-trigger"
      render={resolvedRender}
      nativeButton={resolvedNativeButton}
      {...props}
    >
      {asChild ? null : children}
    </DialogPrimitive.Trigger>
  )
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({
  asChild,
  render,
  children,
  nativeButton,
  ...props
}: DialogPrimitive.Close.Props & { asChild?: boolean }) {
  const isNativeButton = 
    (asChild && React.isValidElement(children) && children.type === "button") ||
    (React.isValidElement(render) && render.type === "button")
  
  const resolvedNativeButton = nativeButton ?? (isNativeButton ? true : (asChild || render ? false : undefined))

  const resolvedRender = asChild && React.isValidElement(children) 
    ? React.cloneElement(children as React.ReactElement<any>, { 
        ...(typeof children.type !== "string" ? { nativeButton: resolvedNativeButton } : {})
      }) 
    : (React.isValidElement(render) 
        ? React.cloneElement(render as React.ReactElement<any>, { 
            ...(typeof render.type !== "string" ? { nativeButton: resolvedNativeButton } : {})
          }) 
        : undefined)

  return (
    <DialogPrimitive.Close
      data-slot="sheet-close"
      render={resolvedRender}
      nativeButton={resolvedNativeButton}
      {...props}
    >
      {asChild ? null : children}
    </DialogPrimitive.Close>
  )
}

function SheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-200 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: "top" | "bottom" | "left" | "right"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out border-border overflow-y-auto",
          side === "right" && "top-0 right-0 h-full w-full sm:max-w-md border-l data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right",
          side === "left" && "top-0 left-0 h-full w-full sm:max-w-md border-r data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left",
          side === "top" && "top-0 left-0 w-full border-b data-open:animate-in data-open:slide-in-from-top data-closed:animate-out data-closed:slide-out-to-top",
          side === "bottom" && "bottom-0 left-0 w-full border-t data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetClose
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetClose>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2 pb-4", className)}
      {...props}
    />
  )
}

function SheetFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
