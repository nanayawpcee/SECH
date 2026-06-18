"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Traditional West African Nutrition",
    description:
      "Discover how traditional fonio grain helps manage diabetes naturally.",
    image:
      "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&q=80",
  },
  {
    title: "The Power of Fonio",
    description: "Ancient grain, modern solution for blood sugar management.",
    image:
      "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=800&q=80",
  },
  {
    title: "Healthcare Partnership",
    description:
      "Join a network of professionals transforming diabetes care in Ghana.",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  },
  {
    title: "Measurable Impact",
    description:
      "Track patient progress and earn rewards for positive health outcomes.",
    image:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
  },
  {
    title: "Community Wellness",
    description:
      "Empowering communities through nutrition education and support.",
    image:
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80",
  },
];

export function WhatWeDo() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-3 sm:mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-primary">
              WHAT WE DO
            </span>
          </motion.div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-balance px-2">
            Empowering Professionals to Lead
            <br className="hidden sm:inline" /> the Future of Diabetes Care
          </h2>
        </motion.div>

        {/* Slider */}
        <motion.div
          className="relative max-w-5xl mx-auto overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Slides Container */}
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <div className="relative aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9]">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10">
                    <AnimatePresence mode="wait">
                      {currentSlide === index && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4 }}
                        >
                          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-1.5 sm:mb-2 md:mb-3">
                            {slide.title}
                          </h3>
                          <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-xl">
                            {slide.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Indicators */}
          <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 right-3 sm:right-4 md:right-6 flex items-center gap-1.5 sm:gap-2">
            {slides.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "h-1 sm:h-1.5 rounded-full transition-all duration-300",
                  currentSlide === index
                    ? "w-6 sm:w-8 bg-white"
                    : "w-1 sm:w-1.5 bg-white/50 hover:bg-white/70",
                )}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
