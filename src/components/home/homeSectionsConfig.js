export const HomeSectionType = Object.freeze({
  Hero: 'hero',
  Stats: 'stats',
  Insights: 'insights',
  RecentMatches: 'recentMatches',
  Feed: 'feed',
  Connections: 'connections',
  Frequency: 'frequency'
});

export const homeSectionsConfig = [
  { type: HomeSectionType.Hero, enabled: true },
  { type: HomeSectionType.Stats, enabled: true },
  { type: HomeSectionType.Insights, enabled: true },
  { type: HomeSectionType.RecentMatches, enabled: true },
  { type: HomeSectionType.Feed, enabled: true },
  { type: HomeSectionType.Connections, enabled: true },
  { type: HomeSectionType.Frequency, enabled: true }
];
