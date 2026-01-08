import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toolbar } from '../components/VideoROI/Toolbar';
import { DrawingCanvas } from '../components/VideoROI/DrawingCanvas';
import { useVideoContext } from '../context/VideoContext';
import { useROIState } from '../hooks/useROIState';
import type { DetectionResponse } from '../types/detection';
import { statsService } from '../services/statsService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type RectLike = { x: number; y: number; width: number; height: number };

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

    const scaleX = nativeW / displaySize.width;
    const scaleY = nativeH / displaySize.height;

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

    return await new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => {
                if (!b) reject(new Error("Failed to create JPEG blob"));
                else resolve(b);
            },
            "image/jpeg",
            0.85
        );
    });
}

export default function VideoROI() {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mainDisplayRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);

    const {
        videoState,
        roiState: globalRoiState,
        handleFileChange,
        handleOpenCamera,
        handleVideoLoaded,
        updateRectangles,
        clearVideo
    } = useVideoContext();

    const { state: roiState, setters: roiSetters, actions: roiActions } = useROIState();

    useEffect(() => {
        updateRectangles(roiState.rectangles);
    }, [roiState.rectangles, updateRectangles]);

    useEffect(() => {
        if (globalRoiState.rectangles && globalRoiState.rectangles.length > 0 && roiState.rectangles.length === 0) {
            roiSetters.setRectangles(globalRoiState.rectangles);
        }
    }, [globalRoiState.rectangles]);

    const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const requestRef = useRef<number | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const isStreamingRef = useRef(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const [lastResult, setLastResult] = useState<DetectionResponse | null>(null);

    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const isWaitingForResponseRef = useRef(false);

    const roiRectsRef = useRef<RectLike[]>([]);
    const videoSizeRef = useRef(videoSize);
    const nativeSizeRef = useRef({ width: 0, height: 0 });
    const shouldAutoStartRef = useRef(false);

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
        setVideoSize({ width: newWidth, height: newHeight });
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
            if (!videoRef.current.paused) {
                videoRef.current.pause();
            }
        }
    }, [videoState.isCameraActive]);

    const processFrame = useCallback(async () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            if (isStreamingRef.current) stopRealtimeStream();
            return;
        }
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
            const rects = roiRectsRef.current;
            const blob = await captureFrameAsJpeg(
                videoEl,
                { width: videoSizeRef.current.width, height: videoSizeRef.current.height },
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
            // Don't stop immediately on single frame error, retry next frame
            requestRef.current = requestAnimationFrame(processFrame);
        }
    }, [stopRealtimeStream]);

    const connectWebSocket = useCallback(() => {
        if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
            return;
        }
        shouldAutoStartRef.current = true;

        setIsLoading(true);
        const wsUrl = `${toWsUrl(API_BASE_URL)}/api/v1/ws/detect`;
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
                const data: DetectionResponse = JSON.parse(evt.data);
                setLastResult(data);

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
        const video = videoRef.current;
        if (!video || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn("Cannot start processing: Video or WS not ready");
            return;
        }

        // [FIX] Auto-rewind if video has ended
        if (video.ended) {
            video.currentTime = 0;
        }

        setIsStreaming(true);
        isStreamingRef.current = true;

        video.play()
            .then(() => {
                requestRef.current = requestAnimationFrame(processFrame);
            })
            .catch(e => {
                console.error("Video play failed:", e);
                // [FIX] Ensure state is reset if play fails (e.g. autoplay policy)
                stopRealtimeStream();
            });
    }, [processFrame, stopRealtimeStream]);

    const handleToggleStream = () => {
        const socketActive = wsRef.current && wsRef.current.readyState === WebSocket.OPEN;

        if (socketActive) {
            if (isStreaming) {
                stopRealtimeStream();
            } else {
                startProcessing();
            }
        } else {
            // [FIX] If state says connected but socket is dead, reset and reconnect
            setIsConnected(false);
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
        if (isConnected && !isStreaming && shouldAutoStartRef.current) {
            startProcessing();
            shouldAutoStartRef.current = false;
        }
    }, [isConnected, startProcessing, isStreaming]);

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        setDuration(video.duration);
        handleVideoLoaded(video);
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        setCurrentTime(e.currentTarget.currentTime);
    };

    useEffect(() => {
        if (videoState.isCameraActive && videoState.stream && videoRef.current) {
            videoRef.current.srcObject = videoState.stream;
            videoRef.current
                .play()
                .catch((e) => console.error("Video play failed:", e));
        }
    }, [videoState.isCameraActive, videoState.stream]);

    useEffect(() => {
        return () => {
            closeWebSocket();
        };
    }, [closeWebSocket]);

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
            <div ref={fullscreenContainerRef} className="flex flex-col-reverse sm:flex-row h-[calc(100vh-140px)] sm:h-[calc(100vh-64px)] w-full bg-slate-900/50">
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
                        handleFileChange(e);
                        if (file) statsService.incrementVideoSession(file.name);
                        setLastResult(null);
                        closeWebSocket();
                        setDuration(0);
                        setCurrentTime(0);
                    }}
                    onOpenCamera={() => {
                        stopRealtimeStream();
                        setIsStreaming(false);
                        isStreamingRef.current = false;
                        closeWebSocket();
                        handleOpenCamera();
                        statsService.incrementCameraSession();
                        setLastResult(null);
                        setDuration(0);
                        setCurrentTime(0);
                    }}
                    onUndo={roiActions.undo}
                    onClear={() => {
                        setLastResult(null);
                        roiActions.clearRectangles();
                    }}
                    onClearVideo={() => {
                        stopRealtimeStream();
                        closeWebSocket();
                        setLastResult(null);
                        setDuration(0);
                        setCurrentTime(0);
                        clearVideo();
                        roiSetters.setRectangles([]);
                    }}
                    onToggleFullscreen={handleToggleFullscreen}
                    isStreaming={isStreaming}
                    onToggleStream={handleToggleStream}
                    isLoading={isLoading}
                />

                <div
                    ref={mainDisplayRef}
                    className="flex-1 flex justify-center items-center bg-slate-900/50 p-6 relative overflow-hidden"
                >
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
                                collision={lastResult?.collision}
                                confirmed_collision={lastResult?.confirmed_collision}
                                collision_pairs={lastResult?.collision_pairs}
                            />

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