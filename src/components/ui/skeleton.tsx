"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  loading?: boolean
  fixture?: React.ReactNode
  snapshotConfig?: any
}

function Skeleton({
  className,
  name,
  loading,
  children,
  fixture,
  snapshotConfig,
  ...props
}: SkeletonProps) {
  // If a name is provided, we use the boneyard framework
  if (name) {
    return (
      <BoneyardSkeleton 
        name={name} 
        loading={loading ?? false}
        className={className}
        fixture={fixture}
        snapshotConfig={snapshotConfig}
      >
        {children}
      </BoneyardSkeleton>
    )
  }

  // Fallback to traditional manual skeleton (pulsing div)
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/20", className)}
      {...props}
    />
  )
}

export { Skeleton }
