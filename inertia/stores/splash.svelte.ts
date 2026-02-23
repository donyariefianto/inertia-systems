export const splashState = $state({
  visible: true,
  duration: 1500,
})

export function initSplash() {
  if (typeof window !== 'undefined' && splashState.visible) {
    const timer = setTimeout(() => {
      splashState.visible = false
    }, splashState.duration)

    return () => clearTimeout(timer)
  }
}
