import {
    FiMove,
    FiSquare,
    FiTrash2,
    FiRotateCcw,
    FiCamera,
    FiVideo,
    FiMinimize,
    FiMaximize,
    FiPlay,      // Start icon
    FiStopCircle //  Stop icon
} from "react-icons/fi";
import { BsEraser } from "react-icons/bs";
import type { Tool } from "../../hooks/useROIState";
import { useTranslation } from "react-i18next";

interface ToolbarProps {
    tool: Tool;
    setTool: (t: Tool) => void;
    isCameraActive: boolean;
    isFullscreen: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenCamera: () => void;
    onUndo: () => void;
    onClear: () => void;
    onToggleFullscreen: () => void;
    isStreaming: boolean; // Controls streaming state
    onToggleStream: () => void;
    isLoading?: boolean;
}

export const Toolbar = ({
    tool,
    setTool,
    isCameraActive,
    isFullscreen,
    onFileChange,
    onOpenCamera,
    onUndo,
    onClear,
    onToggleFullscreen,
    isStreaming,
    onToggleStream,
    isLoading = false, // ADDED
}: ToolbarProps) => {

    const { t } = useTranslation();

    const handleToolClick = (clickedTool: Tool) => {
        if (tool === clickedTool) {
            setTool("none"); // or null, depending on the type definition in useROIState
        } else {
            setTool(clickedTool);
        }
    };

    const ButtonClass = (active: boolean = false, danger: boolean = false) => `
        w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 mb-2
        ${active
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
            : danger
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200 hover:border-slate-600'
        }
    `;

    return (
        <div
            className="flex flex-col items-center p-4 w-20 bg-slate-900 border-r border-slate-800 h-full z-30 shadow-xl"
        >
            <label className={ButtonClass(false)} title={t('video_roi.toolbar.load_video')}>
                <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={onFileChange}
                />
                <FiVideo size={20} />
            </label>

            <button
                onClick={onOpenCamera}
                className={ButtonClass(isCameraActive)}
                title={isCameraActive ? t('video_roi.toolbar.close_camera') : t('video_roi.toolbar.open_camera')}
            >
                <FiCamera size={20} />
            </button>

            <div className="w-full h-px bg-slate-800 my-4" />

            {/* DRAW BUTTON */}
            <button
                className={ButtonClass(tool === "draw")}
                onClick={() => handleToolClick("draw")} // UPDATED
                title={t('video_roi.toolbar.draw_roi')}
            >
                <FiSquare size={20} />
            </button>

            {/* MOVE BUTTON */}
            <button
                className={ButtonClass(tool === "move")}
                onClick={() => handleToolClick("move")} // UPDATED
                title={t('video_roi.toolbar.move_roi')}
            >
                <FiMove size={20} />
            </button>

            {/* DELETE BUTTON */}
            <button
                className={ButtonClass(tool === "delete")}
                onClick={() => handleToolClick("delete")} // UPDATED
                title={t('video_roi.toolbar.delete_roi')}
            >
                <FiTrash2 size={20} />
            </button>

            <div className="w-full h-px bg-slate-800 my-4" />

            <button
                onClick={onUndo}
                title={t('video_roi.toolbar.undo')}
                className={ButtonClass(false)}
            >
                <FiRotateCcw size={20} />
            </button>

            <button
                onClick={onClear}
                title={t('video_roi.toolbar.clear')}
                className={ButtonClass(false)}
            >
                <BsEraser size={20} />
            </button>

            <button
                onClick={onToggleFullscreen}
                title={isFullscreen ? t('video_roi.toolbar.exit_fullscreen') : t('video_roi.toolbar.enter_fullscreen')}
                className={ButtonClass(false)}
            >
                {isFullscreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
            </button>

            <div className="flex-1" /> {/* Spacer */}

            <button
                onClick={onToggleStream}
                disabled={isLoading}
                title={isLoading ? t('video_roi.connecting') : (isStreaming ? t('video_roi.toolbar.stop_processing') : t('video_roi.toolbar.start_processing'))}
                className={`
                    w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 shadow-lg scale-100 hover:scale-105 active:scale-95
                    ${isStreaming
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                    }
                    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                `}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isStreaming ? (
                    <FiStopCircle size={24} />
                ) : (
                    <FiPlay size={24} className="ml-1" />
                )}
            </button>
        </div>
    );
};
