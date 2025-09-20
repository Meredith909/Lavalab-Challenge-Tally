"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, ShoppingBag, Edit, Trash2, Filter, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { calculateSellable } from '@/lib/orderUtils'
import { toast } from 'sonner'

interface Material {
  id: string
  name: string
  variant: string | null
  sku: string
  on_hand: number
  reorder_point: number
  cost: number | null
  archived: boolean
  created_at: string
}

interface Product {
  id: string
  name: string
  variant: string | null
  sku: string
  price: number | null
  bom: Array<{ materialId: string; qty: number }> | null
  archived: boolean
  created_at: string
}

interface BOMItem {
  materialId: string
  qty: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsMap, setMaterialsMap] = useState<Map<string, Material>>(new Map())
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Filter products when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.variant?.toLowerCase().includes(query)
      )
      setFilteredProducts(filtered)
    }
  }, [searchQuery, products])

  const loadData = async () => {
    try {
      // Load materials and products in parallel
      const [materialsResult, productsResult] = await Promise.all([
        supabase.from('materials').select('*').eq('archived', false),
        supabase.from('products').select('*').eq('archived', false).order('created_at', { ascending: false })
      ])

      if (materialsResult.error) throw materialsResult.error
      if (productsResult.error) throw productsResult.error

      const materialsData = materialsResult.data || []
      const productsData = productsResult.data || []

      setMaterials(materialsData)
      setProducts(productsData)

      // Create materials map for quick lookup
      const map = new Map<string, Material>()
      materialsData.forEach(material => {
        map.set(material.id, material)
      })
      setMaterialsMap(map)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'archived'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single()

      if (error) throw error
      
      setProducts(prev => [data, ...prev])
      setIsAddDialogOpen(false)
      toast.success('Product added successfully')
    } catch (error: unknown) {
      console.error('Error adding product:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        toast.error('SKU already exists')
      } else {
        toast.error('Failed to add product')
      }
    }
  }

  const updateProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'archived'>) => {
    if (!editingProduct) return

    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
        .select()
        .single()

      if (error) throw error
      
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? data : p))
      setEditingProduct(null)
      toast.success('Product updated successfully')
    } catch (error: unknown) {
      console.error('Error updating product:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        toast.error('SKU already exists')
      } else {
        toast.error('Failed to update product')
      }
    }
  }

  const displayName = (product: Product) => {
    return product.variant ? `${product.name} – ${product.variant}` : product.name
  }

  const getSellableQuantity = (product: Product) => {
    if (!product.bom || product.bom.length === 0) {
      return '—'
    }
    return calculateSellable(product.bom, materialsMap).toString()
  }


  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        {/* Loading container with same dimensions as main content */}
        <div className="flex items-center justify-center border rounded-lg bg-white shadow-sm" style={{ width: '1120px', height: '683px' }}>
          <div className="text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium" style={{ fontSize: '24px' }}>Loading products...</h3>
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
            <h1 className="font-semibold tracking-wide" style={{ fontSize: '24px' }}>Products</h1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-6 py-3" style={{ minHeight: '60px' }}>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <ProductDialog 
              product={null}
              materials={materials}
              onSave={addProduct}
              onClose={() => setIsAddDialogOpen(false)}
            />
          </Dialog>
        </div>

        {/* Content - takes remaining space within 683px total height */}
        <div className="flex-1 overflow-auto" style={{ maxHeight: '543px' }}>
          {filteredProducts.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-medium" style={{ fontSize: '16px' }}>
                  {searchQuery ? 'No products found' : 'No products yet'}
                </h3>
                <p className="mt-2 text-muted-foreground" style={{ fontSize: '16px' }}>
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Get started by adding your first product'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg bg-card hover:bg-accent/50 interactive-hover"
                  style={{ 
                    width: '100%', 
                    height: '64px',
                    padding: '8px 12px'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '12px' }}>
                    {/* Picture - 48x48px */}
                    <div 
                      className="flex items-center justify-center rounded-lg"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    
                    {/* Text content */}
                    <div>
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <span className="font-medium" style={{ fontSize: '16px' }}>
                          {displayName(product)}
                        </span>
                      </div>
                      <p className="text-muted-foreground" style={{ fontSize: '16px' }}>
                        SKU: {product.sku}
                      </p>
                    </div>
                  </div>

                  {/* Right side - Product info and actions */}
                  <div className="flex items-center" style={{ gap: '12px' }}>
                    <div className="text-center">
                      <div className="font-medium" style={{ fontSize: '16px' }}>
                        Sellable: {getSellableQuantity(product)}
                      </div>
                      <div className="text-muted-foreground" style={{ fontSize: '14px' }}>
                        {product.price ? `$${product.price.toFixed(2)}` : 'No price'}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                      style={{ width: '36px', height: '36px' }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <ProductDialog 
            product={editingProduct}
            materials={materials}
            onSave={updateProduct}
            onClose={() => setEditingProduct(null)}
          />
        </Dialog>
      )}
    </div>
  )
}

interface ProductDialogProps {
  product: Product | null
  materials: Material[]
  onSave: (product: Omit<Product, 'id' | 'created_at' | 'archived'>) => void
  onClose: () => void
}

function ProductDialog({ product, materials, onSave, onClose }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    variant: product?.variant || '',
    sku: product?.sku || '',
    price: product?.price?.toString() || ''
  })
  
  const [bom, setBom] = useState<BOMItem[]>(
    product?.bom?.length ? product.bom : [{ materialId: '', qty: 1 }]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error('Name and SKU are required')
      return
    }

    // Filter out empty BOM items
    const validBom = bom.filter(item => item.materialId && item.qty > 0)

    onSave({
      name: formData.name.trim(),
      variant: formData.variant.trim() || null,
      sku: formData.sku.trim(),
      price: formData.price ? parseFloat(formData.price) : null,
      bom: validBom.length > 0 ? validBom : null
    })

    onClose()
  }

  const addBomItem = () => {
    setBom(prev => [...prev, { materialId: '', qty: 1 }])
  }

  const removeBomItem = (index: number) => {
    setBom(prev => prev.filter((_, i) => i !== index))
  }

  const updateBomItem = (index: number, field: keyof BOMItem, value: string | number) => {
    setBom(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const getMaterialDisplayName = (material: Material) => {
    return material.variant ? `${material.name} – ${material.variant}` : material.name
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Custom T-Shirt"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Variant</label>
            <Input
              value={formData.variant}
              onChange={(e) => setFormData(prev => ({ ...prev, variant: e.target.value }))}
              placeholder="e.g., Medium"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">SKU *</label>
            <Input
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              placeholder="e.g., CRT-M"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Price</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Bill of Materials</label>
            <Button type="button" variant="outline" size="sm" onClick={addBomItem}>
              <Plus className="h-3 w-3" />
              Add Material
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {bom.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Select 
                  value={item.materialId} 
                  onValueChange={(value) => updateBomItem(index, 'materialId', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select material..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {getMaterialDisplayName(material)} ({material.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateBomItem(index, 'qty', parseInt(e.target.value) || 1)}
                  className="w-20"
                  placeholder="Qty"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeBomItem(index)}
                  disabled={bom.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {product ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
