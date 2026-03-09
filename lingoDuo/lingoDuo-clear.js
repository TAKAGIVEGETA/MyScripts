try {
  let obj = JSON.parse($response.body);
  const type = obj.type;
  const skipTypes = ["SIDE_QUEST_RAMP_UP_PRACTICE", "MATCH_PRACTICE"];
  if (type && !skipTypes.includes(type)) {
    const pools = [
        'challenges',
        'adaptiveChallenges',
        'adaptiveInterleavedChallenges',
        'mistakesReplacementChallenges'
    ];
    pools.forEach(pool => {
        if (obj[pool] && obj[pool].length > 0) obj[pool] = [];
    });
  }
  if (url.includes("stories") || (obj.metadata && obj.metadata.type === "duoradio"))
    if (obj.elements && obj.elements.length > 0) obj.elements = [];
  $done({ body: JSON.stringify(obj) });
} catch (e) {
  $done({});
}
