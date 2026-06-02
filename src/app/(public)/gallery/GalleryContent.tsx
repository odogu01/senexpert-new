'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const categories = [
  { id: 'events', label: 'Events' },
  { id: 'trainings', label: 'Trainings' },
  { id: 'safety-meeting', label: 'Safety Meeting' },
  { id: 'celebrations', label: 'Celebrations' },
  { id: 'operations', label: 'Operations' },
  { id: 'community-service', label: 'Community Service' },
];

const galleryImages = [
  { id: 1, src: '/Events1.png', alt: 'Event Image 1', category: 'events' },
  { id: 2, src: '/Events2.png', alt: 'Event Image 2', category: 'events' },
  { id: 3, src: '/Events3.png', alt: 'Event Image 3', category: 'events' },
  { id: 4, src: '/Trainings1.jpeg', alt: 'Training Image 1', category: 'trainings' },
  { id: 5, src: '/Trainings2.jpeg', alt: 'Training Image 2', category: 'trainings' },
  { id: 6, src: '/Trainings3.jpeg', alt: 'Training Image 3', category: 'trainings' },
  { id: 7, src: '/Trainings4.jpeg', alt: 'Training Image 4', category: 'trainings' },
  { id: 8, src: '/Trainings5.jpeg', alt: 'Training Image 5', category: 'trainings' },
  { id: 9, src: '/Trainings6.jpeg', alt: 'Training Image 6', category: 'trainings' },
  { id: 10, src: '/Trainings7.jpeg', alt: 'Training Image 7', category: 'trainings' },
  { id: 11, src: '/Trainings8.jpeg', alt: 'Training Image 8', category: 'trainings' },
  { id: 12, src: '/Trainings9.jpeg', alt: 'Training Image 9', category: 'trainings' },
  { id: 13, src: '/Safety Meeting1.jpeg', alt: 'Safety Meeting Image 1', category: 'safety-meeting' },
  { id: 14, src: '/Safety Meeting2.jpeg', alt: 'Safety Meeting Image 2', category: 'safety-meeting' },
  { id: 15, src: '/Safety Meeting3.jpeg', alt: 'Safety Meeting Image 3', category: 'safety-meeting' },
  { id: 16, src: '/Safety Meeting4.jpeg', alt: 'Safety Meeting Image 4', category: 'safety-meeting' },
  { id: 17, src: '/Safety Meeting5.jpeg', alt: 'Safety Meeting Image 5', category: 'safety-meeting' },
  { id: 18, src: '/Safety Meeting6.jpeg', alt: 'Safety Meeting Image 6', category: 'safety-meeting' },
  { id: 19, src: '/Celebrations1.jpeg', alt: 'Celebration Image 1', category: 'celebrations' },
  { id: 20, src: '/Celebrations2.jpeg', alt: 'Celebration Image 2', category: 'celebrations' },
  { id: 21, src: '/Celebrations3.jpeg', alt: 'Celebration Image 3', category: 'celebrations' },
  { id: 22, src: '/Celebrations4.jpeg', alt: 'Celebration Image 4', category: 'celebrations' },
  { id: 23, src: '/Celebrations5.jpeg', alt: 'Celebration Image 5', category: 'celebrations' },
  { id: 24, src: '/Celebrations6.jpeg', alt: 'Celebration Image 6', category: 'celebrations' },
  { id: 25, src: '/Celebrations7.jpeg', alt: 'Celebration Image 7', category: 'celebrations' },
  { id: 26, src: '/Celebrations8.jpeg', alt: 'Celebration Image 8', category: 'celebrations' },
  { id: 27, src: '/Celebrations9.jpeg', alt: 'Celebration Image 9', category: 'celebrations' },
  { id: 28, src: '/Celebrations10.jpeg', alt: 'Celebration Image 10', category: 'celebrations' },
  { id: 29, src: '/Celebrations11.jpeg', alt: 'Celebration Image 11', category: 'celebrations' },
  { id: 30, src: '/Celebrations12.jpeg', alt: 'Celebration Image 12', category: 'celebrations' },
  { id: 31, src: '/Operations1.png', alt: 'Operation Image 1', category: 'operations' },
  { id: 32, src: '/Operations2.png', alt: 'Operation Image 2', category: 'operations' },
  { id: 33, src: '/Operations3.png', alt: 'Operation Image 3', category: 'operations' },
  { id: 34, src: '/Operations4.jpeg', alt: 'Operation Image 4', category: 'operations' },
  { id: 35, src: '/Operations5.png', alt: 'Operation Image 5', category: 'operations' },
  { id: 36, src: '/Operations6.png', alt: 'Operation Image 6', category: 'operations' },
  { id: 37, src: '/Operations7.png', alt: 'Operation Image 7', category: 'operations' },
  { id: 38, src: '/Operations8.png', alt: 'Operation Image 8', category: 'operations' },
  { id: 39, src: '/Operations9.png', alt: 'Operation Image 9', category: 'operations' },
  { id: 40, src: '/Operations10.jpeg', alt: 'Operation Image 10', category: 'operations' },
  { id: 41, src: '/Operations11.jpeg', alt: 'Operation Image 11', category: 'operations' },
  { id: 42, src: '/Operations12.jpeg', alt: 'Operation Image 12', category: 'operations' },
  { id: 43, src: '/Operations13.jpeg', alt: 'Operation Image 13', category: 'operations' },
  { id: 44, src: '/Operations14.jpeg', alt: 'Operation Image 14', category: 'operations' },
  { id: 45, src: '/Operations15.jpeg', alt: 'Operation Image 15', category: 'operations' },
  { id: 46, src: '/Operations16.jpeg', alt: 'Operation Image 16', category: 'operations' },
  { id: 47, src: '/Community Service1.jpeg', alt: 'Community Service Image 1', category: 'community-service' },
  { id: 48, src: '/Community Service2.jpeg', alt: 'Community Service Image 2', category: 'community-service' },
  { id: 49, src: '/Community Service3.jpeg', alt: 'Community Service Image 3', category: 'community-service' },
  { id: 50, src: '/Community Service4.jpeg', alt: 'Community Service Image 4', category: 'community-service' },
  { id: 51, src: '/Community Service5.jpeg', alt: 'Community Service Image 5', category: 'community-service' },
];

export default function GalleryContent() {
  const [selectedCategory, setSelectedCategory] = useState('events');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const filteredImages = galleryImages.filter(img => img.category === selectedCategory);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = 'unset';
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === 0 ? filteredImages.length - 1 : selectedImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === filteredImages.length - 1 ? 0 : selectedImageIndex + 1);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary-light to-primary" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        </div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-6">
            <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent rounded-full text-sm font-semibold">Our Work</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">Project <span className="text-accent">Gallery</span></h1>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/80 leading-relaxed">Explore our portfolio of completed projects and operations across the oil and gas industry.</p>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-8 bg-white border-b border-[#F3F3F3] sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredImages.length > 0 ? (
                filteredImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    <img src={image.src} alt={image.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="text-white font-medium text-sm">View Image</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <p className="text-gray-500 text-lg">No images in this category yet.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && filteredImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); goToPrevious(); }} className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <span className="text-white font-medium">{selectedImageIndex + 1} / {filteredImages.length}</span>
            </div>
            <motion.div
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl max-h-[80vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={filteredImages[selectedImageIndex].src} alt={filteredImages[selectedImageIndex].alt} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
