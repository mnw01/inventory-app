import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Initialize scanner
    // Use a small timeout to ensure the DOM element is ready
    const timer = setTimeout(() => {
      try {
        scannerRef.current = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          },
          /* verbose= */ false
        );

        scannerRef.current.render(
          (decodedText) => {
             // Success callback
             onScanSuccess(decodedText);
             // Stop scanning after success
             if (scannerRef.current) {
               scannerRef.current.clear().catch(console.error);
             }
          },
          (errorMessage) => {
            // Error callback (scanning in progress, no code found yet)
            // console.log(errorMessage); 
          }
        );
      } catch (err) {
        console.error("Failed to initialize scanner", err);
        setError("无法启动摄像头，请确保已授予权限。");
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">扫码识别</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 bg-black">
           {error ? (
             <div className="text-white text-center py-8">{error}</div>
           ) : (
             <div id="reader" className="w-full"></div>
           )}
        </div>
        
        <div className="p-4 text-center text-sm text-gray-500">
          请将条形码或二维码对准框内
        </div>
      </div>
    </div>
  );
};
