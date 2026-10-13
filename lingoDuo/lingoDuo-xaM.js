try {
    const obj = JSON.parse($response.body);
    const now = Math.floor(Date.now() / 1000);

    const applyGold = (userdata) => {
        if (!userdata.shopItems) userdata.shopItems = [];
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
        userdata.subscriberLevel = 'GOLD';
        if (!userdata.trackingProperties) userdata.trackingProperties = {};
        userdata.trackingProperties.has_item_immersive_subscription = true;
        userdata.trackingProperties.has_item_premium_subscription = true;
        userdata.trackingProperties.has_item_live_subscription = true;
        userdata.trackingProperties.has_item_gold_subscription = true;
        userdata.trackingProperties.has_item_max_subscription = true;
    };

    if (obj.responses && obj.responses.length >= 2) {
        if (obj.responses[0].headers && 'etag' in obj.responses[0].headers) $done({});
        else {
            const b0 = obj.responses[0].body;
            if (typeof b0 === 'string') {
                const userdata = JSON.parse(b0);
                applyGold(userdata);
                obj.responses[0].body = JSON.stringify(userdata);
            } else {
                applyGold(b0);
                obj.responses[0].body = b0;
            }
            $done({ body: JSON.stringify(obj) });
        }
    } else if (obj && typeof obj === 'object' && (obj.shopItems !== undefined || obj.subscriberLevel !== undefined || (obj.id && obj.trackingProperties))) {
        applyGold(obj);
        $done({ body: JSON.stringify(obj) });
    } else $done({});
} catch (e) {
    $done({});
}
