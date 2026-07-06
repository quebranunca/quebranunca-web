export const HomeSectionType = Object.freeze({
  Identity: 'identity',
  PendingConfirmation: 'pendingConfirmation',
  PrimaryAction: 'primaryAction',
  SecondaryAction: 'secondaryAction',
  Performance: 'performance',
  RecentMatches: 'recentMatches'
});

export const homeSectionsConfig = [
  { type: HomeSectionType.Identity, enabled: true },
  { type: HomeSectionType.Performance, enabled: true },
  { type: HomeSectionType.PendingConfirmation, enabled: true },
  { type: HomeSectionType.PrimaryAction, enabled: true },
  { type: HomeSectionType.SecondaryAction, enabled: true },
  { type: HomeSectionType.RecentMatches, enabled: true }
];
