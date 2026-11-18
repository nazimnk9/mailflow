'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { authToken } from '@/lib/auth-token'
import {
  useLoginMutation,
  useRegisterMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
} from '@/lib/hooks/use-auth-mutations'
import { formatApiErrorMessage } from '@/lib/api-client'

const authSchema = z.object({
  name: z.string().optional(),
  email: z.union([z.string().email('Enter a valid email address.'), z.literal('')]).optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  code: z.string().optional(),
})
type AuthValues = z.infer<typeof authSchema>

const descriptions: Record<string, { eyebrow: string; title: string; note: string }> = {
  login: { eyebrow: 'WELCOME BACK', title: 'Your next send starts here.', note: 'Sign in to your workspace and pick up where you left off.' },
  signup: { eyebrow: 'START SOMETHING GOOD', title: 'A better email day starts now.', note: 'Create a workspace to bring marketing and product email together.' },
  'forgot-password': { eyebrow: 'ACCOUNT RECOVERY', title: 'Let’s get you back in.', note: 'Enter your email and we’ll show a confirmation for the reset flow.' },
  'reset-password': { eyebrow: 'SECURITY', title: 'Choose a new password.', note: 'Create a strong password for your MetroMail workspace.' },
  'verify-email': { eyebrow: 'VERIFY YOUR EMAIL', title: 'Check your inbox for OTP.', note: 'Enter the verification code sent to your email address.' },
  'two-factor': { eyebrow: 'SECURITY CHECK', title: 'Enter your verification code.', note: 'Use the six-digit code from your authenticator app.' },
  invite: { eyebrow: 'TEAM INVITATION', title: 'You’ve been invited.', note: 'Accept this invitation to join the MetroVPS workspace.' },
}

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email' | 'two-factor' | 'invite'

const authValidators = {
  login: z.object({
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(6, 'Password is required.'),
  }),
  signup: z.object({
    name: z.string().trim().min(2, 'Enter your full name.'),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(8, 'Use at least 8 characters.'),
    phone: z.string().trim().min(6, 'Enter a valid phone number.'),
  }),
  'forgot-password': z.object({ email: z.string().email('Enter a valid email address.') }),
  'reset-password': z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(8, 'Use at least 8 characters.') }),
  'verify-email': z.object({ code: z.string().min(1, 'Enter the verification OTP code.') }),
  'two-factor': z.object({ code: z.string().regex(/^[0-9]{6}$/, 'Enter the six-digit code.') }),
  invite: z.object({ name: z.string().trim().min(2, 'Enter your name.'), email: z.string().email('Enter a valid email address.'), password: z.string().min(8, 'Use at least 8 characters.') }),
}

export function AuthScreen({ page = 'login' }: { page?: string }) {
  const router = useRouter()
  const mode: AuthMode = page in descriptions ? (page as AuthMode) : 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [targetEmail, setTargetEmail] = useState('')
  const [resendTimer, setResendTimer] = useState(2.5)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', code: '' },
  })

  // TanStack Query Mutations
  const registerMutation = useRegisterMutation()
  const resendOtpMutation = useResendOtpMutation()
  const verifyOtpMutation = useVerifyOtpMutation()
  const loginMutation = useLoginMutation()

  const isPending =
    registerMutation.isPending ||
    resendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    loginMutation.isPending

  const details = descriptions[mode]
  const strength = password.length < 8 ? 1 : password.length < 12 ? 2 : 3

  // Read URL query params on client load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const emailParam = searchParams.get('email')
      const verifiedParam = searchParams.get('verified')

      // Clean URL if accidental password or GET query params were in the URL
      if (searchParams.has('password')) {
        window.history.replaceState({}, '', window.location.pathname)
      }

      if (emailParam) {
        setTargetEmail(emailParam)
        setValue('email', emailParam)
        authToken.saveUserEmail(emailParam)
      } else {
        const saved = authToken.getUserEmail()
        if (saved) {
          setTargetEmail(saved)
          if (mode === 'login' || mode === 'verify-email') {
            setValue('email', saved)
          }
        }
      }

      if (verifiedParam === 'true' && mode === 'login') {
        setBanner({
          type: 'success',
          message: 'Email verified successfully! Please sign in with your credentials.',
        })
      }
    }
  }, [mode, setValue])

  // 2.5-second OTP arrival countdown timer for verify-email screen
  useEffect(() => {
    if (mode !== 'verify-email') return

    setResendTimer(2.5)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval)
          return 0
        }
        return Math.max(0, +(prev - 0.1).toFixed(1))
      })
    }, 100)

    return () => clearInterval(interval)
  }, [mode])

  // Handle Resend OTP action
  const handleResendOtp = async () => {
    const emailToResend = targetEmail || authToken.getUserEmail() || ''
    if (!emailToResend) {
      setBanner({
        type: 'error',
        message: 'No email address found. Please enter your email above.',
      })
      return
    }

    setBanner(null)
    try {
      const response = await resendOtpMutation.mutateAsync({ email: emailToResend })
      setResendTimer(2.5)
      setBanner({
        type: 'success',
        message: response.message || 'A fresh OTP code has been sent to your email.',
      })
    } catch (err: any) {
      setBanner({
        type: 'error',
        message: formatApiErrorMessage(err, 'Failed to resend OTP code. Please try again.'),
      })
    }
  }

  // Handle Form Submission
  const onSubmit = async (values: AuthValues) => {
    setBanner(null)

    // Capture values from DOM directly in case Chrome autofill didn't trigger React events
    let emailVal = values.email?.trim() || ''
    let passwordVal = values.password || ''
    let nameVal = values.name?.trim() || ''
    let phoneVal = values.phone?.trim() || ''
    let codeVal = values.code?.trim() || ''

    if (typeof document !== 'undefined') {
      const formEl = document.querySelector('form.auth-form')
      if (formEl) {
        const emailEl = formEl.querySelector('input[type="email"], input[name="email"]') as HTMLInputElement | null
        const passwordEl = formEl.querySelector('input[name="password"]') as HTMLInputElement | null
        const nameEl = formEl.querySelector('input[name="name"]') as HTMLInputElement | null
        const phoneEl = formEl.querySelector('input[name="phone"]') as HTMLInputElement | null
        const codeEl = formEl.querySelector('input[name="code"]') as HTMLInputElement | null

        if (!emailVal && emailEl?.value) emailVal = emailEl.value.trim()
        if (!passwordVal && passwordEl?.value) passwordVal = passwordEl.value
        if (!nameVal && nameEl?.value) nameVal = nameEl.value.trim()
        if (!phoneVal && phoneEl?.value) phoneVal = phoneEl.value.trim()
        if (!codeVal && codeEl?.value) codeVal = codeEl.value.trim()
      }
    }

    const payloadValues: AuthValues = {
      name: nameVal,
      email: emailVal,
      password: passwordVal,
      phone: phoneVal,
      code: codeVal,
    }

    // Validate fields with Zod
    const result = authValidators[mode].safeParse(payloadValues)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0]
        if (typeof field === 'string') {
          setError(field as keyof AuthValues, { message: issue.message })
        }
      })
      return
    }

    // 1. REGISTER FLOW
    if (mode === 'signup') {
      try {
        const response = await registerMutation.mutateAsync({
          full_name: payloadValues.name || '',
          email: payloadValues.email || '',
          password: payloadValues.password || '',
          phone_number: payloadValues.phone || '',
        })

        const emailSent = response.data?.email || payloadValues.email || ''
        setTargetEmail(emailSent)
        authToken.saveUserEmail(emailSent)
        router.push(`/verify-email?email=${encodeURIComponent(emailSent)}`)
      } catch (err: any) {
        setBanner({
          type: 'error',
          message: formatApiErrorMessage(
            err,
            'Registration failed. Please check your details and try again.'
          ),
        })
      }
      return
    }

    // 2. VERIFY OTP FLOW
    if (mode === 'verify-email') {
      const emailToVerify = targetEmail || payloadValues.email || authToken.getUserEmail() || ''
      if (!emailToVerify) {
        setBanner({
          type: 'error',
          message: 'Email address is missing. Please re-enter your email.',
        })
        return
      }

      try {
        const response = await verifyOtpMutation.mutateAsync({
          email: emailToVerify,
          code: payloadValues.code || '',
        })

        router.push(`/login?verified=true&email=${encodeURIComponent(emailToVerify)}`)
      } catch (err: any) {
        setBanner({
          type: 'error',
          message: formatApiErrorMessage(
            err,
            'Invalid verification code. Please check your inbox and try again.'
          ),
        })
      }
      return
    }

    // 3. LOGIN FLOW
    if (mode === 'login') {
      try {
        const response = await loginMutation.mutateAsync({
          email: payloadValues.email || '',
          password: payloadValues.password || '',
        })

        setBanner({
          type: 'success',
          message: response.message || 'Authentication successful! Redirecting to workspace…',
        })
        window.location.href = '/app/overview'
      } catch (err: any) {
        setBanner({
          type: 'error',
          message: formatApiErrorMessage(
            err,
            'Invalid email or password. Please try again.'
          ),
        })
      }
      return
    }

    // Fallback for other mock modes (forgot-password, reset-password, invite, two-factor)
    await new Promise((resolve) => window.setTimeout(resolve, 400))
    setBanner({
      type: 'success',
      message: 'Request processed successfully.',
    })
  }

  return (
    <main className="auth-layout">
      <section className="auth-brand-panel">
        <BrandMark productLabel="Email Cloud" />
        <div className="auth-brand-content">
          <div className="auth-orb auth-orb-one" />
          <div className="auth-orb auth-orb-two" />
          <span className="auth-brand-icon">
            <Sparkles size={17} />
          </span>
          <div className="eyebrow">ONE PLATFORM. EVERY SEND.</div>
          <h1>Make every message count.</h1>
          <p>
            Bring customer relationships and reliable email infrastructure into one thoughtful workspace.
          </p>
          <div className="auth-quote">
            <span>“</span>
            <p>Everything we need to grow customer conversations now lives in one place.</p>
            <small>Sample customer story · Product team</small>
          </div>
        </div>
        <div className="auth-panel-foot">
          <span>Secure workspace access</span>
          <span>
            <ShieldCheck size={14} /> MetroVPS
          </span>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <Link className="auth-back" href="/">
            <ArrowLeft size={14} /> Back to MetroMail
          </Link>
          <div className="auth-form-heading">
            <div className="eyebrow">{details.eyebrow}</div>
            <h2>{details.title}</h2>
            <p>{details.note}</p>
          </div>

          {/* Status Banner Alert */}
          {banner && (
            <div
              className={`auth-banner-alert ${
                banner.type === 'error' ? 'auth-banner-error' : 'auth-banner-success'
              }`}
              role="alert"
            >
              {banner.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{banner.message}</span>
            </div>
          )}

          <form
            className="auth-form"
            method="POST"
            action="#"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(onSubmit)(e)
            }}
            noValidate
          >
            {/* Name Field */}
            {(mode === 'signup' || mode === 'invite') && (
              <div className="form-field">
                <label htmlFor="auth-name-input">Your full name</label>
                <input
                  id="auth-name-input"
                  autoComplete="name"
                  maxLength={100}
                  placeholder="Alex Morgan"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'auth-name-error' : undefined}
                  {...register('name')}
                />
                {errors.name?.message && (
                  <small className="field-error" id="auth-name-error" role="alert">
                    {errors.name.message}
                  </small>
                )}
              </div>
            )}

            {/* Target Email display for verify-email screen */}
            {mode === 'verify-email' && (
              <div className="verify-target-card">
                <div className="verify-target-email">
                  <Mail size={15} className="text-blue-500" />
                  <span>
                    Sending OTP to: <strong>{targetEmail || 'your email'}</strong>
                  </span>
                </div>
                <div className="resend-otp-container">
                  {resendTimer > 0 ? (
                    <div className="resend-timer-badge">
                      <Clock size={13} className="text-amber-500" />
                      <span>OTP arriving in {resendTimer.toFixed(1)}s</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="resend-otp-button"
                      onClick={handleResendOtp}
                      disabled={resendOtpMutation.isPending}
                    >
                      <RotateCcw
                        size={13}
                        className={resendOtpMutation.isPending ? 'animate-spin' : ''}
                      />
                      <span>{resendOtpMutation.isPending ? 'Sending…' : 'Resend OTP'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Email Address Field (for login, signup, forgot-password, reset-password, invite) */}
            {mode !== 'verify-email' && mode !== 'two-factor' && (
              <div className="form-field">
                <label htmlFor="auth-email-input">Email address</label>
                <div className="input-with-icon">
                  <Mail size={16} />
                  <input
                    id="auth-email-input"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'auth-email-error' : undefined}
                    {...register('email')}
                  />
                </div>
                {errors.email?.message && (
                  <small className="field-error" id="auth-email-error" role="alert">
                    {errors.email.message}
                  </small>
                )}
              </div>
            )}

            {/* Code Field (verify-email & two-factor) */}
            {(mode === 'verify-email' || mode === 'two-factor') && (
              <div className="form-field">
                <label htmlFor="auth-code-input">
                  {mode === 'two-factor' ? '6-digit code' : 'Verification OTP code'}
                </label>
                <input
                  id="auth-code-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  placeholder="Enter OTP"
                  className="code-input"
                  aria-invalid={Boolean(errors.code)}
                  aria-describedby={errors.code ? 'auth-code-error' : undefined}
                  {...register('code')}
                />
                {errors.code?.message && (
                  <small className="field-error" id="auth-code-error" role="alert">
                    {errors.code.message}
                  </small>
                )}
              </div>
            )}

            {/* Password Field */}
            {(mode === 'login' || mode === 'signup' || mode === 'reset-password' || mode === 'invite') && (
              <div className="form-field">
                <label htmlFor="auth-password-input">Password</label>
                <div className="input-with-icon">
                  <LockKeyhole size={16} />
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'auth-password-error' : undefined}
                    {...register('password', {
                      onChange: (event) => setPassword(event.target.value),
                    })}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowPassword((prev) => !prev)
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password?.message && (
                  <small className="field-error" id="auth-password-error" role="alert">
                    {errors.password.message}
                  </small>
                )}
                {mode === 'signup' && password.length > 0 && (
                  <div className="password-strength">
                    <span className={`strength-${strength}`} />
                    <span className={`strength-${strength}`} />
                    <span className={`strength-${strength}`} />
                    <small>
                      {['', 'Add more characters', 'Good password', 'Strong password'][strength]}
                    </small>
                  </div>
                )}
              </div>
            )}

            {/* Phone Number Field (Below Password for Signup) */}
            {mode === 'signup' && (
              <div className="form-field">
                <label htmlFor="auth-phone-input">Phone number</label>
                <div className="input-with-icon">
                  <Phone size={16} />
                  <input
                    id="auth-phone-input"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'auth-phone-error' : undefined}
                    {...register('phone')}
                  />
                </div>
                {errors.phone?.message && (
                  <small className="field-error" id="auth-phone-error" role="alert">
                    {errors.phone.message}
                  </small>
                )}
              </div>
            )}

            {mode === 'login' && (
              <div className="auth-options">
                <label className="remember-option">
                  <input type="checkbox" defaultChecked /> <span>Remember me</span>
                </label>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            )}

            {mode === 'invite' && (
              <div className="invite-note">
                <ShieldCheck size={17} /> Invitation to join <b>MetroVPS</b> as a <b>Member</b>
              </div>
            )}

            {/* Submit button with loading state */}
            <button
              type="submit"
              className="button button-primary auth-submit"
              disabled={isPending || isSubmitting}
            >
              {isPending ? (
                <span className="auth-submit-loading">
                  <Loader2 size={16} className="animate-spin" />
                  <span>
                    {mode === 'login'
                      ? 'Signing in…'
                      : mode === 'signup'
                      ? 'Creating account…'
                      : mode === 'verify-email'
                      ? 'Verifying OTP…'
                      : 'Please wait…'}
                  </span>
                </span>
              ) : (
                <>
                  {mode === 'login'
                    ? 'Sign in'
                    : mode === 'signup'
                    ? 'Create account'
                    : mode === 'forgot-password'
                    ? 'Send reset instructions'
                    : mode === 'reset-password'
                    ? 'Save new password'
                    : mode === 'two-factor'
                    ? 'Verify and continue'
                    : mode === 'invite'
                    ? 'Accept invitation'
                    : 'Verify email'}{' '}
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {(mode === 'login' || mode === 'signup') && (
              <>
                <div className="auth-divider">
                  <span /> or <span />
                </div>
                <button
                  type="button"
                  className="social-button"
                  onClick={() => router.push('/app/overview')}
                >
                  <span className="social-glyph">G</span> Continue with Google <small>Demo</small>
                </button>
              </>
            )}
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <>
                New to MetroMail?{' '}
                <Link href="/signup">
                  Create an account <ArrowRight size={13} />
                </Link>
              </>
            ) : mode === 'signup' ? (
              <>
                Already have an account? <Link href="/login">Sign in</Link>
              </>
            ) : mode === 'verify-email' ? (
              <>
                Wrong email address? <Link href="/signup">Register again</Link> ·{' '}
                <Link href="/login">Sign in</Link>
              </>
            ) : (
              <>
                Need help? <Link href="/contact-us">Contact support</Link>
              </>
            )}
          </div>

          <p className="auth-legal">
            By continuing, you agree to our <Link href="/terms-conditions">Terms</Link> and{' '}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  )
}
