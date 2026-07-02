export const HomeSectionType = Object.freeze({
  Hero: 'hero',
  Stats: 'stats',
  PrimaryAction: 'primaryAction',
  SecondaryAction: 'secondaryAction',
  Highlights: 'highlights',
  RecentActivity: 'recentActivity'
});

export const homeSectionsConfig = [
  { type: HomeSectionType.Hero, enabled: true },
  { type: HomeSectionType.Stats, enabled: true },
  { type: HomeSectionType.PrimaryAction, enabled: true },
  { type: HomeSectionType.SecondaryAction, enabled: true },
  { type: HomeSectionType.Highlights, enabled: true },
  { type: HomeSectionType.RecentActivity, enabled: true }
];
