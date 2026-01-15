import { Instagram, Facebook } from 'lucide-react';

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
    >
      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
    </svg>
  );

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Voluntarios Digitales. Todos los derechos reservados.</p>
            <p className="text-xs text-gray-500">Uniendo generaciones a través de la tecnología.</p>
          </div>
          <div className="flex space-x-4">
            <a href="https://www.instagram.com/puntovuelacuevasdelbecerro/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-300">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="https://www.facebook.com/guadalinfocuevas/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-300">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="https://www.tiktok.com/@puntovuelacuevas" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-300">
                <TikTokIcon className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;