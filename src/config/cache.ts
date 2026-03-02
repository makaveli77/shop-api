import NodeCache from 'node-cache';

// stdTTL: 600 (10 minutes default)
// checkperiod: 120 (check for expired keys every 2 mins)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export default cache;
