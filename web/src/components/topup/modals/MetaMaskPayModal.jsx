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

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Typography,
  Space,
  Banner,
  Spin,
  Steps,
  Tag,
} from '@douyinfe/semi-ui';
import { API, showError, showSuccess } from '../../../helpers';

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
  tokenContractAddress,
  tokenDecimals,
  onSuccess,
  t,
  apiVerifyPath = '/api/user/metamask/verify',
}) => {
  const [step, setStep] = useState(0); // 0=准备 1=已转账待提交
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);
    setError('');
    try {
      const res = await API.post(apiVerifyPath, {
        trade_no: tradeNo,
        tx_hash: hash,
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('充值成功！'));
        onSuccess?.(data?.quota);
        handleClose();
      } else {
        const errMsg = typeof data === 'string' ? data : message || t('验证失败');
        setError(errMsg);
      }
    } catch (err) {
      setError(t('提交失败，请稍后重试或联系管理员'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!txHash || txHash.trim().length < 4) {
      setError(t('请输入转账凭证（交易哈希或备注）'));
      return;
    }
    await verifyTransaction(txHash.trim());
  };

  const stepList = [
    { title: t('查看收款地址'), description: t('复制收款钱包地址') },
    { title: t('完成转账'), description: t('向收款地址转入代币') },
    { title: t('提交凭证'), description: t('输入交易哈希完成确认') },
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
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleClose}>{t('取消')}</Button>
              <Button
                type='primary'
                theme='solid'
                style={{ background: '#2e7d32', borderColor: '#2e7d32' }}
                onClick={() => setStep(1)}
              >
                {t('我已复制地址，去转账')}
              </Button>
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
