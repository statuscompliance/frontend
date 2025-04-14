import logo from '@/assets/status.svg';
import Github from '@/assets/github.svg';

export function Footer() {
  return (
    <footer className="mt-auto bg-background/65">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Top area: Blocks */}
        <div className="grid gap-8 border-t border-gray-200 py-8 sm:grid-cols-12 md:py-12">

          {/* 1st block */}
          <div className="lg:col-span-3 sm:col-span-12">
            <div className="mb-2">
              <img src={logo} className="h-14 w-14" alt="Status logo" />
            </div>
          </div>

          {/* 2nd block */}
          <div className="text-left lg:col-span-2 md:col-span-3 sm:col-span-6 lg:col-start-11 sm:col-start-7">
            <h6 className="mb-2 text-primary font-medium">Featured</h6>
            <ul className="text-sm">
              <li className="mb-2">
                <a href="#0" className="text-primary/80 transition duration-150 ease-in-out hover:text-primary">STATUS</a>
              </li>
              <li className="mb-2">
                <a href="https://status-docs.netlify.app" className="text-primary/80 transition duration-150 ease-in-out hover:text-primary">Documentation</a>
              </li>
              <li className="mb-2">
                <a href="https://www.apache.org/licenses/LICENSE-2.0" className="text-primary/80 transition duration-150 ease-in-out hover:text-primary">License</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom area */}
        <div className="border-t border-gray-200 py-4 md:flex md:items-center md:justify-between md:py-8">

          {/* Social links */}
          <ul className="mb-4 flex md:order-1 md:mb-0 md:ml-4">
            <li className="ml-4">
              <a href="https://github.com/statuscompliance" className="flex items-center justify-center rounded-full bg-secondary/25 p-2 text-primary/80 shadow transition duration-150 ease-in-out hover:bg-primary/15 hover:text-primary" aria-label="Github">
                <img src={Github} className="h-5 w-5" alt="Github" />
              </a>
            </li>
          </ul>

          {/* Copyrights note */}
          <div className="mr-4 text-sm text-primary/80">&copy; University of Seville. All rights reserved.</div>

        </div>

      </div>
    </footer>
  );
}
