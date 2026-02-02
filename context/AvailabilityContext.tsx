import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateAvailableSlots, AvailabilityResponse } from '../services/availabilityService';
import { useAuth } from './AuthContext';

// Ensure UserData type includes 'id'
interface UserData {
  id: number;
  // ...other properties
}

interface AvailabilityContextType {
  availability: AvailabilityResponse | null;
  loading: boolean;
  error: string | null;
  refreshAvailability: () => Promise<void>;
  calculateUserAvailability: (userId: number, days?: number) => Promise<void>;
}

const AvailabilityContext = createContext<AvailabilityContextType | undefined>(undefined);

export const AvailabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth() as { user: UserData | null };
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcula la disponibilidad de un usuario
   */
  const calculateUserAvailability = async (userId: number, days: number = 7) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📅 Calculando espacios disponibles para usuario ${userId}...`);
      const result = await calculateAvailableSlots(userId, days);
      setAvailability(result);
      console.log(`✅ Espacios disponibles calculados: ${result.totalDaysWithAvailability} días con disponibilidad`);
    } catch (err: any) {
      console.error('❌ Error calculando disponibilidad:', err);
      setError(err.message || 'Error al calcular disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recalcula la disponibilidad del usuario actual
   */
  const refreshAvailability = async () => {
    if (user?.id) {
      await calculateUserAvailability(user.id);
    }
  };

  /**
   * Calcula automáticamente cuando el usuario inicia sesión
   */
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Usuario autenticado detectado, calculando disponibilidad...');
      calculateUserAvailability(user.id);
    } else {
      // Limpiar cuando no hay usuario
      setAvailability(null);
      setError(null);
    }
  }, [user?.id]);

  return (
    <AvailabilityContext.Provider
      value={{
        availability,
        loading,
        error,
        refreshAvailability,
        calculateUserAvailability,
      }}
    >
      {children}
    </AvailabilityContext.Provider>
  );
};

export const useAvailability = () => {
  const context = useContext(AvailabilityContext);
  if (!context) {
    throw new Error('useAvailability must be used within an AvailabilityProvider');
  }
  return context;
};
