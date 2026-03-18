package controller

import (
	"fmt"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type WalletTopUpRequest struct {
	Amount int64 `json:"amount"` // USD 充值金额
}

type WalletVerifyRequest struct {
	TradeNo string `json:"trade_no"` // 订单号
	TxHash  string `json:"tx_hash"`  // 转账凭证（哈希或截图说明）
}

// RequestMetaMaskTopUp 创建 USD 钱包充值订单，返回收款地址和 USD 金额
func RequestMetaMaskTopUp(c *gin.Context) {
	if setting.MetaMaskWalletAddress == "" {
		common.ApiErrorMsg(c, "管理员未配置收款钱包地址")
		return
	}

	var req WalletTopUpRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Amount <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	minTopUp := int64(setting.MetaMaskMinTopUp)
	if req.Amount < minTopUp {
		common.ApiErrorMsg(c, fmt.Sprintf("充值金额不能小于 %d USD", minTopUp))
		return
	}

	userId := c.GetInt("id")
	group, err := model.GetUserGroup(userId, true)
	if err != nil {
		common.ApiErrorMsg(c, "获取用户分组失败")
		return
	}

	// 计算实际 USD 金额（含分组倍率）
	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}

	dAmount := decimal.NewFromInt(req.Amount)
	dRate := decimal.NewFromFloat(topupGroupRatio)
	usdAmount := dAmount.Mul(dRate).InexactFloat64()

	// 生成唯一订单号
	tradeNo := fmt.Sprintf("WALLETUS%dNO%s%d", userId, common.GetRandomString(6), time.Now().Unix())

	// 创建待支付订单
	topUp := &model.TopUp{
		UserId:        userId,
		Amount:        req.Amount,
		Money:         usdAmount,
		TradeNo:       tradeNo,
		PaymentMethod: "wallet",
		CreateTime:    time.Now().Unix(),
		Status:        "pending",
	}
	if err := topUp.Insert(); err != nil {
		common.ApiErrorMsg(c, "创建订单失败")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"trade_no":       tradeNo,
			"wallet_address": setting.MetaMaskWalletAddress,
			"usd_amount":     usdAmount,
		},
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

	// 直接完成订单（线下转账，系统自动信任）
	topUp.Status = "success"
	topUp.CompleteTime = time.Now().Unix()
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
		fmt.Sprintf("USD 钱包充值成功，充值额度: %v，凭证：%s", logger.LogQuota(quotaToAdd), req.TxHash))

	common.ApiSuccess(c, gin.H{"quota": quotaToAdd})
}
