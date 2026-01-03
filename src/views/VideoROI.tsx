import React, {useState, useRef, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {Toolbar} from '../components/VideoROI/Toolbar';
import {DrawingCanvas} from '../components/VideoROI/DrawingCanvas';
import {useVideoSource} from '../hooks/useVideoSource';
import {useROIState} from '../hooks/useROIState';
import type {DetectionItem, DetectionResponse} from '../types/detection';
import {statsService} from '../services/statsService';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

// Helper types if they are not exported or to match usage
type RectLike = { x: number; y: number; width: number; height: number };

// Helper functions 
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const toWsUrl = (url: string) => {
    if (url.startsWith('https')) return url.replace('https', 'wss');
    if (url.startsWith('http')) return url.replace('http', 'ws');
    return url;
};

// Replace the existing captureFrameAsJpeg with this robust version from the working file
async function captureFrameAsJpeg(
    videoEl: HTMLVideoElement,
    displaySize: { width: number; height: number },
    nativeSize: { width: number; height: number },
    rectangles: RectLike[]
): Promise<Blob> {
    const nativeW = nativeSize.width || videoEl.videoWidth || 0;
    const nativeH = nativeSize.height || videoEl.videoHeight || 0;

    if (!nativeW || !nativeH) {
        throw new Error("Video native size is not available");
    }

    // Calculate scale factors
    const scaleX = nativeW / displaySize.width;
    const scaleY = nativeH / displaySize.height;

    // Logic: If ROI exists, use the last one. If not, use full frame.
    const hasRoi = rectangles.length > 0;
    const roi = hasRoi ? rectangles[rectangles.length - 1] : null;

    const srcX = roi ? Math.max(0, Math.floor(roi.x * scaleX)) : 0;
    const srcY = roi ? Math.max(0, Math.floor(roi.y * scaleY)) : 0;
    const srcW = roi ? Math.max(1, Math.floor(roi.width * scaleX)) : nativeW;
    const srcH = roi ? Math.max(1, Math.floor(roi.height * scaleY)) : nativeH;

    const clampedW = Math.min(srcW, nativeW - srcX);
    const clampedH = Math.min(srcH, nativeH - srcY);

    const canvas = document.createElement("canvas");
    canvas.width = clampedW;
    canvas.height = clampedH;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    ctx.drawImage(videoEl, srcX, srcY, clampedW, clampedH, 0, 0, clampedW, clampedH);

    const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => {
                if (!b) reject(new Error("Failed to create JPEG blob"));
                else resolve(b);
            },
            "image/jpeg",
            0.85 // Quality adjustment
        );
    });

    return blob;
}

export default function VideoROI() {
    const {t} = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mainDisplayRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);

    // ...

    const {state: videoState, actions: videoActions} = useVideoSource(videoRef);
    const {state: roiState, setters: roiSetters, actions: roiActions} = useROIState();

    const [videoSize, setVideoSize] = useState({width: 640, height: 480});
    const [isFullscreen, setIsFullscreen] = useState(false);
    // const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const requestRef = useRef<number | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const isStreamingRef = useRef(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // [TYPE SAFE] State updated with DetectionResponse
    const [lastResult, setLastResult] = useState<DetectionResponse | null>(null);

    // [NEW] Time states
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const isWaitingForResponseRef = useRef(false);

    const roiRectsRef = useRef<RectLike[]>([]);
    const videoSizeRef = useRef(videoSize);
    const nativeSizeRef = useRef({width: 0, height: 0});

    useEffect(() => {
        roiRectsRef.current = (roiState.rectangles as unknown as RectLike[]) ?? [];
    }, [roiState.rectangles]);

    useEffect(() => {
        videoSizeRef.current = videoSize;
    }, [videoSize]);

    useEffect(() => {
        nativeSizeRef.current = {
            width: videoState.nativeVideoSize.width || videoRef.current?.videoWidth || 0,
            height: videoState.nativeVideoSize.height || videoRef.current?.videoHeight || 0,
        };
    }, [videoState.nativeVideoSize.width, videoState.nativeVideoSize.height]);

    const isCenterInRect = (
        detection: DetectionItem,
        roi: RectLike,
        scaleX: number,
        scaleY: number
    ) => {
        // Destructure bbox: [x, y, width, height]
        const [x, y, w, h] = detection.bbox;

        // Calculate center in Native Video coordinates
        const nativeCenterX = x + (w / 2);
        const nativeCenterY = y + (h / 2);

        // Scale down to Display coordinates to compare with ROI
        const displayCenterX = nativeCenterX / scaleX;
        const displayCenterY = nativeCenterY / scaleY;

        return (
            displayCenterX >= roi.x &&
            displayCenterX <= (roi.x + roi.width) &&
            displayCenterY >= roi.y &&
            displayCenterY <= (roi.y + roi.height)
        );
    };
    const calculateDisplaySize = useCallback(() => {
        const container = mainDisplayRef.current;
        if (!container || videoState.nativeVideoSize.width === 0) return;

        const padding = 40;
        const containerWidth = container.clientWidth - padding;
        const containerHeight = container.clientHeight - padding;
        const videoAspectRatio =
            videoState.nativeVideoSize.width / videoState.nativeVideoSize.height;

        let newWidth = containerWidth;
        let newHeight = newWidth / videoAspectRatio;
        if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = newHeight * videoAspectRatio;
        }
        setVideoSize({width: newWidth, height: newHeight});
    }, [videoState.nativeVideoSize]);

    const stopRealtimeStream = useCallback(() => {
        isStreamingRef.current = false;
        isWaitingForResponseRef.current = false;

        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }

        setIsStreaming(false);
        setLastResult(null);

        if (videoRef.current && !videoState.isCameraActive) {
            if (!videoRef.current.paused && !videoRef.current.ended) {
                videoRef.current.pause();
            }
        }
    }, [videoState.isCameraActive]);


    // Frame processing loop
// Frame processing loop - Logic from working file
    const processFrame = useCallback(async () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (!isStreamingRef.current) return;

        const videoEl = videoRef.current;
        if (!videoEl || videoEl.paused || videoEl.ended) {
            stopRealtimeStream();
            return;
        }

        if (isWaitingForResponseRef.current) {
            requestRef.current = requestAnimationFrame(processFrame);
            return;
        }

        try {
            const rects = roiRectsRef.current; // Get current ROIs
            // Pass the correct parameters to the capture function
            const blob = await captureFrameAsJpeg(
                videoEl,
                {width: videoSizeRef.current.width, height: videoSizeRef.current.height},
                nativeSizeRef.current,
                rects
            );

            const buffer = await blob.arrayBuffer();

            if (wsRef.current.readyState === WebSocket.OPEN && isStreamingRef.current) {
                isWaitingForResponseRef.current = true;
                wsRef.current.send(buffer);
                requestRef.current = requestAnimationFrame(processFrame);
            } else {
                stopRealtimeStream();
            }
        } catch (err) {
            isWaitingForResponseRef.current = false;
            console.error("Frame capture error:", err);
        }
    }, [stopRealtimeStream]);

    const connectWebSocket = useCallback(() => {
        // Prevent multiple connections
        if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
            return;
        }

        setIsLoading(true);
        const wsUrl = `${toWsUrl(API_BASE_URL)}/ws/detect`;
        const ws = new WebSocket(wsUrl);
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WS connected");
            setIsLoading(false);
            setIsConnected(true);
            isWaitingForResponseRef.current = false;
        };

        ws.onmessage = (evt) => {
            if (!isStreamingRef.current) return;
            isWaitingForResponseRef.current = false;
            try {
                // Restore simple message handling without complex client-side filtering
                const data: DetectionResponse = JSON.parse(evt.data);
                setLastResult(data);

                // Keep stats service if you really need it, otherwise remove these lines
                // or ensure they don't block the render.
                if (data.detections && data.detections.length > 0) {
                    statsService.incrementDetection(data.detections.length);
                }
                if (data.confirmed_breach) {
                    statsService.incrementAlarm();
                }

            } catch (e) {
                console.error("Failed to parse websocket message", e);
            }
        };

        ws.onerror = (e) => {
            console.error("WebSocket error:", e);
            setIsLoading(false);
            setIsConnected(false);
        };

        ws.onclose = () => {
            console.log("WS closed");
            stopRealtimeStream();
            setIsConnected(false);
            setIsLoading(false);
            wsRef.current = null;
        };

    }, [stopRealtimeStream]);

    const startProcessing = useCallback(() => {
        if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        setIsStreaming(true);
        isStreamingRef.current = true;

        // Simple play and loop logic from the working file
        videoRef.current.play()
            .then(() => {
                requestRef.current = requestAnimationFrame(processFrame);
            })
            .catch(e => console.error("Video play failed:", e));
    }, [processFrame]);

    const handleToggleStream = () => {
        if (isConnected) {
            if (isStreaming) {
                stopRealtimeStream();
            } else {
                startProcessing();
            }
        } else {
            if (!isLoading) {
                connectWebSocket();
            }
        }
    };


    const closeWebSocket = useCallback(() => {
        isStreamingRef.current = false;
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        setIsLoading(false);
        setIsStreaming(false);
    }, []);


    useEffect(() => {
        if (isConnected && !isStreaming) {
            startProcessing();
        }
    }, [isConnected, startProcessing, isStreaming]);

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        setDuration(video.duration);
        videoActions.handleVideoLoaded();
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        setCurrentTime(e.currentTarget.currentTime);
    };

    useEffect(() => {
        // We only want to clean up when the component unmounts or video source changes.
        // We DO NOT call connectWebSocket() here anymore.
        return () => {
            if (videoState.videoUrl === null && !videoState.isCameraActive) {
                closeWebSocket();
            }
        };
    }, [videoState.videoUrl, videoState.isCameraActive, closeWebSocket]);

    // useEffect(() => {
    //     const videoEl = videoRef.current;
    //     const handleEnded = () => {
    //         console.log("Video ended (Event listener)");
    //         stopRealtimeStream();
    //         closeWebSocket();
    //
    //         if (videoEl && !videoEl.paused) {
    //             videoEl.pause();
    //         }
    //     };
    //
    //     if (videoEl) {
    //         videoEl.addEventListener('ended', handleEnded);
    //     }
    //     return () => {
    //         if (videoEl) videoEl.removeEventListener('ended', handleEnded);
    //     };
    // }, [stopRealtimeStream, closeWebSocket]);

    useEffect(() => {
        if (videoState.videoUrl || videoState.isCameraActive) {
            window.addEventListener("resize", calculateDisplaySize);
            calculateDisplaySize();
        }
        return () => {
            window.removeEventListener("resize", calculateDisplaySize);
        };
    }, [calculateDisplaySize, videoState.videoUrl, videoState.isCameraActive]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const handleToggleFullscreen = () => {
        const elem = fullscreenContainerRef.current;
        if (!elem) return;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            <div ref={fullscreenContainerRef} className="flex flex-row h-[calc(100vh-64px)] w-full bg-slate-900/50">
                {/* TOOLBAR SIDE */}
                <Toolbar
                    tool={roiState.tool}
                    setTool={roiSetters.setTool}
                    isCameraActive={videoState.isCameraActive}
                    isFullscreen={isFullscreen}
                    onFileChange={(e) => {
                        stopRealtimeStream();
                        setIsStreaming(false);
                        isStreamingRef.current = false;
                        const file = e.target.files?.[0] ?? null;
                        // setSelectedVideoFile(file); // removed as unused
                        videoActions.handleFileChange(e);

                        // [STATS]
                        if (file) statsService.incrementVideoSession(file.name);

                        setLastResult(null);
                        closeWebSocket();
                        // Reset time
                        setDuration(0);
                        setCurrentTime(0);
                    }}
                    onOpenCamera={() => {
                        stopRealtimeStream();
                        setIsStreaming(false);
                        isStreamingRef.current = false;
                        closeWebSocket();
                        videoActions.handleOpenCamera();

                        // [STATS]
                        statsService.incrementCameraSession();

                        setLastResult(null);
                        // Reset time
                        setDuration(0);
                        setCurrentTime(0);
                    }}
                    onUndo={roiActions.undo}
                    onClear={() => {
                        setLastResult(null);
                        roiActions.clearRectangles();
                    }}
                    onToggleFullscreen={handleToggleFullscreen}
                    isStreaming={isStreaming}
                    onToggleStream={handleToggleStream}
                    isLoading={isLoading}
                />

                {/* VIDEO DISPLAY AREA */}
                <div
                    ref={mainDisplayRef}
                    className="flex-1 flex justify-center items-center bg-slate-900/50 p-6 relative overflow-hidden"
                >
                    {/* Background Grid for aesthetics */}
                    <div className="absolute inset-0 pointer-events-none"
                         style={{
                             backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.1) 1px, transparent 0)',
                             backgroundSize: '40px 40px'
                         }}
                    ></div>

                    {videoState.videoUrl || videoState.isCameraActive ? (
                        <div
                            ref={containerRef}
                            className="relative rounded-xl shadow-2xl overflow-hidden bg-black border border-slate-700/50 ring-1 ring-white/5"
                            style={{
                                width: videoSize.width,
                                height: videoSize.height,
                            }}
                        >
                            <video
                                ref={videoRef}
                                src={videoState.videoUrl ?? undefined}
                                playsInline
                                muted
                                controls={false}
                                onLoadedMetadata={handleLoadedMetadata}
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={() => {
                                    console.log("Video ended (Prop Handler)");
                                    stopRealtimeStream();
                                    closeWebSocket();
                                    setIsStreaming(false);
                                }}
                                className="absolute top-0 left-0 w-full h-full object-contain z-[1]"
                            />

                            <DrawingCanvas
                                width={videoSize.width}
                                height={videoSize.height}
                                nativeSize={videoState.nativeVideoSize}
                                rectangles={roiState.rectangles}
                                newRect={roiState.newRect}
                                tool={roiState.tool}
                                isDrawing={roiState.isDrawing}
                                detections={lastResult?.detections}
                                setNewRect={roiSetters.setNewRect}
                                setIsDrawing={roiSetters.setIsDrawing}
                                addRectangle={roiActions.addRectangle}
                                updateRectangle={roiActions.updateRectangle}
                                deleteRectangle={roiActions.deleteRectangle}
                                confirmed_breach={lastResult?.confirmed_breach}
                            />

                            {/* Status Indicator (Top Right) */}
                            <div
                                className="absolute top-4 right-4 px-3 py-1.5 rounded-lg backdrop-blur-md bg-slate-900/80 border border-slate-700/50 text-emerald-400 flex items-center gap-2 text-sm font-medium shadow-lg z-20"
                            >
                                {isLoading && (
                                    <div
                                        className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                                )}
                                <span>
                                    {isLoading ? t('video_roi.connecting') : (isStreaming ? t('video_roi.system_active') : (isConnected ? t('video_roi.ready') : t('video_roi.disconnected')))}
                                </span>
                                {isStreaming && (
                                    <span className="flex h-2 w-2 relative ml-1">
                                        <span
                                            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                )}
                            </div>

                            {/* [NEW] Video Time Indicator (Bottom Left) */}
                            {videoState.videoUrl && !videoState.isCameraActive && (
                                <div
                                    className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg backdrop-blur-md bg-slate-900/80 border border-slate-700/50 text-slate-300 font-mono text-xs z-20 shadow-lg"
                                >
                                    {formatTime(currentTime)} <span
                                    className="text-slate-500">/</span> {formatTime(duration)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className="text-center p-12 rounded-2xl border-2 border-dashed border-slate-700/50 bg-slate-800/20 max-w-lg">
                            <div className="text-6xl mb-6 text-slate-600">📹</div>
                            <h3 className="text-xl font-semibold text-slate-200 mb-2">{t('video_roi.no_video')}</h3>
                            <p className="text-slate-400">{t('video_roi.load_video_prompt')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
