<script>
  import { onMount, untrack } from 'svelte'
  import { page, router } from '@inertiajs/svelte'
  import { EncryptionService } from '~/stores/encryption.ts'
  import { initTheme } from '~/stores/theme.svelte.ts'
  import { initSplash } from '~/stores/splash.svelte.ts'
  import { fly, fade, slide } from 'svelte/transition'
  import Sidebar from '~/components/Sidebar.svelte'
  import SplashScreen from '~/components/SplashScreen.svelte'
  import { getCsrfToken } from '~/utils/getCrsfToken'
  import TableView from '~/pages/generic/TableView.svelte'
  import ChartView from '~/pages/generic/ChartView.svelte'
  import SettingsView from '~/pages/generic/SettingsView.svelte'
  import Toast from '~/components/Toast.svelte'
  import ConfirmDialog from '~/components/ConfirmDialog.svelte'
  import { realtime } from '~/stores/realtime.svelte'
  import { Confirm } from '~/utils/confirm.svelte'
  import { toast } from '~/utils/toast.svelte'

  let isProfileOpen = $state(false)
  let show2FASetup = $state(false)
  let qrData = $state({ qrCode: '', secretKey: '' })
  let secretKeyVerified = $state(null)
  let verificationCode = $state('')
  let isSubmitting = $state(false)

  let mfaMethods = $derived($page.props.mfaMethods || [])
  let currentUser = $derived($page.props.user)

  let activeMfaType = $derived(currentUser?.mfa_type || 'none')
  let isMfaEnabled = $state($page.props.user?.mfa_enabled)
  let pendingMfaType = $state(null)
  let isProcessing = $state(false)

  let showSetupFor = $state(null)
  let { children } = $props()
  let isMobileOpen = $state(false)
  let isDesktopCollapsed = $state(false)
  let isOrchestrating = $state(true)

  async function handleMasterToggle(e) {
    const input = e.currentTarget
    const targetChecked = input.checked
    if (!targetChecked) {
      const confirmDisable = await Confirm.show({
        title: 'Matikan MFA?',
        message:
          'PERINGATAN: Mematikan MFA akan menghapus konfigurasi saat data disimpan. Lanjutkan?',
        confirmText: 'Ya, Hapus',
        type: 'destructive',
      })

      if (!confirmDisable) {
        input.checked = true
        return
      }

      isMfaEnabled = false
      activeMfaType = 'none'
      pendingMfaType = null
    } else {
      isMfaEnabled = true
    }
  }

  async function handleMethodToggle(method, e) {
    const isChecked = e.currentTarget.checked
    const input = e.currentTarget

    if (isProcessing) return
    if (!isChecked) {
      if (activeMfaType === method.type) {
        const confirmDisable = await Confirm.show({
          title: `Nonaktifkan ${method.label} !!!`,
          message: `Apakah Anda yakin ingin menonaktifkan ${method.label}? Konfigurasi ini akan dihapus saat Anda menekan tombol Simpan.`,
          confirmText: 'Ya, Nonaktifkan',
          type: 'destructive',
        })

        if (confirmDisable) {
          activeMfaType = 'none'
          pendingMfaType = null
          input.checked = false
        } else {
          input.checked = true
          return
        }
      } else {
        pendingMfaType = null
      }
      return
    }

    if (isChecked) {
      if (activeMfaType !== 'none' && activeMfaType !== method.type) {
        const confirmSwitch = await Confirm.show({
          title: `Mengaktifkan ${method.label} ?`,
          message: `Anda saat ini menggunakan ${activeMfaType.toUpperCase()}. Mengaktifkan ${method.label} akan menggantikan metode sebelumnya. Lanjutkan?`,
          confirmText: 'Ya, Hapus',
          type: 'destructive',
        })

        if (!confirmSwitch) {
          input.checked = false
          return
        }
      }
      pendingMfaType = method.type
      verificationCode = ''

      if (method.type === 'totp') {
        activeMfaType = 'none'
        await initiate2FASetup()
      } else if (method.type === 'email') {
        activeMfaType = 'none'
        pendingMfaType = 'email'

        await requestEmailOtp()
        toast.add('Kode OTP telah dikirim ke email Anda.', 'success')
      }
    }
  }

  async function requestEmailOtp() {
    try {
      isProcessing = true
    } catch (error) {
      toast.add('Terjadi kesalahan koneksi saat meminta OTP.', 'error')
      pendingMfaType = null
    } finally {
      isProcessing = false
    }
  }

  async function initiate2FASetup() {
    try {
      const res = await fetch('/api/security/setup')
      qrData = await res.json()
      show2FASetup = true
    } catch (err) {
      console.error('Gagal memulai setup MFA', err)
    }
  }

  async function confirm2FA() {
    if (verificationCode.length !== 6) return

    isSubmitting = true
    try {
      const res = await fetch('/api/security/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
        body: JSON.stringify({ type: 'totp', code: verificationCode }),
      })

      if (res.ok) {
        toast.add('Google Authenticator Aktif!', 'success')
        show2FASetup = false
        activeMfaType = 'totp'
        pendingMfaType = null
        secretKeyVerified = qrData.secretKey
      } else {
        const err = await res.json()
        toast.add(err.message || 'Kode verifikasi salah!', 'error')
        show2FASetup = true
      }
    } finally {
      isSubmitting = false
    }
  }

  async function handleUpdateProfile() {
    if (isSubmitting) return

    if (pendingMfaType !== null) {
      toast.add('Silakan selesaikan verifikasi MFA terlebih dahulu.', 'warning')
      return
    }

    try {
      isSubmitting = true
      const originalUser = $page.props.user
      const payload = {}
      const newMfaType = isMfaEnabled ? activeMfaType : 'none'
      if (isMfaEnabled !== originalUser.mfa_enabled) {
        payload.mfa_enabled = isMfaEnabled && newMfaType != 'none'
        if (secretKeyVerified && newMfaType === 'totp' && isMfaEnabled) {
          payload.totp_secret_key = secretKeyVerified
        }
      }
      if (newMfaType !== originalUser.mfa_type) {
        payload.mfa_type = newMfaType
      }
      console.log(activeMfaType)

      if (Object.keys(payload).length === 0) {
        toast.add('Tidak ada perubahan yang perlu disimpan.', 'info')
        isProfileOpen = false
        return
      }

      const res = await fetch('/api/profile-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(payload),
      })

      const result = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(result.message || 'Terjadi kesalahan saat memperbarui profil.')
      }

      toast.add(result.message || 'Profil berhasil diperbarui!', 'success')
      isProfileOpen = false
      secretKeyVerified = null

      router.reload({ only: ['user'] })
    } catch (err) {
      console.error('[Profile Update Error]:', err)
      toast.add(err.message || 'Gagal terhubung ke server.', 'error')
    } finally {
      syncStateWithDatabase()
      isSubmitting = false
    }
  }

  function syncStateWithDatabase() {
    const user = $page.props.user
    isMfaEnabled = user?.mfa_enabled ?? false
    activeMfaType = user?.mfa_type || 'none'

    pendingMfaType = null
    verificationCode = ''
    isProcessing = false
  }

  const decryptedMenu = $derived.by(() => {
    const sidebarProp = $page.props.sidebar
    if (!sidebarProp?.nonce || !sidebarProp?.ciphertext) return null

    try {
      const raw = EncryptionService.decrypt(sidebarProp.nonce, sidebarProp.ciphertext)
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      console.error('🔒 [Decrypt Error]:', e)
      return null
    }
  })

  const activeMenuItem = $derived.by(() => {
    if (!decryptedMenu?.sidemenu) return null
    const rawUrl = $page.url.split('?')[0].replace(/^\//, '')
    const currentUrl = rawUrl.startsWith('systems/') ? rawUrl : `systems/${rawUrl}`
    function findActive(items) {
      for (const item of items) {
        if (item.path) {
          const cleanPath = item.path.replace(/^\//, '')
          const itemPath = cleanPath.startsWith('systems/') ? cleanPath : `systems/${cleanPath}`

          if (itemPath === currentUrl) return item
        }

        if (item.sub_sidemenu && item.sub_sidemenu.length > 0) {
          const found = findActive(item.sub_sidemenu)
          if (found) return found
        }
      }
      return null
    }
    return findActive(decryptedMenu.sidemenu)
  })

  onMount(() => {
    initTheme()
    initSplash()
    if (!$page.props.sidebar) router.reload({ only: ['sidebar'] })
  })

  $effect(() => {
    const _ = $page.url
    const user = $page.props.user
    untrack(() => {
      isMobileOpen = false
      if (isOrchestrating) {
        const timer = setTimeout(() => {
          isOrchestrating = false
        }, 1700)
        return () => clearTimeout(timer)
      }

      if (user?.id) realtime.init(user.id)
    })
  })
</script>

<SplashScreen />

<div class="flex min-h-screen bg-background text-foreground transition-colors duration-300">
  <Sidebar
    {isDesktopCollapsed}
    menuData={decryptedMenu}
    isOpen={isMobileOpen}
    onClose={() => (isMobileOpen = false)}
  />

  <div class="flex flex-1 flex-col overflow-hidden relative">
    <header
      class="sticky top-0 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur-md lg:px-8"
    >
      <button
        type="button"
        class="lg:hidden text-muted-foreground p-2 hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        onclick={() => (isMobileOpen = true)}
        aria-label="Buka Menu"
      >
        <i class="fas fa-bars text-xl"></i>
      </button>

      <button
        type="button"
        onclick={() => (isDesktopCollapsed = !isDesktopCollapsed)}
        class="hidden lg:flex h-9 w-9 items-center rounded-lg hover:bg-muted text-muted-foreground transition-all"
        aria-label="Toggle Sidebar"
      >
        <i class="fas {isDesktopCollapsed ? 'fa-indent' : 'fa-outdent'} text-lg"></i>
      </button>

      <div class="flex items-center gap-4">
        <div class="hidden text-right md:block">
          <p class="text-sm font-bold leading-none">
            {$page.props.user?.username || 'Administrator'}
          </p>
          <p class="mt-1 text-xs text-muted-foreground capitalize">
            {$page.props.user?.role || 'System Role'}
          </p>
        </div>
        <div
          role="button"
          tabindex="0"
          onclick={() => ((isProfileOpen = true), syncStateWithDatabase())}
          onkeydown={() => ((isProfileOpen = true), syncStateWithDatabase())}
          class="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary font-bold shadow-sm"
        >
          {($page.props.user?.username || 'A').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in custom-scrollbar">
      {#if isOrchestrating && activeMenuItem?.type}
        <div class="max-w-full overflow-hidden">
          {@render children()}
        </div>
      {:else if activeMenuItem?.type}
        {#if activeMenuItem.type === 'tableview'}
          <TableView config={activeMenuItem.config} title={activeMenuItem.name} />
        {:else if activeMenuItem.type === 'chartview'}
          <ChartView config={activeMenuItem.config} title={activeMenuItem.name} />
        {:else if activeMenuItem.type === 'settings'}
          <SettingsView config={activeMenuItem.config} title={activeMenuItem.name} />
        {:else}
          <div
            class="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-8 text-center"
          >
            <i class="fas fa-hammer text-4xl text-primary mb-4"></i>
            <h3 class="text-lg font-bold">
              Modul: {activeMenuItem.name} ({activeMenuItem.type})
            </h3>
            <p class="text-sm text-muted-foreground mt-2">
              Tipe modul ini belum memiliki komponen view.
            </p>
          </div>
        {/if}
      {:else if children}
        <div class="max-w-full overflow-hidden">
          {@render children()}
        </div>
      {/if}
    </main>
  </div>
</div>

{#if isProfileOpen}
  <div class="fixed inset-0 z-[100] flex justify-end overflow-hidden">
    <div
      role="button"
      tabindex="0"
      class="absolute inset-0 bg-background/60 backdrop-blur-sm"
      transition:fade
      onclick={() => {
        syncStateWithDatabase()
        isProfileOpen = false
      }}
      onkeydown={(e) => e.key === 'Escape' && (isProfileOpen = false)}
    ></div>

    <div
      class="relative h-full w-full sm:w-[450px] bg-card border-l border-border shadow-2xl flex flex-col"
      in:fly={{ x: 500, duration: 300 }}
      out:fly={{ x: 500, duration: 250 }}
    >
      <div class="flex items-center justify-between border-b px-6 py-5">
        <div>
          <h3 class="text-sm font-black uppercase tracking-widest">Pengaturan Profil</h3>
          <p class="text-[9px] font-bold text-muted-foreground mt-1 uppercase">
            Update identitas dan keamanan akun
          </p>
        </div>
        <button
          aria-label="close-button"
          onclick={() => {
            syncStateWithDatabase()
            isProfileOpen = false
          }}
          class="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
        >
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <div class="flex flex-col items-center py-4">
          <div
            class="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-2xl font-black text-primary shadow-inner mb-3"
          >
            {'A'.charAt(0).toUpperCase()}
          </div>
          <button
            class="text-[10px] font-black uppercase text-primary tracking-tighter hover:underline"
            >Ganti Foto Profil</button
          >
        </div>

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label
              for="user"
              class="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest"
              >Username</label
            >
            <input
              type="text"
              class="w-full rounded-xl border border-border bg-muted/10 px-4 py-3 text-xs font-bold outline-none focus:border-primary transition-all shadow-inner"
            />
          </div>

          <div class="space-y-1.5">
            <label
              for="email"
              class="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest"
              >Alamat Email</label
            >
            <input
              type="email"
              class="w-full rounded-xl border border-border bg-muted/10 px-4 py-3 text-xs font-bold outline-none focus:border-primary transition-all shadow-inner"
            />
          </div>

          <div class="pt-4 border-t border-border/50">
            <div class="space-y-1.5">
              <label
                for="password"
                class="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest"
                >Ganti Password</label
              >
              <input
                type="password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-border bg-muted/10 px-4 py-3 text-xs outline-none focus:border-primary transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-6 pt-4 border-t border-border/50">
            <div class="flex items-center justify-between px-1">
              <span
                class="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"
              >
                <i class="fas fa-shield-check {isMfaEnabled ? 'text-primary' : ''}"></i> Pengaturan Keamanan
              </span>
              <label class="relative inline-flex items-center cursor-pointer scale-90">
                <input
                  type="checkbox"
                  checked={isMfaEnabled}
                  onchange={handleMasterToggle}
                  disabled={isProcessing}
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
                ></div>
              </label>
            </div>

            {#if isMfaEnabled}
              <div class="space-y-3" transition:slide>
                {#each mfaMethods as method}
                  <div
                    class="relative overflow-hidden rounded-2xl border {activeMfaType ===
                    method.type
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-muted/5'} transition-all"
                  >
                    <div class="p-4 flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-xl flex items-center justify-center {activeMfaType ===
                          method.type
                            ? 'bg-primary text-white'
                            : 'bg-background text-muted-foreground'} shadow-inner"
                        >
                          <i class={method.icon}></i>
                        </div>
                        <div>
                          <p
                            class="text-[11px] font-black uppercase transition-colors duration-200
                            {activeMfaType === method.type || pendingMfaType === method.type
                              ? 'text-primary'
                              : 'text-foreground'}"
                          >
                            {method.label}
                          </p>

                          <div class="mt-0.5">
                            {#if activeMfaType === method.type}
                              <div class="flex items-center gap-1.5">
                                <span
                                  class="inline-flex items-center gap-1 text-[8px] font-black text-primary uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded shadow-sm border border-primary/20"
                                >
                                  <i class="fas fa-check-circle text-[7px]"></i>
                                  {#if $page.props.user?.mfa_type === method.type}
                                    Terverifikasi
                                  {:else}
                                    Terverifikasi dan Siap Disimpan
                                  {/if}
                                </span>
                              </div>
                            {:else if pendingMfaType === method.type}
                              <div class="flex items-center gap-1.5 animate-pulse">
                                <span
                                  class="text-[8px] font-black text-amber-600 uppercase tracking-tighter bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                                >
                                  Menunggu Verifikasi
                                </span>
                              </div>
                            {:else}
                              <p
                                class="text-[9px] font-medium text-muted-foreground leading-tight italic"
                              >
                                {activeMfaType !== 'none'
                                  ? 'Klik untuk mengganti'
                                  : 'Pilih metode ini'}
                              </p>
                            {/if}
                          </div>
                        </div>
                      </div>

                      <label
                        class="relative inline-flex items-center cursor-pointer {isProcessing
                          ? 'opacity-50'
                          : ''}"
                      >
                        <input
                          type="checkbox"
                          disabled={isProcessing}
                          checked={activeMfaType === method.type || pendingMfaType === method.type}
                          onchange={(e) => handleMethodToggle(method, e)}
                          class="sr-only peer"
                        />
                        <div
                          class="w-9 h-5 bg-muted-foreground/20 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                        ></div>
                      </label>
                    </div>

                    {#if pendingMfaType === method.type && activeMfaType !== method.type}
                      <div
                        class="px-4 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2"
                        transition:slide
                      >
                        <div
                          class="p-5 bg-background rounded-xl border border-primary/20 shadow-inner relative overflow-hidden"
                        >
                          {#if method.type === 'totp'}
                            <div class="flex flex-col items-center gap-3 mb-5">
                              <div
                                class="p-2 bg-white rounded-xl shadow-md border border-border/50"
                              >
                                <img src={qrData.qrCode} alt="QR Code" class="w-28 h-28" />
                              </div>
                              <div class="flex flex-col items-center w-full mt-1">
                                <span
                                  class="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1"
                                  >Atau gunakan kode rahasia</span
                                >
                                <code
                                  class="text-[10px] font-mono font-black text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-lg select-all w-full text-center truncate"
                                  >{qrData.secretKey}</code
                                >
                              </div>
                            </div>
                          {/if}

                          {#if method.type === 'email'}
                            <div class="flex flex-col items-center gap-2 mb-5 text-center">
                              <div
                                class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-1"
                              >
                                <i class="fas fa-envelope-open-text text-lg"></i>
                              </div>
                              <h4 class="text-[12px] font-bold text-foreground">
                                Cek Kotak Masuk Anda
                              </h4>
                              <p class="text-[10px] text-muted-foreground px-2">
                                Kami telah mengirimkan 6-digit kode OTP ke email terdaftar.
                              </p>
                            </div>
                          {/if}

                          <div class="space-y-3 border-t border-border/50 pt-4">
                            <label
                              for="verificationCode"
                              class="text-[10px] font-black text-foreground uppercase tracking-widest block text-center"
                            >
                              Masukkan 6-Digit Kode
                            </label>
                            <div class="flex flex-col gap-3">
                              <input
                                type="text"
                                bind:value={verificationCode}
                                maxlength="6"
                                disabled={isProcessing}
                                placeholder="••••••"
                                class="w-full bg-muted/20 border border-border/60 rounded-xl px-4 py-3 text-lg font-mono font-black text-center tracking-[0.75em] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:tracking-normal placeholder:text-muted-foreground/30 shadow-inner"
                              />

                              <div class="flex gap-2 w-full">
                                {#if method.type === 'email'}
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onclick={() => toast.add('Kode OTP baru dikirim!', 'info')}
                                    class="flex-1 bg-muted/50 border border-border/50 text-foreground px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-muted active:scale-95 transition-all"
                                  >
                                    Kirim Ulang
                                  </button>
                                {/if}
                                <button
                                  onclick={confirm2FA}
                                  disabled={isProcessing || verificationCode.length < 6}
                                  class="flex-[2] bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                  {isProcessing ? 'Memproses...' : 'Verifikasi'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="border-t bg-muted/5 p-6 flex justify-end gap-3 shrink-0">
        <button
          onclick={() => {
            syncStateWithDatabase()
            isProfileOpen = false
          }}
          class="px-4 text-xs font-bold text-muted-foreground hover:text-foreground"
          >Batal
        </button>
        <button
          onclick={handleUpdateProfile}
          class="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition-all"
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  </div>
{/if}

<Toast />
<ConfirmDialog />
