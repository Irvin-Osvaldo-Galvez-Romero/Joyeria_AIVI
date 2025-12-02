import { NextResponse } from 'next/server'

/**
 * Endpoint de health check para verificar que la API está disponible
 * Útil para la app móvil para verificar conectividad
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'AIVI Silver House API',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Service unavailable',
      },
      { status: 503 }
    )
  }
}

