async function operator(proxies) {
    // 1. 深度安全检查
    let validProxies = (proxies || []).filter(p => p && typeof p === 'object' && p.server);

    // 2. 内存保护：防止节点过多撑爆 GitHub Actions 内存 (放在函数内部第一步)
    if (validProxies.length > 3000) {
        console.log(`[Warn] Nodes too many (${validProxies.length}), slicing to 3000`);
        validProxies = validProxies.slice(0, 3000);
    }

    console.log(`[Input] Total nodes received: ${validProxies.length}`);

    // 3. 关键词过滤：香港/HK
    const hkKeywords = /(香港|HK|HongKong|🇭🇰|Hong Kong|HONG KONG)/i;
    let hkProxies = validProxies.filter(p => p.name && hkKeywords.test(p.name));
    
    console.log(`[Filter] Found ${hkProxies.length} HK potential nodes.`);

    if (hkProxies.length === 0) return [];

    // 4. 并发测速 (分批处理避免崩溃)
    // 这里的 $ 是 Sub-Store 注入的全局工具对象
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
    
    // 5. 筛选活节点
    const aliveProxies = hkProxies.filter((_, index) => results[index]);

    // 6. 强力去重
    const uniqueMap = new Map();
    aliveProxies.forEach(p => {
        const key = `${p.server}:${p.port}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, p);
        }
    });

    console.log(`[Success] Final clean HK nodes: ${uniqueMap.size}`);
    return Array.from(uniqueMap.values());
}
