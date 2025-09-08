import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { openaiService } from '@/services/openai'
import { useP5Store } from '@/stores/p5'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  generatedCode?: string
  timestamp: Date
  round?: number
  isProgress?: boolean
}

export interface ProcessingStatus {
  isProcessing: boolean
  currentRound: number
  totalRounds: number
  roundName: string
  roundResults: string[]
  completedRounds: number[]
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
  const error = ref<string | null>(null)
  
  // 处理状态
  const processingStatus = ref<ProcessingStatus>({
    isProcessing: false,
    currentRound: 0,
    totalRounds: 3,
    roundName: '',
    roundResults: [],
    completedRounds: []
  })
  
  // 三轮对话系统提示词模板
  const systemPrompts = {
    1: `你是一个专业的需求分析师，专门帮助用户分解和澄清数学动画需求。

请仔细分析用户的需求，并：
1. 识别核心的数学概念或算法
2. 确定动画的关键视觉元素
3. 明确交互需求（如果有）
4. 提出可能的实现方案
5. 询问需要澄清的细节

请用简洁明了的语言回复，帮助用户完善需求描述。`,
    
    2: `你是一个p5.js技术专家，专门评估动画实现的技术可行性。

基于前面的需求分析，请：
1. 确认p5.js的技术边界和限制
2. 评估实现的复杂度
3. 提出最优的技术方案
4. 识别可能的技术挑战
5. 建议具体的实现步骤

请确保方案在p5.js框架内可行，并为下一步的代码生成做好准备。`,
    
    3: `你是一个专业的p5.js代码生成专家，专门为数学概念和算法创建可视化动画代码。

## 请遵循以下规则：
1. 生成完整可运行的p5.js代码
2. 使用setup()和draw()函数结构
3. 代码应该是自包含的，不依赖外部资源
4. 添加适当的注释解释数学概念
5. 确保动画流畅且具有教育意义
6. 使用合适的颜色和视觉效果

## 返回示例代码如下：

\`\`\`javascript
function setup() {
  createCanvas(400, 400);
  background(220);
}

// ... 逻辑功能

function draw() {
  ellipse(mouseX, mouseY, 50, 50);
}
\`\`\`

请只返回p5.js代码，不要包含其他解释文字。`
  }

  // 计算属性
  const hasMessages = computed(() => {
    return currentConversation.value?.messages.length ?? 0 > 0
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

  // 发送消息 - 单次调用中连续进行3轮处理，展示每轮状态
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading.value) return
    
    try {
      isLoading.value = true
      error.value = null
      
      // 初始化处理状态
      processingStatus.value = {
        isProcessing: true,
        currentRound: 0,
        totalRounds: 3,
        roundName: '',
        roundResults: [],
        completedRounds: []
      }
      
      // 创建新对话（如果需要）
      if (!currentConversation.value) {
        createNewConversation()
      }
      
      // 添加用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date()
      }
      
      currentConversation.value!.messages.push(userMessage)
      
      // 轮次名称映射
      const roundNames = {
        1: '需求分析',
        2: '技术评估', 
        3: '代码生成'
      }
      
      // 连续进行3轮内部处理，展示每轮状态
      let currentContent = content
      let finalResponse = ''
      
      for (let round = 1; round <= 3; round++) {
        // 更新当前轮次状态
        processingStatus.value.currentRound = round
        processingStatus.value.roundName = roundNames[round as keyof typeof roundNames]
        
        // 添加进度消息
        const progressMessage: Message = {
          id: `progress-${round}-${Date.now()}`,
          content: `正在进行第${round}轮处理：${processingStatus.value.roundName}...`,
          role: 'system',
          timestamp: new Date(),
          round,
          isProgress: true
        }
        
        currentConversation.value!.messages.push(progressMessage)
        
        const systemPrompt = systemPrompts[round as keyof typeof systemPrompts]
        
        // 调用OpenAI API
        const response = await openaiService.generateResponse([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: currentContent }
        ])
        
        // 保存轮次结果
        processingStatus.value.roundResults.push(response)
        
        // 标记轮次为已完成
        processingStatus.value.completedRounds.push(round)
        
        // 移除进度消息，添加完成消息
        const messages = currentConversation.value!.messages
        const progressIndex = messages.findIndex(msg => msg.id === progressMessage.id)
        if (progressIndex !== -1) {
          messages.splice(progressIndex, 1)
        }
        
        // 添加轮次完成消息
        const roundCompleteMessage: Message = {
          id: `round-${round}-${Date.now()}`,
          content: `第${round}轮${processingStatus.value.roundName}完成`,
          role: 'system',
          timestamp: new Date(),
          round,
          isProgress: true
        }
        
        currentConversation.value!.messages.push(roundCompleteMessage)
        
        // 添加短暂延迟确保UI状态更新
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 添加轮次结果消息（除了第三轮，第三轮结果单独处理）
        if (round < 3) {
          const resultMessage: Message = {
            id: `result-${round}-${Date.now()}`,
            content: response,
            role: 'assistant',
            timestamp: new Date(),
            round
          }
          
          currentConversation.value!.messages.push(resultMessage)
        }
        
        // 将当前轮次的输出作为下一轮的输入
        currentContent = response
        
        // 第三轮的结果作为最终回复
        if (round === 3) {
          finalResponse = response
        }
      }
      
      // 添加最终AI回复
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: finalResponse,
        role: 'assistant',
        timestamp: new Date(),
        round: 3
      }
      
      currentConversation.value!.messages.push(aiMessage)
      
      // 如果包含p5.js代码，创建动画
      if (containsP5Code(finalResponse)) {
        const code = extractP5Code(finalResponse)
        if (code) {
          const p5Store = useP5Store()
          await p5Store.createAnimation(code, '生成的数学动画')
        }
      }
      
      // 重置处理状态
      processingStatus.value.isProcessing = false
      processingStatus.value.currentRound = 0
      processingStatus.value.roundName = ''
      processingStatus.value.roundResults = []
      processingStatus.value.completedRounds = []
      
      // 保存对话
      saveToLocalStorage()
      
    } catch (err) {
      console.error('Failed to send message:', err)
      error.value = err instanceof Error ? err.message : '发送消息失败'
      processingStatus.value.isProcessing = false
      processingStatus.value.currentRound = 0
      processingStatus.value.roundName = ''
      processingStatus.value.roundResults = []
      processingStatus.value.completedRounds = []
    } finally {
      isLoading.value = false
    }
  }

  // 辅助函数
  const containsP5Code = (text: string): boolean => {
    return text.includes('function setup') || text.includes('function draw')
  }

  const extractP5Code = (text: string): string | null => {
    const codeMatch = text.match(/```(?:javascript)?\n([\s\S]*?)\n```/)
    return codeMatch ? codeMatch[1] : null
  }

  // 初始化时加载数据
  loadFromLocalStorage()

  return {
    // 状态
    currentConversation,
    conversations,
    isLoading,
    error,
    processingStatus,
    
    // 计算属性
    hasMessages,
    
    // 方法
    createNewConversation,
    switchConversation,
    deleteConversation,
    clearAllConversations,
    loadFromLocalStorage,
    sendMessage
  }
})