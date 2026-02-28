import { Text, type TextStyle, type TextProps } from 'react-native';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

type TextVariant = 'display' | 'h1' | 'h2' | 'body' | 'caption' | 'overline';
type TextColor = 'primary' | 'secondary' | 'muted' | 'mint' | 'lavender' | 'yellow' | 'cherry';

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  color?: TextColor;
  style?: TextStyle;
}

const colorMap: Record<TextColor, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  muted: colors.text.muted,
  mint: colors.accent.mint,
  lavender: colors.accent.lavender,
  yellow: colors.accent.yellow,
  cherry: colors.accent.cherry,
};

export function ThemedText({
  variant = 'body',
  color = 'primary',
  style,
  ...props
}: ThemedTextProps): React.JSX.Element {
  return (
    <Text
      style={[typography[variant], { color: colorMap[color] }, style]}
      {...props}
    />
  );
}
