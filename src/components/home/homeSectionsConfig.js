export const HomeSectionType = Object.freeze({
  Hero: 'hero',
  Stats: 'stats',
  Journey: 'journey',
  PrimaryAction: 'primaryAction',
  SecondaryAction: 'secondaryAction',
  Highlights: 'highlights',
  RecentActivity: 'recentActivity',
  QuickTip: 'quickTip'
});

export const homeSectionsConfig = [
  { type: HomeSectionType.Hero, enabled: true },
  { type: HomeSectionType.Stats, enabled: true },
  { type: HomeSectionType.PrimaryAction, enabled: true },
  { type: HomeSectionType.SecondaryAction, enabled: true },
  { type: HomeSectionType.Journey, enabled: true },
  { type: HomeSectionType.Highlights, enabled: true },
  { type: HomeSectionType.RecentActivity, enabled: true },
  { type: HomeSectionType.QuickTip, enabled: true }
];
