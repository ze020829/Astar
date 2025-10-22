# Astra Token DApp 前端

## 📖 项目简介

这是 Astra Token 项目的去中心化应用（DApp）前端，提供了与智能合约交互的用户界面。

## ✨ 功能特性

- 📊 **账户总览** - 查看代币余额、质押状态、锁仓信息
- 💎 **质押挖矿** - 质押 ASTRA 代币赚取奖励
- 🔒 **代币锁仓** - 查看和领取锁仓代币
- 💧 **流动性管理** - 添加 Uniswap 流动性
- 🔮 **预言机监控** - 查看预言机状态和触发检查

## 🚀 快速开始

### 前置要求

- Node.js >= 14
- MetaMask 浏览器扩展
- 测试网 ETH（用于支付 gas 费）

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
npm start
```

应用将在 http://localhost:3000 打开

### 构建生产版本

```bash
npm run build
```

## 🔧 配置

### 合约地址配置

在 `src/contexts/Web3Context.js` 中配置合约地址：

```javascript
const CONTRACT_ADDRESSES = {
  astraToken: "0xe8174d551fd69c9ec98a09033c0885a2efbeb52c",
  stakingPool: "0xf035e4d39503c551b1503d7ee1e29826f80cf4b3",
  liquidityManager: "0x18f98d0c305b6c7b2b272407ac5fa04a67df53c7",
  oracleMonitor: "0x5e4760f19dabec6711e46ec25d9a2aac50b63f2d",
  uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
};
```

## 📱 使用说明

### 1. 连接钱包

点击右上角"连接钱包"按钮，在 MetaMask 中授权连接。

### 2. 质押代币

1. 进入"质押"页面
2. 输入要质押的 ASTRA 数量
3. 点击"质押"按钮并确认交易
4. 等待交易确认

### 3. 领取奖励

1. 在"质押"页面查看待领取奖励
2. 点击"领取奖励"按钮
3. 确认交易

### 4. 查看锁仓

1. 进入"锁仓"页面
2. 查看锁仓进度和可释放数量
3. 点击"领取"按钮领取已释放的代币

### 5. 添加流动性（需要 Owner 权限）

1. 进入"流动性"页面
2. 输入 ASTRA 和 ETH 数量
3. 点击"添加流动性"
4. 确认交易

### 6. 预言机监控（需要 Owner 权限）

1. 进入"预言机"页面
2. 查看当前状态
3. 点击"立即检查"执行检查
4. 可以更新检查周期和销毁数量

## 🛠️ 技术栈

- **React 18** - UI 框架
- **Ethers.js v6** - 以太坊交互库
- **Tailwind CSS** - CSS 框架
- **Create React App** - 项目脚手架

## 📁 项目结构

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js          # 页头组件
│   │   ├── Dashboard.js       # 总览页面
│   │   ├── Staking.js         # 质押页面
│   │   ├── Vesting.js         # 锁仓页面
│   │   ├── Liquidity.js       # 流动性页面
│   │   └── Oracle.js          # 预言机页面
│   ├── contexts/
│   │   └── Web3Context.js     # Web3 上下文
│   ├── App.js                 # 主应用
│   ├── index.js               # 入口文件
│   └── index.css              # 全局样式
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## ⚠️ 注意事项

### 网络兼容性

- 完全支持以太坊主网
- 测试网可用（Uniswap 池子信息可能不可用）
- 确保 MetaMask 连接到正确的网络

### 权限说明

某些功能需要合约 owner 权限：
- 通过合约添加流动性
- 执行预言机检查
- 更新预言机参数

### 安全提示

- 确认交易前仔细检查参数
- 保管好私钥，不要泄露给任何人
- 在测试网充分测试后再使用主网
- 注意 gas 费用设置

## 🐛 故障排查

### 连接钱包失败

- 检查是否安装 MetaMask
- 确认 MetaMask 已解锁
- 尝试刷新页面

### 交易失败

- 检查钱包 ETH 余额是否充足（需要支付 gas）
- 确认合约地址配置正确
- 查看 MetaMask 错误信息

### 显示数据错误

- 刷新页面重新加载数据
- 检查网络连接
- 确认合约已部署

## 📚 相关文档

- [主项目 README](../README.md)
- [合约分析报告](../CONTRACT_ANALYSIS.md)
- [关键问题修复](../CRITICAL_ISSUES.md)

## 💡 开发建议

### 添加新功能

1. 在 `src/components/` 创建新组件
2. 在 `App.js` 中注册路由
3. 在 `Web3Context.js` 中添加必要的 ABI

### 调试技巧

- 使用浏览器开发者工具查看控制台
- MetaMask 提供详细的交易错误信息
- 使用 `console.log` 调试数据流

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**Built with ❤️ for Astra Token**

