import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export function ModalVideo({ thumb, thumbWidth, thumbHeight, thumbAlt, videoUrl }) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef(null);

  return (
    <div>
      <div
        className="relative flex justify-center mb-8"
        data-aos="zoom-y-out"
        data-aos-delay="450"
      >
        <div className="flex flex-col justify-center">
          <img
            src={thumb || "/placeholder.svg"}
            width={thumbWidth}
            height={thumbHeight}
            alt={thumbAlt}
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            {/* TODO: Check why group class is not recognized */}
            <Button
              variant="outline"
              className="absolute top-full flex items-center transform -translate-y-1/2 bg-background rounded-full font-medium group p-4 shadow-lg"
            >
              <Play className="w-6 h-6 text-muted-foreground group-hover:text-primary shrink-0" />
              <span className="ml-3">Check a demo of our prototype (4 min)</span>
            </Button>
          </DialogTrigger>

          <DialogContent
            className="sm:max-w-4xl p-0 bg-black overflow-hidden"
            onInteractOutside={() => setOpen(false)}
          >
            <div className="aspect-video w-full">
              <iframe
                ref={videoRef}
                width="100%"
                height="100%"
                src={videoUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                title="Video demo"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
