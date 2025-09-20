"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Package, Minus, Filter, ArrowUpDown } from 'lucide-react'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'

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

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'materials' | 'blanks'>('blanks')
  const [currentTab, setCurrentTab] = useState<'inventory' | 'order-queue'>('inventory')

  // Load materials on mount
  useEffect(() => {
    loadMaterials()
  }, [])

  // Filter materials when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMaterials(materials)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = materials.filter(material => 
        material.name.toLowerCase().includes(query) ||
        material.sku.toLowerCase().includes(query) ||
        material.variant?.toLowerCase().includes(query)
      )
      setFilteredMaterials(filtered)
    }
  }, [searchQuery, materials])

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
      toast.error('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (materialId: string, newQuantity: number) => {
    // Optimistic update
    const updatedMaterials = materials.map(material => 
      material.id === materialId 
        ? { ...material, on_hand: newQuantity }
        : material
    )
    setMaterials(updatedMaterials)

    try {
      const { error } = await supabase
        .from('materials')
        .update({ on_hand: newQuantity })
        .eq('id', materialId)

      if (error) throw error
      toast.success('Quantity updated')
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
      // Revert optimistic update
      loadMaterials()
    }
  }

  const addMaterial = async (materialData: Omit<Material, 'id' | 'created_at' | 'archived'>) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single()

      if (error) throw error
      
      setMaterials(prev => [data, ...prev])
      setIsAddDialogOpen(false)
      toast.success('Material added successfully')
    } catch (error) {
      console.error('Error adding material:', error)
      toast.error('Failed to add material')
    }
  }

  const displayName = (material: Material) => {
    return material.variant ? `${material.name} – ${material.variant}` : material.name
  }

  const isLowStock = (material: Material) => {
    return material.on_hand < material.reorder_point
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        {/* Loading container with same dimensions as main content */}
        <div className="flex items-center justify-center border rounded-lg bg-white shadow-sm" style={{ width: '1120px', height: '683px' }}>
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium" style={{ fontSize: '24px' }}>Loading materials...</h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="flex h-full items-center justify-center">
      {/* Main Content Container - 1120x683px centered - includes everything */}
      <div className="flex flex-col border rounded-lg bg-white shadow-sm" style={{ width: '1120px', height: '683px' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ minHeight: '80px' }}>
          <div>
            <h1 className="font-semibold tracking-wide" style={{ fontSize: '24px' }}>
              {currentView === 'materials' ? (
                'Materials'
              ) : (
                <>
                  <button 
                    onClick={() => setCurrentView('materials')}
                    className="hover:underline cursor-pointer"
                  >
                    Materials
                  </button>
                  {' / '}
                  <span style={{ color: '#858585' }}>Blanks</span>
                </>
              )}
            </h1>
          </div>
          {currentView === 'blanks' && (
            <div className="flex space-x-1">
              <button 
                onClick={() => setCurrentTab('inventory')}
                className="px-3 py-1 rounded text-sm"
                style={{ 
                  backgroundColor: currentTab === 'inventory' ? '#f5f5f5' : 'transparent', 
                  color: currentTab === 'inventory' ? '#262626' : '#858585' 
                }}
              >
                Inventory
              </button>
              <button 
                onClick={() => setCurrentTab('order-queue')}
                className="px-3 py-1 rounded text-sm"
                style={{ 
                  backgroundColor: currentTab === 'order-queue' ? '#f5f5f5' : 'transparent', 
                  color: currentTab === 'order-queue' ? '#262626' : '#858585' 
                }}
              >
                Order Queue
              </button>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-6 py-3" style={{ minHeight: '60px' }}>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={currentTab === 'order-queue' ? "Search Orders" : "Search Materials"}
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
                {currentTab === 'order-queue' ? 'Add Order' : 'Add New'}
              </Button>
            </DialogTrigger>
            <AddMaterialDialog onAdd={addMaterial} />
          </Dialog>
        </div>

        {/* Content - takes remaining space within 683px total height */}
        <div className="flex-1 overflow-auto" style={{ maxHeight: '543px' }}>
          {currentView === 'materials' ? (
            /* Materials Overview Page */
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrentView('blanks')}
                  className="p-6 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium text-lg">Blanks</h3>
                      <p className="text-gray-600 text-sm">T-shirts, hoodies, and other blank apparel</p>
                    </div>
                  </div>
                </button>
                
                <button
                  className="p-6 border rounded-lg hover:bg-gray-50 text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="flex items-center space-x-3">
                    <Package className="h-8 w-8 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-lg text-gray-400">Other Materials</h3>
                      <p className="text-gray-400 text-sm">Coming soon...</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : currentTab === 'order-queue' ? (
            /* Order Queue */
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-medium" style={{ fontSize: '16px' }}>
                  Order Queue
                </h3>
                <p className="mt-2 text-muted-foreground" style={{ fontSize: '16px' }}>
                  Track orders and pending material requests
                </p>
              </div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-medium" style={{ fontSize: '16px' }}>
                  {searchQuery ? 'No materials found' : 'No materials yet'}
                </h3>
                <p className="mt-2 text-muted-foreground" style={{ fontSize: '16px' }}>
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Get started by adding your first material'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-6">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between rounded-lg bg-card hover:bg-accent/50 interactive-hover"
                  style={{ 
                    width: '100%', 
                    height: '64px',
                    padding: '8px 12px'
                  }}
                >
                  {/* Left side - Picture and Text */}
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
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    
                    {/* Text content */}
                    <div>
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <span className="font-medium" style={{ fontSize: '16px' }}>
                          {displayName(material)}
                        </span>
                      </div>
                      <p className="text-muted-foreground" style={{ fontSize: '16px' }}>
                        SKU: {material.sku}
                      </p>
                    </div>
                  </div>

                  {/* Right side - Quantity controls with outer border */}
                  <div 
                    className="flex items-center" 
                    style={{ 
                      gap: '8px',
                      border: '2px solid #e5e5e5',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      backgroundColor: '#f9f9f9',
                      height: '48px'
                    }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="icon-hover"
                      onClick={() => updateQuantity(material.id, Math.max(0, material.on_hand - 1))}
                      disabled={material.on_hand <= 0}
                      style={{ 
                        width: '36px', 
                        height: '36px',
                        border: 'none',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    {/* Quantity display - straight borders */}
                    <div 
                      className="relative"
                      style={{ 
                        width: '196px',
                        height: '48px',
                        border: isLowStock(material) ? '1px solid #C19A4D' : '1px solid #e5e5e5',
                        backgroundColor: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '4px'
                      }}
                    >
                      {/* Top section - Quantity number (100 fill x 32 fill) */}
                      <div 
                        className="font-medium flex items-center justify-center"
                        style={{ 
                          width: '100%',
                          height: '32px',
                          fontSize: '24px',
                          color: '#262626',
                          backgroundColor: isLowStock(material) ? '#FAF2E3' : 'white',
                          borderBottom: isLowStock(material) ? '1px solid #C19A4D' : '1px solid #e5e5e5',
                          borderTopLeftRadius: '3px',
                          borderTopRightRadius: '3px'
                        }}
                      >
                        {material.on_hand}
                      </div>
                      
                      {/* Bottom section - PCS text (16 fill tall) */}
                      <div 
                        className="flex items-center justify-center"
                        style={{ 
                          width: '100%',
                          height: '16px',
                          fontSize: '12px',
                          color: isLowStock(material) ? 'white' : '#858585',
                          backgroundColor: isLowStock(material) ? '#C19A4D' : 'white',
                          borderBottomLeftRadius: '3px',
                          borderBottomRightRadius: '3px'
                        }}
                      >
                        {material.reorder_point} PCS
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="icon-hover"
                      onClick={() => updateQuantity(material.id, material.on_hand + 1)}
                      style={{ 
                        width: '36px', 
                        height: '36px',
                        border: 'none',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}

interface AddMaterialDialogProps {
  onAdd: (material: Omit<Material, 'id' | 'created_at' | 'archived'>) => void
}

function AddMaterialDialog({ onAdd }: AddMaterialDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    variant: '',
    sku: '',
    on_hand: 0,
    reorder_point: 0,
    cost: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error('Name and SKU are required')
      return
    }

    onAdd({
      name: formData.name.trim(),
      variant: formData.variant.trim() || null,
      sku: formData.sku.trim(),
      on_hand: formData.on_hand,
      reorder_point: formData.reorder_point,
      cost: formData.cost ? parseFloat(formData.cost) : null
    })

    // Reset form
    setFormData({
      name: '',
      variant: '',
      sku: '',
      on_hand: 0,
      reorder_point: 0,
      cost: ''
    })
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Material</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Gildan T-Shirt"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Variant</label>
          <Input
            value={formData.variant}
            onChange={(e) => setFormData(prev => ({ ...prev, variant: e.target.value }))}
            placeholder="e.g., Red / M"
          />
        </div>
        <div>
          <label className="text-sm font-medium">SKU *</label>
          <Input
            value={formData.sku}
            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
            placeholder="e.g., GT-RED-M"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">On Hand</label>
            <Input
              type="number"
              min="0"
              value={formData.on_hand}
              onChange={(e) => setFormData(prev => ({ ...prev, on_hand: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Reorder Point</label>
            <Input
              type="number"
              min="0"
              value={formData.reorder_point}
              onChange={(e) => setFormData(prev => ({ ...prev, reorder_point: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Cost</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
            placeholder="0.00"
          />
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit">Add Material</Button>
        </div>
      </form>
    </DialogContent>
  )
}
