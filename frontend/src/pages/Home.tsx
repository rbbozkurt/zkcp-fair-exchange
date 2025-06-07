import { ReactTyped } from 'react-typed';
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Lock } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="bg-black text-white">
      {/* Hero Section */}
      <Hero />
      {/* Features Section */}
      <Features />
    </div>
  );
};

export default Home;

const Hero: React.FC = () => {
  return (
    <section className="min-h-screen pt-24 px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl text-center space-y-8">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
          Empowering <span className="text-yellow-400">Privacy</span>
          <br />
          Through{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Zero-Knowledge
          </span>
        </h1>

        <div className="text-xl md:text-2xl text-gray-300">
          <ReactTyped
            strings={[
              'Decentralized Fair Exchange',
              'Trustless Transactions',
              'Built with zk-SNARKs & Solidity',
              'Secure. Transparent. Efficient.',
            ]}
            typeSpeed={40}
            backSpeed={25}
            loop
          />
        </div>
      </div>
    </section>
  );
};

const features = [
  {
    title: 'Privacy First',
    description: 'Zero-knowledge proofs ensure complete confidentiality of transactions.',
    icon: ShieldCheck,
  },
  {
    title: 'Instant Settlement',
    description: 'Transactions are executed trustlessly and finalized immediately.',
    icon: Zap,
  },
  {
    title: 'Secure Protocols',
    description: 'Built using industry-grade cryptographic primitives and smart contracts.',
    icon: Lock,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Features: React.FC = () => {
  return (
    <section className="py-12 px-4 bg-gradient-to-b from-black to-black-800 text-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">Key Features</h2>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map(({ title, description, icon: Icon }) => (
            <motion.div
              key={title}
              variants={item}
              className="p-6 rounded-lg bg-black/30 border border-gray-700 shadow-lg backdrop-blur-lg"
            >
              <Icon className="w-10 h-10 text-yellow-400 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-300 text-sm">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
