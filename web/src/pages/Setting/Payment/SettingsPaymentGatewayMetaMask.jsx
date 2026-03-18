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
import React, { useEffect, useRef, useState } from 'react';
import {
  Banner,
  Button,
  Form,
  Row,
  Col,
  Typography,
  Spin,
} from '@douyinfe/semi-ui';
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

// 常用公共 RPC 端点
const PUBLIC_RPC_PRESETS = [
  { label: 'Ethereum Mainnet (LlamaRPC)', value: 'https://eth.llamarpc.com' },
  {
    label: 'Ethereum Mainnet (PublicNode)',
    value: 'https://ethereum-rpc.publicnode.com',
  },
  {
    label: 'Polygon Mainnet (LlamaRPC)',
    value: 'https://polygon.llamarpc.com',
  },
  {
    label: 'BSC Mainnet (PublicNode)',
    value: 'https://bsc-rpc.publicnode.com',
  },
  { label: '自定义', value: '__custom__' },
];

export default function SettingsPaymentGatewayMetaMask(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    MetaMaskWalletAddress: '',
    MetaMaskRpcUrl: '',
    MetaMaskEthUsdRate: 3000,
    MetaMaskChainName: 'Ethereum Mainnet',
    MetaMaskChainId: 1,
    MetaMaskMinTopUp: 1,
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        MetaMaskWalletAddress: props.options.MetaMaskWalletAddress || '',
        MetaMaskRpcUrl: props.options.MetaMaskRpcUrl || '',
        MetaMaskEthUsdRate: parseFloat(props.options.MetaMaskEthUsdRate) || 3000,
        MetaMaskChainName:
          props.options.MetaMaskChainName || 'Ethereum Mainnet',
        MetaMaskChainId: parseInt(props.options.MetaMaskChainId) || 1,
        MetaMaskMinTopUp: parseInt(props.options.MetaMaskMinTopUp) || 1,
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs((prev) => ({ ...prev, ...values }));
  };

  const submitMetaMaskSetting = async () => {
    setLoading(true);
    try {
      const options = [
        { key: 'MetaMaskWalletAddress', value: inputs.MetaMaskWalletAddress || '' },
        { key: 'MetaMaskRpcUrl', value: inputs.MetaMaskRpcUrl || '' },
        {
          key: 'MetaMaskEthUsdRate',
          value: String(inputs.MetaMaskEthUsdRate || 0),
        },
        {
          key: 'MetaMaskChainName',
          value: inputs.MetaMaskChainName || 'Ethereum Mainnet',
        },
        {
          key: 'MetaMaskChainId',
          value: String(inputs.MetaMaskChainId || 1),
        },
        {
          key: 'MetaMaskMinTopUp',
          value: String(inputs.MetaMaskMinTopUp || 1),
        },
      ];

      const requestQueue = options.map((opt) =>
        API.put('/api/option/', { key: opt.key, value: opt.value }),
      );

      const results = await Promise.all(requestQueue);
      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => showError(res.data.message));
      } else {
        showSuccess(t('更新成功'));
        setOriginInputs({ ...inputs });
        props.refresh?.();
      }
    } catch (error) {
      showError(t('更新失败'));
    }
    setLoading(false);
  };

  return (
    <Spin spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={t('USDT 充值设置')}>
          <Text>
            {t('支持用户使用 MetaMask 钱包按 USD 计价完成充值。管理员需要填写收款地址和当前汇率。')}
            <br />
          </Text>
          <Banner
            type='info'
            description={
              <span>
                {t('注意：USD 计价汇率需要手动维护，建议定期更新。RPC 地址用于自动验证链上交易，若留空则需管理员手动审核订单。')}
                <br />
                {t('推荐免费公共 RPC：')}{' '}
                <a
                  href='https://llamarpc.com'
                  target='_blank'
                  rel='noreferrer'
                >
                  LlamaRPC
                </a>
                {t('，或使用自己的 Infura/Alchemy 端点。')}
              </span>
            }
            style={{ marginBottom: 16 }}
          />

          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='MetaMaskWalletAddress'
                label={t('收款钱包地址')}
                placeholder='0x...'
                extraText={t('管理员的收款钱包地址，用户会向此地址发起链上支付')}
              />
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              <Form.InputNumber
                field='MetaMaskEthUsdRate'
                label={t('USD 计价汇率（ETH->USD）')}
                placeholder='例如：3000'
                min={1}
                precision={2}
                extraText={t('用于将 USD 订单金额换算为链上结算金额，请定期更新')}
              />
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              <Form.InputNumber
                field='MetaMaskMinTopUp'
                label={t('最低充值金额（USD）')}
                placeholder='例如：1'
                min={1}
                precision={0}
              />
            </Col>
          </Row>

          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='MetaMaskRpcUrl'
                label={t('以太坊 RPC 地址')}
                placeholder='https://eth.llamarpc.com'
                extraText={t('留空则无法自动验证交易，需管理员手动补单')}
              />
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              <Form.Input
                field='MetaMaskChainName'
                label={t('链名称（展示用）')}
                placeholder='Ethereum Mainnet'
              />
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              <Form.InputNumber
                field='MetaMaskChainId'
                label={t('链 ID')}
                placeholder='1'
                min={1}
                precision={0}
                extraText={t('Ethereum=1, Polygon=137, BSC=56')}
              />
            </Col>
          </Row>

          <Button onClick={submitMetaMaskSetting} style={{ marginTop: 16 }}>
            {t('更新 MetaMask 设置')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}
