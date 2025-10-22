// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AstraToken.sol";
import "../src/Vesting.sol";

contract AstraTokenTest is Test {
    AstraToken token;
    Vesting vesting;

    // 测试地址
    address ecosystemFund = address(0x1111);
    address communityPool = address(0x2222);
    address teamWallet = address(0x3333);
    address investorWallet = address(0x4444);
    address liquidityWallet = address(0x5555);
    address owner = address(this);

    function setUp() public {
        token = new AstraToken(
            ecosystemFund,
            communityPool,
            teamWallet,
            investorWallet,
            liquidityWallet
        );

        vesting = token.vesting();
    }

    /// @notice 验证代币基础信息是否正确
    function testBasicInfo() public view {
        assertEq(token.name(), "Astra Token");
        assertEq(token.symbol(), "ASTRA");
        assertEq(token.decimals(), 18);
    }

    /// @notice 检查代币总供应量是否为 10 亿
    function testTotalSupply() public view {
        uint256 total = 1_000_000_000 * 10 ** 18;
        assertEq(token.totalSupply(), total);
    }

    /// @notice 检查生态基金、社区池和流动性钱包是否收到正确数量
    function testInitialDistribution() public view {
        uint256 total = 1_000_000_000 * 10 ** 18;

        assertEq(token.balanceOf(ecosystemFund), (total * 40) / 100);
        assertEq(token.balanceOf(communityPool), (total * 30) / 100);
        assertEq(token.balanceOf(liquidityWallet), (total * 5) / 100);
    }

    /// @notice 检查锁仓合约中是否收到团队与投资者代币
    function testVestingBalance() public view {
        uint256 total = 1_000_000_000 * 10 ** 18;
        uint256 teamAmt = (total * 15) / 100;
        uint256 investorAmt = (total * 10) / 100;

        assertEq(token.balanceOf(address(vesting)), teamAmt + investorAmt);
    }

    /// @notice 验证 burnFromEcosystem 能正确销毁代币
    function testBurnFromEcosystem() public {
        uint256 burnAmount = 1000 * 10 ** 18;
        uint256 beforeBalance = token.balanceOf(ecosystemFund);

        // 模拟 owner 拥有权限
        vm.prank(owner);
        token.burnFromEcosystem(burnAmount);

        uint256 afterBalance = token.balanceOf(ecosystemFund);
        assertEq(afterBalance, beforeBalance - burnAmount);
    }

    /// @notice 检查非 owner 调用 burnFromEcosystem 会被拒绝
    function testBurnFromEcosystemFail() public {
        uint256 burnAmount = 1000 * 10 ** 18;

        vm.prank(address(0x9999)); // 非管理员调用
        vm.expectRevert(); // 预期报错
        token.burnFromEcosystem(burnAmount);
    }
}
