async function operator(proxies) {
    // 1. 深度安全检查：过滤掉订阅源中可能产生的空值或非对象
    const validProxies = (proxies || []).filter(p => p && typeof p === 'object' && p.server);

    console.log(`[Input] Total nodes received: ${validProxies.length}`);

    // 2. 关键词过滤：针对你要求的 香港/HK
    // 增加对 Emoji 旗帜和常见命名的支持
    const hkKeywords = /(香港|HK|HongKong|🇭🇰|Hong Kong|HONG KONG)/i;
    let hkProxies = validProxies.filter(p => p.name && hkKeywords.test(p.name));
    
    console.log(`[Filter] Found ${hkProxies.length} HK potential nodes.`);

    // 3. 异步并发测速（带严格容错和超时控制）
    // 免费节点多且杂，设置 2000ms 超时是金融交易环境的底线
    const results = await Promise.all(hkProxies.map(async (p) => {
        try {
            // 使用子商店标准测试 API
            const delay = await $.testProxy(p, {
                url: 'http://www.gstatic.com/generate_204',
                timeout: 2000
            });
            return delay > 0;
        } catch (e) {
            // 捕获特定协议不支持或解析失败的错误
            return false;
        }
    }));
    
    // 4. 筛选活节点
    const aliveProxies = hkProxies.filter((_, index) => results[index]);

    // 5. 强力去重：按服务器地址和端口去重
    // 免费订阅源互相采集，去重能帮你节省 70% 以上的内存
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
