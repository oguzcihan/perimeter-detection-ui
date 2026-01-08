// src/types/detection.ts

export interface DetectionItem {
    label: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x, y, w, h]
    distance_meters: number;
    alert: boolean;
    track_id?: number; // Optional: Added for object tracking ID
}

export interface DetectionResponse {
    breach: boolean;            // Instant breach (UI)
    confirmed_breach: boolean;  // Verified breach (alarm)

    // New Collision Fields
    collision?: boolean;
    confirmed_collision?: boolean;
    collision_pairs?: number[][]; // Array of track_id pairs [id1, id2]

    count: number;
    detections: DetectionItem[];
}

export interface VideoFrameDetection {
    frame_index: number;
    timestamp_ms: number;
    result: DetectionResponse;
}

export interface VideoDetectionResponse {
    breach: boolean;
    frames_processed: number;
    total_detections: number;
    results: VideoFrameDetection[];
}