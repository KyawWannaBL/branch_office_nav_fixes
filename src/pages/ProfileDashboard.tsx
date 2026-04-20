import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import {
  User,
  Star,
  Wallet,
  TrendingUp,
  MapPin,
  Package,
  Award,
  AlertOctagon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  CreditCard,
  MessageSquare,
  Loader2
} from "lucide-react";

// --- Sub-components by Role ---

// 1. RIDER PROFILE
const RiderProfile = ({ userId }: { userId: string }) => {
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRiderData() {
      try {
        // Fetch base profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, phone, avatar_url, vehicle_no, driver_id, rating")
          .eq("id", userId)
          .single();

        // Fetch wallet data
        const { data: walletData } = await supabase
          .from("rider_wallets")
          .select("*")
          .eq("rider_id", userId)
          .single();

        // Fetch recent reviews
        const { data: reviewsData } = await supabase
          .from("rider_reviews")
          .select("reviewer_name, rating, comment, created_at")
          .eq("rider_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        setProfile(profileData);
        setWallet(walletData || { balance: 0, success_comm: 0, perf_bonus: 0, fines: 0 });
        setReviews(reviewsData || []);
      } catch (error) {
        console.error("Error fetching rider data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRiderData();
  }, [userId]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-sky-600" /></div>;
  if (!profile) return <div className="text-center text-slate-500 p-10">Profile not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="relative h-24 w-24 shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Rider" className="h-full w-full rounded-full object-cover border-4 border-slate-50 shadow-md" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-400 border-4 border-slate-50 shadow-md"><User size={32}/></div>
          )}
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-white">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-[#0d2c54]">{profile.full_name || "Unknown Rider"}</h2>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700">Rider</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">Vehicle: {profile.vehicle_no || "N/A"} • ID: {profile.driver_id || "N/A"}</p>
          
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center text-[#ffd700]">
              <Star size={18} fill="currentColor" />
            </div>
            <span className="text-sm font-bold text-slate-700">{profile.rating ? profile.rating.toFixed(1) : "New"} / 5.0</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0d2c54_0%,#0a2343_100%)] p-6 shadow-xl md:col-span-7 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-sky-300 flex items-center gap-2"><Wallet size={16}/> Rider Wallet</h3>
            <span className="text-xs text-slate-400">Current Balance</span>
          </div>
          
          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Net Earnings Available</p>
            <h1 className="text-4xl font-black text-[#ffd700] mt-1">{(wallet?.balance || 0).toLocaleString()} <span className="text-lg">MMK</span></h1>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 mb-2"><TrendingUp size={14}/> <span className="text-[10px] font-bold uppercase">Success Comm</span></div>
              <p className="text-lg font-bold">+ {(wallet?.success_comm || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <div className="flex items-center gap-2 text-sky-400 mb-2"><Award size={14}/> <span className="text-[10px] font-bold uppercase">Perf. Bonus</span></div>
              <p className="text-lg font-bold">+ {(wallet?.perf_bonus || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 border border-rose-500/30">
              <div className="flex items-center gap-2 text-rose-400 mb-2"><AlertOctagon size={14}/> <span className="text-[10px] font-bold uppercase">Fines / Pens</span></div>
              <p className="text-lg font-bold">- {(wallet?.fines || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:col-span-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><MessageSquare size={16}/> Recent Feedback</h3>
          <div className="space-y-4 overflow-y-auto max-h-[240px] pr-2">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500">No recent feedback.</p>
            ) : (
              reviews.map((review, i) => (
                <div key={i} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-bold text-[#0d2c54]">{review.reviewer_name}</span>
                    <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex text-[#ffd700] mb-2">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={12} fill={idx < review.rating ? "currentColor" : "none"} className={idx >= review.rating ? "text-slate-200" : ""} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">"{review.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. MERCHANT PROFILE
const MerchantProfile = ({ userId }: { userId: string }) => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMerchantData() {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, phone, company_name")
          .eq("id", userId)
          .single();

        // Assuming a view or table aggregates merchant stats
        const { data: statsData } = await supabase
          .from("merchant_stats")
          .select("*")
          .eq("merchant_id", userId)
          .single();

        setProfile(profileData);
        setStats(statsData || { pending_cod: 0, outstanding_fees: 0, total_ways: 0, success_rate: 0, return_rate: 0 });
      } catch (error) {
        console.error("Error fetching merchant data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMerchantData();
  }, [userId]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-sky-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-black text-2xl uppercase">
          {profile?.company_name?.[0] || profile?.full_name?.[0] || "M"}
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#0d2c54]">{profile?.company_name || profile?.full_name}</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Enterprise Partner • {profile?.phone}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><DollarSign size={16}/> Financial Settlement</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-600">Pending COD to Receive</p>
                <p className="text-2xl font-black text-emerald-700">{(stats?.pending_cod || 0).toLocaleString()} Ks</p>
              </div>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-500 transition">Withdraw</button>
            </div>
            <div className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <div>
                <p className="text-[10px] font-bold uppercase text-rose-600">Outstanding Delivery Fees</p>
                <p className="text-xl font-bold text-rose-700">{(stats?.outstanding_fees || 0).toLocaleString()} Ks</p>
              </div>
              <button className="bg-white border border-rose-200 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition">Pay Now</button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Package size={16}/> Business Analytics</h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
                <p className="text-3xl font-black text-[#0d2c54]">{(stats?.total_ways || 0).toLocaleString()}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Total Ways (Month)</p>
             </div>
             <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
                <p className="text-3xl font-black text-emerald-600">{stats?.success_rate || 0}%</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Delivery Success Rate</p>
             </div>
             <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
                <p className="text-3xl font-black text-rose-500">{stats?.return_rate || 0}%</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Return Rate</p>
             </div>
             <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
                <p className="text-3xl font-black text-sky-600">Active</p>
                <p className="text-xs font-bold text-slate-500 mt-1">API Integration</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. CUSTOMER PROFILE
const CustomerProfile = ({ userId }: { userId: string }) => {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomerData() {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", userId)
          .single();

        // Fetch recent ways
        const { data: waysData } = await supabase
          .from("shipments")
          .select("id, tracking_number, sender_name, status, created_at")
          .or(`recipient_phone.eq.${profileData?.phone},sender_phone.eq.${profileData?.phone}`)
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch saved addresses
        const { data: addrData } = await supabase
          .from("customer_addresses")
          .select("*")
          .eq("customer_id", userId);

        setProfile(profileData);
        setHistory(waysData || []);
        setAddresses(addrData || []);
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomerData();
  }, [userId]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-sky-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-pink-700">
          <User size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#0d2c54]">{profile?.full_name || "Customer"}</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Personal Account • {profile?.phone}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Clock size={16}/> Recent Deliveries</h3>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">No recent deliveries found.</p>
            ) : (
              history.map((way) => (
                <div key={way.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-500">{way.tracking_number}</p>
                      <p className="text-sm font-black text-[#0d2c54]">From: {way.sender_name}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-1 rounded">{way.status.replace("_", " ")}</span>
                  </div>
                  
                  {way.status === "DELIVERED" && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-600 mb-2">Rate your rider:</p>
                      <div className="flex gap-1 text-slate-300 cursor-pointer">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} size={20} className="hover:text-[#ffd700] transition" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><MapPin size={16}/> Saved Addresses</h3>
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="p-4 border border-sky-200 bg-sky-50 rounded-2xl relative overflow-hidden">
                {addr.is_default && <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>}
                <p className="text-xs font-black text-sky-700 uppercase mb-1">{addr.label || "Saved Address"}</p>
                <p className="text-sm font-bold text-slate-700">{addr.address}</p>
                <p className="text-xs text-slate-500 mt-1">{addr.township}</p>
              </div>
            ))}
            <button className="w-full border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm py-3 rounded-2xl hover:bg-slate-50 transition">
              + Add New Address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. FINANCE / ADMIN PROFILE
const FinanceProfile = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinanceData() {
      try {
        // Secure RPC call to aggregate system financial data
        const { data } = await supabase.rpc("get_finance_summary");
        setStats(data || { total_cod: 0, pending_payouts: 0, system_revenue: 0 });
      } catch (error) {
        console.error("Error fetching finance stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFinanceData();
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0d2c54] text-white">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#0d2c54]">Admin / Finance Portal</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Authorized Access Level</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-sky-600" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total COD Holding</p>
            <p className="text-3xl font-black text-[#0d2c54] mt-2">{(stats?.total_cod || 0).toLocaleString()} <span className="text-sm">MMK</span></p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Pending Payouts</p>
            <p className="text-3xl font-black text-rose-600 mt-2">{(stats?.pending_payouts || 0).toLocaleString()} <span className="text-sm">MMK</span></p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">System Revenue (MTD)</p>
            <p className="text-3xl font-black text-emerald-600 mt-2">{(stats?.system_revenue || 0).toLocaleString()} <span className="text-sm">MMK</span></p>
          </div>
        </div>
      )}
      
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
         <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><CreditCard size={16}/> Quick Finance Actions</h3>
         <div className="flex gap-4">
           <button className="flex-1 bg-slate-50 border border-slate-200 py-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition">Process Merchant COD</button>
           <button className="flex-1 bg-slate-50 border border-slate-200 py-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition">Approve Rider Payroll</button>
           <button className="flex-1 bg-slate-50 border border-slate-200 py-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition">Audit Logs</button>
         </div>
      </div>
    </div>
  );
};

// --- MAIN WRAPPER ---
export default function ProfileDashboard() {
  const { user, roleCode } = useEnhancedAuth();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#0d2c54]" />
      </div>
    );
  }

  // Determine which dashboard to show based on the user's roleCode
  // Adjust these role mappings based on your exact definitions in DEFAULT_ROLES
  const isRider = ["RIDER", "DRIVER", "CUR"].includes(roleCode || "");
  const isMerchant = ["MER", "MERCHANT"].includes(roleCode || "");
  const isCustomer = ["CUS", "CUSTOMER"].includes(roleCode || "");
  const isFinanceOrAdmin = ["FINM", "SYS", "SUPER_ADMIN", "ADMIN"].includes(roleCode || "");

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {isRider && <RiderProfile userId={user.id} />}
        {isMerchant && <MerchantProfile userId={user.id} />}
        {isCustomer && <CustomerProfile userId={user.id} />}
        {isFinanceOrAdmin && <FinanceProfile userId={user.id} />}
        
        {/* Fallback if role is not strictly defined above */}
        {!isRider && !isMerchant && !isCustomer && !isFinanceOrAdmin && (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-black text-[#0d2c54]">Welcome to your Profile</h2>
            <p className="mt-2 text-slate-500">Your current role access ({roleCode}) does not have a specialized dashboard view yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}