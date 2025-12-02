import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY

/**
 * API Route para transcribir audio a texto
 * Usa OpenAI Whisper API (preferido) o Hugging Face como alternativa
 */
export async function POST(request: NextRequest) {
  try {
    const { audio } = await request.json()

    if (!audio) {
      return NextResponse.json(
        { error: 'No se proporcionó audio' },
        { status: 400 }
      )
    }

    // Intentar con Hugging Face primero (ya está configurado y es gratuito)
    if (HUGGING_FACE_API_KEY) {
      try {
        const transcription = await transcribeWithHuggingFace(audio, HUGGING_FACE_API_KEY)
        if (transcription) {
          return NextResponse.json({ text: transcription })
        }
      } catch (hfError: any) {
        console.log('Hugging Face falló, intentando OpenAI:', hfError.message)
        // Si Hugging Face falla, intentar OpenAI si está disponible
        if (OPENAI_API_KEY) {
          try {
            const transcription = await transcribeWithOpenAI(audio, OPENAI_API_KEY)
            if (transcription) {
              return NextResponse.json({ text: transcription })
            }
          } catch (openAIError: any) {
            console.log('OpenAI también falló:', openAIError.message)
          }
        }
      }
    }

    // Intentar con OpenAI Whisper si Hugging Face no está disponible
    if (OPENAI_API_KEY && !HUGGING_FACE_API_KEY) {
      try {
        const transcription = await transcribeWithOpenAI(audio, OPENAI_API_KEY)
        if (transcription) {
          return NextResponse.json({ text: transcription })
        }
      } catch (openAIError: any) {
        console.log('OpenAI Whisper falló:', openAIError.message)
      }
    }

    // Si ninguna API está configurada, retornar error informativo
    if (!OPENAI_API_KEY && !HUGGING_FACE_API_KEY) {
      return NextResponse.json(
        { 
          error: 'API no configurada',
          message: 'Para usar transcripción de voz, configura OPENAI_API_KEY o HUGGING_FACE_API_KEY en las variables de entorno.',
          hint: 'OpenAI Whisper API es más preciso. Obtén una API key en https://platform.openai.com/api-keys'
        },
        { status: 501 }
      )
    }

    return NextResponse.json(
      { error: 'No se pudo transcribir el audio' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Error en transcripción:', error)
    return NextResponse.json(
      { error: 'Error procesando audio: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * Transcribe audio usando OpenAI Whisper API
 */
async function transcribeWithOpenAI(audioBase64: string, apiKey: string): Promise<string | null> {
  try {
    // Convertir base64 a buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    
    // OpenAI requiere FormData con multipart/form-data
    const FormData = require('form-data')
    const formData = new FormData()
    
    // Agregar el archivo de audio
    formData.append('file', audioBuffer, {
      filename: 'audio.m4a',
      contentType: 'audio/m4a',
    })
    formData.append('model', 'whisper-1')
    formData.append('language', 'es') // Español

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000, // 60 segundos
      }
    )

    return response.data?.text?.trim() || null
  } catch (error: any) {
    console.error('Error en OpenAI Whisper:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw error
  }
}

/**
 * Transcribe audio usando Hugging Face (alternativa gratuita)
 */
async function transcribeWithHuggingFace(audioBase64: string, apiKey: string): Promise<string | null> {
  try {
    // Convertir base64 a buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    
    // Usar modelo Whisper más pequeño y rápido de Hugging Face
    const model = 'openai/whisper-base' // Cambiar a 'openai/whisper-large-v3' para mejor precisión
    
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      audioBuffer,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        params: {
          language: 'spanish',
          return_timestamps: false,
        },
        timeout: 45000, // 45 segundos (el modelo puede tardar en cargar)
        maxRedirects: 5,
      }
    )

    // Hugging Face puede retornar diferentes formatos
    if (typeof response.data === 'string') {
      return response.data.trim()
    }
    
    // Formato estándar: { text: "transcripción" }
    if (response.data?.text) {
      return response.data.text.trim()
    }

    // Formato alternativo: { transcription: "texto" }
    if (response.data?.transcription) {
      return response.data.transcription.trim()
    }

    // Si el modelo está cargando
    if (response.data?.error?.includes('loading') || response.data?.estimated_time) {
      const waitTime = response.data.estimated_time || 10
      console.log(`Modelo cargando, esperando ${waitTime} segundos...`)
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
      // Reintentar una vez
      return transcribeWithHuggingFace(audioBase64, apiKey)
    }

    // Error explícito
    if (response.data?.error) {
      throw new Error(response.data.error)
    }

    console.log('Formato de respuesta inesperado:', response.data)
    return null
  } catch (error: any) {
    // Si el modelo está cargando en el error
    if (error.response?.data?.error?.includes('loading') || error.response?.data?.estimated_time) {
      const waitTime = error.response?.data?.estimated_time || 10
      console.log(`Modelo cargando (error), esperando ${waitTime} segundos...`)
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
      // Reintentar una vez
      return transcribeWithHuggingFace(audioBase64, apiKey)
    }
    
    console.error('Error en Hugging Face:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw error
  }
}

