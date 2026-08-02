const useragent = require('useragent');

/**
 * Parse raw User-Agent header into structured device metadata
 * @param {string} uaString - Raw User-Agent string from request
 * @returns {object} Device information (browser, os, device, raw)
 */
const parseUserAgent = (uaString) => {
  if (!uaString) {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      device: 'Desktop',
      raw: 'Unknown'
    };
  }

  const agent = useragent.parse(uaString);
  const device = useragent.is(uaString);

  let deviceType = 'Desktop';
  if (device.mobile_safari || device.android || device.tablet) {
    deviceType = device.tablet ? 'Tablet' : 'Mobile';
  }

  return {
    browser: `${agent.family} ${agent.major}.${agent.minor}`,
    os: agent.os.toString(),
    device: deviceType,
    raw: uaString
  };
};

module.exports = { parseUserAgent };
