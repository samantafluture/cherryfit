import { useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Camera, ScanBarcode, PenLine, RotateCcw, X, UtensilsCrossed } from 'lucide-react-native';
import { ThemedText } from '../ui/ThemedText';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

interface FabOption {
  label: string;
  icon: React.ReactNode;
  route: string | null;
  enabled: boolean;
}

export function FoodFAB(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const options: FabOption[] = [
    {
      label: 'Take Photo',
      icon: <UtensilsCrossed size={22} color={colors.text.primary} strokeWidth={1.5} />,
      route: '/food/photo-ai',
      enabled: true,
    },
    {
      label: 'Scan Label',
      icon: <Camera size={22} color={colors.text.primary} strokeWidth={1.5} />,
      route: '/food/scan-label',
      enabled: true,
    },
    {
      label: 'Scan Barcode',
      icon: <ScanBarcode size={22} color={colors.text.primary} strokeWidth={1.5} />,
      route: '/food/scan-barcode',
      enabled: true,
    },
    {
      label: 'Quick Log',
      icon: <RotateCcw size={22} color={colors.text.primary} strokeWidth={1.5} />,
      route: '/food/quick-log',
      enabled: true,
    },
    {
      label: 'Manual Entry',
      icon: <PenLine size={22} color={colors.text.primary} strokeWidth={1.5} />,
      route: '/food/manual-entry',
      enabled: true,
    },
  ];

  function handleOptionPress(option: FabOption): void {
    setIsOpen(false);
    if (option.route && option.enabled) {
      router.push(option.route as '/food/scan-label');
    }
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setIsOpen(true)}
      >
        <Plus size={28} color={colors.bg.primary} strokeWidth={2} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <ThemedText variant="h2">Log Food</ThemedText>
              <Pressable onPress={() => setIsOpen(false)} hitSlop={12}>
                <X size={24} color={colors.text.secondary} strokeWidth={1.5} />
              </Pressable>
            </View>

            {options.map((option) => (
              <Pressable
                key={option.label}
                style={({ pressed }) => [
                  styles.option,
                  !option.enabled && styles.optionDisabled,
                  pressed && option.enabled && styles.optionPressed,
                ]}
                onPress={() => handleOptionPress(option)}
                disabled={!option.enabled}
              >
                <View style={styles.optionIcon}>{option.icon}</View>
                <ThemedText
                  variant="body"
                  color={option.enabled ? 'primary' : 'muted'}
                >
                  {option.label}
                </ThemedText>
                {!option.enabled && (
                  <ThemedText variant="caption" color="muted" style={styles.comingSoon}>
                    Coming soon
                  </ThemedText>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.mint,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.accent.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg.cardElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
    gap: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionPressed: {
    backgroundColor: colors.bg.card,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoon: {
    marginLeft: 'auto',
  },
});
