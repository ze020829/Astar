import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const Header = () => {
  const { account, connectWallet, disconnectWallet, loading, chainId } = useWeb3();
  const [showMenu, setShowMenu] = useState(false);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    alert('地址已复制到剪贴板');
  };

  const getNetworkName = (chainId) => {
    const networks = {
      1n: '以太坊主网',
      11155111n: 'Sepolia 测试网',
      5n: 'Goerli 测试网',
      31337n: '本地网络'
    };
    return networks[chainId] || `网络 ${chainId}`;
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl">⭐</div>
            <div>
              <h1 className="text-2xl font-bold">Astra Token</h1>
              <p className="text-sm text-blue-200">去中心化内容创作平台</p>
            </div>
          </div>

          {/* 连接钱包按钮 */}
          <div className="flex items-center space-x-4">
            {chainId && (
              <div className="hidden md:block bg-blue-500 bg-opacity-50 px-3 py-2 rounded-lg text-sm">
                🌐 {getNetworkName(chainId)}
              </div>
            )}
            
            {account ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{formatAddress(account)}</span>
                  <span>▼</span>
                </button>

                {/* 下拉菜单 */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={copyAddress}
                      className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors flex items-center space-x-2"
                    >
                      <span>📋</span>
                      <span>复制地址</span>
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors flex items-center space-x-2"
                    >
                      <span>🔄</span>
                      <span>刷新页面</span>
                    </button>
                    <button
                      onClick={() => {
                        disconnectWallet();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                      <span>🚪</span>
                      <span>断开连接</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '连接中...' : '🔗 连接钱包'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

