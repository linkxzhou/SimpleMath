import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface OpenAISettings {
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
}

export const useSettingsStore = defineStore('settings', () => {
  // 默认设置
  const defaultSettings: OpenAISettings = {
    apiKey: '',
    baseUrl: 'http://localhost:3001/api/openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: `你是一个专业的p5.js代码生成专家，专门为数学概念和算法创建可视化动画代码。

请遵循以下规则：
1. 生成完整可运行的p5.js代码
2. 使用setup()和draw()函数结构
3. 代码应该是自包含的，不依赖外部资源
4. 添加适当的注释解释数学概念
5. 确保动画流畅且具有教育意义
6. 使用合适的颜色和视觉效果
7. 代码应该在400x400像素的画布上运行良好

请只返回p5.js代码，不要包含其他解释文字。`
  }

  // 响应式状态
  const settings = ref<OpenAISettings>({ ...defaultSettings })
  const isModalOpen = ref(false)
  const isConfigured = computed(() => {
    return settings.value.apiKey.trim() !== ''
  })



  // 更新设置
  const updateSettings = (newSettings: Partial<OpenAISettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveToLocalStorage()
  }

  // 重置为默认设置
  const resetToDefaults = () => {
    settings.value = { ...defaultSettings }
    saveToLocalStorage()
  }

  // 验证API密钥格式
  const validateApiKey = (apiKey: string): boolean => {
    return apiKey.trim().length > 0
  }

  // 验证URL格式
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }



  // 打开/关闭设置模态框
  const openModal = () => {
    isModalOpen.value = true
  }

  const closeModal = () => {
    isModalOpen.value = false
  }

  // 保存到本地存储
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('simplemath_settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
    }
  }

  // 从本地存储加载
  const loadFromLocalStorage = () => {
    try {
      const savedSettings = localStorage.getItem('simplemath_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        settings.value = { ...defaultSettings, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
      settings.value = { ...defaultSettings }
    }
  }

  // 导出设置
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'simplemath-settings.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  // 导入设置
  const importSettings = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string)
          settings.value = { ...defaultSettings, ...imported }
          saveToLocalStorage()
          resolve()
        } catch (error) {
          reject(new Error('Invalid settings file format'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // 初始化时加载设置
  loadFromLocalStorage()

  return {
    // 状态
    settings,
    isModalOpen,
    
    // 计算属性
    isConfigured,
    
    // 方法
    updateSettings,
    resetToDefaults,
    validateApiKey,
    validateUrl,
    openModal,
    closeModal,
    exportSettings,
    importSettings,
    loadFromLocalStorage,
    saveToLocalStorage
  }
})