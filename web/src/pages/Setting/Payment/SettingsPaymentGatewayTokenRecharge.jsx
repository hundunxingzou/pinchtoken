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
import React, { useEffect, useState, useRef } from 'react';
import { Banner, Button, Form, Row, Col, Typography, Spin } from '@douyinfe/semi-ui';
const { Text } = Typography;
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingsPaymentGatewayTokenRecharge(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    MetaMaskChain: 'eth',
    MetaMaskEthRpcUrl: '',
    MetaMaskBscRpcUrl: '',
    MetaMaskTokenContractAddress: '',
    MetaMaskTokenDecimals: 18,
    MetaMaskWalletAddress: '',
    MetaMaskMinTopUp: 1,
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        MetaMaskChain: props.options.MetaMaskChain || 'eth',
        MetaMaskEthRpcUrl: props.options.MetaMaskEthRpcUrl || '',
        MetaMaskBscRpcUrl: props.options.MetaMaskBscRpcUrl || '',
        MetaMaskTokenContractAddress: props.options.MetaMaskTokenContractAddress || '',
        MetaMaskTokenDecimals:
          props.options.MetaMaskTokenDecimals !== undefined
            ? parseInt(props.options.MetaMaskTokenDecimals)
            : 18,
        MetaMaskWalletAddress: props.options.MetaMaskWalletAddress || '',
        MetaMaskMinTopUp:
          props.options.MetaMaskMinTopUp !== undefined
            ? parseInt(props.options.MetaMaskMinTopUp)
            : 1,
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitTokenRechargeSetting = async () => {
    setLoading(true);
    try {
      const options = [];
      options.push({ key: 'MetaMaskChain', value: inputs.MetaMaskChain || 'eth' });
      options.push({ key: 'MetaMaskEthRpcUrl', value: inputs.MetaMaskEthRpcUrl || '' });
      options.push({ key: 'MetaMaskBscRpcUrl', value: inputs.MetaMaskBscRpcUrl || '' });
      options.push({
        key: 'MetaMaskTokenContractAddress',
        value: inputs.MetaMaskTokenContractAddress || '',
      });
      options.push({
        key: 'MetaMaskTokenDecimals',
        value: String(inputs.MetaMaskTokenDecimals || 18),
      });
      options.push({
        key: 'MetaMaskWalletAddress',
        value: inputs.MetaMaskWalletAddress || '',
      });
      options.push({
        key: 'MetaMaskMinTopUp',
        value: String(inputs.MetaMaskMinTopUp || 1),
      });

      const requestQueue = options.map((opt) =>
        API.put('/api/option/', {
          key: opt.key,
          value: opt.value,
        }),
      );

      const results = await Promise.all(requestQueue);
      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => {
          showError(res.data.message);
        });
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
        <Form.Section text={t('代币充值（钱包转账）')}>
          <Text>
            {t('支持用户通过浏览器钱包插件发起 ERC20 转账充值；系统将通过链上 Transfer 事件校验到账后自动加额度。')}
            <br />
          </Text>
          <Banner
            type='info'
            description={t(
              '请配置链/RPC/代币合约/decimals/收款地址与最低充值数量。仅支持 ETH/BSC。decimals 与合约不匹配会导致校验失败。',
            )}
            style={{ marginBottom: 16 }}
          />

          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Select field='MetaMaskChain' label={t('链选择')}>
                <Form.Select.Option value='eth'>Ethereum</Form.Select.Option>
                <Form.Select.Option value='bsc'>BSC</Form.Select.Option>
              </Form.Select>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='MetaMaskEthRpcUrl'
                label={t('ETH RPC URL')}
                placeholder='https://...'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='MetaMaskBscRpcUrl'
                label={t('BSC RPC URL')}
                placeholder='https://...'
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='MetaMaskTokenContractAddress'
                label={t('代币合约地址')}
                placeholder='0x...'
              />
            </Col>
            <Col xs={24} sm={24} md={4} lg={4} xl={4}>
              <Form.InputNumber
                field='MetaMaskTokenDecimals'
                label={t('decimals')}
                min={0}
                precision={0}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='MetaMaskWalletAddress'
                label={t('收款钱包地址')}
                placeholder='0x...'
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='MetaMaskMinTopUp'
                label={t('最低充值数量（token）')}
                min={1}
                precision={0}
              />
            </Col>
          </Row>

          <Button onClick={submitTokenRechargeSetting} style={{ marginTop: 16 }}>
            {t('更新代币充值设置')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}
