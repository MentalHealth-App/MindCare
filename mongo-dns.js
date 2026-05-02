'use strict';
const dns = require('dns');

// Public DNS for SRV lookups used by mongodb+srv:// (before mongoose.connect).
// Helps when OS DNS returns querySrv ECONNREFUSED (common on some Windows networks).
const servers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,8.8.4.4')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (servers.length) {
  dns.setServers(servers);
}
