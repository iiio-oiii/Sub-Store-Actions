async function operator(proxies) {
    // 1. 基础过滤
    let validProxies = (proxies || []).filter(p => p && p.server);

    // 2. 香港过滤
    const hkKeywords = /(香港|HK|HongKong|🇭🇰|Hong Kong|HONG KONG)/i;
    let hkProxies = validProxies.filter(p => p.name && hkKeywords.test(p.name));
    
    console.log(`[Filter] Found ${hkProxies.length} HK potential nodes.`);
    if (hkProxies.length === 0) return [];

    // 3. 测速 (在 sub-store-cli 中使用 $.testProxy)
    const results = await Promise.all(hkProxies.map(async (p) => {
        try {
            // CLI 环境下 $ 是注入好的
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

    console.log(`[Success] Final HK: ${uniqueMap.size}`);
    return Array.from(uniqueMap.values());
}
