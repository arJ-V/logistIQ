"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function ValidatePage() {
  const router = useRouter()
  const params = useParams()
  const shipmentId = params.id as string

  useEffect(() => {
    // Immediately redirect to analysis page since validation is now integrated there
    router.replace(`/analysis/${shipmentId}`)
  }, [router, shipmentId])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to AI Analysis...</p>
      </div>
    </div>
  )
}
