import Home from './pages/Home';
import TopBar from './components/TopBar';
import { useState } from 'react';

function App() {
  const [selectedTab, setSelectedTab] = useState('Home');
  const handleMenuItemClick = (item: string) => {
    setSelectedTab(item);
  };

  return (
    <>
      <TopBar
        tabs={['Home', 'Marketplace', 'Portfolio', 'About Us']}
        selectedTab={selectedTab}
        onMenuItemClick={handleMenuItemClick}
      />
      <Home />
    </>
  );
}

export default App;
