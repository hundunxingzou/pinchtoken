package controller

import (
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type WalletTopUpRequest struct {
	Amount int64 `json:"amount"` // 充值代币数量（整数）
}

type WalletVerifyRequest struct {
	TradeNo string `json:"trade_no"` // 订单号
	TxHash  string `json:"tx_hash"`  // 转账凭证（哈希或截图说明）
}

// RequestMetaMaskTopUp 创建钱包转账代币充值订单
func RequestMetaMaskTopUp(c *gin.Context) {
	if setting.MetaMaskWalletAddress == "" {
		common.ApiErrorMsg(c, "管理员未配置收款钱包地址")
		return
	}
	if setting.MetaMaskTokenContractAddress == "" || setting.MetaMaskTokenDecimals <= 0 {
		common.ApiErrorMsg(c, "管理员未配置代币合约或 decimals")
		return
	}

	var req WalletTopUpRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Amount <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	minTopUp := int64(setting.MetaMaskMinTopUp)
	if req.Amount < minTopUp {
		common.ApiErrorMsg(c, fmt.Sprintf("充值数量不能小于 %d", minTopUp))
		return
	}

	userId := c.GetInt("id")
	_, err := model.GetUserGroup(userId, true)
	if err != nil {
		common.ApiErrorMsg(c, "获取用户分组失败")
		return
	}

	// 生成唯一订单号
	tradeNo := fmt.Sprintf("WALLETUS%dNO%s%d", userId, common.GetRandomString(6), time.Now().Unix())

	// 创建待支付订单
	topUp := &model.TopUp{
		UserId:        userId,
		Amount:        req.Amount,
		Money:         0,
		TradeNo:       tradeNo,
		PaymentMethod: "wallet",
		CreateTime:    time.Now().Unix(),
		Status:        "pending",
	}
	if err := topUp.Insert(); err != nil {
		common.ApiErrorMsg(c, "创建订单失败")
		return
	}

	common.ApiSuccess(c, gin.H{
		"trade_no":       tradeNo,
		"wallet_address": setting.MetaMaskWalletAddress,
		"chain":          setting.MetaMaskChain,
		"chain_id": func() int {
			if setting.MetaMaskChain == "bsc" {
				return 56
			}
			return 1
		}(),
		"token_contract_address": setting.MetaMaskTokenContractAddress,
		"token_decimals": setting.MetaMaskTokenDecimals,
		"token_amount":   req.Amount,
	})
}

// VerifyMetaMaskTopUp 用户提交转账凭证，管理员待审核完成充值
func VerifyMetaMaskTopUp(c *gin.Context) {
	var req WalletVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.TradeNo == "" || req.TxHash == "" {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	userId := c.GetInt("id")

	LockOrder(req.TradeNo)
	defer UnlockOrder(req.TradeNo)

	topUp := model.GetTopUpByTradeNo(req.TradeNo)
	if topUp == nil {
		common.ApiErrorMsg(c, "订单不存在")
		return
	}
	if topUp.UserId != userId {
		common.ApiErrorMsg(c, "订单不属于当前用户")
		return
	}
	if topUp.Status != "pending" {
		if topUp.Status == "success" {
			common.ApiErrorMsg(c, "订单已完成")
		} else {
			common.ApiErrorMsg(c, "订单状态异常")
		}
		return
	}


	if model.HasWalletTopUpTxHash(req.TxHash) {
		common.ApiErrorMsg(c, "该交易哈希已被使用")
		return
	}

	if err := verifyWalletTokenTransferOnChain(req.TxHash, setting.MetaMaskTokenContractAddress, setting.MetaMaskWalletAddress, topUp.Amount, setting.MetaMaskTokenDecimals, setting.MetaMaskChain, setting.MetaMaskEthRpcUrl, setting.MetaMaskBscRpcUrl); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}

	// 完成订单
	topUp.Status = "success"
	topUp.CompleteTime = time.Now().Unix()
	topUp.ProviderPayload = req.TxHash
	if err := topUp.Update(); err != nil {
		common.ApiErrorMsg(c, "更新订单失败")
		return
	}

	// 给用户充值
	dAmountVal := decimal.NewFromInt(int64(topUp.Amount))
	dQuotaPerUnit := decimal.NewFromFloat(common.QuotaPerUnit)
	quotaToAdd := int(dAmountVal.Mul(dQuotaPerUnit).IntPart())
	if err := model.IncreaseUserQuota(topUp.UserId, quotaToAdd, true); err != nil {
		common.ApiErrorMsg(c, "充值失败，请联系管理员")
		return
	}

	model.RecordLog(topUp.UserId, model.LogTypeTopup,
		fmt.Sprintf("代币钱包充值成功，充值额度: %v，tx: %s", logger.LogQuota(quotaToAdd), req.TxHash))

	common.ApiSuccess(c, gin.H{"quota": quotaToAdd})
}
