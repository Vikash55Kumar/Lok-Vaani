import React from 'react';
import { Megaphone } from 'lucide-react';

const NewsTicker: React.FC = () => {

    const newsItems = [
        "New consultation drafts released citizens invited to submit feedback.",
        "AI upgrade enables faster, deeper insights for policy makers.",
        "Digital governance expansion: real-time insight systems rolling out.",
    ];

    const marqueeRef = React.useRef<HTMLDivElement | null>(null);
    const [paused, setPaused] = React.useState(false);
    const [duration] = React.useState<number>(15);

    return (
        <div className="bg-slate-800 text-white py-2 overflow-hidden">
            <div className="flex items-center">
                <div className="flex-shrink-0 px-4 flex items-center space-x-2">
                    <Megaphone size={18} className="text-amber-400" />
                    <span className="font-bold text-sm">Latest Updates</span>
                </div>
                <div className="flex-grow relative h-6 overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                    <div
                        ref={marqueeRef}
                        className="absolute whitespace-nowrap text-sm font-semibold text-white leading-6"
                        style={{
                            willChange: 'transform',
                            animation: `marquee ${duration}s linear infinite`,
                            animationPlayState: paused ? 'paused' : 'running'
                        }}
                        aria-live="polite"
                    >
                        {/* duplicate content for seamless loop */}
                        {[...newsItems, ...newsItems].map((item, index) => (
                            <span key={index} className="mx-16">{item}</span>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};

export default NewsTicker;