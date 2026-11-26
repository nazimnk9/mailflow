'use client'

import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
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
  type LogoutResponse,
  type UserProfileResponse,
  type UpdateProfilePayload,
} from '@/lib/api/auth'
import { ApiError } from '@/lib/api-client'
import { authToken } from '@/lib/auth-token'

export const USER_PROFILE_QUERY_KEY = ['user-profile']

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

/**
 * Hook to log out user, revoke refresh token on backend, and clear all caches
 */
export function useLogoutMutation(
  options?: UseMutationOptions<LogoutResponse, ApiError, void>
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: () => authApi.logout(),
    onSettled: (data, error, variables, context, mutation) => {
      authToken.clearClientState()
      authToken.clearUserEmail()
      queryClient.clear()
      options?.onSettled?.(data, error, variables, context, mutation)
    },
  })
}

/**
 * Hook to fetch current authenticated user's profile
 * GET /api/auth/get-profile
 */
export function useProfileQuery() {
  return useQuery<UserProfileResponse, ApiError>({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: () => authApi.getProfile(),
    staleTime: 60 * 1000,
    retry: 1,
  })
}

/**
 * Hook to update current user's profile
 * PATCH /api/auth/update-profile
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation<UserProfileResponse, ApiError, UpdateProfilePayload>({
    mutationFn: (payload: UpdateProfilePayload) => authApi.updateProfile(payload),
    onSuccess: (res) => {
      if (res?.data) {
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, res)
      } else {
        queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY })
      }
    },
  })
}

/**
 * Hook to upload user profile avatar
 * POST /api/auth/upload-avatar
 */
export function useUploadAvatarMutation() {
  const queryClient = useQueryClient()

  return useMutation<UserProfileResponse, ApiError, File>({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (res) => {
      if (res?.data) {
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, res)
      } else {
        queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY })
      }
    },
  })
}

/**
 * Hook to delete user profile avatar
 * DELETE /api/auth/delete-avatar
 */
export function useDeleteAvatarMutation() {
  const queryClient = useQueryClient()

  return useMutation<UserProfileResponse, ApiError, void>({
    mutationFn: () => authApi.deleteAvatar(),
    onSuccess: (res) => {
      if (res?.data) {
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, res)
      } else {
        queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY })
      }
    },
  })
}
