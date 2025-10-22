import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const Liquidity = () => {
  const { account, contracts, abis } = useWeb3();
  const [tokenAmount, setTokenAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contractOwner, setContractOwner] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [pairAddress, setPairAddress] = useState('');
  const [poolReserves, setPoolReserves] = useState({ astra: '0', eth: '0' });

  useEffect(() => {
    if (account && contracts.liquidityManager) {
      loadData();
    }
  }, [account, contracts]);

  const loadData = async () => {
    try {
      const lastAdded = await contracts.liquidityManager.lastAddedAt();
      setLastAddedAt(Number(lastAdded));

      const owner = await contracts.liquidityManager.owner();
      setContractOwner(owner);
      setIsOwner(account.toLowerCase() === owner.toLowerCase());

      const balance = await contracts.astraToken.balanceOf(account);
      setTokenBalance(ethers.formatEther(balance));

      await loadPoolInfo();
    } catch (error) {
      console.error('加载流动性数据失败:', error);
    }
  };

  const loadPoolInfo = async () => {
    try {
      if (!contracts.uniswapFactory) {
        console.warn('Uniswap Factory 不可用，跳过池子信息加载');
        setPairAddress('');
        return;
      }

      const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
      const pair = await contracts.uniswapFactory.getPair(
        await contracts.astraToken.getAddress(),
        WETH
      );

      if (pair === ethers.ZeroAddress) {
        console.log('流动性池尚未创建');
        setPairAddress('');
        return;
      }

      setPairAddress(pair);

      const pairContract = new ethers.Contract(pair, abis.UNISWAP_PAIR_ABI, contracts.astraToken.runner);
      const [reserve0, reserve1] = await pairContract.getReserves();
      const token0 = await pairContract.token0();
      const astraAddress = await contracts.astraToken.getAddress();
      const isToken0 = token0.toLowerCase() === astraAddress.toLowerCase();

      setPoolReserves({
        astra: ethers.formatEther(isToken0 ? reserve0 : reserve1),
        eth: ethers.formatEther(isToken0 ? reserve1 : reserve0)
      });
    } catch (error) {
      console.error('获取池子信息失败:', error);
      setPairAddress('');
    }
  };

  const handleAddLiquidity = async () => {
    if (!tokenAmount || !ethAmount || parseFloat(tokenAmount) <= 0 || parseFloat(ethAmount) <= 0) {
      alert('请输入有效的数量');
      return;
    }

    if (!isOwner) {
      alert('只有合约所有者可以通过合约添加流动性\n\n您可以使用下方的"直接添加流动性"功能');
      return;
    }

    setLoading(true);
    try {
      const tokenAmt = ethers.parseEther(tokenAmount);
      const ethAmt = ethers.parseEther(ethAmount);
      
      const approveTx = await contracts.astraToken.approve(
        await contracts.liquidityManager.getAddress(),
        tokenAmt
      );
      await approveTx.wait();

      const deadline = Math.floor(Date.now() / 1000) + 1200;
      const tx = await contracts.liquidityManager.addLiquidityFromContract(
        tokenAmt,
        ethers.parseEther((parseFloat(tokenAmount) * 0.95).toString()),
        ethers.parseEther((parseFloat(ethAmount) * 0.95).toString()),
        deadline,
        { value: ethAmt }
      );
      await tx.wait();

      alert('添加流动性成功！');
      setTokenAmount('');
      setEthAmount('');
      await loadData();
    } catch (error) {
      console.error('添加流动性失败:', error);
      if (error.code === 'ACTION_REJECTED') {
        alert('交易被拒绝');
      } else if (error.code === 'CALL_EXCEPTION' && error.data?.includes('118cdaa7')) {
        alert('权限不足：只有合约所有者可以添加流动性');
      } else {
        alert('添加流动性失败: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">请先连接钱包</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">💧 流动性管理</h2>

      {/* Uniswap 池子信息 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">🦄</span>
          Uniswap 流动性池
        </h3>
        
        {!contracts.uniswapFactory ? (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <p className="text-blue-800 font-medium">ℹ️ 网络信息</p>
            <p className="text-blue-700 text-sm mt-1">
              当前网络可能不是以太坊主网，Uniswap 池子信息暂时不可用。
            </p>
            <p className="text-blue-600 text-xs mt-2">
              💡 您仍然可以使用质押、锁仓等其他功能
            </p>
          </div>
        ) : pairAddress ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">ASTRA 储备量</p>
                <p className="text-2xl font-bold text-purple-600">
                  {parseFloat(poolReserves.astra).toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">ETH 储备量</p>
                <p className="text-2xl font-bold text-pink-600">
                  {parseFloat(poolReserves.eth).toFixed(4)}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">交易对地址</p>
              <p className="text-sm font-mono text-gray-800">{pairAddress}</p>
            </div>
            {parseFloat(poolReserves.astra) > 0 && parseFloat(poolReserves.eth) > 0 && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  💰 当前价格: 1 ASTRA ≈ {(parseFloat(poolReserves.eth) / parseFloat(poolReserves.astra)).toFixed(6)} ETH
                </p>
              </div>
            )}
          </div>
        ) : contracts.uniswapFactory ? (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">⚠️ 流动性池尚未创建</p>
            <p className="text-yellow-700 text-sm mt-1">请先添加流动性以创建交易对</p>
          </div>
        ) : null}
      </div>

      {/* 管理员添加流动性 */}
      {!isOwner && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">⚠️ 权限提示</p>
          <p className="text-red-700 text-sm mt-1">
            通过合约添加流动性需要 owner 权限。当前合约所有者: {contractOwner.substring(0, 10)}...
          </p>
          <p className="text-red-600 text-xs mt-2">
            💡 如果您想添加流动性，可以直接使用 Uniswap 网站
          </p>
        </div>
      )}

      <div className={`bg-white border-2 border-blue-200 rounded-xl p-6 ${!isOwner ? 'opacity-50' : ''}`}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {isOwner ? '➕ 添加流动性（仅 Owner）' : '🔒 添加流动性（需要 Owner 权限）'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ASTRA 数量
            </label>
            <input
              type="number"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="输入 ASTRA 数量"
              disabled={!isOwner}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              您的余额: {parseFloat(tokenBalance).toLocaleString()} ASTRA
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ETH 数量
            </label>
            <input
              type="number"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              placeholder="输入 ETH 数量"
              disabled={!isOwner}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          <button
            onClick={handleAddLiquidity}
            disabled={loading || !tokenAmount || !ethAmount || !isOwner}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : isOwner ? '添加流动性' : '需要 Owner 权限'}
          </button>
        </div>
      </div>

      {/* 最后添加时间 */}
      {lastAddedAt > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">
            上次添加流动性时间: {new Date(lastAddedAt * 1000).toLocaleString('zh-CN')}
          </p>
        </div>
      )}

      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-900 mb-2">💡 流动性说明</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 添加流动性需要同时提供 ASTRA 代币和 ETH</li>
          <li>• 添加流动性后会获得 LP 代币作为凭证</li>
          <li>• LP 代币将发送到合约所有者地址</li>
          <li>• 预言机会监控流动性变化</li>
        </ul>
      </div>
    </div>
  );
};

export default Liquidity;

