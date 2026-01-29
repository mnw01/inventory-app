import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, RefreshCw, AlertCircle, Settings, Check } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
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

    const handleScan = (decodedText: string) => {
      if (mountedRef.current) {
        onScanSuccessRef.current(decodedText);
        // Stop automatically
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(console.error);
        }
      }
    };

    const initScanner = async () => {
      try {
        // Create instance if not exists
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("reader");
        }
        const html5QrCode = scannerRef.current;

        const config = {
          fps: 10,
          // 放大扫码区域
          qrbox: { width: 320, height: 320 },
          aspectRatio: 1.0,
        };

        try {
          if (selectedCameraId) {
            // Use specific camera
            await html5QrCode.start(
              selectedCameraId,
              config,
              (decodedText) => handleScan(decodedText),
              () => { }
            );
          } else {
            // Try environment facing camera first
            await html5QrCode.start(
              { facingMode: "environment" },
              config,
              (decodedText) => handleScan(decodedText),
              () => { }
            );
          }
        } catch (e) {
          console.warn("Failed to start preferred camera, trying user camera", e);
          // Fallback to user facing
          await html5QrCode.start(
            { facingMode: "user" },
            config,
            (decodedText) => handleScan(decodedText),
            () => { }
          );
        }

        if (mountedRef.current) {
          setIsLoading(false);
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

    // Get cameras only once
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id.substring(0, 5)}` })));
      }
    }).catch(err => console.warn("Error getting cameras", err));

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
  }, [selectedCameraId]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-lg md:max-w-2xl overflow-hidden relative flex flex-col max-h-[94vh]">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">扫码识别</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 bg-black relative min-h-[360px] sm:min-h-[420px] flex items-center justify-center overflow-hidden group">
          {isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black bg-opacity-50">
              <RefreshCw className="animate-spin mb-2" size={32} />
              <p>正在启动摄像头...</p>
            </div>
          )}

          {/* Settings Overlay */}
          {showSettings && (
            <div className="absolute inset-0 z-20 bg-black bg-opacity-80 p-4 flex flex-col animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Settings size={18} /> 摄像头设置
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">选择摄像头 (解决对焦问题)</label>
                  <div className="space-y-2">
                    {cameras.length > 0 ? (
                      cameras.map(cam => (
                        <button
                          key={cam.id}
                          onClick={() => {
                            setSelectedCameraId(cam.id);
                            setShowSettings(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded flex items-center justify-between ${selectedCameraId === cam.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                          <span className="truncate text-sm">{cam.label}</span>
                          {selectedCameraId === cam.id && <Check size={16} />}
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">未检测到多个摄像头</p>
                    )}

                    <button
                      onClick={() => {
                        setSelectedCameraId('');
                        setShowSettings(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded flex items-center justify-between ${selectedCameraId === ''
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                      <span className="text-sm">自动选择 (默认)</span>
                      {selectedCameraId === '' && <Check size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error ? (
            <div className="text-white text-center p-6 sm:p-8 flex flex-col items-center">
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
            <>
              <div id="reader" className="w-full h-full object-cover"></div>

              {/* Overlay Guide */}
              {!isLoading && !showSettings && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Scanner Box */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-transparent">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

                    {/* Scanning Line */}
                    <div className="absolute left-0 w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-scan"></div>

                    <p className="absolute -bottom-8 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-md">
                      将条码放入框内
                    </p>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all backdrop-blur-sm"
                  title="设置摄像头"
                >
                  <Settings size={20} />
                </button>
              </div>
            </>
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
