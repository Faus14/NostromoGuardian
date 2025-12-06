import { BookOpen, Code, Github, MessageCircle } from 'lucide-react';

export function Footer() {
  const links = [
    { name: 'Docs', icon: BookOpen, href: '#' },
    { name: 'API', icon: Code, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' },
    { name: 'Discord', icon: MessageCircle, href: '#' }
  ];

  return (
    <footer className="border-t border-white/10 bg-[#0B0F16]/80 backdrop-blur-xl mt-12">
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Branding */}
          <div className="text-center md:text-left">
            <p className="text-white/60 text-sm">
              Built for <span className="text-[#00F5FF]">Qubic Hack the Future 2025</span>
            </p>
            <p className="text-white/40 text-xs mt-1">
              Advanced token analytics for the Qubic ecosystem
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
                >
                  <Icon className="w-4 h-4 text-white/60 group-hover:text-[#00F5FF] transition-colors" />
                  <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                    {link.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-white/40 text-xs">
            © 2025 Nostromo Guardian. Empowering transparency in the Qubic ecosystem.
          </p>
        </div>
      </div>
    </footer>
  );
}
