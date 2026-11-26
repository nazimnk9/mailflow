'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { formatApiErrorMessage } from '@/lib/api-client'
import {
  useDeleteAvatarMutation,
  useProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '@/lib/hooks/use-auth-mutations'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

function getInitials(name?: string | null, email?: string | null): string {
  const cleanName = (name || '').trim()
  if (cleanName) {
    const parts = cleanName.split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase()
    }
    return cleanName.slice(0, 2).toUpperCase()
  }
  const cleanEmail = (email || '').trim()
  return cleanEmail ? cleanEmail.slice(0, 2).toUpperCase() : 'U'
}

export function SettingsPage({
  route,
  selectedTab,
  setSelectedTab,
  onAction,
  saved,
  setSaved,
  showPassword,
  setShowPassword,
}: {
  route: string
  selectedTab: string
  setSelectedTab: (value: string) => void
  onAction: (message: string) => void
  saved: boolean
  setSaved: (value: boolean) => void
  showPassword: boolean
  setShowPassword: (value: boolean) => void
}) {
  const tabs = ['Profile', 'Company', 'Team', 'Security', 'Notifications']
  const routeSub = route.split('/')[1] === 'settings' ? route.split('/')[2] : undefined
  const active = routeSub ? routeSub[0].toUpperCase() + routeSub.slice(1) : selectedTab

  const selectTab = (item: string) => {
    setSelectedTab(item)
    if (item !== 'Profile') window.history.replaceState(null, '', `/app/settings/${item.toLowerCase()}`)
    else window.history.replaceState(null, '', '/app/settings')
  }

  // Live Profile Query & Mutations
  const {
    data: profileRes,
    isLoading: profileLoading,
    isError: profileIsError,
    error: profileError,
    refetch: refetchProfile,
  } = useProfileQuery()

  const updateProfileMutation = useUpdateProfileMutation()
  const uploadAvatarMutation = useUploadAvatarMutation()
  const deleteAvatarMutation = useDeleteAvatarMutation()

  const profile = profileRes?.data

  // Form state synced with live profile
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [removeAvatarModalOpen, setRemoveAvatarModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!removeAvatarModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleteAvatarMutation.isPending) {
        setRemoveAvatarModalOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [removeAvatarModalOpen, deleteAvatarMutation.isPending])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhoneNumber(profile.phone_number || '')
    }
  }, [profile])

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setFormError(null)
    setSaved(false)

    if (active !== 'Profile') {
      setSaved(true)
      onAction(`${active} settings saved.`)
      return
    }

    if (!fullName.trim()) {
      setFormError('Full name is required.')
      return
    }

    try {
      const res = await updateProfileMutation.mutateAsync({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || null,
      })
      setSaved(true)
      onAction(res?.message || 'Profile updated.')
    } catch (err: any) {
      setFormError(formatApiErrorMessage(err, 'Failed to update profile.'))
    }
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setAvatarError(null)

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Upload a PNG, JPG, GIF or WebP image.')
      return
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Avatar image must be 2 MB or smaller.')
      return
    }

    try {
      const res = await uploadAvatarMutation.mutateAsync(file)
      onAction(res?.message || 'Profile picture updated.')
    } catch (err: any) {
      setAvatarError(formatApiErrorMessage(err, 'Failed to upload profile picture.'))
    }
  }

  const handleDeleteAvatar = async () => {
    setAvatarError(null)
    try {
      const res = await deleteAvatarMutation.mutateAsync()
      setRemoveAvatarModalOpen(false)
      onAction(res?.message || 'Profile picture removed.')
    } catch (err: any) {
      setAvatarError(formatApiErrorMessage(err, 'Failed to remove profile picture.'))
    }
  }

  const initials = getInitials(profile?.full_name || fullName, profile?.email)
  const isBusy =
    updateProfileMutation.isPending ||
    uploadAvatarMutation.isPending ||
    deleteAvatarMutation.isPending

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            WORKSPACE <span>/</span> SETTINGS
          </div>
          <h1>Account settings</h1>
          <p>Manage your personal profile, avatar, workspace details, and preferences.</p>
        </div>
        <button
          type="button"
          className="button button-primary"
          disabled={isBusy || (active === 'Profile' && profileLoading)}
          onClick={() => handleSaveProfile()}
        >
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Check size={14} />
              <span>Save changes</span>
            </>
          )}
        </button>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {tabs.map((item) => (
            <button
              type="button"
              className={active.toLowerCase() === item.toLowerCase() ? 'active' : ''}
              key={item}
              onClick={() => {
                setFormError(null)
                setAvatarError(null)
                setSaved(false)
                selectTab(item)
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        <section className="settings-form-card">
          <div className="settings-form-heading">
            <div>
              <h2>{active} settings</h2>
              <p>
                {active === 'Profile'
                  ? 'Update your display name, phone number, and profile picture.'
                  : 'Only administrators can update workspace-wide settings.'}
              </p>
            </div>
            {saved && (
              <span className="settings-saved">
                <Check size={13} /> Saved
              </span>
            )}
          </div>

          {active === 'Profile' ? (
            profileLoading ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                <span>Loading your profile…</span>
              </div>
            ) : profileIsError && !profile ? (
              <div className="transactional-error-banner" role="alert">
                <AlertCircle size={18} />
                <div className="error-body">
                  <strong>Could not load profile:</strong>
                  <p>{formatApiErrorMessage(profileError, 'Failed to fetch user profile.')}</p>
                </div>
                <button
                  type="button"
                  className="button button-secondary button-sm"
                  onClick={() => refetchProfile()}
                >
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Avatar Management Card */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        backgroundColor: '#1374f8',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: 700,
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.1)',
                      }}
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name || 'Profile avatar'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    <div>
                      <strong style={{ display: 'block', fontSize: '14.5px', color: '#0f172a' }}>
                        Profile picture
                      </strong>
                      <small style={{ display: 'block', fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                        PNG, JPG, GIF or WebP, up to 2 MB.
                      </small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleAvatarFileChange}
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={uploadAvatarMutation.isPending || deleteAvatarMutation.isPending}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadAvatarMutation.isPending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Uploading…</span>
                        </>
                      ) : (
                        <>
                          {profile?.avatar_url ? <Camera size={14} /> : <Upload size={14} />}
                          <span>{profile?.avatar_url ? 'Change photo' : 'Upload photo'}</span>
                        </>
                      )}
                    </button>

                    {profile?.avatar_url && (
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ color: '#dc2626', borderColor: '#fecaca' }}
                        disabled={uploadAvatarMutation.isPending || deleteAvatarMutation.isPending}
                        onClick={() => {
                          setAvatarError(null)
                          setRemoveAvatarModalOpen(true)
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {avatarError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontSize: '13px',
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{avatarError}</span>
                  </div>
                )}

                {formError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontSize: '13px',
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Profile Fields Form */}
                <form onSubmit={handleSaveProfile} className="settings-fields">
                  <label>
                    Full name *
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value)
                        setSaved(false)
                      }}
                      placeholder="Jane A. Doe"
                      disabled={updateProfileMutation.isPending}
                      required
                    />
                  </label>

                  <label>
                    Phone number
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value)
                        setSaved(false)
                      }}
                      placeholder="+8801712345678"
                      disabled={updateProfileMutation.isPending}
                    />
                  </label>

                  <label>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Email address</span>
                      {profile?.is_verified && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: '#15803d',
                          }}
                        >
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      )}
                    </span>
                    <input type="email" value={profile?.email || ''} readOnly disabled />
                  </label>

                  {profile?.created_at && (
                    <label>
                      Member since
                      <input
                        type="text"
                        value={new Date(profile.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        readOnly
                        disabled
                      />
                    </label>
                  )}
                </form>
              </div>
            )
          ) : active === 'Team' ? (
            <div className="team-list">
              <div className="team-member-row">
                <span className="user-avatar" style={{ overflow: 'hidden' }}>
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    initials
                  )}
                </span>
                <span>
                  <b>{profile?.full_name || 'Workspace Owner'}</b>
                  <small>{profile?.email || '—'}</small>
                </span>
                <StatusBadge status="Owner" />
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onAction('Team invitation form opened.')}
              >
                Invite team member <Plus size={14} />
              </button>
            </div>
          ) : active === 'Security' ? (
            <div className="settings-fields">
              <label>
                Current password
                <span className="settings-password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value="••••••••••••"
                    readOnly
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </span>
              </label>
              <div className="security-setting">
                <span>
                  <b>Two-factor authentication</b>
                  <small>Add another layer of protection to your account.</small>
                </span>
                <button
                  type="button"
                  className="toggle-switch"
                  aria-label="Toggle two-factor authentication"
                  onClick={(event) => {
                    event.currentTarget.classList.toggle('toggle-on')
                    onAction('Two-factor setting updated.')
                  }}
                >
                  <i />
                </button>
              </div>
              <div className="security-setting">
                <span>
                  <b>Active sessions</b>
                  <small>Current authenticated session on this browser.</small>
                </span>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => onAction('Session is protected with HttpOnly refresh tokens.')}
                >
                  Review sessions <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ) : active === 'Notifications' ? (
            <div className="settings-fields">
              {[
                ['Campaign reports', 'Weekly summaries for your campaigns'],
                ['Delivery alerts', 'Important bounce or reputation changes'],
                ['Workspace updates', 'Product changes and new features'],
              ].map(([title, note]) => (
                <div className="security-setting" key={title}>
                  <span>
                    <b>{title}</b>
                    <small>{note}</small>
                  </span>
                  <button
                    type="button"
                    className="toggle-switch toggle-on"
                    aria-label={`Toggle ${title}`}
                    onClick={(event) => {
                      event.currentTarget.classList.toggle('toggle-on')
                      onAction(`${title} preference updated.`)
                    }}
                  >
                    <i />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="settings-fields">
              <label>
                Workspace name
                <input defaultValue="MetroVPS" />
              </label>
              <label>
                Timezone
                <select defaultValue="America/Los_Angeles">
                  <option value="America/Los_Angeles">Pacific Time (US &amp; Canada)</option>
                  <option value="America/New_York">Eastern Time (US &amp; Canada)</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Dhaka">Dhaka (Asia/Dhaka)</option>
                </select>
              </label>
            </div>
          )}
        </section>
      </div>

      {/* Remove Avatar Confirmation Modal */}
      {removeAvatarModalOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteAvatarMutation.isPending) {
              setRemoveAvatarModalOpen(false)
            }
          }}
        >
          <section
            className="action-dialog action-dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-avatar-title"
            style={{ width: 'min(420px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={deleteAvatarMutation.isPending}
              onClick={() => setRemoveAvatarModalOpen(false)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <Trash2 size={19} />
            </div>
            <div className="eyebrow" style={{ color: '#dc2626' }}>
              REMOVE AVATAR
            </div>
            <h2 id="remove-avatar-title">Remove profile picture</h2>
            <p>
              Are you sure you want to remove your profile picture? Your workspace avatar will
              revert to your initials.
            </p>

            {avatarError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  marginTop: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontSize: '13px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{avatarError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '9px', marginTop: '18px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                disabled={deleteAvatarMutation.isPending}
                onClick={() => setRemoveAvatarModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  borderColor: '#dc2626',
                  color: '#fff',
                }}
                disabled={deleteAvatarMutation.isPending}
                onClick={handleDeleteAvatar}
              >
                {deleteAvatarMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Removing…</span>
                  </>
                ) : (
                  <span>Remove</span>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
