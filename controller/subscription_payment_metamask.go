package controller

import (
	"fmt"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/gin-gonic/gin"
)

type SubscriptionWalletPayRequest struct {
	PlanId int `json:"plan_id"`
}

type SubscriptionWalletVerifyRequest struct {
	TradeNo string `json:"trade_no"`
	TxHash  string `json:"tx_hash"` // 转账凭证
}

// SubscriptionRequestMetaMaskPay 创建订阅套餐的 USD 钱包支付订单
func SubscriptionRequestMetaMaskPay(c *gin.Context) {
	if setting.MetaMaskWalletAddress == "" {
		common.ApiErrorMsg(c, "管理员未配置收款钱包地址")
		return
	}

	var req SubscriptionWalletPayRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	plan, err := model.GetSubscriptionPlanById(req.PlanId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if !plan.Enabled {
		common.ApiErrorMsg(c, "套餐未启用")
		return
	}
	if plan.PriceAmount < 0.01 {
		common.ApiErrorMsg(c, "套餐金额过低")
		return
	}

	userId := c.GetInt("id")
	if plan.MaxPurchasePerUser > 0 {
		count, err := model.CountUserSubscriptionsByPlan(userId, plan.Id)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		if count >= int64(plan.MaxPurchasePerUser) {
			common.ApiErrorMsg(c, "已达到该套餐购买上限")
			return
		}
	}

	tradeNo := fmt.Sprintf("%s%d", common.GetRandomString(6), time.Now().Unix())
	tradeNo = fmt.Sprintf("SUBWALLETUS%dNO%s", userId, tradeNo)

	order := &model.SubscriptionOrder{
		UserId:        userId,
		PlanId:        plan.Id,
		Money:         plan.PriceAmount,
		TradeNo:       tradeNo,
		PaymentMethod: "wallet",
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		common.ApiErrorMsg(c, "创建订单失败")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"trade_no":       tradeNo,
			"wallet_address": setting.MetaMaskWalletAddress,
			"usd_amount":     plan.PriceAmount,
		},
	})
}

// SubscriptionVerifyMetaMaskPay 用户提交转账凭证，完成订阅订单
func SubscriptionVerifyMetaMaskPay(c *gin.Context) {
	var req SubscriptionWalletVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.TradeNo == "" || req.TxHash == "" {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	userId := c.GetInt("id")

	LockOrder(req.TradeNo)
	defer UnlockOrder(req.TradeNo)

	order := model.GetSubscriptionOrderByTradeNo(req.TradeNo)
	if order == nil {
		common.ApiErrorMsg(c, "订单不存在")
		return
	}
	if order.UserId != userId {
		common.ApiErrorMsg(c, "订单不属于当前用户")
		return
	}
	if order.Status != common.TopUpStatusPending {
		if order.Status == common.TopUpStatusSuccess {
			common.ApiErrorMsg(c, "订单已完成")
		} else {
			common.ApiErrorMsg(c, "订单状态异常")
		}
		return
	}

	// 完成订单
	if err := model.CompleteSubscriptionOrder(req.TradeNo, common.GetJsonString(map[string]string{"tx_hash": req.TxHash})); err != nil {
		common.ApiErrorMsg(c, "完成订单失败："+err.Error())
		return
	}

	common.ApiSuccess(c, nil)
}
