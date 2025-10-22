// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vesting is Ownable {
    IERC20 public token;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 released;
        uint256 startTime;
        uint256 lockDuration;
        uint256 releaseDuration;
    }

    mapping(address => VestingSchedule) public schedules;

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    // 创建新的锁仓计划
    function createVesting(
        address beneficiary,
        uint256 amount,
        uint256 lockDuration,
        uint256 releaseDuration
    ) external onlyOwner {
        require(schedules[beneficiary].totalAmount == 0, "Already vested");
        schedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            released: 0,
            startTime: block.timestamp,
            lockDuration: lockDuration,
            releaseDuration: releaseDuration
        });
    }

    // 查询可领取数量
    function releasableAmount(address user) public view returns (uint256) {
        VestingSchedule memory s = schedules[user];
        if (s.totalAmount == 0) return 0;
        if (block.timestamp < s.startTime + s.lockDuration) return 0;

        uint256 elapsed = block.timestamp - (s.startTime + s.lockDuration);
        if (elapsed >= s.releaseDuration) {
            return s.totalAmount - s.released;
        }
        uint256 vested = (s.totalAmount * elapsed) / s.releaseDuration;
        return vested - s.released;
    }

    // 释放代币
    function release() external {
        uint256 amount = releasableAmount(msg.sender);
        require(amount > 0, "Nothing to release");

        schedules[msg.sender].released += amount;
        token.transfer(msg.sender, amount);
    }
}
