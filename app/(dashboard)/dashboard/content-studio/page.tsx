'use client';

import { motion } from 'framer-motion';
import { Sparkles, PenLine } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentGeneratorForm } from '@/components/modules/content-studio/content-generator-form';
import { ContentHistoryPanel } from '@/components/modules/content-studio/content-history-panel';

export default function ContentStudioPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Content Studio</h1>
        <p className="text-sm text-muted-foreground">
          Generate captions, ad copy, emails, blogs, and more — tuned to your brand voice.
        </p>
      </motion.div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <PenLine className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4">
          <ContentGeneratorForm />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <ContentHistoryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
