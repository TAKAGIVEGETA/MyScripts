// URL(s) 填 ^https?:\/\/(ios-api-[a-z0-9-]+|api\d+)\.duolingo\.c(n|om)\/2023-05-23\/(batch|users\/[^\/?#]+)(?:[?#]|$)

async function onRequest(context, request) {
    return request;
}

async function onResponse(context, request, response) {
    try {
        const obj = JSON.parse(response.body);
        const timestamp = Math.floor(Date.now() / 1000);

        const applyGold = (userdata) => {
            if (!userdata.shopItems) userdata.shopItems = [];
            userdata.shopItems.push({
                id: 'gold_subscription',
                purchaseDate: timestamp - 172800,
                purchasePrice: 0,
                subscriptionInfo: {
                    expectedExpiration: timestamp + 31536000,
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
            if ('etag' in (obj.responses[0].headers || {})) return response;
            const b0 = obj.responses[0].body;
            if (typeof b0 === 'string') {
                const userdata = JSON.parse(b0);
                applyGold(userdata);
                obj.responses[0].body = JSON.stringify(userdata);
            } else {
                applyGold(b0);
                obj.responses[0].body = b0;
            }
        } else if (obj.shopItems !== undefined || obj.subscriberLevel !== undefined || obj.id) {
            applyGold(obj);
        } else {
            return response;
        }

        const finalBody = JSON.stringify(obj);
        response.body = finalBody;
    } catch (e) {}
    return response;
}
