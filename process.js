async function operator(proxies) {
    // 1. 深度安全检查：防止输入数据为空或格式错误
    if (!proxies || !Array.isArray(proxies)) {
        console.log("Warning: No proxies found in subscription.");
        return [];
    }

    console.log(`Initial total proxies: ${proxies.length}`);

    // 2. 格式化并筛选香港节点
    // 增加对 p.name 和 p.server 的存在性检查，防止遇到空节点报错
    let hkProxies = proxies.filter(p => {
        try {
            return p && p.name && /(香港|HK|HongKong|🇭🇰|Hong Kong)/i.test(p.name);
        } catch (e) {
            return false;
        }
    });
    
    console.log(`Found ${hkProxies.length} potential HK proxies.`);

    // 3. 测速剔除（带容错）
    const results = await Promise.all(hkProxies.map(async (p) => {
        try {
            // 使用 Sub-Store 官方推荐的测速 API
            // 如果连不上会返回 0，超时也会返回 0
            const delay = await $.testProxy(p, {
                url: 'http://www.gstatic.com/generate_204',
                timeout: 2000
            });
            return delay > 0;
        } catch (err) {
            // 如果测速逻辑报错（例如节点协议不支持），打印但不中断
            console.log(`Skipping failed test for: ${p.name}`);
            return false;
        }
    }));
    
    // 4. 筛选活节点
    const aliveProxies = hkProxies.filter((_, index) => results[index]);

    // 5. 物理去重（极致优化内存）
    // 免费订阅重复率极高，通过 Server+Port 唯一标识
    const uniqueMap = new Map();
    aliveProxies.forEach(p => {
        const key = `${p.server}:${p.port}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, p);
        }
    });

    console.log(`Final output: ${uniqueMap.size} unique HK proxies.`);
    return Array.from(uniqueMap.values());
}
