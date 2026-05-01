import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, ListMusic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AudioPart {
    url: string;
    title: string;
    duration: number;
}

interface AudiobookPlayerProps {
    parts: AudioPart[];
    title: string;
    coverUrl: string;
}

export function AudiobookPlayer({ parts, title, coverUrl }: AudiobookPlayerProps) {
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const currentPart = parts[currentPartIndex];

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(console.error);
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentPartIndex]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        if (currentPartIndex < parts.length - 1) {
            setCurrentPartIndex(currentPartIndex + 1);
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    };

    const togglePlay = () => setIsPlaying(!isPlaying);

    const skipForward = () => {
        if (currentPartIndex < parts.length - 1) {
            setCurrentPartIndex(currentPartIndex + 1);
        }
    };

    const skipBack = () => {
        if (currentPartIndex > 0) {
            setCurrentPartIndex(currentPartIndex - 1);
        } else if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    const handleSeek = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    // Simple duration formatter for internal use
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col w-full max-w-md mx-auto space-y-6">
            {/* Cover Art & Info */}
            <div className="relative group aspect-square w-full max-w-[280px] mx-auto overflow-hidden rounded-2xl shadow-2xl border border-white/10">
                <img src={coverUrl} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-bold text-white truncate">{title}</h3>
                    <p className="text-xs text-primary/80 font-medium">
                        {currentPart?.title || `Part ${currentPartIndex + 1}`} of {parts.length}
                    </p>
                </div>
            </div>

            {/* Main Controls */}
            <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-medium opacity-60">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-center gap-6">
                    <Button variant="ghost" size="icon" onClick={skipBack} disabled={currentPartIndex === 0 && currentTime < 5}>
                        <SkipBack className="w-6 h-6" />
                    </Button>

                    <Button
                        onClick={togglePlay}
                        size="icon"
                        className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 scale-110"
                    >
                        {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </Button>

                    <Button variant="ghost" size="icon" onClick={skipForward} disabled={currentPartIndex === parts.length - 1}>
                        <SkipForward className="w-6 h-6" />
                    </Button>
                </div>

                {/* Utility Buttons */}
                <div className="flex items-center justify-between px-4 pt-2">
                    <Button variant="ghost" size="icon" className={showPlaylist ? "text-primary bg-primary/10" : "opacity-40"} onClick={() => setShowPlaylist(!showPlaylist)}>
                        <ListMusic className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                        <Volume2 className="w-4 h-4" />
                        <div className="w-20">
                            <Slider defaultValue={[80]} max={100} step={1} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Playlist Area */}
            {showPlaylist && (
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <ScrollArea className="h-[200px] rounded-xl bg-white/5 border border-white/10 p-2">
                        <div className="space-y-1">
                            {parts.map((p, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setCurrentPartIndex(idx);
                                        setIsPlaying(true);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg text-xs flex items-center justify-between transition-colors ${idx === currentPartIndex ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="opacity-40 w-4">{idx + 1}</span>
                                        <span className="truncate max-w-[180px]">{p.title}</span>
                                    </div>
                                    <span className="opacity-40 text-[10px]">{formatTime(p.duration)}</span>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                src={currentPart?.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                hidden
            />
        </div>
    );
}
