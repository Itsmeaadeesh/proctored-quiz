import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-redhat-black text-white py-8 border-t-2 border-redhat-red mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Dual Logos side by side */}
          <div className="flex items-center space-x-6">
            <div className="bg-white p-1.5 rounded-xs">
              <img
                src="/assets/redhat-logo.png"
                alt="Red Hat"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div className="h-6 w-px bg-neutral-700"></div>
            <div className="bg-white p-1.5 rounded-xs">
              <img
                src="/assets/ggits-logo.png"
                alt="Gyan Ganga Institute of Technology and Sciences"
                className="h-7 w-auto object-contain"
              />
            </div>
          </div>

          {/* Center: Event Branding */}
          <div className="text-center md:text-left">
            <div className="text-sm font-bold tracking-wider text-white uppercase">
              RHA DAY 26 &bull; Red Hat Academy Challenge
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Gyan Ganga Institute of Technology & Sciences (GGITS), Jabalpur (M.P.)
            </div>
          </div>

          {/* Right: Security & Integrity Disclaimer */}
          <div className="text-center md:text-right text-xs text-neutral-400 max-w-sm">
            <span className="text-redhat-red font-semibold">Strict Proctoring Enabled:</span>{' '}
            Browser activity, fullscreen integrity, and live snapshots are logged under Red Hat Academy guidelines.
          </div>

        </div>

        <div className="border-t border-neutral-800 mt-6 pt-4 text-center text-[11px] text-neutral-500">
          &copy; {new Date().getFullYear()} Gyan Ganga Institute of Technology & Sciences. Red Hat, the Red Hat logo, and Shadowman are trademarks of Red Hat, Inc., registered in the U.S. and other countries.
        </div>
      </div>
    </footer>
  );
};
