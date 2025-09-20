"use client"

import { useState, useEffect } from 'react'
import { Search, Truck, Plus, Copy, ExternalLink, Filter, ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { generateOrderCode } from '@/lib/orderUtils'
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

const STATUS_COLORS = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  SHIPPED: 'default'
} as const

const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress', 
  SHIPPED: 'Shipped'
} as const

const getStatusBadgeVariant = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'secondary'
}

export default function FulfillmentPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderWithLines[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load orders with their lines and products
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_lines (
            *,
            product:products (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Load products for the add dialog
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('archived', false)

      if (productsError) throw productsError

      setOrders(ordersData || [])
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const searchOrder = async () => {
    if (!searchQuery.trim()) return

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
        .eq('code', searchQuery.trim().toUpperCase())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Order not found - show create option
          toast.error('Order not found')
        } else {
          throw error
        }
        return
      }

      // Navigate to order detail page
      router.push(`/order/${data.id}`)
    } catch (error) {
      console.error('Error searching order:', error)
      toast.error('Failed to search order')
    }
  }

  const updateOrderStatus = async (orderId: string, status: string, carrier?: string, tracking?: string) => {
    try {
      const updateData: Record<string, unknown> = { status }
      if (carrier !== undefined) updateData.carrier = carrier
      if (tracking !== undefined) updateData.tracking = tracking

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, carrier: carrier || order.carrier, tracking: tracking || order.tracking }
          : order
      ))


      toast.success(`Order marked as ${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const createQuickOrder = async (orderData: {
    customer_name: string
    lines: Array<{ product_id: string; qty: number }>
  }) => {
    try {
      // Create order without code first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customer_name,
          channel: 'MANUAL'
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // Generate and update order code
      const code = generateOrderCode(order.id)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ code })
        .eq('id', order.id)

      if (updateError) throw updateError

      // Create order lines
      const lines = orderData.lines.map(line => ({
        order_id: order.id,
        product_id: line.product_id,
        qty: line.qty
      }))

      const { error: linesError } = await supabase
        .from('order_lines')
        .insert(lines)

      if (linesError) throw linesError

      toast.success(`Order ${code} created successfully`)
      setIsAddDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }


  const formatOrderLines = (lines: OrderLine[]) => {
    return lines.map(line => {
      const productName = line.product 
        ? (line.product.variant ? `${line.product.name} – ${line.product.variant}` : line.product.name)
        : 'Unknown Product'
      return `${productName} (${line.qty})`
    }).join(', ')
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        {/* Loading container with same dimensions as main content */}
        <div className="flex items-center justify-center border rounded-lg bg-white shadow-sm" style={{ width: '1120px', height: '683px' }}>
          <div className="text-center">
            <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium" style={{ fontSize: '24px' }}>Loading orders...</h3>
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
          <div>
            <h1 className="font-semibold tracking-wide" style={{ fontSize: '24px' }}>Fulfillment</h1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-6 py-3" style={{ minHeight: '60px' }}>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search Orders"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
                className="w-64 pl-9"
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#444EAA', color: 'white', marginRight: '12px' }}>
                <Plus style={{ width: '10px', height: '10px' }} />
                Add New
              </Button>
            </DialogTrigger>
            <QuickOrderDialog 
              products={products}
              onSave={createQuickOrder}
              onClose={() => setIsAddDialogOpen(false)}
            />
          </Dialog>
        </div>

        {/* Content - takes remaining space within 683px total height */}
        <div className="flex-1 overflow-auto" style={{ maxHeight: '543px' }}>
        {orders.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No orders yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first order to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-accent/50 table-row-hover">
                    <TableCell 
                      className="font-mono font-medium"
                      onClick={() => router.push(`/order/${order.id}`)}
                    >
                      {order.code || '—'}
                    </TableCell>
                    <TableCell onClick={() => router.push(`/order/${order.id}`)}>
                      {order.customer_name || '—'}
                    </TableCell>
                    <TableCell 
                      onClick={() => router.push(`/order/${order.id}`)}
                      className="max-w-xs truncate"
                    >
                      {formatOrderLines(order.order_lines)}
                    </TableCell>
                    <TableCell onClick={() => router.push(`/order/${order.id}`)}>
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
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/order/${order.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </div>
      </div>

    </div>
  )
}

interface QuickOrderDialogProps {
  products: Product[]
  onSave: (orderData: { customer_name: string; lines: Array<{ product_id: string; qty: number }> }) => void
  onClose: () => void
}

function QuickOrderDialog({ products, onSave, onClose }: QuickOrderDialogProps) {
  const [customerName, setCustomerName] = useState('')
  const [lines, setLines] = useState<Array<{ product_id: string; qty: number }>>([
    { product_id: '', qty: 1 }
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerName.trim()) {
      toast.error('Customer name is required')
      return
    }

    const validLines = lines.filter(line => line.product_id && line.qty > 0)
    if (validLines.length === 0) {
      toast.error('At least one product is required')
      return
    }

    onSave({
      customer_name: customerName.trim(),
      lines: validLines
    })

    // Reset form
    setCustomerName('')
    setLines([{ product_id: '', qty: 1 }])
  }

  const addLine = () => {
    setLines(prev => [...prev, { product_id: '', qty: 1 }])
  }

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: 'product_id' | 'qty', value: string | number) => {
    setLines(prev => prev.map((line, i) => 
      i === index ? { ...line, [field]: value } : line
    ))
  }

  const getProductDisplayName = (product: Product) => {
    return product.variant ? `${product.name} – ${product.variant}` : product.name
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Create Quick Order</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Customer Name *</label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Products</label>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-3 w-3" />
              Add Product
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {lines.map((line, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Select 
                  value={line.product_id} 
                  onValueChange={(value) => updateLine(index, 'product_id', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {getProductDisplayName(product)} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={line.qty}
                  onChange={(e) => updateLine(index, 'qty', parseInt(e.target.value) || 1)}
                  className="w-20"
                  placeholder="Qty"
                />
                {lines.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeLine(index)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Order</Button>
        </div>
      </form>
    </DialogContent>
  )
}

