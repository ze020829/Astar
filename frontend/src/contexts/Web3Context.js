import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

// 合约地址配置
const CONTRACT_ADDRESSES = {
  astraToken: "0xe8174d551fd69c9ec98a09033c0885a2efbeb52c",
  stakingPool: "0xf035e4d39503c551b1503d7ee1e29826f80cf4b3",
  liquidityManager: "0x18f98d0c305b6c7b2b272407ac5fa04a67df53c7",
  oracleMonitor: "0x5e4760f19dabec6711e46ec25d9a2aac50b63f2d",
  uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
};

// 简化的 ABI
const ASTRA_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function vesting() view returns (address)",
  "function ecosystemFund() view returns (address)",
  "function communityPool() view returns (address)",
  "function teamWallet() view returns (address)",
  "function investorWallet() view returns (address)",
  "function liquidityWallet() view returns (address)"
];

const VESTING_ABI = [
  "function schedules(address) view returns (uint256 totalAmount, uint256 released, uint256 startTime, uint256 lockDuration, uint256 releaseDuration)",
  "function releasableAmount(address user) view returns (uint256)",
  "function release()"
];

const STAKING_POOL_ABI = [
  "function stake(uint256 amount)",
  "function claimReward()",
  "function withdraw(uint256 amount)",
  "function stakers(address) view returns (uint256 amount, uint256 rewardDebt, uint256 lastUpdated)",
  "function pendingRewards(address user) view returns (uint256)",
  "function totalStaked() view returns (uint256)"
];

const LIQUIDITY_MANAGER_ABI = [
  "function addLiquidityFromContract(uint256 tokenAmountDesired, uint256 amountTokenMin, uint256 amountETHMin, uint256 deadline) payable returns (uint256, uint256, uint256)",
  "function lastAddedAt() view returns (uint256)",
  "function owner() view returns (address)"
];

const ORACLE_MONITOR_ABI = [
  "function checkAndBurn()",
  "function updateParams(uint256 _window, uint256 _burnAmount)",
  "function lastLiquidity() view returns (uint256)",
  "function lastChecked() view returns (uint256)",
  "function windowSeconds() view returns (uint256)",
  "function burnAmount() view returns (uint256)",
  "function owner() view returns (address)"
];

const UNISWAP_ROUTER_ABI = [
  "function factory() view returns (address)",
  "function WETH() view returns (address)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)"
];

const UNISWAP_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)"
];

const UNISWAP_PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装 MetaMask!');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(network.chainId);

      // 初始化合约
      const astraToken = new ethers.Contract(CONTRACT_ADDRESSES.astraToken, ASTRA_TOKEN_ABI, signer);
      const stakingPool = new ethers.Contract(CONTRACT_ADDRESSES.stakingPool, STAKING_POOL_ABI, signer);
      const liquidityManager = new ethers.Contract(CONTRACT_ADDRESSES.liquidityManager, LIQUIDITY_MANAGER_ABI, signer);
      const oracleMonitor = new ethers.Contract(CONTRACT_ADDRESSES.oracleMonitor, ORACLE_MONITOR_ABI, signer);
      const uniswapRouter = new ethers.Contract(CONTRACT_ADDRESSES.uniswapRouter, UNISWAP_ROUTER_ABI, signer);
      
      // 获取 Vesting 合约地址
      const vestingAddress = await astraToken.vesting();
      const vesting = new ethers.Contract(vestingAddress, VESTING_ABI, signer);

      // 尝试获取 Uniswap Factory（可能在某些网络上不可用）
      let uniswapFactory = null;
      try {
        const factoryAddress = await uniswapRouter.factory();
        uniswapFactory = new ethers.Contract(factoryAddress, UNISWAP_FACTORY_ABI, signer);
      } catch (error) {
        console.warn('无法获取 Uniswap Factory，可能不在主网:', error.message);
      }

      setContracts({
        astraToken,
        stakingPool,
        vesting,
        liquidityManager,
        oracleMonitor,
        uniswapRouter,
        uniswapFactory
      });

    } catch (error) {
      console.error('连接钱包失败:', error);
      alert('连接钱包失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setContracts({});
    setChainId(null);
  };

  // 监听账户切换
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setLoading(true);
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          setAccount(accounts[0]);
          setSigner(signer);

          // 重新初始化所有合约
          const astraToken = new ethers.Contract(CONTRACT_ADDRESSES.astraToken, ASTRA_TOKEN_ABI, signer);
          const stakingPool = new ethers.Contract(CONTRACT_ADDRESSES.stakingPool, STAKING_POOL_ABI, signer);
          const liquidityManager = new ethers.Contract(CONTRACT_ADDRESSES.liquidityManager, LIQUIDITY_MANAGER_ABI, signer);
          const oracleMonitor = new ethers.Contract(CONTRACT_ADDRESSES.oracleMonitor, ORACLE_MONITOR_ABI, signer);
          const uniswapRouter = new ethers.Contract(CONTRACT_ADDRESSES.uniswapRouter, UNISWAP_ROUTER_ABI, signer);
          
          const vestingAddress = await astraToken.vesting();
          const vesting = new ethers.Contract(vestingAddress, VESTING_ABI, signer);

          // 尝试获取 Uniswap Factory（可能在某些网络上不可用）
          let uniswapFactory = null;
          try {
            const factoryAddress = await uniswapRouter.factory();
            uniswapFactory = new ethers.Contract(factoryAddress, UNISWAP_FACTORY_ABI, signer);
          } catch (error) {
            console.warn('无法获取 Uniswap Factory:', error.message);
          }

          setContracts({
            astraToken,
            stakingPool,
            vesting,
            liquidityManager,
            oracleMonitor,
            uniswapRouter,
            uniswapFactory
          });

          console.log('✅ 已切换到账户:', accounts[0]);
        } catch (error) {
          console.error('账户切换失败:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account]);

  const value = {
    account,
    provider,
    signer,
    contracts,
    loading,
    chainId,
    connectWallet,
    disconnectWallet,
    contractAddresses: CONTRACT_ADDRESSES,
    abis: {
      ASTRA_TOKEN_ABI,
      VESTING_ABI,
      STAKING_POOL_ABI,
      LIQUIDITY_MANAGER_ABI,
      ORACLE_MONITOR_ABI,
      UNISWAP_ROUTER_ABI,
      UNISWAP_FACTORY_ABI,
      UNISWAP_PAIR_ABI
    }
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

