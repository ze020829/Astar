// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/OracleMonitor.sol";

contract TriggerOracle is Script {
    // OracleMonitor
    OracleMonitor oracle = OracleMonitor(payable(0x5e4760F19DAbec6711e46eC25D9a2aAc50b63F2d));

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        console.log("Triggering Oracle check...");
        try oracle.checkAndBurn() {
            console.log("Oracle check executed successfully!");
        } catch Error(string memory reason) {
            console.log("Execution failed:", reason);
        } catch {
            console.log("Unknown error: call reverted");
        }

        vm.stopBroadcast();
    }
}
