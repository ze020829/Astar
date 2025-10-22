// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapV2Router02 {
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

contract LiquidityManager is Ownable {
    IERC20 public token;
    IUniswapV2Router02 public router;
    address public lastLpPair;
    uint256 public lastAddedAt;

    event LiquidityAdded(uint256 tokenAmount, uint256 ethAmount, uint256 liquidity, address pair);
    event LPWithdrawn(address to, uint256 amount);

    constructor(address _token, address _router) Ownable(msg.sender) {
        token = IERC20(_token);
        router = IUniswapV2Router02(_router);
    }

    /// @notice 管理员调用：合约必须已经持有足够 token，并且 msg.value 为配套 ETH
    function addLiquidityFromContract(
        uint256 tokenAmountDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        uint256 deadline
    ) external payable onlyOwner returns (uint256, uint256, uint256) {
        require(msg.value > 0, "Need ETH");
        //tokenAmountDesired
        require(token.balanceOf(address(this)) >= tokenAmountDesired, "Not enough tokens in contract");

        //router
        token.approve(address(router), tokenAmountDesired);

        (uint256 amountToken, uint256 amountETH, uint256 liquidity) = router.addLiquidityETH{ value: msg.value }(
            address(token),
            tokenAmountDesired,
            amountTokenMin,
            amountETHMin,
            owner(), //LP
            deadline
        );

        lastAddedAt = block.timestamp;
        emit LiquidityAdded(amountToken, amountETH, liquidity, address(0));
        return (amountToken, amountETH, liquidity);
    }

    // 提取ERC20 
    function rescueERC20(address erc20, address to, uint256 amount) external onlyOwner {
        IERC20(erc20).transfer(to, amount);
        emit LPWithdrawn(to, amount);
    }

    // 接收ETH
    receive() external payable {}
    fallback() external payable {}
    
    // 提供查询当前流动性余额的接口
    function getLiquidityValue() public view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
