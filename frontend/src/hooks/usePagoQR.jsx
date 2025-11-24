// hooks/usePagoQR.js - Versión Corregida
import { useState } from 'react';

export const usePagoQR = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getToken = () => {
    return localStorage.getItem('authToken');
  };

  // Crear pago QR
  const crearPagoQR = async (id_inscripcion, monto, concepto) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      
      const response = await fetch('http://localhost:3000/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          monto: monto,
          id_inscripcion: id_inscripcion,
          concepto: concepto
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
      
    } catch (err) {
      console.error('Error en crearPagoQR:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Simular pago
  const simularPago = async (pagoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      
      const response = await fetch(`http://localhost:3000/pagos/${pagoId}/simular-pago`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response simularPago:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
      
    } catch (err) {
      console.error('Error en simularPago:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    crearPagoQR,
    simularPago
  };
};