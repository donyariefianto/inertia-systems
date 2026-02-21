<script lang="ts">
  import { fly } from 'svelte/transition'
  import { onMount } from 'svelte'
  import { router } from '@inertiajs/svelte'
  import { t, i18nState } from '~/stores/i18n.svelte'
  let isDark = $state(true)
  let isProcessing = $state(false)
  let isScrolled = $state(false)
  let { locale } = $props()

  onMount(() => {
    if (typeof document !== 'undefined') {
      isDark = document.documentElement.classList.contains('dark')

      const handleScroll = () => {
        isScrolled = window.scrollY > 20
      }
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  })

  function toggleTheme() {
    isDark = !isDark
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function changeLanguage() {
    if (isProcessing) return
    isProcessing = true
    const newLocale = i18nState.locale === 'id' ? 'en' : 'id'
    router.post(
      '/language',
      { locale: newLocale },
      {
        preserveScroll: true,
        onFinish: () => {
          isProcessing = false
        },
      }
    )
  }

  const pillars = $derived([
    {
      category: t('landing.pillars.cat_core'),
      items: [
        {
          name: t('landing.pillars.items.master_state.name'),
          desc: t('landing.pillars.items.master_state.desc'),
        },
        {
          name: t('landing.pillars.items.event_ledger.name'),
          desc: t('landing.pillars.items.event_ledger.desc'),
        },
        {
          name: t('landing.pillars.items.projections.name'),
          desc: t('landing.pillars.items.projections.desc'),
        },
        {
          name: t('landing.pillars.items.insights.name'),
          desc: t('landing.pillars.items.insights.desc'),
        },
      ],
    },
    {
      category: t('landing.pillars.cat_framework'),
      items: [
        {
          name: t('landing.pillars.items.rule_engine.name'),
          desc: t('landing.pillars.items.rule_engine.desc'),
        },
        {
          name: t('landing.pillars.items.metadata.name'),
          desc: t('landing.pillars.items.metadata.desc'),
        },
        {
          name: t('landing.pillars.items.archiving.name'),
          desc: t('landing.pillars.items.archiving.desc'),
        },
        {
          name: t('landing.pillars.items.security.name'),
          desc: t('landing.pillars.items.security.desc'),
        },
      ],
    },
    {
      category: t('landing.pillars.cat_ai'),
      items: [
        {
          name: t('landing.pillars.items.logic.name'),
          desc: t('landing.pillars.items.logic.desc'),
        },
        {
          name: t('landing.pillars.items.orchestration.name'),
          desc: t('landing.pillars.items.orchestration.desc'),
        },
        {
          name: t('landing.pillars.items.knowledge_graph.name'),
          desc: t('landing.pillars.items.knowledge_graph.desc'),
        },
        {
          name: t('landing.pillars.items.feedback_loop.name'),
          desc: t('landing.pillars.items.feedback_loop.desc'),
        },
      ],
    },
  ])

  const techStack = $derived([
    {
      tech: t('landing.tech.categories.framework'),
      name: 'AdonisJS 6 (TypeScript)',
      icon: 'server',
    },
    { tech: t('landing.tech.categories.infrastructure'), name: 'Docker & Compose', icon: 'box' },
    { tech: t('landing.tech.categories.db'), name: 'MongoDB', icon: 'database' },
    { tech: t('landing.tech.categories.queue'), name: 'Redis & BullMQ', icon: 'layer-group' },
    { tech: t('landing.tech.categories.ai'), name: 'LangChain & Vercel AI', icon: 'brain' },
    {
      tech: t('landing.tech.categories.frontend'),
      name: 'PWA & Apache ECharts',
      icon: 'chart-pie',
    },
  ])

  const features = $derived([
    {
      icon: 'robot',
      title: t('landing.features.agent_title'),
      desc: t('landing.features.agent_desc'),
    },
    {
      icon: 'project-diagram',
      title: t('landing.features.view_title'),
      desc: t('landing.features.view_desc'),
    },
    {
      icon: 'network-wired',
      title: t('landing.features.context_title'),
      desc: t('landing.features.context_desc'),
    },
  ])

  const workflow = $derived([
    { step: 'Sensing', desc: t('landing.workflow.steps.sensing') },
    { step: 'Processing', desc: t('landing.workflow.steps.processing') },
    { step: 'Synthesizing', desc: t('landing.workflow.steps.synthesizing') },
    { step: 'Acting', desc: t('landing.workflow.steps.acting') },
    { step: 'Learning', desc: t('landing.workflow.steps.learning') },
  ])

  const footerLinks = $derived([
    { href: '#architectures', label: t('landing.footer.architecture') },
    { href: '#features', label: t('landing.footer.features') },
    { href: '#privacy', label: t('landing.footer.privacy') },
  ])
  const currentYear = new Date().getFullYear()
</script>

<svelte:head>
  <title>AION | Autonomous Intelligence Network</title>
</svelte:head>

<nav
  class="fixed top-0 z-50 w-full transition-all duration-300 {isScrolled
    ? 'bg-background/80 backdrop-blur-md border-b border-border/50 py-3 shadow-sm'
    : 'bg-transparent py-5'}"
>
  <div class="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
    <div class="flex items-center gap-2">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <i class="fas fa-bolt text-sm"></i>
      </div>
      <span class="text-xl font-extrabold tracking-tight">AION</span>
    </div>

    <div class="hidden items-center gap-8 md:flex">
      {#each footerLinks as link}
        <a
          href={link.href}
          class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {link.label}
        </a>
      {/each}
    </div>

    <div class="flex items-center gap-4">
      <button
        onclick={changeLanguage}
        class="flex h-9 items-center justify-center rounded-full border border-border/50 bg-muted/30 px-3 text-xs font-bold transition-all hover:bg-muted active:scale-95"
        class:text-primary={locale}
        aria-label="Toggle Language"
      >
        <i class="fas fa-globe mr-1.5 opacity-60"></i>
        <span class="uppercase">{locale}</span>
      </button>
      <button
        onclick={toggleTheme}
        class="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-muted/30 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Toggle Dark Mode"
      >
        <i class="fas {isDark ? 'fa-sun' : 'fa-moon'}"></i>
      </button>

      <a
        href="#demo"
        class="hidden rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 hover:shadow-lg sm:block"
      >
        {t('landing.nav.demo')}
      </a>
    </div>
  </div>
</nav>

<section class="relative flex min-h-[90vh] items-center overflow-hidden pt-20">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl text-center" in:fly={{ y: 30, duration: 1000 }}>
      <div
        class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm"
      >
        <span class="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
        {t('landing.hero.badge')}
      </div>

      <h1 class="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
        {t('landing.hero.title')} <br class="hidden sm:block" />
        <span class="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent"
          >{t('landing.hero.highlight')}</span
        >
      </h1>

      <p class="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
        {t('landing.hero.desc')}
      </p>

      <div class="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <a
          href="#architectures"
          class="group relative flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/25 hover:shadow-xl"
        >
          {t('landing.hero.btn_primary')}
          <i class="fas fa-arrow-right transition-transform group-hover:translate-x-1"></i>
        </a>
        <a
          href="/docs"
          class="flex items-center justify-center rounded-full border border-border bg-card px-8 py-4 text-base font-bold text-foreground transition-colors hover:bg-muted"
        >
          {t('landing.hero.btn_secondary')}
        </a>
      </div>
    </div>
  </div>

  <div class="absolute inset-0 -z-10 h-full w-full bg-background">
    <div
      class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 blur-[120px] rounded-full"
    ></div>
  </div>
</section>

<section id="features" class="py-24 bg-muted/20 border-y border-border/50">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <h2 class="text-3xl font-bold sm:text-4xl">{t('landing.features.title')}</h2>
      <p class="mt-4 text-muted-foreground text-lg">
        {t('landing.features.desc')}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each features as feature}
        <div
          class="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
        >
          <div
            class="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 transition-transform group-hover:scale-150"
          ></div>

          <div
            class="relative h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6"
          >
            <i class="fas fa-{feature.icon} text-2xl"></i>
          </div>
          <h3 class="text-xl font-bold mb-3">{feature.title}</h3>
          <p class="text-muted-foreground leading-relaxed">{feature.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<section id="architectures" class="py-24">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <span class="text-primary font-bold uppercase tracking-wider text-sm"
        >{t('landing.pillars.badge')}</span
      >
      <h2 class="mt-2 text-3xl font-bold sm:text-4xl">{t('landing.pillars.title')}</h2>
      <p class="mt-4 text-muted-foreground text-lg">{t('landing.pillars.desc')}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      {#each pillars as category}
        <div class="flex flex-col">
          <div class="flex items-center gap-3 mb-6">
            <div class="h-px flex-1 bg-border/80"></div>
            <h3 class="text-lg font-bold text-foreground whitespace-nowrap">{category.category}</h3>
            <div class="h-px flex-1 bg-border/80"></div>
          </div>

          <div class="space-y-4">
            {#each category.items as item}
              <div
                class="group rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <h4 class="font-bold text-foreground flex items-center gap-2">
                  <i
                    class="fas fa-check-circle text-primary text-sm opacity-70 group-hover:opacity-100 transition-opacity"
                  ></i>
                  {item.name}
                </h4>
                <p class="text-sm text-muted-foreground mt-2 ml-6 leading-relaxed">{item.desc}</p>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<section id="workflow" class="py-24 bg-primary text-primary-foreground overflow-hidden">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold sm:text-4xl">{t('landing.workflow.title')}</h2>
      <p class="mt-4 text-primary-foreground/80 text-lg">{t('landing.workflow.desc')}</p>
    </div>

    <div class="relative max-w-5xl mx-auto">
      <div
        class="hidden lg:block absolute top-10 left-[10%] w-[80%] h-0.5 bg-primary-foreground/20"
      ></div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {#each workflow as step, idx}
          <div class="relative flex flex-col items-center text-center z-10 group">
            <div
              class="w-20 h-20 rounded-full bg-primary flex items-center justify-center border-4 border-primary-foreground/20 text-2xl font-black mb-6 shadow-xl transition-transform group-hover:scale-110 group-hover:border-primary-foreground/50"
            >
              {idx + 1}
            </div>
            <h4 class="font-bold text-lg mb-2">{step.step}</h4>
            <p class="text-sm text-primary-foreground/80 leading-relaxed">{step.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<section id="privacy" class="py-24">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold sm:text-4xl">{t('landing.tech.title')}</h2>
      <p class="mt-4 text-muted-foreground text-lg">{t('landing.tech.desc')}</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {#each techStack as item}
        <div
          class="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card p-6 text-center shadow-sm hover:shadow-md transition-shadow"
        >
          <i class="fas fa-{item.icon} text-3xl text-muted-foreground mb-4"></i>
          <div class="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
            {item.tech}
          </div>
          <div class="text-sm font-semibold">{item.name}</div>
        </div>
      {/each}
    </div>
  </div>
</section>

<footer class="border-t border-border/50 bg-muted/10 pt-16 pb-8">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <i class="fas fa-bolt"></i>
        </div>
        <div>
          <p class="text-2xl font-black tracking-tight">Autonomous Engine</p>
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            AION (Autonomous Intelligence & Optimization Network)
          </p>
        </div>
      </div>

      <div class="flex flex-wrap justify-center gap-6">
        {#each footerLinks as link}
          <a
            href={link.href}
            class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </a>
        {/each}
      </div>
    </div>

    <div
      class="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
    >
      <p class="text-xs text-muted-foreground">
        &copy; {currentYear} AION Platform. All rights reserved.
      </p>
      <div class="flex gap-4">
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <a href="#github" class="text-muted-foreground hover:text-foreground"
          ><i class="fab fa-github text-xl"></i></a
        >
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <a href="https://id.linkedin.com/in/dony-ariefianto-09a470210" class="text-muted-foreground hover:text-foreground"
          ><i class="fab fa-linkedin text-xl"></i></a
        >
      </div>
    </div>
  </div>
</footer>
