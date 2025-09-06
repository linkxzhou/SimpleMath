import { ref, watchEffect, onMounted, computed } from 'vue'

type Theme = 'light' | 'dark'

const defaultTheme: Theme = 'light'

export function useTheme() {
  const theme = ref<Theme>(defaultTheme)

  const loadTheme = (): Theme => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved && (saved === 'light' || saved === 'dark')) {
        return saved as Theme
      }
    } catch (error) {
      console.warn('Failed to load theme:', error)
    }
    return defaultTheme
  }

  const saveTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem('theme', newTheme)
    } catch (error) {
      console.warn('Failed to save theme:', error)
    }
  }

  const applyTheme = () => {
    const root = document.documentElement
    
    // 移除所有主题类
    root.classList.remove('light', 'dark')
    
    // 应用新主题
    root.classList.add(theme.value)
    
    // 保存主题
    saveTheme(theme.value)
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  onMounted(() => {
    theme.value = loadTheme()
    applyTheme()
  })

  watchEffect(() => {
    applyTheme()
  })

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: computed(() => theme.value === 'dark')
  }
}