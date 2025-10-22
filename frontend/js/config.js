// 网络配置
const NETWORK_CONFIG = {
    chainId: '0x1', // 以太坊主网
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io/']
};

// 合约地址配置
const CONTRACT_ADDRESSES = {
    AstraToken: '0xe8174d551fd69c9ec98a09033c0885a2efbeb52c',
    StakingPool: '0xf035e4d39503c551b1503d7ee1e29826f80cf4b3',
    LiquidityManager: '0x18f98d0c305b6c7b2b272407ac5fa04a67df53c7',
    OracleMonitor: '0x5e4760f19dabec6711e46ec25d9a2aac50b63f2d',
    Vesting: '0x0000000000000000000000000000000000000000' // 需要部署后更新
};

// 合约 ABI 配置
const CONTRACT_ABIS = {
    AstraToken: [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function burnFromEcosystem(uint256 amount)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ],
    
    StakingPool: [
        "function stake(uint256 amount)",
        "function claimRewards()",
        "function withdraw(uint256 amount)",
        "function getStakerInfo(address staker) view returns (uint256 stakedAmount, uint256 rewardDebt, uint256 pendingRewards)",
        "function rewardRate() view returns (uint256)",
        "function totalStaked() view returns (uint256)",
        "function rewardPerToken() view returns (uint256)",
        "function earned(address account) view returns (uint256)",
        "event Staked(address indexed user, uint256 amount)",
        "event Withdrawn(address indexed user, uint256 amount)",
        "event RewardPaid(address indexed user, uint256 reward)"
    ],
    
    LiquidityManager: [
        "function addLiquidityFromContract(uint256 tokenAmount, uint256 ethAmount)",
        "function getLiquidityValue() view returns (uint256)",
        "function rescueERC20(address token, uint256 amount)",
        "event LiquidityAdded(uint256 tokenAmount, uint256 ethAmount, uint256 liquidity)"
    ],
    
    OracleMonitor: [
        "function checkAndBurn()",
        "function lastLiquidityCheck() view returns (uint256)",
        "function checkPeriod() view returns (uint256)",
        "function burnAmount() view returns (uint256)",
        "function setCheckPeriod(uint256 newPeriod)",
        "function setBurnAmount(uint256 newAmount)",
        "event LiquidityChecked(uint256 timestamp, bool liquidityAdded)",
        "event TokensBurned(uint256 amount)"
    ],
    
    Vesting: [
        "function createVestingSchedule(address beneficiary, uint256 start, uint256 cliff, uint256 duration, uint256 slicePeriodSeconds, bool revocable, uint256 amount)",
        "function release(bytes32 vestingScheduleId, uint256 amount)",
        "function getVestingSchedule(bytes32 vestingScheduleId) view returns (bool initialized, address beneficiary, uint256 cliff, uint256 start, uint256 duration, uint256 slicePeriodSeconds, bool revocable, uint256 amountTotal, uint256 released, bool revoked)",
        "function computeReleasableAmount(bytes32 vestingScheduleId) view returns (uint256)",
        "function getVestingSchedulesCountByBeneficiary(address beneficiary) view returns (uint256)",
        "function getVestingIdAtIndex(address beneficiary, uint256 index) view returns (bytes32)",
        "event VestingScheduleCreated(bytes32 vestingScheduleId, address beneficiary, uint256 amount)",
        "event Released(bytes32 vestingScheduleId, uint256 amount)"
    ]
};

// 应用配置
const APP_CONFIG = {
    appName: 'Astra Token DApp',
    version: '1.0.0',
    defaultGasLimit: 300000,
    refreshInterval: 30000, // 30秒刷新一次数据
    maxRetries: 3,
    retryDelay: 1000
};

// 常量定义
const CONSTANTS = {
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
    MAX_UINT256: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    DECIMALS: 18,
    WEI_PER_ETHER: '1000000000000000000'
};

// 错误消息
const ERROR_MESSAGES = {
    WALLET_NOT_CONNECTED: '请先连接钱包',
    NETWORK_NOT_SUPPORTED: '不支持的网络，请切换到以太坊主网',
    INSUFFICIENT_BALANCE: '余额不足',
    TRANSACTION_FAILED: '交易失败',
    CONTRACT_CALL_FAILED: '合约调用失败',
    INVALID_AMOUNT: '无效的金额',
    METAMASK_NOT_INSTALLED: '请安装 MetaMask 钱包'
};

// 成功消息
const SUCCESS_MESSAGES = {
    WALLET_CONNECTED: '钱包连接成功',
    TRANSACTION_SENT: '交易已发送',
    TRANSACTION_CONFIRMED: '交易确认成功',
    STAKE_SUCCESS: '质押成功',
    UNSTAKE_SUCCESS: '提取成功',
    CLAIM_SUCCESS: '奖励领取成功',
    RELEASE_SUCCESS: '代币释放成功'
};

// 导出配置
window.CONFIG = {
    NETWORK_CONFIG,
    CONTRACT_ADDRESSES,
    CONTRACT_ABIS,
    APP_CONFIG,
    CONSTANTS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES
};