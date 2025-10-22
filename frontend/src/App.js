import React, { useState } from 'react';
import { Web3Provider } from './contexts/Web3Context';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Staking from './components/Staking';
import Vesting from './components/Vesting';
import Liquidity from './components/Liquidity';
import Oracle from './components/Oracle';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'staking':
        return <Staking />;
      case 'vesting':
        return <Vesting />;
      case 'liquidity':
        return <Liquidity />;
      case 'oracle':
        return <Oracle />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Web3Provider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        
        {/* 导航标签 */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-md p-2 mb-6">
            <nav className="flex space-x-2">
              {[
                { id: 'dashboard', label: '📊 总览', icon: '📊' },
                { id: 'staking', label: '💎 质押', icon: '💎' },
                { id: 'vesting', label: '🔒 锁仓', icon: '🔒' },
                { id: 'liquidity', label: '💧 流动性', icon: '💧' },
                { id: 'oracle', label: '🔮 预言机', icon: '🔮' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 内容区域 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {renderContent()}
          </div>
        </div>

        {/* 页脚 */}
        <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>Astra Token - 去中心化内容创作与策展平台</p>
          <p className="text-sm mt-2">Built with ❤️ using React + Ethers.js + Tailwind CSS</p>
        </footer>
      </div>
    </Web3Provider>
  );
}

export default App;

