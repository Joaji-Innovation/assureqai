const { join } = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  externals: [
    nodeExternals({
      modulesDir: join(__dirname, '../../node_modules'),
    }),
  ],
  externalsPresets: { node: true },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: join(__dirname, 'tsconfig.app.json'),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@assureqai/common': join(__dirname, '../../libs/common/src/index.ts'),
      '@assureqai/auth': join(__dirname, '../../libs/auth/src/index.ts'),
    },
  },
  output: {
    path: join(__dirname, '../../dist/apps/api-gateway'),
    filename: 'main.js',
    clean: true,
  },
  optimization: {
    minimize: false,
  },
};
