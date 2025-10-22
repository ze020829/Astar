// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/AstraToken.sol";
import "../src/StakingPool.sol";

contract StakeAndClaimDemo is Script {
    // 合约地址
    address constant TOKEN_ADDRESS = 0x2f18cA7477A824b0770734A63A6499F18AcB2745; //  AstraToken 部署地址
    address constant STAKING_ADDRESS = 0xb47a953C75548010f89fA1F13F641f6A4Acc27a7; // StakingPool 地址

    function run() external {
        // 1 读取私钥
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // 2 开始广播（真实发送交易）
        vm.startBroadcast(deployerPrivateKey);

        AstraToken token = AstraToken(TOKEN_ADDRESS);
        StakingPool pool = StakingPool(STAKING_ADDRESS);

        address user = vm.addr(deployerPrivateKey);

        console.log("User Address:", user);
        console.log("Token Balance Before:", token.balanceOf(user));

        uint256 stakeAmount = 1_000 * 1e18;

        // 3 授权质押池
        token.approve(STAKING_ADDRESS, stakeAmount);
        console.log("Approved", stakeAmount, "tokens to staking pool.");

        // 4 质押代币
        pool.stake(stakeAmount);
        console.log("Staked", stakeAmount, "tokens");

        // 5 模拟时间推进 30 天
        vm.warp(block.timestamp + 30 days);
        console.log("Time advanced by 30 days...");

        // 6 领取奖励
        pool.claimReward();
        console.log("Claimed staking rewards.");

        // 7 提取本金
        pool.withdraw(stakeAmount);
        console.log("Withdrawn staked tokens.");

        console.log("Token Balance After:", token.balanceOf(user));

        vm.stopBroadcast();
    }
}
