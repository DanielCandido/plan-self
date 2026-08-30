const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  typedRoutes: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
};
