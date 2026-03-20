/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useMemo, useState } from 'react';
import {
  Modal,
  Button,
  Typography,
  Space,
  Banner,
  Spin,
  Steps,
} from '@douyinfe/semi-ui';
import { ethers } from 'ethers';
import { API, showSuccess } from '../../../helpers';

const { Text, Title, Paragraph } = Typography;

/**
 * 代币钱包充值弹窗
 *
 * Props:
 *   visible              - 是否可见
 *   onClose              - 关闭回调
 *   tradeNo              - 订单号
 *   walletAddress        - 收款地址
 *   tokenAmount          - 需要支付的 token 数量（整数）
 *   chain                - 链（eth|bsc）
 *   chainId              - EVM chainId（ETH=1, BSC=56）
 *   tokenContractAddress - token 合约地址
 *   tokenDecimals        - token decimals
 *   onSuccess            - 支付成功回调
 *   t                    - i18n 翻译函数
 *   apiVerifyPath        - 验证接口路径（默认 /api/user/metamask/verify）
 */
const MetaMaskPayModal = ({
  visible,
  onClose,
  tradeNo,
  walletAddress,
  tokenAmount,
  chain,
  chainId,
  tokenContractAddress,
  tokenDecimals,
  onSuccess,
  t,
  apiVerifyPath = '/api/user/metamask/verify',
}) => {
  const [step, setStep] = useState(0); // 0=钱包支付 1=手动验证
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoTxHash, setAutoTxHash] = useState('');

  const hasInjectedWallet = typeof window !== 'undefined' && !!window.ethereum;

  const transferAmountBaseUnits = useMemo(() => {
    try {
      if (tokenAmount === undefined || tokenAmount === null) return null;
      if (tokenDecimals === undefined || tokenDecimals === null) return null;
      return ethers.parseUnits(String(tokenAmount), Number(tokenDecimals));
    } catch (e) {
      return null;
    }
  }, [tokenAmount, tokenDecimals]);

  const reset = () => {
    setStep(0);
    setTxHash('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  // 提交转账凭证到后端
  const verifyTransaction = async (hash) => {
    const res = await API.post(apiVerifyPath, {
      trade_no: tradeNo,
      tx_hash: hash,
    });
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(t('充值成功！'));
      onSuccess?.(data?.quota);
      handleClose();
      return { ok: true };
    }
    const errMsg = typeof data === 'string' ? data : message || t('验证失败');
    return { ok: false, error: errMsg };
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const verifyWithRetry = async (hash) => {
    setLoading(true);
    setError('');
    try {
      const maxWaitMs = 120000;
      const start = Date.now();
      let delay = 1500;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const result = await verifyTransaction(hash);
        if (result.ok) return;

        const errText = String(result.error || '');
        // Non-retryable errors
        if (
          errText.includes('该交易哈希已被使用') ||
          errText.includes('订单已完成') ||
          errText.includes('订单不存在') ||
          errText.includes('订单状态异常')
        ) {
          setError(errText || t('验证失败'));
          return;
        }

        const elapsed = Date.now() - start;
        if (elapsed >= maxWaitMs) {
          setError(errText || t('验证失败'));
          return;
        }

        await sleep(delay);
        delay = Math.min(Math.floor(delay * 1.6), 10000);
      }
    } catch (err) {
      setError(t('提交失败，请稍后重试或联系管理员'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const hash = txHash?.trim();
    if (!hash || hash.length < 4) {
      setError(t('请输入转账凭证（交易哈希或备注）'));
      return;
    }
    await verifyWithRetry(hash);
  };

  const switchChainIfNeeded = async (ethereum, targetChainId) => {
    if (!targetChainId) return;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toBeHex(Number(targetChainId)) }],
      });
    } catch (e) {
      // 4902 = chain not added; we don't add chain here (non-goal)
      throw new Error(t('无法自动切换网络，请在钱包中手动切换后重试'));
    }
  };

  const handleWalletPay = async () => {
    setLoading(true);
    setError('');
    try {
      if (!hasInjectedWallet) {
        setError(t('未检测到浏览器钱包插件，请安装/启用后重试'));
        return;
      }
      if (!walletAddress || !tokenContractAddress) {
        setError(t('支付配置缺失，请联系管理员'));
        return;
      }
      if (!transferAmountBaseUnits) {
        setError(t('金额/decimals 配置异常，请联系管理员'));
        return;
      }
      const ethereum = window.ethereum;
      await ethereum.request({ method: 'eth_requestAccounts' });
      await switchChainIfNeeded(ethereum, chainId);

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const erc20 = new ethers.Contract(
        tokenContractAddress,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        signer,
      );

      const tx = await erc20.transfer(walletAddress, transferAmountBaseUnits);
      setAutoTxHash(tx?.hash || '');
      if (tx?.hash) {
        await verifyWithRetry(tx.hash);
      } else {
        setError(t('未获取到交易哈希，请在钱包中确认交易是否已发送'));
      }
    } catch (e) {
      const code = e?.code;
      const msg = String(e?.message || '');
      if (code === 4001 || msg.toLowerCase().includes('user rejected')) {
        setError(t('用户取消了支付'));
      } else {
        setError(e?.message || t('发起支付失败'));
      }
    } finally {
      setLoading(false);
    }
  };

  const stepList = [
    { title: t('钱包支付'), description: t('使用浏览器钱包发起转账') },
    { title: t('手动验证'), description: t('自动模式失败时可手动提交交易哈希') },
  ];

  return (
    <Modal
      title={
        <Space>
          <span style={{ fontSize: 20 }}>💵</span>
          <span>{t('钱包转账充值')}</span>
        </Space>
      }
      visible={visible}
      onCancel={handleClose}
      footer={null}
      maskClosable={false}
      width={520}
      centered
    >
      <Spin spinning={loading}>
        <Space vertical style={{ width: '100%' }} spacing={16}>
          {/* 支付信息 */}
          <div style={{ marginTop: -8, marginBottom: -8 }}>
            <Text type='secondary' style={{ fontSize: 12 }}>
              {t('链')}: {chain || '-'}
              {'  '}|{'  '}
              {t('合约')}: {tokenContractAddress || '-'}
              {'  '}|{'  '}
              decimals: {tokenDecimals ?? '-'}
            </Text>
          </div>
          <div
            style={{
              background: 'var(--semi-color-fill-0)',
              borderRadius: 8,
              padding: '16px',
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <Text type='secondary'>{t('充值数量')}</Text>
              <Title
                heading={3}
                style={{ color: '#2e7d32', marginBottom: 0, marginTop: 4 }}
              >
                {tokenAmount} TOKEN
              </Title>
            </div>
            <div>
              <Text type='secondary'>{t('收款钱包地址')}</Text>
              <Paragraph
                copyable
                style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}
              >
                {walletAddress}
              </Paragraph>
            </div>
            <Banner
              type='info'
              style={{ marginTop: 12 }}
              description={t(
                '请使用任意钱包向上方地址转入对应代币，转账完成后在下方输入交易哈希提交验证。',
              )}
              closeIcon={null}
            />
          </div>

          {/* 步骤指示器 */}
          <Steps type='basic' current={step} size='small'>
            {stepList.map((s, i) => (
              <Steps.Step
                key={i}
                title={s.title}
                description={s.description}
              />
            ))}
          </Steps>

          {/* 错误提示 */}
          {error && (
            <Banner
              type='danger'
              description={error}
              closeIcon={null}
            />
          )}

          {/* 操作区域 */}
          {step === 0 && (
            <Space vertical style={{ width: '100%' }} spacing={12}>
              {!hasInjectedWallet && (
                <Banner
                  type='warning'
                  description={t('未检测到浏览器钱包插件（window.ethereum），请安装/启用后再试。')}
                  closeIcon={null}
                />
              )}
              {autoTxHash && (
                <Banner
                  type='info'
                  description={
                    <span>
                      {t('已发起交易')}：<Text code>{autoTxHash}</Text>
                    </span>
                  }
                  closeIcon={null}
                />
              )}
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleClose}>{t('取消')}</Button>
                <Button onClick={() => setStep(1)}>{t('手动输入 tx hash')}</Button>
                <Button
                  type='primary'
                  theme='solid'
                  style={{ background: '#2e7d32', borderColor: '#2e7d32' }}
                  onClick={handleWalletPay}
                  disabled={!hasInjectedWallet}
                >
                  {t('连接钱包并支付')}
                </Button>
              </Space>
            </Space>
          )}

          {step === 1 && (
            <Space vertical style={{ width: '100%' }} spacing={8}>
              <Text>{t('请输入转账交易哈希（Transaction Hash）：')}</Text>
              <input
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--semi-color-border)',
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder='0x... 或转账备注/截图说明'
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
              />
              <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
                <Button onClick={() => setStep(0)}>{t('返回')}</Button>
                <Button
                  type='primary'
                  theme='solid'
                  onClick={handleSubmit}
                  loading={loading}
                >
                  {t('提交凭证，完成充值')}
                </Button>
              </Space>
            </Space>
          )}
        </Space>
      </Spin>
    </Modal>
  );
};

export default MetaMaskPayModal;
