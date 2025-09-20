/**
 * Generate short order code in format YY-BASE36
 * @param orderId UUID of the order
 * @returns Short order code like "25-9P7C"
 */
export function generateOrderCode(orderId: string): string {
  // Get last 2 digits of current year
  const year = new Date().getFullYear() % 100
  const yearStr = year.toString().padStart(2, '0')
  
  // Convert UUID to a number for base36 conversion
  // Use the last 8 characters of the UUID (without hyphens) as hex
  const uuidHex = orderId.replace(/-/g, '').slice(-8)
  const number = parseInt(uuidHex, 16)
  
  // Convert to base36 and uppercase
  const base36 = number.toString(36).toUpperCase()
  
  return `${yearStr}-${base36}`
}

/**
 * Calculate sellable quantity for a product based on its BOM and current materials
 * @param bom Array of {materialId, qty} 
 * @param materialsMap Map of materialId to material data
 * @returns Number of sellable units
 */
export function calculateSellable(
  bom: Array<{ materialId: string; qty: number }>, 
  materialsMap: Map<string, { on_hand: number }>
): number {
  if (!bom || bom.length === 0) {
    return 0
  }

  return bom.reduce((minSellable, item) => {
    const material = materialsMap.get(item.materialId)
    if (!material) return 0
    
    const possibleQty = Math.floor(material.on_hand / item.qty)
    return Math.min(minSellable, possibleQty)
  }, Infinity)
}
