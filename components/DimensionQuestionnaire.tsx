import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Chip } from './Chip';
import { LevelSlider } from './LevelSlider';
import { getPreferenceImage } from '../utils/preferenceImages';

interface DimensionQuestionnaireProps {
  dimension: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  };
  preferences: Array<{
    id: number;
    name: string;
    description: string;
  }>;
  onBack: () => void;
  onSave: (preferences: Array<{ preferenceId: number; level: number; notes?: string }>) => void;
  initialData?: {
    selectedPreferences: Set<number>;
    levels: Record<number, number>;
    notes: Record<number, string>;
  };
}

export const DimensionQuestionnaire: React.FC<DimensionQuestionnaireProps> = ({
  dimension,
  preferences,
  onBack,
  onSave,
  initialData,
}) => {
  const [selectedPreferences, setSelectedPreferences] = useState<Set<number>>(
    initialData?.selectedPreferences || new Set()
  );
  const [levels, setLevels] = useState<Record<number, number>>(
    initialData?.levels || {}
  );
  const [notes, setNotes] = useState<Record<number, string>>(
    initialData?.notes || {}
  );
  const [showNotes, setShowNotes] = useState<Record<number, boolean>>(
    // Mostrar notas si ya tienen contenido
    Object.keys(initialData?.notes || {}).reduce((acc, key) => {
      acc[Number(key)] = true;
      return acc;
    }, {} as Record<number, boolean>)
  );

  // Identificar la preferencia "Ninguna"
  const nonePreference = preferences.find(p => 
    p.name.toLowerCase().includes('ninguna')
  );

  const togglePreference = (preferenceId: number) => {
    const isNone = preferenceId === nonePreference?.id;
    const newSelected = new Set(selectedPreferences);
    
    if (newSelected.has(preferenceId)) {
      // Deseleccionar
      newSelected.delete(preferenceId);
      const newLevels = { ...levels };
      const newNotes = { ...notes };
      delete newLevels[preferenceId];
      delete newNotes[preferenceId];
      setLevels(newLevels);
      setNotes(newNotes);
    } else {
      // Seleccionar
      if (isNone) {
        // Si selecciona "Ninguna", deseleccionar todas las demás
        newSelected.clear();
        setLevels({});
        setNotes({});
      } else {
        // Si selecciona otra, quitar "Ninguna" si estaba seleccionada
        if (nonePreference && newSelected.has(nonePreference.id)) {
          newSelected.delete(nonePreference.id);
          const newLevels = { ...levels };
          const newNotes = { ...notes };
          delete newLevels[nonePreference.id];
          delete newNotes[nonePreference.id];
          setLevels(newLevels);
          setNotes(newNotes);
        }
      }
      newSelected.add(preferenceId);
      // Establecer nivel por defecto (50 para "Ninguna", 50 para las demás)
      setLevels({ ...levels, [preferenceId]: 50 });
    }
    setSelectedPreferences(newSelected);
  };

  const updateLevel = (preferenceId: number, level: number) => {
    setLevels({ ...levels, [preferenceId]: level });
  };

  const updateNotes = (preferenceId: number, text: string) => {
    setNotes({ ...notes, [preferenceId]: text });
  };

  const toggleNotesInput = (preferenceId: number) => {
    setShowNotes({ ...showNotes, [preferenceId]: !showNotes[preferenceId] });
  };

  const handleSave = () => {
    const userPreferences = Array.from(selectedPreferences).map((prefId) => ({
      preferenceId: prefId,
      level: levels[prefId] || 50,
      notes: notes[prefId] || undefined,
    }));
    onSave(userPreferences);
  };

  const canSave = selectedPreferences.size > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF4F81', '#8A2BE2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.dimensionEmoji}>{dimension.emoji}</Text>
          <View>
            <Text style={styles.dimensionTitle}>{dimension.name}</Text>
            <Text style={styles.selectedCount}>
              {selectedPreferences.size} de {preferences.length} seleccionadas
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.instructions}>
          Selecciona las actividades que te interesan o disfrutas. Puedes seleccionar varias.
        </Text>

        {/* Lista de preferencias */}
        <View style={styles.preferencesContainer}>
          {preferences.map((pref) => {
            const isSelected = selectedPreferences.has(pref.id);
            const level = levels[pref.id] || 50;
            const isNone = pref.name.toLowerCase().includes('ninguna');

            return (
              <TouchableOpacity
                key={pref.id}
                style={[
                  styles.preferenceCard,
                  isSelected && styles.preferenceCardSelected,
                  isNone && styles.noneCard,
                ]}
                onPress={() => togglePreference(pref.id)}
                activeOpacity={0.7}
              >
                {/* Imagen de la preferencia o ícono para "Ninguna" */}
                <View style={styles.imageContainer}>
                  {isNone ? (
                    <View style={[styles.noneIconContainer, isSelected && styles.noneIconSelected]}>
                      <Ionicons 
                        name="close-circle" 
                        size={60} 
                        color={isSelected ? "#FF4F81" : "#999"} 
                      />
                    </View>
                  ) : (
                    <Image
                      source={getPreferenceImage(pref.name)}
                      style={styles.preferenceImage}
                      resizeMode="contain"
                    />
                  )}
                  {isSelected && !isNone && (
                    <View style={styles.selectedOverlay}>
                      <Ionicons name="checkmark-circle" size={40} color="#FF4F81" />
                    </View>
                  )}
                </View>

                {/* Nombre de la preferencia */}
                <View style={styles.preferenceTitleContainer}>
                  <Text style={[styles.preferenceName, isNone && styles.noneText]} numberOfLines={2}>
                    {pref.name}
                  </Text>
                  {isSelected && !isNone && (
                    <TouchableOpacity
                      style={styles.notesIconButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleNotesInput(pref.id);
                      }}
                    >
                      <Ionicons
                        name={showNotes[pref.id] ? 'create' : 'create-outline'}
                        size={18}
                        color="#FF4F81"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Descripción */}
                {pref.description && isSelected && (
                  <Text style={styles.preferenceDescription}>{pref.description}</Text>
                )}

                {/* Slider de nivel (solo si está seleccionado y NO es "Ninguna") */}
                {isSelected && !isNone && (
                  <View style={styles.levelSection}>
                    <LevelSlider
                      label="¿Qué tanto te interesa?"
                      value={level}
                      onValueChange={(value) => updateLevel(pref.id, value)}
                      color="#FF4F81"
                      minLabel="Poco"
                      maxLabel="Mucho"
                    />
                  </View>
                )}

                {/* Input de notas (solo si está activado y NO es "Ninguna") */}
                {isSelected && !isNone && showNotes[pref.id] && (
                  <View style={styles.notesSection}>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Agrega detalles o preferencias específicas..."
                      value={notes[pref.id] || ''}
                      onChangeText={(text) => updateNotes(pref.id, text)}
                      multiline
                      numberOfLines={3}
                      maxLength={500}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButtonWrapper, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={canSave ? ['#FF4F81', '#8A2BE2'] : ['#FFB3CE', '#C5A3E8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.saveButtonText}>Guardar Preferencias</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={onBack}>
            <Text style={styles.skipButtonText}>Omitir por ahora</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dimensionEmoji: {
    fontSize: 40,
  },
  dimensionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  instructions: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    padding: 20,
    paddingBottom: 12,
    fontWeight: '500',
  },
  preferencesContainer: {
    padding: 16,
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  preferenceCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  preferenceCardSelected: {
    shadowOpacity: 0.2,
    elevation: 5,
    transform: [{ scale: 0.98 }],
    borderColor: '#FF4F81',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  preferenceImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF4F8120',
  },
  preferenceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingBottom: 8,
  },
  preferenceName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
  },
  notesIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#888',
    paddingHorizontal: 12,
    paddingBottom: 8,
    lineHeight: 16,
  },
  levelSection: {
    marginTop: 12,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#FF4F81',
  },
  notesSection: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  notesInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#FF4F81',
  },
  noneCard: {
    borderColor: '#ddd',
  },
  noneIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  noneIconSelected: {
    backgroundColor: '#FFE8EF',
  },
  noneText: {
    color: '#666',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButtonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 1,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '500',
  },
});
