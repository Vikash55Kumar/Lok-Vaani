'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, UserCheck, Plus, Minus } from 'lucide-react';

import ParliamentImg from "../../assets/parliament.png";
import MatterImg from "../../assets/matter.png";

import BannerCarousel from '../../components/ui/BannerCarousel';
import NewsTicker from '../../components/ui/NewsTicker';
import HowItWorksCurve from '../../components/ui/Works';
import PlatformFeature from '../../components/ui/PlatformFeature';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What is Lok Vaani?",
      answer: "Lok Vaani is an advanced AI platform designed to transform public comments into actionable insights for the Ministry of Corporate Affairs."
    },
    {
      question: "How does Lok Vaani ensure data privacy and security?",
      answer: "We adhere to the highest standards of data protection, including encryption and compliance with the Digital Personal Data Protection Act (DPDPA)."
    },
    {
      question: "Which Indian languages does the platform support?",
      answer: "The platform supports multiple Indian languages, offering real-time translation and sentiment analysis for broader inclusivity."
    },
    {
      question: "How can my department integrate with Lok Vaani?",
      answer: "Integration is streamlined through our API and dedicated support team, ensuring seamless adoption into your existing workflows."
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col pb-8">
      
        <BannerCarousel />
        <NewsTicker />
            
        {/* Hero Section */}
        <motion.div 
          className="w-full relative rounded-none overflow-hidden shadow-xl mb-8 bg-blue-50 flex flex-col md:flex-row items-center"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Text Content - Left Side */}
          <div className="w-full md:w-1/2 p-10 z-10 md:pl-20 flex flex-col justify-center items-start">
            <h1 className="text-slate-900 text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Lok Vaani: Transforming Public Comments into Actionable Insights</h1>
            <h2 className="text-slate-600 text-lg font-medium mb-8 max-w-xl leading-relaxed">An advanced AI platform for e-governance, Lok Vaani empowers the Ministry of Corporate Affairs by converting public feedback into meaningful data for informed decision-making.</h2>
            <button onClick={() => navigate('/drafts')} className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 text-lg">Explore Dashboard</button>
          </div>

          {/* Image - Right Side */}
          <div className="w-full md:w-1/2 relative h-[400px] md:h-[500px]">
             {/* Fading effect overlay */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-blue-50 to-transparent z-10" />
            <img 
              src={ParliamentImg} 
              alt="LokVaani Hero" 
              className="w-full h-full object-cover object-center" 
            />
          </div>
        </motion.div>

      <div className="w-full max-w-7xl mx-auto px-2 flex flex-col gap-10 pt-8">

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.3 }}
        >
          <PlatformFeature />
        </motion.div>
      </div>

        {/* Why It Matters Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="w-full mt-20"
        >
          <div className="bg-blue-50 rounded-none shadow-xl overflow-hidden flex flex-col md:flex-row">
            {/* Text Side */}
            <div className="w-full md:w-1/2 p-2 md:p-6 md:pl-20 flex flex-col justify-center">
              <h2 className="text-slate-900 text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                Why It Matters: <br/>
                <span className="text-blue-700">Enhancing Public Participation and Governance</span>
              </h2>
              <p className="text-slate-600 text-lg font-medium mb-6 max-w-xl leading-relaxed">
                LokVaani empowers government agencies to make more informed decisions by providing a clear and comprehensive understanding of public feedback. By analyzing comments effectively, agencies can ensure that policies and initiatives are aligned with the needs and concerns of their constituents, leading to greater public trust and engagement.
              </p>
            </div>

            {/* Image Side */}
            <div className="w-full md:w-1/2 relative min-h-[350px] md:min-h-full">
               {/* Gradient Overlay for smooth fading */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-blue-50 to-transparent z-10"></div>
              <img 
                src={MatterImg} 
                alt="Why It Matters" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>

      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col gap-10 pt-8">

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <HowItWorksCurve />
        </motion.div>


        {/* Security & Compliance Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mt-4 mb-12"
        >
          <div className="text-center mb-12 max-w-3xl mx-auto">
             <h2 className="text-slate-900 text-3xl font-bold mb-4 tracking-tight">Security & Compliance</h2>
             <p className="text-slate-600 text-lg leading-relaxed">
               Lok Vaani is built on a foundation of trust and security. We are committed to protecting data integrity and user privacy in adherence with the highest standards of government and data protection regulations.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group relative flex flex-col items-center text-center p-8  bg-white border-t-4 border-[#2563eb] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white text-blue-600 ring-4 ring-blue-50 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Lock size={40} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-black mb-3">Data Encryption</h3>
              <p className="text-sm font-medium leading-relaxed text-slate-600 px-2">
                All data, both in transit and at rest, is encrypted using industry-standard protocols to prevent unauthorized access and ensure confidentiality.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group relative flex flex-col items-center text-center p-8  bg-white border-t-4 border-[#2563eb] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white text-blue-600 ring-4 ring-blue-50 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <ShieldCheck size={40} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-black mb-3">Regulatory Adherence</h3>
              <p className="text-sm font-medium leading-relaxed text-slate-600 px-2">
                Our platform complies with India's Digital Personal Data Protection Act (DPDPA) and other relevant government data handling guidelines.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group relative flex flex-col items-center text-center p-8  bg-white border-t-4 border-[#2563eb] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white text-blue-600 ring-4 ring-blue-50 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <UserCheck size={40} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-black mb-3">Access Control</h3>
              <p className="text-sm font-medium leading-relaxed text-slate-600 px-2">
                Strict, role-based access controls are enforced to ensure that data is only accessible to authorized personnel for legitimate purposes.
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mt-16 mb-20"
        >
          <div className="text-center mb-12 max-w-3xl mx-auto">
             <h2 className="text-slate-900 text-3xl font-bold mb-4 tracking-tight">Frequently Asked Questions</h2>
             <p className="text-slate-600 text-lg leading-relaxed">
               Find answers to common questions about Lok Vaani's features, data privacy, and implementation.
             </p>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="border border-slate-200  bg-slate-50 overflow-hidden transition-all duration-300"
              >
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className="text-slate-900 font-bold text-lg">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <Minus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-5 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 mt-2">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default HomePage;