import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TopBar from './components/TopBar';
import { Marketplace } from './pages/Marketplace';
import { MarketPlaceNFTDetail } from './pages/MarketPlaceNFTDetail';
import { Portfolio } from './pages/Portfolio';

const tabs = [
  { name: 'Home', path: '/' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Portfolio', path: '/portfolio' },
];

function App() {
  return (
    <Router>
      <TopBar tabs={tabs} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        {/* New route for token-based NFT details (smart contract NFTs) */}
        <Route path="/marketplace/token/:tokenId" element={<MarketPlaceNFTDetail />} />
        {/* Legacy route for IPFS-based NFT details (mock data) */}
        <Route path="/marketplace/:ipfs_address" element={<MarketPlaceNFTDetail />} />
        <Route path="/portfolio" element={<Portfolio />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
