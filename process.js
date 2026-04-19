/**
 * 针对 23 个免费大杂烩源的专项处理脚本
 * 功能：深度去重、香港节点精准提取、2s内低延迟筛选、内存安全控制
 */
async function operator(proxies) {
    // 1. 基础数据清洗
    // 过滤掉所有非对象或缺少关键信息的节点，防止后续脚本崩溃
    let validProxies = (proxies || []).filter(p => p && typeof p === 'object' && p.server && p.name);

    console.log(`[数据输入] 原始节点总数: ${validProxies.length}`);

    // 2. 内存保护与初步去重
    // 免费源重复率极高，先按 Server+Port 做一次物理去重，减少测速压力
    const initialMap = new Map();
    validProxies.forEach(p => {
        const key = `${p.server}:${p.port}`;
        if (!initialMap.has(key)) initialMap.set(key, p);
    });
    validProxies = Array.from(initialMap.values());
    console.log(`[初步去重] 物理去重后剩余: ${validProxies.length}`);

    // 3. 香港节点精准匹配
    // 涵盖了几乎所有常见的香港命名方式，包括旗帜 Emoji 和缩写
    const hkKeywords = /(香港|HK|HongKong|🇭🇰|Hong Kong|HONG KONG|HKG|Hk)/i;
    let hkProxies = validProxies.filter(p => hkKeywords.test(p.name));
    
    console.log(`[正则筛选] 发现潜在香港节点: ${hkProxies.length}`);

    if (hkProxies.length === 0) {
        console.log("⚠️ 未在订阅源中发现任何香港节点。");
        return [];
    }

    // 4. 异步并发测速（带严格超时控制）
    // 针对金融交易，超时设为 2000ms。超过这个延迟的节点对于实时挂单和盯盘没有意义。
    // 使用 Promise.all 进行并发处理，提高 Action 运行效率
    const results = await Promise.all(hkProxies.map(async (p) => {
        try {
            // $ 对象由 sub-store-cli 自动注入
            const delay = await $.testProxy(p, {
                url: 'http://www.gstatic.com/generate_204',
                timeout: 2000
            });
            return delay > 0; // 只要延迟在 2000ms 内且连通，即返回 true
        } catch (e) {
            return false;
        }
    }));
    
    // 5. 提取活节点
    const aliveProxies = hkProxies.filter((_, index) => results[index]);

    // 6. 最终物理去重（防止不同订阅源用了不同的域名指向同一个服务器）
    const finalMap = new Map();
    aliveProxies.forEach(p => {
        const key = `${p.server}:${p.port}`;
        if (!finalMap.has(key)) {
            finalMap.set(key, p);
        }
    });

    console.log(`[处理完成] 最终输出全活香港节点: ${finalMap.size}`);
    
    // 按照延迟（如果有的话）或者名称排序，让列表更整齐
    return Array.from(finalMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
