// 全局变量，存储当前提取的文章内容
let currentArticleContent = '';
let articleContents = [];  // 存储多篇文章的内容
let chatHistory = [];  // 存储对话历史
let currentMode = 'single';  // 当前模式：单次分析或对话

// 热榜API配置
const HOTNEWS_API = {
    url: 'https://cn.apihz.cn/api/xinwen/toutiao.php',
    id: '10003913',
    key: '4c801b89a620e920d4efce67930a1f24'
};

// 小姐姐视频API配置
const VIDEO_API = {
    baseUrl: 'https://api.guiguiya.com/api/video/dyxjj?apiKey=7cd19eddedc85bf572e69083ce7bc784'
};

// 定义可用的AI模型
const AI_MODELS = {
    'deepseek-r1': {
        name: 'DeepSeek-R1',
        id: 'deepseek-ai/DeepSeek-R1',
        description: '擅长中文分析和理解的AI模型'
    },
    'deepseek-qwen': {
        name: 'DeepSeek-Qwen-7B',
        id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
        description: '轻量化高速模型'
    }
};

// 获取今日头条热榜
async function fetchHotNews() {
    const hotNewsContainer = document.getElementById('hotNews');
    const hotNewsLoading = document.getElementById('hotNewsLoading');
    const hotNewsList = document.getElementById('hotNewsList');
    
    // 显示加载动画
    hotNewsLoading.style.display = 'flex';
    hotNewsList.innerHTML = '';
    
    try {
        // 添加时间戳防止缓存
        const timestamp = new Date().getTime();
        const apiUrl = `${HOTNEWS_API.url}?id=${HOTNEWS_API.id}&key=${HOTNEWS_API.key}&_t=${timestamp}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 检查返回数据
        if (data.code !== 200 || !data.data || !Array.isArray(data.data)) {
            throw new Error('API返回无效数据');
        }
        
        // 处理热榜数据
        hotNewsList.innerHTML = '';
        
        data.data.forEach((news, index) => {
            if (index >= 15) return; // 最多显示15条
            
            const newsItem = document.createElement('div');
            newsItem.className = 'hot-news-item';
            
            // 获取类型标签
            let typeClass = '';
            let typeText = '热点';
            
            switch (news.tabtype) {
                case 0:
                    typeClass = 'trend';
                    typeText = '趋势';
                    break;
                case 2:
                    typeClass = 'hot';
                    typeText = '热点';
                    break;
                case 6:
                case 7:
                    typeClass = 'local';
                    typeText = '本地';
                    break;
                default:
                    typeClass = '';
                    typeText = '资讯';
            }
            
            // 格式化热度值
            const hotValue = parseInt(news.hot).toLocaleString();
            
            newsItem.innerHTML = `
                <a href="${news.url}" target="_blank">
                    <div class="hot-news-title">${news.title}</div>
                    <div class="hot-news-meta">
                        <span class="hot-news-type ${typeClass}">${typeText}</span>
                        <span class="hot-news-hot"><i class="fas fa-fire"></i>${hotValue}</span>
                    </div>
                </a>
            `;
            
            hotNewsList.appendChild(newsItem);
        });
        
        // 隐藏加载动画
        hotNewsLoading.style.display = 'none';
        
    } catch (error) {
        console.error('获取热榜失败:', error);
        hotNewsLoading.style.display = 'none';
        hotNewsList.innerHTML = `
            <div class="error-message">
                获取热榜失败: ${error.message}
                <button onclick="fetchHotNews()" class="retry-button">重试</button>
            </div>
        `;
    }
}

// 获取小姐姐视频
async function fetchRandomVideo() {
    const videoContainer = document.getElementById('randomVideo');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoLoading = document.getElementById('videoLoading');
    const videoError = document.getElementById('videoError');
    
    // 显示视频区域和加载动画
    videoContainer.style.display = 'block';
    videoLoading.style.display = 'flex';
    videoError.style.display = 'none';
    videoPlayer.style.display = 'none';
    
    // 滚动到视频区域
    videoContainer.scrollIntoView({ behavior: 'smooth' });
    
    try {
        // 检测是否为移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 构建视频URL，确保参数正确拼接
        const timestamp = new Date().getTime();
        const randomNum = Math.floor(Math.random() * 1000);
        const videoUrl = `${VIDEO_API.baseUrl}&t=${timestamp}&r=${randomNum}`;
        
        // 设置加载超时
        const loadTimeout = setTimeout(() => {
            if (videoLoading.style.display !== 'none') {
                videoLoading.style.display = 'none';
                videoError.textContent = '视频加载超时，请检查网络连接后重试';
                videoError.style.display = 'block';
            }
        }, 15000); // 15秒超时
        
        // 对于移动设备，优化播放体验
        if (isMobile) {
            videoPlayer.autoplay = false;
            videoPlayer.preload = "metadata"; // 只预加载元数据，减少流量消耗
            
            // 创建并显示播放提示
            let playTipDiv = document.querySelector('.video-play-tip');
            if (!playTipDiv) {
                playTipDiv = document.createElement('div');
                playTipDiv.className = 'video-play-tip';
                playTipDiv.innerHTML = '<i class="fas fa-play-circle"></i> 点击开始播放';
                videoContainer.insertBefore(playTipDiv, videoPlayer.nextSibling);
            }
            playTipDiv.style.display = 'flex';
            
            // 优化点击事件处理
            playTipDiv.onclick = async function() {
                try {
                    await videoPlayer.play();
                    playTipDiv.style.display = 'none';
                } catch (error) {
                    console.error('播放失败:', error);
                    videoError.textContent = '视频播放失败，请尝试点击视频播放按钮';
                    videoError.style.display = 'block';
                }
            };
        }
        
        // 设置视频源
        videoPlayer.src = videoUrl;
        videoPlayer.style.display = 'block';
        
        // 视频加载成功
        videoPlayer.onloadeddata = function() {
            clearTimeout(loadTimeout);
            videoLoading.style.display = 'none';
        };
        
        // 视频加载错误
        videoPlayer.onerror = function(e) {
            clearTimeout(loadTimeout);
            console.error('视频加载失败', e);
            videoLoading.style.display = 'none';
            
            let errorMessage = '';
            if (isMobile) {
                errorMessage = `
                    视频加载失败，可能原因：<br>
                    1. 网络连接不稳定，请检查网络后重试<br>
                    2. 浏览器限制了视频播放，请尝试使用其他浏览器<br>
                    3. 如果使用本地文件方式打开，请将网页部署到服务器<br>
                    4. <a href="${videoUrl}" target="_blank">点击这里</a>直接访问视频
                `;
            } else {
                errorMessage = '视频加载失败，请点击"换一个视频"重试';
            }
            videoError.innerHTML = errorMessage;
            videoError.style.display = 'block';
        };
        
        // 添加视频播放错误处理
        videoPlayer.onstalled = function() {
            videoError.textContent = '视频播放卡顿，请检查网络连接';
            videoError.style.display = 'block';
        };
        
    } catch (error) {
        console.error('获取视频失败:', error);
        videoLoading.style.display = 'none';
        videoError.textContent = '获取视频失败，请稍后重试';
        videoError.style.display = 'block';
    }
}

async function extractArticle(url) {
    try {
        // 提取有效链接部分
        const cleanUrl = extractToutiaoUrl(url);
        
        const apiUrl = `https://cn.apihz.cn/api/caiji/toutiao.php?id=10003913&key=4c801b89a620e920d4efce67930a1f24&idorurl=${encodeURIComponent(cleanUrl)}`;
        const response = await fetch(apiUrl);
        const text = await response.text();
        const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        const data = JSON.parse(cleanText);
        
        if (data.code === 200) {
            return {
                success: true,
                content: data.content2 || '',
                title: data.title || '',
                publishTime: data.publishTime || '',
                imageList: data.imageList || []
            };
        } else {
            return {
                success: false,
                error: '未找到文章内容'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// 提取今日头条有效链接
function extractToutiaoUrl(input) {
    // 匹配今日头条链接的正则表达式
    const regex = /(https?:\/\/[^\/]*toutiao\.com\/[^\s\-]+)/i;
    const match = input.match(regex);
    
    // 如果找到匹配，返回匹配的链接，否则返回原始输入
    return match ? match[1] : input;
}

async function extractArticles() {
    const urlsText = document.getElementById('articleUrls').value;
    if (!urlsText.trim()) {
        alert('请输入至少一个文章链接');
        return;
    }

    const urls = urlsText.split('\n').map(url => url.trim()).filter(url => url);
    if (urls.length === 0) {
        alert('请输入有效的文章链接');
        return;
    }

    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const aiAnalysis = document.getElementById('aiAnalysis');
    
    loading.style.display = 'flex';
    result.innerHTML = '';
    aiAnalysis.style.display = 'none';
    currentArticleContent = '';
    articleContents = [];  // 重置文章内容数组

    let successCount = 0;
    for (const [index, url] of urls.entries()) {
        const articleDiv = document.createElement('div');
        articleDiv.className = 'article';
        
        const articleHeader = document.createElement('div');
        articleHeader.className = 'article-header';
        
        const urlDiv = document.createElement('div');
        urlDiv.className = 'article-url';
        urlDiv.textContent = `文章${index + 1}: ${url}`;
        articleHeader.appendChild(urlDiv);
        
        articleDiv.appendChild(articleHeader);
        
        const articleBody = document.createElement('div');
        articleBody.className = 'article-body';
        articleDiv.appendChild(articleBody);

        result.appendChild(articleDiv);

        const response = await extractArticle(url);
        if (response.success) {
            successCount++;
            // 保存每篇文章的内容，带有标题和序号
            let articleContent = `文章${index + 1}：\n`;
            if (response.title) {
                articleContent += `标题：${response.title}\n`;
            }
            if (response.publishTime) {
                articleContent += `发布时间：${response.publishTime}\n`;
            }
            articleContent += `\n内容：\n${response.content}`;
            articleContents.push(articleContent);
            
            // 标题部分（如果有）
            if (response.title) {
                const titleSection = document.createElement('div');
                titleSection.className = 'section';
                
                const titleHeading = document.createElement('h2');
                titleHeading.style.margin = '0 0 16px 0';
                titleHeading.style.fontSize = '18px';
                titleHeading.style.fontWeight = '600';
                titleHeading.textContent = response.title;
                
                // 添加发布时间
                if (response.publishTime) {
                    const metaDiv = document.createElement('div');
                    metaDiv.className = 'article-meta';
                    
                    const timeDiv = document.createElement('div');
                    timeDiv.innerHTML = `<strong>发布时间：</strong>${response.publishTime}`;
                    metaDiv.appendChild(timeDiv);
                    
                    titleSection.appendChild(metaDiv);
                }
                
                titleSection.appendChild(titleHeading);
                articleBody.appendChild(titleSection);
            }
            
            // 内容部分
            const contentSection = document.createElement('div');
            contentSection.className = 'section';
            
            const contentTitle = document.createElement('div');
            contentTitle.className = 'section-title';
            contentTitle.textContent = '文章内容';
            contentSection.appendChild(contentTitle);
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'article-content';
            contentDiv.textContent = response.content;
            contentSection.appendChild(contentDiv);
            
            articleBody.appendChild(contentSection);
            
            // 图片部分
            if (response.imageList && response.imageList.length > 0) {
                const imagesSection = document.createElement('div');
                imagesSection.className = 'section';
                
                const imagesTitle = document.createElement('div');
                imagesTitle.className = 'section-title';
                imagesTitle.textContent = '图片地址';
                imagesSection.appendChild(imagesTitle);
                
                const imagesList = document.createElement('ul');
                imagesList.className = 'image-list';
                
                response.imageList.forEach(imageUrl => {
                    const imageItem = document.createElement('li');
                    imageItem.className = 'image-item';
                    imageItem.textContent = imageUrl;
                    imagesList.appendChild(imageItem);
                });
                
                imagesSection.appendChild(imagesList);
                articleBody.appendChild(imagesSection);
            }
            
            // 修改AI分析按钮文本以反映多文章状态
            const aiButton = document.createElement('button');
            aiButton.className = 'ai-btn';
            aiButton.innerHTML = `<i class="fas fa-brain"></i> 分析${successCount}篇文章`;
            aiButton.style.width = 'auto';
            aiButton.style.marginTop = '10px';
            aiButton.onclick = function() {
                aiAnalysis.style.display = 'block';
                aiAnalysis.scrollIntoView({ behavior: 'smooth' });
                document.getElementById('aiPrompt').value = '';
                document.getElementById('aiPrompt').placeholder = '请输入完整分析指令，如：作为一名专业编辑，请分析这篇文章的核心观点...';
                
                // 重置对话历史
                chatHistory = [];
                updateChatUI();
                
                // 默认设为单次分析模式
                currentMode = 'single';
                const modeButtons = document.querySelectorAll('.mode-btn');
                modeButtons.forEach(btn => {
                    if (btn.dataset.mode === 'single') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                
                // 显示/隐藏相关元素
                document.getElementById('chatContainer').style.display = 'none';
                document.querySelector('.prompt-section').style.display = 'block';
            };
            
            const aiButtonSection = document.createElement('div');
            aiButtonSection.className = 'section';
            aiButtonSection.appendChild(aiButton);
            articleBody.appendChild(aiButtonSection);
        } else {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = '提取失败: ' + response.error;
            articleBody.appendChild(errorDiv);
        }
    }

    loading.style.display = 'none';
    
    // 如果成功提取了内容，显示AI分析部分
    if (articleContents.length > 0) {
        aiAnalysis.style.display = 'block';
        // 更新当前文章内容，添加清晰的分隔和标记
        currentArticleContent = articleContents.join('\n\n========== 文章分隔 ==========\n\n');
        
        // 设置默认提示文本
        document.getElementById('aiPrompt').placeholder = '请输入完整分析指令，如：作为一名专业编辑，请分析这篇文章的核心观点...';
    }
}

// 更新进度显示
function updateProgress(step, message) {
    const steps = document.querySelectorAll('.progress-step');
    const lines = document.querySelectorAll('.progress-line');
    
    // 重置所有步骤
    steps.forEach((s, index) => {
        if (index < step) {
            s.classList.add('completed');
            s.classList.remove('active');
        } else if (index === step) {
            s.classList.add('active');
            s.classList.remove('completed');
        } else {
            s.classList.remove('active', 'completed');
        }
    });
    
    // 更新连接线
    lines.forEach((line, index) => {
        if (index < step) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
    
    // 更新消息
    document.getElementById('progressMessage').textContent = message;
}

// 更新思考过程显示
function updateThinkingProcess(step, content) {
    const thinkingContainer = document.getElementById('thinkingContent');
    
    // 创建新的思考步骤元素
    const stepElement = document.createElement('div');
    stepElement.className = 'thinking-step';
    stepElement.textContent = `步骤${step}: ${content.title || '分析中...'}`;
    
    // 创建思考内容元素
    const contentElement = document.createElement('div');
    contentElement.className = 'thinking-step-content';
    contentElement.textContent = content.text || '';
    
    // 将元素添加到思考容器
    thinkingContainer.appendChild(stepElement);
    thinkingContainer.appendChild(contentElement);
    
    // 滚动到底部
    thinkingContainer.scrollTop = thinkingContainer.scrollHeight;
}

// 更新对话UI
function updateChatUI() {
    const chatContainer = document.getElementById('chatMessages');
    if (!chatContainer) return;
    
    chatContainer.innerHTML = '';
    
    chatHistory.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;
        
        // 处理AI消息中的特殊格式
        if (msg.role === 'ai') {
            messageEl.innerHTML = formatAIResponse(msg.content);
        } else {
            messageEl.textContent = msg.content;
        }
        
        chatContainer.appendChild(messageEl);
    });
    
    // 滚动到最新消息
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function callAIService(prompt, content, modelName, isStreaming = true) {
    const API_KEY = 'sk-jbeveqraygumgvdodfysibdslduxpfjxjlulltjdfmabggfc'; 
    const API_ENDPOINT = 'https://api.siliconflow.cn'; 
    
    // 如果没有指定模型，使用默认模型
    const model = modelName || 'deepseek-ai/DeepSeek-R1';
    
    // 思考过程显示容器
    const thinkingSection = document.getElementById('aiThinking');
    const thinkingContent = document.getElementById('thinkingContent');
    
    if (isStreaming) {
        // 显示思考过程区域，并清空之前的内容
        thinkingSection.style.display = 'block';
        thinkingContent.innerHTML = '';
        
        // 添加初始思考步骤
        updateThinkingProcess(1, {
            title: '开始分析',
            text: `正在使用${model.split('/').pop()}模型处理请求...`
        });
    }
    
    // 构造请求消息
    let messages = [];
    
    // 处理内容 - 只在单次分析模式下预处理文章内容
    let processedContent = '';
    if (currentMode === 'single') {
        processedContent = optimizeContent(content, 3000);
        console.log(`使用模型: ${model} 进行分析，内容长度: ${processedContent.length} 字符`);
    }
    
    if (currentMode === 'chat' && chatHistory.length > 0) {
        // 对话模式：包含历史消息，不添加文章内容
        messages = chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
        
        // 添加当前用户消息 - 不附加文章内容
        messages.push({
            role: 'user',
            content: prompt
        });
    } else {
        // 单次分析模式 - 附加文章内容
        messages = [
            {
                role: 'user',
                content: `${prompt}\n\n文章内容：${processedContent}`
            }
        ];
    }
    
    try {
        const streamingOptions = isStreaming ? { stream: true } : { stream: false };
        
        const response = await fetch(`${API_ENDPOINT}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.6,
                max_tokens: 1500,
                ...streamingOptions
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            if (isStreaming) {
                updateThinkingProcess(3, {
                    title: '发生错误',
                    text: errorData?.error?.message || `HTTP错误: ${response.status}`
                });
            }
            return {
                success: false,
                error: errorData?.error?.message || `HTTP错误: ${response.status}`
            };
        }

        // 处理流式响应
        if (isStreaming) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = '';
            let thoughtStepCount = 1;
            
            // 创建一个缓冲区来积累思考步骤
            let thoughtBuffer = '';
            
            updateThinkingProcess(2, {
                title: '分析进行中',
                text: '正在思考...'
            });
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                const content = parsed.choices[0].delta.content;
                                accumulatedResponse += content;
                                thoughtBuffer += content;
                                
                                // 每积累一定量的文本或遇到段落标记时更新思考过程
                                if (thoughtBuffer.includes('\n\n') || thoughtBuffer.length > 150) {
                                    updateThinkingProcess(2, {
                                        title: `思考过程${thoughtStepCount++}`,
                                        text: thoughtBuffer
                                    });
                                    thoughtBuffer = '';
                                }
                            }
                        } catch (e) {
                            console.error('解析流数据错误:', e);
                        }
                    }
                }
            }
            
            // 处理最后剩余的思考内容
            if (thoughtBuffer.trim()) {
                updateThinkingProcess(2, {
                    title: `思考过程${thoughtStepCount}`,
                    text: thoughtBuffer
                });
            }
            
            // 添加最终响应步骤
            updateThinkingProcess(3, {
                title: '分析完成',
                text: '已生成分析结果'
            });
            
            return {
                success: true,
                content: accumulatedResponse
            };
        } else {
            // 处理非流式响应
            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                return {
                    success: false,
                    error: '无效的API响应格式'
                };
            }

            return {
                success: true,
                content: data.choices[0].message.content
            };
        }
    } catch (error) {
        console.error('AI服务调用失败:', error);
        if (isStreaming) {
            updateThinkingProcess(3, {
                title: '发生错误',
                text: error.message || '未知错误'
            });
        }
        return {
            success: false,
            error: error.message || '未知错误'
        };
    }
}

// 优化内容大小，提高响应速度
function optimizeContent(content, maxLength) {
    if (content.length <= maxLength) return content;
    
    // 如果是多篇文章，智能截取
    if (content.includes('========== 文章分隔 ==========')) {
        const articles = content.split('========== 文章分隔 ==========');
        const maxLengthPerArticle = Math.floor(maxLength / articles.length);
        
        return articles.map(article => {
            if (article.length <= maxLengthPerArticle) return article;
            
            // 保留标题和开头部分
            const titleMatch = article.match(/标题：.*?\n/);
            const titlePart = titleMatch ? titleMatch[0] : '';
            
            // 提取内容部分
            const contentStart = article.indexOf('内容：\n');
            if (contentStart > 0) {
                const contentPart = article.substring(contentStart + 4);
                // 提取内容的前部分
                const excerptLength = maxLengthPerArticle - titlePart.length - 8; // 8是"内容：\n"的长度
                return titlePart + '内容：\n' + contentPart.substring(0, excerptLength) + '...';
            }
            
            // 如果没有找到内容标记，直接截取
            return article.substring(0, maxLengthPerArticle) + '...';
        }).join('\n\n========== 文章分隔 ==========\n\n');
    }
    
    // 单篇文章直接截取
    return content.substring(0, maxLength) + '...';
}

// 格式化AI响应内容
function formatAIResponse(content) {
    // 首先分割内容为段落
    const paragraphs = content.split('\n\n');
    
    // 创建结构化的HTML
    let formattedHtml = '';
    
    // 处理每个段落
    paragraphs.forEach(paragraph => {
        // 检查是否是标题（以#开头）
        if (paragraph.startsWith('# ')) {
            formattedHtml += `<h3 class="ai-heading">${paragraph.substring(2)}</h3>`;
        } else if (paragraph.startsWith('## ')) {
            formattedHtml += `<h4 class="ai-subheading">${paragraph.substring(3)}</h4>`;
        } else if (paragraph.startsWith('- ')) {
            // 处理列表项
            const listItems = paragraph.split('\n').map(item => 
                `<li>${item.substring(2)}</li>`
            ).join('');
            formattedHtml += `<ul class="ai-list">${listItems}</ul>`;
        } else if (paragraph.includes('：') || paragraph.includes(':')) {
            // 处理键值对形式的内容
            formattedHtml += `<div class="ai-key-value">${paragraph.replace('\n', '<br>')}</div>`;
        } else {
            // 普通段落
            formattedHtml += `<p class="ai-paragraph">${paragraph}</p>`;
        }
    });
    
    return formattedHtml;
}

// 添加对话消息
function addChatMessage(role, content) {
    chatHistory.push({ role, content });
    updateChatUI();
}

// 在文档加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 获取热榜数据
    fetchHotNews();
    
    // 热榜刷新按钮
    document.getElementById('refreshHotNews').addEventListener('click', fetchHotNews);
    
    // 主题切换功能
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // 根据当前主题设置图标
    function updateThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        if (currentTheme === 'dark') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }
    
    // 初始化图标
    updateThemeIcon();
    
    // 切换主题
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeIcon();
        
        // 保存用户偏好到本地存储
        localStorage.setItem('theme', newTheme);
    });
    
    // 从本地存储加载用户偏好主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon();
    }
    
    // 设置模式切换
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.dataset.mode;
            
            // 更新按钮状态
            modeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 更新当前模式
            currentMode = mode;
            
            // 显示/隐藏相关元素
            const chatContainer = document.getElementById('chatContainer');
            const promptSection = document.querySelector('.prompt-section');
            
            if (mode === 'chat') {
                // 对话模式
                chatContainer.style.display = 'block';
                promptSection.style.display = 'none';
                
                // 更新对话输入框提示
                document.getElementById('chatInput').placeholder = '在这里输入您的指令或问题...';
                
                // 初始化对话界面
                updateChatUI();
            } else {
                // 单次分析模式
                chatContainer.style.display = 'none';
                promptSection.style.display = 'block';
                
                // 更新提示文本
                document.getElementById('aiPrompt').placeholder = '请输入完整分析指令，如：作为一名专业编辑，请分析这篇文章的核心观点...';
            }
        });
    });
    
    // AI分析按钮点击事件
    document.getElementById('startAI').addEventListener('click', async function() {
        if (!currentArticleContent) {
            alert('请先提取文章内容');
            return;
        }
        
        const prompt = document.getElementById('aiPrompt').value.trim();
        if (!prompt) {
            alert('请输入完整的AI分析指令');
            return;
        }
        
        // 获取选定的模型
        const modelSelector = document.getElementById('aiModel');
        const selectedModel = modelSelector ? modelSelector.value : 'deepseek-ai/DeepSeek-R1';
        
        const aiProgress = document.getElementById('aiProgress');
        const aiResult = document.getElementById('aiResult');
        const aiThinking = document.getElementById('aiThinking');
        
        aiProgress.style.display = 'block';
        aiThinking.style.display = 'block';
        aiResult.innerHTML = '';
        
        try {
            // 步骤1：准备数据
            updateProgress(0, '正在准备数据...');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 步骤2：分析中
            const modelDisplayName = selectedModel.split('/').pop();
            updateProgress(1, `正在使用 ${modelDisplayName} 进行分析...`);
            const startTime = Date.now();
            // 直接使用用户输入的完整指令
            const response = await callAIService(prompt, currentArticleContent, selectedModel, true);
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // 步骤3：生成结果
            updateProgress(2, `正在生成分析结果...`);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (response.success) {
                aiResult.innerHTML = `
                    <div class="ai-analysis-result">
                        <div class="ai-timestamp">分析时间：${new Date().toLocaleString()}</div>
                        <div class="ai-summary-badge">AI分析结果</div>
                        ${formatAIResponse(response.content)}
                    </div>
                `;
                updateProgress(2, `分析完成！(用时${elapsedTime}秒)`);
            } else {
                aiResult.innerHTML = `<div class="error-message">AI分析失败: ${response.error}</div>`;
                updateProgress(2, '分析失败');
            }
        } catch (error) {
            aiResult.innerHTML = `<div class="error-message">AI服务错误: ${error.message}</div>`;
            updateProgress(2, '分析出错');
        }
    });
    
    // 对话发送按钮点击事件
    document.getElementById('sendMessage').addEventListener('click', async function() {
        sendChatMessage();
    });
    
    // 聊天输入框回车发送
    document.getElementById('chatInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
    
    // 发送对话消息的函数
    async function sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        // 在对话模式下不再检查是否有文章内容
        
        // 清空输入框
        chatInput.value = '';
        
        // 添加用户消息到对话历史
        addChatMessage('user', message);
        
        // 获取选定的模型
        const modelSelector = document.getElementById('aiModel');
        const selectedModel = modelSelector ? modelSelector.value : 'deepseek-ai/DeepSeek-R1';
        
        const aiThinking = document.getElementById('aiThinking');
        aiThinking.style.display = 'block';
        
        try {
            // 先显示AI正在输入的提示
            const loadingMessage = { role: 'ai', content: '思考中...' };
            chatHistory.push(loadingMessage);
            updateChatUI();
            
            // 调用AI服务 - 直接使用用户的消息作为指令
            // 在对话模式下，传递空字符串作为content参数，函数内部会忽略它
            const response = await callAIService(message, '', selectedModel, true);
            
            // 移除加载消息
            chatHistory.pop();
            
            if (response.success) {
                // 添加AI响应到对话历史
                addChatMessage('ai', response.content);
            } else {
                // 添加错误消息
                addChatMessage('ai', `抱歉，我在处理您的请求时遇到了问题: ${response.error}`);
            }
        } catch (error) {
            // 移除加载消息
            chatHistory.pop();
            
            // 添加错误消息
            addChatMessage('ai', `抱歉，发生了错误: ${error.message}`);
        }
    }
    
    // 清除按钮功能
    document.getElementById('clearAI').addEventListener('click', function() {
        document.getElementById('aiResult').innerHTML = '';
        document.getElementById('aiPrompt').value = '';
        document.getElementById('thinkingContent').innerHTML = '';
        document.getElementById('aiThinking').style.display = 'none';
        chatHistory = [];
        updateChatUI();
    });
    
    // 复制结果按钮
    document.getElementById('copyResult').addEventListener('click', function() {
        const aiResult = document.getElementById('aiResult');
        const text = aiResult.innerText;
        
        if (!text.trim()) {
            alert('没有可复制的内容');
            return;
        }
        
        // 复制到剪贴板
        navigator.clipboard.writeText(text)
            .then(() => {
                // 显示复制成功提示
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> 已复制';
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            });
    });
    
    // 小姐姐视频按钮点击事件
    document.getElementById('randomVideoBtn').addEventListener('click', fetchRandomVideo);
    
    // 换一个视频按钮点击事件
    document.getElementById('newVideoBtn').addEventListener('click', fetchRandomVideo);
}); 