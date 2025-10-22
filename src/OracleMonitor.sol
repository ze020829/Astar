// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AstraToken.sol";
import "./LiquidityManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OracleMonitor is Ownable {
    LiquidityManager public liquidityManager;
    AstraToken public token;

    uint256 public lastLiquidity;       // 上次检查时的流动性
    uint256 public lastChecked;         // 上次检查时间戳
    uint256 public windowSeconds;       // 检查周期
    uint256 public burnAmount;          // 每次触发销毁的数量

    constructor(
    address payable _liquidityManager,
    address _token,
    uint256 _windowSeconds,
    uint256 _burnAmount
    ) Ownable(msg.sender) {
        liquidityManager = LiquidityManager(_liquidityManager);
        token = AstraToken(_token);
        windowSeconds = _windowSeconds;
        burnAmount = _burnAmount;
        lastChecked = block.timestamp;

        // ⚙️ 安全尝试读取初始流动性，防止部署时 revert
        try liquidityManager.getLiquidityValue() returns (uint256 value) {
            lastLiquidity = value;
        } catch {
            lastLiquidity = 0;
        }
    }

    /// @notice 检查是否有新资金注入 Uniswap 流动池
    function checkAndBurn() external onlyOwner {
        uint256 currentLiquidity = liquidityManager.getLiquidityValue();
        uint256 nowTime = block.timestamp;

        // 超过检测窗口
        if (nowTime - lastChecked >= windowSeconds) {
            if (currentLiquidity <= lastLiquidity) {
                // 无新增流动性，触发销毁
                token.burnFromEcosystem(burnAmount);
            }

            // 更新状态
            lastLiquidity = currentLiquidity;
            lastChecked = nowTime;
        }
    }

    /// @notice 管理员可调整参数
    function updateParams(uint256 _window, uint256 _burnAmount) external onlyOwner {
        windowSeconds = _window;
        burnAmount = _burnAmount;
    }
}
