module.exports = function (api) {
  // Cache per platform so native and web get different transforms
  const platform = api.caller((c) => c?.platform);
  api.cache.using(() => platform);
  const isWeb = platform === 'web';
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: isWeb ? 'react' : 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
