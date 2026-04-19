async function operator(proxies) {
    // 只留香港
    let hkProxies = proxies.filter(p => /(香港|HK)/i.test(p.name));
    
    // 增加：分批测速（并发限制），每组跑 50 个节点，避免被 GitHub 网关限速
    const batchSize = 50;
    let finalProxies = [];
    
    for (let i = 0; i < hkProxies.size; i += batchSize) {
        const batch = hkProxies.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(p => 
            Utils.testProxy(p, { url: 'http://www.gstatic.com/generate_204', timeout: 2000 })
        ));
        finalProxies.push(...batch.filter((_, index) => results[index] > 0));
    }
    
    // 去重
    const uniqueMap = new Map();
    finalProxies.forEach(p => uniqueMap.set(p.server, p));
    return Array.from(uniqueMap.values());
}
