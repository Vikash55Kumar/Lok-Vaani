import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Feature1 from "../../assets/feature1.png";
import Feature2 from "../../assets/feature2.png";
import Feature3 from "../../assets/feature3.png";
import Feature4 from "../../assets/feature4.png";
import Feature5 from "../../assets/feature5.png";
import Feature6 from "../../assets/feature6.png";
import Logo from "../../assets/logo.png";

const PlatformFeature: React.FC = () => {
  const [feature1Open, setFeature1Open] = useState(false);
  const [feature2Open, setFeature2Open] = useState(false);
  const [feature3Open, setFeature3Open] = useState(false);
  const [feature4Open, setFeature4Open] = useState(false);
  const [feature5Open, setFeature5Open] = useState(false);
  const [feature6Open, setFeature6Open] = useState(false);

  return (
    <div className="w-full relative overflow-hidden min-h-screen flex items-center justify-center">
      
      {/* Curvy Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ filter: "drop-shadow(0 0 3px rgba(59, 130, 246, 1))" }}>
        {/* Top Left */}
        <motion.path
          d="M 50 50 C 40 50, 40 15, 35 15"
          stroke="#3b82f6"
          fill="none"
          initial={{ pathLength: 0, opacity: 0, strokeWidth: 0.2 }}
          whileInView={{ pathLength: 1, opacity: 1, strokeWidth: [0.2, 0.4, 0.2] }}
          viewport={{ once: true }}
          transition={{ 
            pathLength: { duration: 0.6 },
            opacity: { duration: 0.6 },
            strokeWidth: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        {/* Mid Left */}
        <motion.path
          d="M 50 50 C 40 50, 40 50, 28 50"
          stroke="#3b82f6"
          fill="none"
          initial={{ pathLength: 0, opacity: 0, strokeWidth: 0.2 }}
          whileInView={{ pathLength: 1, opacity: 1, strokeWidth: [0.2, 0.4, 0.2] }}
          viewport={{ once: true }}
          transition={{ 
            pathLength: { duration: 0.6, delay: 0.05 },
            opacity: { duration: 0.6, delay: 0.05 },
            strokeWidth: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.05 }
          }}
        />
        {/* Bot Left */}
        <motion.path
          d="M 50 50 C 40 50, 40 85, 35 85"
          stroke="#3b82f6"
          fill="none"
          initial={{ pathLength: 0, opacity: 0, strokeWidth: 0.2 }}
          whileInView={{ pathLength: 1, opacity: 1, strokeWidth: [0.2, 0.4, 0.2] }}
          viewport={{ once: true }}
          transition={{ 
            pathLength: { duration: 0.6, delay: 0.1 },
            opacity: { duration: 0.6, delay: 0.1 },
            strokeWidth: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }
          }}
        />
        {/* Top Right */}
        <motion.path
          d="M 50 50 C 60 50, 60 15, 65 15"
          stroke="#3b82f6"
          fill="none"
          initial={{ pathLength: 0, opacity: 0, strokeWidth: 0.2 }}
          whileInView={{ pathLength: 1, opacity: 1, strokeWidth: [0.2, 0.4, 0.2] }}
          viewport={{ once: true }}
          transition={{ 
            pathLength: { duration: 0.6, delay: 0.15 },
            opacity: { duration: 0.6, delay: 0.15 },
            strokeWidth: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.15 }
          }}
        />
        {/* Mid Right */}
        <motion.path
          d="M 50 50 C 60 50, 60 50, 72 50"
          stroke="#3b82f6"
          fill="none"
          initial={{ pathLength: 0, opacity: 0, strokeWidth: 0.2 }}
          whileInView={{ pathLength: 1, opacity: 1, strokeWidth: [0.2, 0.4, 0.2] }}
          viewport={{ once: true }}
          transition={{ 
            pathLength: { duration: 0.6, delay: 0.2 },
            opacity: { duration: 0.6, delay: 0.2 },
            strokeWidth: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
          }}
        />
        {/* Bot Right */}
        <motion.path
          d="M 50 50 C 60 50, 60 85, 65 85"
          stroke="#3b82f6"
          fill="none"
          initial={{ pathLength: 0, opacity: 0, strokeWidth: 0.2 }}
          whileInView={{ pathLength: 1, opacity: 1, strokeWidth: [0.2, 0.4, 0.2] }}
          viewport={{ once: true }}
          transition={{ 
            pathLength: { duration: 0.6, delay: 0.25 },
            opacity: { duration: 0.6, delay: 0.25 },
            strokeWidth: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.25 }
          }}
        />
      </svg>

      {/* Center Logo Node */}
      <motion.div
        className="w-40 h-40 bg-white rounded-full shadow-2xl flex items-center justify-center p-6 border-[6px] border-blue-50 relative z-10"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        animate={{ y: [0, -10, 0] }}
        transition={{ 
          scale: { type: "spring", stiffness: 260, damping: 20 },
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <div className="absolute inset-0 rounded-full border border-blue-100 animate-pulse"></div>
        <img src={Logo} alt="Lok Vaani" className="w-full h-full object-contain relative z-10" />
      </motion.div>

      {/* Feature 1 Content */}
      <motion.div
        className="absolute z-20 max-w-lg text-right pr-4"
        style={{ top: '5%', right: '75%', transform: 'translate(0, -50%)' }}
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <h3 className="text-lg font-bold text-gray-800">Bilingual Support</h3>
        <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">Analytics</span>
        
        <AnimatePresence>
          {feature1Open && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 text-sm text-gray-600 overflow-hidden"
            >
              Analyze comments in English and Hindi languages with interactive language selection and translation features.
            </motion.p>
          )}
        </AnimatePresence>
        
        <div 
          className="flex items-center justify-end mt-2 text-blue-500 cursor-pointer hover:text-blue-700"
          onClick={() => setFeature1Open(!feature1Open)}
        >
            <span className="text-sm font-medium">{feature1Open ? 'Show less' : 'Learn more'}</span>
            <svg className={`w-4 h-4 ml-1 transform transition-transform ${feature1Open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </motion.div>

      {/* Feature 2 Content */}
      <motion.div
        className="absolute z-20 max-w-lg text-right pr-4"
        style={{ top: '40%', right: '75%', transform: 'translate(0, -50%)' }}
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <h3 className="text-lg font-bold text-gray-800">Weighted Sentiment Analysis</h3>
        <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">Speech Bubbles</span>
        
        <AnimatePresence>
          {feature2Open && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 text-sm text-gray-600 overflow-hidden"
            >
              Prioritize feedback based on influence and impact, visualized with dynamic weight indicators.
            </motion.p>
          )}
        </AnimatePresence>
        
        <div 
          className="flex items-center justify-end mt-2 text-blue-500 cursor-pointer hover:text-blue-700"
          onClick={() => setFeature2Open(!feature2Open)}
        >
            <span className="text-sm font-medium">{feature2Open ? 'Show less' : 'Learn more'}</span>
            <svg className={`w-4 h-4 ml-1 transform transition-transform ${feature2Open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </motion.div>

      {/* Feature 3 Content */}
      <motion.div
        className="absolute z-20 max-w-lg text-right pr-4"
        style={{ top: '75%', right: '75%', transform: 'translate(0, -50%)' }}
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h3 className="text-lg font-bold text-gray-800">Live Sentiment Graphs</h3>
        <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">Visualization</span>
        
        <AnimatePresence>
          {feature3Open && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 text-sm text-gray-600 overflow-hidden"
            >
              Visualize real-time sentiment trends with interactive charts and graphs.
            </motion.p>
          )}
        </AnimatePresence>
        
        <div 
          className="flex items-center justify-end mt-2 text-blue-500 cursor-pointer hover:text-blue-700"
          onClick={() => setFeature3Open(!feature3Open)}
        >
            <span className="text-sm font-medium">{feature3Open ? 'Show less' : 'Learn more'}</span>
            <svg className={`w-4 h-4 ml-1 transform transition-transform ${feature3Open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </motion.div>

      {/* Feature 4 Content */}
      <motion.div
        className="absolute z-20 max-w-lg text-left pl-4"
        style={{ top: '5%', left: '77%', transform: 'translate(0, -50%)' }}
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        <h3 className="text-lg font-bold text-gray-800">AI-Powered Highlights</h3>
        <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">AI</span>
        
        <AnimatePresence>
          {feature4Open && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 text-sm text-gray-600 overflow-hidden"
            >
              Automatically surface the most impactful comments and feedback using AI.
            </motion.p>
          )}
        </AnimatePresence>
        
        <div 
          className="flex items-center justify-start mt-2 text-blue-500 cursor-pointer hover:text-blue-700"
          onClick={() => setFeature4Open(!feature4Open)}
        >
            <span className="text-sm font-medium">{feature4Open ? 'Show less' : 'Learn more'}</span>
            <svg className={`w-4 h-4 ml-1 transform transition-transform ${feature4Open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </motion.div>

      {/* Feature 5 Content */}
      <motion.div
        className="absolute z-20 max-w-lg text-left pl-4"
        style={{ top: '40%', left: '77%', transform: 'translate(0, -50%)' }}
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <h3 className="text-lg font-bold text-gray-800">Comprehensive Reports</h3>
        <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">Reporting</span>
        
        <AnimatePresence>
          {feature5Open && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 text-sm text-gray-600 overflow-hidden"
            >
              Generate detailed reports and summaries for policy makers.
            </motion.p>
          )}
        </AnimatePresence>
        
        <div 
          className="flex items-center justify-start mt-2 text-blue-500 cursor-pointer hover:text-blue-700"
          onClick={() => setFeature5Open(!feature5Open)}
        >
            <span className="text-sm font-medium">{feature5Open ? 'Show less' : 'Learn more'}</span>
            <svg className={`w-4 h-4 ml-1 transform transition-transform ${feature5Open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </motion.div>

      {/* Feature 6 Content */}
      <motion.div
        className="absolute z-20 max-w-lg text-left pl-4"
        style={{ top: '75%', left: '77%', transform: 'translate(0, -50%)' }}
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.65 }}
      >
        <h3 className="text-lg font-bold text-gray-800">Easy Export</h3>
        <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">Export</span>
        
        <AnimatePresence>
          {feature6Open && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 text-sm text-gray-600 overflow-hidden"
            >
              Export insights and data in multiple formats for further analysis.
            </motion.p>
          )}
        </AnimatePresence>
        
        <div 
          className="flex items-center justify-start mt-2 text-blue-500 cursor-pointer hover:text-blue-700"
          onClick={() => setFeature6Open(!feature6Open)}
        >
            <span className="text-sm font-medium">{feature6Open ? 'Show less' : 'Learn more'}</span>
            <svg className={`w-4 h-4 ml-1 transform transition-transform ${feature6Open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </motion.div>

      {/* Feature 1 - Top Left */}
      <motion.div
        className="absolute w-40 h-24 bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 z-10"
        style={{ top: '5%', left: '25%', transform: 'translate(0, -50%)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <img src={Feature1} alt="Multilingual Support" className="w-full h-full object-cover" />
      </motion.div>

      {/* Feature 2 - Mid Left */}
      <motion.div
        className="absolute w-40 h-24 bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 z-10"
        style={{ top: '40%', left: '25%', transform: 'translate(0, -50%)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <img src={Feature2} alt="Feature 2" className="w-full h-full object-cover" />
      </motion.div>

      {/* Feature 3 - Bot Left */}
      <motion.div
        className="absolute w-40 h-24 bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 z-10"
        style={{ top: '75%', left: '25%', transform: 'translate(0, -50%)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <img src={Feature3} alt="Feature 3" className="w-full h-full object-cover" />
      </motion.div>

      {/* Feature 4 - Top Right */}
      <motion.div
        className="absolute w-40 h-24 bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 z-10"
        style={{ top: '5%', left: '64%', transform: 'translate(-100%, -50%)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <img src={Feature4} alt="Feature 4" className="w-full h-full object-cover" />
      </motion.div>

      {/* Feature 5 - Mid Right */}
      <motion.div
        className="absolute w-40 h-24 bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 z-10"
        style={{ top: '40%', left: '64%', transform: 'translate(-100%, -50%)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <img src={Feature5} alt="Feature 5" className="w-full h-full object-cover" />
      </motion.div>

      {/* Feature 6 - Bot Right */}
      <motion.div
        className="absolute w-40 h-24 bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 z-10"
        style={{ top: '75%', left: '64%', transform: 'translate(-100%, -50%)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        <img src={Feature6} alt="Feature 6" className="w-full h-full object-cover" />
      </motion.div>

    </div>
  );
};

export default PlatformFeature;