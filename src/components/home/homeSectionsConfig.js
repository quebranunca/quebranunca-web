export const HomeSectionType = Object.freeze({
  MainDashboard: 'mainDashboard',
  Identity: 'identity',
  PendingConfirmation: 'pendingConfirmation',
  Gamification: 'gamification',
  PrimaryAction: 'primaryAction',
  SecondaryAction: 'secondaryAction',
  Performance: 'performance',
  RecentMatches: 'recentMatches'
});

export const homeSectionsConfig = [
  { type: HomeSectionType.Gamification, enabled: true },
  { type: HomeSectionType.Performance, enabled: true },
  { type: HomeSectionType.PendingConfirmation, enabled: true },
  { type: HomeSectionType.PrimaryAction, enabled: true },
  { type: HomeSectionType.RecentMatches, enabled: true }
];
