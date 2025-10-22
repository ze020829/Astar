// 主应用程序类
class AstraApp {
    constructor() {
        this.isInitialized = false;
        this.currentTab = 'dashboard';
        this.refreshInterval = null;
        this.data = {};
    }

    // 初始化应用
    async init() {
        try {
            this.setupEventListeners();
            this.showTab('dashboard');
            await this.checkWalletConnection();
            this.isInitialized = true;
            console.log('Astra DApp 初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showMessage(error.message, 'error');
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 钱包连接按钮
        const connectWalletBtn = document.getElementById('connectWallet');
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', () => {
                this.connectWallet();
            });
        } else {
            console.error('找不到 connectWallet 按钮');
        }

        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.showTab(tabId);
            });
        });

        // 质押操作
        const stakeBtn = document.getElementById('stakeBtn');
        if (stakeBtn) {
            stakeBtn.addEventListener('click', () => {
                this.handleStake();
            });
        }

        const claimBtn = document.getElementById('claimBtn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => {
                this.handleClaimRewards();
            });
        }

        const withdrawBtn = document.getElementById('withdrawBtn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => {
                this.handleWithdraw();
            });
        }

        // 流动性操作
        const addLiquidityBtn = document.getElementById('addLiquidityBtn');
        if (addLiquidityBtn) {
            addLiquidityBtn.addEventListener('click', () => {
                this.handleAddLiquidity();
            });
        }

        // 预言机操作
        const triggerBtn = document.getElementById('triggerBtn');
        if (triggerBtn) {
            triggerBtn.addEventListener('click', () => {
                this.handleTriggerOracle();
            });
        }

        const setPeriodBtn = document.getElementById('setPeriodBtn');
        if (setPeriodBtn) {
            setPeriodBtn.addEventListener('click', () => {
                this.handleSetPeriod();
            });
        }

        const setBurnBtn = document.getElementById('setBurnBtn');
        if (setBurnBtn) {
            setBurnBtn.addEventListener('click', () => {
                this.handleSetBurn();
            });
        }

        // 刷新按钮
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
    }

    // 检查钱包连接状态
    async checkWalletConnection() {
        if (window.web3Utils.isMetaMaskInstalled()) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.connectWallet();
                }
            } catch (error) {
                console.log('检查钱包连接失败:', error);
            }
        }
    }

    // 连接钱包
    async connectWallet() {
        try {
            this.showMessage('正在连接钱包...', 'info');
            
            const connection = await window.web3Utils.connectWallet();
            
            // 检查网络
            const isCorrectNetwork = await window.web3Utils.checkNetwork();
            if (!isCorrectNetwork) {
                await window.web3Utils.switchNetwork();
            }

            // 初始化合约
            await window.contractManager.initContracts();
            
            // 设置事件监听
            window.contractManager.setupEventListeners();

            // 更新UI
            this.updateWalletUI(connection.account);
            
            // 加载数据
            await this.loadAllData();
            
            // 开始定期刷新
            this.startRefreshInterval();

            this.showMessage(CONFIG.SUCCESS_MESSAGES.WALLET_CONNECTED, 'success');
        } catch (error) {
            console.error('连接钱包失败:', error);
            this.showMessage(error.message, 'error');
        }
    }

    // 更新钱包UI
    updateWalletUI(account) {
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        
        connectBtn.textContent = '已连接';
        connectBtn.disabled = true;
        connectBtn.classList.remove('btn-primary');
        connectBtn.classList.add('btn-secondary');
        
        walletInfo.innerHTML = `
            <div class="connection-status connected"></div>
            <div>
                <div>${window.web3Utils.formatAddress(account)}</div>
                <div>以太坊主网</div>
            </div>
        `;
    }

    // 显示标签
    showTab(tabId) {
        // 隐藏所有标签内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 移除所有标签按钮的激活状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 显示选中的标签内容
        document.getElementById(tabId).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        this.currentTab = tabId;

        // 如果钱包已连接，刷新当前标签的数据
        if (window.web3Utils.isConnected) {
            this.refreshTabData(tabId);
        }
    }

    // 加载所有数据
    async loadAllData() {
        try {
            this.data = await window.contractManager.getAllData();
            this.updateAllUI();
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showMessage('加载数据失败: ' + error.message, 'error');
        }
    }

    // 更新所有UI
    updateAllUI() {
        this.updateDashboard();
        this.updateStakingUI();
        this.updateVestingUI();
        this.updateLiquidityUI();
        this.updateOracleUI();
    }

    // 更新仪表板
    updateDashboard() {
        const data = this.data;
        
        // 更新余额信息
        document.getElementById('ethBalance').textContent = 
            window.web3Utils.formatNumber(data.tokenBalance || '0') + ' ETH';
        document.getElementById('astraBalance').textContent = 
            window.web3Utils.formatNumber(data.tokenBalance || '0') + ' ASTRA';
        document.getElementById('stakedAmount').textContent = 
            window.web3Utils.formatNumber(data.stakingInfo?.stakedAmount || '0') + ' ASTRA';
        document.getElementById('pendingRewards').textContent = 
            window.web3Utils.formatNumber(data.stakingInfo?.pendingRewards || '0') + ' ASTRA';

        // 更新代币信息
        if (data.tokenInfo) {
            document.getElementById('tokenName').textContent = data.tokenInfo.name;
            document.getElementById('tokenSymbol').textContent = data.tokenInfo.symbol;
            document.getElementById('totalSupply').textContent = 
                window.web3Utils.formatNumber(data.tokenInfo.totalSupply) + ' ASTRA';
        }
    }

    // 更新质押UI
    updateStakingUI() {
        const stakingInfo = this.data.stakingInfo;
        if (!stakingInfo) return;

        document.getElementById('currentStaked').textContent = 
            window.web3Utils.formatNumber(stakingInfo.stakedAmount) + ' ASTRA';
        document.getElementById('currentRewards').textContent = 
            window.web3Utils.formatNumber(stakingInfo.pendingRewards) + ' ASTRA';
        document.getElementById('totalPoolStaked').textContent = 
            window.web3Utils.formatNumber(stakingInfo.totalStaked) + ' ASTRA';
        document.getElementById('rewardRate').textContent = 
            window.web3Utils.formatNumber(stakingInfo.rewardRate) + ' ASTRA/秒';

        // 更新进度条
        const userStaked = parseFloat(stakingInfo.stakedAmount);
        const totalStaked = parseFloat(stakingInfo.totalStaked);
        const percentage = window.web3Utils.calculatePercentage(userStaked, totalStaked);
        
        document.getElementById('stakingProgress').style.width = `${percentage}%`;
        document.getElementById('stakingPercentage').textContent = 
            `${window.web3Utils.formatNumber(percentage, 2)}%`;
    }

    // 更新锁仓UI
    updateVestingUI() {
        const schedules = this.data.vestingSchedules || [];
        const container = document.getElementById('vestingSchedules');
        
        if (schedules.length === 0) {
            container.innerHTML = '<p class="help-text">暂无锁仓计划</p>';
            return;
        }

        container.innerHTML = schedules.map(schedule => {
            const progress = window.web3Utils.calculatePercentage(
                schedule.released, 
                schedule.amountTotal
            );
            
            return `
                <div class="card">
                    <h4>锁仓计划 ${schedule.id.slice(0, 8)}...</h4>
                    <div class="vesting-details">
                        <div class="balance-item">
                            <span class="label">总金额:</span>
                            <span class="value">${window.web3Utils.formatNumber(schedule.amountTotal)} ASTRA</span>
                        </div>
                        <div class="balance-item">
                            <span class="label">已释放:</span>
                            <span class="value">${window.web3Utils.formatNumber(schedule.released)} ASTRA</span>
                        </div>
                        <div class="balance-item">
                            <span class="label">可释放:</span>
                            <span class="value">${window.web3Utils.formatNumber(schedule.releasableAmount)} ASTRA</span>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <div class="progress-text">${window.web3Utils.formatNumber(progress, 1)}% 已释放</div>
                        </div>
                        <div class="balance-item">
                            <span class="label">开始时间:</span>
                            <span class="value">${window.web3Utils.formatTimestamp(schedule.start)}</span>
                        </div>
                        <div class="balance-item">
                            <span class="label">锁定期:</span>
                            <span class="value">${Math.floor(schedule.duration / 86400)} 天</span>
                        </div>
                    </div>
                    ${parseFloat(schedule.releasableAmount) > 0 ? 
                        `<button class="btn btn-primary" onclick="app.releaseTokens('${schedule.id}', '${schedule.releasableAmount}')">
                            释放 ${window.web3Utils.formatNumber(schedule.releasableAmount)} ASTRA
                        </button>` : 
                        '<p class="help-text">暂无可释放代币</p>'
                    }
                </div>
            `;
        }).join('');
    }

    // 更新流动性UI
    updateLiquidityUI() {
        const liquidityValue = this.data.liquidityValue || '0';
        document.getElementById('currentLiquidity').textContent = 
            window.web3Utils.formatNumber(liquidityValue) + ' LP';
    }

    // 更新预言机UI
    updateOracleUI() {
        const oracleStatus = this.data.oracleStatus;
        if (!oracleStatus) return;

        document.getElementById('lastCheck').textContent = 
            window.web3Utils.formatTimestamp(oracleStatus.lastCheck);
        document.getElementById('checkPeriod').textContent = 
            `${Math.floor(oracleStatus.checkPeriod / 3600)} 小时`;
        document.getElementById('burnAmount').textContent = 
            window.web3Utils.formatNumber(oracleStatus.burnAmount) + ' ASTRA';
        
        const triggerBtn = document.getElementById('triggerBtn');
        if (oracleStatus.canTrigger) {
            triggerBtn.disabled = false;
            triggerBtn.textContent = '手动触发检查';
            document.getElementById('nextCheck').textContent = '可以立即触发';
        } else {
            triggerBtn.disabled = true;
            triggerBtn.textContent = '等待中...';
            document.getElementById('nextCheck').textContent = 
                window.web3Utils.getTimeRemaining(oracleStatus.nextCheck);
        }
    }

    // 处理质押
    async handleStake() {
        const amount = document.getElementById('stakeAmount').value;
        if (!amount || parseFloat(amount) <= 0) {
            this.showMessage('请输入有效的质押金额', 'error');
            return;
        }

        try {
            this.showMessage('正在处理质押...', 'info');
            const tx = await window.contractManager.stake(amount);
            this.showMessage('质押交易已发送，等待确认...', 'info');
            
            await window.web3Utils.waitForTransaction(tx.transactionHash);
            this.showMessage(CONFIG.SUCCESS_MESSAGES.STAKE_SUCCESS, 'success');
            
            document.getElementById('stakeAmount').value = '';
            await this.refreshData();
        } catch (error) {
            console.error('质押失败:', error);
            this.showMessage('质押失败: ' + error.message, 'error');
        }
    }

    // 处理领取奖励
    async handleClaimRewards() {
        try {
            this.showMessage('正在领取奖励...', 'info');
            const tx = await window.contractManager.claimRewards();
            this.showMessage('奖励领取交易已发送，等待确认...', 'info');
            
            await window.web3Utils.waitForTransaction(tx.transactionHash);
            this.showMessage(CONFIG.SUCCESS_MESSAGES.CLAIM_SUCCESS, 'success');
            
            await this.refreshData();
        } catch (error) {
            console.error('领取奖励失败:', error);
            this.showMessage('领取奖励失败: ' + error.message, 'error');
        }
    }

    // 处理提取
    async handleWithdraw() {
        const amount = document.getElementById('withdrawAmount').value;
        if (!amount || parseFloat(amount) <= 0) {
            this.showMessage('请输入有效的提取金额', 'error');
            return;
        }

        try {
            this.showMessage('正在处理提取...', 'info');
            const tx = await window.contractManager.withdraw(amount);
            this.showMessage('提取交易已发送，等待确认...', 'info');
            
            await window.web3Utils.waitForTransaction(tx.transactionHash);
            this.showMessage(CONFIG.SUCCESS_MESSAGES.UNSTAKE_SUCCESS, 'success');
            
            document.getElementById('withdrawAmount').value = '';
            await this.refreshData();
        } catch (error) {
            console.error('提取失败:', error);
            this.showMessage('提取失败: ' + error.message, 'error');
        }
    }

    // 处理释放锁仓代币
    async handleRelease() {
        // 这个方法会被动态生成的按钮调用
    }

    // 释放代币（由动态按钮调用）
    async releaseTokens(vestingScheduleId, amount) {
        try {
            this.showMessage('正在释放代币...', 'info');
            const tx = await window.contractManager.releaseVestedTokens(vestingScheduleId, amount);
            this.showMessage('代币释放交易已发送，等待确认...', 'info');
            
            await window.web3Utils.waitForTransaction(tx.transactionHash);
            this.showMessage(CONFIG.SUCCESS_MESSAGES.RELEASE_SUCCESS, 'success');
            
            await this.refreshData();
        } catch (error) {
            console.error('释放代币失败:', error);
            this.showMessage('释放代币失败: ' + error.message, 'error');
        }
    }

    // 处理添加流动性
    async handleAddLiquidity() {
        const tokenAmount = document.getElementById('tokenAmount').value;
        const ethAmount = document.getElementById('ethAmount').value;
        
        if (!tokenAmount || !ethAmount || parseFloat(tokenAmount) <= 0 || parseFloat(ethAmount) <= 0) {
            this.showMessage('请输入有效的代币和ETH数量', 'error');
            return;
        }

        try {
            this.showMessage('正在添加流动性...', 'info');
            const tx = await window.contractManager.addLiquidity(tokenAmount, ethAmount);
            this.showMessage('流动性添加交易已发送，等待确认...', 'info');
            
            await window.web3Utils.waitForTransaction(tx.transactionHash);
            this.showMessage('流动性添加成功', 'success');
            
            document.getElementById('tokenAmount').value = '';
            document.getElementById('ethAmount').value = '';
            await this.refreshData();
        } catch (error) {
            console.error('添加流动性失败:', error);
            this.showMessage('添加流动性失败: ' + error.message, 'error');
        }
    }

    // 处理触发预言机
    async handleTriggerOracle() {
        try {
            this.showMessage('正在触发预言机检查...', 'info');
            const tx = await window.contractManager.triggerOracleCheck();
            this.showMessage('预言机检查交易已发送，等待确认...', 'info');
            
            await window.web3Utils.waitForTransaction(tx.transactionHash);
            this.showMessage('预言机检查完成', 'success');
            
            await this.refreshData();
        } catch (error) {
            console.error('触发预言机失败:', error);
            this.showMessage('触发预言机失败: ' + error.message, 'error');
        }
    }

    // 处理设置检查周期
    async handleSetPeriod() {
        const newPeriod = document.getElementById('periodInput').value;
        
        if (!newPeriod || parseInt(newPeriod) <= 0) {
            this.showMessage('请输入有效的检查周期', 'error');
            return;
        }

        try {
            this.showMessage('正在设置检查周期...', 'info');
            const periodSeconds = parseInt(newPeriod) * 3600; // 转换为秒
            await window.contractManager.setCheckPeriod(periodSeconds);
            this.showMessage('检查周期设置成功', 'success');
            
            document.getElementById('periodInput').value = '';
            await this.refreshData();
        } catch (error) {
            console.error('设置检查周期失败:', error);
            this.showMessage('设置检查周期失败: ' + error.message, 'error');
        }
    }

    // 处理设置销毁数量
    async handleSetBurn() {
        const newBurnAmount = document.getElementById('burnInput').value;
        
        if (!newBurnAmount || parseFloat(newBurnAmount) <= 0) {
            this.showMessage('请输入有效的销毁数量', 'error');
            return;
        }

        try {
            this.showMessage('正在设置销毁数量...', 'info');
            await window.contractManager.setBurnAmount(newBurnAmount);
            this.showMessage('销毁数量设置成功', 'success');
            
            document.getElementById('burnInput').value = '';
            await this.refreshData();
        } catch (error) {
            console.error('设置销毁数量失败:', error);
            this.showMessage('设置销毁数量失败: ' + error.message, 'error');
        }
    }

    // 刷新数据
    async refreshData() {
        if (!window.web3Utils.isConnected) return;
        
        try {
            await this.loadAllData();
        } catch (error) {
            console.error('刷新数据失败:', error);
        }
    }

    // 刷新特定标签数据
    async refreshTabData(tabId) {
        if (!window.web3Utils.isConnected) return;
        
        try {
            switch (tabId) {
                case 'dashboard':
                    await this.loadAllData();
                    break;
                case 'staking':
                    this.data.stakingInfo = await window.contractManager.getStakingInfo();
                    this.updateStakingUI();
                    break;
                case 'vesting':
                    this.data.vestingSchedules = await window.contractManager.getVestingSchedules();
                    this.updateVestingUI();
                    break;
                case 'liquidity':
                    this.data.liquidityValue = await window.contractManager.getLiquidityValue();
                    this.updateLiquidityUI();
                    break;
                case 'oracle':
                    this.data.oracleStatus = await window.contractManager.getOracleStatus();
                    this.updateOracleUI();
                    break;
            }
        } catch (error) {
            console.error(`刷新${tabId}数据失败:`, error);
        }
    }

    // 开始定期刷新
    startRefreshInterval() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.refreshTabData(this.currentTab);
        }, CONFIG.APP_CONFIG.refreshInterval);
    }

    // 停止定期刷新
    stopRefreshInterval() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('statusMessage');
        messageEl.textContent = message;
        messageEl.className = `status-message ${type} show`;
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }

    // 销毁应用
    destroy() {
        this.stopRefreshInterval();
        // 清理事件监听器等
    }
}

// 创建全局应用实例
window.app = new AstraApp();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});