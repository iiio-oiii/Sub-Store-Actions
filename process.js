// 这是一个 Sub-Store 脚本，用于云端处理节点
async function operator(proxies) {
    // 1. 关键词过滤：只保留香港
    let hkProxies = proxies.filter(p => /(香港|HK)/i.test(p.name));
    
    // 2. 测速剔除：只有连得上的才进入内存
    // 注意：GitHub 节点在海外，所以这里测的是海外到节点的连通性
    const results = await Promise.all(hkProxies.map(p => 
        Utils.testProxy(p, {
            url: 'http://www.gstatic.com/generate_204',
            timeout: 1500
        })
    ));
    
    // 3. 过滤并去重（根据服务器地址去重，避免重复加载）
    const finalProxies = hkProxies.filter((_, index) => results[index] > 0);
    const uniqueMap = new Map();
    finalProxies.forEach(p => uniqueMap.set(p.server, p));
    
    return Array.from(uniqueMap.values());
}
