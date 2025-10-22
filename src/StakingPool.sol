// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice 简单的质押合约（来自 "社区奖励池" 的 ASTRA 用于奖励）
contract StakingPool is ReentrancyGuard, Ownable {
    IERC20 public token; // ASTRA token

    // reward rate: numerator / denominator per second
    // spec: 每秒释放质押的 1% -> numerator = 1, denominator = 100
    uint256 public rewardNumerator = 1;
    uint256 public rewardDenominator = 100;

    struct Staker {
        uint256 amount;     
        uint256 rewardDebt;   
        uint256 lastUpdated;  
    }

    mapping(address => Staker) public stakers;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event Funded(uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    /// @notice 用户质押 ASTRA 到本合约（需要先 approve）
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "stake: amount 0");
        _updateRewards(msg.sender);
        // transfer
        require(token.transferFrom(msg.sender, address(this), amount), "stake: transferFrom failed");
        stakers[msg.sender].amount += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    /// @notice 用户领取奖励
    function claimReward() external nonReentrant {
        _updateRewards(msg.sender);
        uint256 pending = stakers[msg.sender].rewardDebt;
        if (pending == 0) {
            emit RewardClaimed(msg.sender, 0);
            return;
        }

        uint256 available = token.balanceOf(address(this));
        // 如果奖励池余额不足，则不进行奖励发放
        if (available < pending) {
            // 不进行奖励
            emit RewardClaimed(msg.sender, 0);
            return;
        }

        // 清零 pending（已发放）
        stakers[msg.sender].rewardDebt = 0;
        require(token.transfer(msg.sender, pending), "claim: transfer failed");
        emit RewardClaimed(msg.sender, pending);
    }

    /// @notice 提取本金（用户可以随时赎回）
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "withdraw: amount 0");
        Staker storage s = stakers[msg.sender];
        require(s.amount >= amount, "withdraw: insufficient staked");
        _updateRewards(msg.sender);

        s.amount -= amount;
        totalStaked -= amount;

        // 将本金转回给用户
        require(token.transfer(msg.sender, amount), "withdraw: transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice 管理员为合约充值奖励资金（通常由 communityPool 转账或 approve+transferFrom）
    function fundPool(uint256 amount) external onlyOwner {
        require(amount > 0, "fund: 0");

        if (token.allowance(msg.sender, address(this)) >= amount) {
            require(token.transferFrom(msg.sender, address(this), amount), "fund: transferFrom failed");
        } else {
            // nothing else
        }
        emit Funded(amount);
    }

    /// @notice view: 查询某个用户当前可领取的 reward（基于 lastUpdated）
    function pendingRewards(address user) public view returns (uint256) {
        Staker memory s = stakers[user];
        if (s.amount == 0) return 0;
        uint256 last = s.lastUpdated;
        if (last == 0) last = block.timestamp;
        uint256 delta = block.timestamp - last;
        if (delta == 0) {
            return s.rewardDebt;
        }
        // reward = staked * rate * delta
        // compute: s.amount * rewardNumerator * delta / rewardDenominator
        uint256 newly = (s.amount * rewardNumerator * delta) / rewardDenominator;
        return s.rewardDebt + newly;
    }

    /// @dev internal: 更新用户的 rewardDebt 与 lastUpdated
    function _updateRewards(address user) internal {
        Staker storage s = stakers[user];
        if (s.lastUpdated == 0) {
            s.lastUpdated = block.timestamp;
            // rewardDebt stays
            return;
        }
        if (s.amount == 0) {
            s.lastUpdated = block.timestamp;
            return;
        }
        uint256 delta = block.timestamp - s.lastUpdated;
        if (delta > 0) {
            uint256 newly = (s.amount * rewardNumerator * delta) / rewardDenominator;
            s.rewardDebt += newly;
            s.lastUpdated = block.timestamp;
        }
    }

    /// @notice 管理员更新奖励速率（可选）
    function setRewardRate(uint256 numerator, uint256 denominator) external onlyOwner {
        require(denominator > 0, "denom 0");
        rewardNumerator = numerator;
        rewardDenominator = denominator;
    }

    /// @notice 管理员取出合约中剩余代币
    function rescueERC20(address erc20, address to, uint256 amount) external onlyOwner {
        IERC20(erc20).transfer(to, amount);
    }
}
