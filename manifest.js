const isProd = process.argv[2] === 'prod';
const devPath = 'http://localhost:9002';

const manifestData = {
  name: 'ZIS Workflow Manager',
  // Version updated to match the package version in package.json
  version: process.env.npm_package_version,
  frameworkVersion: '2.0',
  author: {
    name: 'Zendesk',
    email: 'ashwin.shenoy@zendesk.com',
    url: 'https://support.zendesk.com',
  },
  defaultLocale: 'en',
  private: true,
  location: {
    support: {
      nav_bar: isProd ? 'https://ashwinshenoy.com/ZIS-Workflow-Manager/assets/index.html' : devPath,
    },
  },
  parameters: [
    {
      name: 'IS_PRODUCTION',
      type: 'hidden',
      default: isProd ? 'true' : 'false',
    },
  ],
};

export default manifestData;
