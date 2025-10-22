// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AstraToken.sol";

contract FundLiquidity is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        // ASTRA 代币合约地址
        AstraToken token = AstraToken(0xe8174d551fd69c9eC98A09033c0885a2eFbeB52C);

        // LiquidityManager 合约地址（目标）
        address liquidityManager = 0x18f98d0C305b6c7B2B272407AC5fa04A67df53c7;

        // 转账数量
        uint256 amount = 10_000 * 1e18;

        // 打印日志
        console.log("Funding LiquidityManager...");
        console.log("Receiver:", liquidityManager);
        console.log("Amount:", amount);

        // 转账
        bool success = token.transfer(liquidityManager, amount);
        require(success, "Transfer failed");

        console.log("Transfer success!");
        console.log("LiquidityManager balance:", token.balanceOf(liquidityManager));

        vm.stopBroadcast();
    }
}
