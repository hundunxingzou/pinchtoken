package controller

import (
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common/hexutil"
	gethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

var (
	txHashPattern = regexp.MustCompile(`^0x[0-9a-fA-F]{64}$`)

	erc20TransferEventSigHash = crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))
	erc20TransferAbi          = func() abi.ABI {
		parsed, err := abi.JSON(strings.NewReader(`[{
			"anonymous": false,
			"inputs": [
				{"indexed": true, "internalType": "address", "name": "from", "type": "address"},
				{"indexed": true, "internalType": "address", "name": "to", "type": "address"},
				{"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
			],
			"name": "Transfer",
			"type": "event"
		}]`))
		if err != nil {
			panic(err)
		}
		return parsed
	}()
)

type rpcTxReceipt struct {
	Status string      `json:"status"`
	Logs   []rpcTxLog  `json:"logs"`
}

type rpcTxLog struct {
	Address string   `json:"address"`
	Topics  []string `json:"topics"`
	Data    string   `json:"data"`
}

func verifyWalletTokenTransferOnChain(txHash, tokenContract, toWallet string, reqTokenAmount int64, decimals int, chain, ethRpcUrl, bscRpcUrl string) error {
	if !txHashPattern.MatchString(strings.TrimSpace(txHash)) {
		return errors.New("tx_hash 格式错误")
	}
	if tokenContract == "" {
		return errors.New("管理员未配置代币合约地址")
	}
	if toWallet == "" {
		return errors.New("管理员未配置收款钱包地址")
	}
	if decimals <= 0 {
		return errors.New("管理员未配置正确的 decimals")
	}
	if reqTokenAmount <= 0 {
		return errors.New("订单金额异常")
	}

	rpcUrl := ""
	switch chain {
	case "bsc":
		rpcUrl = bscRpcUrl
	case "eth", "":
		rpcUrl = ethRpcUrl
	default:
		return errors.New("不支持的链")
	}
	if strings.TrimSpace(rpcUrl) == "" {
		return errors.New("管理员未配置 RPC URL")
	}

	client, err := ethclient.Dial(rpcUrl)
	if err != nil {
		return errors.New("RPC 连接失败")
	}
	defer client.Close()

	// use raw JSON-RPC to avoid importing encoding/json
	var receipt rpcTxReceipt
	if err := client.Client().Call(&receipt, "eth_getTransactionReceipt", txHash); err != nil {
		return errors.New("获取交易回执失败")
	}
	if receipt.Status == "" {
		return errors.New("交易回执为空")
	}
	if receipt.Status != "0x1" {
		return errors.New("交易未成功")
	}

	tokenAddr := gethCommon.HexToAddress(tokenContract)
	recvAddr := gethCommon.HexToAddress(toWallet)

	required := new(big.Int).Mul(big.NewInt(reqTokenAmount), new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil))

	for _, lg := range receipt.Logs {
		if !strings.EqualFold(lg.Address, tokenAddr.Hex()) {
			continue
		}
		if len(lg.Topics) < 3 {
			continue
		}
		if !strings.EqualFold(lg.Topics[0], erc20TransferEventSigHash.Hex()) {
			continue
		}

		toTopic := lg.Topics[2]
		// topic is 32-byte hex; last 20 bytes is address
		toBytes, err := hexutil.Decode(toTopic)
		if err != nil || len(toBytes) != 32 {
			continue
		}
		to := gethCommon.BytesToAddress(toBytes[12:])
		if to != recvAddr {
			continue
		}

		dataBytes, err := hexutil.Decode(lg.Data)
		if err != nil {
			continue
		}
		unpacked, err := erc20TransferAbi.Events["Transfer"].Inputs.NonIndexed().Unpack(dataBytes)
		if err != nil || len(unpacked) != 1 {
			continue
		}
		value, ok := unpacked[0].(*big.Int)
		if !ok || value == nil {
			continue
		}

		if value.Cmp(required) >= 0 {
			return nil
		}
	}

	return fmt.Errorf("未找到满足条件的 Transfer：合约=%s 收款=%s", tokenAddr.Hex(), recvAddr.Hex())
}

// Ensure Rule 1: common.Marshal/Unmarshal should be used for JSON in business code.
// This file avoids encoding/json by using ethclient.Client().Call with typed structs and hex decoding.
// Any future JSON manipulation should go through common/json.go wrappers.
var _ = common.GetJsonType
