import React from 'react';
import WalletConnectButton from './WalletConnectButton';
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  tabs: string[];
  selectedTab: string;
  onMenuItemClick: (tab: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ tabs, selectedTab, onMenuItemClick }) => {
  return (
    <header className="fixed top-4 left-0 w-full h-20 bg-transparent z-50 flex items-center justify-between">
      <div className="pl-6">
        <Logo />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2">
        <Menu tabs={tabs} selectedTab={selectedTab} onItemClick={onMenuItemClick} />
      </div>
      <div className="pr-6">
        <WalletButton />
      </div>
    </header>
  );
};

export default TopBar;

const Logo: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="h-16 flex items-center gap-2 px-6 rounded-full backdrop-blur-lg bg-black text-white text-lg backdrop-blur-md shadow-md hover:shadow-lg hover:scale-105 hover:text-pink-400 transition-all duration-200 cursor-pointer">
      <span>{t('app.name')}</span>
    </div>
  );
};

interface MenuProps {
  tabs: string[];
  selectedTab: string;
  onItemClick: (tab: string) => void;
}

const Menu: React.FC<MenuProps> = ({ tabs, selectedTab, onItemClick }) => (
  <div className="backdrop-blur-lg bg-black/10 border rounded-full px-0 h-16 flex items-center space-x-8">
    {tabs.map((tab) => {
      const isActive = tab === selectedTab;
      return (
        <a
          key={tab}
          href="#"
          className={`h-16 px-6 flex items-center justify-center rounded-full font-medium transition-colors duration-250 ${
            isActive ? 'bg-white text-black border-black' : 'text-white'
          }`}
          onClick={(e) => {
            e.preventDefault();
            onItemClick(tab);
          }}
        >
          {tab}
        </a>
      );
    })}
  </div>
);

const WalletButton: React.FC = () => (
  <div className="pr-6">
    <WalletConnectButton />
  </div>
);
