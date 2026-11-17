'use client'

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import {
  authApi,
  type RegisterPayload,
  type RegisterResponse,
  type ResendOtpPayload,
  type ResendOtpResponse,
  type VerifyOtpPayload,
  type VerifyOtpResponse,
  type LoginPayload,
  type LoginResponse,
} from '@/lib/api/auth'
import { ApiError } from '@/lib/api-client'
import { authToken } from '@/lib/auth-token'

/**
 * Hook to register a new user
 */
export function useRegisterMutation(
  options?: UseMutationOptions<RegisterResponse, ApiError, RegisterPayload>
) {
  return useMutation({
    ...options,
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data, variables, context, mutation) => {
      if (data?.data?.email || variables.email) {
        authToken.saveUserEmail(data?.data?.email || variables.email)
      }
      options?.onSuccess?.(data, variables, context, mutation)
    },
  })
}

/**
 * Hook to resend OTP code to user's email
 */
export function useResendOtpMutation(
  options?: UseMutationOptions<ResendOtpResponse, ApiError, ResendOtpPayload>
) {
  return useMutation<ResendOtpResponse, ApiError, ResendOtpPayload>({
    mutationFn: (payload: ResendOtpPayload) => authApi.resendOtp(payload),
    ...options,
  })
}

/**
 * Hook to verify OTP code
 */
export function useVerifyOtpMutation(
  options?: UseMutationOptions<VerifyOtpResponse, ApiError, VerifyOtpPayload>
) {
  return useMutation<VerifyOtpResponse, ApiError, VerifyOtpPayload>({
    mutationFn: (payload: VerifyOtpPayload) => authApi.verifyOtp(payload),
    ...options,
  })
}

/**
 * Hook to log in user and store access token securely
 */
export function useLoginMutation(
  options?: UseMutationOptions<LoginResponse, ApiError, LoginPayload>
) {
  return useMutation({
    ...options,
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data, variables, context, mutation) => {
      if (data?.data?.access_token) {
        authToken.set(data.data.access_token)
        authToken.saveUserEmail(variables.email)
      }
      options?.onSuccess?.(data, variables, context, mutation)
    },
  })
}
