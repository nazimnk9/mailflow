import { apiClient } from '@/lib/api-client'

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
  phone_number: string
}

export interface RegisterResponse {
  data: {
    email: string
  }
  success: boolean
  message: string
  errors?: string
}

export interface ResendOtpPayload {
  email: string
}

export interface ResendOtpResponse {
  success: boolean
  message: string
  data?: string
  errors?: string
}

export interface VerifyOtpPayload {
  email: string
  code: string
}

export interface VerifyOtpResponse {
  success: boolean
  message: string
  data?: string
  errors?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  data: {
    access_token: string
    refresh_token?: string
  }
  success: boolean
  message: string
  errors?: string
}

export interface RefreshTokenResponse {
  data: {
    access_token: string
    refresh_token?: string
  } | null
  success: boolean
  message: string
  errors?: string | null
}

export interface LogoutResponse {
  data: null
  success: boolean
  message: string
  errors?: string | null
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone_number?: string | null
  is_verified: boolean
  avatar_url?: string | null
  created_at: string
}

export interface UserProfileResponse {
  data: UserProfile
  success: boolean
  message?: string | null
  errors?: string | null
}

export interface UpdateProfilePayload {
  full_name?: string
  phone_number?: string | null
}

export const authApi = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register(payload: RegisterPayload): Promise<RegisterResponse> {
    return apiClient<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    })
  },

  /**
   * Resend verification OTP to user email
   * POST /api/auth/resend-otp
   */
  resendOtp(payload: ResendOtpPayload): Promise<ResendOtpResponse> {
    return apiClient<ResendOtpResponse>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    })
  },

  /**
   * Verify email OTP
   * POST /api/auth/verify-otp
   */
  verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    return apiClient<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    })
  },

  /**
   * Authenticate user with credentials
   * POST /api/auth/login
   */
  login(payload: LoginPayload): Promise<LoginResponse> {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    })
  },

  /**
   * Refresh access token using HttpOnly refresh_token cookie
   * POST /api/auth/refresh-token
   */
  refreshToken(): Promise<RefreshTokenResponse> {
    return apiClient<RefreshTokenResponse>('/auth/refresh-token', {
      method: 'POST',
      skipAuth: true,
    })
  },

  /**
   * Revoke refresh token and log out
   * POST /api/auth/logout
   */
  logout(): Promise<LogoutResponse> {
    return apiClient<LogoutResponse>('/auth/logout', {
      method: 'POST',
      skipAuth: true,
    })
  },

  /**
   * Fetch current authenticated user's profile
   * GET /api/auth/get-profile
   */
  getProfile(): Promise<UserProfileResponse> {
    return apiClient<UserProfileResponse>('/auth/get-profile', {
      method: 'GET',
    })
  },

  /**
   * Update current authenticated user's profile
   * PATCH /api/auth/update-profile
   */
  updateProfile(payload: UpdateProfilePayload): Promise<UserProfileResponse> {
    return apiClient<UserProfileResponse>('/auth/update-profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Upload user profile avatar (PNG, JPG, GIF or WebP, up to 2 MB)
   * POST /api/auth/upload-avatar
   */
  uploadAvatar(file: File): Promise<UserProfileResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient<UserProfileResponse>('/auth/upload-avatar', {
      method: 'POST',
      body: formData,
    })
  },

  /**
   * Delete current user's profile avatar
   * DELETE /api/auth/delete-avatar
   */
  deleteAvatar(): Promise<UserProfileResponse> {
    return apiClient<UserProfileResponse>('/auth/delete-avatar', {
      method: 'DELETE',
    })
  },
}

