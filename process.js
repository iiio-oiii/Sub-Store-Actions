async function operator(proxies) {
    // 1. 过滤掉空节点
    const validProxies = (proxies || []).filter(p => p && p.server);
    
    // 2. 筛选香港
    const hkKeywords = /(香港|HK|HongKong|🇭🇰|Hong Kong)/i;
    let hkProxies = validProxies.filter(p => p.name && hkKeywords.test(p.name));
    
    console.log(`[Docker] HK Potential: ${hkProxies.length}`);
    if (hkProxies.length === 0) return [];

    // 3. 并发测速 (Docker 环境网络很稳)
    const results = await Promise.all(hkProxies.map(async (p) => {
        try {
            const delay = await $.testProxy(p, {
                url: 'http://www.gstatic.com/generate_204',
                timeout: 2000
            });
            return delay > 0;
        } catch (e) {
            return false;
        }
    }));
    
    const aliveProxies = hkProxies.filter((_, index) => results[index]);

    // 4. 去重
    const uniqueMap = new Map();
    aliveProxies.forEach(p => uniqueMap.set(`${p.server}:${p.port}`, p));

    console.log(`[Docker] Final HK: ${uniqueMap.size}`);
    return Array.from(uniqueMap.values());
}
