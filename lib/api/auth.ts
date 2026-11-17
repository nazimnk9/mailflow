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
  }
  success: boolean
  message: string
  errors?: string
}

export const authApi = {
  /**
   * Register a new user
   * POST /auth/register
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
   * POST /auth/resend-otp
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
   * POST /auth/verify-otp
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
   * POST /auth/login
   */
  login(payload: LoginPayload): Promise<LoginResponse> {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    })
  },
}

