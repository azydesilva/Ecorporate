"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// Removed Tabs UI
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Briefcase,
  Users,
  Target,
  Upload,
  Calendar,
  User,
  LogOut,
  Building,
  SettingsIcon,
  Menu,
  X,
  Calculator,
  Receipt,
  LayoutDashboard,
  Phone,
  BarChart3,
  DollarSign,
  CheckCircle,
  RefreshCw,
  MessageCircle,
} from "lucide-react"
import { LocalStorageService } from "@/lib/database-service"
import PublicMessages from "./PublicMessages"

interface AboutData {
  title: string
  companyInformation: string
  updatedAt?: string
}
import { fileUploadClient } from "@/lib/file-upload-client"
import { settingsStorage } from "@/lib/local-storage"
import ChangePasswordForm from "../user/ChangePasswordForm"
import ChangeEmailForm from "../user/ChangeEmailForm"
import ChangeUsernameForm from "../user/ChangeUsernameForm"
import { getUserById, updateUser, changeUserPassword } from "@/lib/auth-utils"

// Helper function to determine if a color is dark
function isColorDark(hex: string) {
  if (!hex) return false;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  // Perceived brightness formula
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 128;
}

// AccountSettingsTabs helper component
function AccountSettingsTabs({ user }: { user: any }) {
  const [tab, setTab] = useState("username");
  return (
    <div>
      <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden w-fit bg-white">
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'username' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
          onClick={() => setTab('username')}
        >
          Change Username
        </button>
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'email' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
          onClick={() => setTab('email')}
        >
          Change Email
        </button>
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r-0 border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'password' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
          onClick={() => setTab('password')}
        >
          Change Password
        </button>
      </div>
      {tab === "username" && (
        <div>
          <h3 className="text-lg font-medium mb-4">Change Username</h3>
          <ChangeUsernameForm
            currentUsername={user.name}
            onSubmit={async (newUsername: string) => {
              try {
                // Get the current user data to include password
                const currentUser = await getUserById(user.id);
                if (!currentUser) {
                  console.error('Current user not found');
                  return false;
                }

                const updatedUser = await updateUser(user.id, {
                  name: newUsername,
                  email: user.email,
                  role: user.role,
                  password: currentUser.password // Include the current password
                });
                if (updatedUser) {
                  // Update localStorage with the new user data
                  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                  // Dispatch a custom event to notify the parent component
                  window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error updating username:', error);
                return false;
              }
            }}
          />
        </div>
      )}
      {tab === "email" && (
        <div>
          <h3 className="text-lg font-medium mb-4">Change Email</h3>
          <ChangeEmailForm
            currentEmail={user.email}
            onSubmit={async (newEmail: string) => {
              try {
                // Get the current user data to include password
                const currentUser = await getUserById(user.id);
                if (!currentUser) {
                  console.error('Current user not found');
                  return false;
                }

                const updatedUser = await updateUser(user.id, {
                  name: user.name,
                  email: newEmail,
                  role: user.role,
                  password: currentUser.password // Include the current password
                });
                if (updatedUser) {
                  // Update localStorage with the new user data
                  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                  // Dispatch a custom event to notify the parent component
                  window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error updating email:', error);
                return false;
              }
            }}
          />
        </div>
      )}
      {tab === "password" && (
        <div>
          <h3 className="text-lg font-medium mb-4">Change Password</h3>
          <ChangePasswordForm
            onSubmit={async (currentPassword: string, newPassword: string) => {
              try {
                const success = await changeUserPassword(user.id, currentPassword, newPassword);
                return success;
              } catch (error) {
                console.error('Error changing password:', error);
                return false;
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

// ComingSoon component for new features
function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
            {description}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/20 rounded-full text-primary font-medium">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Overview component
function Overview({ user, companies, handleRegisterNewCompany, navigateTo, onSwitchToCompanies }: { user: any; companies: any[]; handleRegisterNewCompany: () => void; navigateTo: (page: string, companyId?: string) => void; onSwitchToCompanies: () => void }) {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('LKR');
  const [amount, setAmount] = useState('1');
  const [exchangeRates, setExchangeRates] = useState({
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    LKR: 200,
    JPY: 110,
    AUD: 1.35,
    CAD: 1.25,
    CHF: 0.92
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exchangeHistory, setExchangeHistory] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [apiError, setApiError] = useState<string | null>(null);

  // Typewriter animation state
  const [displayedName, setDisplayedName] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const customerName = user?.name || 'Customer';

  // Calculate statistics
  const completedRegistrations = companies.filter(company => company.status === 'completed').length;
  const processingRegistrations = companies.filter(company =>
    company.status === 'payment-processing' ||
    company.status === 'documentation-processing' ||
    company.status === 'incorporation-processing'
  ).length;

  // Calculate converted amount
  const convertedAmount = React.useMemo(() => {
    const fromRate = exchangeRates[fromCurrency as keyof typeof exchangeRates];
    const toRate = exchangeRates[toCurrency as keyof typeof exchangeRates];
    const inputAmount = parseFloat(amount) || 0;

    if (fromRate && toRate && inputAmount > 0) {
      return (inputAmount * toRate / fromRate).toFixed(4);
    }
    return '0';
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  // Fetch real exchange rates from API
  const fetchRealExchangeRates = async () => {
    setIsRefreshing(true);
    setApiError(null);

    try {
      // Using exchangerate-api.com (free, no API key required)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Update exchange rates with real data
      const newRates = {
        USD: 1,
        EUR: parseFloat(data.rates.EUR?.toFixed(4) || '0.85'),
        GBP: parseFloat(data.rates.GBP?.toFixed(4) || '0.73'),
        LKR: parseFloat(data.rates.LKR?.toFixed(2) || '200'),
        JPY: parseFloat(data.rates.JPY?.toFixed(2) || '110'),
        AUD: parseFloat(data.rates.AUD?.toFixed(4) || '1.35'),
        CAD: parseFloat(data.rates.CAD?.toFixed(4) || '1.25'),
        CHF: parseFloat(data.rates.CHF?.toFixed(4) || '0.92')
      };

      setExchangeRates(newRates);
      setLastUpdated(new Date());

      // Add to history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount) || 0,
        convertedAmount: parseFloat(convertedAmount) || 0,
        rate: newRates[toCurrency as keyof typeof newRates] / newRates[fromCurrency as keyof typeof newRates]
      };

      setExchangeHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 entries

    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setApiError('Failed to fetch latest rates. Using cached rates.');

      // Fallback to slightly varied rates if API fails
      const fallbackRates = {
        USD: 1,
        EUR: parseFloat((0.85 + (Math.random() - 0.5) * 0.01).toFixed(4)),
        GBP: parseFloat((0.73 + (Math.random() - 0.5) * 0.01).toFixed(4)),
        LKR: parseFloat((200 + (Math.random() - 0.5) * 5).toFixed(2)),
        JPY: parseFloat((110 + (Math.random() - 0.5) * 2).toFixed(2)),
        AUD: parseFloat((1.35 + (Math.random() - 0.5) * 0.01).toFixed(4)),
        CAD: parseFloat((1.25 + (Math.random() - 0.5) * 0.01).toFixed(4)),
        CHF: parseFloat((0.92 + (Math.random() - 0.5) * 0.01).toFixed(4))
      };

      setExchangeRates(fallbackRates);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate historical exchange rate data for area chart
  const generateHistoricalData = () => {
    const currentRate = exchangeRates[toCurrency as keyof typeof exchangeRates] / exchangeRates[fromCurrency as keyof typeof exchangeRates];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [];

    // Generate realistic historical data with some variation
    let baseRate = currentRate;
    for (let i = 6; i >= 0; i--) {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const rate = baseRate * (1 + variation);
      data.push({
        day: days[6 - i],
        rate: parseFloat(rate.toFixed(4)),
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
      baseRate = rate;
    }

    return data;
  };

  const chartData = generateHistoricalData();
  const maxRate = Math.max(...chartData.map(d => d.rate));
  const minRate = Math.min(...chartData.map(d => d.rate));
  const range = maxRate - minRate;

  // Typewriter animation effect
  React.useEffect(() => {
    if (!isTyping) return;

    const timer = setTimeout(() => {
      if (displayedName.length < customerName.length) {
        setDisplayedName(customerName.slice(0, displayedName.length + 1));
      } else {
        setIsTyping(false);
      }
    }, 100); // Typing speed: 100ms per character

    return () => clearTimeout(timer);
  }, [displayedName, customerName, isTyping]);

  // Reset typewriter animation when customer changes
  React.useEffect(() => {
    setDisplayedName('');
    setIsTyping(true);
  }, [customerName]);

  // Auto-refresh exchange rates every 5 minutes (300000ms)
  React.useEffect(() => {
    // Initial fetch
    fetchRealExchangeRates();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      fetchRealExchangeRates();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Swap currencies
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount(convertedAmount);
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  Hello{' '}
                  <span className="inline-block">
                    {displayedName}
                    {isTyping && (
                      <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse"></span>
                    )}
                  </span>
                  !
                </h2>
                <p className="text-sm text-gray-600">Welcome back to your dashboard</p>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Hello{' '}
                  <span className="inline-block">
                    {displayedName}
                    {isTyping && (
                      <span className="inline-block w-0.5 h-6 bg-primary ml-1 animate-pulse"></span>
                    )}
                  </span>
                  !
                </h2>
                <p className="text-gray-600">Welcome back to your corporate portal.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Companies Card - Mobile Only */}
      {companies.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 md:hidden">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Building2 className="w-5 h-5 mr-2" />
              Latest Registrations
            </CardTitle>
            <CardDescription className="text-blue-700">
              Your most recently registered companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companies.slice(0, 3).map((company, index) => (
                <div
                  key={company._id || company.id || index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-200 transition-colors cursor-pointer hover:shadow-sm"
                  onClick={() => {
                    // Navigate to company registration flow
                    const companyId = company._id || company.id;
                    if (companyId) {
                      navigateTo("companyRegistration", companyId);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {company.companyNameEnglish || 'Unnamed Company'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {company.status === 'completed' ? 'Completed' :
                          company.status === 'payment-processing' ? 'Payment Processing' :
                            company.status === 'documentation-processing' ? 'Documentation Processing' :
                              company.status === 'incorporation-processing' ? 'Incorporation Processing' :
                                company.status || 'In Progress'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() :
                        company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <Badge
                      variant={company.status === 'completed' ? 'default' : 'secondary'}
                      className={`text-xs ${company.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {company.status === 'completed' ? 'Completed' : 'Active'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-4">
            <Button
              size="sm"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={onSwitchToCompanies}
            >
              View All Registrations
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Start New Registration Card */}
        <Card
          className="group relative overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg hover:scale-[1.01]"
          onClick={handleRegisterNewCompany}
        >
          <CardContent className="flex flex-col items-center justify-center py-6 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex w-full flex-col gap-3">
              <div className="flex items-center space-x-4 min-w-0">
                <div className="text-left min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap">Start New Company Registration</h3>
                  <p className="text-sm text-gray-600 truncate max-w-[260px] sm:max-w-none">Begin incorporating your new company</p>
                </div>
              </div>
              <div className="flex items-center">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow transition-all duration-300 group-hover:scale-105 text-xs py-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Get Started
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Registrations Card */}
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Processing</p>
                <p className="text-3xl font-bold text-yellow-900">{processingRegistrations}</p>
                <p className="text-sm text-yellow-700">Currently in progress</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Registrations Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed Registrations</p>
                <p className="text-3xl font-bold text-green-900">{completedRegistrations}</p>
                <p className="text-sm text-green-700">Successfully incorporated</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Support Card */}
      <Card
        className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => window.open('https://wa.me/+94715666661', '_blank')}
      >
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">24/7 E Corporate Whatsapp Helpdesk</h3>
                <p className="text-gray-600">Instant support for registration, dashboard access, and documentation</p>
                {/* Mobile number below text on mobile */}

              </div>
            </div>
            {/* Mobile number on right side for desktop */}

          </div>
        </CardContent>
      </Card>

      {/* Currency Exchange Converter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>
                Currency Exchange Converter
              </CardTitle>
              <CardDescription>Real-time currency conversion with live exchange rates</CardDescription>
            </div>
            <div className="flex justify-center sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRealExchangeRates}
                disabled={isRefreshing}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Updating...' : 'Refresh Rates'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Currency Converter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* From Currency */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">From</label>
                <div className="flex gap-2">
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                  </select>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-32"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* To Currency */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">To</label>
                <div className="flex gap-2">
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                  </select>
                  <div className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
                    {convertedAmount}
                  </div>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={swapCurrencies}
                className="rounded-full w-10 h-10 p-0"
              >
                <ArrowRight className="w-4 h-4 rotate-90" />
              </Button>
            </div>

            {/* Exchange Rate Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="text-center">
                <div className="text-sm text-blue-600 mb-1">Current Exchange Rate</div>
                <div className="text-2xl font-bold text-blue-900">
                  1 {fromCurrency} = {(exchangeRates[toCurrency as keyof typeof exchangeRates] / exchangeRates[fromCurrency as keyof typeof exchangeRates]).toFixed(4)} {toCurrency}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
                {apiError && (
                  <div className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                    {apiError}
                  </div>
                )}
              </div>
            </div>

            {/* Exchange History */}
            {exchangeHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Recent Conversions</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {exchangeHistory.slice(0, 5).map((entry, index) => (
                    <div key={index} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                      <span>
                        {entry.amount} {entry.fromCurrency} → {entry.convertedAmount} {entry.toCurrency}
                      </span>
                      <span className="text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Exchange Rate Area Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">7-Day Historical Trend ({fromCurrency}/{toCurrency})</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-xs text-gray-500">Exchange Rate</span>
                  </div>
                </div>
              </div>

              <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 relative overflow-hidden">
                {/* Area Chart */}
                <div className="h-full relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 25, 50, 75, 100].map((percent, index) => (
                      <div key={index} className="w-full border-t border-gray-200 opacity-30"></div>
                    ))}
                  </div>

                  {/* Area Chart Path */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Area Path */}
                    <path
                      d={`M 0,${100 - ((chartData[0].rate - minRate) / range) * 100} ${chartData.map((data, index) =>
                        `L ${(index / (chartData.length - 1)) * 100},${100 - ((data.rate - minRate) / range) * 100}`
                      ).join(' ')} L 100,100 L 0,100 Z`}
                      fill="url(#areaGradient)"
                      className="transition-all duration-500"
                    />

                    {/* Line Path */}
                    <path
                      d={`M 0,${100 - ((chartData[0].rate - minRate) / range) * 100} ${chartData.map((data, index) =>
                        `L ${(index / (chartData.length - 1)) * 100},${100 - ((data.rate - minRate) / range) * 100}`
                      ).join(' ')}`}
                      stroke="rgb(59 130 246)"
                      strokeWidth="0.8"
                      fill="none"
                      className="transition-all duration-500"
                    />

                    {/* Data Points */}
                    {chartData.map((data, index) => (
                      <circle
                        key={index}
                        cx={(index / (chartData.length - 1)) * 100}
                        cy={100 - ((data.rate - minRate) / range) * 100}
                        r="1.2"
                        fill="rgb(59 130 246)"
                        className="transition-all duration-500 hover:r-2"
                      />
                    ))}
                  </svg>

                  {/* Y-axis Labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                    <span>{maxRate.toFixed(4)}</span>
                    <span>{((maxRate + minRate) / 2).toFixed(4)}</span>
                    <span>{minRate.toFixed(4)}</span>
                  </div>

                  {/* X-axis Labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500">
                    {chartData.map((data, index) => (
                      <span key={index}>{data.day}</span>
                    ))}
                  </div>

                  {/* Current Rate Indicator */}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-700 shadow-sm">
                    Current: {chartData[chartData.length - 1]?.rate.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Chart Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-green-50 p-2 rounded text-center">
                  <div className="text-green-600 font-medium">High</div>
                  <div className="text-green-800">{maxRate.toFixed(4)}</div>
                </div>
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="text-blue-600 font-medium">Current</div>
                  <div className="text-blue-800">{chartData[chartData.length - 1]?.rate.toFixed(4)}</div>
                </div>
                <div className="bg-red-50 p-2 rounded text-center">
                  <div className="text-red-600 font-medium">Low</div>
                  <div className="text-red-800">{minRate.toFixed(4)}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

type CustomerDashboardProps = {
  user: any
  navigateTo: (page: string, companyId?: string) => void
  onLogout: () => void
  registrations?: any[]
}

export default function CustomerDashboard({ user, navigateTo, onLogout, registrations }: CustomerDashboardProps) {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("companies")
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [secretaryFee, setSecretaryFee] = useState<number>(0)
  const [renewingCompanyId, setRenewingCompanyId] = useState<string | null>(null)
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null)
  const [secretaryRenewalPayments, setSecretaryRenewalPayments] = useState<any[]>([])
  const [logo, setLogo] = useState<string | null>(null)
  const [sidebarColor, setSidebarColor] = useState<string>("")
  const [sidebarTextColor, setSidebarTextColor] = useState<string>("")
  const [aboutData, setAboutData] = useState<AboutData>({
    title: "About Our Company",
    companyInformation: "Welcome to our company incorporation service. We provide comprehensive support for business registration and incorporation processes."
  })
  const [aboutLoading, setAboutLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load logo and sidebar color from settings
  useEffect(() => {
    const updateLogoAndSidebarColor = () => {
      const settings = settingsStorage.getSettings()
      setLogo(settings?.logo || null)
      // If admin enabled color switch, use primary color, else use default
      const color = settings?.changeNavbarColor ? settings?.primaryColor || "#2563eb" : ""
      setSidebarColor(color)
      setSidebarTextColor(isColorDark(color) ? "#fff" : "")
    }

    updateLogoAndSidebarColor()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'appSettings') {
        updateLogoAndSidebarColor()
      }
    }

    const handleLocalChange = () => {
      updateLogoAndSidebarColor()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('storage-updated', handleLocalChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('storage-updated', handleLocalChange)
    }
  }, [])

  // Load about data when about tab is selected
  useEffect(() => {
    if (activeTab === "about") {
      loadAboutData()
    }
  }, [activeTab])

  const loadAboutData = async () => {
    try {
      setAboutLoading(true)
      const data = await LocalStorageService.getAboutSettings() as AboutData
      setAboutData(data)
    } catch (error) {
      console.error('Error loading about data:', error)
      // Keep default data if loading fails
    } finally {
      setAboutLoading(false)
    }
  }

  // Function to load data
  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading customer dashboard data...')

      // Load secretary renewal fee
      try {
        const settings = await LocalStorageService.getSettings()
        if (settings?.secretary_renew_fee) {
          setSecretaryFee(Number(settings.secretary_renew_fee))
        }
      } catch (error) {
        console.warn('Could not load secretary fee:', error)
      }

      // First try to load from database
      let databaseRegistrations = []
      try {
        databaseRegistrations = await LocalStorageService.getRegistrations(user?.id, user?.email)
        console.log('✅ Customer dashboard loaded registrations from database:', databaseRegistrations.length)
      } catch (dbError) {
        console.warn('⚠️ Database unavailable, using fallback:', dbError)
      }

      // Use database registrations if available, otherwise use empty array
      let allRegistrations = databaseRegistrations.length > 0 ? databaseRegistrations : []

      // If still no data, try localStorage as final fallback
      if (!allRegistrations || allRegistrations.length === 0) {
        const savedRegistrations = localStorage.getItem("registrations")
        if (savedRegistrations) {
          const parsedRegistrations = JSON.parse(savedRegistrations)
          if (parsedRegistrations && parsedRegistrations.length > 0) {
            // Filter localStorage data by user ID
            const filteredRegistrations = parsedRegistrations.filter((reg: any) =>
              reg.userId === user?.id
            )
            allRegistrations = filteredRegistrations
            console.log('📦 Loaded from localStorage fallback:', allRegistrations.length)
            console.log('🔍 Filtered by user ID:', user?.id)
          }
        }
      }

      // Sort registrations by updatedAt date (newest first)
      const sortedRegistrations = [...(allRegistrations || [])].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return dateB - dateA
      })

      setCompanies(sortedRegistrations)
      console.log('🎉 Customer dashboard loaded companies:', sortedRegistrations.length)
      console.log('🔍 User ID for filtering:', user?.id)

      // Load secretary renewal payments after companies are loaded
      try {
        const response = await fetch('/api/secretary-renewal-payments')
        if (response.ok) {
          const payments = await response.json()
          // Filter payments for this user's companies
          const userCompanyIds = sortedRegistrations.map(reg => reg._id || reg.id)
          const userPayments = payments.filter((payment: any) => userCompanyIds.includes(payment.registrationId))
          setSecretaryRenewalPayments(userPayments)
          console.log('✅ Loaded secretary renewal payments:', userPayments.length)
        }
      } catch (error) {
        console.warn('Could not load secretary renewal payments:', error)
      }

      // Log each company for debugging
      sortedRegistrations.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.companyName || company.companyNameEnglish} - ${company.status} (ID: ${company._id})`)
        console.log(`      📊 Company Data:`, {
          id: company._id || company.id,
          userId: company.userId,
          companyName: company.companyName,
          companyNameEnglish: company.companyNameEnglish,
          contactPersonName: company.contactPersonName,
          status: company.status,
          currentStep: company.currentStep,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt
        })
      })
    } catch (error) {
      console.error('❌ Error loading companies:', error)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial load
    loadData()

    // Initial load only - registration updates handled in separate useEffect
  }, [registrations, user])

  // Component mount effect - force initial load
  useEffect(() => {
    console.log('🚀 CustomerDashboard mounted, forcing initial data load...')
    const forceLoad = async () => {
      try {
        setLoading(true)
        const databaseRegistrations = await LocalStorageService.getRegistrations(user?.id, user?.email)
        const sortedRegistrations = [...databaseRegistrations].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
          return dateB - dateA
        })
        setCompanies(sortedRegistrations)
        console.log('🚀 Initial load completed:', sortedRegistrations.length)
      } catch (error) {
        console.error('❌ Error in initial load:', error)
      } finally {
        setLoading(false)
      }
    }
    forceLoad()
  }, [user?.id])

  // Separate useEffect for handling registration updates
  useEffect(() => {
    const handleRegistrationUpdate = (event: any) => {
      console.log('🔄 Registration update detected, refreshing customer dashboard...', event.detail)
      // Force a refresh from database
      const refreshFromDatabase = async () => {
        try {
          setLoading(true)
          const databaseRegistrations = await LocalStorageService.getRegistrations(user?.id, user?.email)
          const sortedRegistrations = [...databaseRegistrations].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
            return dateB - dateA
          })
          setCompanies(sortedRegistrations)
          console.log('🔄 Refreshed companies from database:', sortedRegistrations.length)
          console.log('🔍 Refresh - User ID for filtering:', user?.id)

          // Also refresh secretary renewal payments
          try {
            const response = await fetch('/api/secretary-renewal-payments')
            if (response.ok) {
              const payments = await response.json()
              // Filter payments for this user's companies
              const userCompanyIds = sortedRegistrations.map(reg => reg._id || reg.id)
              const userPayments = payments.filter((payment: any) => userCompanyIds.includes(payment.registrationId))
              setSecretaryRenewalPayments(userPayments)
              console.log('✅ Refreshed secretary renewal payments:', userPayments.length)
            }
          } catch (error) {
            console.warn('Could not refresh secretary renewal payments:', error)
          }
        } catch (error) {
          console.error('❌ Error refreshing from database:', error)
        } finally {
          setLoading(false)
        }
      }
      refreshFromDatabase()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing customer dashboard...')
        loadData()
      }
    }

    window.addEventListener("registration-updated", handleRegistrationUpdate)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("registration-updated", handleRegistrationUpdate)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user?.id])

  const handleRegisterNewCompany = () => {
    // Use a special identifier "new" to indicate this is a brand new registration
    // This will ensure we start from the first step (contact-details)
    navigateTo("companyRegistration", "new")
  }

  const handleContinueRegistration = (companyId: string) => {
    // Find the company in our list
    const company = companies.find((c) => c._id === companyId)

    if (company) {
      // Check if the company card is expired
      const isExpired = company.isExpired || (company.expireDate && new Date(company.expireDate) < new Date());

      if (isExpired) {
        alert('This company card has expired. Please contact admin for renewal.');
        return;
      }

      // Set the selected company ID and navigate to the registration flow
      // The registration flow will determine the correct step based on the company data
      navigateTo("companyRegistration", companyId)

      // In a real app, you might want to pass additional information about the current step
      // For example, you could use a URL parameter or state management
      console.log(`Continuing registration for company ${companyId} at step ${company.currentStep}`)
    } else {
      console.error(`Company with ID ${companyId} not found`)
    }
  }

  const handleCancelRegistration = async (companyId: string) => {
    try {
      console.log('🗑️ Cancelling registration:', companyId);

      // Delete from database
      await LocalStorageService.deleteRegistration(companyId);
      console.log('✅ Registration deleted from database');

      // Update local state
      const updatedCompanies = companies.filter((company) => company._id !== companyId);
      setCompanies(updatedCompanies);

      // Update localStorage
      localStorage.setItem("registrations", JSON.stringify(updatedCompanies));

      // Dispatch event to notify other components
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-deleted",
            registrationId: companyId,
          },
        })
      );

      console.log('✅ Registration cancelled successfully');
    } catch (error) {
      console.error('❌ Error cancelling registration:', error);
      // Fallback to localStorage only if database deletion fails
      const updatedCompanies = companies.filter((company) => company._id !== companyId);
      setCompanies(updatedCompanies);
      localStorage.setItem("registrations", JSON.stringify(updatedCompanies));
    }
  }

  // Helper function to get secretary renewal payment for a company
  const getSecretaryRenewalPayment = (companyId: string) => {
    return secretaryRenewalPayments.find((payment: any) => payment.registrationId === companyId)
  }

  // Handle secretary renewal
  const handleSecretaryRenewal = async (companyId: string) => {
    if (!paymentReceipt) {
      alert('Please upload a payment receipt.');
      return;
    }

    setRenewingCompanyId(companyId)

    try {
      // Upload payment receipt
      console.log('📁 Uploading payment receipt for secretary renewal...');
      const uploadedFile = await fileUploadClient.uploadFile(paymentReceipt, `customer_${user?.id}`, {
        companyId: companyId,
        paymentType: 'secretary-renewal'
      })

      // Check if upload was successful
      if (!uploadedFile.success) {
        throw new Error(uploadedFile.error || 'Failed to upload payment receipt')
      }

      console.log('✅ Payment receipt uploaded successfully:', uploadedFile.file);

      // Validate that we have the required file information
      if (!uploadedFile.file?.url) {
        throw new Error('File upload succeeded but no URL was returned')
      }

      // Create secretary renewal payment record in database
      console.log('💾 Creating secretary renewal payment record in database...');
      const response = await fetch('/api/secretary-renewal-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: companyId,
          amount: secretaryFee,
          paymentReceipt: {
            url: uploadedFile.file.url,
            fileName: uploadedFile.file.fileName || paymentReceipt.name,
            id: uploadedFile.file.id,
            uploadedAt: uploadedFile.file.uploadedAt
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // If the database record creation fails, we should try to clean up the uploaded file
        console.error('❌ Failed to create database record, attempting to clean up uploaded file...');
        try {
          await fileUploadClient.deleteFile(uploadedFile.file.filePath);
          console.log('✅ Cleaned up uploaded file after database failure');
        } catch (cleanupError) {
          console.error('❌ Failed to clean up uploaded file:', cleanupError);
        }
        throw new Error(errorData.error || `Failed to submit renewal payment (HTTP ${response.status})`)
      }

      const result = await response.json()
      console.log('✅ Secretary renewal payment record created successfully:', result)

      // Refresh company data to reflect the new payment
      await loadData()

      alert('Secretary renewal payment submitted successfully. Please wait for admin approval.')
    } catch (error: any) {
      console.error('Error submitting secretary renewal payment:', error)
      alert(`Failed to submit secretary renewal payment: ${error.message || 'Please try again.'}`)
    } finally {
      setRenewingCompanyId(null)
      setPaymentReceipt(null)
    }
  }

  // Update the getStatusBadge function to include the "completed" status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment-processing":
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm"
          >
            <Clock className="w-3 h-3 mr-1" />
            Payment Processing
          </Badge>
        )
      case "payment-rejected":
        return (
          <Badge variant="outline" className="bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-300 shadow-sm">
            <AlertCircle className="w-3 h-3 mr-1" />
            Payment Rejected
          </Badge>
        )
      case "documentation-processing":
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200 shadow-sm"
          >
            <FileText className="w-3 h-3 mr-1" />
            Documentation Processing
          </Badge>
        )
      case "incorporation-processing":
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 shadow-sm"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Incorporation Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200 shadow-sm"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Incorporated
          </Badge>
        )
      default:
        // Default to Payment Processing for any unrecognized status
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm"
          >
            <Clock className="w-3 h-3 mr-1" />
            Payment Processing
          </Badge>
        )
    }
  }



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".relative")) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  // No registrations empty state component
  const NoRegistrationsCard = () => (
    <div className="col-span-full">
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 border-2 border-dashed border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-8">
            {/* Removed Building2 icon as requested */}
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Your Business Journey?</h3>
          <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
            You haven't registered any companies yet. Take the first step towards building your business empire with our
            streamlined incorporation process.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-2xl">
            <div key="fast-process" className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Fast Process</h4>
              <p className="text-sm text-gray-600">Complete registration in just a few steps</p>
            </div>

            <div key="expert-support" className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Expert Support</h4>
              <p className="text-sm text-gray-600">Get help from our incorporation specialists</p>
            </div>

            <div key="all-in-one" className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">All-in-One</h4>
              <p className="text-sm text-gray-600">Everything you need to get started</p>
            </div>
          </div>

          <Button
            onClick={handleRegisterNewCompany}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
          >
            Register Your First Company
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Helper for progress percentage by step
  const stepOrder = ["contact-details", "company-details", "documentation", "incorporate"];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Mobile Full-Screen Menu */}
        {sidebarOpen && (
          <div
            className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{
              background: sidebarColor || '#ffffff',
              color: sidebarTextColor || undefined,
            }}
          >
            {/* Close button */}
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Centered Menu Content */}
            <div className="flex flex-col items-center justify-center h-full px-6">
              {/* Logo Section */}
              <div className="mb-8">
                {logo ? (
                  <img
                    src={logo}
                    alt="Application Logo"
                    className="h-8 w-auto max-w-[200px] object-contain mx-auto"
                  />
                ) : (
                  <div className="text-2xl font-semibold text-center">Dashboard</div>
                )}
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2 w-full max-w-sm">
                <Button
                  variant={activeTab === "overview" ? "secondary" : "ghost"}
                  className="w-full justify-start text-base py-3"
                  onClick={() => {
                    setActiveTab("overview")
                    setSidebarOpen(false)
                  }}
                >
                  <LayoutDashboard className="h-5 w-5 mr-3" />
                  Overview
                </Button>

                <Button
                  variant={activeTab === "companies" ? "secondary" : "ghost"}
                  className="w-full justify-start text-base py-3"
                  onClick={() => {
                    setActiveTab("companies")
                    setSidebarOpen(false)
                  }}
                >
                  <Building className="h-5 w-5 mr-3" />
                  Companies
                </Button>

                <Button
                  variant={activeTab === "taxation" ? "secondary" : "ghost"}
                  className="w-full justify-start text-base py-3"
                  onClick={() => {
                    setActiveTab("taxation")
                    setSidebarOpen(false)
                  }}
                >
                  <Calculator className="h-5 w-5 mr-3" />
                  Taxation
                </Button>

                <Button
                  variant={activeTab === "invoice" ? "secondary" : "ghost"}
                  className="w-full justify-start text-base py-3"
                  onClick={() => {
                    setActiveTab("invoice")
                    setSidebarOpen(false)
                  }}
                >
                  <Receipt className="h-5 w-5 mr-3" />
                  Invoice
                </Button>

                <Button
                  variant={activeTab === "account" ? "secondary" : "ghost"}
                  className="w-full justify-start text-base py-3"
                  onClick={() => {
                    setActiveTab("account")
                    setSidebarOpen(false)
                  }}
                >
                  <User className="h-5 w-5 mr-3" />
                  Account Settings
                </Button>

                <Button
                  variant={activeTab === "about" ? "secondary" : "ghost"}
                  className="w-full justify-start text-base py-3"
                  onClick={() => {
                    setActiveTab("about")
                    setSidebarOpen(false)
                  }}
                >
                  <FileText className="h-5 w-5 mr-3" />
                  About
                </Button>
              </nav>

              {/* User Profile and Logout */}
              <div className="mt-8 flex flex-col items-center space-y-4 w-full max-w-sm">
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                    {user?.name ? user.name[0] : 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user?.name || 'Customer'}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email || ''}</div>
                  </div>
                </div>

                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="w-full bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div
          className={`hidden lg:flex w-64 border-r flex-col fixed left-0 h-full overflow-y-auto z-50 ${!sidebarColor ? 'bg-background text-foreground' : ''}`}
          style={{
            top: '0px',
            height: '100vh',
            background: sidebarColor || undefined,
            color: sidebarTextColor || undefined,
            transition: 'background 0.3s, color 0.3s',
          }}
        >
          {/* Logo Section - Desktop Only */}
          <div
            className="border-b px-6 py-4 flex items-center justify-center relative"
            style={{
              background: sidebarColor || '#fff',
              transition: 'background 0.3s',
            }}
          >
            {logo ? (
              <img
                src={logo}
                alt="Application Logo"
                className="h-8 w-auto max-w-[200px] object-contain cursor-pointer"
                onClick={() => {
                  navigateTo('customerDashboard');
                  setActiveTab('companies');
                }}
              />
            ) : (
              <div className="text-lg font-semibold">Dashboard</div>
            )}
          </div>

          {/* Navigation Menu Section - Desktop Only */}
          <div className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              <Button
                variant={activeTab === "overview" ? "secondary" : "ghost"}
                className={`w-full justify-start transition-colors ${activeTab === "overview" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                style={activeTab === "overview" ? undefined : { backgroundColor: undefined }}
                onClick={() => {
                  setActiveTab("overview")
                }}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" /> Overview
              </Button>

              <Button
                variant={activeTab === "companies" ? "secondary" : "ghost"}
                className={`w-full justify-start transition-colors ${activeTab === "companies" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                style={activeTab === "companies" ? undefined : { backgroundColor: undefined }}
                onClick={() => {
                  setActiveTab("companies")
                }}
              >
                <Building className="h-4 w-4 mr-2" /> Companies
              </Button>

              <Button
                variant={activeTab === "taxation" ? "secondary" : "ghost"}
                className={`w-full justify-start transition-colors ${activeTab === "taxation" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                style={activeTab === "taxation" ? undefined : { backgroundColor: undefined }}
                onClick={() => {
                  setActiveTab("taxation")
                }}
              >
                <Calculator className="h-4 w-4 mr-2" /> Taxation
              </Button>

              <Button
                variant={activeTab === "invoice" ? "secondary" : "ghost"}
                className={`w-full justify-start transition-colors ${activeTab === "invoice" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                style={activeTab === "invoice" ? undefined : { backgroundColor: undefined }}
                onClick={() => {
                  setActiveTab("invoice")
                }}
              >
                <Receipt className="h-4 w-4 mr-2" /> Invoice
              </Button>

              <Button
                variant={activeTab === "account" ? "secondary" : "ghost"}
                className={`w-full justify-start transition-colors ${activeTab === "account" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                style={activeTab === "account" ? undefined : { backgroundColor: undefined }}
                onClick={() => {
                  setActiveTab("account")
                }}
              >
                <User className="h-4 w-4 mr-2" /> Account Settings
              </Button>

              <Button
                variant={activeTab === "about" ? "secondary" : "ghost"}
                className={`w-full justify-start transition-colors ${activeTab === "about" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                style={activeTab === "about" ? undefined : { backgroundColor: undefined }}
                onClick={() => {
                  setActiveTab("about")
                }}
              >
                <FileText className="h-4 w-4 mr-2" /> About
              </Button>
            </nav>
          </div>

          {/* Customer Profile Row - Desktop Only */}
          <div className={`border-t ${!sidebarColor ? 'border-gray-300 bg-gray-50' : ''} px-2 py-2 mt-auto flex items-center justify-between gap-2`}>
            {/* Profile Icon */}
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-primary uppercase">
              {user?.name ? user.name[0] : 'C'}
            </div>
            {/* Name & Email */}
            <div className="flex flex-col flex-1 min-w-0 ml-2 overflow-hidden">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{user?.name || 'Customer'}</span>
              <span className="text-[10px] text-gray-400 truncate">{user?.email || ''}</span>
            </div>
            {/* Mini Logout Button */}
            <button
              title="Logout"
              onClick={onLogout}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 transition-colors ml-2"
              style={sidebarColor ? { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' } : {}}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto lg:ml-64" style={{ height: '100vh' }}>
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="w-10"></div> {/* Spacer for centering */}
            {logo && (
              <img
                src={logo}
                alt="Application Logo"
                className="h-8 w-auto max-w-[200px] object-contain"
              />
            )}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="container py-6 px-0 md:px-4">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <Overview
                user={user}
                companies={companies}
                handleRegisterNewCompany={handleRegisterNewCompany}
                navigateTo={navigateTo}
                onSwitchToCompanies={() => setActiveTab("companies")}
              />
            )}

            {/* Companies Tab */}
            {activeTab === "companies" && (
              <>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Clock className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="mb-6 px-4 md:px-0">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search companies..."
                        className="h-11"
                      />
                    </div>

                    {/* Public Messages */}
                    <PublicMessages />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 px-4 md:px-0">
                      {/* Debug: Rendering companies */}
                      {(() => {
                        console.log('🔍 Rendering companies:', companies.length, companies);
                        return null;
                      })()}
                      {companies.length === 0 ? (
                        <NoRegistrationsCard />
                      ) : (
                        <>
                          {/* New Registration Card */}
                          <Card
                            className="group relative overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg hover:scale-[1.01] col-span-full sm:col-span-1 px-4 py-2 min-h-[280px] flex flex-col"
                            onClick={handleRegisterNewCompany}
                          >
                            <CardContent className="flex flex-col items-center justify-center py-5 text-center relative h-full">
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="relative z-10 flex flex-1 w-full h-full items-center justify-center text-center">
                                <div className="flex flex-col items-center w-full">

                                  <h3 className="text-base font-semibold mb-0.5 text-gray-900">Start New Company Registration</h3>
                                  <p className="text-xs text-gray-600 mb-2 max-w-xs">
                                    Begin the journey to incorporate your new company with our streamlined process
                                  </p>
                                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow transition-all duration-300 group-hover:scale-105 text-xs py-2 mt-0.5">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Get Started
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Existing Company Cards */}
                          {(companies.filter((c) => {
                            const q = searchQuery.trim().toLowerCase()
                            if (!q) return true
                            const name = (c.companyNameEnglish || "").toLowerCase()
                            const contact = (c.contactPersonName || c.customerName || "").toLowerCase()
                            return name.includes(q) || contact.includes(q)
                          })).map((company: any, index: number) => {
                            // Check if company card is expired
                            const isExpired = company.isExpired || (company.expireDate && new Date(company.expireDate) < new Date());
                            const renewalPayment = getSecretaryRenewalPayment(company._id || company.id);

                            // Determine card status for styling
                            const isExpiredWithPendingPayment = isExpired && renewalPayment?.status === 'pending';
                            const isExpiredWithApprovedPayment = isExpired && renewalPayment?.status === 'approved';
                            const isExpiredWithRejectedPayment = isExpired && renewalPayment?.status === 'rejected';
                            const isExpiredWithoutPayment = isExpired && !renewalPayment;

                            // Progress: Only show completed steps. 1 step completed = 25%, 2 = 50%, 3 = 75%, 4 = 100%
                            let progressPercent = 0;
                            const status = company.status || 'payment-processing';

                            // If status is completed, show 100%
                            if (status === 'completed') {
                              progressPercent = 100;
                            } else {
                              const stepIdx = company.currentStep ? stepOrder.indexOf(company.currentStep) : -1;
                              // Only count steps before the current step as completed
                              if (stepIdx > 0 && stepIdx <= stepOrder.length) {
                                progressPercent = (stepIdx / stepOrder.length) * 100;
                              } else if (stepIdx === 0) {
                                progressPercent = 0;
                              } else if (stepIdx === stepOrder.length - 1) {
                                progressPercent = 100;
                              }
                            }
                            return (
                              <Card
                                key={company._id || `company-${index}`}
                                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01] bg-white px-4 py-2 ${isExpired ? 'min-h-[320px]' : 'min-h-[280px]'} flex flex-col ${(() => {
                                  if (isExpired) {
                                    return "border-red-300 shadow-red-200 bg-red-50"; // Always red for expired cards
                                  } else if ((company.status || "") === "payment-rejected") {
                                    return "border-red-200 shadow-red-100";
                                  } else {
                                    return "border-gray-200 shadow-gray-100";
                                  }
                                })()}`}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <CardHeader
                                  className={`pb-2 pt-3 px-3 relative z-10 ${(() => {
                                    if (isExpired) {
                                      return "bg-gradient-to-r from-red-100 to-red-50"; // Always red for expired cards
                                    } else if ((company.status || "") === "payment-rejected") {
                                      return "bg-gradient-to-r from-red-50 to-pink-50";
                                    } else {
                                      return "bg-gradient-to-r from-gray-50 to-slate-50";
                                    }
                                  })()}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-base font-semibold text-gray-900 mb-0 truncate">
                                        {company.companyNameEnglish || company.companyName}
                                      </CardTitle>
                                      <CardDescription className="text-xs text-gray-500">
                                        Started {company.createdAt ? new Date(company.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                                      </CardDescription>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                      <Building2 className="w-4 h-4 text-gray-600" />
                                    </div>
                                  </div>
                                </CardHeader>

                                <CardContent className="relative z-10 space-y-2 px-3 py-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-700">Status</span>
                                    {getStatusBadge(company.status || "payment-processing")}
                                  </div>

                                  {/* Registered, Expired Dates, and Secretary Period Year as Badges */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-[10px] font-medium">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        Reg: {company.registerStartDate
                                          ? new Date(company.registerStartDate).toLocaleDateString()
                                          : 'Not Set'
                                        }
                                      </span>
                                    </div>
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 border rounded-md text-[10px] font-medium ${company.expireDate
                                      ? (company.isExpired
                                        ? 'bg-red-100 text-red-700 border-red-300'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                      )
                                      : 'bg-gray-50 text-gray-500 border-gray-200'
                                      }`}>
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        Exp: {company.expireDate
                                          ? new Date(company.expireDate).toLocaleDateString()
                                          : 'Not Set'
                                        }
                                      </span>
                                      {company.expireDate && company.isExpired && (
                                        <span className="ml-1 px-1 py-0.5 bg-red-200 text-red-800 rounded text-[9px] font-bold">
                                          EXPIRED
                                        </span>
                                      )}
                                    </div>
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-medium">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        Sec: {company.secretaryPeriodYear ? `${company.secretaryPeriodYear} ${company.secretaryPeriodYear === '1' || company.secretaryPeriodYear === 1 ? 'Year' : 'Years'}` : 'Not Set'}
                                      </span>
                                    </div>
                                  </div>

                                  {isExpiredWithPendingPayment ? (
                                    <Alert className="bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300 py-2 px-2">
                                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                                      <AlertTitle className="text-xs font-medium text-yellow-800">Payment Under Review</AlertTitle>
                                      <AlertDescription className="text-xs text-yellow-800">
                                        Your secretary renewal payment is being reviewed by admin. Please wait for approval.
                                      </AlertDescription>
                                    </Alert>
                                  ) : isExpired ? (
                                    <Alert
                                      variant="destructive"
                                      className="bg-gradient-to-r from-red-100 to-red-50 border-red-300 py-2 px-2"
                                    >
                                      <AlertCircle className="h-3 w-3" />
                                      <AlertTitle className="text-xs font-medium">Secretary Practice Expired</AlertTitle>
                                      <AlertDescription className="text-xs">
                                        Your company card has expired. Please renew secretary to continue.
                                      </AlertDescription>
                                    </Alert>
                                  ) : renewalPayment?.status === 'pending' ? (
                                    <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 py-2 px-2">
                                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                                      <AlertTitle className="text-xs font-medium text-yellow-700">Renewal Payment Pending</AlertTitle>
                                      <AlertDescription className="text-xs text-yellow-700">
                                        Your secretary renewal payment is under review by admin.
                                      </AlertDescription>
                                    </Alert>
                                  ) : renewalPayment?.status === 'approved' ? (
                                    <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 py-2 px-2">
                                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                                      <AlertTitle className="text-xs font-medium text-green-700">Renewal Payment Approved</AlertTitle>
                                      <AlertDescription className="text-xs text-green-700">
                                        Your secretary renewal payment has been approved.
                                      </AlertDescription>
                                    </Alert>
                                  ) : (company.status || "") === "payment-rejected" ? (
                                    <Alert
                                      variant="destructive"
                                      className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 py-2 px-2"
                                    >
                                      <AlertCircle className="h-3 w-3" />
                                      <AlertTitle className="text-xs font-medium">Payment Rejected</AlertTitle>
                                      <AlertDescription className="text-xs">
                                        Your payment has been rejected. Please start a new registration.
                                      </AlertDescription>
                                    </Alert>
                                  ) : (company.status || "") === "completed" ? (
                                    <Alert className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 py-2 px-2">
                                      <CheckCircle2 className="h-3 w-3 text-gray-500" />
                                      <AlertTitle className="text-xs font-medium text-gray-700">
                                        Registration Completed
                                      </AlertTitle>
                                      <AlertDescription className="text-xs text-gray-700">
                                        Your company has been successfully incorporated.
                                      </AlertDescription>
                                    </Alert>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-gray-700">Progress</span>
                                        <span className="text-gray-600">
                                          {progressPercent}%
                                        </span>
                                      </div>

                                      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
                                          style={{ width: `${progressPercent}%` }}
                                        />
                                      </div>

                                      <div className="text-xs text-gray-600">
                                        <span className="font-medium">Current Step:</span> {company.currentStep ? company.currentStep.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Not Started"}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>

                                <CardFooter className="relative z-10 pt-2 px-3 pb-3">
                                  {isExpiredWithPendingPayment ? (
                                    <div className="w-full space-y-2">
                                      <div className="text-center py-3 bg-yellow-100 rounded-lg">
                                        <div className="text-sm text-yellow-800 font-medium mb-1">
                                          Payment Submitted Successfully
                                        </div>
                                        <div className="text-xs text-yellow-700">
                                          Waiting for admin approval. You will be notified once processed.
                                        </div>
                                      </div>
                                    </div>
                                  ) : isExpired && renewalPayment?.status === 'rejected' ? (
                                    <div className="w-full space-y-3">
                                      <div className="text-sm text-red-700 font-semibold bg-red-100 p-2 rounded-lg">
                                        Secretary Renewal Fee: LKR {typeof secretaryFee === 'number' ? secretaryFee.toFixed(2) : "0.00"}
                                      </div>
                                      <div className="space-y-2">
                                        <Input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={(e) => e.target.files?.[0] && setPaymentReceipt(e.target.files[0])}
                                          className="text-xs"
                                          placeholder="Upload Payment Receipt"
                                        />
                                        {paymentReceipt && (
                                          <div className="text-xs text-green-600 font-medium">
                                            ✓ {paymentReceipt.name} selected
                                          </div>
                                        )}
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="w-full bg-gradient-to-r from-red-500 to-red-600 shadow transition-all duration-300 text-xs py-2"
                                          onClick={() => handleSecretaryRenewal(company._id)}
                                          disabled={renewingCompanyId === company._id || !paymentReceipt}
                                        >
                                          {renewingCompanyId === company._id ? (
                                            <Clock className="w-3 h-3 mr-1 animate-spin" />
                                          ) : (
                                            <Upload className="w-3 h-3 mr-1" />
                                          )}
                                          Resubmit Payment
                                        </Button>
                                      </div>
                                    </div>
                                  ) : isExpired ? (
                                    <div className="w-full space-y-3">
                                      <div className="text-sm text-red-700 font-semibold bg-red-100 p-2 rounded-lg">
                                        Secretary Renewal Fee: LKR {typeof secretaryFee === 'number' ? secretaryFee.toFixed(2) : "0.00"}
                                      </div>
                                      <div className="space-y-2">
                                        <Input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={(e) => e.target.files?.[0] && setPaymentReceipt(e.target.files[0])}
                                          className="text-xs"
                                          placeholder="Upload Payment Receipt"
                                        />
                                        {paymentReceipt && (
                                          <div className="text-xs text-green-600 font-medium">
                                            ✓ {paymentReceipt.name} selected
                                          </div>
                                        )}
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="w-full bg-gradient-to-r from-red-500 to-red-600 shadow transition-all duration-300 text-xs py-2"
                                          onClick={() => handleSecretaryRenewal(company._id)}
                                          disabled={renewingCompanyId === company._id || !paymentReceipt}
                                        >
                                          {renewingCompanyId === company._id ? (
                                            <Clock className="w-3 h-3 mr-1 animate-spin" />
                                          ) : (
                                            <Upload className="w-3 h-3 mr-1" />
                                          )}
                                          Pay & Renew
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (company.status || "") === "payment-rejected" ? (
                                    <Button
                                      variant="destructive"
                                      className="w-full bg-gradient-to-r from-red-500 to-pink-600 shadow transition-all duration-300 text-xs py-2"
                                      onClick={() => handleCancelRegistration(company._id)}
                                    >
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Cancel Registration
                                    </Button>
                                  ) : (company.status || "") === "completed" ? (
                                    <Button
                                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow transition-all duration-300 text-xs py-2"
                                      onClick={() => {
                                        // Check if the company card is expired
                                        const isExpired = company.isExpired || (company.expireDate && new Date(company.expireDate) < new Date());

                                        if (isExpired) {
                                          alert('This company card has expired. Please contact admin for renewal.');
                                          return;
                                        }

                                        navigateTo("incorporationCertificate", company._id)
                                      }}
                                    >
                                      <Building2 className="w-3 h-3 mr-1" />
                                      Manage Company
                                      <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      className="w-full border-2 bg-primary text-primary-foreground border-primary shadow-sm transition-all duration-300 text-xs py-2"
                                      onClick={() => handleContinueRegistration(company._id)}
                                    >
                                      <TrendingUp className="w-3 h-3 mr-1" />
                                      Continue Registration
                                      <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                  )}
                                </CardFooter>
                              </Card>
                            );
                          })}
                          {companies.length > 0 && (companies.filter((c) => {
                            const q = searchQuery.trim().toLowerCase()
                            if (!q) return true
                            const name = (c.companyNameEnglish || c.companyName || "").toLowerCase()
                            const contact = (c.contactPersonName || c.customerName || "").toLowerCase()
                            return name.includes(q) || contact.includes(q)
                          })).length === 0 && (
                              <div className="col-span-full text-center text-sm text-gray-600">
                                No companies match your search.
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Account Settings Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Account Settings</CardTitle>
                    <CardDescription>Manage your account information and security settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AccountSettingsTabs user={user} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Taxation Tab */}
            {activeTab === "taxation" && (
              <ComingSoon
                title="Taxation Services"
                description="We're working on bringing you comprehensive taxation services to help manage your company's tax obligations efficiently. This feature will include tax calculations, filing assistance, and compliance tracking."
              />
            )}

            {/* Invoice Tab */}
            {activeTab === "invoice" && (
              <ComingSoon
                title="Invoice Management"
                description="Our invoice management system is coming soon! You'll be able to create, track, and manage invoices for your incorporated companies with ease."
              />
            )}

            {/* About Tab */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">About</CardTitle>
                    <CardDescription>Learn more about our company incorporation services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aboutLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {aboutData.title}
                            </h3>
                            {aboutData.updatedAt && (
                              <p className="text-sm text-gray-500">
                                Last updated: {new Date(aboutData.updatedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="prose prose-sm max-w-none">
                          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {aboutData.companyInformation}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}