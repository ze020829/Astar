// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/LiquidityManager.sol";

contract DeployLiquidity is Script {
    function run() external {
        // 1 私钥
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // 2 合约地址
        address tokenAddress = 0xe8174d551fd69c9eC98A09033c0885a2eFbeB52C;  // AstraToken    
        address routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;   
        vm.startBroadcast(deployerPrivateKey);

        // 3 部署 LiquidityManager
        LiquidityManager manager = new LiquidityManager(tokenAddress, routerAddress);

        console.log("LiquidityManager deployed at:", address(manager));

        vm.stopBroadcast();
    }
}
