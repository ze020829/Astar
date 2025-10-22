// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/StakingPool.sol";

contract DeployStaking is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // AstraToken 地址
        address astraToken = 0xe8174d551fd69c9eC98A09033c0885a2eFbeB52C;

        StakingPool pool = new StakingPool(astraToken);
        console.log("StakingPool deployed at:", address(pool));

        vm.stopBroadcast();
    }
}
