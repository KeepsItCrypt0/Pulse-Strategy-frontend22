// src/components/Footer.jsx
const Footer = ({ chainId }) => {
  return (
    <footer className="mt-16 w-full text-center text-gray-600 text-xs">
      <div className="mb-1">
        <a
          href="https://github.com/KeepsItCrypt0/PulseStrategy"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link mx-1"
        >
          View Contracts on GitHub
        </a>
        <span>|</span>
        <a
          href="https://x.com/PulseStrategy"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link mx-1"
        >
          Follow @PulseStrategy on X
        </a>
      </div>
      <p className="max-w-lg mx-auto">
        <strong>Disclaimer:</strong> PulseStrategy is a decentralized finance (DeFi) platform. 
        Investing in DeFi involves significant risks, including the potential loss of all invested funds. 
        Cryptocurrencies and smart contracts are volatile and may be subject to hacks, bugs, or market fluctuations. 
        Always conduct your own research and consult with a financial advisor before participating. 
        By using this platform, you acknowledge these risks and agree that PulseStrategy and its developers are not liable for any losses.
      </p>
    </footer>
  );
};

export default Footer;
