import { useState, useRef, useEffect, useCallback } from "react";

export interface VideoSourceState {
    videoUrl: string | null;
    stream: MediaStream | null;
    isCameraActive: boolean;
    nativeVideoSize: { width: number; height: number };
}

export interface VideoSourceActions {
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleOpenCamera: () => Promise<void>;
    handleVideoLoaded: () => void;
    resetSource: () => void;
}

export const useVideoSource = (
    videoRef: React.RefObject<HTMLVideoElement | null>
) => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [nativeVideoSize, setNativeVideoSize] = useState({ width: 0, height: 0 });

    const resetSource = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
        setStream(null);
        setIsCameraActive(false);
        setVideoUrl(null);
        setNativeVideoSize({ width: 0, height: 0 });
    }, [stream]);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                resetSource();
                const url = URL.createObjectURL(file);
                setVideoUrl(url);
            }
        },
        [resetSource]
    );

    const handleOpenCamera = useCallback(async () => {
        if (isCameraActive) {
            resetSource();
        } else {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 },
                });
                resetSource(); // Clear any existing file/stream first
                setStream(mediaStream);
                setIsCameraActive(true);
                setNativeVideoSize({ width: 640, height: 480 });
            } catch (err) {
                console.error("Camera error:", err);
                alert("Unable to access camera. Please check permissions.");
            }
        }
    }, [isCameraActive, resetSource]);

    const handleVideoLoaded = useCallback(() => {
        if (videoRef.current) {
            const { videoWidth, videoHeight } = videoRef.current;
            setNativeVideoSize({ width: videoWidth, height: videoHeight });
        }
    }, [videoRef]);

    // Effect to attach stream to video element
    useEffect(() => {
        if (isCameraActive && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current
                .play()
                .catch((e) => console.error("Video play failed:", e));
        }
    }, [isCameraActive, stream, videoRef]);

    return {
        state: { videoUrl, stream, isCameraActive, nativeVideoSize },
        actions: { handleFileChange, handleOpenCamera, handleVideoLoaded, resetSource },
    };
};
