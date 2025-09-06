import { useSettingsStore } from '@/stores/settings'
import type { Message } from '@/stores/conversation'

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIResponse {
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface GenerateCodeRequest {
  prompt: string
  conversationHistory?: Message[]
}

export interface GenerateCodeResponse {
  success: boolean
  code?: string
  explanation?: string
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

class OpenAIService {
  private getSettings() {
    const settingsStore = useSettingsStore()
    return settingsStore.settings
  }

  private getApiUrl(): string {
    const settings = this.getSettings()
    
    // 直接使用用户配置的Base URL
    let apiUrl = settings.baseUrl.trim()
    
    // 确保URL以/v1结尾，如果不是则添加
    if (!apiUrl.endsWith('/v1')) {
      apiUrl = apiUrl.replace(/\/$/, '') + '/v1'
    }
    
    return apiUrl
  }

  private async makeRequest(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
    const settings = this.getSettings()
    
    if (!settings.apiKey) {
      throw new Error('API密钥未配置，请在设置中配置OpenAI API密钥')
    }

    if (!settings.baseUrl) {
      throw new Error('Base URL未配置，请在设置中配置API服务器地址')
    }

    const requestBody = {
      model: settings.model,
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: false
    }

    const apiUrl = this.getApiUrl()
    const endpoint = `${apiUrl}/chat/completions`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(`OpenAI API请求失败: ${errorMessage}`)
    }

    return await response.json()
  }

  async generateCode(request: GenerateCodeRequest): Promise<GenerateCodeResponse> {
    try {
      const settings = this.getSettings()
      
      // 构建消息历史
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: settings.systemPrompt
        }
      ]

      // 添加对话历史（最近5条消息）
      if (request.conversationHistory && request.conversationHistory.length > 0) {
        const recentMessages = request.conversationHistory.slice(-5)
        for (const msg of recentMessages) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role,
              content: msg.content
            })
          }
        }
      }

      // 添加当前用户请求
      messages.push({
        role: 'user',
        content: request.prompt
      })

      const response = await this.makeRequest(messages)
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('OpenAI API返回了空的响应')
      }

      const assistantMessage = response.choices[0].message.content
      
      // 尝试提取代码块
      const codeMatch = assistantMessage.match(/```(?:javascript|js)?\s*([\s\S]*?)```/)
      let code = ''
      let explanation = assistantMessage

      if (codeMatch) {
        code = codeMatch[1].trim()
        // 移除代码块，保留解释
        explanation = assistantMessage.replace(/```(?:javascript|js)?\s*[\s\S]*?```/g, '').trim()
      } else {
        // 如果没有代码块标记，尝试检测是否整个响应都是代码
        const lines = assistantMessage.trim().split('\n')
        const codeKeywords = ['function', 'let', 'const', 'var', 'setup', 'draw', 'createCanvas']
        const hasCodeKeywords = lines.some(line => 
          codeKeywords.some(keyword => line.includes(keyword))
        )
        
        if (hasCodeKeywords) {
          code = assistantMessage.trim()
          explanation = '生成的p5.js动画代码'
        } else {
          explanation = assistantMessage
        }
      }

      return {
        success: true,
        code: code || undefined,
        explanation: explanation || undefined,
        usage: response.usage
      }
    } catch (error) {
      console.error('OpenAI API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testMessages: OpenAIMessage[] = [
        {
          role: 'system',
          content: '你是一个AI助手。'
        },
        {
          role: 'user',
          content: '请回复"连接测试成功"'
        }
      ]

      const response = await this.makeRequest(testMessages)
      
      if (response.choices && response.choices.length > 0) {
        return { success: true }
      } else {
        return { success: false, error: 'API响应格式异常' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '连接测试失败'
      }
    }
  }

  // 获取可用模型列表（如果API支持）
  async getAvailableModels(): Promise<string[]> {
    try {
      const settings = this.getSettings()
      
      if (!settings.baseUrl) {
        return []
      }

      const apiUrl = this.getApiUrl()
      const endpoint = `${apiUrl}/models`
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.data?.map((model: any) => model.id) || []
      }
    } catch (error) {
      console.warn('Failed to fetch available models:', error)
    }
    
    // 返回默认模型列表
    return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
  }
}

// 导出单例实例
export const openaiService = new OpenAIService()