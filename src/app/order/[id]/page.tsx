"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Search, Filter, ArrowUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  variant: string | null
  sku: string
  price: number | null
  archived: boolean
}

interface Order {
  id: string
  code: string | null
  channel: string
  external_id: string | null
  customer_name: string | null
  status: string
  carrier: string | null
  tracking: string | null
  created_at: string
}

interface OrderLine {
  id: string
  order_id: string
  product_id: string
  qty: number
  product?: Product
}

interface OrderWithLines extends Order {
  order_lines: OrderLine[]
}

const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
}

const STATUS_COLORS = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  SHIPPED: 'default',
  DELIVERED: 'default',
  CANCELLED: 'destructive'
}

const getStatusBadgeVariant = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'secondary'
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderWithLines | null>(null)
  const [loading, setLoading] = useState(true)
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')

  useEffect(() => {
    if (params.id) {
      loadOrder(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (order) {
      setCarrier(order.carrier || '')
      setTracking(order.tracking || '')
    }
  }, [order])

  const loadOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_lines (
            *,
            product:products (*)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (status: string, newCarrier?: string, newTracking?: string) => {
    if (!order) return

    try {
      const updateData: any = { status }
      if (newCarrier !== undefined) updateData.carrier = newCarrier
      if (newTracking !== undefined) updateData.tracking = newTracking

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id)

      if (error) throw error

      setOrder(prev => prev ? { ...prev, ...updateData } : null)
      toast.success('Order updated successfully')
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  const handleMarkShipped = () => {
    updateOrderStatus('SHIPPED', carrier, tracking)
  }

  const handleSetInProgress = () => {
    updateOrderStatus('IN_PROGRESS')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const canMarkShipped = order?.status === 'PENDING' || order?.status === 'IN_PROGRESS'
  const canSetInProgress = order?.status === 'PENDING'

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        {/* Loading container with same dimensions as main content */}
        <div className="flex items-center justify-center border rounded-lg bg-white shadow-sm" style={{ width: '1120px', height: '683px' }}>
          <div className="text-center">
            <div className="text-lg font-medium" style={{ fontSize: '24px' }}>Loading order...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex h-full items-center justify-center">
        {/* Error container with same dimensions as main content */}
        <div className="flex items-center justify-center border rounded-lg bg-white shadow-sm" style={{ width: '1120px', height: '683px' }}>
          <div className="text-center">
            <div className="text-lg font-medium" style={{ fontSize: '24px' }}>Order not found</div>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center">
      {/* Main Content Container - 1120x683px centered - includes everything */}
      <div className="flex flex-col border rounded-lg bg-white shadow-sm" style={{ width: '1120px', height: '683px' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ minHeight: '80px' }}>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <h1 className="font-semibold tracking-wide" style={{ fontSize: '24px' }}>
              Order Details
            </h1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-6 py-3" style={{ minHeight: '60px' }}>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search Order Details"
                className="w-64 pl-9 h-10 px-3 border border-gray-300 rounded-md"
                style={{ fontSize: '16px' }}
                disabled
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Order Information */}
            <div className="space-y-6">
              {/* Order Code */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Order Code</label>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="font-mono font-semibold tracking-wide" style={{ fontSize: '16px' }}>
                    {order.code || '—'}
                  </div>
                  {order.code && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(order.code!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Customer */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer</label>
                <div className="mt-1" style={{ fontSize: '16px' }}>{order.customer_name || '—'}</div>
              </div>

              {/* Channel */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Channel</label>
                <div className="mt-1" style={{ fontSize: '16px' }}>{order.channel}</div>
              </div>

              {/* External ID */}
              {order.external_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">External ID</label>
                  <div className="mt-1" style={{ fontSize: '16px' }}>{order.external_id}</div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge 
                    variant={getStatusBadgeVariant(order.status)}
                    style={order.status === 'SHIPPED' ? {
                      backgroundColor: '#FAF2E3',
                      color: '#C19A4D',
                      borderColor: '#C19A4D'
                    } : {}}
                  >
                    {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                  </Badge>
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <div className="mt-1" style={{ fontSize: '16px' }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Right Column - Order Lines and Shipping */}
            <div className="space-y-6">
              {/* Order Lines */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Items</label>
                <div className="mt-2 space-y-2">
                  {order.order_lines.map((line) => {
                    const productName = line.product 
                      ? (line.product.variant ? `${line.product.name} – ${line.product.variant}` : line.product.name)
                      : 'Unknown Product'
                    return (
                      <div 
                        key={line.id} 
                        className="flex items-center justify-between rounded-lg border p-3 interactive-hover"
                        style={{ height: '64px' }}
                      >
                        <div>
                          <div className="font-medium" style={{ fontSize: '16px' }}>{productName}</div>
                          {line.product?.sku && (
                            <div className="text-muted-foreground" style={{ fontSize: '14px' }}>
                              SKU: {line.product.sku}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary">Qty: {line.qty}</Badge>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Shipping Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Carrier</label>
                  <Input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="e.g., UPS, FedEx, USPS"
                    className="mt-1"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tracking Number</label>
                  <Input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Enter tracking number"
                    className="mt-1"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 pt-4">
                {canMarkShipped && (
                  <Button 
                    onClick={handleMarkShipped} 
                    className="w-full"
                    style={{ backgroundColor: '#444EAA', color: 'white' }}
                  >
                    Mark as Shipped
                  </Button>
                )}
                {canSetInProgress && (
                  <Button 
                    variant="outline" 
                    onClick={handleSetInProgress} 
                    className="w-full"
                  >
                    Set In Progress
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
