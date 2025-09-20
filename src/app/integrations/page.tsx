"use client"

import { useState, useRef } from 'react'
import { Upload, FileText, Plug, ExternalLink, CheckCircle, AlertCircle, Copy, Search, Filter, ArrowUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { generateOrderCode } from '@/lib/orderUtils'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface CSVRow {
  external_id: string
  channel: string
  customer_name: string
  sku: string
  qty: number
}

interface GroupedOrder {
  channel: string
  external_id: string
  customer_name: string
  lines: Array<{ sku: string; qty: number }>
}

interface ImportResult {
  success: boolean
  newOrders: Array<{ code: string; external_id: string; channel: string }>
  existingOrders: Array<{ code: string; external_id: string; channel: string }>
  errors: string[]
}

export default function IntegrationsPage() {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setImporting(true)

    try {
      const text = await file.text()
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim()
      })

      if (result.errors.length > 0) {
        throw new Error(`CSV parsing error: ${result.errors[0].message}`)
      }

      const data = result.data as CSVRow[]
      
      // Validate required columns
      const requiredColumns = ['external_id', 'channel', 'customer_name', 'sku', 'qty']
      const headers = Object.keys(data[0] || {})
      const missingColumns = requiredColumns.filter(col => !headers.includes(col))
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)
      }

      // Group rows by order (external_id + channel)
      const groupedOrders = new Map<string, GroupedOrder>()
      
      for (const row of data) {
        if (!row.external_id || !row.channel || !row.sku) continue
        
        const orderKey = `${row.channel}-${row.external_id}`
        
        if (!groupedOrders.has(orderKey)) {
          groupedOrders.set(orderKey, {
            channel: row.channel,
            external_id: row.external_id,
            customer_name: row.customer_name || '',
            lines: []
          })
        }
        
        const order = groupedOrders.get(orderKey)!
        order.lines.push({
          sku: row.sku,
          qty: parseInt(row.qty?.toString()) || 1
        })
      }

      // Import orders
      const result_import = await importOrders(Array.from(groupedOrders.values()))
      setImportResult(result_import)
      setShowResultDialog(true)
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import CSV')
    } finally {
      setImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const importOrders = async (orders: GroupedOrder[]): Promise<ImportResult> => {
    const newOrders: Array<{ code: string; external_id: string; channel: string }> = []
    const existingOrders: Array<{ code: string; external_id: string; channel: string }> = []
    const errors: string[] = []

    for (const orderData of orders) {
      try {
        // Check if order already exists
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('code')
          .eq('external_id', orderData.external_id)
          .eq('channel', orderData.channel)
          .single()

        if (existingOrder) {
          existingOrders.push({
            code: existingOrder.code,
            external_id: orderData.external_id,
            channel: orderData.channel
          })
          continue
        }

        // Get products for the order lines
        const skus = orderData.lines.map(line => line.sku)
        const { data: products } = await supabase
          .from('products')
          .select('id, sku')
          .in('sku', skus)
          .eq('archived', false)

        if (!products || products.length === 0) {
          errors.push(`No products found for order ${orderData.external_id}`)
          continue
        }

        // Create order
        const orderCode = generateOrderCode()
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            code: orderCode,
            channel: orderData.channel,
            external_id: orderData.external_id,
            customer_name: orderData.customer_name,
            status: 'PENDING'
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Create order lines
        const orderLines = orderData.lines
          .map(line => {
            const product = products.find(p => p.sku === line.sku)
            if (!product) return null
            
            return {
              order_id: order.id,
              product_id: product.id,
              qty: line.qty
            }
          })
          .filter(Boolean)

        if (orderLines.length > 0) {
          const { error: linesError } = await supabase
            .from('order_lines')
            .insert(orderLines)

          if (linesError) throw linesError
        }

        newOrders.push({
          code: orderCode,
          external_id: orderData.external_id,
          channel: orderData.channel
        })

      } catch (error) {
        console.error(`Error importing order ${orderData.external_id}:`, error)
        errors.push(`Failed to import order ${orderData.external_id}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      newOrders,
      existingOrders,
      errors
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex h-full items-center justify-center">
      {/* Main Content Container - 1120x683px centered - includes everything */}
      <div className="flex flex-col border rounded-lg bg-white shadow-sm" style={{ width: '1120px', height: '683px' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ minHeight: '80px' }}>
          <div>
            <h1 className="font-semibold tracking-wide" style={{ fontSize: '24px' }}>Integrations</h1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-6 py-3" style={{ minHeight: '60px' }}>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search Integrations"
                className="w-64 pl-9 h-10 px-3 border border-gray-300 rounded-md"
                style={{ fontSize: '16px' }}
              />
            </div>
            <Button variant="ghost" size="sm" style={{ border: 'none', backgroundColor: 'transparent' }}>
              <Filter className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" style={{ border: 'none', backgroundColor: 'transparent' }}>
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
          <Button style={{ backgroundColor: '#444EAA', color: 'white', marginRight: '12px' }}>
            <Plus style={{ width: '10px', height: '10px' }} />
            Add New
          </Button>
        </div>

        {/* Content - takes remaining space within 683px total height */}
        <div className="flex-1 overflow-auto p-6" style={{ maxHeight: '543px' }}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* CSV Import */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>CSV Import</span>
              </CardTitle>
              <CardDescription>
                Import orders from CSV files with external IDs and customer data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Required CSV columns:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>external_id</li>
                    <li>channel</li>
                    <li>customer_name</li>
                    <li>sku</li>
                    <li>qty</li>
                  </ul>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? 'Importing...' : 'Upload CSV'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Shopify Integration */}
          <Card className="opacity-60 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plug className="h-5 w-5" />
                <span>Shopify</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                Automatically sync orders from your Shopify store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Shopify
              </Button>
            </CardContent>
          </Card>

          {/* Etsy Integration */}
          <Card className="opacity-60 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plug className="h-5 w-5" />
                <span>Etsy</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                Connect with your Etsy shop to import orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Etsy
              </Button>
            </CardContent>
          </Card>

          {/* WooCommerce Integration */}
          <Card className="opacity-60 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plug className="h-5 w-5" />
                <span>WooCommerce</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                Import orders from your WooCommerce store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect WooCommerce
              </Button>
            </CardContent>
          </Card>

          {/* Amazon Integration */}
          <Card className="opacity-60 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plug className="h-5 w-5" />
                <span>Amazon</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                Sync orders from Amazon Seller Central
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Amazon
              </Button>
            </CardContent>
          </Card>

          {/* Square Integration */}
          <Card className="opacity-60 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plug className="h-5 w-5" />
                <span>Square</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                Import orders from Square point of sale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Square
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>

      {/* Import Result Dialog */}
      {showResultDialog && importResult && (
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Results</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {importResult.success ? 'Import Completed Successfully' : 'Import Completed with Errors'}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>{importResult.newOrders.length} new orders imported</p>
                <p>{importResult.existingOrders.length} existing orders skipped</p>
                {importResult.errors.length > 0 && (
                  <p>{importResult.errors.length} errors occurred</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setShowResultDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}