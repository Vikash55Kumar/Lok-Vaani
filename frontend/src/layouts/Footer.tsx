import React from 'react';
import { Github, Twitter, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1a2234] text-slate-300 py-12 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Section */}
          <div className="col-span-1">
            <h3 className="text-white text-2xl font-bold mb-2">Lok Vaani</h3>
            <p className="text-slate-400 text-sm">E-Consultation Analysis</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-base mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="/drafts" className="hover:text-white transition-colors">Drafts</a></li>
              <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Related Portals */}
          <div>
            <h4 className="text-white font-semibold text-base mb-6">Related Portals</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">MCA Official</a></li>
              <li><a href="#" className="hover:text-white transition-colors">India.gov.in</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Digital India</a></li>
              <li><a href="#" className="hover:text-white transition-colors">RTI Portal</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Citizen Services</a></li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div>
            <h4 className="text-white font-semibold text-base mb-6">Connect With Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="mb-4 md:mb-0">
            <p className="text-slate-400">
              © 2025 Ministry of Corporate Affairs, Government of India
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Copyright Policy</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Disclaimer</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
