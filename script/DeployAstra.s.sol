// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AstraToken} from "../src/AstraToken.sol";

contract DeployAstra is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 五个地址
    address ecosystemFund = address(0x3b5Ff11b21a9633339e1aB0631017b707aC36ddf);
    address communityPool = address(0x5C5877aD8dF30584187b8c4645F8faa7799ffABf);
    address teamWallet = address(0xACcED3D5967ffbB2cd4999f160C45DA119075A8a);
    address investorWallet = address(0x962844D5D1bBD56377AD0740D3306558c476F57F);
    address liquidityWallet = address(0x46Aae728396e8945CF0396f08c946826B173d6c7);

        AstraToken token = new AstraToken(
            ecosystemFund,
            communityPool,
            teamWallet,
            investorWallet,
            liquidityWallet
        );

        console.log("AstraToken deployed at:", address(token));
        console.log("Vesting contract at:", address(token.vesting()));

        vm.stopBroadcast();
    }
}
