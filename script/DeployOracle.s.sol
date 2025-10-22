// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/OracleMonitor.sol";

contract DeployOracle is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

    address liquidityManager = 0xC288883Bd06AcA8e14b1260a9cBDE027493Dea7d; // ✅ 新地址
    address token = 0x2f18cA7477A824b0770734A63A6499F18AcB2745; // AstraToken

        OracleMonitor oracle = new OracleMonitor(
            payable(liquidityManager),
            token,
            3600,        // 每 1 小时检查一次
            100 * 1e18   // 未注资则销毁 100 ASTRA
        );

        console.log(" OracleMonitor deployed at:", address(oracle));

        vm.stopBroadcast();
    }
}
