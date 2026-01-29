import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';
import { X, RefreshCw, AlertCircle, Settings, Camera } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const hasScannedRef = useRef(false);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  // 获取可用摄像头
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
      })
      .catch(err => console.warn('Error getting cameras:', err));
  }, []);

  const handleDetected = useCallback((result: any) => {
    if (hasScannedRef.current) return;

    const code = result?.codeResult?.code;
    if (code) {
      hasScannedRef.current = true;
      // 震动反馈（如果支持）
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      Quagga.stop();
      onScanSuccessRef.current(code);
    }
  }, []);

  useEffect(() => {
    // 检查环境
    if (window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1') {
      setError("摄像头访问需要 HTTPS 环境。请确保通过 HTTPS 或 localhost 访问。");
      setIsLoading(false);
      return;
    }

    hasScannedRef.current = false;

    const initScanner = () => {
      if (!scannerRef.current) return;

      const config: any = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: selectedCameraId ? undefined : "environment",
            deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        frequency: 10,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader",
            "code_39_reader",
          ],
        },
        locate: true,
      };

      Quagga.init(config, (err) => {
        if (err) {
          console.error("Quagga init error:", err);
          let errorMessage = "无法启动摄像头。";
          if (err.name === 'NotAllowedError') {
            errorMessage = "请允许访问摄像头权限。";
          } else if (err.name === 'NotFoundError') {
            errorMessage = "未找到摄像头设备。";
          } else if (err.name === 'NotSupportedError') {
            errorMessage = "当前环境不支持摄像头访问（需HTTPS）。";
          }
          setError(errorMessage);
          setIsLoading(false);
          return;
        }

        Quagga.start();
        setIsLoading(false);
      });

      Quagga.onDetected(handleDetected);
    };

    // 小延迟确保 DOM 准备好
    const timer = setTimeout(initScanner, 100);

    return () => {
      clearTimeout(timer);
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    };
  }, [selectedCameraId, handleDetected]);

  const handleRetry = () => {
    window.location.reload();
  };

  const switchCamera = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    setShowSettings(false);
    setIsLoading(true);
    hasScannedRef.current = false;
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

        <div className="flex-1 bg-black relative min-h-[360px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
          {isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black bg-opacity-50">
              <RefreshCw className="animate-spin mb-2" size={32} />
              <p>正在启动摄像头...</p>
            </div>
          )}

          {/* 设置面板 */}
          {showSettings && (
            <div className="absolute inset-0 z-20 bg-black bg-opacity-90 p-4 flex flex-col animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Settings size={18} /> 摄像头设置
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2">
                {cameras.map((cam, index) => (
                  <button
                    key={cam.deviceId}
                    onClick={() => switchCamera(cam.deviceId)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${selectedCameraId === cam.deviceId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                  >
                    <Camera size={18} />
                    <span className="truncate">{cam.label || `摄像头 ${index + 1}`}</span>
                  </button>
                ))}
                <button
                  onClick={() => switchCamera('')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${selectedCameraId === ''
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  <Camera size={18} />
                  <span>自动选择 (默认)</span>
                </button>
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
              {/* 扫描视图 */}
              <div
                ref={scannerRef}
                className="quagga-viewport w-full h-full absolute inset-0"
              >
                {/* Quagga 会在这里渲染视频 */}
              </div>

              {/* 扫描框覆盖层 */}
              {!isLoading && !showSettings && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-72 h-48 sm:w-96 sm:h-64 border-2 border-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-lg">
                    {/* 角标 */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>

                    {/* 扫描线 */}
                    <div className="absolute left-2 right-2 h-0.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-scan"></div>

                    <p className="absolute -bottom-8 left-0 right-0 text-center text-white text-sm font-medium">
                      将条码放入框内
                    </p>
                  </div>
                </div>
              )}

              {/* 设置按钮 */}
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
            请将条形码对准取景框，系统会自动识别
          </p>
        </div>
      </div>
    </div>
  );
};
