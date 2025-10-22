import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const Vesting = () => {
  const { account, contracts } = useWeb3();
  const [vestingData, setVestingData] = useState(null);
  const [releasableAmount, setReleasableAmount] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account && contracts.vesting) {
      loadData();
    }
  }, [account, contracts]);

  const loadData = async () => {
    try {
      const schedule = await contracts.vesting.schedules(account);
      const releasable = await contracts.vesting.releasableAmount(account);
      
      setVestingData({
        totalAmount: ethers.formatEther(schedule.totalAmount),
        released: ethers.formatEther(schedule.released),
        startTime: Number(schedule.startTime),
        lockDuration: Number(schedule.lockDuration),
        releaseDuration: Number(schedule.releaseDuration)
      });
      
      setReleasableAmount(ethers.formatEther(releasable));
    } catch (error) {
      console.error('加载锁仓数据失败:', error);
    }
  };

  const handleRelease = async () => {
    setLoading(true);
    try {
      const tx = await contracts.vesting.release();
      await tx.wait();
      alert('释放成功！');
      await loadData();
    } catch (error) {
      console.error('释放失败:', error);
      alert('释放失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} 天 ${hours % 24} 小时`;
    return `${hours} 小时`;
  };

  const calculateProgress = () => {
    if (!vestingData || vestingData.totalAmount === '0') return 0;
    const now = Math.floor(Date.now() / 1000);
    const start = vestingData.startTime + vestingData.lockDuration;
    const end = start + vestingData.releaseDuration;
    
    if (now < start) return 0;
    if (now >= end) return 100;
    
    return ((now - start) / vestingData.releaseDuration) * 100;
  };

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">请先连接钱包</p>
      </div>
    );
  }

  if (!vestingData || vestingData.totalAmount === '0') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">没有锁仓记录</h3>
        <p className="text-gray-600">您的地址没有设置锁仓计划</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">🔒 代币锁仓</h2>

      {/* 锁仓概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-orange-100 mb-1">锁仓总量</p>
          <p className="text-3xl font-bold">{parseFloat(vestingData.totalAmount).toLocaleString()}</p>
          <p className="text-orange-100 text-sm">ASTRA</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-green-100 mb-1">已释放</p>
          <p className="text-3xl font-bold">{parseFloat(vestingData.released).toLocaleString()}</p>
          <p className="text-green-100 text-sm">ASTRA</p>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-blue-100 mb-1">待释放</p>
          <p className="text-3xl font-bold">
            {(parseFloat(vestingData.totalAmount) - parseFloat(vestingData.released)).toLocaleString()}
          </p>
          <p className="text-blue-100 text-sm">ASTRA</p>
        </div>
      </div>

      {/* 释放进度 */}
      <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📈 释放进度</h3>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>进度</span>
            <span>{calculateProgress().toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">开始时间</p>
            <p className="font-medium text-gray-800">
              {formatTime(vestingData.startTime)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">锁定期（崖期）</p>
            <p className="font-medium text-gray-800">
              {formatDuration(vestingData.lockDuration)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">释放期</p>
            <p className="font-medium text-gray-800">
              {formatDuration(vestingData.releaseDuration)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">预计结束</p>
            <p className="font-medium text-gray-800">
              {formatTime(vestingData.startTime + vestingData.lockDuration + vestingData.releaseDuration)}
            </p>
          </div>
        </div>
      </div>

      {/* 领取代币 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">🔓 领取已释放代币</h3>
            <p className="text-gray-600">
              当前可领取: <span className="text-2xl font-bold text-green-600">
                {parseFloat(releasableAmount).toLocaleString()}
              </span> ASTRA
            </p>
          </div>
          <button
            onClick={handleRelease}
            disabled={loading || parseFloat(releasableAmount) === 0}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : '领取'}
          </button>
        </div>
      </div>

      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-900 mb-2">💡 锁仓说明</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 代币在锁定期（崖期）内完全锁定，无法领取</li>
          <li>• 锁定期结束后，代币开始线性释放</li>
          <li>• 您可以随时领取已释放的代币</li>
          <li>• 未领取的代币会继续保留在合约中</li>
        </ul>
      </div>
    </div>
  );
};

export default Vesting;

