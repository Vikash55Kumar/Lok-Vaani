import React, { useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

import Display1 from '../../assets/display1.png';
import Display2 from '../../assets/display2.png';
import Display3 from '../../assets/display3.png';
import Display4 from '../../assets/display4.png';
import Display5 from '../../assets/display5.png';


const bannerSlides = [
    { image: Display1 },
    { image: Display3 },
    { image: Display2 },
    { image: Display4 },
    { image: Display5 },
];

const BannerCarousel: React.FC = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const autoplayRef = React.useRef<number | null>(null);
    const [isPaused, setIsPaused] = React.useState(false);

    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on('select', onSelect);

        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi]);

    useEffect(() => {
        // autoplay controller
        const start = () => {
            if (autoplayRef.current) return;
            autoplayRef.current = window.setInterval(() => {
                if (emblaApi && !isPaused) emblaApi.scrollNext();
            }, 3500);
        };
        const stop = () => {
            if (autoplayRef.current) {
                clearInterval(autoplayRef.current);
                autoplayRef.current = null;
            }
        };
        start();
        return () => stop();
    }, [emblaApi, isPaused]);

    // keyboard nav
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!emblaApi) return;
            if (e.key === 'ArrowRight') emblaApi.scrollNext();
            if (e.key === 'ArrowLeft') emblaApi.scrollPrev();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [emblaApi]);

    return (
        <section
            className="relative w-full h-[50vh] overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            aria-roledescription="carousel"
        >
            <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex h-full">
                    {bannerSlides.map((slide, index) => (
                        <div className="relative flex-[0_0_100%] h-full" key={index}>
                            <img src={slide.image} loading="lazy" className="absolute inset-0 w-full h-full object-fill" alt={`Banner ${index + 1}`} />
                        </div>
                    ))}
                </div>
            </div>
            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
                {bannerSlides.map((_, index) => (
                    <button key={index} onClick={() => scrollTo(index)} className={`w-3 h-3 rounded-full transition-all ${selectedIndex === index ? 'bg-white scale-125' : 'bg-white/50'}`} aria-label={`Go to slide ${index + 1}`}></button>
                ))}
            </div>
        </section>
    );
};
export default BannerCarousel;