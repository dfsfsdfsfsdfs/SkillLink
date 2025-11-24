// components/QRPagoRealista.jsx
import React from 'react';

const QRPago = ({ datosPago, size = 280 }) => {
  if (!datosPago) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mx-auto">
      {/* Header del QR */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="text-lg font-bold text-gray-800">OLAR Tutorías</span>
        </div>
        <p className="text-gray-600 text-sm">Escanea para pagar</p>
      </div>

      {/* Código QR con marco */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border-2 border-dashed border-blue-200">
        <div className="bg-white p-3 rounded-lg shadow-inner">
          <div className="grid grid-cols-10 gap-1 mx-auto" style={{ width: size - 40 }}>
            {Array.from({ length: 100 }).map((_, index) => {
              const row = Math.floor(index / 10);
              const col = index % 10;
              
              // Patrón de QR más realista con patrones de posición
              const isPositionPattern = 
                (row < 8 && col < 8) || 
                (row < 8 && col > 1) ||
                (row > 1 && col < 8);
              
              const shouldShow = isPositionPattern ? Math.random() > 0.3 : Math.random() > 0.5;
              
              return (
                <div
                  key={index}
                  className={`aspect-square rounded-sm ${
                    shouldShow ? 'bg-gray-900' : 'bg-transparent'
                  } ${
                    (row < 2 && col < 2) || 
                    (row < 2 && col > 7) ||
                    (row > 7 && col < 2) 
                      ? 'bg-gray-900' : ''
                  }`}
                />
              );
            })}
          </div>
        </div>
        
        {/* Logo superpuesto */}
        <div className="relative -mt-8 -mb-4 flex justify-center">
          <div className="bg-white rounded-full p-2 shadow-lg border">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">OLAR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Información del pago */}
      <div className="space-y-3 text-center">
        <div>
          <div className="text-3xl font-bold text-gray-900">
            Bs. {datosPago.monto?.toFixed(2) || '50.00'}
          </div>
          <div className="text-sm text-gray-600 mt-1">{datosPago.concepto}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">CÓDIGO DE TRANSACCIÓN</div>
          <div className="text-sm font-mono text-gray-800 font-semibold">
            {datosPago.codigo || `TUT${Date.now().toString().slice(-6)}`}
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>Beneficiario:</span>
          <span className="font-semibold">{datosPago.beneficiario || 'OLAR Tutorías'}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>Válido hasta:</span>
          <span className="font-semibold">
            {datosPago.fecha_expiracion 
              ? new Date(datosPago.fecha_expiracion).toLocaleDateString()
              : new Date(Date.now() + 86400000).toLocaleDateString()
            }
          </span>
        </div>

        {/* Indicadores de banco */}
        <div className="flex justify-center space-x-4 pt-2">
          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            ✓ Seguro
          </div>
          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            ⚡ Rápido
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-800 text-center">
          <strong>Instrucciones:</strong> Abre tu app bancaria, escanea el código y confirma el pago
        </div>
      </div>
    </div>
  );
};

export default QRPago;