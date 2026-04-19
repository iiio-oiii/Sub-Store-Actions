async function operator(proxies, context) {
    // 1. 基础过滤：确保 proxies 存在且不为空
    if (!proxies || !Array.isArray(proxies)) return [];

    // 只留香港节点 (支持不区分大小写)
    let hkProxies = proxies.filter(p => p && p.name && /(香港|HK)/i.test(p.name));
    
    console.log(`Found ${hkProxies.length} HK proxies. Starting test...`);

    // 2. 测速过滤
    // 注意：在 CLI 环境中，使用 context.testProxy 或全局 testProxy
    const testResults = await Promise.all(hkProxies.map(async (p) => {
        try {
            // 尝试多种可能的测速函数调用方式
            const delay = await $.testProxy(p, {
                url: 'http://www.gstatic.com/generate_204',
                timeout: 2000
            });
            return delay > 0;
        } catch (e) {
            return false;
        }
    }));
    
    // 3. 过滤出活节点
    const aliveProxies = hkProxies.filter((_, index) => testResults[index]);

    // 4. 去重：基于服务器地址和端口
    const uniqueMap = new Map();
    aliveProxies.forEach(p => {
        const key = `${p.server}:${p.port}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, p);
        }
    });

    console.log(`Test finished. ${uniqueMap.size} unique alive HK proxies remaining.`);
    return Array.from(uniqueMap.values());
}
