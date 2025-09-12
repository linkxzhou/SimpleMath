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
    <script src="https://cdn.bootcdn.net/ajax/libs/gif.js/0.2.0/gif.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }
        .controls {
            background: #fff;
            border: 1px solid #ddd;
            border-bottom: none;
            padding: 10px;
            display: flex;
            gap: 8px;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            width: ${width}px;
            box-sizing: border-box;
        }
        .control-btn {
            background: #dbeafe;
            color: #1d4ed8;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            font-weight: 500;
        }
        .control-btn:hover {
            background: #bfdbfe;
        }
        .control-btn:disabled {
            background: #f3f4f6;
            color: #9ca3af;
            cursor: not-allowed;
        }
        .control-btn.active {
            background: #dc2626;
            color: white;
        }
        .control-btn.active:hover {
            background: #b91c1c;
        }
        .status {
            font-size: 12px;
            color: #666;
            margin-left: auto;
        }
        main {
            border: 1px solid #ddd;
            border-top: none;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .container {
            display: flex;
            flex-direction: column;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="controls">
            <button id="playPauseBtn" class="control-btn">⏸️ 暂停</button>
            <button id="resetBtn" class="control-btn">🔄 重置</button>
            <button id="recordBtn" class="control-btn">🔴 录制</button>
            <button id="downloadBtn" class="control-btn" disabled>💾 下载</button>
            <div class="status" id="status">运行中</div>
        </div>
        <main></main>
    </div>
    <script>
        // 设置默认画布尺寸
        const DEFAULT_WIDTH = ${width};
        const DEFAULT_HEIGHT = ${height};
        
        // 动画控制变量
        let isPlaying = true;
        let isRecording = false;
        let gif = null;
        let recordingFrames = [];
        let frameCount = 0;
        let gifLibLoaded = false;
        
        // 检查gif.js库是否加载成功
        function checkGifLibrary() {
          if (typeof GIF !== 'undefined') {
            gifLibLoaded = true;
            console.log('GIF library loaded successfully');
          } else {
            console.error('GIF library failed to load');
            // 禁用录制按钮
            const recordBtn = document.getElementById('recordBtn');
            const downloadBtn = document.getElementById('downloadBtn');
            if (recordBtn) {
              recordBtn.disabled = true;
              recordBtn.textContent = '录制不可用';
              recordBtn.style.backgroundColor = '#ccc';
            }
            if (downloadBtn) {
              downloadBtn.disabled = true;
              downloadBtn.style.backgroundColor = '#ccc';
            }
          }
        }
        
        // 页面加载完成后检查库
        window.addEventListener('load', function() {
          setTimeout(checkGifLibrary, 100);
        });
        
        // 获取控制按钮
        const playPauseBtn = document.getElementById('playPauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        const recordBtn = document.getElementById('recordBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const status = document.getElementById('status');
        
        // 播放/暂停控制
        playPauseBtn.addEventListener('click', () => {
            if (isPlaying) {
                noLoop();
                playPauseBtn.textContent = '▶️ 播放';
                status.textContent = '已暂停';
            } else {
                loop();
                playPauseBtn.textContent = '⏸️ 暂停';
                status.textContent = '运行中';
            }
            isPlaying = !isPlaying;
        });
        
        // 重置动画
        resetBtn.addEventListener('click', () => {
            if (typeof setup === 'function') {
                setup();
                if (!isPlaying) {
                    redraw();
                }
            }
            frameCount = 0;
            status.textContent = isPlaying ? '运行中' : '已暂停';
        });
        
        // 录制控制
        recordBtn.addEventListener('click', () => {
            if (!isRecording) {
                startRecording();
            } else {
                stopRecording();
            }
        });
        
        // 下载录制的GIF
        downloadBtn.addEventListener('click', () => {
            if (gif) {
                gif.render();
            }
        });
        
        // 开始录制
        function startRecording() {
            if (isRecording || !gifLibLoaded) return;
            
            try {
                isRecording = true;
                recordBtn.textContent = '⏹️ 停止';
                recordBtn.classList.add('active');
                status.textContent = '录制中...';
                downloadBtn.disabled = true;
                
                gif = new GIF({
                    workers: 2,
                    quality: 10,
                    width: DEFAULT_WIDTH,
                    height: DEFAULT_HEIGHT
                });
                
                gif.on('finished', function(blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'animation.gif';
                    a.click();
                    URL.revokeObjectURL(url);
                    downloadBtn.disabled = false;
                    status.textContent = 'GIF已生成';
                });
                
                recordingFrames = [];
            } catch (error) {
                console.error('Failed to start recording:', error);
                status.textContent = '录制启动失败';
            }
        }
        
        // 停止录制
        function stopRecording() {
            if (!isRecording || !gif) return;
            
            try {
                isRecording = false;
                recordBtn.textContent = '🔴 录制';
                recordBtn.classList.remove('active');
                status.textContent = '处理中...';
                
                // 添加录制的帧到GIF
                recordingFrames.forEach(frame => {
                    if (gif && typeof gif.addFrame === 'function') {
                        gif.addFrame(frame, {delay: 100});
                    }
                });
                
                if (gif && typeof gif.render === 'function') {
                    gif.render();
                } else {
                    throw new Error('GIF object is not properly initialized');
                }
            } catch (error) {
                console.error('Failed to stop recording:', error);
                status.textContent = '录制失败';
                isRecording = false;
                recordBtn.textContent = '🔴 录制';
                recordBtn.classList.remove('active');
            }
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                playPauseBtn.click();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                resetBtn.click();
            }
        });
        
        // 保存原始的draw函数
        let originalDraw = null;
        
        // 用户代码
        ${code}
        
        // 如果用户没有定义setup函数，提供默认的
        if (typeof setup === 'undefined') {
            function setup() {
                createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
                background(220);
            }
        }
        
        // 包装draw函数以支持录制
        if (typeof draw === 'function') {
            originalDraw = draw;
            window.draw = function() {
                originalDraw();
                
                // 录制帧
                if (isRecording && frameCount % 3 === 0) { // 每3帧录制一次以减少文件大小
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                        recordingFrames.push(canvas);
                    }
                }
                frameCount++;
            };
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
    console.log('OpenAI API body:', body)
    
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