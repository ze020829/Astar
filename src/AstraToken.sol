// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Vesting.sol";

contract AstraToken is ERC20, Ownable {
    // ====== 五个资金账户地址 ======
    address public ecosystemFund;     // 生态基金账户
    address public communityPool;     // 社区奖励账户
    address public teamWallet;        // 团队钱包（锁仓）
    address public investorWallet;    // 投资者钱包（锁仓）
    address public liquidityWallet;   // 流动性钱包

    Vesting public vesting;           // 锁仓合约实例

    // ====== 事件定义 ======
    event Distributed(
        address indexed ecosystemFund,
        address indexed communityPool,
        address indexed liquidityWallet,
        uint256 ecosystemAmount,
        uint256 communityAmount,
        uint256 liquidityAmount
    );

    event VestingCreated(
        address indexed vestingContract,
        address indexed team,
        address indexed investor,
        uint256 teamAmount,
        uint256 investorAmount
    );

    event BurnedFromEcosystem(address indexed operator, uint256 amount);

    // ====== 构造函数 ======
    constructor(
        address _ecosystemFund,
        address _communityPool,
        address _teamWallet,
        address _investorWallet,
        address _liquidityWallet
    ) ERC20("Astra Token", "ASTRA") Ownable(msg.sender) {
        // 参数有效性校验
        require(_ecosystemFund != address(0), "ecosystemFund zero");
        require(_communityPool != address(0), "communityPool zero");
        require(_teamWallet != address(0), "teamWallet zero");
        require(_investorWallet != address(0), "investorWallet zero");
        require(_liquidityWallet != address(0), "liquidityWallet zero");

        // 保存地址到状态变量
        ecosystemFund = _ecosystemFund;
        communityPool = _communityPool;
        teamWallet = _teamWallet;
        investorWallet = _investorWallet;
        liquidityWallet = _liquidityWallet;

        uint256 total = 1_000_000_000 * 10 ** decimals(); // 总供应量：10亿枚

        // 先将代币全部铸造到合约自身
        _mint(address(this), total);

        // 部署锁仓合约，并记录引用
        vesting = new Vesting(address(this));

        // 各账户分配比例
        uint256 ecosystemAmt = (total * 40) / 100;   // 40%：生态基金
        uint256 communityAmt = (total * 30) / 100;   // 30%：社区奖励池
        uint256 teamAmt = (total * 15) / 100;        // 15%：团队锁仓
        uint256 investorAmt = (total * 10) / 100;    // 10%：投资者锁仓
        uint256 liquidityAmt = (total * 5) / 100;    // 5%：流动性提供

        // 普通转账分配
        _transfer(address(this), ecosystemFund, ecosystemAmt);
        _transfer(address(this), communityPool, communityAmt);
        _transfer(address(this), liquidityWallet, liquidityAmt);

        // 将锁仓部分转入 Vesting 合约
        _transfer(address(this), address(vesting), teamAmt + investorAmt);

        // 在 Vesting 合约中创建锁仓计划
        // 参数：(接收人, 数量, 崖期时间, 锁仓总时长)
        vesting.createVesting(teamWallet, teamAmt, 1 hours, 24 hours);
        vesting.createVesting(investorWallet, investorAmt, 0, 72 hours);

        emit Distributed(ecosystemFund, communityPool, liquidityWallet, ecosystemAmt, communityAmt, liquidityAmt);
        emit VestingCreated(address(vesting), teamWallet, investorWallet, teamAmt, investorAmt);
    }

    // ====== 销毁函数 ======
    /// @notice 管理员可从生态基金账户销毁代币
    function burnFromEcosystem(uint256 amount) external onlyOwner {
        require(amount > 0, "amount zero");
        uint256 bal = balanceOf(ecosystemFund);
        require(bal >= amount, "ecosystem: insufficient balance");

        // 从生态基金账户直接销毁指定数量代币
        _burn(ecosystemFund, amount);

        emit BurnedFromEcosystem(_msgSender(), amount);
    }

    // ====== 更新生态基金地址 ======
    /// @notice 管理员可更新生态基金钱包地址
    function updateEcosystemFund(address _new) external onlyOwner {
        require(_new != address(0), "zero addr");
        ecosystemFund = _new;
    }
}
