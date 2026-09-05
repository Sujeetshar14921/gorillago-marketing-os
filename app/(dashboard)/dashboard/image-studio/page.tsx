'use client';

import { motion } from 'framer-motion';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageGeneratorForm } from '@/components/modules/image-studio/image-generator-form';
import { ImageGalleryGrid } from '@/components/modules/image-studio/image-gallery-grid';

export default function ImageStudioPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Image Studio</h1>
        <p className="text-sm text-muted-foreground">
          Generate banners, carousels, stories, posters, and lifestyle mockups — auto-sized for every platform.
        </p>
      </motion.div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4">
          <ImageGeneratorForm />
        </TabsContent>
        <TabsContent value="gallery" className="mt-4">
          <ImageGalleryGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
}
