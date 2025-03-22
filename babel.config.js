// babel.config.js
module.exports = {
  presets: [
    'next/babel', // ✅ Must be included for Next.js support
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};
