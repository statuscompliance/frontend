import { ModalVideo } from '@/components/ui/modal-video';
import VideoThumb from '@/assets/hero-image.png';

export function HeroSection() {
  return (
    <section className="relative">
      {/* Illustration behind hero content */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 transform -z-10 -translate-x-1/2"
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

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-12 pt-16 md:pb-20 md:pt-24">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-16">
            <h1
              className="mb-4 text-4xl font-extrabold tracking-tighter md:text-5xl"
              data-aos="zoom-y-out"
            >
              Optimise the compliance management of your processes with{' '}
              <span className="from-green-700 to-sidebar-accent bg-gradient-to-r bg-clip-text text-transparent">STATUS</span>
            </h1>
            <div className="mx-auto max-w-3xl">
              <p className="mb-8 text-xl text-muted-foreground" data-aos="zoom-y-out" data-aos-delay="150">
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

