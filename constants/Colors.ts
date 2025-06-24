const newTheme = {
  primary: '#F97316',
  primaryHover: '#EA580C',
  secondary: '#1E293B',
  background: '#F8FAFC',
  card: '#FFFFFF',
  accent: '#10B981',
  error: '#EF4444',
  textDark: '#0F172A',
  textLight: '#64748B',
  filterHighlight: '#FACC15',
};

export default {
  light: {
    text: newTheme.textDark,
    background: newTheme.background,
    tint: newTheme.primary,
    tabIconDefault: newTheme.textLight,
    tabIconSelected: newTheme.primary,
    card: newTheme.card,
    error: newTheme.error,
    secondaryText: newTheme.textLight,
  },
  dark: {
    // For now, dark theme will be the same as light.
    // We can define a separate dark palette later.
    text: newTheme.textDark,
    background: newTheme.background,
    tint: newTheme.primary,
    tabIconDefault: newTheme.textLight,
    tabIconSelected: newTheme.primary,
    card: newTheme.card,
    error: newTheme.error,
    secondaryText: newTheme.textLight,
  },
};
