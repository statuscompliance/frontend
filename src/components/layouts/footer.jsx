import logo from '@/assets/status.svg';
import Github from '@/assets/github.svg';

export function Footer() {
  return (
    <footer className="bg-background/65 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Top area: Blocks */}
        <div className="grid sm:grid-cols-12 gap-8 py-8 md:py-12 border-t border-gray-200">

          {/* 1st block */}
          <div className="sm:col-span-12 lg:col-span-3">
            <div className="mb-2">
              <img src={logo} className="h-14 w-14" alt="Status logo" />
            </div>
          </div>

          {/* 2nd block */}
          <div className="sm:col-span-6 sm:col-start-7 md:col-span-3 lg:col-span-2 lg:col-start-11 text-left">
            <h6 className="text-primary font-medium mb-2">Featured</h6>
            <ul className="text-sm">
              <li className="mb-2">
                <a href="#0" className="text-primary/80 hover:text-primary transition duration-150 ease-in-out">STATUS</a>
              </li>
              <li className="mb-2">
                <a href="https://status-docs.netlify.app" className="text-primary/80 hover:text-primary transition duration-150 ease-in-out">Documentation</a>
              </li>
              <li className="mb-2">
                <a href="https://www.apache.org/licenses/LICENSE-2.0" className="text-primary/80 hover:text-primary transition duration-150 ease-in-out">License</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom area */}
        <div className="md:flex md:items-center md:justify-between py-4 md:py-8 border-t border-gray-200">

          {/* Social links */}
          <ul className="flex mb-4 md:order-1 md:ml-4 md:mb-0">
            <li className="ml-4">
              <a href="https://github.com/statuscompliance" className="flex justify-center items-center text-primary/80 hover:text-primary bg-secondary/25 hover:bg-primary/15 rounded-full shadow transition duration-150 ease-in-out p-2" aria-label="Github">
                <img src={Github} className="w-5 h-5" alt="Github" />
              </a>
            </li>
          </ul>

          {/* Copyrights note */}
          <div className="text-sm text-primary/80 mr-4">&copy; University of Seville. All rights reserved.</div>

        </div>

      </div>
    </footer>
  );
}
