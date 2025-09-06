import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

// 环境变量配置
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'

// 内存存储
interface Animation {
  id: string
  code: string
  title?: string
  width: number
  height: number
  createdAt: Date
  html: string
}

const animations = new Map<string, Animation>()

// 中间件
app.use(cors())
app.use(express.json())

// 静态文件服务 - 服务编译后的前端文件
app.use(express.static(path.join(__dirname, '../dist')))

// 生成HTML模板
function generateHTML(code: string, width: number = 800, height: number = 800): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>p5.js Animation</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
    <style>
        body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
        }
        main {
            border: 1px solid #ccc;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <main></main>
    <script>
        // 设置默认画布尺寸
        const DEFAULT_WIDTH = ${width};
        const DEFAULT_HEIGHT = ${height};
        
        // 用户代码
        ${code}
        
        // 如果用户没有定义setup函数，提供默认的
        if (typeof setup === 'undefined') {
            function setup() {
                createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
                background(220);
            }
        }
    </script>
</body>
</html>
  `
}

// API路由

// 创建新动画
app.post('/api/p5/create', (req, res) => {
  try {
    const { code, title, width = 400, height = 400 } = req.body
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Code is required and must be a string'
      })
    }
    
    const id = uuidv4()
    const html = generateHTML(code, width, height)
    
    const animation: Animation = {
      id,
      code,
      title,
      width,
      height,
      createdAt: new Date(),
      html
    }
    
    animations.set(id, animation)
    
    res.json({
      success: true,
      url: `http://localhost:${PORT}/animation/${id}`,
      id
    })
  } catch (error) {
    console.error('Error creating animation:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// 获取动画信息
app.get('/api/p5/:id', (req, res) => {
  try {
    const { id } = req.params
    const animation = animations.get(id)
    
    if (!animation) {
      return res.status(404).json({
        success: false,
        error: 'Animation not found'
      })
    }
    
    res.json({
      success: true,
      code: animation.code,
      title: animation.title,
      width: animation.width,
      height: animation.height,
      createdAt: animation.createdAt
    })
  } catch (error) {
    console.error('Error getting animation:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// 访问动画页面
app.get('/animation/:id', (req, res) => {
  try {
    const { id } = req.params
    const animation = animations.get(id)
    
    if (!animation) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Animation Not Found</title></head>
        <body>
          <h1>Animation Not Found</h1>
          <p>The requested animation could not be found.</p>
        </body>
        </html>
      `)
    }
    
    res.setHeader('Content-Type', 'text/html')
    res.send(animation.html)
  } catch (error) {
    console.error('Error serving animation:', error)
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Server Error</title></head>
      <body>
        <h1>Server Error</h1>
        <p>An error occurred while loading the animation.</p>
      </body>
      </html>
    `)
  }
})

// OpenAI API 透传接口
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { body, headers } = req
    
    // 获取Authorization头，优先使用请求头中的，其次使用环境变量
    let authHeader = headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (OPENAI_API_KEY) {
        authHeader = `Bearer ${OPENAI_API_KEY}`
      } else {
        return res.status(401).json({
          error: {
            message: 'Missing or invalid Authorization header and no OPENAI_API_KEY in environment',
            type: 'invalid_request_error'
          }
        })
      }
    }

    // 准备请求头
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'User-Agent': 'SimpleMath/1.0'
    }

    // 使用环境变量中的API_BASE构建完整URL
    const apiUrl = `${OPENAI_API_BASE}/chat/completions`
    
    // 调用OpenAI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    // 记录请求日志
    console.log(`OpenAI API call: ${response.status} - Model: ${body.model || 'unknown'} - URL: ${apiUrl}`)
    
    // 返回响应
    res.status(response.status).json(data)
    
  } catch (error) {
    console.error('OpenAI API proxy error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error while calling OpenAI API',
        type: 'api_error'
      }
    })
  }
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    animations: animations.size
  })
})

// 前端路由处理 - 所有非API路由都返回index.html
app.use((req, res, next) => {
  // 跳过API路由、animation路由和health检查
  if (req.path.startsWith('/api/') || req.path.startsWith('/animation/') || req.path === '/health') {
    return next()
  }
  
  // 只处理GET请求
  if (req.method === 'GET') {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  } else {
    next()
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app