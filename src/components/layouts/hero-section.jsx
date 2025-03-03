import { ModalVideo } from '@/components/ui/modal-video';
import VideoThumb from '@/assets/hero-image.png';

export function HeroSection() {
  return (
    <section className="relative">
      {/* Illustration behind hero content */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none -z-10"
        aria-hidden="true"
      >
        <svg width="1360" height="578" viewBox="0 0 1360 578" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="illustration-01">
              <stop stopColor="#FFF" offset="0%" />
              <stop stopColor="#EAEAEA" offset="77.402%" />
              <stop stopColor="#DFDFDF" offset="100%" />
            </linearGradient>
          </defs>
          <g fill="url(#illustration-01)" fillRule="evenodd">
            <circle cx="1232" cy="128" r="128" />
            <circle cx="155" cy="443" r="64" />
          </g>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero content */}
        <div className="pt-16 pb-12 md:pt-24 md:pb-20">
          {/* Section header */}
          <div className="text-center pb-12 md:pb-16">
            <h1
              className="text-4xl md:text-5xl font-extrabold leading-tighter tracking-tighter mb-4"
              data-aos="zoom-y-out"
            >
              Optimise the compliance management of your processes with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-sidebar-accent">STATUS</span>
            </h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-muted-foreground mb-8" data-aos="zoom-y-out" data-aos-delay="150">
                Find out how to manage the compliance of your business processes effectively.
              </p>
            </div>
          </div>

          {/* Hero image */}
          <ModalVideo
            thumb={VideoThumb}
            thumbWidth={1024}
            thumbHeight={576}
            thumbAlt="Modal video thumbnail"
            videoUrl="https://www.youtube.com/embed/JZkFzZzz-qg"
          />
        </div>
      </div>
    </section>
  );
}

