import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  AlertTriangle,
  Settings,
  CheckCircle,
  Users,
  Shield,
  TrendingUp,
  Globe,
  PieChart
} from 'lucide-react';

const About: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-8">
      
      {/* Hero Section */}
      <motion.div 
        className="w-full relative rounded-none overflow-hidden shadow-xl mb-12 bg-blue-50 flex flex-col items-center py-20"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full max-w-5xl mx-auto px-6 flex flex-col justify-center items-center text-center z-10">
          <h1 className="text-slate-900 text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            About Lok Vaani
          </h1>
          <div className="w-24 h-1 bg-blue-600 mb-8 rounded-full"></div>
          <h2 className="text-slate-600 text-xl md:text-2xl font-medium max-w-3xl leading-relaxed">
            Revolutionizing democratic governance through AI-powered public consultation analysis.
          </h2>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
      </motion.div>

      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col gap-16">
        
        {/* Introduction */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div className="p-4 bg-blue-50 rounded-full text-blue-600">
              <FileText size={40} strokeWidth={1.5} />
            </div>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-slate-900 mb-6">Introduction</motion.h2>
          <motion.p variants={itemVariants} className="text-lg text-slate-600 leading-relaxed">
            Lok Vaani is an AI-powered e-consultation analysis platform designed to transform how government agencies 
            process and analyze public feedback on policy drafts and legislative proposals. By leveraging advanced 
            natural language processing and machine learning algorithms, Lok Vaani automates the analysis of citizen 
            comments, enabling policymakers to make informed, data-driven decisions that truly reflect public sentiment 
            and concerns.
          </motion.p>
        </motion.section>

        {/* Problem Statement */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="bg-slate-50  p-8 md:p-12 border border-slate-100 shadow-sm"
        >
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="w-full md:w-1/3 flex flex-col items-center md:items-start">
              <div className="p-4 bg-red-50  text-red-600 mb-6 inline-block">
                <AlertTriangle size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">The Challenge</h2>
              <p className="text-slate-600 text-lg">
                Traditional methods of analyzing public comments on draft legislations face significant hurdles.
              </p>
            </div>
            <div className="w-full md:w-2/3 grid gap-6">
              {[
                { title: "Manual Review Burden", desc: "Thousands of public comments require extensive manual review, consuming valuable time and resources." },
                { title: "Inherent Human Bias", desc: "Manual analysis is susceptible to reviewer bias, potentially skewing the interpretation of public sentiment." },
                { title: "Lost Citizen Concerns", desc: "Important stakeholder concerns and minority opinions often get overlooked in the overwhelming volume." },
                { title: "Inconsistent Analysis", desc: "Different reviewers may interpret similar feedback differently, resulting in inconsistent analysis standards." }
              ].map((item, idx) => (
                <motion.div key={idx} variants={itemVariants} className="bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Our Solution */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-green-50 rounded-full text-green-600 mb-4">
              <Settings size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Our Solution</h2>
            <p className="text-slate-600 mt-4 max-w-2xl mx-auto text-lg">
              Lok Vaani addresses these challenges through comprehensive AI-driven analysis capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <TrendingUp />, title: "AI Sentiment Analysis", desc: "Categorize comments by sentiment (positive, negative, neutral) with 95%+ accuracy." },
              { icon: <Globe />, title: "Multilingual Support", desc: "Native processing for Hindi and English, ensuring comprehensive analysis across linguistic backgrounds." },
              { icon: <Users />, title: "Stakeholder Classification", desc: "Intelligent categorization of feedback sources to provide demographic insights." },
              { icon: <PieChart />, title: "Real-time Dashboard", desc: "Interactive visualization providing live analytics, trends, and impact assessments." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                className="bg-white p-8 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="mb-6 p-4 bg-blue-50 text-blue-600 rounded-full">
                  {React.cloneElement(feature.icon as React.ReactElement<any>, { size: 32, strokeWidth: 1.5 })}
                </div>
                <h3 className="font-bold text-slate-900 mb-3 text-lg">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Key Benefits */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-8"
        >
          <div className="bg-white border-t-4 border-blue-600 shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">For Policymakers</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Objective, data-driven policy insights free from bias",
                "90% reduction in analysis time from weeks to hours",
                "Comprehensive demographic breakdown of public opinion",
                "Early identification of controversial policy areas",
                "Automated generation of detailed consultation reports",
                "Enhanced transparency in democratic decision-making"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border-t-4 border-teal-500 shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">For Citizens</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Guaranteed review and analysis of every submitted comment",
                "Equal weightage to feedback regardless of language",
                "Transparent tracking of how public input influences policy",
                "Faster policy consultation cycles enabling more engagement",
                "Increased confidence in government responsiveness",
                "More inclusive participation in democratic governance"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Target Users */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Who We Serve</h2>
            <p className="text-slate-600 text-lg">Lok Vaani is designed to serve various stakeholders in the democratic consultation process.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Policy Development Teams", desc: "Ministry officials responsible for drafting and refining policy proposals based on public feedback." },
              { title: "Senior Decision-Makers", desc: "Ministers and department heads requiring comprehensive public sentiment analysis for policy approval." },
              { title: "Compliance Officers", desc: "Personnel ensuring consultation processes meet legal requirements and democratic standards." },
              { title: "Citizens & Civil Society", desc: "Individual citizens, NGOs, and advocacy groups participating in public consultations." },
              { title: "Business Community", desc: "Private sector organizations providing feedback on policies affecting business operations." },
              { title: "Research Institutions", desc: "Academic and policy research organizations analyzing public policy consultation effectiveness." }
            ].map((user, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="bg-slate-50 p-6 border border-slate-200 hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <h3 className="font-bold text-slate-900 mb-2 text-lg">{user.title}</h3>
                <p className="text-slate-600 text-sm">{user.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

      </div>

      {/* Mission */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 p-12 text-center shadow-xl mt-16"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
        <p className="text-xl text-blue-100 leading-relaxed max-w-3xl mx-auto font-medium">
          "Strengthening democratic governance by transforming citizen feedback into actionable insights."
        </p>
      </motion.section>
    </div>
  );
};

export default About;