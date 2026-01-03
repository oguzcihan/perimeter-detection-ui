import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

export interface VideoState {
    videoUrl: string | null;
    stream: MediaStream | null;
    isCameraActive: boolean;
    nativeVideoSize: { width: number; height: number };
}

export interface ROIState {
    rectangles: any[]; // Using any to avoid circular dependency, but preferably should be Rect[]
}

export interface VideoContextType {
    videoState: VideoState;
    roiState: ROIState;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleOpenCamera: () => Promise<void>;
    handleVideoLoaded: (videoElement: HTMLVideoElement) => void;
    updateRectangles: (rects: any[]) => void;
    clearVideo: () => void;
}

const VideoContext = createContext<VideoContextType | null>(null);

export const useVideoContext = () => {
    const context = useContext(VideoContext);
    if (!context) {
        throw new Error("useVideoContext must be used within a VideoProvider");
    }
    return context;
};

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth(); // Monitor auth state to clear video on logout

    const [videoState, setVideoState] = useState<VideoState>({
        videoUrl: null,
        stream: null,
        isCameraActive: false,
        nativeVideoSize: { width: 0, height: 0 },
    });

    const [rectangles, setRectangles] = useState<any[]>([]);

    const resetSource = useCallback(() => {
        if (videoState.stream) {
            videoState.stream.getTracks().forEach((track) => track.stop());
        }
        if (videoState.videoUrl) {
            URL.revokeObjectURL(videoState.videoUrl);
        }
        setVideoState({
            videoUrl: null,
            stream: null,
            isCameraActive: false,
            nativeVideoSize: { width: 0, height: 0 },
        });
    }, [videoState.stream, videoState.videoUrl]);

    const clearVideo = useCallback(() => {
        resetSource();
        setRectangles([]);
    }, [resetSource]);

    // Auto-clear on logout
    useEffect(() => {
        if (!user) {
            clearVideo();
        }
    }, [user, clearVideo]);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                resetSource();
                const url = URL.createObjectURL(file);
                setVideoState((prev) => ({
                    ...prev,
                    videoUrl: url,
                    isCameraActive: false,
                    nativeVideoSize: { width: 0, height: 0 }, // Will be set when loaded
                }));
                // Clear ROI when new video loads
                setRectangles([]);
            }
        },
        [resetSource]
    );

    const handleOpenCamera = useCallback(async () => {
        // If camera is already active, do nothing or re-init?
        // Let's reset first to be clean
        resetSource();

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            setVideoState({
                videoUrl: null,
                stream: mediaStream,
                isCameraActive: true,
                nativeVideoSize: { width: 640, height: 480 },
            });
            setRectangles([]);
        } catch (err) {
            console.error("Camera error:", err);
            alert("Unable to access camera. Please check permissions.");
        }
    }, [resetSource]);

    const handleVideoLoaded = useCallback((videoElement: HTMLVideoElement) => {
        const { videoWidth, videoHeight } = videoElement;
        // Only update if dimensions are different to avoid loops
        setVideoState((prev) => {
            if (prev.nativeVideoSize.width === videoWidth && prev.nativeVideoSize.height === videoHeight) {
                return prev;
            }
            return {
                ...prev,
                nativeVideoSize: { width: videoWidth, height: videoHeight },
            };
        });
    }, []);

    const updateRectangles = useCallback((rects: any[]) => {
        setRectangles(rects);
    }, []);

    return (
        <VideoContext.Provider
            value={{
                videoState,
                roiState: { rectangles },
                handleFileChange,
                handleOpenCamera,
                handleVideoLoaded,
                updateRectangles,
                clearVideo,
            }}
        >
            {children}
        </VideoContext.Provider>
    );
};
