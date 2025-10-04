"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, FileText } from "lucide-react"

interface CreateShipmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateShipmentModal({ open, onOpenChange }: CreateShipmentModalProps) {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [supplier, setSupplier] = useState("")
  const [etd, setEtd] = useState("")
  const [port, setPort] = useState("")

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles([...files, ...droppedFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles([...files, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const newShipmentId = `SH-${Math.floor(Math.random() * 9000) + 1000}`
    onOpenChange(false)
    router.push(`/validate/${newShipmentId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Create New Shipment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier" className="text-foreground">
                Supplier
              </Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger id="supplier" className="bg-background border-border">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shenzhen">Shenzhen Tech</SelectItem>
                  <SelectItem value="guangzhou">Guangzhou Electronics</SelectItem>
                  <SelectItem value="shanghai">Shanghai Manufacturing</SelectItem>
                  <SelectItem value="beijing">Beijing Components</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="etd" className="text-foreground">
                ETD
              </Label>
              <Input
                id="etd"
                type="date"
                value={etd}
                onChange={(e) => setEtd(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="port" className="text-foreground">
              Destination Port
            </Label>
            <Select value={port} onValueChange={setPort}>
              <SelectTrigger id="port" className="bg-background border-border">
                <SelectValue placeholder="Select destination port" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="la">Los Angeles, CA</SelectItem>
                <SelectItem value="ny">New York, NY</SelectItem>
                <SelectItem value="sf">San Francisco, CA</SelectItem>
                <SelectItem value="seattle">Seattle, WA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Documents</Label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground font-medium mb-1">Drop all shipment documents here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse (PDF, Excel, Word, Images)</p>
              <input type="file" multiple onChange={handleFileInput} className="hidden" id="file-upload" />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="border-border hover:bg-muted"
              >
                Browse Files
              </Button>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border hover:bg-muted">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="glow-button bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Create Shipment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
