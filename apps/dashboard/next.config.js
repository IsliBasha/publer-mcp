const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: false })

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@publer-mcp/shared-types', '@publer-mcp/publer-client'],
}

module.exports = nextConfig
