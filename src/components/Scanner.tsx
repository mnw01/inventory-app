import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, RefreshCw, AlertCircle } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const onScanSuccessRef = useRef(onScanSuccess);
  const mountedRef = useRef(true);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Check environment
    if (window.location.protocol !== 'https:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      setError("摄像头访问需要 HTTPS 环境。请确保通过 HTTPS 或 localhost 访问。");
      setIsLoading(false);
      return;
    }

    const initScanner = async () => {
      try {
        // Create instance
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        // Check permissions and get cameras
        // Note: This explicitly asks for permission if not granted
        const devices = await Html5Qrcode.getCameras();
        
        if (!mountedRef.current) return;

        if (devices && devices.length) {
          // Try to find back camera
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          const cameraId = backCamera ? backCamera.id : devices[0].id;
          
          await html5QrCode.start(
            cameraId, 
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              if (mountedRef.current) {
                onScanSuccessRef.current(decodedText);
                // Stop automatically
                if (scannerRef.current && scannerRef.current.isScanning) {
                   scannerRef.current.stop().then(() => {
                      scannerRef.current?.clear();
                   }).catch(console.error);
                }
              }
            },
            () => {
              // Ignore scan failures (scanning in progress)
            }
          );
          
          if (mountedRef.current) {
            setIsLoading(false);
          }
        } else {
          throw new Error("未检测到摄像头设备");
        }
      } catch (err: any) {
        console.error("Scanner initialization failed", err);
        if (mountedRef.current) {
          let errorMessage = "无法启动摄像头。";
          if (err.name === 'NotAllowedError') {
            errorMessage = "请允许访问摄像头权限。";
          } else if (err.name === 'NotFoundError') {
            errorMessage = "未找到摄像头设备。";
          } else if (err.name === 'NotSupportedError') {
            errorMessage = "当前环境不支持摄像头访问（需HTTPS）。";
          } else if (typeof err === 'string') {
             errorMessage = err;
          }
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initScanner();
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(console.error);
        } else {
          scannerRef.current.clear();
        }
      }
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">扫码识别</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 bg-black relative min-h-[300px] flex items-center justify-center">
           {isLoading && !error && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black bg-opacity-50">
               <RefreshCw className="animate-spin mb-2" size={32} />
               <p>正在启动摄像头...</p>
             </div>
           )}
           
           {error ? (
             <div className="text-white text-center p-8 flex flex-col items-center">
               <AlertCircle size={48} className="text-red-500 mb-4" />
               <p className="mb-4 text-lg">{error}</p>
               <button 
                 onClick={handleRetry}
                 className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700 transition-colors"
               >
                 刷新页面重试
               </button>
             </div>
           ) : (
             <div id="reader" className="w-full h-full"></div>
           )}
        </div>
        
        <div className="p-4 text-center bg-gray-50 border-t">
          <p className="text-sm text-gray-600">
            请将条形码或二维码对准取景框
          </p>
        </div>
      </div>
    </div>
  );
};
