import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../constants/colors';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({ 
  label, 
  selected, 
  onPress, 
  color = palette.secondary,
  style 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && [styles.chipSelected, { backgroundColor: color }],
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected && (
        <Ionicons 
          name="checkmark-circle" 
          size={16} 
          color={palette.onPrimary} 
          style={styles.checkIcon} 
        />
      )}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: palette.surfaceMuted,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: palette.border,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipSelected: {
    borderColor: 'transparent',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  checkIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: palette.onPrimary,
    fontWeight: '700',
  },
});
