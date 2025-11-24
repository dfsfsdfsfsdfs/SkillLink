import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center space-x-2">
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full animate-bounce"
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

export default Loader;