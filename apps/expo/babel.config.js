module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // react-native-reanimated/plugin must be listed last (required by draggable-flatlist).
    plugins: ["react-native-reanimated/plugin"],
  };
};
