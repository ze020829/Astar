import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const Dashboard = () => {
  const { account, contracts } = useWeb3();
  const [data, setData] = useState({
    balance: '0',
    totalSupply: '0',
    stakedAmount: '0',
    pendingRewards: '0',
    vestingAmount: '0',
    releasableAmount: '0'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account && contracts.astraToken) {
      loadData();
    }
  }, [account, contracts]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 代币余额
      const balance = await contracts.astraToken.balanceOf(account);
      
      // 总供应量
      const totalSupply = await contracts.astraToken.totalSupply();

      // 质押信息
      let stakedAmount = '0';
      let pendingRewards = '0';
      if (contracts.stakingPool) {
        const staker = await contracts.stakingPool.stakers(account);
        stakedAmount = staker.amount.toString();
        pendingRewards = await contracts.stakingPool.pendingRewards(account);
      }

      // 锁仓信息
      let vestingAmount = '0';
      let releasableAmount = '0';
      if (contracts.vesting) {
        const schedule = await contracts.vesting.schedules(account);
        vestingAmount = schedule.totalAmount.toString();
        releasableAmount = await contracts.vesting.releasableAmount(account);
      }

      setData({
        balance: ethers.formatEther(balance),
        totalSupply: ethers.formatEther(totalSupply),
        stakedAmount: ethers.formatEther(stakedAmount),
        pendingRewards: ethers.formatEther(pendingRewards),
        vestingAmount: ethers.formatEther(vestingAmount),
        releasableAmount: ethers.formatEther(releasableAmount)
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">欢迎使用 Astra DApp</h3>
        <p className="text-gray-600">请先连接您的 MetaMask 钱包</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-6xl mb-4">⭐</div>
        <p className="text-gray-600">加载数据中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">📊 账户总览</h2>
        <button
          onClick={loadData}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🔄 刷新数据
        </button>
      </div>

      {/* 代币信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">ASTRA 余额</span>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-3xl font-bold">{parseFloat(data.balance).toLocaleString()}</p>
          <p className="text-blue-100 text-sm mt-1">ASTRA</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-100">已质押</span>
            <span className="text-3xl">💎</span>
          </div>
          <p className="text-3xl font-bold">{parseFloat(data.stakedAmount).toLocaleString()}</p>
          <p className="text-purple-100 text-sm mt-1">ASTRA</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100">待领取奖励</span>
            <span className="text-3xl">🎁</span>
          </div>
          <p className="text-3xl font-bold">{parseFloat(data.pendingRewards).toLocaleString()}</p>
          <p className="text-green-100 text-sm mt-1">ASTRA</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-100">锁仓总量</span>
            <span className="text-3xl">🔒</span>
          </div>
          <p className="text-3xl font-bold">{parseFloat(data.vestingAmount).toLocaleString()}</p>
          <p className="text-orange-100 text-sm mt-1">ASTRA</p>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-pink-100">可释放</span>
            <span className="text-3xl">🔓</span>
          </div>
          <p className="text-3xl font-bold">{parseFloat(data.releasableAmount).toLocaleString()}</p>
          <p className="text-pink-100 text-sm mt-1">ASTRA</p>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-100">总供应量</span>
            <span className="text-3xl">🌐</span>
          </div>
          <p className="text-3xl font-bold">{parseFloat(data.totalSupply).toLocaleString()}</p>
          <p className="text-indigo-100 text-sm mt-1">ASTRA</p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ 快速操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-2">💎</div>
            <p className="text-sm font-medium text-gray-700">质押赚取收益</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-sm font-medium text-gray-700">查看锁仓</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-2">💧</div>
            <p className="text-sm font-medium text-gray-700">添加流动性</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-2">🔮</div>
            <p className="text-sm font-medium text-gray-700">预言机监控</p>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-medium text-blue-900">使用提示</p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• 质押 ASTRA 代币可以赚取收益奖励</li>
              <li>• 锁仓的代币会根据时间逐步释放</li>
              <li>• 添加流动性可以为交易提供支持</li>
              <li>• 预言机会监控流动性池并触发动态平衡</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

