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

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Menu, X } from 'lucide-react';
import { useHeaderBar } from '../../../hooks/common/useHeaderBar';
import { useNotifications } from '../../../hooks/common/useNotifications';
import NoticeModal from '../NoticeModal';
import './api-transfer-header.css';

const HeaderBar = ({ onMobileMenuToggle, drawerOpen }) => {
  const {
    userState,
    statusState,
    isMobile,
    currentLang,
    systemName,
    isConsoleRoute,
    location,
    pricingRequireAuth,
    logout,
    handleLanguageChange,
    handleMobileMenuToggle,
    navigate,
    t,
  } = useHeaderBar({ onMobileMenuToggle, drawerOpen });

  const {
    noticeVisible,
    unreadCount,
    handleNoticeOpen,
    handleNoticeClose,
    getUnreadKeys,
  } = useNotifications(statusState);

  const isHomeRoute = location.pathname === '/';
  const useLightTopbar = !isHomeRoute;
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const onHeroSurface = isHomeRoute;
  const activeLang = currentLang?.startsWith('zh') ? 'zh' : 'en';
  const brandName = systemName || 'CCSub';
  const brandInitial = (brandName || 'C').trim().slice(0, 1).toUpperCase();

  const navLinks = useMemo(() => {
    const requireLogin = !userState.user;
    return [
      {
        text: t('首页'),
        to: '/',
      },
      {
        text: t('控制台'),
        to: requireLogin ? '/login' : '/console',
      },
      {
        text: t('模型广场'),
        to: pricingRequireAuth && requireLogin ? '/login' : '/pricing',
      },
    ];
  }, [pricingRequireAuth, t, userState.user]);

  useEffect(() => {
    setMobilePanelOpen(false);
  }, [location.pathname]);

  const toggleLanguage = () => {
    handleLanguageChange(activeLang === 'zh' ? 'en' : 'zh-CN');
  };

  const handleMenuClick = () => {
    if (isConsoleRoute && isMobile) {
      handleMobileMenuToggle();
      return;
    }
    setMobilePanelOpen((open) => !open);
  };

  const handleLogout = async () => {
    setMobilePanelOpen(false);
    await logout();
  };

  const topbarClassName = [
    'api-transfer-topbar',
    onHeroSurface ? 'api-transfer-topbar-hero' : '',
    useLightTopbar ? 'api-transfer-topbar-light' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={topbarClassName}>
      <NoticeModal
        visible={noticeVisible}
        onClose={handleNoticeClose}
        isMobile={isMobile}
        defaultTab={unreadCount > 0 ? 'system' : 'inApp'}
        unreadKeys={getUnreadKeys()}
      />

      <div className='api-transfer-topbar-inner'>
        <Link className='api-transfer-brand' to='/' aria-label={t('首页')}>
          <span className='api-transfer-brand-mark' aria-hidden='true'>
            {brandInitial}
          </span>
          <span>{brandName}</span>
        </Link>

        <nav className='api-transfer-nav' aria-label={t('顶部导航')}>
          {navLinks.map((link) => (
            <Link key={link.text} to={link.to}>
              {link.text}
            </Link>
          ))}
        </nav>

        <div className='api-transfer-actions'>
          <button
            className='api-transfer-icon-button'
            type='button'
            onClick={handleNoticeOpen}
            aria-label={t('系统公告')}
          >
            <Bell size={18} aria-hidden='true' />
            {unreadCount > 0 && (
              <span className='api-transfer-notice-dot'>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            className='api-transfer-lang-switch'
            data-lang={activeLang}
            type='button'
            onClick={toggleLanguage}
            aria-label={t('common.changeLanguage')}
          >
            <span>中</span>
            <span>EN</span>
          </button>

          {userState.user ? (
            <>
              <button
                className='api-transfer-user-button'
                type='button'
                onClick={() => navigate('/console/personal')}
              >
                <span>
                  {userState.user.username?.slice(0, 1).toUpperCase()}
                </span>
                <strong>{userState.user.username}</strong>
              </button>
              <button
                className='api-transfer-topbar-button api-transfer-topbar-button-ghost'
                type='button'
                onClick={handleLogout}
              >
                {t('退出')}
              </button>
            </>
          ) : (
            <Link
              className='api-transfer-topbar-button api-transfer-topbar-button-primary'
              to='/login'
            >
              <span>{t('登录')}</span>
              <ArrowRight size={17} aria-hidden='true' />
            </Link>
          )}
        </div>

        <button
          className='api-transfer-mobile-menu'
          type='button'
          aria-label={
            isConsoleRoute && isMobile
              ? drawerOpen
                ? t('关闭侧边栏')
                : t('打开侧边栏')
              : mobilePanelOpen
                ? t('关闭导航')
                : t('打开导航')
          }
          aria-expanded={
            isConsoleRoute && isMobile ? drawerOpen : mobilePanelOpen
          }
          onClick={handleMenuClick}
        >
          {(isConsoleRoute && isMobile ? drawerOpen : mobilePanelOpen) ? (
            <X size={22} aria-hidden='true' />
          ) : (
            <Menu size={22} aria-hidden='true' />
          )}
        </button>
      </div>

      <div className='api-transfer-mobile-panel' data-open={mobilePanelOpen}>
        {navLinks.map((link) => (
          <Link
            key={link.text}
            to={link.to}
            onClick={() => setMobilePanelOpen(false)}
          >
            {link.text}
            <ArrowRight size={18} aria-hidden='true' />
          </Link>
        ))}
        <button
          className='api-transfer-lang-switch'
          data-lang={activeLang}
          type='button'
          onClick={toggleLanguage}
          aria-label={t('common.changeLanguage')}
        >
          <span>中</span>
          <span>EN</span>
        </button>
        {userState.user ? (
          <button
            className='api-transfer-mobile-action'
            type='button'
            onClick={handleLogout}
          >
            {t('退出')}
          </button>
        ) : (
          <Link
            className='api-transfer-mobile-action'
            to='/login'
            onClick={() => setMobilePanelOpen(false)}
          >
            {t('登录')}
          </Link>
        )}
      </div>
    </header>
  );
};

export default HeaderBar;
