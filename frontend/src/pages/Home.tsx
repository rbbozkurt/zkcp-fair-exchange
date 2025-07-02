import React from 'react';
import { ReactTyped } from 'react-typed';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Lock } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const features = [
    {
      title: t('home.features.privacy.title'),
      description: t('home.features.privacy.description'),
      icon: ShieldCheck,
    },
    {
      title: t('home.features.instant.title'),
      description: t('home.features.instant.description'),
      icon: Zap,
    },
    {
      title: t('home.features.secure.title'),
      description: t('home.features.secure.description'),
      icon: Lock,
    },
  ];
  return (
    <div className="bg-black text-white">
      {/* Hero Section */}
      <Hero
        title={t('home.hero.title')}
        typeSubTitles={[
          t('home.hero.typed.0'),
          t('home.hero.typed.1'),
          t('home.hero.typed.2'),
          t('home.hero.typed.3'),
        ]}
      />
      {/* Features Section */}
      <Features features={features} />
    </div>
  );
};

export default Home;

interface HeroProps {
  title: string;
  typeSubTitles: string[];
}
const Hero: React.FC<HeroProps> = ({ title, typeSubTitles }) => {
  return (
    <section className="min-h-screen pt-24 px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl text-center space-y-8">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
          <Trans
            i18nKey={title}
            components={{
              1: <span className="text-yellow-400" />,
              3: (
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent" />
              ),
            }}
          />
        </h1>

        <div className="text-xl md:text-2xl text-gray-300">
          <ReactTyped strings={typeSubTitles} typeSpeed={40} backSpeed={25} loop />
        </div>
      </div>
    </section>
  );
};

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

interface Feature {
  title: string;
  description: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

interface FeatureProps {
  features: Feature[];
}

const Features: React.FC<FeatureProps> = ({ features }) => {
  const { t } = useTranslation();

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-black to-black-800 text-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">{t('home.features_title')}</h2>
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
              {Icon && <Icon className="w-10 h-10 text-yellow-400 mb-4 mx-auto" />}
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-300 text-sm">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
