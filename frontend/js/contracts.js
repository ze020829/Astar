// 合约交互类
class ContractManager {
    constructor() {
        this.contracts = {};
        this.web3 = null;
    }

    // 初始化合约
    async initContracts() {
        if (!window.web3Utils.web3) {
            throw new Error('Web3 未初始化');
        }

        this.web3 = window.web3Utils.web3;

        // 初始化所有合约实例
        this.contracts.astraToken = new this.web3.eth.Contract(
            CONFIG.CONTRACT_ABIS.AstraToken,
            CONFIG.CONTRACT_ADDRESSES.AstraToken
        );

        this.contracts.stakingPool = new this.web3.eth.Contract(
            CONFIG.CONTRACT_ABIS.StakingPool,
            CONFIG.CONTRACT_ADDRESSES.StakingPool
        );

        this.contracts.liquidityManager = new this.web3.eth.Contract(
            CONFIG.CONTRACT_ABIS.LiquidityManager,
            CONFIG.CONTRACT_ADDRESSES.LiquidityManager
        );

        this.contracts.oracleMonitor = new this.web3.eth.Contract(
            CONFIG.CONTRACT_ABIS.OracleMonitor,
            CONFIG.CONTRACT_ADDRESSES.OracleMonitor
        );

        if (CONFIG.CONTRACT_ADDRESSES.Vesting !== CONFIG.CONSTANTS.ZERO_ADDRESS) {
            this.contracts.vesting = new this.web3.eth.Contract(
                CONFIG.CONTRACT_ABIS.Vesting,
                CONFIG.CONTRACT_ADDRESSES.Vesting
            );
        }
    }

    // AstraToken 合约方法
    async getTokenInfo() {
        const contract = this.contracts.astraToken;
        
        const [name, symbol, decimals, totalSupply] = await Promise.all([
            contract.methods.name().call(),
            contract.methods.symbol().call(),
            contract.methods.decimals().call(),
            contract.methods.totalSupply().call()
        ]);

        return {
            name,
            symbol,
            decimals: parseInt(decimals),
            totalSupply: window.web3Utils.formatTokenAmount(totalSupply, decimals)
        };
    }

    async getTokenBalance(address = null) {
        const targetAddress = address || window.web3Utils.account;
        const balance = await this.contracts.astraToken.methods.balanceOf(targetAddress).call();
        return window.web3Utils.formatTokenAmount(balance);
    }

    async approveToken(spender, amount) {
        const contract = this.contracts.astraToken;
        const amountWei = window.web3Utils.parseTokenAmount(amount);
        
        return await contract.methods.approve(spender, amountWei).send({
            from: window.web3Utils.account
        });
    }

    async getAllowance(owner, spender) {
        const allowance = await this.contracts.astraToken.methods.allowance(owner, spender).call();
        return window.web3Utils.formatTokenAmount(allowance);
    }

    // StakingPool 合约方法
    async getStakingInfo() {
        const contract = this.contracts.stakingPool;
        const account = window.web3Utils.account;

        const [stakerInfo, totalStaked, rewardRate] = await Promise.all([
            contract.methods.getStakerInfo(account).call(),
            contract.methods.totalStaked().call(),
            contract.methods.rewardRate().call()
        ]);

        return {
            stakedAmount: window.web3Utils.formatTokenAmount(stakerInfo.stakedAmount),
            pendingRewards: window.web3Utils.formatTokenAmount(stakerInfo.pendingRewards),
            totalStaked: window.web3Utils.formatTokenAmount(totalStaked),
            rewardRate: window.web3Utils.formatTokenAmount(rewardRate)
        };
    }

    async stake(amount) {
        const contract = this.contracts.stakingPool;
        const amountWei = window.web3Utils.parseTokenAmount(amount);

        // 首先检查并批准代币
        const allowance = await this.getAllowance(
            window.web3Utils.account,
            CONFIG.CONTRACT_ADDRESSES.StakingPool
        );

        if (parseFloat(allowance) < parseFloat(amount)) {
            await this.approveToken(CONFIG.CONTRACT_ADDRESSES.StakingPool, amount);
        }

        return await contract.methods.stake(amountWei).send({
            from: window.web3Utils.account
        });
    }

    async claimRewards() {
        const contract = this.contracts.stakingPool;
        return await contract.methods.claimRewards().send({
            from: window.web3Utils.account
        });
    }

    async withdraw(amount) {
        const contract = this.contracts.stakingPool;
        const amountWei = window.web3Utils.parseTokenAmount(amount);
        
        return await contract.methods.withdraw(amountWei).send({
            from: window.web3Utils.account
        });
    }

    async getEarnedRewards() {
        const contract = this.contracts.stakingPool;
        const earned = await contract.methods.earned(window.web3Utils.account).call();
        return window.web3Utils.formatTokenAmount(earned);
    }

    // LiquidityManager 合约方法
    async getLiquidityValue() {
        const contract = this.contracts.liquidityManager;
        const value = await contract.methods.getLiquidityValue().call();
        return window.web3Utils.formatTokenAmount(value);
    }

    async addLiquidity(tokenAmount, ethAmount) {
        const contract = this.contracts.liquidityManager;
        const tokenAmountWei = window.web3Utils.parseTokenAmount(tokenAmount);
        const ethAmountWei = window.web3Utils.parseTokenAmount(ethAmount);

        // 检查并批准代币
        const allowance = await this.getAllowance(
            window.web3Utils.account,
            CONFIG.CONTRACT_ADDRESSES.LiquidityManager
        );

        if (parseFloat(allowance) < parseFloat(tokenAmount)) {
            await this.approveToken(CONFIG.CONTRACT_ADDRESSES.LiquidityManager, tokenAmount);
        }

        return await contract.methods.addLiquidityFromContract(tokenAmountWei, ethAmountWei).send({
            from: window.web3Utils.account,
            value: ethAmountWei
        });
    }

    // OracleMonitor 合约方法
    async getOracleStatus() {
        const contract = this.contracts.oracleMonitor;
        
        const [lastCheck, checkPeriod, burnAmount] = await Promise.all([
            contract.methods.lastLiquidityCheck().call(),
            contract.methods.checkPeriod().call(),
            contract.methods.burnAmount().call()
        ]);

        const now = Math.floor(Date.now() / 1000);
        const nextCheck = parseInt(lastCheck) + parseInt(checkPeriod);
        const canTrigger = now >= nextCheck;

        return {
            lastCheck: parseInt(lastCheck),
            checkPeriod: parseInt(checkPeriod),
            burnAmount: window.web3Utils.formatTokenAmount(burnAmount),
            nextCheck,
            canTrigger,
            timeUntilNext: canTrigger ? 0 : nextCheck - now
        };
    }

    async triggerOracleCheck() {
        const contract = this.contracts.oracleMonitor;
        return await contract.methods.checkAndBurn().send({
            from: window.web3Utils.account
        });
    }

    async setCheckPeriod(newPeriod) {
        const contract = this.contracts.oracleMonitor;
        return await contract.methods.setCheckPeriod(newPeriod).send({
            from: window.web3Utils.account
        });
    }

    async setBurnAmount(newAmount) {
        const contract = this.contracts.oracleMonitor;
        const amountWei = window.web3Utils.parseTokenAmount(newAmount);
        return await contract.methods.setBurnAmount(amountWei).send({
            from: window.web3Utils.account
        });
    }

    // Vesting 合约方法
    async getVestingSchedules(beneficiary = null) {
        if (!this.contracts.vesting) {
            return [];
        }

        const targetAddress = beneficiary || window.web3Utils.account;
        const contract = this.contracts.vesting;
        
        const count = await contract.methods.getVestingSchedulesCountByBeneficiary(targetAddress).call();
        const schedules = [];

        for (let i = 0; i < count; i++) {
            const vestingId = await contract.methods.getVestingIdAtIndex(targetAddress, i).call();
            const schedule = await contract.methods.getVestingSchedule(vestingId).call();
            const releasableAmount = await contract.methods.computeReleasableAmount(vestingId).call();

            schedules.push({
                id: vestingId,
                beneficiary: schedule.beneficiary,
                start: parseInt(schedule.start),
                cliff: parseInt(schedule.cliff),
                duration: parseInt(schedule.duration),
                slicePeriodSeconds: parseInt(schedule.slicePeriodSeconds),
                revocable: schedule.revocable,
                amountTotal: window.web3Utils.formatTokenAmount(schedule.amountTotal),
                released: window.web3Utils.formatTokenAmount(schedule.released),
                revoked: schedule.revoked,
                releasableAmount: window.web3Utils.formatTokenAmount(releasableAmount)
            });
        }

        return schedules;
    }

    async releaseVestedTokens(vestingScheduleId, amount) {
        if (!this.contracts.vesting) {
            throw new Error('Vesting 合约未部署');
        }

        const contract = this.contracts.vesting;
        const amountWei = window.web3Utils.parseTokenAmount(amount);
        
        return await contract.methods.release(vestingScheduleId, amountWei).send({
            from: window.web3Utils.account
        });
    }

    // 事件监听
    setupEventListeners() {
        if (!this.contracts.astraToken) return;

        // 监听代币转账事件
        this.contracts.astraToken.events.Transfer({
            filter: {
                from: window.web3Utils.account
            }
        }).on('data', (event) => {
            console.log('代币转账事件:', event);
            // 可以在这里更新UI
        });

        // 监听质押事件
        if (this.contracts.stakingPool) {
            this.contracts.stakingPool.events.Staked({
                filter: {
                    user: window.web3Utils.account
                }
            }).on('data', (event) => {
                console.log('质押事件:', event);
                // 更新质押信息
            });

            this.contracts.stakingPool.events.RewardPaid({
                filter: {
                    user: window.web3Utils.account
                }
            }).on('data', (event) => {
                console.log('奖励支付事件:', event);
                // 更新奖励信息
            });
        }

        // 监听流动性事件
        if (this.contracts.liquidityManager) {
            this.contracts.liquidityManager.events.LiquidityAdded()
                .on('data', (event) => {
                    console.log('流动性添加事件:', event);
                    // 更新流动性信息
                });
        }

        // 监听预言机事件
        if (this.contracts.oracleMonitor) {
            this.contracts.oracleMonitor.events.TokensBurned()
                .on('data', (event) => {
                    console.log('代币销毁事件:', event);
                    // 更新销毁信息
                });
        }

        // 监听锁仓事件
        if (this.contracts.vesting) {
            this.contracts.vesting.events.Released({
                filter: {
                    beneficiary: window.web3Utils.account
                }
            }).on('data', (event) => {
                console.log('代币释放事件:', event);
                // 更新锁仓信息
            });
        }
    }

    // 批量获取数据
    async getAllData() {
        try {
            const [tokenInfo, tokenBalance, stakingInfo, liquidityValue, oracleStatus] = await Promise.all([
                this.getTokenInfo(),
                this.getTokenBalance(),
                this.getStakingInfo(),
                this.getLiquidityValue(),
                this.getOracleStatus()
            ]);

            let vestingSchedules = [];
            if (this.contracts.vesting) {
                vestingSchedules = await this.getVestingSchedules();
            }

            return {
                tokenInfo,
                tokenBalance,
                stakingInfo,
                liquidityValue,
                oracleStatus,
                vestingSchedules
            };
        } catch (error) {
            console.error('获取数据失败:', error);
            throw error;
        }
    }

    // 检查合约是否已初始化
    isInitialized() {
        return Object.keys(this.contracts).length > 0;
    }
}

// 创建全局实例
window.contractManager = new ContractManager();