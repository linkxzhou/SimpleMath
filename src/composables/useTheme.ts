import { ref, onMounted } from 'vue'

type Theme = 'light'

const defaultTheme: Theme = 'light'

export function useTheme() {
  const theme = ref<Theme>(defaultTheme)

  const applyTheme = () => {
    const root = document.documentElement
    
    // 移除所有主题类
    root.classList.remove('light', 'dark')
    
    // 应用light主题
    root.classList.add('light')
  }

  onMounted(() => {
    applyTheme()
  })

  return {
    theme
  }
}