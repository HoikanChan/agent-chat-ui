const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS配置（如果需要跨域）
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    
    next();
});

// Mock数据生成函数
const generateMockContent = {
    // Planning Agent 相关知识
    planning_agent_knowledge: () => ({
        title: "ETH_LOS告警相关知识",
        sections: [
            {
                subtitle: "告警定义",
                content: "ETH_LOS（Ethernet Loss of Signal）表示以太网信号丢失告警，通常发生在物理层。"
            },
            {
                subtitle: "常见原因",
                content: [
                    "光纤断裂或弯曲半径过小",
                    "光模块故障或不匹配",
                    "端口配置错误",
                    "设备电源异常"
                ]
            },
            {
                subtitle: "处理建议",
                content: "1. 检查光纤连接\n2. 确认光模块状态\n3. 验证端口配置\n4. 查看设备日志"
            }
        ]
    }),

    // Planning Agent 诊断大作文
    planning_agent_troubleshooting_text: () => 
        `根据您提供的信息，PTN830设备1/0/1端口产生ETH_LOS告警，这是一个物理层的信号丢失问题。

分析过程：
1. 告警类型识别：ETH_LOS属于物理层告警，表明端口无法检测到有效的以太网信号。

2. 可能的故障点：
   - 物理连接问题（70%概率）：光纤断裂、接头污染、弯曲半径过小
   - 光模块问题（20%概率）：模块故障、不匹配、松动
   - 设备端口问题（10%概率）：端口故障、配置错误

3. 建议的排查步骤：
   步骤1：检查物理连接
   - 确认光纤是否正确插入
   - 检查光纤是否有明显损伤
   - 清洁光纤接头
   
   步骤2：验证光模块
   - 重新插拔光模块
   - 检查光功率是否在正常范围
   - 确认光模块型号匹配性
   
   步骤3：端口配置检查
   - 验证端口使能状态
   - 检查速率双工配置
   - 确认VLAN等配置

4. 预期结果：
   通过以上步骤，90%的ETH_LOS告警可以得到解决。如问题依然存在，可能需要更换光模块或联系厂商支持。`,

    // API选择模型思考过程（流式）
    troubleshooting_agent_model_thinking: () => [
        "正在分析告警类型ETH_LOS...",
        "识别到这是一个物理层告警，需要调用物理层相关的诊断API...",
        "匹配相关API列表：get_port_status, get_optical_power, get_port_statistics...",
        "根据告警特征，优先级排序：1.get_optical_power 2.get_port_status 3.get_port_statistics...",
        "生成API调用序列..."
    ],

    // API选择最终结果（流式）
    troubleshooting_agent_refined_apis: () => [
        "已选择诊断API列表：",
        "1. get_optical_power(device='PTN830', port='1/0/1') - 获取光功率信息",
        "2. get_port_status(device='PTN830', port='1/0/1') - 获取端口状态",
        "3. get_port_statistics(device='PTN830', port='1/0/1') - 获取端口统计",
        "4. get_alarm_history(device='PTN830', port='1/0/1', type='ETH_LOS') - 获取历史告警",
        "5. get_device_log(device='PTN830', severity='ERROR', last_hours=24) - 获取设备日志"
    ],

    // NL2Code思考结果（流式）
    troubleshooting_agent_code_thinking: () => [
        "开始将自然语言转换为代码...",
        "解析设备信息：device_id='PTN830', port_id='1/0/1'",
        "构建查询条件：alarm_type='ETH_LOS', time_range=last_24h",
        "生成Python诊断脚本：",
        "```python",
        "# 导入必要的库",
        "import network_api as api",
        "import datetime",
        "",
        "# 设备和端口信息",
        "device = 'PTN830'",
        "port = '1/0/1'",
        "",
        "# 执行诊断",
        "optical_power = api.get_optical_power(device, port)",
        "port_status = api.get_port_status(device, port)",
        "statistics = api.get_port_statistics(device, port)",
        "```",
        "代码生成完成，准备执行..."
    ],

    // 执行API结果
    troubleshooting_agent_mock_status_done: () => ({
        optical_power: {
            rx_power: "-40 dBm",
            tx_power: "2.3 dBm",
            status: "RX_POWER_LOW"
        },
        port_status: {
            admin_state: "UP",
            oper_state: "DOWN",
            speed: "1000 Mbps",
            duplex: "FULL"
        },
        statistics: {
            rx_packets: 0,
            tx_packets: 15234,
            rx_errors: 0,
            tx_errors: 0,
            last_flap: "2024-01-15 10:23:45"
        },
        diagnosis: "检测到接收光功率过低（-40 dBm），正常范围应为-3到-20 dBm"
    }),

    // 根因分析结果
    summarizing_agent_result: () => ({
        root_cause_analysis: {
            confidence: "95%",
            primary_cause: "光纤接收方向故障",
            evidence: [
                "接收光功率异常低（-40 dBm）",
                "发送光功率正常（2.3 dBm）",
                "端口管理状态UP但操作状态DOWN",
                "只有发送方向有数据包"
            ],
            recommendations: [
                {
                    priority: "HIGH",
                    action: "检查并清洁光纤接收方向接头"
                },
                {
                    priority: "MEDIUM",
                    action: "如果清洁无效，更换光纤跳线"
                },
                {
                    priority: "LOW",
                    action: "检查对端设备发送光功率"
                }
            ]
        }
    }),

    // 根因判断
    find_root_cause: () => ({
        found: true,
        confidence: 95,
        root_cause: "光纤接收链路故障导致信号丢失",
        next_action: "proceed_to_solution"
    }),

    // 最终总结
    final_summarizerr: () => ({
        summary: "诊断完成",
        problem: "PTN830设备1/0/1端口ETH_LOS告警",
        root_cause: "光纤接收方向信号丢失，接收光功率过低（-40 dBm）",
        solution: "1. 清洁光纤接头\n2. 必要时更换光纤跳线\n3. 验证对端设备状态",
        estimated_fix_time: "15-30分钟",
        impact: "该端口业务中断",
        prevention: "定期检查光功率，建立基线监控"
    })
};

// 流式发送函数
async function streamResponse(res, label, contentGenerator, isStream = false) {
    if (!isStream) {
        // 非流式，直接发送
        const content = typeof contentGenerator === 'function' ? contentGenerator() : contentGenerator;
        res.write(`data: ${JSON.stringify({
            label,
            content,
            return_type: "normal"
        })}\n\n`);
        return;
    }

    // 流式发送
    // 发送开始标记
    res.write(`data: ${JSON.stringify({
        label,
        content: "begin",
        return_type: "stream"
    })}\n\n`);

    // 逐条发送内容
    const contents = typeof contentGenerator === 'function' ? contentGenerator() : contentGenerator;
    const contentArray = Array.isArray(contents) ? contents : [contents];
    
    for (const content of contentArray) {
        await new Promise(resolve => setTimeout(resolve, 300)); // 模拟延迟
        // 去除内容结尾的换行符
        const cleanContent = typeof content === 'string' ? content.replace(/\n+$/, '') : content;
        res.write(`data: ${JSON.stringify({
            label,
            content: cleanContent,
            return_type: "stream"
        })}\n\n`);
    }

    // 发送结束标记
    await new Promise(resolve => setTimeout(resolve, 200));
    res.write(`data: ${JSON.stringify({
        label,
        content: "complete",
        return_type: "stream"
    })}\n\n`);
}

// 回放服务器接口 - 使用固定的replay.txt文件
app.get('/api/replay', async (req, res) => {
    const filename = 'replay.txt'; // 固定文件名
    
    console.log('开始回放固定文件:', filename);

    // 设置SSE响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    try {
        // 构建文件路径 - 这里假设replay文件放在server目录下的replay文件夹
        const replayDir = path.join(__dirname, 'replay');
        const filePath = path.join(replayDir, filename);

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            res.write(`data: ${JSON.stringify({
                error: `文件 ${filename} 不存在`
            })}\n\n`);
            res.end();
            return;
        }

        // 读取文件内容
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim().startsWith('data:'));

        console.log(`读取到 ${lines.length} 行SSE数据`);

        // 逐行发送数据，模拟流式传输
        for (const line of lines) {
            // 提取data:后面的内容
            const dataContent = line.substring(5).trim(); // 去掉"data:"前缀
            
            if (dataContent) {
                // 直接发送原始数据行
                res.write(`data: ${dataContent}\n\n`);
                
                // 模拟延迟，让流式效果更真实
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // 发送结束信号
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('回放文件错误:', error);
        res.write(`data: ${JSON.stringify({
            error: error.message
        })}\n\n`);
        res.end();
    }
});

// 获取可用的replay文件列表
app.get('/api/replay/files', (req, res) => {
    try {
        const replayDir = path.join(__dirname, 'replay');
        
        // 如果replay目录不存在，创建它
        if (!fs.existsSync(replayDir)) {
            fs.mkdirSync(replayDir, { recursive: true });
        }

        const files = fs.readdirSync(replayDir)
            .filter(file => file.endsWith('.txt'))
            .map(file => {
                const filePath = path.join(replayDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                };
            });

        res.json({ files });
    } catch (error) {
        console.error('获取文件列表错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 聊天流式接口
app.post('/api/chat/stream', async (req, res) => {
    const { messages } = req.body;
    
    console.log('收到聊天请求:', messages);

    // 设置SSE响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // 禁用Nginx缓冲
    });

    try {
        // 模拟AI回复
        const responses = [
            "你好！我是DeerFlow AI助手。",
            "关于埃菲尔铁塔的高度问题，让我来帮你分析一下。",
            "埃菲尔铁塔高度约330米，而世界最高建筑迪拜塔高度约828米。",
            "所以埃菲尔铁塔大约是世界最高建筑的0.4倍，或者说世界最高建筑约比埃菲尔铁塔高2.5倍。"
        ];

        for (let i = 0; i < responses.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            res.write(`data: ${JSON.stringify({
                content: responses[i],
                role: "assistant",
                done: i === responses.length - 1
            })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('聊天流式响应错误:', error);
        res.write(`data: ${JSON.stringify({
            error: error.message
        })}\n\n`);
        res.end();
    }
});

// 主接口
app.post('/freestyle', async (req, res) => {
    const { query } = req.body;
    
    console.log('收到请求:', query);

    // 设置SSE响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // 禁用Nginx缓冲
    });

    try {
        // 1. 知识查询机器人 相关知识（非流式）
        await new Promise(resolve => setTimeout(resolve, 500));
        await streamResponse(res, 'planning_agent_knowledge', generateMockContent.planning_agent_knowledge, false);

        // 2. 知识查询机器人 诊断大作文（非流式，但标注后续会改为流式）
        await new Promise(resolve => setTimeout(resolve, 800));
        await streamResponse(res, 'planning_agent_troubleshooting_text', generateMockContent.planning_agent_troubleshooting_text, false);

        // 3. 网络状态感知机器人思考过程（流式）
        await new Promise(resolve => setTimeout(resolve, 500));
        await streamResponse(res, 'troubleshooting_agent_model_thinking', generateMockContent.troubleshooting_agent_model_thinking, true);

        // 4. 网络状态感知机器人最终结果（流式）
        await new Promise(resolve => setTimeout(resolve, 500));
        await streamResponse(res, 'troubleshooting_agent_refined_apis', generateMockContent.troubleshooting_agent_refined_apis, true);

        // 5. 网络状态感知机器人 思考结果（流式）
        await new Promise(resolve => setTimeout(resolve, 500));
        await streamResponse(res, 'troubleshooting_agent_code_thinking', generateMockContent.troubleshooting_agent_code_thinking, true);

        // 6. 网络状态感知机器人 执行API结果（非流式）
        await new Promise(resolve => setTimeout(resolve, 1000));
        await streamResponse(res, 'troubleshooting_agent_mock_status_done', generateMockContent.troubleshooting_agent_mock_status_done, false);

        // 7. 根因分析机器人（非流式，但标注后续会改为流式）
        await new Promise(resolve => setTimeout(resolve, 800));
        await streamResponse(res, 'summarizing_agent_result', generateMockContent.summarizing_agent_result, false);

        // // 8. 根因判断（非流式）
        // await new Promise(resolve => setTimeout(resolve, 500));
        // await streamResponse(res, 'find_root_cause', generateMockContent.find_root_cause, false);

        // 9. 最终总结（非流式）
        await new Promise(resolve => setTimeout(resolve, 500));
        await streamResponse(res, 'final_summarizerr', generateMockContent.final_summarizerr, false);

        // 发送结束信号
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('流式响应错误:', error);
        res.write(`data: ${JSON.stringify({
            error: error.message
        })}\n\n`);
        res.end();
    }
});

// 配置接口
app.get('/api/config', (req, res) => {
    res.json({ 
        models: {
            chat: ["gpt-4"],
            reasoning: ["o1-preview"]
        },
        features: {
            deepThinking: true,
            investigation: true
        }
    });
});

// 提供测试页面
app.get('/test-replay', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-replay.html'));
});

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`流式Mock服务器已启动: http://localhost:${PORT}`);
    console.log(`测试接口: POST http://localhost:${PORT}/freestyle`);
    console.log(`回放接口: GET http://localhost:${PORT}/api/replay`);
    console.log(`文件列表: GET http://localhost:${PORT}/api/replay/files`);
    console.log(`回放测试页面: http://localhost:${PORT}/test-replay`);
    console.log(`健康检查: GET http://localhost:${PORT}/health`);
});