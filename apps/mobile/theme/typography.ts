export const typography = {
  display: { fontFamily: 'Inter_700Bold', fontSize: 40 },
  h1: { fontFamily: 'Inter_600SemiBold', fontSize: 24 },
  h2: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  caption: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  overline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase' as const,
  },
} as const;
