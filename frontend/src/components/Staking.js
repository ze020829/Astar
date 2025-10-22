import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const Staking = () => {
  const { account, contracts } = useWeb3();
  const [balance, setBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account && contracts.stakingPool) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [account, contracts]);

  const loadData = async () => {
    try {
      const bal = await contracts.astraToken.balanceOf(account);
      setBalance(ethers.formatEther(bal));

      const staker = await contracts.stakingPool.stakers(account);
      setStakedAmount(ethers.formatEther(staker.amount));

      const pending = await contracts.stakingPool.pendingRewards(account);
      setPendingRewards(ethers.formatEther(pending));

      const total = await contracts.stakingPool.totalStaked();
      setTotalStaked(ethers.formatEther(total));
    } catch (error) {
      console.error('加载质押数据失败:', error);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('请输入有效的质押数量');
      return;
    }

    setLoading(true);
    try {
      const amount = ethers.parseEther(stakeAmount);
      
      // 先授权
      const approveTx = await contracts.astraToken.approve(
        await contracts.stakingPool.getAddress(),
        amount
      );
      await approveTx.wait();
      
      // 再质押
      const stakeTx = await contracts.stakingPool.stake(amount);
      await stakeTx.wait();
      
      alert('质押成功！');
      setStakeAmount('');
      await loadData();
    } catch (error) {
      console.error('质押失败:', error);
      alert('质押失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setLoading(true);
    try {
      const tx = await contracts.stakingPool.claimReward();
      await tx.wait();
      alert('领取奖励成功！');
      await loadData();
    } catch (error) {
      console.error('领取奖励失败:', error);
      alert('领取奖励失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('请输入有效的提取数量');
      return;
    }

    setLoading(true);
    try {
      const amount = ethers.parseEther(withdrawAmount);
      const tx = await contracts.stakingPool.withdraw(amount);
      await tx.wait();
      alert('提取成功！');
      setWithdrawAmount('');
      await loadData();
    } catch (error) {
      console.error('提取失败:', error);
      alert('提取失败: ' + error.message);
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
      <h2 className="text-3xl font-bold text-gray-800">💎 质押赚取收益</h2>

      {/* 质押统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-blue-100 mb-1">钱包余额</p>
          <p className="text-3xl font-bold">{parseFloat(balance).toLocaleString()}</p>
          <p className="text-blue-100 text-sm">ASTRA</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-purple-100 mb-1">已质押</p>
          <p className="text-3xl font-bold">{parseFloat(stakedAmount).toLocaleString()}</p>
          <p className="text-purple-100 text-sm">ASTRA</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-green-100 mb-1">待领取奖励</p>
          <p className="text-3xl font-bold">{parseFloat(pendingRewards).toLocaleString()}</p>
          <p className="text-green-100 text-sm">ASTRA</p>
        </div>
      </div>

      {/* 质押操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 质押 */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💰 质押 ASTRA</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                质押数量
              </label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="输入质押数量"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                可用余额: {parseFloat(balance).toLocaleString()} ASTRA
              </p>
            </div>
            <button
              onClick={handleStake}
              disabled={loading || !stakeAmount}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '处理中...' : '质押'}
            </button>
          </div>
        </div>

        {/* 提取 */}
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📤 提取本金</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提取数量
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="输入提取数量"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                已质押: {parseFloat(stakedAmount).toLocaleString()} ASTRA
              </p>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={loading || !withdrawAmount}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '处理中...' : '提取'}
            </button>
          </div>
        </div>
      </div>

      {/* 领取奖励 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">🎁 领取质押奖励</h3>
            <p className="text-gray-600">
              当前待领取: <span className="text-2xl font-bold text-green-600">
                {parseFloat(pendingRewards).toLocaleString()}
              </span> ASTRA
            </p>
          </div>
          <button
            onClick={handleClaim}
            disabled={loading || parseFloat(pendingRewards) === 0}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : '领取奖励'}
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 全局统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">总质押量</p>
            <p className="text-2xl font-bold text-blue-600">
              {parseFloat(totalStaked).toLocaleString()} ASTRA
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">我的份额</p>
            <p className="text-2xl font-bold text-purple-600">
              {totalStaked > 0 
                ? ((parseFloat(stakedAmount) / parseFloat(totalStaked)) * 100).toFixed(2)
                : '0'
              }%
            </p>
          </div>
        </div>
      </div>

      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-900 mb-2">💡 质押说明</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 质押 ASTRA 代币即可开始赚取奖励</li>
          <li>• 奖励每秒实时计算，随时可以领取</li>
          <li>• 本金可以随时提取，没有锁定期</li>
          <li>• 提取本金不会自动领取奖励，需要单独领取</li>
        </ul>
      </div>
    </div>
  );
};

export default Staking;

