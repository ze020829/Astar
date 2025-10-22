// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AstraToken.sol";
import "../src/Vesting.sol";

contract VestingTest is Test {
    AstraToken token;
    Vesting vesting;

    // 模拟五类角色地址
    address ecosystemFund = address(0x111);
    address communityPool = address(0x222);
    address teamWallet = address(0x333);
    address investorWallet = address(0x444);
    address liquidityWallet = address(0x555);

    function setUp() public {
        // 部署合约
        token = new AstraToken(
            ecosystemFund,
            communityPool,
            teamWallet,
            investorWallet,
            liquidityWallet
        );

        vesting = token.vesting();
    }

    /// ✅ 验证初始分配数量
    function testInitialDistribution() public view {
        uint256 total = 1_000_000_000 * 10 ** token.decimals();
        assertEq(token.totalSupply(), total);
        assertEq(token.balanceOf(ecosystemFund), (total * 40) / 100);
        assertEq(token.balanceOf(communityPool), (total * 30) / 100);
        assertEq(token.balanceOf(liquidityWallet), (total * 5) / 100);
    }

    /// ✅ 团队锁仓前不可领取
    function testTeamCannotReleaseBeforeLock() public {
        vm.startPrank(teamWallet);
        vm.expectRevert(); // 应该 revert
        vesting.release();
        vm.stopPrank();
    }

    /// ✅ 团队锁仓期结束后可部分领取
    function testTeamLinearReleaseAfterLock() public {
        vm.startPrank(teamWallet);

        // 模拟时间经过 2 小时（超过 1h 锁仓期）
        vm.warp(block.timestamp + 2 hours);

        uint256 releasable = vesting.releasableAmount(teamWallet);
        assertGt(releasable, 0, "Should have releasable amount");

        uint256 before = token.balanceOf(teamWallet);
        vesting.release();
        uint256 afterBal = token.balanceOf(teamWallet);

        assertGt(afterBal, before, "Balance should increase");
        vm.stopPrank();
    }

    /// ✅ 投资者线性释放验证
    function testInvestorLinearRelease() public {
        vm.startPrank(investorWallet);

        // 1小时后应有部分释放
        vm.warp(block.timestamp + 1 hours);
        uint256 amount1 = vesting.releasableAmount(investorWallet);
        assertGt(amount1, 0);

        // 72小时后应全额释放
        vm.warp(block.timestamp + 72 hours);
        uint256 amount2 = vesting.releasableAmount(investorWallet);
        vesting.release();

        assertEq(vesting.releasableAmount(investorWallet), 0);
        vm.stopPrank();
    }
}
