package setting

// 钱包转账代币充值配置（MetaMask wallet topup）
var MetaMaskWalletAddress = "" // 管理员收款钱包地址
var MetaMaskMinTopUp = 1       // 最低充值数量（token 整数）

// 链与代币配置
var MetaMaskChain = "eth"                 // "eth" | "bsc"
var MetaMaskTokenContractAddress = ""     // ERC20 token 合约地址
var MetaMaskTokenDecimals = 18             // token decimals
var MetaMaskEthRpcUrl = ""                // Ethereum RPC URL
var MetaMaskBscRpcUrl = ""                // BSC RPC URL
