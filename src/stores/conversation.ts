import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  generatedCode?: string
  timestamp: Date
}

export interface Conversation {
  id: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export const useConversationStore = defineStore('conversation', () => {
  const currentConversation = ref<Conversation | null>(null)
  const conversations = ref<Conversation[]>([])
  const isLoading = ref(false)
  const isTyping = ref(false)

  // 计算属性
  const currentMessages = computed(() => {
    return currentConversation.value?.messages || []
  })

  const hasMessages = computed(() => {
    return currentMessages.value.length > 0
  })

  // 创建新对话
  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    conversations.value.unshift(newConversation)
    currentConversation.value = newConversation
    saveToLocalStorage()
    
    return newConversation
  }

  // 添加消息
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!currentConversation.value) {
      createNewConversation()
    }

    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date()
    }

    currentConversation.value!.messages.push(newMessage)
    currentConversation.value!.updatedAt = new Date()
    saveToLocalStorage()
    
    return newMessage
  }

  // 更新消息（用于添加生成的代码）
  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    if (!currentConversation.value) return

    const messageIndex = currentConversation.value.messages.findIndex(m => m.id === messageId)
    if (messageIndex !== -1) {
      currentConversation.value.messages[messageIndex] = {
        ...currentConversation.value.messages[messageIndex],
        ...updates
      }
      currentConversation.value.updatedAt = new Date()
      saveToLocalStorage()
    }
  }

  // 切换对话
  const switchConversation = (conversationId: string) => {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      currentConversation.value = conversation
    }
  }

  // 删除对话
  const deleteConversation = (conversationId: string) => {
    const index = conversations.value.findIndex(c => c.id === conversationId)
    if (index !== -1) {
      conversations.value.splice(index, 1)
      
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value = conversations.value[0] || null
      }
      
      saveToLocalStorage()
    }
  }

  // 清空所有对话
  const clearAllConversations = () => {
    conversations.value = []
    currentConversation.value = null
    saveToLocalStorage()
  }

  // 保存到本地存储
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('simplemath_conversations', JSON.stringify(conversations.value))
      if (currentConversation.value) {
        localStorage.setItem('simplemath_current_conversation', currentConversation.value.id)
      }
    } catch (error) {
      console.error('Failed to save conversations to localStorage:', error)
    }
  }

  // 从本地存储加载
  const loadFromLocalStorage = () => {
    try {
      const savedConversations = localStorage.getItem('simplemath_conversations')
      const savedCurrentId = localStorage.getItem('simplemath_current_conversation')
      
      if (savedConversations) {
        const parsed = JSON.parse(savedConversations)
        conversations.value = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        
        if (savedCurrentId) {
          const current = conversations.value.find(c => c.id === savedCurrentId)
          if (current) {
            currentConversation.value = current
          }
        }
      }
    } catch (error) {
      console.error('Failed to load conversations from localStorage:', error)
    }
  }

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 初始化时加载数据
  loadFromLocalStorage()

  return {
    // 状态
    currentConversation,
    conversations,
    isLoading,
    isTyping,
    
    // 计算属性
    currentMessages,
    hasMessages,
    
    // 方法
    createNewConversation,
    addMessage,
    updateMessage,
    switchConversation,
    deleteConversation,
    clearAllConversations,
    loadFromLocalStorage
  }
})