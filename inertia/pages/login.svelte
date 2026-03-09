<script>
  import { useForm, router } from '@inertiajs/svelte'
  import { getCsrfToken } from '~/utils/getCrsfToken'
  import { toast } from '~/utils/toast.svelte'
  import Toast from '~/components/Toast.svelte'

  let visiblePasswordFields = $state({})
  let mfaRequired = $state(false)
  let mfaType = $state('')
  let otpCode = $state('')
  let isSubmitting = $state(false)

  const form = useForm({
    login: '',
    password: '',
  })

  function toggleVisibility(fieldName) {
    visiblePasswordFields[fieldName] = !visiblePasswordFields[fieldName]
  }
  async function verifyMfa(e) {
    e.preventDefault()
    try {
      const res = await fetch('/api/verify-mfa-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
        body: JSON.stringify({ code: otpCode }),
      })

      const result = await res.json()
      if (!res.ok) return toast.add(result.message, 'warning')

      router.visit('systems')
    } catch (error) {
      toast.add('Gagal memverifikasi kode', 'error')
    }
  }
  async function submit(e) {
    e.preventDefault()
    const payload = $form.data()
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) {
        return toast.add(result.message, 'warning')
      }
      if (result.mfa_required) {
        mfaRequired = true
        mfaType = result.mfa_type
        toast.add(result.message, 'info')
        return
      }
      router.visit('systems')
    } catch (error) {
      toast.add(error.message, 'error')
    }
  }
  function handleOtpInput(e) {
    const value = e.target.value.replace(/\D/g, '') // Hapus semua karakter non-angka
    otpCode = value.slice(0, 6) // Ambil hanya 6 digit pertama
  }
</script>

<div
  class="flex min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
>
  <div
    class="relative hidden w-full flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:w-5/12"
  >
    <div
      class="absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-white opacity-10 blur-3xl"
    ></div>
    <div
      class="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-black opacity-10 blur-3xl"
    ></div>

    <div class="relative z-10 flex items-center gap-3">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold backdrop-blur-sm shadow-inner"
      >
        A
      </div>
      <span class="text-2xl font-bold tracking-wide"
        >AION<span class="opacity-80">System</span></span
      >
    </div>

    <div class="relative z-10 max-w-md">
      <h2 class="text-3xl font-bold leading-tight">
        Next-Generation Autonomous Intelligence System
      </h2>
      <p class="mt-4 text-lg opacity-80">
        A universal intelligence ecosystem that orchestrates data, predicts risks, and executes
        solutions autonomously. Built with cutting-edge technology to transcend traditional
        monitoring boundaries.
      </p>
    </div>

    <div class="relative z-10 text-sm opacity-60">&copy; 2026 AION. All rights reserved.</div>
  </div>

  <div class="flex w-full flex-col items-center justify-center p-8 lg:w-7/12">
    <div class="w-full max-w-sm space-y-8">
      <div class="flex items-center gap-2 lg:hidden mb-8">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm"
        >
          A
        </div>
        <span class="text-xl font-bold">AION<span class="text-primary">System</span></span>
      </div>

      <div class="space-y-3 animate-in fade-in slide-in-from-left-4 duration-700">
        <div class="flex items-center gap-3">
          <div
            class="h-8 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]"
          ></div>
          <h2 class="text-4xl font-black tracking-tighter text-foreground">
            {#if !mfaRequired}
              Sign In
            {:else}
              Security
            {/if}
          </h2>
        </div>

        <p class="text-sm text-muted-foreground leading-relaxed max-w-[320px]">
          {#if !mfaRequired}
            Silakan masuk menggunakan kredensial <span class="text-foreground font-semibold"
              >AION System</span
            > Anda untuk mengakses panel kontrol.
          {:else}
            Demi keamanan akun, kami memerlukan langkah verifikasi tambahan untuk memastikan ini
            benar-benar Anda.
          {/if}
        </p>
      </div>

      {#if $form.errors.auth}
        <div
          class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {$form.errors.auth}
        </div>
      {/if}

      {#if !mfaRequired}
        <form class="space-y-6" onsubmit={submit}>
          <div class="space-y-2">
            <label for="email" class="text-sm font-medium text-foreground"
              >Alamat Email atau Username</label
            >
            <input
              id="email"
              type="text"
              bind:value={$form.login}
              required
              class="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              placeholder="admin@aion.com"
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="password" class="text-sm font-medium text-foreground">Password</label>
              <button type="button" class="text-sm font-medium text-primary hover:underline"
                >Lupa password?</button
              >
            </div>
            <div class="relative group">
              <input
                id="password_field"
                type={visiblePasswordFields['password_field'] ? 'text' : 'password'}
                bind:value={$form.password}
                required
                class="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                placeholder="••••••••"
              />
              <button
                aria-label="eyes"
                type="button"
                onclick={() => toggleVisibility('password_field')}
                class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                tabindex="-1"
              >
                <i
                  class="fas {visiblePasswordFields['password_field']
                    ? 'fa-eye-slash'
                    : 'fa-eye'} text-xs"
                ></i>
              </button>
            </div>
          </div>

          <div class="flex items-center">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={$form.remember}
                class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span class="text-sm text-muted-foreground">Ingat sesi saya</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={$form.processing}
            class="flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {#if $form.processing}
              <i class="fas fa-circle-notch fa-spin mr-2"></i> Memproses...
            {:else}
              Masuk ke Sistem
            {/if}
          </button>
        </form>
      {:else}
        <form
          class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          onsubmit={verifyMfa}
        >
          <div class="text-center space-y-2">
            <div
              class="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2 shadow-sm"
            >
              {#if mfaType === 'totp'}
                <i class="fas fa-shield-halved text-2xl"></i>
              {:else}
                <i class="fas fa-envelope-open-text text-2xl"></i>
              {/if}
            </div>
            <h3 class="text-xl font-bold text-foreground">Verifikasi Keamanan</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Masukkan 6 digit kode dari
              <span class="font-bold text-foreground">
                {mfaType === 'totp' ? 'Aplikasi Authenticator' : 'Kotak Masuk Email'}
              </span> Anda untuk melanjutkan.
            </p>
          </div>

          <div class="space-y-3">
            <label
              for="otp-input"
              class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1"
            >
              Kode 6-Digit
            </label>
            <div class="relative group">
              <input
                id="otp-input"
                type="text"
                value={otpCode}
                oninput={handleOtpInput}
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="one-time-code"
                placeholder="······"
                class="flex h-16 w-full text-center text-3xl font-mono font-bold tracking-[12px]
                      bg-muted/30 border-2 border-border/50 rounded-lg
                      focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10
                      outline-none transition-all duration-300 placeholder:opacity-30"
                required
              />
              <div
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-500 group-focus-within:w-1/2 opacity-50"
              ></div>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <button
              type="submit"
              disabled={otpCode.length !== 6 || isSubmitting}
              class="relative w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold
                    shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5
                    active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
              {#if isSubmitting}
                <i class="fas fa-circle-notch fa-spin mr-2"></i> Memvalidasi...
              {:else}
                <span class="flex items-center justify-center gap-2">
                  Verifikasi & Masuk <i class="fas fa-arrow-right text-xs opacity-50"></i>
                </span>
              {/if}
            </button>

            <button
              type="button"
              onclick={() => (mfaRequired = false)}
              class="w-full py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider
                    hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <i class="fas fa-chevron-left text-[9px]"></i> Kembali ke Login
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>
<Toast />
