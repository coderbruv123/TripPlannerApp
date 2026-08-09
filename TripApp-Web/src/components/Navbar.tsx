import { ChevronDown, Bell, Globe } from "lucide-react";
 
export default function Navbar() {
  return (
    <header className="w-full border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <a href="#" className="flex items-center gap-1.5">
            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500" />
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              .fis
            </span>
          </a>
 
          <button className="hidden items-center gap-1 text-sm text-slate-600 hover:text-slate-900 sm:flex">
            Travelers
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
 
        {/* Right side */}
        <nav className="flex items-center gap-5">
        
 
          <button className="hidden text-slate-500 hover:text-slate-900 md:block">
            <Globe className="h-4 w-4" />
          </button>

 
          <button className="relative text-slate-500 hover:text-slate-900">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-indigo-600" />
          </button>
 
          <img
            src="https://i.pravatar.cc/64?img=12"
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
          />
        </nav>
      </div>
    </header>
  );
}
 
