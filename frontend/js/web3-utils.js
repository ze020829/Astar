// Web3 工具函数
class Web3Utils {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.isConnected = false;
        this.networkId = null;
    }

    // 检查 MetaMask 是否安装
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined';
    }

    // 初始化 Web3
    async initWeb3() {
        if (!this.isMetaMaskInstalled()) {
            throw new Error(CONFIG.ERROR_MESSAGES.METAMASK_NOT_INSTALLED);
        }

        this.web3 = new Web3(window.ethereum);
        return this.web3;
    }

    // 连接钱包
    async connectWallet() {
        try {
            if (!this.isMetaMaskInstalled()) {
                throw new Error(CONFIG.ERROR_MESSAGES.METAMASK_NOT_INSTALLED);
            }

            await this.initWeb3();

            // 请求账户访问权限
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('没有可用的账户');
            }

            this.account = accounts[0];
            this.isConnected = true;

            // 获取网络ID
            this.networkId = await this.web3.eth.net.getId();

            // 监听账户变化
            this.setupEventListeners();

            return {
                account: this.account,
                networkId: this.networkId
            };
        } catch (error) {
            console.error('连接钱包失败:', error);
            throw error;
        }
    }

    // 断开钱包连接
    disconnectWallet() {
        this.account = null;
        this.isConnected = false;
        this.networkId = null;
    }

    // 设置事件监听器
    setupEventListeners() {
        if (!window.ethereum) return;

        // 监听账户变化
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnectWallet();
                window.location.reload();
            } else if (accounts[0] !== this.account) {
                this.account = accounts[0];
                window.location.reload();
            }
        });

        // 监听网络变化
        window.ethereum.on('chainChanged', (chainId) => {
            window.location.reload();
        });
    }

    // 检查网络
    async checkNetwork() {
        if (!this.web3) return false;

        const chainId = await this.web3.eth.getChainId();
        return chainId === parseInt(CONFIG.NETWORK_CONFIG.chainId, 16);
    }

    // 切换到正确的网络
    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONFIG.NETWORK_CONFIG.chainId }]
            });
        } catch (switchError) {
            // 如果网络不存在，尝试添加网络
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [CONFIG.NETWORK_CONFIG]
                });
            } else {
                throw switchError;
            }
        }
    }

    // 获取余额
    async getBalance(address = null) {
        if (!this.web3) throw new Error('Web3 未初始化');
        
        const targetAddress = address || this.account;
        if (!targetAddress) throw new Error('地址无效');

        const balance = await this.web3.eth.getBalance(targetAddress);
        return this.web3.utils.fromWei(balance, 'ether');
    }

    // 获取代币余额
    async getTokenBalance(tokenAddress, userAddress = null) {
        if (!this.web3) throw new Error('Web3 未初始化');
        
        const targetAddress = userAddress || this.account;
        if (!targetAddress) throw new Error('地址无效');

        const contract = new this.web3.eth.Contract(CONFIG.CONTRACT_ABIS.AstraToken, tokenAddress);
        const balance = await contract.methods.balanceOf(targetAddress).call();
        const decimals = await contract.methods.decimals().call();
        
        return this.formatTokenAmount(balance, decimals);
    }

    // 格式化代币数量
    formatTokenAmount(amount, decimals = 18) {
        if (!this.web3) return '0';
        return this.web3.utils.fromWei(amount.toString(), 'ether');
    }

    // 解析代币数量
    parseTokenAmount(amount, decimals = 18) {
        if (!this.web3) return '0';
        return this.web3.utils.toWei(amount.toString(), 'ether');
    }

    // 格式化地址显示
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // 发送交易
    async sendTransaction(to, data, value = '0') {
        if (!this.web3 || !this.account) {
            throw new Error(CONFIG.ERROR_MESSAGES.WALLET_NOT_CONNECTED);
        }

        const gasPrice = await this.web3.eth.getGasPrice();
        const gasLimit = CONFIG.APP_CONFIG.defaultGasLimit;

        const txParams = {
            from: this.account,
            to: to,
            data: data,
            value: value,
            gas: gasLimit,
            gasPrice: gasPrice
        };

        return await this.web3.eth.sendTransaction(txParams);
    }

    // 估算 Gas
    async estimateGas(to, data, value = '0') {
        if (!this.web3 || !this.account) {
            throw new Error(CONFIG.ERROR_MESSAGES.WALLET_NOT_CONNECTED);
        }

        return await this.web3.eth.estimateGas({
            from: this.account,
            to: to,
            data: data,
            value: value
        });
    }

    // 等待交易确认
    async waitForTransaction(txHash, confirmations = 1) {
        if (!this.web3) throw new Error('Web3 未初始化');

        return new Promise((resolve, reject) => {
            const checkTransaction = async () => {
                try {
                    const receipt = await this.web3.eth.getTransactionReceipt(txHash);
                    if (receipt) {
                        const currentBlock = await this.web3.eth.getBlockNumber();
                        const confirmationCount = currentBlock - receipt.blockNumber;
                        
                        if (confirmationCount >= confirmations) {
                            resolve(receipt);
                        } else {
                            setTimeout(checkTransaction, 2000);
                        }
                    } else {
                        setTimeout(checkTransaction, 2000);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            checkTransaction();
        });
    }

    // 验证地址格式
    isValidAddress(address) {
        if (!this.web3) return false;
        return this.web3.utils.isAddress(address);
    }

    // 获取当前区块号
    async getCurrentBlock() {
        if (!this.web3) throw new Error('Web3 未初始化');
        return await this.web3.eth.getBlockNumber();
    }

    // 获取交易详情
    async getTransaction(txHash) {
        if (!this.web3) throw new Error('Web3 未初始化');
        return await this.web3.eth.getTransaction(txHash);
    }

    // 获取交易收据
    async getTransactionReceipt(txHash) {
        if (!this.web3) throw new Error('Web3 未初始化');
        return await this.web3.eth.getTransactionReceipt(txHash);
    }

    // 重试机制
    async retry(fn, maxRetries = CONFIG.APP_CONFIG.maxRetries) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await this.delay(CONFIG.APP_CONFIG.retryDelay * (i + 1));
                }
            }
        }
        
        throw lastError;
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 格式化数字显示
    formatNumber(num, decimals = 4) {
        const number = parseFloat(num);
        if (isNaN(number)) return '0';
        
        if (number === 0) return '0';
        if (number < 0.0001) return '< 0.0001';
        
        return number.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        });
    }

    // 计算百分比
    calculatePercentage(part, total) {
        if (!total || total === 0) return 0;
        return (parseFloat(part) / parseFloat(total)) * 100;
    }

    // 时间格式化
    formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    // 计算剩余时间
    getTimeRemaining(endTime) {
        const now = Math.floor(Date.now() / 1000);
        const remaining = endTime - now;
        
        if (remaining <= 0) return '已结束';
        
        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        
        if (days > 0) return `${days}天 ${hours}小时`;
        if (hours > 0) return `${hours}小时 ${minutes}分钟`;
        return `${minutes}分钟`;
    }
}

// 创建全局实例
window.web3Utils = new Web3Utils();