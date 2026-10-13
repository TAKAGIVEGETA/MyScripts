try {
    const obj = JSON.parse($response.body);
    const now = Math.floor(Date.now() / 1000);
    const args = (typeof $argument !== 'undefined' && $argument) ? $argument : {};

    const applyGold = (userdata) => {
        if (!userdata.shopItems) userdata.shopItems = [];
        const hasGold = userdata.shopItems.some(item => item.id === 'gold_subscription');
        if (!hasGold) {
            userdata.shopItems.push({
                id: 'gold_subscription',
                purchaseDate: now - 172800,
                purchasePrice: 0,
                subscriptionInfo: {
                    expectedExpiration: now + 31536000,
                    productId: "com.duolingo.DuolingoMobile.subscription.Gold.TwelveMonth.24Q2Max.168",
                    renewer: 'APPLE',
                    renewing: true,
                    tier: 'twelve_month',
                    type: 'gold'
                }
            });
        }
        userdata.subscriberLevel = 'GOLD';
        if (!userdata.trackingProperties) userdata.trackingProperties = {};
        [
            "has_item_immersive_subscription",
            "has_item_premium_subscription",
            "has_item_live_subscription",
            "has_item_gold_subscription",
            "has_item_max_subscription"
        ].forEach(p => userdata.trackingProperties[p] = true);
    };

    const applyXpBoost = (userdata) => {
        if (!args.xp_boost) return;
        const xpMultiplier = parseInt(args.multiplier);
        if (!userdata.shopItems) userdata.shopItems = [];
        let foundXpBoost = false;
        for (let i = 0; i < userdata.shopItems.length; i++) {
            if (userdata.shopItems[i].id === 'xp_boost_stackable') {
                userdata.shopItems[i].purchaseDate = now;
                userdata.shopItems[i].expectedExpirationDate = now + 3600;
                userdata.shopItems[i].xpBoostMultiplier = xpMultiplier;
                foundXpBoost = true;
                break;
            }
        }
        if (!foundXpBoost) {
            userdata.shopItems.push({
                id: 'xp_boost_stackable',
                purchaseDate: now,
                expectedExpirationDate: now + 3600,
                purchasePrice: 0,
                xpBoostMultiplier: xpMultiplier
            });
        }
    };

    const applyUnlockAll = (userdata) => {
        if (!args.unlock_all) return;
        if (userdata.currentCourse && Array.isArray(userdata.currentCourse.pathSectioned)) {
            userdata.currentCourse.pathSectioned.forEach(section => {
                if (Array.isArray(section.units)) {
                    section.units.forEach(unit => {
                        if (Array.isArray(unit.levels)) {
                            unit.levels.forEach(level => {
                                if (level.state === 'locked') level.state = 'active';
                            });
                        }
                    });
                }
            });
        }
    };

    const applyAll = (userdata) => {
        applyGold(userdata);
        applyXpBoost(userdata);
        applyUnlockAll(userdata);
    };

    if (obj.responses && obj.responses.length >= 2) {
        if (obj.responses[0].headers && 'etag' in obj.responses[0].headers) {
            $done({});
        } else {
            const b0 = obj.responses[0].body;
            if (typeof b0 === 'string') {
                const userdata = JSON.parse(b0);
                applyAll(userdata);
                obj.responses[0].body = JSON.stringify(userdata);
            } else {
                applyAll(b0);
                obj.responses[0].body = b0;
            }
            $done({ body: JSON.stringify(obj) });
        }
    } else if (obj && typeof obj === 'object' &&
               (obj.shopItems !== undefined || obj.subscriberLevel !== undefined ||
                (obj.id && obj.trackingProperties))) {
        applyAll(obj);
        $done({ body: JSON.stringify(obj) });
    } else {
        $done({});
    }
} catch (e) {
    $done({});
}
