module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Remove any 'expo-router/babel' plugins if they are here
  };
};
