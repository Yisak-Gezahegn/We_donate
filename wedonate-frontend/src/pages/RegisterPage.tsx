import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Phone, Lock, Eye, EyeOff, ChevronRight, Building2, MapPin, FileText, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import ImageUpload from '../components/ui/ImageUpload';

type OrgType = 'NGO' | 'GOVERNMENTAL' | 'RELIGIOUS' | 'PRIVATE_CHARITY';

const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: 'NGO', label: 'NGO' },
  { value: 'GOVERNMENTAL', label: 'Governmental' },
  { value: 'RELIGIOUS', label: 'Religious' },
  { value: 'PRIVATE_CHARITY', label: 'Private Charity' },
];

const WORDS = ['Community', 'Hope', 'Generosity', 'Together', 'Impact', 'Care'];

function FloatingWord({ word, delay }: { word: string; delay: number }) {
  return (
    <motion.span
      className="absolute text-white/[0.04] font-extrabold pointer-events-none select-none whitespace-nowrap"
      style={{ fontSize: `${12 + Math.random() * 24}px`, left: `${Math.random() * 80}%`, top: `${Math.random() * 90}%` }}
      animate={{ y: [0, -40, 0], opacity: [0.04, 0.09, 0.04], rotate: [-4, 4, -4] }}
      transition={{ duration: 10 + Math.random() * 6, repeat: Infinity, delay, ease: 'easeInOut' }}
    >{word}</motion.span>
  );
}

const FEATURES = [
  { icon: '🎯', title: 'Direct Impact', desc: 'Help real people in Adama' },
  { icon: '📊', title: 'Full Transparency', desc: 'Track every birr donated' },
  { icon: '🤝', title: 'Trusted Platform', desc: 'Verified organizations only' },
];

export default function RegisterPage() {
  const { isDark } = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get('from') || '/dashboard';

  const [isOrg, setIsOrg] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrgType>('NGO');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registrationDocUrl, setRegistrationDocUrl] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');

  const input = cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors',
    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900');
  const label = cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOrg && (!firstName || !lastName || !email || !password)) return toast.error('Fill all fields');
    if (isOrg && (!orgName || !licenseNumber || !officeAddress || !email || !password)) return toast.error('Fill all required fields');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (isOrg && !agreed) return toast.error('You must certify the organization info');
    if (isOrg && !registrationDocUrl) return toast.error('Please upload registration certificate');

    setLoading(true);
    try {
      const payload: any = { firstName, lastName, email, phone, password };
      if (isOrg) {
        payload.accountType = 'organization';
        payload.orgName = orgName;
        payload.orgType = orgType;
        payload.licenseNumber = licenseNumber;
        payload.registrationDocUrl = registrationDocUrl;
        payload.officeAddress = officeAddress;
      }
      await register(payload);
      toast.success(isOrg ? 'Registration submitted! Pending admin verification.' : 'Account created!');
      navigate(isOrg ? '/login' : redirectTo);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('min-h-screen flex transition-colors duration-300', isDark ? 'bg-slate-900' : 'bg-white')}>

      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col">
        <img src="/Adama_city2.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/92 via-green-900/85 to-green-700/70" />
        <div className="absolute inset-0 overflow-hidden">
          {WORDS.map((w, i) => <FloatingWord key={w} word={w} delay={i * 0.7} />)}
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-12 gap-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }} className="text-center">
            <img src="/adama_logo.png" alt="Logo"
              className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-2xl border-4 border-white/30 object-cover" />
            <h2 className="text-3xl font-extrabold text-white">Join WeDonate</h2>
            <p className="text-white/70 mt-2">One account. Endless ways to help.</p>
          </motion.div>
          <div className="w-full max-w-xs space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3">
                <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center text-lg shrink-0">{f.icon}</div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-white/60 text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 sm:px-8 py-10 overflow-y-auto">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }} className="w-full max-w-lg">

          <Link to="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-green-300 shadow">
              <img src="/adama_logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={cn('font-extrabold text-xl', isDark ? 'text-green-400' : 'text-green-800')}>
              We<span className="text-amber-500">Donate</span>
            </span>
          </Link>

          <Link to="/" className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors group',
            isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-700',
          )}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <h1 className={cn('text-3xl font-extrabold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
            {isOrg ? 'Register Organization' : 'Create Your Account'}
          </h1>
          <p className={cn('mb-8 text-sm', isDark ? 'text-slate-400' : 'text-gray-500')}>
            {isOrg ? 'Submit your organization details for verification' : 'Join WeDonate and start making a difference'}
          </p>

          {/* ── Account Type Toggle ── */}
          <div className={cn('flex rounded-xl p-1 mb-5 border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200')}>
            <button type="button" onClick={() => setIsOrg(false)}
              className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                !isOrg ? 'bg-green-600 text-white shadow-md' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'))}>
              Individual
            </button>
            <button type="button" onClick={() => setIsOrg(true)}
              className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5',
                isOrg ? 'bg-green-600 text-white shadow-md' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'))}>
              <Building2 className="w-4 h-4" />
              Organization
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>First Name *</label>
                <input className={input} placeholder="Abebe"
                  value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className={label}>Last Name *</label>
                <input className={input} placeholder="Kebede"
                  value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={label}>{isOrg ? "Official Email *" : "Email *"}</label>
              <div className="relative">
                <Mail className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-gray-400')} />
                <input type="email" className={cn(input, 'pl-10')} placeholder={isOrg ? "org@example.com" : "you@example.com"}
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={label}>Phone (optional)</label>
              <div className="relative">
                <Phone className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-gray-400')} />
                <input className={cn(input, 'pl-10')} placeholder="+251 911 234 567"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>

            {/* ── Organization Fields ── */}
            <AnimatePresence>
              {isOrg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className={cn('rounded-2xl border p-5 space-y-4 mt-2',
                    isDark ? 'border-slate-600 bg-slate-700/30' : 'border-green-200 bg-green-50')}>

                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className={cn('w-5 h-5', isDark ? 'text-green-400' : 'text-green-600')} />
                      <h3 className={cn('text-sm font-bold', isDark ? 'text-green-400' : 'text-green-700')}>
                        Organization Details
                      </h3>
                    </div>

                    <div>
                      <label className={label}>Organization Name *</label>
                      <input className={input} placeholder="e.g. Adama Charity Foundation"
                        value={orgName} onChange={e => setOrgName(e.target.value)} />
                    </div>

                    <div>
                      <label className={label}>Organization Type *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ORG_TYPES.map(ot => (
                          <button key={ot.value} type="button" onClick={() => setOrgType(ot.value)}
                            className={cn('p-2.5 rounded-xl text-xs font-semibold text-left transition-all border',
                              orgType === ot.value
                                ? 'bg-green-600 text-white border-green-600'
                                : (isDark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-green-500' : 'bg-white border-gray-200 text-gray-700 hover:border-green-500'))}>
                            {ot.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={label}>License / Registration Number *</label>
                      <div className="relative">
                        <FileText className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <input className={cn(input, 'pl-10')} placeholder="e.g. 1234/2024"
                          value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className={label}>Registration Certificate *</label>
                      <ImageUpload
                        label=""
                        value={registrationDocUrl}
                        onChange={setRegistrationDocUrl}
                        hint="Upload PDF or image of your registration certificate"
                        accept=".pdf,image/*"
                      />
                    </div>

                    <div>
                      <label className={label}>Office Address *</label>
                      <div className="relative">
                        <MapPin className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <input className={cn(input, 'pl-10')} placeholder="Sub-city, Kebele"
                          value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} />
                      </div>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <div onClick={() => setAgreed(!agreed)}
                        className={cn('w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5',
                          agreed ? 'bg-green-600 border-green-600' : (isDark ? 'border-slate-500' : 'border-gray-300'))}>
                        {agreed && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={cn('text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-gray-600')}>
                        I certify that this organization is legally registered in Ethiopia and all provided information is accurate.
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div>
              <label className={label}>Password *</label>
              <div className="relative">
                <Lock className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-gray-400')} />
                <input type={showPw ? 'text' : 'password'} className={cn(input, 'pl-10 pr-10')}
                  placeholder="At least 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className={cn('absolute right-3 top-1/2 -translate-y-1/2',
                    isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600')}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && password.length < 8 && (
                <p className="text-xs text-amber-500 mt-1">Must be at least 8 characters</p>
              )}
            </div>

            <div>
              <label className={label}>Confirm Password *</label>
              <div className="relative">
                <Lock className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-gray-400')} />
                <input type={showPw ? 'text' : 'password'} className={cn(input, 'pl-10')}
                  placeholder="Repeat password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {isOrg && (
              <div className={cn('p-3 rounded-xl text-xs leading-relaxed',
                isDark ? 'bg-amber-900/20 text-amber-400 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200')}>
                After registration, your account will be <strong>Pending</strong>. The Adama City Admin will verify your documents within <strong>24–48 hours</strong> before you can start fundraising.
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}
              rightIcon={<ChevronRight className="w-4 h-4" />}>
              {isOrg ? 'Register Organization' : 'Create Free Account'}
            </Button>
          </form>

          <p className={cn('text-center text-sm mt-5', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Already have an account?{' '}
            <Link to={`/login?from=${encodeURIComponent(redirectTo)}`} className="text-green-500 font-semibold hover:underline">
              Log In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
