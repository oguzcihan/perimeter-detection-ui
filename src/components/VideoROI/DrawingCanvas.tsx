import { Stage, Layer, Rect, Text as KonvaText, Group } from "react-konva";
import type { Rect as RectType, Tool } from "../../hooks/useROIState";
import type { KonvaEventObject } from "konva/lib/Node";
import type { DetectionItem } from "../../types/detection";
import { useTranslation } from "react-i18next";

interface DrawingCanvasProps {
    width: number;
    height: number;
    nativeSize: { width: number; height: number };
    rectangles: RectType[];
    newRect: Partial<RectType> | null;
    tool: Tool;
    isDrawing: boolean;
    detections?: DetectionItem[];
    setNewRect: (rect: Partial<RectType> | null) => void;
    setIsDrawing: (drawing: boolean) => void;
    addRectangle: (rect: RectType) => void;
    updateRectangle: (id: number, attrs: Partial<RectType>) => void;
    deleteRectangle: (id: number) => void;
    confirmed_breach?: boolean;
    breach?: boolean;
    // New Collision Props
    collision?: boolean;
    confirmed_collision?: boolean;
    collision_pairs?: number[][];
}

export const DrawingCanvas = ({
                                  width,
                                  height,
                                  nativeSize,
                                  rectangles,
                                  newRect,
                                  tool,
                                  isDrawing,
                                  detections = [],
                                  setNewRect,
                                  setIsDrawing,
                                  addRectangle,
                                  updateRectangle,
                                  deleteRectangle,
                                  confirmed_breach = false,
                                  breach = false,
                                  collision = false,
                                  confirmed_collision = false,
                                  collision_pairs = []
                              }: DrawingCanvasProps) => {

    const { t } = useTranslation();

    const scaleX = width / (nativeSize.width || 1);
    const scaleY = height / (nativeSize.height || 1);
    const activeROI = rectangles.length > 0 ? rectangles[rectangles.length - 1] : null;

    const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (tool !== "draw" || e.target.getClassName() !== "Stage") return;
        const stage = e.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (pointer) {
            setNewRect({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
            setIsDrawing(true);
        }
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (!isDrawing || !newRect || tool !== "draw") return;

        if (e.evt.type === 'touchmove') {
            e.evt.preventDefault();
        }

        const stage = e.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (pointer && newRect.x !== undefined && newRect.y !== undefined) {
            setNewRect({
                ...newRect,
                width: pointer.x - newRect.x,
                height: pointer.y - newRect.y,
            });
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && newRect) {
            const w = newRect.width ?? 0;
            const h = newRect.height ?? 0;

            if (Math.abs(w) > 2 && Math.abs(h) > 2) {
                addRectangle({
                    id: Date.now(),
                    x: newRect.x || 0,
                    y: newRect.y || 0,
                    width: w,
                    height: h,
                });
            }
        }
        setIsDrawing(false);
        setNewRect(null);
    };

    const handleDragEnd = (id: number, e: KonvaEventObject<DragEvent>) => {
        const { x, y } = e.target.position();
        updateRectangle(id, { x, y });
    };

    const handleClick = (id: number) => {
        if (tool === "delete") {
            deleteRectangle(id);
        }
    };

    const handleMouseEnter = (e: KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        const container = stage?.container();
        if (container) {
            if (tool === "delete") {
                container.style.cursor = "pointer";
            } else if (tool === "move" || tool === "draw") {
                container.style.cursor = "move";
            }
        }
    };

    const handleMouseLeave = (e: KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        const container = stage?.container();
        if (container) {
            container.style.cursor = "default";
        }
    };

    return (
        <Stage
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className="position-absolute top-0 start-0"
            style={{
                zIndex: 10,
                pointerEvents: tool === "none" ? "none" : "auto"
            }}
        >
            <Layer>
                {/* ROI RECTANGLES */}
                {rectangles.map((rect) => (
                    <Rect
                        key={rect.id}
                        x={rect.x}
                        y={rect.y}
                        width={rect.width}
                        height={rect.height}
                        stroke="yellow"
                        strokeWidth={2}
                        draggable={tool === "move" || tool === "draw"}
                        onClick={() => handleClick(rect.id)}
                        onDragEnd={(e) => handleDragEnd(rect.id, e)}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                ))}

                {/* NEWLY DRAWN ROI */}
                {newRect && newRect.x !== undefined && newRect.y !== undefined && (
                    <Rect
                        x={newRect.x}
                        y={newRect.y}
                        width={newRect.width}
                        height={newRect.height}
                        stroke="yellow"
                        dash={[4, 2]}
                    />
                )}
            </Layer>

            {/* MODEL RESULTS LAYER */}
            <Layer>
                {detections.map((det, i) => {
                    // Flatten collision_pairs to easily check if this track_id is involved
                    // Safety check: collision_pairs might be undefined
                    const flatPairs = collision_pairs ? collision_pairs.flat() : [];

                    // Check if this detection is part of a collision pair
                    // Note: 'track_id' must exist on detection item from backend
                    const isInCollision = det.track_id !== undefined && flatPairs.includes(det.track_id);

                    const roiNativeX = activeROI ? (activeROI.x / scaleX) : 0;
                    const roiNativeY = activeROI ? (activeROI.y / scaleY) : 0;

                    const [boxX, boxY, boxW, boxH] = det.bbox;

                    const finalX = (boxX + roiNativeX) * scaleX;
                    const finalY = (boxY + roiNativeY) * scaleY;
                    const finalW = boxW * scaleX;
                    const finalH = boxH * scaleY;

                    // COLOR LOGIC: Collision (Purple) > Alert (Red) > Normal (Green)
                    let statusColor = "#00FF00"; // Green
                    if (det.alert) statusColor = "red";
                    if (isInCollision) statusColor = "#CC00FF"; // Purple

                    const labelText = `${det.label} ${det.distance_meters}m`;

                    return (
                        <Group key={i} x={finalX} y={finalY}>
                            <Rect
                                width={finalW}
                                height={finalH}
                                stroke={statusColor}
                                strokeWidth={det.alert || isInCollision ? 4 : 2}
                                shadowColor="black"
                                shadowBlur={5}
                            />
                            <KonvaText
                                y={-25}
                                text={labelText}
                                fill={statusColor}
                                fontSize={16}
                                fontStyle="bold"
                                shadowColor="black"
                                shadowBlur={2}
                            />
                            {isInCollision && (
                                <KonvaText
                                    y={finalH + 5}
                                    text="COLLISION"
                                    fill="#CC00FF"
                                    fontSize={14}
                                    fontStyle="bold"
                                />
                            )}
                        </Group>
                    );
                })}

                {/* BREACH WARNING */}
                {breach && !confirmed_breach && (
                    <Group x={width / 2 - 150} y={50}>
                        <Rect
                            width={300}
                            height={50}
                            fill="orange"
                            cornerRadius={5}
                            opacity={0.9}
                            shadowColor="black"
                            shadowBlur={10}
                        />
                        <KonvaText
                            text={t('video_roi.canvas.caution')}
                            fontSize={24}
                            fontStyle="bold"
                            fill="white"
                            width={300}
                            padding={12}
                            align="center"
                        />
                    </Group>
                )}

                {confirmed_breach && (
                    <Group x={width / 2 - 150} y={50}>
                        <Rect
                            width={300}
                            height={50}
                            fill="red"
                            cornerRadius={5}
                            opacity={0.9}
                            shadowColor="black"
                            shadowBlur={10}
                        />
                        <KonvaText
                            text={t('video_roi.canvas.breach')}
                            fontSize={24}
                            fontStyle="bold"
                            fill="white"
                            width={300}
                            padding={12}
                            align="center"
                        />
                    </Group>
                )}

                {/* COLLISION WARNING OVERLAY */}
                {collision && (
                    <Group x={width / 2 - 150} y={110}>
                        <Rect
                            width={300}
                            height={50}
                            fill="#CC00FF"
                            cornerRadius={5}
                            opacity={0.9}
                            shadowColor="black"
                            shadowBlur={10}
                        />
                        <KonvaText
                            text="COLLISION DETECTED"
                            fontSize={24}
                            fontStyle="bold"
                            fill="white"
                            width={300}
                            padding={12}
                            align="center"
                        />
                    </Group>
                )}
            </Layer>
        </Stage>
    );
};

export default DrawingCanvas;