import { useState, useCallback } from "react";

export type Tool = "draw" | "move" | "delete" | "none";

export interface Rect {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

function normalizeRect(r: Rect): Rect {
    const x = r.width < 0 ? r.x + r.width : r.x;
    const y = r.height < 0 ? r.y + r.height : r.y;
    return {
        ...r,
        x,
        y,
        width: Math.abs(r.width),
        height: Math.abs(r.height),
    };
}

export const useROIState = () => {
    const [rectangles, setRectangles] = useState<Rect[]>([]);
    const [tool, setTool] = useState<Tool>("none");

    const [newRect, setNewRect] = useState<Partial<Rect> | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const addRectangle = useCallback((rect: Rect) => {
        const normalized = normalizeRect(rect);
        setRectangles([normalized]);
    }, []);

    const updateRectangle = useCallback((id: number, newAttrs: Partial<Rect>) => {
        setRectangles((prev) => {
            if (prev.length === 0) return prev;
            const current = prev[0];
            if (current.id !== id) return prev;

            const merged: Rect = { ...current, ...newAttrs } as Rect;
            return [normalizeRect(merged)];
        });
    }, []);

    const deleteRectangle = useCallback((id: number) => {
        setRectangles((prev) => (prev[0]?.id === id ? [] : prev));
    }, []);

    const clearRectangles = useCallback(() => {
        if (window.confirm("Clear ROI area?")) {
            setRectangles([]);
        }
    }, []);

    const undo = useCallback(() => {
        setRectangles([]);
    }, []);

    return {
        state: { rectangles, tool, newRect, isDrawing },
        setters: { setTool, setNewRect, setIsDrawing, setRectangles },
        actions: { addRectangle, updateRectangle, deleteRectangle, clearRectangles, undo },
    };
};
