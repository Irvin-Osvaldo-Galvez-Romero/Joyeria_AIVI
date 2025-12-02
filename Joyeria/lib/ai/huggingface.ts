interface ProductInfo {
  nombre: string
  categoria?: string
  descripcion?: string
  precio_compra?: number
  precio_venta?: number
  precio_sugerido?: number
}

/**
 * Extrae información de un producto usando procesamiento de texto local
 * Evita problemas de CORS usando una API route de Next.js
 */
export async function extractProductInfo(
  input: string | File,
  type: 'text' | 'image' = 'text'
): Promise<ProductInfo | null> {
  try {
    if (type === 'text') {
      return await extractFromText(input as string)
    } else {
      // Para imágenes, por ahora solo retornamos información básica
      return {
        nombre: 'Producto desde imagen',
        descripcion: 'Imagen cargada',
      }
    }
  } catch (error) {
    console.error('Error en extracción de IA:', error)
    return null
  }
}

async function extractFromText(text: string): Promise<ProductInfo | null> {
  try {
    // Llamar a nuestra API route que procesa el texto
    const response = await fetch('/api/ai/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, type: 'text' }),
    })

    if (!response.ok) {
      throw new Error('Error en la API')
    }

    const data = await response.json()
    return {
      nombre: data.nombre,
      categoria: data.categoria,
      descripcion: data.descripcion,
      precio_compra: data.precio_compra,
      precio_venta: data.precio_venta,
      precio_sugerido: data.precio_venta || data.precio_compra,
    }
  } catch (error) {
    console.error('Error extrayendo de texto:', error)
    // Fallback: extracción básica local
    return extractFromTextLocal(text)
  }
}

function extractFromTextLocal(text: string): ProductInfo | null {
  try {
    const nombreMatch = text.match(/(?:nombre|producto):?\s*([^\n,]+)/i)
    
    // Patrones mejorados
    const precioCompraMatch = text.match(/(?:se\s+compr[óo]\s+en|compr[óo]\s+en|compramos|compré|precio\s*compra|costó|cost[óo]|pagamos|pagamos\s+\$?)\s*\$?(\d+(?:[.,]\d+)?)/i)
    const precioVentaMatch = text.match(/(?:se\s+vende\s+en|vende\s+en|vendemos|vendo|precio\s*venta|vender|vend[eo]mos?\s+en)\s*\$?(\d+(?:[.,]\d+)?)/i)
    const categoriaMatch = text.match(/(?:categoría|tipo|clase):?\s*([^\n,]+)/i)

    let nombre = nombreMatch 
      ? nombreMatch[1].trim() 
      : text.split(/[,\n]/)[0].trim() || 'Producto'
    
    nombre = nombre.replace(/(?:compramos|compré|compró|vendemos|vendo|precio).*$/i, '').trim()

    const precioCompra = precioCompraMatch 
      ? parseFloat(precioCompraMatch[1]?.replace(/,/g, '')) 
      : undefined

    const precioVenta = precioVentaMatch 
      ? parseFloat(precioVentaMatch[1]?.replace(/,/g, '')) 
      : undefined

    // Inferir categoría del nombre si no se especifica
    let categoria = categoriaMatch ? categoriaMatch[1].trim() : undefined
    
    if (!categoria) {
      const nombreLower = nombre.toLowerCase()
      if (nombreLower.includes('anillo') || nombreLower.includes('ring')) {
        categoria = 'Anillos'
      } else if (nombreLower.includes('collar') || nombreLower.includes('necklace')) {
        categoria = 'Collares'
      } else if (nombreLower.includes('arete') || nombreLower.includes('pendiente') || nombreLower.includes('earring')) {
        categoria = 'Aretes'
      } else if (nombreLower.includes('pulsera') || nombreLower.includes('brazalete') || nombreLower.includes('bracelet')) {
        categoria = 'Pulseras'
      } else if (nombreLower.includes('cadena') || nombreLower.includes('chain')) {
        categoria = 'Cadenas'
      } else if (nombreLower.includes('reloj') || nombreLower.includes('watch')) {
        categoria = 'Relojes'
      } else {
        categoria = 'Joyeria'
      }
    }

    // Generar descripción automática rica
    const descripcion = generarDescripcionLocal(nombre, categoria, precioCompra, precioVenta)

    return {
      nombre,
      categoria,
      descripcion,
      precio_compra: precioCompra,
      precio_venta: precioVenta,
      precio_sugerido: precioVenta || precioCompra,
    }
  } catch (error) {
    return null
  }
}

function generarDescripcionLocal(nombre: string, categoria?: string, precioCompra?: number, precioVenta?: number): string {
  const nombreLower = nombre.toLowerCase()
  let descripcion = ''
  
  const materiales = []
  if (nombreLower.includes('oro') || nombreLower.includes('gold')) {
    materiales.push('oro')
    const quilates = nombreLower.match(/(\d+)k|(\d+)\s*quilates?/i)
    if (quilates) {
      materiales.push(`${quilates[1] || quilates[2]} quilates`)
    }
  }
  if (nombreLower.includes('plata') || nombreLower.includes('silver')) {
    materiales.push('plata')
    const ley = nombreLower.match(/(\d{3})/i)
    if (ley && (ley[1] === '925' || ley[1] === '950' || ley[1] === '999')) {
      materiales.push(`${ley[1]} de ley`)
    }
  }
  if (nombreLower.includes('diamante') || nombreLower.includes('diamond')) {
    materiales.push('con diamantes')
  }
  
  if (categoria?.toLowerCase().includes('anillo')) {
    descripcion = `Hermoso anillo${materiales.length > 0 ? ' de ' + materiales.join(' y ') : ''}, diseño elegante y sofisticado. Ideal para ocasiones especiales o uso diario. Talla estándar, puede ajustarse según necesidad. Mantiene su brillo y belleza con el cuidado adecuado.`
  } else if (categoria?.toLowerCase().includes('collar')) {
    descripcion = `Elegante collar${materiales.length > 0 ? ' de ' + materiales.join(' y ') : ''}, perfecto para complementar cualquier atuendo. Largo ajustable, diseño versátil. Presentación en estuche original.`
  } else if (categoria?.toLowerCase().includes('arete') || categoria?.toLowerCase().includes('pendiente')) {
    descripcion = `Deslumbrantes aretes${materiales.length > 0 ? ' de ' + materiales.join(' y ') : ''}, diseño llamativo y moderno. Comfortables para uso prolongado, cierre seguro. Ideales para destacar en cualquier ocasión.`
  } else {
    descripcion = `Pieza de joyería${materiales.length > 0 ? ' en ' + materiales.join(' y ') : ''}, diseño excepcional y calidad premium. Artesanía cuidadosa que garantiza durabilidad y elegancia. Ideal como regalo o adquisición personal.`
  }
  
  return descripcion.trim()
}


/**
 * Sugiere precios basado en información del producto
 */
export async function suggestPrice(
  nombre: string,
  categoria?: string
): Promise<number | null> {
  // Implementación básica - puedes mejorarla con más datos históricos
  // Por ahora retorna null, pero puedes integrar con modelos de predicción
  return null
}
