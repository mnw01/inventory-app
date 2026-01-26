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

  // Use ref to keep track of the callback to avoid re-initializing scanner when callback changes
  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    // Check for secure context
    if (window.location.protocol !== 'https:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      setError("摄像头访问需要 HTTPS 环境。请确保通过 HTTPS 或 localhost 访问。");
      return;
    }

    let isMounted = true;
    
    // Initialize scanner
    // Use a small timeout to ensure the DOM element is ready
    const timer = setTimeout(() => {
      if (!isMounted) return;

      try {
        // Prevent duplicate initialization
        if (scannerRef.current) {
          return;
        }

        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            rememberLastUsedCamera: true
          },
          /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
             if (isMounted) {
               // Success callback
               onScanSuccessRef.current(decodedText);
               // Stop scanning after success
               if (scannerRef.current) {
                 scannerRef.current.clear().catch(console.error);
                 scannerRef.current = null;
               }
             }
          },
          (_) => {
            // Error callback (scanning in progress, no code found yet)
          }
        );
      } catch (err) {
        console.error("Failed to initialize scanner", err);
        if (isMounted) {
          setError("无法启动摄像头，请确保已授予权限。");
        }
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

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
