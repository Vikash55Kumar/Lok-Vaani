import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const Pricing = () => {
  const plans = [
    {
      name: 'Basic Plan',
      price: '₹999',
      period: '/month',
      description: 'For students, analysts, and small practitioners.',
      features: [
        '5 draft analyses/month',
        'Standard sentiment analysis',
        'Basic summaries',
        'Word cloud visualization',
        'English-only processing',
        'Limited PDF export',
        'Basic trend analysis'
      ],
      popular: false,
      borderColor: 'border-blue-200',
      headerColor: 'bg-blue-50',
      buttonStyle: 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
    },
    {
      name: 'Pro Plan',
      price: '₹4,999',
      period: '/month',
      description: 'For law firms, consultants, and professionals.',
      features: [
        'Unlimited draft analysis',
        'Full bilingual support (English & Hindi)',
        'Category & clause-level insights',
        'Stakeholder sentiment weighting',
        'Detailed summaries',
        'Real-time updates',
        'PDF, CSV, XLSX exports',
        'Alerts for spam/duplicates/negativity spikes'
      ],
      popular: true,
      borderColor: 'border-[#0846AA]',
      headerColor: 'bg-[#0846AA]',
      buttonStyle: 'bg-[#0846AA] text-white hover:bg-blue-800 shadow-lg'
    },
    {
      name: 'Enterprise Plan',
      price: '₹25,000–₹45,000',
      period: '/month',
      description: 'For corporates, and government partners.',
      features: [
        'Everything in Pro',
        'Priority alerts',
        'API access',
        'User role management',
        'Audit logs & data retention',
        'On-premise/on-cloud deployment',
        'Dedicated support',
        'SLA-backed uptime'
      ],
      popular: false,
      borderColor: 'border-slate-200',
      headerColor: 'bg-slate-900',
      buttonStyle: 'bg-slate-900 text-white hover:bg-slate-800'
    }
  ];

  return (
    <div className="bg-white font-sans relative min-h-screen w-full">    
      <div className="py-4">
        <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-4 mt-1">
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Subscription Services
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-7xl mx-auto mb-12">
                {plans.map((plan, index) => (
                <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative flex flex-col bg-white shadow-xl overflow-hidden border ${plan.borderColor} ${
                    plan.popular ? 'transform scale-105 z-10 ring-1 ring-[#0846AA]' : ''
                    }`}
                >
                    <div className={`p-8 ${plan.popular ? 'bg-[#0846AA]' : plan.headerColor}`}>
                        <h3 className={`text-xl font-semibold ${plan.popular || plan.name === 'Enterprise Plan' ? 'text-white' : 'text-gray-900'}`}>
                            {plan.name}
                        </h3>
                        <p className={`mt-2 text-sm ${plan.popular || plan.name === 'Enterprise Plan' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {plan.description}
                        </p>
                        <div className="mt-6 flex items-baseline">
                            <span className={`${plan.name === 'Enterprise Plan' ? 'text-3xl' : 'text-3xl'} font-extrabold tracking-tight ${plan.popular || plan.name === 'Enterprise Plan' ? 'text-white' : 'text-gray-900'}`}>
                            {plan.price}
                            </span>
                            <span className={`ml-1 text-xl font-semibold ${plan.popular || plan.name === 'Enterprise Plan' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {plan.period}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between p-8 bg-white">
                        <ul className="space-y-4 mb-8">
                            {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start">
                                <div className="flex-shrink-0">
                                <Check className={`h-5 w-5 ${plan.popular ? 'text-[#0846AA]' : 'text-green-500'}`} />
                                </div>
                                <p className="ml-3 text-sm text-gray-700">
                                {feature}
                                </p>
                            </li>
                            ))}
                        </ul>
                        
                        <button
                            className={`w-full flex items-center justify-center px-5 py-3 text-base font-medium transition-all duration-200 ${plan.buttonStyle}`}
                        >
                            Get Started
                        </button>
                    </div>
                </motion.div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;