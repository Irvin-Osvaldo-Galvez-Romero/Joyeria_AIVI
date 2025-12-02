import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY
const API_URL = 'https://api-inference.huggingface.co/models'

// Generar descripciones ricas y automáticas
function generarDescripcion(nombre: string, categoria?: string, precioCompra?: number, precioVenta?: number): string {
  const nombreLower = nombre.toLowerCase()
  let descripcion = ''
  
  // Detectar material
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
  if (nombreLower.includes('piedra') || nombreLower.includes('gem')) {
    materiales.push('con piedras preciosas')
  }
  
  // Generar descripción según categoría
  if (categoria?.toLowerCase().includes('anillo')) {
    descripcion = `Hermoso anillo${materiales.length > 0 ? ' de ' + materiales.join(' y ') : ''}, diseño elegante y sofisticado. `
    descripcion += `Ideal para ocasiones especiales o uso diario. `
    descripcion += `Talla estándar, puede ajustarse según necesidad. `
  } else if (categoria?.toLowerCase().includes('collar')) {
    descripcion = `Elegante collar${materiales.length > 0 ? ' de ' + materiales.join(' y ') : ''}, perfecto para complementar cualquier atuendo. `
    descripcion += `Largo ajustable, diseño versátil que se adapta a diferentes estilos. `
    descripcion += `Presentación en estuche original. `
  } else if (categoria?.toLowerCase().includes('arete') || categoria?.toLowerCase().includes('pendiente')) {
    descripcion = `Deslumbrantes aretes${materiales.length > 0 ? ' de ' + materiales.join(' y ') : ''}, diseño llamativo y moderno. `
    descripcion += `Comfortables para uso prolongado, cierre seguro. `
    descripcion += `Ideales para destacar en cualquier ocasión. `
  } else if (categoria?.toLowerCase().includes('pulsera')) {
    descripcion = `Hermosa pulsera${materiales.length > 0 ? ' de ' + materiales.join(' y ') : ''}, diseño único y exclusivo. `
    descripcion += `Ajustable a diferentes tamaños de muñeca. `
    descripcion += `Perfecta para combinar con otras piezas de joyería. `
  } else if (categoria?.toLowerCase().includes('reloj')) {
    descripcion = `Reloj${materiales.length > 0 ? ' de ' + materiales.join(' y ') : ''}, diseño clásico y funcional. `
    descripcion += `Resistente al agua, garantía incluida. `
    descripcion += `Correa ajustable, mecanismo de precisión. `
  } else {
    descripcion = `Pieza de joyería${materiales.length > 0 ? ' en ' + materiales.join(' y ') : ''}, diseño excepcional y calidad premium. `
    descripcion += `Artesanía cuidadosa que garantiza durabilidad y elegancia. `
    descripcion += `Ideal como regalo o adquisición personal. `
  }
  
  // Agregar información adicional
  descripcion += `Mantiene su brillo y belleza con el cuidado adecuado. `
  
  if (precioCompra && precioVenta) {
    const gananciaPorcentaje = ((precioVenta - precioCompra) / precioCompra * 100).toFixed(0)
    descripcion += `Excelente relación calidad-precio. `
  }
  
  return descripcion.trim()
}

export async function POST(request: NextRequest) {
  try {
    const { text, type } = await request.json()

    if (!text && type !== 'text') {
      return NextResponse.json(
        { error: 'Texto requerido' },
        { status: 400 }
      )
    }

    // Extraer información del texto directamente sin usar API externa
    // Esto evita problemas de CORS y es más rápido
    
    // Patrones mejorados para detectar información
    const nombreMatch = text.match(/(?:nombre|producto):?\s*([^\n,]+)/i)
    
    // Detectar precios con más variaciones: "compró en", "se compro en", "compramos", "costó", etc.
    // Buscar patrones como: "se compro en 219", "compró en 219", "compramos 219", "costó 219"
    const precioCompraMatch = text.match(/(?:se\s+compr[óo]\s+en|compr[óo]\s+en|compramos|compré|precio\s*compra|costó|cost[óo]|pagamos|pagamos\s+\$?)\s*\$?(\d+(?:[.,]\d+)?)/i)
    
    // Detectar precio de venta: "vende en", "se vende en", "vendemos", "vender", etc.
    // Buscar patrones como: "se vende en 325", "vende en 325", "vendemos 325", "vender 325"
    const precioVentaMatch = text.match(/(?:se\s+vende\s+en|vende\s+en|vendemos|vendo|precio\s*venta|vender|vend[eo]mos?\s+en)\s*\$?(\d+(?:[.,]\d+)?)/i)
    
    const precioMatch = text.match(/(?:precio):?\s*\$?([\d,]+\.?\d*)/i)
    const categoriaMatch = text.match(/(?:categoría|tipo|clase):?\s*([^\n,]+)/i)
    const proveedorMatch = text.match(/(?:proveedor|vendedor|comprado\s+a|compramos\s+a|de\s+la\s+tienda|tienda)\s*:?\s*([^\n,]+)/i)
    
    // Detectar stock - múltiples patrones para capturar todas las variaciones
    let stockMatch = text.match(/(?:stock|cantidad|unidades|piezas)\s*(?:de|:)?\s*(\d+)/i)
    if (!stockMatch) {
      stockMatch = text.match(/(?:hay|tenemos|disponibles?|existen)\s+(\d+)\s*(?:unidades|piezas|productos?)?/i)
    }
    if (!stockMatch) {
      stockMatch = text.match(/(\d+)\s*(?:unidades|piezas|productos?|en\s+stock)/i)
    }
    if (!stockMatch) {
      stockMatch = text.match(/stock\s*:?\s*(\d+)/i)
    }

    // Extraer nombre - tomar la primera parte antes de la primera coma o descripción de precio
    let nombre = nombreMatch 
      ? nombreMatch[1].trim() 
      : text.split(/[,\n]/)[0].trim()
    
    // Limpiar el nombre si contiene información de precio
    nombre = nombre.replace(/(?:compramos|compré|compró|vendemos|vendo|precio).*$/i, '').trim()

    // Extraer precios - simplificar conversión
    const precioCompra = precioCompraMatch 
      ? parseFloat(precioCompraMatch[1].replace(/,/g, '')) 
      : undefined

    const precioVenta = precioVentaMatch 
      ? parseFloat(precioVentaMatch[1].replace(/,/g, '')) 
      : undefined

    // Inferir categoría del nombre si no se especifica explícitamente
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
      } else if (nombreLower.includes('dije') || nombreLower.includes('charm')) {
        categoria = 'Dijes'
      } else if (nombreLower.includes('piercing')) {
        categoria = 'Piercings'
      } else {
        categoria = 'Joyeria'
      }
    }

    // Extraer stock
    const stock = stockMatch
      ? parseInt(stockMatch[1])
      : undefined

    // Extraer proveedor (limpiar el texto)
    let proveedor = proveedorMatch ? proveedorMatch[1].trim() : undefined
    if (proveedor) {
      // Limpiar proveedor si contiene información de precio
      proveedor = proveedor.replace(/\$\d+.*$/i, '').trim()
      // Remover palabras comunes
      proveedor = proveedor.replace(/^(de|del|la|el|comprado|compramos|a)\s+/i, '').trim()
    }

    // Generar descripción automática rica basada en el tipo de producto
    let descripcion = generarDescripcion(nombre, categoria, precioCompra, precioVenta)

    return NextResponse.json({
      nombre: nombre || 'Producto',
      categoria,
      descripcion,
      precio_compra: precioCompra,
      precio_venta: precioVenta, // Ya no calcular automáticamente si existe precioVentaMatch
      stock,
      proveedor,
    })
  } catch (error: any) {
    console.error('Error en extracción de IA:', error)
    return NextResponse.json(
      { error: 'Error procesando información' },
      { status: 500 }
    )
  }
}
