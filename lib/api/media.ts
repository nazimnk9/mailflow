import { apiClient } from '@/lib/api-client'

export interface MediaUploadData {
  id: string
  kind: string
  key: string
  url: string
  filename: string
  content_type: string
  size: number
  width?: number
  height?: number
  created_at: string
}

export interface MediaUploadResponse {
  success: boolean
  message?: string | null
  data?: MediaUploadData | null
  errors?: unknown
}

/**
 * Uploads an image file to the backend via /api/proxy/media/upload-image.
 * If backend fails or is offline, falls back seamlessly to a Base64 Data URL.
 */
export async function uploadMediaImage(file: File, width?: number, height?: number): Promise<string> {
  // Validate file size (max 5 MB)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error('Image size must be less than 5 MB.')
  }

  // Attempt backend upload first
  try {
    const formData = new FormData()
    formData.append('file', file)
    if (width) formData.append('width', String(width))
    if (height) formData.append('height', String(height))

    const res = await apiClient<MediaUploadResponse>('/media/upload-image', {
      method: 'POST',
      body: formData,
    })
    if (res?.data?.url) {
      return res.data.url
    }
  } catch (error) {
    console.warn('[MEDIA UPLOAD] Backend upload not available, using local data URL fallback:', error)
  }

  // Fallback to Base64 Data URL for instant offline & demo previews
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to encode image to data URL.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed reading selected file.'))
    reader.readAsDataURL(file)
  })
}
