import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FeaturesBg1 from '@/assets/features-bg-1.png';
import FeaturesBg2 from '@/assets/features-bg-2.png';
import FeaturesBg3 from '@/assets/features-bg-3.png';

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState('iso');
  const tabsRef = useRef(null);

  const heightFix = () => {
    if (tabsRef.current && tabsRef.current.parentElement) {
      tabsRef.current.parentElement.style.height = `${tabsRef.current.clientHeight}px`;
    }
  };

  useEffect(() => {
    heightFix();
  }, [activeTab]);

  return (
    <div className="bg-background">
      <section className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="py-12 md:py-20">
            <div className="max-w-3xl mx-auto text-center pb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Try our beta version now!
              </h2>
              <p className="text-xl text-muted-foreground">
                Get early access to our latest features and improvements.
              </p>
              <Button asChild className="mt-8" variant="destructive">
                <a href="https://status-docs.netlify.app/docs/Getting-started/installation">
                  Get Started
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 border-2 border-muted mb-16 rounded-xl">
          <div className="py-10 md:pt-20">
            {/* Section header */}
            <div className="max-w-2xl mx-auto text-center pb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Know some of the use cases
              </h1>
            </div>

            {/* Section content */}
            <div className="md:grid md:grid-cols-12 md:gap-6">
              {/* Content */}
              <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6 md:mt-6">
                <div className="md:pr-4 lg:pr-12 xl:pr-16 mb-8">
                  <h3 className="text-2xl font-bold mb-3">
                    Measure compliance in your company quickly and easily
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    With STATUS you can easily measure your company&apos;s compliance with
                    standards, norms and policies through dashboards that measure compliance.
                  </p>
                </div>

                {/* Custom tab buttons */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="mb-8 md:mb-0 space-y-3">
                    <button
                      onClick={() => setActiveTab('iso')}
                      className={cn(
                        'flex items-center text-md p-5 rounded border transition duration-300 ease-in-out w-full text-left max-h-44',
                        activeTab === 'iso'
                          ? 'bg-muted border-transparent'
                          : 'bg-background shadow-md border-border hover:shadow-lg'
                      )}
                    >
                      <div>
                        <div className="font-bold leading-snug tracking-tight mb-1">
                          ISO Standards
                        </div>
                        <div className="text-muted-foreground">
                          Monitor your organisation&apos;s compliance with ISO standards,
                          simplifying internal auditing, certification and quality management
                          processes, ensuring that all areas comply with established international
                          standards.
                        </div>
                      </div>
                      <div className="flex justify-center items-center w-8 h-8 bg-background rounded-full shadow flex-shrink-0 ml-3">
                        <svg
                          className="w-3 h-3 fill-current"
                          viewBox="0 0 12 12"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M11.953 4.29a.5.5 0 00-.454-.292H6.14L6.984.62A.5.5 0 006.12.173l-6 7a.5.5 0 00.379.825h5.359l-.844 3.38a.5.5 0 00.864.445l6-7a.5.5 0 00.075-.534z" />
                        </svg>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('gdpr')}
                      className={cn(
                        'flex items-center text-md p-5 rounded border transition duration-300 ease-in-out w-full text-left max-h-44',
                        activeTab === 'gdpr'
                          ? 'bg-muted border-transparent'
                          : 'bg-background shadow-md border-border hover:shadow-lg'
                      )}
                    >
                      <div>
                        <div className="font-bold leading-snug tracking-tight mb-1">
                          GDPR and LOPD
                        </div>
                        <div className="text-muted-foreground">
                          Monitor your company&apos;s compliance with data protection laws and rules,
                          simplifying GDPR audits and ensuring the protection of your customers&apos;
                          and employees&apos; personal information, minimising the risk of sanctions and
                          improving user confidence.
                        </div>
                      </div>
                      <div className="flex justify-center items-center w-8 h-8 bg-background rounded-full shadow flex-shrink-0 ml-3">
                        <svg
                          className="w-3 h-3 fill-current"
                          viewBox="0 0 12 12"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11.854.146a.5.5 0 00-.525-.116l-11 4a.5.5 0 00-.015.934l4.8 1.921 1.921 4.8A.5.5 0 007.5 12h.008a.5.5 0 00.462-.329l4-11a.5.5 0 00-.116-.525z"
                            fillRule="nonzero"
                          />
                        </svg>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('cmmi')}
                      className={cn(
                        'flex items-center text-md p-5 rounded border transition duration-300 ease-in-out w-full text-left max-h-44',
                        activeTab === 'cmmi'
                          ? 'bg-muted border-transparent'
                          : 'bg-background shadow-md border-border hover:shadow-lg'
                      )}
                    >
                      <div>
                        <div className="font-bold leading-snug tracking-tight mb-1">
                          CMMI and project management methodologies
                        </div>
                        <div className="text-muted-foreground">
                          Controls and evaluates compliance with standards and methodologies in your
                          organisation&apos;s processes, improving the efficiency and quality of projects,
                          optimising resources and facilitating the maturity of processes to achieve
                          strategic objectives.
                        </div>
                      </div>
                      <div className="flex justify-center items-center w-8 h-8 bg-background rounded-full shadow flex-shrink-0 ml-3">
                        <svg
                          className="w-3 h-3 fill-current"
                          viewBox="0 0 12 12"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11.334 8.06a.5.5 0 00-.421-.237 6.023 6.023 0 01-5.905-6c0-.41.042-.82.125-1.221a.5.5 0 00-.614-.586 6 6 0 106.832 8.529.5.5 0 00-.017-.485z"
                            fill="#191919"
                            fillRule="nonzero"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>

                  {/* Tab content */}
                  <TabsContent value="iso" className="hidden">
                    ISO content
                  </TabsContent>
                  <TabsContent value="gdpr" className="hidden">
                    GDPR content
                  </TabsContent>
                  <TabsContent value="cmmi" className="hidden">
                    CMMI content
                  </TabsContent>
                </Tabs>
              </div>

              {/* Tabs items */}
              <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:order-1 flex items-center">
                <div className="transition-all">
                  <div className="relative flex flex-col text-center lg:text-right" ref={tabsRef}>
                    {/* Image for ISO tab */}
                    <div
                      className={cn(
                        'w-full transition-all duration-700 transform',
                        activeTab === 'iso'
                          ? 'opacity-100 translate-y-0 order-first'
                          : 'opacity-0 absolute -translate-y-16'
                      )}
                    >
                      <div className="relative inline-flex flex-col">
                        <img
                          className="md:max-w-none mx-auto rounded border border-black shadow-xl shadow-gray-400"
                          src={FeaturesBg1 || '/placeholder.svg?height=462&width=500'}
                          width="500"
                          height="462"
                          alt="ISO Standards features"
                        />
                      </div>
                    </div>

                    {/* Image for GDPR tab */}
                    <div
                      className={cn(
                        'w-full transition-all duration-700 transform',
                        activeTab === 'gdpr'
                          ? 'opacity-100 translate-y-0 order-first'
                          : 'opacity-0 absolute -translate-y-16'
                      )}
                    >
                      <div className="relative inline-flex flex-col">
                        <img
                          className="md:max-w-none mx-auto rounded border border-black shadow-xl shadow-gray-400"
                          src={FeaturesBg2 || '/placeholder.svg?height=462&width=500'}
                          width="500"
                          height="462"
                          alt="GDPR features"
                        />
                      </div>
                    </div>

                    {/* Image for CMMI tab */}
                    <div
                      className={cn(
                        'w-full transition-all duration-700 transform',
                        activeTab === 'cmmi'
                          ? 'opacity-100 translate-y-0 order-first'
                          : 'opacity-0 absolute -translate-y-16'
                      )}
                    >
                      <div className="relative inline-flex flex-col">
                        <img
                          className="md:max-w-none mx-auto rounded border border-black shadow-xl shadow-gray-400"
                          src={FeaturesBg3 || '/placeholder.svg?height=462&width=500'}
                          width="500"
                          height="462"
                          alt="CMMI features"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
