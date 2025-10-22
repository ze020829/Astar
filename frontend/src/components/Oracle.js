import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const Oracle = () => {
  const { account, contracts } = useWeb3();
  const [lastLiquidity, setLastLiquidity] = useState('0');
  const [lastChecked, setLastChecked] = useState(0);
  const [windowSeconds, setWindowSeconds] = useState(0);
  const [burnAmount, setBurnAmount] = useState('0');
  const [contractOwner, setContractOwner] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [newWindow, setNewWindow] = useState('');
  const [newBurnAmount, setNewBurnAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account && contracts.oracleMonitor) {
      loadData();
    }
  }, [account, contracts]);

  const loadData = async () => {
    try {
      const lastLiq = await contracts.oracleMonitor.lastLiquidity();
      setLastLiquidity(ethers.formatEther(lastLiq));

      const lastCheck = await contracts.oracleMonitor.lastChecked();
      setLastChecked(Number(lastCheck));

      const window = await contracts.oracleMonitor.windowSeconds();
      setWindowSeconds(Number(window));

      const burn = await contracts.oracleMonitor.burnAmount();
      setBurnAmount(ethers.formatEther(burn));

      const owner = await contracts.oracleMonitor.owner();
      setContractOwner(owner);
      setIsOwner(account.toLowerCase() === owner.toLowerCase());
    } catch (error) {
      console.error('加载预言机数据失败:', error);
    }
  };

  const handleCheckAndBurn = async () => {
    if (!isOwner) {
      alert('只有合约所有者可以执行此操作');
      return;
    }

    setLoading(true);
    try {
      const tx = await contracts.oracleMonitor.checkAndBurn();
      await tx.wait();
      alert('检查完成！');
      await loadData();
    } catch (error) {
      console.error('检查失败:', error);
      if (error.code === 'CALL_EXCEPTION' && error.data?.includes('118cdaa7')) {
        alert('权限不足：只有合约所有者可以执行此操作');
      } else {
        alert('检查失败: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateParams = async () => {
    if (!isOwner) {
      alert('只有合约所有者可以执行此操作');
      return;
    }

    if (!newWindow || !newBurnAmount) {
      alert('请输入完整的参数');
      return;
    }

    setLoading(true);
    try {
      const tx = await contracts.oracleMonitor.updateParams(
        newWindow,
        ethers.parseEther(newBurnAmount)
      );
      await tx.wait();
      alert('参数更新成功！');
      setNewWindow('');
      setNewBurnAmount('');
      await loadData();
    } catch (error) {
      console.error('更新参数失败:', error);
      if (error.code === 'CALL_EXCEPTION' && error.data?.includes('118cdaa7')) {
        alert('权限不足：只有合约所有者可以执行此操作');
      } else {
        alert('更新参数失败: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} 天 ${hours % 24} 小时`;
    if (hours > 0) return `${hours} 小时`;
    return `${seconds} 秒`;
  };

  const getNextCheckTime = () => {
    if (!lastChecked || !windowSeconds) return null;
    return lastChecked + windowSeconds;
  };

  const getTimeUntilNextCheck = () => {
    const nextCheck = getNextCheckTime();
    if (!nextCheck) return '-';
    const now = Math.floor(Date.now() / 1000);
    const remaining = nextCheck - now;
    if (remaining <= 0) return '可以立即检查';
    return formatDuration(remaining);
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
      <h2 className="text-3xl font-bold text-gray-800">🔮 预言机监控</h2>

      {/* 权限提示 */}
      {!isOwner && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 font-medium">⚠️ 权限提示</p>
          <p className="text-yellow-700 text-sm mt-1">
            预言机操作需要 owner 权限。当前合约所有者: {contractOwner.substring(0, 10)}...
          </p>
        </div>
      )}

      {/* 当前状态 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 当前状态</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">上次记录的流动性</p>
            <p className="text-2xl font-bold text-purple-600">
              {parseFloat(lastLiquidity).toLocaleString()} ASTRA
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">检查周期</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatDuration(windowSeconds)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">上次检查时间</p>
            <p className="text-lg font-medium text-gray-800">
              {lastChecked > 0 ? new Date(lastChecked * 1000).toLocaleString('zh-CN') : '-'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">距离下次检查</p>
            <p className="text-lg font-medium text-gray-800">
              {getTimeUntilNextCheck()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">销毁数量（每次）</p>
            <p className="text-2xl font-bold text-red-600">
              {parseFloat(burnAmount).toLocaleString()} ASTRA
            </p>
          </div>
        </div>
      </div>

      {/* 执行检查 */}
      <div className={`bg-white border-2 border-green-200 rounded-xl p-6 ${!isOwner ? 'opacity-50' : ''}`}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {isOwner ? '✅ 执行流动性检查' : '🔒 执行流动性检查（需要 Owner 权限）'}
        </h3>
        <p className="text-gray-600 mb-4">
          检查流动性池是否有新的资金注入。如果没有，将从生态系统基金销毁 {parseFloat(burnAmount).toLocaleString()} ASTRA。
        </p>
        <button
          onClick={handleCheckAndBurn}
          disabled={loading || !isOwner}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '处理中...' : isOwner ? '🔍 立即检查' : '需要 Owner 权限'}
        </button>
      </div>

      {/* 更新参数 */}
      <div className={`bg-white border-2 border-blue-200 rounded-xl p-6 ${!isOwner ? 'opacity-50' : ''}`}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {isOwner ? '⚙️ 更新参数' : '🔒 更新参数（需要 Owner 权限）'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              检查周期（秒）
            </label>
            <input
              type="number"
              value={newWindow}
              onChange={(e) => setNewWindow(e.target.value)}
              placeholder={`当前: ${windowSeconds} 秒 (${formatDuration(windowSeconds)})`}
              disabled={!isOwner}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              例如: 3600 (1小时), 86400 (1天)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              销毁数量（ASTRA）
            </label>
            <input
              type="number"
              value={newBurnAmount}
              onChange={(e) => setNewBurnAmount(e.target.value)}
              placeholder={`当前: ${burnAmount} ASTRA`}
              disabled={!isOwner}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          <button
            onClick={handleUpdateParams}
            disabled={loading || !newWindow || !newBurnAmount || !isOwner}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : isOwner ? '更新参数' : '需要 Owner 权限'}
          </button>
        </div>
      </div>

      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-900 mb-2">💡 预言机说明</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 预言机会定期检查 Uniswap 流动性池的资金变化</li>
          <li>• 如果在检查周期内没有新的资金注入，会触发代币销毁</li>
          <li>• 销毁的代币来自生态系统基金</li>
          <li>• 只有合约所有者可以执行检查和更新参数</li>
          <li>• 这是一种动态平衡机制，激励项目方持续注入流动性</li>
        </ul>
      </div>
    </div>
  );
};

export default Oracle;

