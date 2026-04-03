import React, { useState, useEffect } from 'react';

interface SplashViewProps {
  onFinish: () => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ onFinish }) => {
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    // Анімація появи
    setTimeout(() => setOpacity(1), 100);
    setTimeout(() => setScale(1), 100);
    
    // Завершення splash екрану
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-xl">
      <div
        className="text-center transition-all duration-500"
        style={{ opacity, transform: `scale(${scale})` }}
      >
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-2xl">
          <span className="text-5xl">🧠</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          FinanceAI
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">Ваш фінансовий помічник</p>
      </div>
    </div>
  );
};

export default SplashView;
