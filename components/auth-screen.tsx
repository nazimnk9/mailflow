'use client'

import { useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
})
type AuthValues = z.infer<typeof authSchema>
const descriptions: Record<string, { eyebrow: string; title: string; note: string }> = {
  login: { eyebrow: 'WELCOME BACK', title: 'Your next send starts here.', note: 'Sign in to your workspace and pick up where you left off.' },
  signup: { eyebrow: 'START SOMETHING GOOD', title: 'A better email day starts now.', note: 'Create a workspace to bring marketing and product email together.' },
  'forgot-password': { eyebrow: 'ACCOUNT RECOVERY', title: 'Let’s get you back in.', note: 'Enter your email and we’ll show a confirmation for the reset flow.' },
  'reset-password': { eyebrow: 'SECURITY', title: 'Choose a new password.', note: 'Create a strong password for your MetroMail workspace.' },
  'verify-email': { eyebrow: 'ONE LAST STEP', title: 'Check your inbox.', note: 'We’ve prepared a sample verification state for your new workspace.' },
  'two-factor': { eyebrow: 'SECURITY CHECK', title: 'Enter your verification code.', note: 'Use the six-digit code from your authenticator app.' },
  invite: { eyebrow: 'TEAM INVITATION', title: 'You’ve been invited.', note: 'Accept this sample invitation to join the MetroVPS workspace.' },
}

export function AuthScreen({ page = 'login' }: { page?: string }) {
  const mode = descriptions[page] ? page : 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [password, setPassword] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthValues>({ resolver: zodResolver(authSchema), defaultValues: { name: '', email: '', password: '' } })
  const details = descriptions[mode]
  const strength = password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const onSubmit = async (_values: AuthValues) => {
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    setSubmitted(true)
  }

  return <main className="auth-layout"><section className="auth-brand-panel"><BrandMark productLabel="Email Cloud" /><div className="auth-brand-content"><div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" /><span className="auth-brand-icon"><Sparkles size={17} /></span><div className="eyebrow">ONE PLATFORM. EVERY SEND.</div><h1>Make every message count.</h1><p>Bring customer relationships and reliable email infrastructure into one thoughtful workspace.</p><div className="auth-quote"><span>“</span><p>Everything we need to grow customer conversations now lives in one place.</p><small>Sample customer story · Product team</small></div></div><div className="auth-panel-foot"><span>Secure workspace access</span><span><ShieldCheck size={14} /> MetroVPS</span></div></section><section className="auth-form-panel"><div className="auth-form-wrap"><Link className="auth-back" href="/"><ArrowLeft size={14} /> Back to MetroMail</Link><div className="auth-form-heading"><div className="eyebrow">{details.eyebrow}</div><h2>{details.title}</h2><p>{details.note}</p></div>{submitted ? <div className="auth-success" role="status"><span><ShieldCheck size={22} /></span><h3>{mode === 'forgot-password' ? 'Check your email' : mode === 'signup' ? 'Workspace created' : 'You’re all set'}</h3><p>This is a frontend-only demo. Your form was validated and the next step is ready for backend integration.</p><Link className="button button-primary" href={mode === 'signup' ? '/verify-email' : '/app/overview'}>{mode === 'signup' ? 'Continue to verification' : 'Open demo workspace'} <ArrowRight size={15} /></Link></div> : <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {(mode === 'signup' || mode === 'invite') && <label className="form-field"><span>Your name</span><input placeholder="Alex Morgan" {...register('name')} /><small className="field-error">{errors.name?.message}</small></label>}
        {mode !== 'verify-email' && mode !== 'two-factor' && mode !== 'invite' && <label className="form-field"><span>Email address</span><span className="input-with-icon"><Mail size={16} /><input type="email" placeholder="you@company.com" autoComplete="email" {...register('email')} /></span><small className="field-error">{errors.email?.message}</small></label>}
        {(mode === 'verify-email' || mode === 'two-factor') && <label className="form-field"><span>{mode === 'two-factor' ? '6-digit code' : 'Verification code'}</span><input inputMode="numeric" maxLength={6} placeholder="000000" className="code-input" /><small className="field-helper">For this frontend demo, use any six digits.</small></label>}
        {(mode === 'login' || mode === 'signup' || mode === 'reset-password') && <label className="form-field"><span>Password</span><span className="input-with-icon"><LockKeyhole size={16} /><input type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} {...register('password', { onChange: (event) => setPassword(event.target.value) })} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span><small className="field-error">{errors.password?.message}</small>{mode === 'signup' && password.length > 0 && <div className="password-strength"><span className={`strength-${strength}`} /><span className={`strength-${strength}`} /><span className={`strength-${strength}`} /><small>{['', 'Add more characters', 'Good password', 'Strong password'][strength]}</small></div>}</label>}
        {mode === 'login' && <div className="auth-options"><label className="remember-option"><input type="checkbox" defaultChecked /> <span>Remember me</span></label><Link href="/forgot-password">Forgot password?</Link></div>}
        {mode === 'invite' && <div className="invite-note"><ShieldCheck size={17} /> Invitation to join <b>MetroVPS</b> as a <b>Member</b></div>}
        <button type="submit" className="button button-primary auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'forgot-password' ? 'Send reset instructions' : mode === 'reset-password' ? 'Save new password' : mode === 'two-factor' ? 'Verify and continue' : mode === 'invite' ? 'Accept invitation' : 'Verify email'} <ArrowRight size={15} /></button>
        <div className="auth-divider"><span /> or <span /></div><button type="button" className="social-button" onClick={() => setSubmitted(true)}><span className="social-glyph">G</span> Continue with Google <small>Demo</small></button>
      </form>}
      <div className="auth-switch">{mode === 'login' ? <>New to MetroMail? <Link href="/signup">Create an account <ArrowRight size={13} /></Link></> : mode === 'signup' ? <>Already have an account? <Link href="/login">Sign in</Link></> : <>Need help? <Link href="/contact-us">Contact support</Link></>}</div><p className="auth-legal">By continuing, you agree to our <Link href="/terms-conditions">Terms</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</p></div></section></main>
}
