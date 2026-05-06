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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Boxes,
  Check,
  ChevronDown,
  Copy,
  KeyRound,
  Route,
  WalletCards,
} from 'lucide-react';
import { API } from '../../helpers';
import NoticeModal from '../../components/layout/NoticeModal';
import { StatusContext } from '../../context/Status';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import './api-transfer-home.css';

const SHOW_PRICING_SECTION = false;

const landingCopy = {
  zh: {
    navHome: '首页',
    navConsole: '控制台',
    navMarketplace: '模型广场',
    navPlatform: '平台',
    navModels: '模型',
    navPricing: '价格',
    navFaq: 'FAQ',
    navDocs: '文档',
    navCta: '登录',
    heroTitleOne: '统一的',
    heroTitleTwo: '大模型接口',
    heroTitleThree: '网关',
    heroCopy: '更好的价格，更好的稳定性，只需要将模型基址替换为：',
    heroPrimary: '开始接入',
    heroSecondary: '查看模型',
    providerTitle: '支持众多的大模型供应商',
    platformTitle: '把模型接入、账单和工具适配压缩到一个干净入口',
    platformCopy:
      'CCSub 面向高频使用 AI 编程工具、自动化代理和模型 API 的开发者。无需反复注册不同平台，也无需为每个工具维护一套额度和密钥。',
    routingBadge: '实时网关',
    availability: '可用性',
    failover: '故障切换',
    failoverValue: '秒级',
    billing: '计费',
    stepOneTitle: 'One key',
    stepOneCopy:
      '统一鉴权，OpenAI API 格式兼容，现有客户端通常只需替换 Base URL。',
    stepTwoTitle: 'Smart routing',
    stepTwoCopy:
      '多线路智能调度，单线故障秒级切换，兼顾稳定性、响应速度和成本。',
    stepThreeTitle: 'Clear billing',
    stepThreeCopy: '支持按量付费和月卡套餐，余额、消耗和调用记录清晰可追踪。',
    modelsTitle: '覆盖主流模型，保留切换空间',
    modelsCopy:
      '从 Claude Code 到批量内容生成，从 Agent 工作流到普通聊天应用，同一套 API 可以按任务选择合适模型。',
    opusCopy: '适合复杂推理、架构设计、高价值工程任务和长链路 Agent。',
    sonnetCopy: '日常主力编码模型，速度、能力和成本之间的稳定组合。',
    haikuCopy: '适合轻量补全、快速迭代、批处理和成本敏感型任务。',
    openaiCopy: '覆盖复杂编码、多步推理、多模态和 OpenAI 编码 CLI 场景。',
    toolsTitle: '接入常用 AI 编程工具，不改变你的工作流',
    toolsCopy:
      '面向 Claude Code、Codex、OpenCode、OpenClaw、Cursor、VS Code、Windsurf、Cherry Studio 和自研服务。把模型选择交给配置，把开发体验留在熟悉的工具里。',
    pricingTitle: '小规模试用不心疼，高频开发也能控成本',
    pricingCopy:
      '1 人民币 = 1 美元额度。保留按量计费的灵活性，也提供适合 Claude Code 高频使用的月卡。',
    usage: '按量',
    standard: '标准',
    standardCopy: '适合试用、原型、低频调用。',
    standardOne: '所有模型按量扣费',
    standardTwo: '余额长期有效',
    standardThree: '实时调用记录',
    standardCta: '充值余额',
    recommended: '推荐',
    monthly: '标准版月卡',
    monthlyCopy: '适合重度代码编写、长文档分析和日常 AI 编程。',
    monthlyOne: '$50 / 天额度',
    monthlyTwo: '每日刷新',
    monthlyThree: '约 0.33 ¥ / USD',
    monthlyCta: '选择月卡',
    team: '团队',
    teamTitle: '团队版月卡',
    teamCopy: '适合极高频用户、小型工作室和团队代理服务。',
    teamOne: '$200 / 天额度',
    teamTwo: '支持全部模型',
    teamThree: '约 0.31 ¥ / USD',
    teamCta: '联系团队',
    docsTitle: '三步完成迁移',
    docsOneTitle: '创建 API Key',
    docsOneCopy: '登录后台创建密钥，可按项目、工具或团队成员拆分管理。',
    docsTwoTitle: '替换 Base URL',
    docsTwoCopy:
      '在 Claude Code、Cursor、Codex 或 OpenAI SDK 中配置 CCSub 网关地址。',
    docsThreeTitle: '选择模型并调用',
    docsThreeCopy:
      '用熟悉的 OpenAI API 格式请求，按任务切换 Claude、GPT、o3 或 Codex 模型。',
    faqTitle: '上线前最常问的几个问题',
    faqOneQ: 'CCSub 是模型厂商吗？',
    faqOneA:
      'CCSub 是稳定、实惠、开箱即用的 AI API 中转服务，帮助开发者通过一个入口调用不同模型，并集中管理密钥、余额和调用记录。',
    faqTwoQ: '现有 OpenAI SDK 能直接用吗？',
    faqTwoA:
      '大多数情况下可以。平台兼容 OpenAI 格式，保持请求格式不变，替换 Base URL 和 API Key 后即可接入。',
    faqThreeQ: '适合 Claude Code 高频使用吗？',
    faqThreeA:
      '适合。CCSub 主打 Claude Code 平替场景，并提供月卡和按量两种方式，方便按自己的调用频率选择。',
    faqFourQ: '余额会过期吗？',
    faqFourA:
      '按量付费额度长期有效，月卡每日额度按日刷新。正式上线时建议在支付页再次展示明确的余额规则。',
    finalHeading: '3 分钟开始你的 AI 编码之旅',
    finalFlow: '注册账号 → 充值 → 创建 API Key → 开始使用。就是这么简单。',
    finalMeta: '最低 ¥20 起充 · 额度永不过期 · 支持微信 / 支付宝 / USDT',
    finalPartner:
      '对分销合作感兴趣？注册后访问 分销中心 即可成为合伙人，佣金 20%-40%',
    finalCta: '立即注册',
    footer: '面向开发者的统一 AI 模型 API 基础设施。',
  },
  en: {
    navHome: 'Home',
    navConsole: 'Console',
    navMarketplace: 'Model Marketplace',
    navPlatform: 'Platform',
    navModels: 'Models',
    navPricing: 'Pricing',
    navFaq: 'FAQ',
    navDocs: 'Docs',
    navCta: 'Login',
    heroTitleOne: 'Unified',
    heroTitleTwo: 'model API',
    heroTitleThree: 'gateway',
    heroCopy:
      'Better pricing, better stability. Just replace your model base URL with:',
    heroPrimary: 'Start building',
    heroSecondary: 'View models',
    providerTitle: 'Supported by a broad model provider network',
    platformTitle:
      'Compress model access, billing, and tool compatibility into one clean gateway',
    platformCopy:
      'CCSub is built for developers who rely on AI coding tools, agent automation, and model APIs every day. Stop juggling accounts, credits, and keys across providers.',
    routingBadge: 'Live gateway',
    availability: 'Availability',
    failover: 'Failover',
    failoverValue: 'Seconds',
    billing: 'Billing',
    stepOneTitle: 'One key',
    stepOneCopy:
      'Unified authentication with OpenAI-compatible requests. Most clients only need a Base URL swap.',
    stepTwoTitle: 'Smart routing',
    stepTwoCopy:
      'Multi-route scheduling with second-level failover, tuned for availability, latency, and cost.',
    stepThreeTitle: 'Clear billing',
    stepThreeCopy:
      'Use pay-as-you-go or monthly plans with transparent balances, usage, and call logs.',
    modelsTitle: 'Access leading models without locking yourself in',
    modelsCopy:
      'From Claude Code to batch generation, agent workflows, and chat products, one API lets each task choose the right model.',
    opusCopy:
      'For deep reasoning, architecture work, high-value engineering, and long-running agents.',
    sonnetCopy:
      'A daily coding workhorse with a strong balance of speed, capability, and cost.',
    haikuCopy:
      'For lightweight completion, fast iteration, batch work, and cost-sensitive tasks.',
    openaiCopy:
      'For advanced coding, multi-step reasoning, multimodal tasks, and OpenAI coding CLI workflows.',
    toolsTitle: 'Connect the AI coding tools you already use',
    toolsCopy:
      'Use CCSub with Claude Code, Codex, OpenCode, OpenClaw, Cursor, VS Code, Windsurf, Cherry Studio, and your own services without changing your workflow.',
    pricingTitle:
      'Start small, then scale heavy AI coding without losing cost control',
    pricingCopy:
      '1 RMB equals 1 USD credit. Keep pay-as-you-go flexibility or choose monthly plans for high-frequency Claude Code usage.',
    usage: 'Usage',
    standard: 'Standard',
    standardCopy: 'For trials, prototypes, and occasional calls.',
    standardOne: 'Usage-based billing for every model',
    standardTwo: 'Credits do not expire',
    standardThree: 'Real-time call records',
    standardCta: 'Top up balance',
    recommended: 'Recommended',
    monthly: 'Standard Monthly',
    monthlyCopy:
      'For heavy coding, long document analysis, and daily AI development.',
    monthlyOne: '$50 daily credits',
    monthlyTwo: 'Refreshes every day',
    monthlyThree: 'About 0.33 RMB / USD',
    monthlyCta: 'Choose monthly',
    team: 'Team',
    teamTitle: 'Team Monthly',
    teamCopy:
      'For very high-frequency users, small studios, and team agent services.',
    teamOne: '$200 daily credits',
    teamTwo: 'All models supported',
    teamThree: 'About 0.31 RMB / USD',
    teamCta: 'Contact team',
    docsTitle: 'Migrate in three steps',
    docsOneTitle: 'Create an API key',
    docsOneCopy:
      'Create keys in the dashboard and separate them by project, tool, or teammate.',
    docsTwoTitle: 'Replace the Base URL',
    docsTwoCopy:
      'Configure the CCSub gateway in Claude Code, Cursor, Codex, or the OpenAI SDK.',
    docsThreeTitle: 'Choose a model and call',
    docsThreeCopy:
      'Use familiar OpenAI API requests and switch between Claude, GPT, o3, and Codex models by task.',
    faqTitle: 'Questions teams ask before going live',
    faqOneQ: 'Is CCSub a model provider?',
    faqOneA:
      'CCSub is a stable, affordable, ready-to-use AI API transfer service that lets developers call different models through one gateway while managing keys, credits, and logs in one place.',
    faqTwoQ: 'Can I use my existing OpenAI SDK setup?',
    faqTwoA:
      'In most cases, yes. CCSub is OpenAI-compatible, so you can keep the request format and replace the Base URL and API key.',
    faqThreeQ: 'Is it suitable for high-frequency Claude Code usage?',
    faqThreeA:
      'Yes. CCSub focuses on Claude Code replacement scenarios and offers both monthly and pay-as-you-go plans for different usage levels.',
    faqFourQ: 'Do credits expire?',
    faqFourA:
      'Pay-as-you-go credits remain valid long term, while monthly plan credits refresh daily. Show the final balance rules again on the payment page.',
    finalHeading: 'Start your AI coding workflow in 3 minutes',
    finalFlow:
      'Sign up → top up → create an API key → start using it. That simple.',
    finalMeta:
      'Top up from ¥20 · credits do not expire · WeChat / Alipay / USDT supported',
    finalPartner:
      'Interested in distribution? Visit the partner center after signup and earn 20%-40% commission.',
    finalCta: 'Sign up now',
    footer: 'Unified AI model API infrastructure for builders.',
  },
};

const providerLogos = [
  ['Moonshot', '/assets/pinchtoken-models/moonshot.svg'],
  ['OpenAI', '/assets/pinchtoken-models/openai.svg'],
  ['xAI', '/assets/pinchtoken-models/xai.svg'],
  ['Zhipu AI', '/assets/pinchtoken-models/zhipu-color.svg'],
  ['Volcengine', '/assets/pinchtoken-models/volcengine-color.svg'],
  ['Cohere', '/assets/pinchtoken-models/cohere-color.svg'],
  ['Claude', '/assets/pinchtoken-models/claude-color.svg'],
  ['Gemini', '/assets/pinchtoken-models/gemini-color.svg'],
  ['Suno', '/assets/pinchtoken-models/suno.svg'],
  ['MiniMax', '/assets/pinchtoken-models/minimax-color.svg'],
  ['Custom Provider', '/assets/pinchtoken-models/provider-custom-primary.svg'],
  ['Wenxin', '/assets/pinchtoken-models/wenxin-color.svg'],
  ['Qingyan', '/assets/pinchtoken-models/qingyan-color.svg'],
  ['DeepSeek', '/assets/pinchtoken-models/deepseek-color.svg'],
  ['Qwen', '/assets/pinchtoken-models/qwen-color.svg'],
  ['Midjourney', '/assets/pinchtoken-models/midjourney.svg'],
  ['PinchToken', '/assets/pinchtoken-models/pinchtoken.svg'],
  ['Hunyuan', '/assets/pinchtoken-models/hunyuan-color.svg'],
  [
    'Additional Provider',
    '/assets/pinchtoken-models/provider-custom-before-more.svg',
  ],
];

const tools = [
  ['Claude Code', '/assets/claude.svg'],
  ['Codex', '/assets/openai.svg'],
  ['OpenCode', '/assets/tools/opencode.svg'],
  ['OpenClaw', '/assets/tools/openclaw.svg'],
  ['Cursor', '/assets/tools/cursor.svg'],
  ['VS Code', '/assets/tools/vscode.svg'],
  ['Windsurf', '/assets/tools/windsurf.svg'],
  ['Cherry Studio', '/assets/tools/cherry-studio.png'],
  ['OpenAI SDK', '/assets/openai.svg'],
];

const endpointPaths = [
  '/v1/messages',
  '/v1/chat/completions',
  '/v1/responses',
  '/v1/audio/speech',
  '/v1/images/generations',
  '/v1/embeddings',
];

function normalizeBaseUrl(baseUrl) {
  return (baseUrl || window.location.origin).replace(/\/+$/, '');
}

function Hero({ baseUrl, t }) {
  const [copied, setCopied] = useState(false);
  const [endpointIndex, setEndpointIndex] = useState(0);
  const endpointPath = endpointPaths[endpointIndex];
  const displayBaseUrl = normalizeBaseUrl(baseUrl);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setEndpointIndex((current) => (current + 1) % endpointPaths.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, []);

  const copyEndpoint = async () => {
    await navigator.clipboard?.writeText(`${displayBaseUrl}${endpointPath}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <section className='hero-shell' id='top' aria-labelledby='hero-title'>
      <div className='hero-main'>
        <div className='hero-stack'>
          <h1 className='hero-title' id='hero-title'>
            <span>{t.heroTitleOne}</span>
            <span>
              {t.heroTitleTwo}
              {t.heroTitleThree}
            </span>
          </h1>
          <p className='hero-copy'>{t.heroCopy}</p>

          <div className='api-address' aria-label='CCSub API endpoint'>
            <span>{displayBaseUrl}</span>
            <strong className='endpoint-path' key={endpointPath}>
              {endpointPath}
            </strong>
            <button
              className='copy-endpoint'
              type='button'
              onClick={copyEndpoint}
              aria-label='Copy API endpoint'
            >
              {copied ? (
                <Check size={22} aria-hidden='true' />
              ) : (
                <Copy
                  className='copy-endpoint-icon'
                  size={22}
                  aria-hidden='true'
                />
              )}
            </button>
          </div>

          <div className='hero-actions'>
            <a className='button button-primary' href='#pricing'>
              <span>{t.heroPrimary}</span>
              <ArrowRight size={21} aria-hidden='true' />
            </a>
            <a className='button button-ghost-dark' href='#models'>
              <span>{t.heroSecondary}</span>
              <Boxes size={20} aria-hidden='true' />
            </a>
          </div>
        </div>
      </div>

      <div className='provider-cloud' aria-label={t.providerTitle}>
        <p className='provider-title'>{t.providerTitle}</p>
        <div className='provider-grid'>
          {providerLogos.map(([name, src], index) => (
            <span
              className='provider-logo'
              aria-label={name}
              key={name}
              style={{ '--i': index }}
            >
              <img src={src} alt='' aria-hidden='true' />
            </span>
          ))}
          <span
            className='provider-logo provider-more'
            aria-label='More providers'
            style={{ '--i': providerLogos.length }}
          >
            30+
          </span>
        </div>
      </div>
    </section>
  );
}

function Platform({ t }) {
  const steps = [
    [KeyRound, t.stepOneTitle, t.stepOneCopy],
    [Route, t.stepTwoTitle, t.stepTwoCopy],
    [WalletCards, t.stepThreeTitle, t.stepThreeCopy],
  ];

  return (
    <section className='section' id='platform'>
      <div className='section-inner two-column'>
        <div className='section-copy'>
          <p className='eyebrow'>{t.navPlatform}</p>
          <h2 className='platform-heading'>{t.platformTitle}</h2>
          <p>{t.platformCopy}</p>
        </div>

        <div className='product-card routing-product'>
          <div className='product-header'>
            <span className='badge-pill'>{t.routingBadge}</span>
          </div>
          <div className='metric-grid'>
            <div>
              <span>{t.availability}</span>
              <strong>99.9%</strong>
            </div>
            <div>
              <span>{t.failover}</span>
              <strong>{t.failoverValue}</strong>
            </div>
            <div>
              <span>{t.billing}</span>
              <strong>1:1</strong>
            </div>
          </div>
          <div className='workflow-list'>
            {steps.map(([Icon, title, text]) => (
              <article key={title}>
                <Icon aria-hidden='true' />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Models({ t }) {
  const models = [
    [
      'Claude',
      '/assets/claude.svg',
      'Claude Opus 4.6',
      t.opusCopy,
      '$5',
      '$25',
    ],
    [
      'Claude',
      '/assets/claude.svg',
      'Claude Sonnet 4.6',
      t.sonnetCopy,
      '$3',
      '$15',
    ],
    [
      'Claude',
      '/assets/claude.svg',
      'Claude Haiku 4.5',
      t.haikuCopy,
      '$0.8',
      '$4',
    ],
    [
      'OpenAI',
      '/assets/openai.svg',
      'GPT-5.4 / o3 / Codex',
      t.openaiCopy,
      '$5',
      '$15',
    ],
  ];

  return (
    <section className='section' id='models'>
      <div className='section-inner'>
        <div className='section-heading'>
          <p className='eyebrow'>{t.navModels}</p>
          <h2>{t.modelsTitle}</h2>
          <p>{t.modelsCopy}</p>
        </div>
        <div className='model-grid'>
          {models.map(([provider, logo, title, text, input, output]) => (
            <article className='model-card' key={title}>
              <span className='badge-pill model-badge'>
                <img src={logo} alt='' aria-hidden='true' />
                <span>{provider}</span>
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <code className='model-price'>
                <span className='price-amount'>{input}</span> input /{' '}
                <span className='price-amount'>{output}</span> output{' '}
                <span className='price-unit'>per MTok</span>
              </code>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tools({ t }) {
  return (
    <section className='section'>
      <div className='section-inner two-column reverse'>
        <div className='product-card tool-product'>
          <div className='tool-grid' aria-label='Compatible tools'>
            {tools.map(([name, src], index) => (
              <span key={name} style={{ '--i': index }}>
                <img src={src} alt='' aria-hidden='true' />
                <strong>{name}</strong>
              </span>
            ))}
          </div>
        </div>
        <div className='section-copy'>
          <p className='eyebrow'>
            {t.toolsTitle.includes('Connect') ? 'Compatibility' : '兼容工具'}
          </p>
          <h2>{t.toolsTitle}</h2>
          <p>{t.toolsCopy}</p>
        </div>
      </div>
    </section>
  );
}

function Pricing({ t }) {
  const cards = [
    [
      t.usage,
      t.standard,
      t.standardCopy,
      '¥100',
      '$100 额度',
      [t.standardOne, t.standardTwo, t.standardThree],
      t.standardCta,
      false,
    ],
    [
      t.recommended,
      t.monthly,
      t.monthlyCopy,
      '¥499',
      '/ month',
      [t.monthlyOne, t.monthlyTwo, t.monthlyThree],
      t.monthlyCta,
      true,
    ],
    [
      t.team,
      t.teamTitle,
      t.teamCopy,
      '¥1,999',
      '/ month',
      [t.teamOne, t.teamTwo, t.teamThree],
      t.teamCta,
      false,
    ],
  ];

  return (
    <section className='section' id='pricing'>
      <div className='section-inner'>
        <div className='section-heading'>
          <p className='eyebrow'>{t.navPricing}</p>
          <h2>{t.pricingTitle}</h2>
          <p>{t.pricingCopy}</p>
        </div>
        <div className='pricing-grid'>
          {cards.map(
            (
              [badge, title, text, price, unit, features, cta, featured],
              index,
            ) => (
              <article
                className={`pricing-card ${featured ? 'featured' : ''}`}
                key={title}
                style={{ '--i': index }}
              >
                <span className='badge-pill'>{badge}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className='price'>
                  {price}
                  <small>{unit}</small>
                </div>
                <ul className='feature-list'>
                  {features.map((feature) => (
                    <li key={feature}>
                      <Check aria-hidden='true' />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  className={`button ${featured ? 'button-primary' : 'button-light'}`}
                  href='/console/topup'
                >
                  {cta}
                </a>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function Docs({ t }) {
  const steps = [
    ['01', t.docsOneTitle, t.docsOneCopy],
    ['02', t.docsTwoTitle, t.docsTwoCopy],
    ['03', t.docsThreeTitle, t.docsThreeCopy],
  ];

  return (
    <section className='section' id='docs'>
      <div className='section-inner'>
        <div className='section-heading'>
          <p className='eyebrow'>{t.navDocs}</p>
          <h2>{t.docsTitle}</h2>
        </div>
        <div className='docs-grid'>
          {steps.map(([number, title, text], index) => (
            <article className='doc-step' key={number} style={{ '--i': index }}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ t }) {
  const [open, setOpen] = useState(0);
  const items = [
    [t.faqOneQ, t.faqOneA],
    [t.faqTwoQ, t.faqTwoA],
    [t.faqThreeQ, t.faqThreeA],
    [t.faqFourQ, t.faqFourA],
  ];

  return (
    <section className='section' id='faq'>
      <div className='faq-wrap'>
        <div className='section-heading'>
          <p className='eyebrow'>{t.navFaq}</p>
          <h2>{t.faqTitle}</h2>
        </div>
        {items.map(([question, answer], index) => (
          <div className='faq-item' key={question}>
            <button
              className='faq-button'
              type='button'
              onClick={() => setOpen(open === index ? -1 : index)}
            >
              <span>{question}</span>
              <ChevronDown
                className={`transition-transform ${open === index ? 'rotate-180' : ''}`}
                aria-hidden='true'
              />
            </button>
            {open === index ? <p>{answer}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ t }) {
  return (
    <section className='section'>
      <div className='section-inner'>
        <div className='final-card'>
          <div className='final-message'>
            <h2>{t.finalHeading}</h2>
            <p>{t.finalFlow}</p>
          </div>
          <a className='button button-primary final-cta' href='/register'>
            {t.finalCta}
            <ArrowRight size={20} aria-hidden='true' />
          </a>
          <div className='final-note'>
            <p>{t.finalMeta}</p>
            <p>{t.finalPartner}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const activeAppLang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const [noticeVisible, setNoticeVisible] = useState(false);
  const t = useMemo(
    () => landingCopy[activeAppLang] || landingCopy.zh,
    [activeAppLang],
  );
  const serverAddress =
    statusState?.status?.server_address || window.location.origin;

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate === today) {
        return;
      }

      try {
        const res = await API.get('/api/notice');
        const { success, data } = res.data;
        if (success && data && data.trim() !== '') {
          setNoticeVisible(true);
        }
      } catch (error) {
        console.error('获取公告失败:', error);
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      window.setTimeout(() => {
        const headerOffset = 96;
        const top =
          target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'auto' });
      }, 50);
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  return (
    <div className='api-transfer-home'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      <main>
        <Hero baseUrl={serverAddress} t={t} />
        <Platform t={t} />
        <Models t={t} />
        <Tools t={t} />
        {SHOW_PRICING_SECTION && <Pricing t={t} />}
        <Docs t={t} />
        <Faq t={t} />
        <FinalCta t={t} />
      </main>
      <footer className='footer'>
        <p>CCSub - {t.footer}</p>
      </footer>
    </div>
  );
}
