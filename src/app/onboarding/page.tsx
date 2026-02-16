
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Loader, ArrowLeft, Search, Building, Globe, UserCheck, Landmark, TrainFront, Shield, Siren, GraduationCap, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const examData = {
  "categories": {
    "central": {
      "ssc": { name: "SSC Exams", icon: UserCheck, exams: ["SSC CGL", "SSC CHSL", "SSC GD Constable", "SSC MTS", "SSC CPO", "SSC JE", "SSC Stenographer"] },
      "banking": { name: "Banking Exams", icon: Landmark, exams: ["IBPS PO", "IBPS Clerk", "IBPS RRB", "SBI PO", "SBI Clerk", "RBI Assistant", "RBI Grade B"] },
      "railway": { name: "Railways (RRB)", icon: TrainFront, exams: ["Railway NTPC", "Railway Group D", "Railway JE", "Railway ALP", "Railway Technician"] },
      "defence": { name: "Defence Exams", icon: Shield, exams: ["NDA", "CDS", "AFCAT", "Agniveer Vayu (Airforce)", "Agniveer SSR/MR (Navy)", "Agniveer Army"] },
      "police": { name: "Police/Paramilitary", icon: Siren, exams: ["CAPF (AC)", "BSF Tradesman", "CRPF Constable", "CISF Constable", "ITBP Constable"] },
      "teaching": { name: "Teaching Exams", icon: GraduationCap, exams: ["CTET", "KVS Teacher", "NVS Teacher", "State TET"] },
      "others": { name: "UPSC & Others", icon: FileText, exams: ["UPSC Civil Services (IAS)", "UPSC EPFO", "UPSC ESIC", "ISRO Assistant", "DRDO MTS", "LIC AAO", "FCI Manager"] },
    },
    "states": [
      {
        "state": "Bihar",
        "exams": ["BPSC", "BSSC (Inter Level)", "Bihar Police/Daroga", "Bihar Teacher (TRE)", "Nagar Nigam Exams", "Bihar STET/BTET"]
      },
      { "state": "Uttar Pradesh", "exams": ["UPPSC", "UPSSSC (PET)", "UP Police Constable/SI", "UP Lekhpal", "Nagar Palika Parishad", "UP Super TET"] },
      { "state": "Jharkhand", "exams": ["JPSC", "JSSC (CGL)", "Jharkhand Police", "Municipal Service (JMSCCE)", "JTET"] },
      { "state": "Madhya Pradesh", "exams": ["MPPSC", "MP PEB (Vyapam)", "MP Police", "Patwari", "Nagar Nigam Bharti", "MP TET (Varg 1, 2, 3)"] },
      { "state": "Rajasthan", "exams": ["RAS", "REET", "Rajasthan Police", "Patwari", "LDC", "CET"] },
      { "state": "West Bengal", "exams": ["WBCS", "WB Police", "WBPSC Clerkship", "Municipal Service Commission"] },
      { "state": "Maharashtra", "exams": ["MPSC", "Maharashtra Police", "Talathee", "BMC (Nagar Nigam)"] },
      { "state": "Gujarat", "exams": ["GPSC", "GSSSB", "Gujarat Police", "Talati"] },
      { "state": "Haryana", "exams": ["HPSC", "HSSC (Group C & D)", "Haryana Police", "CET"] },
      { "state": "Punjab", "exams": ["PPSC", "PSSSB", "Punjab Police", "Patwari"] },
      { "state": "Uttarakhand", "exams": ["UKPSC", "UKSSSC", "Uttarakhand Police", "Patwari"] },
      { "state": "Himachal Pradesh", "exams": ["HPPSC", "HPSSC", "HP Police", "Patwari"] },
      { "state": "Chhattisgarh", "exams": ["CGPSC", "CG Vyapam", "CG Police", "Nagar Nigam"] },
      { "state": "Delhi", "exams": ["DSSSB (Teaching & Non-Teaching)"] },
      { "state": "Odisha", "exams": ["OPSC", "OSSSC", "OSSC", "Odisha Police"] },
      { "state": "Andhra Pradesh", "exams": ["APPSC", "AP Police", "Gram Sachivalayam"] },
      { "state": "Telangana", "exams": ["TSPSC", "Telangana Police", "VRO"] },
      { "state": "Karnataka", "exams": ["KPSC", "KSP (Police)", "KPTCL"] },
      { "state": "Tamil Nadu", "exams": ["TNPSC", "TNUSRB (Police)", "TNEB"] },
      { "state": "Kerala", "exams": ["Kerala PSC", "Kerala Police", "KSEB"] },
      { "state": "Assam", "exams": ["APSC", "Assam Police", "SLRC"] },
      { "state": "Sikkim", "exams": ["SPSC", "Sikkim Police"] },
      { "state": "Arunachal Pradesh", "exams": ["APPSC", "APSSB"] },
      { "state": "Nagaland", "exams": ["NPSC", "NSSB"] },
      { "state": "Manipur", "exams": ["MPSC", "Manipur Police"] },
      { "state": "Mizoram", "exams": ["MPSC", "Mizoram Police"] },
      { "state": "Tripura", "exams": ["TPSC", "Tripura Police"] },
      { "state": "Meghalaya", "exams": ["MPSC", "Meghalaya Police"] },
      { "state": "Goa", "exams": ["Goa PSC", "Goa Police"] },
      { "state": "Jammu & Kashmir", "exams": ["JKPSC", "JKSSB", "J&K Police"] }
    ]
  }
};

const allStates = examData.categories.states.map(s => s.state);

const OnboardingStep = ({ title, description, children, onBack, showBack, isSearchable, searchQuery, setSearchQuery }: { 
    title: string, 
    description: string, 
    children: React.ReactNode, 
    onBack?: () => void, 
    showBack?: boolean,
    isSearchable?: boolean,
    searchQuery?: string,
    setSearchQuery?: (query: string) => void
}) => (
    <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="w-full relative"
    >
        {showBack && onBack && (
            <Button variant="ghost" onClick={onBack} className="absolute -top-12 left-0 text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        )}
        <Card className="glass card-3d">
            <CardHeader className="text-center pb-4">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {isSearchable && setSearchQuery && (
                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search states..."
                            className="pl-12 h-12"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-1">
                    {children}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const SelectionButton = ({ label, onClick, disabled }: {label: string, onClick: () => void, disabled?: boolean}) => (
    <Button variant="outline" className="h-16 text-base justify-start p-4 items-center" onClick={onClick} disabled={disabled}>
        <div className="flex justify-between items-center w-full">
            <span className="truncate">{label}</span>
            {disabled ? <Loader className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />}
        </div>
    </Button>
);

const SelectionCard = ({ title, icon: Icon, onClick, isDisabled }: {title: string, icon: React.ElementType, onClick: () => void, isDisabled?: boolean}) => (
    <motion.div
      whileHover={!isDisabled ? { y: -8, scale: 1.05, boxShadow: '0 0 25px hsl(var(--primary))' } : {}}
      className={`glass card-3d p-6 flex flex-col items-center justify-center text-center h-48 group ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={!isDisabled ? onClick : undefined}
    >
        <div className="p-4 bg-primary/10 rounded-full mb-3 transition-colors group-hover:bg-primary/20">
            <Icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
    </motion.div>
);


export default function OnboardingPage() {
  const [step, setStep] = useState<'category' | 'centralSubCategory' | 'state' | 'exam'>('category');
  const [selections, setSelections] = useState({
    category: '',
    subCategory: '',
    state: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  const handleCategorySelect = (category: string) => {
    setSelections({ category, subCategory: '', state: '' });
    if (category === 'State Exams') {
      setStep('state');
    } else if (category === 'Central Exams') {
      setStep('centralSubCategory');
    }
  }

  const handleCentralSubCategorySelect = (subCategoryKey: string) => {
    setSelections(prev => ({ ...prev, subCategory: subCategoryKey }));
    setStep('exam');
  };

  const handleStateSelect = (state: string) => {
    setSelections(prev => ({ ...prev, state }));
    setStep('exam');
  };
  
  const handleExamSelect = (exam: string) => {
    setIsLoading(true);
    const finalSelections = {
        category: selections.category,
        state: selections.state,
        subCategory: selections.subCategory.toUpperCase(), // e.g., 'SSC', 'BANKING'
        exam: exam, // e.g., 'SSC CGL', 'IBPS PO'
    };

    try {
        localStorage.setItem('sonilearn-onboarding-selections', JSON.stringify(finalSelections));
        router.push('/profile-setup');
    } catch (error) {
        console.error("Failed to save to localStorage or redirect:", error);
        toast.error("Could not proceed. Please try again.");
        setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (isLoading) return;
    if (step === 'exam') {
        setStep(selections.category === 'Central Exams' ? 'centralSubCategory' : 'state');
    } else if (step === 'centralSubCategory' || step === 'state') {
        setStep('category');
    }
  };

  if (authLoading || !user) {
      return (
           <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Verifying session...</p>
            </div>
      );
  }

  const filteredStates = allStates.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderContent = () => {
    switch (step) {
      case 'category':
        return (
            <OnboardingStep
                title="What are you preparing for?"
                description="Select a category to see relevant exams."
            >
                <SelectionCard title="Central Exams" icon={Globe} onClick={() => handleCategorySelect('Central Exams')} />
                <SelectionCard title="State Exams" icon={Building} onClick={() => handleCategorySelect('State Exams')} />
            </OnboardingStep>
        );

      case 'centralSubCategory':
        return (
          <OnboardingStep
            title="Select Exam Category"
            description="Choose the type of central government exam."
            onBack={handleBack}
            showBack
          >
             {Object.entries(examData.categories.central).map(([key, value]) => (
                <SelectionButton key={key} label={value.name} onClick={() => handleCentralSubCategorySelect(key)} />
             ))}
          </OnboardingStep>
        );

      case 'state':
        return (
          <OnboardingStep 
            title="Select Your State" 
            description="This helps us personalize exam content for you."
            isSearchable
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onBack={handleBack}
            showBack
          >
             {filteredStates.map(s => <SelectionButton key={s} label={s} onClick={() => handleStateSelect(s)} />)}
          </OnboardingStep>
        );

      case 'exam':
        let items: string[] = [];
        let examTitle = "Select Your Exam";

        if (selections.category === 'Central Exams' && selections.subCategory) {
            const subCatData = examData.categories.central[selections.subCategory as keyof typeof examData.categories.central];
            items = subCatData?.exams || [];
            examTitle = `Select a ${subCatData?.name || 'Exam'}`;
        } else if (selections.category === 'State Exams' && selections.state) {
            items = examData.categories.states.find(s => s.state === selections.state)?.exams || [];
            examTitle = `Select Exam in ${selections.state}`;
        }
        
        return (
          <OnboardingStep 
            title={examTitle}
            description="Finally, select your specific exam goal."
            onBack={handleBack}
            showBack
          >
            {items && items.length > 0 ? (
                items.map((item: string) => (
                    <SelectionButton key={item} label={item} onClick={() => handleExamSelect(item)} disabled={isLoading} />
                ))
            ) : (
                 <p className="text-muted-foreground text-center md:col-span-2 p-4">No exams found for this category. Please go back.</p>
            )}
          </OnboardingStep>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-3xl w-full">
            <div className="text-center mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl font-bold tracking-tight">
                    Welcome to <span className="text-primary">SoniLearn</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-muted-foreground mt-2">
                    Just a few steps to set up your personalized learning path.
                </motion.p>
            </div>
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
        </div>
    </div>
  );
}
