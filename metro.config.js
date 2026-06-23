const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
    '@': path.resolve(__dirname, 'src'),
};

// Fix broken `module` field in react-async-hook (used by react-native-country-picker-modal).
// The package.json `module` field points to root but the ESM file lives in dist/.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'react-async-hook') {
        return {
            filePath: path.resolve(__dirname, 'node_modules/react-async-hook/dist/index.js'),
            type: 'sourceFile',
        };
    }
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
