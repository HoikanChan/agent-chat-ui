# read code
use serena mcp

## 接口 url /freestyle

## 接口入参 
query(str) 用户输入 {"query":"P8848-崩坏星穹铁道-PTN830 设备 1/0/1 端口产生 ETH_LOS 告警，是什么原因？"}

## 接口出参 
- label(str) 接口的名称 
- content(str | dict) 接口返回内容,根据类型分为流式和非流式 
- return_type(enumerate["stream","noraml"]) 接口返回类型

另外对于流式接口，返回的第一组流式结果为 
`{ "label":"xxx", "content":"begin", "return_type":"stream" }`
最后一组流式结果为 
`{ "label":"xxx", "content":"complete", "return_type":"stream" }`

#### planning agent(指令生成机器人)接口 
##### 相关知识 
界面位置:右侧知识卡片 
`{ "label":"planning_agent_knowledge", "content":"xxx", "return_type":"normal" }`

##### 诊断大作文 
界面位置:左侧 知识查询机器人 
`{ "label":"planning_agent_troubleshooting_text", "content":"xxx", "return_type":"normal" }`

注：planning_agent_troubleshooting_text 当前为非流式，但之后会变为流式 

##### api 选择模型思考过程 
界面位置:左侧 网络状态感知机器人 灰色字 生成完自动折叠 
`{ "label":"troubleshooting_agent_model_thinking", "content":"xxx", "return_type":"stream" }` 
##### api 选择模型最终结果 
界面位置:网络状态感知机器人 灰色字 生成完自动折叠 
`{ "label":"troubleshooting_agent_refined_apis", "content":"xxx", "return_type":"stream" }` 

##### nl2code 
###### nlcode 模型思考结果 界面位置:网络状态感知机器人 灰色字 生成完自动折叠 `{ "label":"troubleshooting_agent_code_thinking", "content":"xxx", "return_type":"stream" }` 
##### 执行 api 结果 
界面位置:右侧 
网络状态 tab 
`{ "label":"troubleshooting_agent_mock_status_done", "content":"xxx", "return_type":"normal" }`

#### summarizing 
agent(根因分析机器人)接口 
界面位置:右侧分析过程 
注：之后会转为流式接口 
{ "label":"summarizing_agent_result", "content":"xxx", "return_type":"normal" }

content 具体内容自己 mock

#### 根因判断接口 
如果没有发现根因，返回 planning agent 
继续已有流程
界面位置:左侧 根因分析机器人 
注：此步规划插入用户交互，可以先考虑预留前端设计 
{ "label":"find_root_cause", "content":"xxx", "return_type":"normal" }

#### 最终总结接口 
界面位置:左侧 
最终总结 如果轮次达到 5 轮或发现根因 则输出最终结
{ "label":"final_summarizerr", "content":"xxx", "return_type":"normal" }

# Background
1. web是个开源项目做deep-research的项目
2. server是我做的mock server，为了跟真的server对接

# Task
1. 以server mock接口为基准，改造web，把他变成一个Chat bot，它背后有多种bot
- 知识查询机器人
- 网络状态感知机器人
- 根因分析机器人
2. 根据接口，返回不同bot的聊天结果
3. 同时chat-block右侧出现research-block，展示机器人查出来的数据
- 界面位置:右侧知识卡片 
`{ "label":"planning_agent_knowledge", "content":"xxx", "return_type":"normal" }`
- 界面位置:右侧分析过程 
注：之后会转为流式接口 
{ "label":"summarizing_agent_result", "content":"xxx", "return_type":"normal" }
- 界面位置:右侧分析过程 
注：之后会转为流式接口 
{ "label":"summarizing_agent_result", "content":"xxx", "return_type":"normal" }
4. 同时删除web中开源项目用不上的特性代码