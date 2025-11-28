import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface LevelSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  color?: string;
  minLabel?: string;
  maxLabel?: string;
}

export const LevelSlider: React.FC<LevelSliderProps> = ({
  label,
  value,
  onValueChange,
  color = '#667eea',
  minLabel = 'Poco',
  maxLabel = 'Mucho',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={10}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor={color}
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor={color}
        />
      </View>

      <View style={styles.labelsContainer}>
        <Text style={styles.minLabel}>{minLabel}</Text>
        <Text style={[styles.valueLabel, { color }]}>{value}%</Text>
        <Text style={styles.maxLabel}>{maxLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  minLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  maxLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  valueLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
