"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fileUploadClient } from "@/lib/file-upload-client";
import {
  CheckCircle,
  XCircle,
  X,
  Calendar,
  Clock,
  Mail,
  Phone,
  CreditCard,
  User,
  Briefcase,
  FileText,
  ArrowLeft,
  Eye,
  Download,
  FileCheck,
  Upload,
  RefreshCw,
  Shield,
  ShieldAlert,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";
import PaymentReceiptViewer from "./PaymentReceiptViewer";
import AccessSharingDialog from "./AccessSharingDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { canManageRegistrations, isAdmin } from "@/lib/auth-utils";
import { settingsStorage } from "@/lib/local-storage";
import { LocalStorageService } from "@/lib/database-service";
import type React from "react";
import type { User as UserType } from "@/lib/utils";
import { getPackageById, type Package } from "@/lib/package-utils";
import type { PackagePlan } from "@/components/admin/PackagesManager";
import { Progress } from "@/components/ui/progress";
import adminData from "@/lib/sri-lanka-admin-data.json";

type CompanyDetailsPageProps = {
  companyId: string;
  navigateTo: (page: string) => void;
  onApprovePayment: (companyId: string) => Promise<void>;
  onRejectPayment: (companyId: string) => Promise<void>;
  onApproveDetails: (companyId: string) => Promise<void>;
  onApproveDocuments: (companyId: string) => Promise<void>;
  user?: UserType; // Make user prop optional
};

// Using LocalStorageService for database operations

// Helper functions to convert location IDs to names for backward compatibility
const getProvinceName = (value: string): string => {
  if (!value) return value;
  // If it's already a name (contains space or starts with uppercase), return as is
  if (value.includes(" ") || /^[A-Z]/.test(value)) {
    return value;
  }
  // Otherwise, find by ID and return name
  const province = adminData.provinces.find((p) => p.id === value);
  return province ? province.name : value;
};

const getDistrictName = (value: string, provinceName?: string): string => {
  if (!value) return value;
  // If it's already a name (contains space or starts with uppercase), return as is
  if (value.includes(" ") || /^[A-Z]/.test(value)) {
    return value;
  }
  // Find by ID in the correct province
  let district;
  if (provinceName) {
    const province = adminData.provinces.find(
      (p) => p.name === provinceName || p.id === provinceName,
    );
    if (province) {
      district = province.districts.find((d) => d.id === value);
    }
  } else {
    // Fallback: search all provinces
    for (const province of adminData.provinces) {
      district = province.districts.find((d) => d.id === value);
      if (district) break;
    }
  }
  return district ? district.name : value;
};

const getDivisionalSecretariatName = (
  value: string,
  districtName?: string,
  provinceName?: string,
): string => {
  if (!value) return value;
  // Since divisionalSecretariats are stored as strings in the JSON, return the value as is
  return value;
};

const getGramaNiladhariDivisionName = (
  value: string,
  divisionalSecretariatName?: string,
  districtName?: string,
  provinceName?: string,
): string => {
  if (!value) return value;
  // Since gramaNiladhariDivisions are not in the JSON structure, return the value as is
  return value;
};

// DocumentUploadCard Component
const DocumentUploadCard = ({
  title,
  description,
  document,
  onUpload,
  onDelete,
  disabled,
  showReplace,
  isUploading: externalIsUploading,
  uploadProgress,
  isAnyUploadInProgress: globalUploadInProgress,
}: any) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputId = `${title.replace(/\s+/g, "-").toLowerCase()}-replace-upload`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external upload state if provided, otherwise use internal state
  const isCurrentlyUploading =
    externalIsUploading !== undefined ? externalIsUploading : isUploading;

  // Disable the card if this specific upload is in progress OR if any other upload is in progress
  const isCardDisabled =
    disabled || isCurrentlyUploading || globalUploadInProgress;

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Use the same style for all document cards, including Form 18, but with smaller size
  return (
    <Card
      className={document ? "border-green-200 bg-green-50/30" : "border-dashed"}
    >
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
        {/* Show signature requirement badge if document has signRequired property */}
        {document && document.signRequired !== undefined && (
          <Badge
            variant={document.signRequired ? "default" : "secondary"}
            className="mt-1 text-xs"
          >
            {document.signRequired
              ? "Signature Required"
              : "No Signature Required"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-3">
        {document ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center min-w-0">
              <FileText className="h-3 w-3 mr-1 text-green-500 flex-shrink-0" />
              <span className="text-xs truncate">{document.name}</span>
            </div>
            <div className="flex flex-wrap gap-1 items-center mt-1 sm:mt-0">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="text-xs">View</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Document Viewer - {title}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium">
                          <FileText className="h-4 w-4 inline mr-1" />
                          {document.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {document.size
                            ? `${(document.size / 1024).toFixed(2)} KB`
                            : ""}{" "}
                          • {document.type || "Unknown type"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (document.url) {
                            const link = window.document.createElement("a");
                            link.href = document.url;
                            link.download = document.name;
                            window.document.body.appendChild(link);
                            link.click();
                            window.document.body.removeChild(link);
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </div>
                    <div className="border rounded-md p-2 bg-muted/20">
                      {document.type?.startsWith("image/") ? (
                        <img
                          src={document.url || "/placeholder.svg"}
                          alt={document.name}
                          className="max-w-full h-auto mx-auto"
                          style={{ maxHeight: "70vh" }}
                        />
                      ) : document.type === "application/pdf" ? (
                        <div className="aspect-video">
                          <iframe
                            src={document.url || ""}
                            className="w-full h-full"
                            title="PDF Viewer"
                          ></iframe>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p>
                            This file type cannot be previewed. Please download
                            to view.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {showReplace && !isCardDisabled && (
                <>
                  <input
                    type="file"
                    id={fileInputId}
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isCardDisabled}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      fileInputRef.current && fileInputRef.current.click()
                    }
                    disabled={isCardDisabled}
                  >
                    Replace
                  </Button>
                </>
              )}
              {onDelete && !isCardDisabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onDelete}
                  disabled={isCardDisabled}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <input
              type="file"
              id={`${title}-upload`}
              className="hidden"
              onChange={handleFileChange}
              disabled={isCardDisabled}
            />
            <label
              htmlFor={`${title}-upload`}
              className={`w-full ${isCardDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Button
                variant="outline"
                asChild
                disabled={isCardDisabled}
                className="h-9 w-full text-xs"
              >
                <div className="flex items-center justify-center w-full">
                  {isCurrentlyUploading ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />{" "}
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" /> Upload {title}
                    </>
                  )}
                </div>
              </Button>
            </label>
            {isCurrentlyUploading && (
              <div className="mt-1 w-full">
                <Progress value={uploadProgress || 0} className="h-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {Math.round(uploadProgress || 0)}% complete
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function CompanyDetailsPage({
  companyId,
  navigateTo,
  onApprovePayment,
  onRejectPayment,
  onApproveDetails,
  onApproveDocuments,
  user,
}: CompanyDetailsPageProps) {
  const { toast } = useToast();
  const handleCopy = async (label: string, value?: string | number) => {
    try {
      if (!value && value !== 0) return;
      await navigator.clipboard.writeText(String(value));
      toast({ title: "Copied", description: `${label} copied to clipboard` });
    } catch (e) {
      toast({
        title: "Copy failed",
        description: "Unable to copy value",
        variant: "destructive",
      });
    }
  };

  // Small helper to render a label + copy button + value block consistently
  const FieldWithCopy = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => {
    if (value === undefined || value === null || value === "") return null;
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => handleCopy(label, value)}
            title={`Copy ${label}`}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-primary bg-primary/10 p-2 rounded-md">
          {String(value)}
        </p>
      </div>
    );
  };
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [viewStep, setViewStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [availablePackages, setAvailablePackages] = useState<PackagePlan[]>([]);
  const [documentsChanged, setDocumentsChanged] = useState(false);
  // New: Store pending documents before publishing
  const [pendingDocuments, setPendingDocuments] = useState<any>({});
  // New: Store pending step 4 documents (incorporation certificate and additional documents)
  const [pendingStep4Documents, setPendingStep4Documents] = useState<any>({});
  // New: Store pending step 3 additional documents
  const [pendingStep3Documents, setPendingStep3Documents] = useState<any>({});
  const [documentsSubmitted, setDocumentsSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [appTitle, setAppTitle] = useState("");
  const [signedResolutionFile, setSignedResolutionFile] = useState<File | null>(
    null,
  );
  const [uploadingSignedResolution, setUploadingSignedResolution] =
    useState(false);
  const [currentResolutionIndex, setCurrentResolutionIndex] = useState<
    number | null
  >(null);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [additionalDocumentTitle, setAdditionalDocumentTitle] = useState("");
  const [additionalDocumentFile, setAdditionalDocumentFile] =
    useState<File | null>(null);
  const [hideContinueToIncorporation, setHideContinueToIncorporation] =
    useState(false);
  const [isCompanyDetailsLocked, setIsCompanyDetailsLocked] = useState(false);
  const [isCompanyDetailsApproved, setIsCompanyDetailsApproved] =
    useState(false);
  const [isCompanyDetailsRejected, setIsCompanyDetailsRejected] =
    useState(false);
  const [isNicAttachmentViewerOpen, setIsNicAttachmentViewerOpen] = useState(false);

  // Reset the hide flag when switching companies or steps
  useEffect(() => {
    setHideContinueToIncorporation(false);
  }, [selectedCompany?._id, viewStep]);

  // Load lock, approval, and rejection status when company data is loaded (only on initial load)
  useEffect(() => {
    if (selectedCompany && selectedCompany._id) {
      console.log(
        "🔒 Loading initial lock status:",
        selectedCompany.companyDetailsLocked,
      );
      console.log(
        "✅ Loading initial approval status:",
        selectedCompany.companyDetailsApproved,
      );
      console.log(
        "❌ Loading initial rejection status:",
        selectedCompany.companyDetailsRejected,
      );
      setIsCompanyDetailsLocked(selectedCompany.companyDetailsLocked || false);
      setIsCompanyDetailsApproved(
        selectedCompany.companyDetailsApproved || false,
      );
      setIsCompanyDetailsRejected(
        selectedCompany.companyDetailsRejected || false,
      );
    }
  }, [selectedCompany?._id]); // Only depend on company ID, not the entire selectedCompany object

  // Determine persisted hide state per company (client-only)
  const isContinueHiddenPersisted =
    typeof window !== "undefined" && selectedCompany?._id
      ? localStorage.getItem(
        `hide-continue-incorporation:${selectedCompany._id}`,
      ) === "1"
      : false;

  // Add Document Dialog State for Step 3
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: "",
    file: null as File | null,
  });
  const [isSignRequired, setIsSignRequired] = useState(true);

  // Admin Corporate Records Submission State
  const [showAdminCorporateRecordsDialog, setShowAdminCorporateRecordsDialog] =
    useState(false);
  const [adminResolutionTitle, setAdminResolutionTitle] = useState("");
  const [adminResolutionDescription, setAdminResolutionDescription] =
    useState("");
  const [adminResolutionFiles, setAdminResolutionFiles] = useState<File[]>([]);
  const [adminIsSignRequired, setAdminIsSignRequired] = useState(true);
  const [uploadingAdminResolution, setUploadingAdminResolution] =
    useState(false);
  const [adminResolutionError, setAdminResolutionError] = useState(""); // Add this line for sign required toggle
  const [isUploadingNewDocument, setIsUploadingNewDocument] = useState(false);
  const [newDocumentUploadProgress, setNewDocumentUploadProgress] = useState(0);

  // Step 3 document upload progress states
  const [isUploadingForm1, setIsUploadingForm1] = useState(false);
  const [form1UploadProgress, setForm1UploadProgress] = useState(0);

  const [isUploadingForm19, setIsUploadingForm19] = useState(false);
  const [form19UploadProgress, setForm19UploadProgress] = useState(0);

  const [isUploadingAoa, setIsUploadingAoa] = useState(false);
  const [aoaUploadProgress, setAoaUploadProgress] = useState(0);

  const [isUploadingForm18, setIsUploadingForm18] = useState<{
    [key: number]: boolean;
  }>({});
  const [form18UploadProgress, setForm18UploadProgress] = useState<{
    [key: number]: number;
  }>({});

  // Step 3 additional document upload states
  const [isUploadingStep3AdditionalDoc, setIsUploadingStep3AdditionalDoc] =
    useState<{ [key: number]: boolean }>({});
  const [
    step3AdditionalDocUploadProgress,
    setStep3AdditionalDocUploadProgress,
  ] = useState<{ [key: number]: number }>({});

  // Global upload state to disable all other upload cards when any upload is in progress
  const [isAnyUploadInProgress, setIsAnyUploadInProgress] = useState(false);

  // Helper function to check if any upload is currently in progress
  const checkAnyUploadInProgress = () => {
    return (
      isUploadingForm1 ||
      isUploadingForm19 ||
      isUploadingAoa ||
      isUploadingNewDocument ||
      Object.values(isUploadingForm18).some((uploading) => uploading) ||
      Object.values(isUploadingStep3AdditionalDoc || {}).some(
        (uploading) => uploading,
      )
    );
  };

  // Update global upload state whenever any individual upload state changes
  useEffect(() => {
    const anyUploading = checkAnyUploadInProgress();
    setIsAnyUploadInProgress(anyUploading);
  }, [
    isUploadingForm1,
    isUploadingForm19,
    isUploadingAoa,
    isUploadingNewDocument,
    isUploadingForm18,
    isUploadingStep3AdditionalDoc,
  ]);

  // Step 4 additional document upload progress state
  const [isUploadingStep4Document, setIsUploadingStep4Document] =
    useState(false);
  const [step4DocumentUploadProgress, setStep4DocumentUploadProgress] =
    useState(0);

  // Step 4 incorporation certificate upload progress state
  const [
    isUploadingIncorporationCertificate,
    setIsUploadingIncorporationCertificate,
  ] = useState(false);
  const [
    incorporationCertificateUploadProgress,
    setIncorporationCertificateUploadProgress,
  ] = useState(0);

  // Expire date fields state
  const [registerStartDate, setRegisterStartDate] = useState("");
  const [expireDays, setExpireDays] = useState("");
  const [secretaryPeriodYear, setSecretaryPeriodYear] = useState("");
  const [isUpdatingExpireDate, setIsUpdatingExpireDate] = useState(false);
  // Collapsed/expanded state for admin Corporate Records list
  const [expandedCorporateRecords, setExpandedCorporateRecords] = useState<{
    [key: number]: boolean;
  }>({});
  // View filter for Corporate Records (admin view)
  const [corporateRecordsView, setCorporateRecordsView] = useState<
    "customer" | "admin"
  >("customer");

  // Store interval references to prevent conflicts during simultaneous uploads
  const progressIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Track balance payment approval status for enabling "Continue to Incorporation" button
  const [balancePaymentApproved, setBalancePaymentApproved] = useState(false);

  // Admin adjustment state
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>("");
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");
  // Edit mode state for step 2
  const [isEditingStep2, setIsEditingStep2] = useState(false);
  const [editedCompanyData, setEditedCompanyData] = useState<any>({});

  // Cleanup intervals on component unmount
  useEffect(() => {
    return () => {
      // Clear all progress intervals when component unmounts
      Object.values(progressIntervals.current).forEach((interval) => {
        clearInterval(interval);
      });
      progressIntervals.current = {};
    };
  }, []);
  // Track registration completion status to hide the complete button
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  // Track EROC marking in progress to prevent duplicate clicks
  const [isMarkingEroc, setIsMarkingEroc] = useState(false);
  // Access sharing state
  const [isAccessSharingDialogOpen, setIsAccessSharingDialogOpen] =
    useState(false);

  // Load app title from settings
  useEffect(() => {
    try {
      const settings = settingsStorage.getSettings();
      setAppTitle(settings?.title || "");
    } catch (error) {
      console.error("Error loading app title:", error);
      setAppTitle("");
    }
  }, []);

  // Check if user can manage registrations (admin only)
  const canManage = user ? canManageRegistrations(user) : false;

  // Debug: Log selectedCompany data
  useEffect(() => {
    if (selectedCompany) {
      console.log('🔍 selectedCompany data:', {
        id: selectedCompany._id,
        companyName: selectedCompany.companyName,
        companyNameEnglish: selectedCompany.companyNameEnglish,
        companyNameSinhala: selectedCompany.companyNameSinhala,
        hasCompanyNameEnglish: !!selectedCompany.companyNameEnglish,
        hasCompanyNameSinhala: !!selectedCompany.companyNameSinhala,
      });

      // Additional debugging for VPS environment
      console.log('🔍 Full selectedCompany object:', selectedCompany);
      console.log('🔍 typeof companyNameEnglish:', typeof selectedCompany.companyNameEnglish);
      console.log('🔍 typeof companyNameSinhala:', typeof selectedCompany.companyNameSinhala);
    }
  }, [selectedCompany]);

  useEffect(() => {
    // Load company data from database
    const loadCompanyData = async () => {
      try {
        console.log("🔍 Loading company data for admin view:", companyId);
        const registration =
          await LocalStorageService.getRegistrationById(companyId);
        console.log("🔍 Raw registration data from API:", registration);
        if (registration) {
          console.log("✅ Company data loaded:", registration);
          setSelectedCompany(registration);
          // Determine which step to show
          const activeStep = determineActiveStep(registration);
          setViewStep(activeStep);

          // Initialize balance payment approval state
          const isBalancePaymentApproved =
            registration.balancePaymentReceipt?.status === "approved";
          setBalancePaymentApproved(isBalancePaymentApproved);

          // Initialize company details approval/rejection states
          setIsCompanyDetailsRejected(
            registration.companyDetailsRejected || false,
          );
          setIsCompanyDetailsApproved(
            registration.companyDetailsApproved || false,
          );
          setIsCompanyDetailsLocked(registration.companyDetailsLocked || false);

          // Initialize documents submitted state
          const isDocumentsSubmitted =
            registration.status === "completed" ||
            registration.documentsSubmittedAt ||
            registration.incorporationCertificate;
          setDocumentsSubmitted(isDocumentsSubmitted);

          // Initialize registration completion state
          const isRegistrationCompleted = registration.status === "completed";
          setRegistrationCompleted(isRegistrationCompleted);

          // Initialize expire date fields
          setRegisterStartDate(registration.registerStartDate || "");
          setExpireDays(registration.expireDays || "");
          setSecretaryPeriodYear(registration.secretaryPeriodYear || "");
        } else {
          console.log(
            "⚠️ Company not found in database, trying localStorage fallback",
          );
          // Fallback to localStorage
          const savedRegistrations = localStorage.getItem("registrations");
          if (savedRegistrations) {
            const registrations = JSON.parse(savedRegistrations);
            const fallbackRegistration = registrations.find(
              (reg: any) => reg._id === companyId,
            );
            if (fallbackRegistration) {
              console.log("✅ Company found in localStorage fallback");
              setSelectedCompany(fallbackRegistration);
              const activeStep = determineActiveStep(fallbackRegistration);
              setViewStep(activeStep);
              const isBalancePaymentApproved =
                fallbackRegistration.balancePaymentReceipt?.status ===
                "approved";
              setBalancePaymentApproved(isBalancePaymentApproved);

              // Initialize company details approval/rejection states
              setIsCompanyDetailsRejected(
                fallbackRegistration.companyDetailsRejected || false,
              );
              setIsCompanyDetailsApproved(
                fallbackRegistration.companyDetailsApproved || false,
              );
              setIsCompanyDetailsLocked(
                fallbackRegistration.companyDetailsLocked || false,
              );

              // Initialize registration completion state
              const isRegistrationCompleted =
                fallbackRegistration.status === "completed";
              setRegistrationCompleted(isRegistrationCompleted);

              // Initialize documents submitted state
              const isDocumentsSubmitted =
                fallbackRegistration.status === "completed" ||
                fallbackRegistration.documentsSubmittedAt ||
                fallbackRegistration.incorporationCertificate;
              setDocumentsSubmitted(isDocumentsSubmitted);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error loading company data:", error);
        // Fallback to localStorage
        const savedRegistrations = localStorage.getItem("registrations");
        if (savedRegistrations) {
          const registrations = JSON.parse(savedRegistrations);
          const fallbackRegistration = registrations.find(
            (reg: any) => reg._id === companyId,
          );
          if (fallbackRegistration) {
            setSelectedCompany(fallbackRegistration);
            const activeStep = determineActiveStep(fallbackRegistration);
            setViewStep(activeStep);
            const isBalancePaymentApproved =
              fallbackRegistration.balancePaymentReceipt?.status === "approved";
            setBalancePaymentApproved(isBalancePaymentApproved);

            // Initialize documents submitted state
            const isDocumentsSubmitted =
              fallbackRegistration.status === "completed" ||
              fallbackRegistration.documentsSubmittedAt ||
              fallbackRegistration.incorporationCertificate;
            setDocumentsSubmitted(isDocumentsSubmitted);

            // Initialize registration completion state
            const isRegistrationCompleted =
              fallbackRegistration.status === "completed";
            setRegistrationCompleted(isRegistrationCompleted);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();

    // Load available packages from database with fallback to localStorage
    const loadPackages = async () => {
      try {
        // First try to load from database
        const packages = await LocalStorageService.getPackages();
        console.log("📦 Admin - Raw packages from database:", packages);
        if (packages && packages.length > 0) {
          setAvailablePackages(packages);
          console.log("✅ Loaded packages from database:", packages.length);
          console.log(
            "📦 Admin - Package details:",
            packages.map((pkg: any) => ({
              id: pkg.id,
              name: pkg.name,
              type: pkg.type,
            })),
          );
        } else {
          // Fallback to localStorage
          const savedPackages = localStorage.getItem("packages");
          if (savedPackages) {
            const packages = JSON.parse(savedPackages) as PackagePlan[];
            setAvailablePackages(packages);
            console.log(
              "📦 Loaded packages from localStorage fallback:",
              packages.length,
            );
          }
        }
      } catch (error) {
        console.error(
          "❌ Error loading packages from database, using localStorage:",
          error,
        );
        // Fallback to localStorage
        const savedPackages = localStorage.getItem("packages");
        if (savedPackages) {
          try {
            const packages = JSON.parse(savedPackages) as PackagePlan[];
            setAvailablePackages(packages);
            console.log(
              "📦 Loaded packages from localStorage fallback:",
              packages.length,
            );
          } catch (localError) {
            console.error(
              "❌ Error loading packages from localStorage:",
              localError,
            );
            setAvailablePackages([]);
          }
        }
      }
    };

    loadPackages();

    // Listen for updates to the registration data
    const handleRegistrationUpdate = async (event: any) => {
      console.log(
        "🔄 Registration update event received in admin view:",
        event.detail,
      );

      // Check if this update should prevent navigation
      const shouldPreventNavigation =
        event.detail && event.detail.preventNavigation;

      if (shouldPreventNavigation) {
        // Just reload the company data without resetting the view step
        try {
          const registration =
            await LocalStorageService.getRegistrationById(companyId);
          if (registration) {
            setSelectedCompany(registration);
            // Update balance payment approval state
            const isBalancePaymentApproved =
              registration.balancePaymentReceipt?.status === "approved";
            setBalancePaymentApproved(isBalancePaymentApproved);
            // Reset rejection/approval states when customer resubmits
            setIsCompanyDetailsRejected(
              registration.companyDetailsRejected || false,
            );
            setIsCompanyDetailsApproved(
              registration.companyDetailsApproved || false,
            );
            setIsCompanyDetailsLocked(
              registration.companyDetailsLocked || false,
            );
          }
        } catch (error) {
          console.error("❌ Error reloading company data:", error);
        }
      } else {
        // Special handling for EROC registration - prevent navigation and stay on same page
        if (event.detail && event.detail.type === "eroc-registered") {
          // Just reload the company data without changing the view step
          try {
            const registration =
              await LocalStorageService.getRegistrationById(companyId);
            if (registration) {
              setSelectedCompany(registration);
              // Update balance payment approval state
              const isBalancePaymentApproved =
                registration.balancePaymentReceipt?.status === "approved";
              setBalancePaymentApproved(isBalancePaymentApproved);
              // Reset rejection/approval states when customer resubmits
              setIsCompanyDetailsRejected(
                registration.companyDetailsRejected || false,
              );
              setIsCompanyDetailsApproved(
                registration.companyDetailsApproved || false,
              );
              setIsCompanyDetailsLocked(
                registration.companyDetailsLocked || false,
              );
            }
          } catch (error) {
            console.error(
              "❌ Error reloading company data for EROC registration:",
              error,
            );
          }
        } else {
          // Normal behavior - reload data and potentially change step
          loadCompanyData();

          // If payment was just approved, redirect to step 2
          if (event.detail && event.detail.type === "payment-approved") {
            setViewStep(2);
          }
        }
      }

      // Special handling for balance payment rejection - prevent admin navigation
      if (event.detail && event.detail.type === "balance-payment-rejected") {
        // Just update the company data without changing the view step
        try {
          const registration =
            await LocalStorageService.getRegistrationById(companyId);
          if (registration) {
            setSelectedCompany(registration);
            // Update balance payment approval state
            setBalancePaymentApproved(false);
          }
        } catch (error) {
          console.error(
            "❌ Error reloading company data for balance payment rejection:",
            error,
          );
        }
      }
    };

    window.addEventListener("registration-updated", handleRegistrationUpdate);

    return () => {
      window.removeEventListener(
        "registration-updated",
        handleRegistrationUpdate,
      );
    };
  }, [companyId]);

  // Function to determine the active step based on company status
  const determineActiveStep = (company: any) => {
    if (
      company.status === "payment-processing" ||
      company.status === "payment-rejected"
    ) {
      return 1;
    } else if (
      company.status === "documentation-processing" &&
      !company.detailsApproved
    ) {
      return 2;
    } else if (
      company.status === "incorporation-processing" &&
      !company.documentsApproved
    ) {
      return 3;
    } else if (company.status === "documents-published") {
      return 3; // Stay on step 3 when documents are published
    } else if (
      company.status === "documents-submitted" ||
      company.status === "incorporation-processing" ||
      company.status === "completed"
    ) {
      return 4;
    }
    return 1; // Default to step 1
  };

  // Function to get package information with enhanced price display
  const getPackageInfo = (selectedPackage: string) => {
    // First try to find in available packages (from database)
    let pkgObj = availablePackages.find(
      (pkg: any) => pkg.name === selectedPackage || pkg.id === selectedPackage,
    );

    // Fallback to localStorage if not found
    if (!pkgObj) {
      try {
        const pkgs =
          typeof window !== "undefined"
            ? localStorage.getItem("packages")
            : null;
        if (pkgs) {
          const allPackages = JSON.parse(pkgs);
          pkgObj = allPackages.find(
            (p: any) => p.name === selectedPackage || p.id === selectedPackage,
          );
        }
      } catch (error) {
        console.error("Error loading packages from localStorage:", error);
      }
    }

    return pkgObj;
  };

  // Function to render status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment-processing":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Payment Processing
          </Badge>
        );
      case "payment-rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Payment Rejected
          </Badge>
        );
      case "documentation-processing":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            Documentation Processing
          </Badge>
        );
      case "incorporation-processing":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200"
          >
            Incorporation Processing
          </Badge>
        );
      case "documents-submitted":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            Documents Submitted
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Completed
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Payment Processing
          </Badge>
        );
    }
  };

  // Function to render step status
  const renderStepStatus = (
    step: number,
    activeStep: number,
    status: string,
  ) => {
    if (step < activeStep) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
          <CheckCircle className="h-5 w-5" />
        </div>
      );
    } else if (step === activeStep) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
          {step}
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
          {step}
        </div>
      );
    }
  };

  // Function to render editable director information
  const renderEditableDirectorInfo = (director: any, index: number) => {
    if (!director) return null;

    // Get current edited director data
    const editedDirector = editedCompanyData.directors?.[index] || director;

    // Function to update director data
    const updateDirector = (field: string, value: any) => {
      const updatedDirectors = [...(editedCompanyData.directors || selectedCompany.directors)];
      updatedDirectors[index] = { ...updatedDirectors[index], [field]: value };
      setEditedCompanyData({ ...editedCompanyData, directors: updatedDirectors });
    };

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            Director {index + 1}{" "}
            {director.fromShareholder && (
              <Badge className="ml-2 text-xs">Shareholder</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {director.residency === "sri-lankan"
              ? "Sri Lankan Resident"
              : "Foreign Resident"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {director.residency === "foreign" ? (
              <>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Passport No</Label>
                  <Input
                    value={editedDirector.passportNo || ""}
                    onChange={(e) => updateDirector("passportNo", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Passport Issued Country</Label>
                  <Input
                    value={editedDirector.passportIssuedCountry || ""}
                    onChange={(e) => updateDirector("passportIssuedCountry", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Full Name</Label>
                  <Input
                    value={editedDirector.fullName || ""}
                    onChange={(e) => updateDirector("fullName", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Country</Label>
                  <Input
                    value={editedDirector.country || ""}
                    onChange={(e) => updateDirector("country", e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Full Name</Label>
                  <Input
                    value={editedDirector.fullName || ""}
                    onChange={(e) => updateDirector("fullName", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1">NIC Number</Label>
                  <Input
                    value={editedDirector.nicNumber || ""}
                    onChange={(e) => updateDirector("nicNumber", e.target.value)}
                  />
                </div>
              </>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1">Email</Label>
              <Input
                value={editedDirector.email || ""}
                onChange={(e) => updateDirector("email", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1">Contact Number</Label>
              <Input
                value={editedDirector.contactNumber || ""}
                onChange={(e) => updateDirector("contactNumber", e.target.value)}
              />
            </div>
          </div>

          {/* Address Information - Only show if director is NOT from shareholder */}
          {!director.fromShareholder && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Local Address Section */}
              <div>
                <h5 className="text-sm font-medium mb-3">
                  Director Address Information (Local Address)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground mb-1">Full Address with Address Number</Label>
                    <Input
                      value={editedDirector.fullAddress || ""}
                      onChange={(e) => updateDirector("fullAddress", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1">Postal code</Label>
                    <Input
                      value={editedDirector.localPostalCode || ""}
                      onChange={(e) => updateDirector("localPostalCode", e.target.value)}
                    />
                  </div>
                  {/* Administrative Location Information */}
                  <div className="sm:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-1">Province</Label>
                        <Input
                          value={editedDirector.province || ""}
                          onChange={(e) => updateDirector("province", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-1">District</Label>
                        <Input
                          value={editedDirector.district || ""}
                          onChange={(e) => updateDirector("district", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-1">Divisional Secretariat</Label>
                        <Input
                          value={editedDirector.divisionalSecretariat || ""}
                          onChange={(e) => updateDirector("divisionalSecretariat", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-1">Grama Niladhari Division</Label>
                        <Input
                          value={editedDirector.gramaNiladhariDivision || ""}
                          onChange={(e) => updateDirector("gramaNiladhariDivision", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foreign Address Section */}
              <div>
                <h5 className="text-sm font-medium mb-3">
                  Director Address Information (Foreign Address)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground mb-1">Address</Label>
                    <Input
                      value={editedDirector.foreignAddress || ""}
                      onChange={(e) => updateDirector("foreignAddress", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1">City</Label>
                    <Input
                      value={editedDirector.city || ""}
                      onChange={(e) => updateDirector("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1">State/Region/Province</Label>
                    <Input
                      value={editedDirector.stateRegionProvince || ""}
                      onChange={(e) => updateDirector("stateRegionProvince", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1">Postal Code</Label>
                    <Input
                      value={editedDirector.foreignPostalCode || ""}
                      onChange={(e) => updateDirector("foreignPostalCode", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Function to render shareholder information
  const renderEditableShareholderInfo = (shareholder: any, index: number) => {
    if (!shareholder) return null;

    const isNaturalPerson = shareholder.type === "natural-person";
    const isLegalEntity = shareholder.type === "legal-entity";
    const isSriLankan = shareholder.residency === "sri-lankan";
    const isForeign = shareholder.residency === "foreign";

    // Get current edited shareholder data
    const editedShareholder = editedCompanyData.shareholders?.[index] || shareholder;

    // Function to update shareholder data
    const updateShareholder = (field: string, value: any) => {
      const updatedShareholders = [...(editedCompanyData.shareholders || selectedCompany.shareholders)];
      updatedShareholders[index] = { ...updatedShareholders[index], [field]: value };
      setEditedCompanyData({ ...editedCompanyData, shareholders: updatedShareholders });
    };

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <User className="h-4 w-4 mr-2 text-primary" />
            Shareholder {index + 1}
          </CardTitle>
          <CardDescription>
            {isNaturalPerson ? "Natural Person" : "Legal Entity(Firm)"} •
            {isSriLankan ? " Sri Lankan Resident" : " Foreign Resident"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Natural Person fields */}
            {isNaturalPerson && (
              <>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Full Name</Label>
                  <Input
                    value={editedShareholder.fullName || ""}
                    onChange={(e) => updateShareholder("fullName", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1">
                    {isSriLankan ? "NIC Number" : "Passport No"}
                  </Label>
                  <Input
                    value={
                      isSriLankan
                        ? editedShareholder.nicNumber || ""
                        : editedShareholder.passportNo || ""
                    }
                    onChange={(e) =>
                      updateShareholder(isSriLankan ? "nicNumber" : "passportNo", e.target.value)
                    }
                  />
                </div>
                {isForeign && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground mb-1">Passport Issued Country</Label>
                      <Input
                        value={editedShareholder.passportIssuedCountry || ""}
                        onChange={(e) => updateShareholder("passportIssuedCountry", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground mb-1">Country</Label>
                      <Input
                        value={editedShareholder.country || ""}
                        onChange={(e) => updateShareholder("country", e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Legal Entity fields */}
            {isLegalEntity && (
              <>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Company Name</Label>
                  <Input
                    value={editedShareholder.companyName || ""}
                    onChange={(e) => updateShareholder("companyName", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Company Registration Number</Label>
                  <Input
                    value={editedShareholder.companyRegistrationNumber || ""}
                    onChange={(e) => updateShareholder("companyRegistrationNumber", e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Common fields */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1">Email</Label>
              <Input
                value={editedShareholder.email || ""}
                onChange={(e) => updateShareholder("email", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1">Contact Number</Label>
              <Input
                value={editedShareholder.contactNumber || ""}
                onChange={(e) => updateShareholder("contactNumber", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1">Is Director</Label>
              <Select
                value={editedShareholder.isDirector ? "yes" : "no"}
                onValueChange={(value) => updateShareholder("isDirector", value === "yes")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1">Share Percentage</Label>
              <Input
                value={editedShareholder.shares || ""}
                onChange={(e) => updateShareholder("shares", e.target.value)}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="mt-4 pt-4 border-t">
            <h5 className="text-sm font-medium mb-3">
              {isLegalEntity
                ? "Legal Entity Address Information"
                : isForeign
                  ? "Foreign Shareholder Address Information"
                  : "Shareholder Address Information"}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1">Address</Label>
                <Input
                  value={editedShareholder.fullAddress || ""}
                  onChange={(e) => updateShareholder("fullAddress", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1">Postal Code</Label>
                <Input
                  value={editedShareholder.postalCode || ""}
                  onChange={(e) => updateShareholder("postalCode", e.target.value)}
                />
              </div>

              {/* Sri Lankan Address Fields */}
              {isSriLankan &&
                !isLegalEntity && (
                  <div className="sm:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-1">Province</Label>
                        <Input
                          value={editedShareholder.province || ""}
                          onChange={(e) => updateShareholder("province", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-1">District</Label>
                        <Input
                          value={editedShareholder.district || ""}
                          onChange={(e) => updateShareholder("district", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-1">Divisional Secretariat</Label>
                        <Input
                          value={editedShareholder.divisionalSecretariat || ""}
                          onChange={(e) => updateShareholder("divisionalSecretariat", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* Foreign/Legal Entity Address Fields */}
              {((isForeign && !isLegalEntity) || isLegalEntity) && (
                <div className="sm:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground mb-1">City</Label>
                      <Input
                        value={editedShareholder.city || ""}
                        onChange={(e) => updateShareholder("city", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground mb-1">State/Region/Province</Label>
                      <Input
                        value={editedShareholder.stateRegionProvince || ""}
                        onChange={(e) => updateShareholder("stateRegionProvince", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Beneficiary Owners Section - Only for Legal Entities */}
          {isLegalEntity &&
            editedShareholder.beneficiaryOwners &&
            editedShareholder.beneficiaryOwners.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  Details of Beneficiary Owner(s)
                </h5>
                <div className="space-y-4">
                  {editedShareholder.beneficiaryOwners.map(
                    (beneficiary: any, beneficiaryIndex: number) => (
                      <Card
                        key={beneficiaryIndex}
                        className="border-dashed border-2"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            Beneficiary Owner {beneficiaryIndex + 1} - {beneficiary.type === "local" ? "Local" : "Foreign"} Person
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {beneficiary.type === "local" ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">NIC No</Label>
                                  <Input
                                    value={beneficiary.nicNumber || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], nicNumber: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">First Name</Label>
                                  <Input
                                    value={beneficiary.firstName || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], firstName: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Last Name</Label>
                                  <Input
                                    value={beneficiary.lastName || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], lastName: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Email Address</Label>
                                  <Input
                                    value={beneficiary.emailAddress || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], emailAddress: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Contact Number</Label>
                                  <Input
                                    value={beneficiary.contactNumber || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], contactNumber: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <h6 className="text-sm font-medium mb-2">Local Address</h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-1">Address</Label>
                                    <Input
                                      value={beneficiary.address || ""}
                                      onChange={(e) => {
                                        const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                        updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], address: e.target.value };
                                        updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-1">Postal Code</Label>
                                    <Input
                                      value={beneficiary.postalCode || ""}
                                      onChange={(e) => {
                                        const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                        updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], postalCode: e.target.value };
                                        updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-1">Province</Label>
                                    <Input
                                      value={beneficiary.province || ""}
                                      onChange={(e) => {
                                        const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                        updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], province: e.target.value };
                                        updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-1">District</Label>
                                    <Input
                                      value={beneficiary.district || ""}
                                      onChange={(e) => {
                                        const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                        updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], district: e.target.value };
                                        updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-1">Divisional Secretariat</Label>
                                    <Input
                                      value={beneficiary.divisionalSecretariat || ""}
                                      onChange={(e) => {
                                        const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                        updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], divisionalSecretariat: e.target.value };
                                        updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Passport No</Label>
                                  <Input
                                    value={beneficiary.passportNo || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], passportNo: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">First Name</Label>
                                  <Input
                                    value={beneficiary.firstName || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], firstName: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Last Name</Label>
                                  <Input
                                    value={beneficiary.lastName || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], lastName: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Country</Label>
                                  <Input
                                    value={beneficiary.country || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], country: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Email Address</Label>
                                  <Input
                                    value={beneficiary.emailAddress || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], emailAddress: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Contact Number</Label>
                                  <Input
                                    value={beneficiary.contactNumber || ""}
                                    onChange={(e) => {
                                      const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                      updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], contactNumber: e.target.value };
                                      updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <h6 className="text-sm font-medium mb-2">Foreign Address</h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-1">Address</Label>
                                    <Input
                                      value={beneficiary.foreignAddress || ""}
                                      onChange={(e) => {
                                        const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                        updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], foreignAddress: e.target.value };
                                        updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-1">City</Label>
                                    <Input
                                      value={beneficiary.city || ""}
                                      onChange={(e) => {
                                        const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                        updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], city: e.target.value };
                                        updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-1">State/Region/Province</Label>
                                    <Input
                                      value={beneficiary.stateRegionProvince || ""}
                                      onChange={(e) => {
                                        const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                        updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], stateRegionProvince: e.target.value };
                                        updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-1">Postal Code</Label>
                                    <Input
                                      value={beneficiary.postalCode || ""}
                                      onChange={(e) => {
                                        const updatedBeneficiaries = [...editedShareholder.beneficiaryOwners];
                                        updatedBeneficiaries[beneficiaryIndex] = { ...updatedBeneficiaries[beneficiaryIndex], postalCode: e.target.value };
                                        updateShareholder("beneficiaryOwners", updatedBeneficiaries);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ),
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    );
  };

  const renderShareholderInfo = (shareholder: any, index: number) => {
    if (!shareholder) return null;

    const isNaturalPerson = shareholder.type === "natural-person";
    const isLegalEntity = shareholder.type === "legal-entity";
    const isSriLankan = shareholder.residency === "sri-lankan";
    const isForeign = shareholder.residency === "foreign";

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <User className="h-4 w-4 mr-2 text-primary" />
            Shareholder {index + 1}
          </CardTitle>
          <CardDescription>
            {isNaturalPerson ? "Natural Person" : "Legal Entity(Firm)"} •
            {isSriLankan ? " Sri Lankan Resident" : " Foreign Resident"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Natural Person fields */}
            {isNaturalPerson && (
              <>
                <FieldWithCopy
                  label="Full Name"
                  value={shareholder.fullName || "N/A"}
                />
                <FieldWithCopy
                  label={isSriLankan ? "NIC Number" : "Passport No"}
                  value={
                    isSriLankan
                      ? shareholder.nicNumber
                      : shareholder.passportNo || "N/A"
                  }
                />
                {isForeign && shareholder.passportIssuedCountry && (
                  <FieldWithCopy
                    label="Passport Issued Country"
                    value={shareholder.passportIssuedCountry}
                  />
                )}
                {isForeign && shareholder.country && (
                  <FieldWithCopy label="Country" value={shareholder.country} />
                )}
              </>
            )}

            {/* Legal Entity fields */}
            {isLegalEntity && (
              <>
                <FieldWithCopy
                  label="Company Name"
                  value={shareholder.companyName || "N/A"}
                />
                <FieldWithCopy
                  label="Company Registration Number"
                  value={shareholder.companyRegistrationNumber || "N/A"}
                />
              </>
            )}

            {/* Common fields */}
            <FieldWithCopy label="Email" value={shareholder.email || "N/A"} />
            <FieldWithCopy
              label="Contact Number"
              value={shareholder.contactNumber || "N/A"}
            />
            <FieldWithCopy
              label="Is Director"
              value={shareholder.isDirector ? "Yes" : "No"}
            />
            <FieldWithCopy
              label="Share Percentage"
              value={shareholder.shares || "N/A"}
            />
          </div>

          {/* Address Information */}
          {((isSriLankan &&
            (shareholder.province ||
              shareholder.district ||
              shareholder.divisionalSecretariat ||
              shareholder.fullAddress ||
              shareholder.postalCode)) ||
            (isForeign &&
              (shareholder.fullAddress ||
                shareholder.city ||
                shareholder.stateRegionProvince ||
                shareholder.postalCode)) ||
            (isLegalEntity &&
              (shareholder.fullAddress ||
                shareholder.city ||
                shareholder.stateRegionProvince ||
                shareholder.postalCode))) && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium mb-3">
                  {isLegalEntity
                    ? "Legal Entity Address Information"
                    : isForeign
                      ? "Foreign Shareholder Address Information"
                      : "Shareholder Address Information"}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shareholder.fullAddress && (
                    <FieldWithCopy
                      label="Address"
                      value={shareholder.fullAddress}
                    />
                  )}
                  {shareholder.postalCode && (
                    <FieldWithCopy
                      label="Postal Code"
                      value={shareholder.postalCode}
                    />
                  )}

                  {/* Sri Lankan Address Fields */}
                  {isSriLankan &&
                    !isLegalEntity &&
                    (shareholder.province ||
                      shareholder.district ||
                      shareholder.divisionalSecretariat) && (
                      <div className="sm:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {shareholder.province && (
                            <FieldWithCopy
                              label="Province"
                              value={shareholder.province}
                            />
                          )}
                          {shareholder.district && (
                            <FieldWithCopy
                              label="District"
                              value={shareholder.district}
                            />
                          )}
                          {shareholder.divisionalSecretariat && (
                            <FieldWithCopy
                              label="Divisional Secretariat"
                              value={shareholder.divisionalSecretariat}
                            />
                          )}
                        </div>
                      </div>
                    )}

                  {/* Foreign/Legal Entity Address Fields */}
                  {((isForeign && !isLegalEntity) || isLegalEntity) &&
                    (shareholder.city || shareholder.stateRegionProvince) && (
                      <div className="sm:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {shareholder.city && (
                            <FieldWithCopy
                              label="City"
                              value={shareholder.city}
                            />
                          )}
                          {shareholder.stateRegionProvince && (
                            <FieldWithCopy
                              label="State/Region/Province"
                              value={shareholder.stateRegionProvince}
                            />
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

          {/* Beneficiary Owners Section - Only for Legal Entities */}
          {isLegalEntity &&
            shareholder.beneficiaryOwners &&
            shareholder.beneficiaryOwners.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  Details of Beneficiary Owner(s)
                </h5>
                <div className="space-y-4">
                  {shareholder.beneficiaryOwners.map(
                    (beneficiary: any, beneficiaryIndex: number) => (
                      <Card
                        key={beneficiaryIndex}
                        className="border-dashed border-2"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            Beneficiary Owner {beneficiaryIndex + 1} -{" "}
                            {beneficiary.type === "local" ? "Local" : "Foreign"}{" "}
                            Person
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {beneficiary.type === "local" ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    NIC No
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.nicNumber || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    First Name
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.firstName || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Last Name
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.lastName || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Email Address
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.emailAddress || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Contact Number
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.contactNumber || "N/A"}
                                  </p>
                                </div>
                              </div>
                              {(beneficiary.province ||
                                beneficiary.district ||
                                beneficiary.divisionalSecretariat ||
                                beneficiary.address ||
                                beneficiary.postalCode) && (
                                  <div>
                                    <h6 className="text-sm font-medium mb-2">
                                      Local Address
                                    </h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {beneficiary.address && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Address
                                          </p>
                                          <p className="text-primary bg-primary/10 p-2 rounded-md">
                                            {beneficiary.address}
                                          </p>
                                        </div>
                                      )}
                                      {beneficiary.postalCode && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Postal Code
                                          </p>
                                          <p className="text-primary bg-primary/10 p-2 rounded-md">
                                            {beneficiary.postalCode}
                                          </p>
                                        </div>
                                      )}
                                      {beneficiary.province && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Province
                                          </p>
                                          <p className="text-primary bg-primary/10 p-2 rounded-md">
                                            {beneficiary.province}
                                          </p>
                                        </div>
                                      )}
                                      {beneficiary.district && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            District
                                          </p>
                                          <p className="text-primary bg-primary/10 p-2 rounded-md">
                                            {beneficiary.district}
                                          </p>
                                        </div>
                                      )}
                                      {beneficiary.divisionalSecretariat && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Divisional Secretariat
                                          </p>
                                          <p className="text-primary bg-primary/10 p-2 rounded-md">
                                            {beneficiary.divisionalSecretariat}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Passport No
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.passportNo || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    First Name
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.firstName || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Last Name
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.lastName || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Country
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.country || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Email Address
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.emailAddress || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Contact Number
                                  </p>
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {beneficiary.contactNumber || "N/A"}
                                  </p>
                                </div>
                              </div>
                              {(beneficiary.foreignAddress ||
                                beneficiary.city ||
                                beneficiary.stateRegionProvince ||
                                beneficiary.postalCode) && (
                                  <div>
                                    <h6 className="text-sm font-medium mb-2">
                                      Foreign Address
                                    </h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {beneficiary.foreignAddress && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Address
                                          </p>
                                          <p className="text-primary bg-primary/10 p-2 rounded-md">
                                            {beneficiary.foreignAddress}
                                          </p>
                                        </div>
                                      )}
                                      {beneficiary.city && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            City
                                          </p>
                                          <p className="text-primary bg-primary/10 p-2 rounded-md">
                                            {beneficiary.city}
                                          </p>
                                        </div>
                                      )}
                                      {beneficiary.stateRegionProvince && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            State/Region/Province
                                          </p>
                                          <p className="text-primary bg-primary/10 p-2 rounded-md">
                                            {beneficiary.stateRegionProvince}
                                          </p>
                                        </div>
                                      )}
                                      {beneficiary.postalCode && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Postal Code
                                          </p>
                                          <p className="text-primary bg-primary/10 p-2 rounded-md">
                                            {beneficiary.postalCode}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ),
                  )}
                </div>
              </div>
            )}

          {shareholder.documents && shareholder.documents.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="text-sm font-medium mb-2">Uploaded Documents</h5>
              <div className="space-y-2">
                {shareholder.documents.map((doc: any, docIndex: number) => (
                  <div
                    key={docIndex}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                  >
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-primary">{doc.name}</span>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Document Viewer</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm font-medium">
                                <FileText className="h-4 w-4 inline mr-1" />
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {doc.size
                                  ? `${(doc.size / 1024).toFixed(2)} KB`
                                  : ""}{" "}
                                • {doc.type || "Unknown type"}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (doc.url) {
                                  const link = window.document.createElement("a");
                                  link.href = doc.url;
                                  link.download = doc.name;
                                  window.document.body.appendChild(link);
                                  link.click();
                                  window.document.body.removeChild(link);
                                } else if (doc.data) {
                                  const blob = new Blob([doc.data], {
                                    type:
                                      doc.type || "application/octet-stream",
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const link = window.document.createElement("a");
                                  link.href = url;
                                  link.download = doc.name;
                                  window.document.body.appendChild(link);
                                  link.click();
                                  window.document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                }
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                          </div>

                          <div className="border rounded-md p-2 bg-muted/20">
                            {doc.type?.startsWith("image/") ? (
                              <img
                                src={
                                  doc.url ||
                                  (doc.data
                                    ? URL.createObjectURL(
                                      new Blob([doc.data], {
                                        type: doc.type,
                                      }),
                                    )
                                    : "/placeholder.svg")
                                }
                                alt={doc.name}
                                className="max-w-full h-auto mx-auto"
                                style={{ maxHeight: "70vh" }}
                              />
                            ) : doc.type === "application/pdf" ? (
                              <div className="aspect-video">
                                <iframe
                                  src={
                                    doc.url ||
                                    (doc.data
                                      ? URL.createObjectURL(
                                        new Blob([doc.data], {
                                          type: doc.type,
                                        }),
                                      )
                                      : "")
                                  }
                                  className="w-full h-full"
                                  title="PDF Viewer"
                                ></iframe>
                              </div>
                            ) : (
                              <div className="p-8 text-center">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p>
                                  This file type cannot be previewed. Please
                                  download to view.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Function to render director information
  const renderDirectorInfo = (director: any, index: number) => {
    if (!director) return null;

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            Director {index + 1}{" "}
            {director.fromShareholder && (
              <Badge className="ml-2 text-xs">Shareholder</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {director.residency === "sri-lankan"
              ? "Sri Lankan Resident"
              : "Foreign Resident"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {director.residency === "foreign" ? (
              <>
                <div className="col-span-2">
                  <FieldWithCopy
                    label="Passport No"
                    value={director.passportNo || "N/A"}
                  />
                </div>
                <div className="col-span-2">
                  <FieldWithCopy
                    label="Passport Issued Country"
                    value={director.passportIssuedCountry || "N/A"}
                  />
                </div>
                <div className="col-span-2">
                  <FieldWithCopy
                    label="Full Name"
                    value={director.fullName || "N/A"}
                  />
                </div>
                <div className="col-span-2">
                  <FieldWithCopy
                    label="Country"
                    value={director.country || "N/A"}
                  />
                </div>
              </>
            ) : (
              <>
                <FieldWithCopy
                  label="Full Name"
                  value={director.fullName || "N/A"}
                />
                <FieldWithCopy
                  label="NIC Number"
                  value={director.nicNumber || "N/A"}
                />
              </>
            )}
            <FieldWithCopy label="Email" value={director.email} />
            <FieldWithCopy
              label="Contact Number"
              value={director.contactNumber}
            />
          </div>

          {/* Address Information - Only show if director is NOT from shareholder */}
          {!director.fromShareholder &&
            (director.province ||
              director.district ||
              director.divisionalSecretariat ||
              director.gramaNiladhariDivision ||
              director.fullAddress ||
              director.localPostalCode ||
              director.foreignAddress ||
              director.city ||
              director.stateRegionProvince ||
              director.foreignPostalCode) && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {/* Local Address Section */}
                {(director.fullAddress ||
                  director.localPostalCode ||
                  director.province ||
                  director.district ||
                  director.divisionalSecretariat) && (
                    <div>
                      <h5 className="text-sm font-medium mb-3">
                        Director Address Information (Local Address)
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {director.fullAddress && (
                          <FieldWithCopy
                            label="Full Address with Address Number"
                            value={director.fullAddress}
                          />
                        )}
                        {director.localPostalCode && (
                          <FieldWithCopy
                            label="Postal code"
                            value={director.localPostalCode}
                          />
                        )}
                        {/* Administrative Location Information - Same Line */}
                        {(director.province ||
                          director.district ||
                          director.divisionalSecretariat ||
                          director.gramaNiladhariDivision) && (
                            <div className="sm:col-span-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {director.province && (
                                  <FieldWithCopy
                                    label="Province"
                                    value={getProvinceName(director.province)}
                                  />
                                )}
                                {director.district && (
                                  <FieldWithCopy
                                    label="District"
                                    value={getDistrictName(
                                      director.district,
                                      getProvinceName(director.province),
                                    )}
                                  />
                                )}
                                {director.divisionalSecretariat && (
                                  <FieldWithCopy
                                    label="Divisional Secretariat"
                                    value={getDivisionalSecretariatName(
                                      director.divisionalSecretariat,
                                      getDistrictName(
                                        director.district,
                                        getProvinceName(director.province),
                                      ),
                                      getProvinceName(director.province),
                                    )}
                                  />
                                )}
                                {director.gramaNiladhariDivision && (
                                  <FieldWithCopy
                                    label="Grama Niladhari Division"
                                    value={getGramaNiladhariDivisionName(
                                      director.gramaNiladhariDivision,
                                      getDivisionalSecretariatName(
                                        director.divisionalSecretariat,
                                        getDistrictName(
                                          director.district,
                                          getProvinceName(director.province),
                                        ),
                                        getProvinceName(director.province),
                                      ),
                                      getDistrictName(
                                        director.district,
                                        getProvinceName(director.province),
                                      ),
                                      getProvinceName(director.province),
                                    )}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                {/* Foreign Address Section */}
                {(director.foreignAddress ||
                  director.city ||
                  director.stateRegionProvince ||
                  director.foreignPostalCode) && (
                    <div>
                      <h5 className="text-sm font-medium mb-3">
                        Director Address Information (Foreign Address)
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {director.foreignAddress && (
                          <div className="sm:col-span-2">
                            <FieldWithCopy
                              label="Address"
                              value={director.foreignAddress}
                            />
                          </div>
                        )}
                        {director.city && (
                          <FieldWithCopy label="City" value={director.city} />
                        )}
                        {director.stateRegionProvince && (
                          <FieldWithCopy
                            label="State/Region/Province"
                            value={director.stateRegionProvince}
                          />
                        )}
                        {director.foreignPostalCode && (
                          <FieldWithCopy
                            label="Postal Code"
                            value={director.foreignPostalCode}
                          />
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

          {!director.fromShareholder &&
            director.documents &&
            director.documents.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Uploaded Documents</h5>
                <div className="space-y-2">
                  {director.documents.map((doc: any, docIndex: number) => (
                    <div
                      key={docIndex}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-primary">{doc.name}</span>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Document Viewer</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-sm font-medium">
                                  <FileText className="h-4 w-4 inline mr-1" />
                                  {doc.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.size
                                    ? `${(doc.size / 1024).toFixed(2)} KB`
                                    : ""}{" "}
                                  • {doc.type || "Unknown type"}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (doc.url) {
                                    const link = window.document.createElement("a");
                                    link.href = doc.url;
                                    link.download = doc.name;
                                    window.document.body.appendChild(link);
                                    link.click();
                                    window.document.body.removeChild(link);
                                  } else if (doc.data) {
                                    const blob = new Blob([doc.data], {
                                      type:
                                        doc.type || "application/octet-stream",
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const link = window.document.createElement("a");
                                    link.href = url;
                                    link.download = doc.name;
                                    window.document.body.appendChild(link);
                                    link.click();
                                    window.document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" /> Download
                              </Button>
                            </div>

                            <div className="border rounded-md p-2 bg-muted/20">
                              {doc.type?.startsWith("image/") ? (
                                <img
                                  src={
                                    doc.url ||
                                    (doc.data
                                      ? URL.createObjectURL(
                                        new Blob([doc.data], {
                                          type: doc.type,
                                        }),
                                      )
                                      : "/placeholder.svg")
                                  }
                                  alt={doc.name}
                                  className="max-w-full h-auto mx-auto"
                                  style={{ maxHeight: "70vh" }}
                                />
                              ) : doc.type === "application/pdf" ? (
                                <div className="aspect-video">
                                  <iframe
                                    src={
                                      doc.url ||
                                      (doc.data
                                        ? URL.createObjectURL(
                                          new Blob([doc.data], {
                                            type: doc.type,
                                          }),
                                        )
                                        : "")
                                    }
                                    className="w-full h-full"
                                    title="PDF Viewer"
                                  ></iframe>
                                </div>
                              ) : (
                                <div className="p-8 text-center">
                                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                  <p>
                                    This file type cannot be previewed. Please
                                    download to view.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    );
  };
  // Function to handle document upload
  const handleDocumentUpload = async (
    companyId: string,
    documentType: string,
    file: File,
    index?: number,
  ) => {
    try {
      // For incorporation certificate and step 3 documents, immediately upload to file storage and database
      console.log(
        `📁 Admin - Immediately uploading document: ${documentType}, file: ${file.name}`,
      );

      // Set upload state and progress for step 3 and step 4 documents
      if (documentType === "incorporationCertificate") {
        setIsUploadingIncorporationCertificate(true);
        setIncorporationCertificateUploadProgress(0);

        // Clear any existing interval for this document type
        if (progressIntervals.current[documentType]) {
          clearInterval(progressIntervals.current[documentType]);
        }

        const progressInterval = setInterval(() => {
          setIncorporationCertificateUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              delete progressIntervals.current[documentType];
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        // Store the interval reference
        progressIntervals.current[documentType] = progressInterval;
      } else if (documentType === "form1") {
        setIsUploadingForm1(true);
        setForm1UploadProgress(0);

        // Clear any existing interval for this document type
        if (progressIntervals.current[documentType]) {
          clearInterval(progressIntervals.current[documentType]);
        }

        const progressInterval = setInterval(() => {
          setForm1UploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              delete progressIntervals.current[documentType];
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        // Store the interval reference
        progressIntervals.current[documentType] = progressInterval;
      } else if (documentType === "form19") {
        setIsUploadingForm19(true);
        setForm19UploadProgress(0);

        // Clear any existing interval for this document type
        if (progressIntervals.current[documentType]) {
          clearInterval(progressIntervals.current[documentType]);
        }

        const progressInterval = setInterval(() => {
          setForm19UploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              delete progressIntervals.current[documentType];
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        // Store the interval reference
        progressIntervals.current[documentType] = progressInterval;
      } else if (documentType === "aoa") {
        setIsUploadingAoa(true);
        setAoaUploadProgress(0);

        // Clear any existing interval for this document type
        if (progressIntervals.current[documentType]) {
          clearInterval(progressIntervals.current[documentType]);
        }

        const progressInterval = setInterval(() => {
          setAoaUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              delete progressIntervals.current[documentType];
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        // Store the interval reference
        progressIntervals.current[documentType] = progressInterval;
      } else if (documentType === "form18" && typeof index === "number") {
        setIsUploadingForm18((prev) => ({ ...prev, [index]: true }));
        setForm18UploadProgress((prev) => ({ ...prev, [index]: 0 }));

        const intervalKey = `${documentType}-${index}`;

        // Clear any existing interval for this specific form18 index
        if (progressIntervals.current[intervalKey]) {
          clearInterval(progressIntervals.current[intervalKey]);
        }

        const progressInterval = setInterval(() => {
          setForm18UploadProgress((prev) => {
            const currentProgress = prev[index] || 0;
            if (currentProgress >= 90) {
              clearInterval(progressInterval);
              delete progressIntervals.current[intervalKey];
              return { ...prev, [index]: 90 };
            }
            return { ...prev, [index]: currentProgress + 10 };
          });
        }, 200);

        // Store the interval reference
        progressIntervals.current[intervalKey] = progressInterval;
      }

      // Import the file upload client
      const { fileUploadClient } = await import("@/lib/file-upload-client");

      // Upload file to file storage immediately
      const uploadResult = await fileUploadClient.uploadFile(file, companyId);

      if (!uploadResult.success || !uploadResult.file) {
        throw new Error(
          `Failed to upload file to storage: ${uploadResult.error}`,
        );
      }

      console.log(`✅ File uploaded to storage successfully: ${file.name}`);

      // Create document object with file storage data
      const document = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadResult.file.url,
        filePath: uploadResult.file.filePath,
        id: uploadResult.file.id,
        uploadedAt: uploadResult.file.uploadedAt,
      };

      // Update local state immediately
      setSelectedCompany((prev: any) => {
        const updated = { ...prev };
        if (documentType === "form18" && typeof index === "number") {
          updated.form18 = Array.isArray(prev.form18)
            ? [...prev.form18]
            : Array.isArray(prev.directors)
              ? prev.directors.map(() => null)
              : [];
          updated.form18[index] = document;
        } else {
          // No longer need mapping - use form19 directly
          updated[documentType] = document;
        }
        return updated;
      });

      // Clear any pending documents for this type
      if (documentType === "incorporationCertificate") {
        setPendingStep4Documents((prev: any) => ({
          ...prev,
          incorporationCertificate: null,
        }));
      }

      // Save to MySQL database immediately
      const updateData = {
        ...selectedCompany,
        updated_at: new Date().toISOString(),
      };

      // Handle Form 18 as an array, other documents as single objects
      if (documentType === "form18" && typeof index === "number") {
        const currentForm18 = selectedCompany.form18 || [];
        const updatedForm18 = [...currentForm18];
        updatedForm18[index] = document;
        updateData.form18 = updatedForm18;
        console.log("📝 Saving Form 18 to database:", {
          index,
          currentForm18Length: currentForm18.length,
          updatedForm18Length: updatedForm18.length,
          document: document,
        });
      } else {
        // No longer need mapping - use form19 directly
        updateData[documentType] = document;
        console.log("📝 Saving document to database:", {
          documentType,
          document: document,
        });
      }

      console.log("📤 Sending API request to save document...");
      const response = await fetch(`/api/registrations/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      console.log("📥 API response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error response:", errorText);
        throw new Error(
          `Failed to save to database: ${response.statusText} - ${errorText}`,
        );
      }

      const responseData = await response.json();
      console.log("📥 API response data:", responseData);
      console.log(`✅ Document saved to database successfully: ${file.name}`);

      // Mark documents as changed to enable publish button
      setDocumentsChanged(true);

      // Show success message
      toast({
        title: "Success",
        description: `${documentType === "incorporationCertificate" ? "Incorporation certificate" : "Document"} uploaded and saved successfully!`,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: `Failed to upload ${documentType === "incorporationCertificate" ? "incorporation certificate" : "document"}. Please try again.`,
        variant: "destructive",
      });
      throw error; // Re-throw to be handled by the calling component
    } finally {
      // Complete progress and reset upload state for step 3 and step 4 documents
      if (documentType === "incorporationCertificate") {
        // Clear the interval if it still exists
        if (progressIntervals.current[documentType]) {
          clearInterval(progressIntervals.current[documentType]);
          delete progressIntervals.current[documentType];
        }
        setIncorporationCertificateUploadProgress(100);
        setTimeout(() => {
          setIsUploadingIncorporationCertificate(false);
          setIncorporationCertificateUploadProgress(0);
        }, 500);
      } else if (documentType === "form1") {
        // Clear the interval if it still exists
        if (progressIntervals.current[documentType]) {
          clearInterval(progressIntervals.current[documentType]);
          delete progressIntervals.current[documentType];
        }
        setForm1UploadProgress(100);
        setTimeout(() => {
          setIsUploadingForm1(false);
          setForm1UploadProgress(0);
        }, 500);
      } else if (documentType === "form19") {
        // Clear the interval if it still exists
        if (progressIntervals.current[documentType]) {
          clearInterval(progressIntervals.current[documentType]);
          delete progressIntervals.current[documentType];
        }
        setForm19UploadProgress(100);
        setTimeout(() => {
          setIsUploadingForm19(false);
          setForm19UploadProgress(0);
        }, 500);
      } else if (documentType === "aoa") {
        // Clear the interval if it still exists
        if (progressIntervals.current[documentType]) {
          clearInterval(progressIntervals.current[documentType]);
          delete progressIntervals.current[documentType];
        }
        setAoaUploadProgress(100);
        setTimeout(() => {
          setIsUploadingAoa(false);
          setAoaUploadProgress(0);
        }, 500);
      } else if (documentType === "form18" && typeof index === "number") {
        const intervalKey = `${documentType}-${index}`;
        // Clear the interval if it still exists
        if (progressIntervals.current[intervalKey]) {
          clearInterval(progressIntervals.current[intervalKey]);
          delete progressIntervals.current[intervalKey];
        }
        setForm18UploadProgress((prev) => ({ ...prev, [index]: 100 }));
        setTimeout(() => {
          setIsUploadingForm18((prev) => ({ ...prev, [index]: false }));
          setForm18UploadProgress((prev) => ({ ...prev, [index]: 0 }));
        }, 500);
      }
    }
  };

  // Function to handle additional document upload
  const handleAdditionalDocumentUpload = async (
    companyId: string,
    title: string,
    file: File,
  ) => {
    try {
      console.log(
        `📁 Admin - Storing step 3 additional document temporarily: ${file.name}`,
      );

      const document = {
        name: file.name,
        type: file.type,
        size: file.size,
        file: file, // Store the actual file object temporarily
        title: title,
        uploadedAt: new Date().toISOString(),
        // These will be set when actually saved to file storage
        url: null,
        filePath: null,
        id: null,
      };

      setPendingStep3Documents((prev: any) => ({
        ...prev,
        step3AdditionalDoc: [...(prev.step3AdditionalDoc || []), document],
      }));

      console.log(
        `✅ Step 3 additional document stored temporarily: ${file.name}`,
      );
    } catch (error) {
      console.error("Error storing step 3 additional document:", error);
    }
  };

  // Function to handle step 4 additional document upload with immediate save
  const handleStep4AdditionalDocumentUpload = async (
    companyId: string,
    title: string,
    file: File,
  ): Promise<boolean> => {
    try {
      console.log(
        `📁 Admin - handleStep4AdditionalDocumentUpload called with:`,
      );
      console.log(`  - companyId: ${companyId}`);
      console.log(`  - title: ${title}`);
      console.log(`  - file.name: ${file.name}`);
      console.log(
        `📁 Admin - Immediately uploading step 4 additional document: ${file.name}`,
      );

      // Set upload state and progress
      setIsUploadingStep4Document(true);
      setStep4DocumentUploadProgress(0);

      // Clear any existing interval for step 4 documents
      if (progressIntervals.current["step4Document"]) {
        clearInterval(progressIntervals.current["step4Document"]);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setStep4DocumentUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            delete progressIntervals.current["step4Document"];
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Store the interval reference
      progressIntervals.current["step4Document"] = progressInterval;

      // Import the file upload client
      const { fileUploadClient } = await import("@/lib/file-upload-client");

      // Upload file to file storage immediately
      console.log("📁 Uploading file to file storage...");
      const uploadResult = await fileUploadClient.uploadFile(file, companyId);

      if (!uploadResult.success || !uploadResult.file) {
        console.error("❌ File upload failed:", uploadResult.error);
        toast({
          title: "Error",
          description: `Failed to upload file to storage: ${uploadResult.error}`,
          variant: "destructive",
        });
        return false;
      }

      console.log(`✅ File uploaded to storage successfully: ${file.name}`);

      // Create document object with file storage data
      const document = {
        name: file.name,
        type: file.type,
        size: file.size,
        title: title,
        url: uploadResult.file.url,
        filePath: uploadResult.file.filePath,
        id: uploadResult.file.id,
        uploadedAt: uploadResult.file.uploadedAt,
      };

      console.log("📄 Created document object:", document);

      // Get current registration from MySQL database
      console.log("📝 Fetching current registration from database...");
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        const errorText = await response.text();
        console.error("Error details:", errorText);
        toast({
          title: "Error",
          description: "Failed to fetch registration data. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      const currentRegistration = await response.json();
      console.log(
        "📝 Admin - Current registration from database:",
        currentRegistration,
      );

      // Add to existing step4 additional documents
      const existingStep4Documents =
        currentRegistration.step4FinalAdditionalDoc || [];
      const updatedStep4Documents = [...existingStep4Documents, document];

      console.log(
        "📄 Updated step4FinalAdditionalDoc array:",
        updatedStep4Documents,
      );
      console.log("📝 Saving step 4 additional document to MySQL database...");

      // Update MySQL database immediately
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentRegistration,
          step4FinalAdditionalDoc: updatedStep4Documents,
          updatedAt: new Date().toISOString(),
        }),
      });

      console.log("📥 Update response status:", updateResponse.status);
      console.log("📥 Update response statusText:", updateResponse.statusText);

      if (!updateResponse.ok) {
        console.error(
          "❌ Failed to save step 4 additional document to MySQL database:",
          updateResponse.status,
          updateResponse.statusText,
        );
        const errorText = await updateResponse.text();
        console.error("Error details:", errorText);
        toast({
          title: "Error",
          description: "Failed to save document to database. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      const updateResult = await updateResponse.json();
      console.log("✅ Update result:", updateResult);
      console.log(
        "✅ Step 4 additional document saved to MySQL database successfully",
      );
      console.log("📄 Updated step4FinalAdditionalDoc:", updatedStep4Documents);

      // Update local state
      setSelectedCompany((prev: any) => {
        console.log("🔄 Updating local state with step4FinalAdditionalDoc");
        const updated = {
          ...prev,
          step4FinalAdditionalDoc: updatedStep4Documents,
        };
        console.log("🔄 Updated selectedCompany:", updated);
        return updated;
      });

      // Force a refresh of the company data to ensure UI is updated
      setTimeout(async () => {
        console.log(
          "🔄 Force refreshing company data after document upload...",
        );
        try {
          const refreshedRegistration =
            await LocalStorageService.getRegistrationById(companyId);
          if (refreshedRegistration) {
            console.log(
              "✅ Refreshed company data:",
              refreshedRegistration.step4FinalAdditionalDoc,
            );
            setSelectedCompany(refreshedRegistration);
          }
        } catch (error) {
          console.error("❌ Error refreshing company data:", error);
        }
      }, 500);

      // Also trigger a re-render by updating a state variable
      setDocumentsChanged((prev) => !prev);

      // Show success message
      toast({
        title: "Success",
        description: "Additional document uploaded and saved successfully!",
      });

      console.log(
        "✅ handleStep4AdditionalDocumentUpload completed successfully",
      );
      return true;
    } catch (error) {
      console.error("Error uploading step 4 additional document:", error);
      toast({
        title: "Error",
        description: "Failed to upload additional document. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      // Clear the interval if it still exists
      if (progressIntervals.current["step4Document"]) {
        clearInterval(progressIntervals.current["step4Document"]);
        delete progressIntervals.current["step4Document"];
      }
      // Complete progress and reset upload state
      setStep4DocumentUploadProgress(100);
      setTimeout(() => {
        setIsUploadingStep4Document(false);
        setStep4DocumentUploadProgress(0);
      }, 500);
    }
  };

  // Function to save ALL step3 documents instantly to MySQL and file storage
  const saveAllStep3DocumentsToDatabase = async (companyId: string) => {
    try {
      console.log("📝 Admin - Saving ALL step3 documents to MySQL database...");

      // Import the file upload client
      const { fileUploadClient } = await import("@/lib/file-upload-client");

      // Get current registration from MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        return false;
      }

      const currentRegistration = await response.json();
      console.log(
        "📝 Admin - Current registration from database:",
        currentRegistration,
      );

      let updatedRegistration = { ...currentRegistration };
      let hasChanges = false;

      // Process form1
      if (pendingDocuments.form1 && pendingDocuments.form1.file) {
        console.log("📁 Processing form1 document...");
        const uploadResult = await fileUploadClient.uploadFile(
          pendingDocuments.form1.file,
          companyId,
        );
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.form1 = {
            ...pendingDocuments.form1,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined, // Remove the file object
          };
          hasChanges = true;
          console.log("✅ Form1 uploaded and saved to database");
        }
      }

      // Process form19
      if (pendingDocuments.form19 && pendingDocuments.form19.file) {
        console.log("📁 Processing form 19 document...");
        const uploadResult = await fileUploadClient.uploadFile(
          pendingDocuments.form19.file,
          companyId,
        );
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.form19 = {
            ...pendingDocuments.form19,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined, // Remove the file object
          };
          hasChanges = true;
          console.log("✅ FORM 19 uploaded and saved to database");
        }
      }

      // Process aoa (articles of association)
      if (pendingDocuments.aoa && pendingDocuments.aoa.file) {
        console.log("📁 Processing articles of association document...");
        const uploadResult = await fileUploadClient.uploadFile(
          pendingDocuments.aoa.file,
          companyId,
        );
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.aoa = {
            ...pendingDocuments.aoa,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined, // Remove the file object
          };
          hasChanges = true;
          console.log(
            "✅ Articles of association uploaded and saved to database",
          );
        }
      }

      // Process form18 array
      if (pendingDocuments.form18 && Array.isArray(pendingDocuments.form18)) {
        console.log("📁 Processing form18 documents...");
        const processedForm18 = [];
        for (let i = 0; i < pendingDocuments.form18.length; i++) {
          const doc = pendingDocuments.form18[i];
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(
              doc.file,
              companyId,
            );
            if (uploadResult.success && uploadResult.file) {
              processedForm18.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined, // Remove the file object
              });
              console.log(
                `✅ Form18 document ${i + 1} uploaded and saved to database`,
              );
            }
          } else if (doc) {
            processedForm18.push(doc);
          } else {
            processedForm18.push(null);
          }
        }
        if (processedForm18.length > 0) {
          updatedRegistration.form18 = processedForm18;
          hasChanges = true;
        }
      }

      // Process step3 additional documents
      if (
        pendingStep3Documents.step3AdditionalDoc &&
        Array.isArray(pendingStep3Documents.step3AdditionalDoc)
      ) {
        console.log("📁 Processing step3 additional documents...");
        const processedStep3Documents = [];
        for (const doc of pendingStep3Documents.step3AdditionalDoc) {
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(
              doc.file,
              companyId,
            );
            if (uploadResult.success && uploadResult.file) {
              processedStep3Documents.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined, // Remove the file object
              });
            }
          } else if (doc) {
            processedStep3Documents.push(doc);
          }
        }

        // Merge with existing step3 documents
        const existingStep3Documents =
          currentRegistration.step3AdditionalDoc || [];
        updatedRegistration.step3AdditionalDoc = [
          ...existingStep3Documents,
          ...processedStep3Documents,
        ];
        hasChanges = true;
        console.log(
          `✅ ${processedStep3Documents.length} step3 additional documents uploaded and saved to database`,
        );
      }

      // Only update database if there are changes
      if (hasChanges) {
        updatedRegistration.updatedAt = new Date().toISOString();

        // Update MySQL database
        const updateResponse = await fetch(`/api/registrations/${companyId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedRegistration),
        });

        if (updateResponse.ok) {
          console.log(
            "✅ ALL step3 documents saved to MySQL database successfully",
          );

          // Update local state
          setSelectedCompany((prev: any) => ({
            ...prev,
            ...updatedRegistration,
          }));

          // Reset pending documents
          setPendingDocuments({});
          setPendingStep3Documents({});
          setDocumentsChanged(false);

          return true;
        } else {
          console.error(
            "❌ Failed to save step3 documents to database:",
            updateResponse.status,
            updateResponse.statusText,
          );
          return false;
        }
      } else {
        console.log("ℹ️ No new documents to save");
        return true;
      }
    } catch (error) {
      console.error("❌ Error saving step3 documents to database:", error);
      return false;
    }
  };

  // Function to save ONLY step3 additional documents to MySQL and file storage
  const saveStep3AdditionalDocumentsToDatabase = async (companyId: string) => {
    try {
      console.log(
        "📝 Admin - Saving step3 additional documents to MySQL database...",
      );

      // Import the file upload client
      const { fileUploadClient } = await import("@/lib/file-upload-client");

      // Get current registration from MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        return false;
      }

      const currentRegistration = await response.json();
      console.log(
        "📝 Admin - Current registration from database:",
        currentRegistration,
      );

      // Process only step3 additional documents
      const pendingAdditionalDocuments =
        pendingStep3Documents.step3AdditionalDoc || [];
      const processedStep3Documents = [];

      for (const doc of pendingAdditionalDocuments) {
        if (doc && doc.file) {
          const uploadResult = await fileUploadClient.uploadFile(
            doc.file,
            companyId,
          );
          if (uploadResult.success && uploadResult.file) {
            processedStep3Documents.push({
              ...doc,
              url: uploadResult.file.url,
              filePath: uploadResult.file.filePath,
              id: uploadResult.file.id,
              file: undefined, // Remove the file object
            });
          }
        } else if (doc) {
          processedStep3Documents.push(doc);
        }
      }

      if (processedStep3Documents.length > 0) {
        // Merge with existing step3 documents
        const existingStep3Documents =
          currentRegistration.step3AdditionalDoc || [];
        const updatedStep3Documents = [
          ...existingStep3Documents,
          ...processedStep3Documents,
        ];

        // Update MySQL database
        const updateResponse = await fetch(`/api/registrations/${companyId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...currentRegistration,
            step3AdditionalDoc: updatedStep3Documents,
            updatedAt: new Date().toISOString(),
          }),
        });

        if (updateResponse.ok) {
          console.log(
            "✅ Step3 additional documents saved to MySQL database successfully",
          );

          // Update local state
          setSelectedCompany((prev: any) => ({
            ...prev,
            step3AdditionalDoc: updatedStep3Documents,
          }));

          // Reset only the processed documents from pending state
          setPendingStep3Documents((prev: any) => ({
            ...prev,
            step3AdditionalDoc: [],
          }));

          return true;
        } else {
          console.error(
            "❌ Failed to save step3 additional documents to database:",
            updateResponse.status,
            updateResponse.statusText,
          );
          return false;
        }
      } else {
        console.log("ℹ️ No new step3 additional documents to save");
        return true;
      }
    } catch (error) {
      console.error(
        "❌ Error saving step3 additional documents to database:",
        error,
      );
      return false;
    }
  };

  // Function to save step3 additional documents instantly to MySQL and file storage (for backward compatibility)
  const saveStep3DocumentsToDatabase = async (companyId: string) => {
    return await saveAllStep3DocumentsToDatabase(companyId);
  };
  // Function to remove additional document (handles both step 3 and step 4)
  const handleRemoveAdditionalDocument = async (
    companyId: string,
    documentIndex: number,
  ) => {
    try {
      console.log(
        `🗑️ handleRemoveAdditionalDocument called with companyId: ${companyId}, documentIndex: ${documentIndex}`,
      );

      // Check if we're in step 4
      const isStep4 =
        selectedCompany.currentStep === "incorporate" ||
        selectedCompany.status === "incorporation-processing";
      console.log("  - Is Step 4?", isStep4);

      if (isStep4) {
        console.log("🗑️ Removing step 4 additional document...");
        await handleRemoveStep4AdditionalDocument(companyId, documentIndex);
      } else {
        const hasPending =
          Array.isArray(pendingStep3Documents.step3AdditionalDoc) &&
          pendingStep3Documents.step3AdditionalDoc.length > 0;
        if (hasPending) {
          console.log("🗑️ Removing PENDING step 3 additional document...");
          await handleRemovePendingStep3AdditionalDocument(documentIndex);
        } else {
          console.log("🗑️ Removing EXISTING step 3 additional document...");
          await handleRemoveExistingStep3AdditionalDocument(
            companyId,
            documentIndex,
          );
        }
      }
    } catch (error) {
      console.error("Error removing additional document:", error);
      toast({
        title: "Error",
        description: "Failed to remove document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to remove pending step 3 additional document (local state only)
  const handleRemovePendingStep3AdditionalDocument = async (
    documentIndex: number,
  ) => {
    try {
      const pendingDocs = pendingStep3Documents.step3AdditionalDoc || [];
      if (documentIndex < 0 || documentIndex >= pendingDocs.length) {
        console.error(
          "❌ Pending document index out of bounds:",
          documentIndex,
        );
        return;
      }

      const updatedPendingDocuments = pendingDocs.filter(
        (_: any, index: number) => index !== documentIndex,
      );
      setPendingStep3Documents((prev: any) => ({
        ...prev,
        step3AdditionalDoc: updatedPendingDocuments,
      }));
      console.log(
        `✅ Pending step 3 additional document removed: index ${documentIndex}`,
      );

      toast({
        title: "Removed",
        description: "Pending document removed.",
      });
    } catch (error) {
      console.error(
        "Error removing pending step 3 additional document:",
        error,
      );
    }
  };

  // Function to remove existing step 3 additional document (storage + DB)
  const handleRemoveExistingStep3AdditionalDocument = async (
    companyId: string,
    documentIndex: number,
  ) => {
    try {
      console.log(
        `🗑️ handleRemoveExistingStep3AdditionalDocument called with documentIndex: ${documentIndex}`,
      );

      // If not pending, remove from existing documents in file storage and MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        return;
      }

      const currentRegistration = await response.json();
      const currentAdditionalDocuments =
        currentRegistration.step3AdditionalDoc || [];

      if (
        documentIndex < 0 ||
        documentIndex >= currentAdditionalDocuments.length
      ) {
        console.error("❌ Document index out of bounds:", documentIndex);
        toast({
          title: "Error",
          description: "Document not found.",
          variant: "destructive",
        });
        return;
      }

      const documentToDelete = currentAdditionalDocuments[documentIndex];

      // Delete file from file storage if possible
      try {
        const { fileUploadClient } = await import("@/lib/file-upload-client");
        if (documentToDelete?.id) {
          const deleteById = await fileUploadClient.deleteFileById(
            documentToDelete.id,
          );
          if (!deleteById.success) {
            console.warn(
              "⚠️ Failed to delete file by id from storage:",
              deleteById.error,
            );
          } else {
            console.log("✅ File deleted from storage by id");
          }
        } else if (documentToDelete?.filePath) {
          const deleteByPath = await fileUploadClient.deleteFile(
            documentToDelete.filePath,
          );
          if (!deleteByPath.success) {
            console.warn(
              "⚠️ Failed to delete file by path from storage:",
              deleteByPath.error,
            );
          } else {
            console.log("✅ File deleted from storage by path");
          }
        } else {
          console.warn(
            "⚠️ No id or filePath on document; skipping storage deletion",
          );
        }
      } catch (fileError) {
        console.warn(
          "⚠️ Error deleting file from storage (continuing with DB update):",
          fileError,
        );
      }

      const updatedAdditionalDocuments = currentAdditionalDocuments.filter(
        (_: any, index: number) => index !== documentIndex,
      );

      // Update MySQL database
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentRegistration,
          step3AdditionalDoc: updatedAdditionalDocuments,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (updateResponse.ok) {
        console.log(
          "✅ Step3 additional document removed from MySQL database successfully",
        );

        // Update local state
        setSelectedCompany((prev: any) => ({
          ...prev,
          step3AdditionalDoc: updatedAdditionalDocuments,
        }));

        toast({
          title: "Success",
          description: "Document removed successfully!",
        });
      } else {
        console.error(
          "❌ Failed to remove step3 document from database:",
          updateResponse.status,
          updateResponse.statusText,
        );
        toast({
          title: "Error",
          description:
            "Failed to remove document from database. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(
        "Error removing existing step 3 additional document:",
        error,
      );
      toast({
        title: "Error",
        description: "Failed to remove document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Admin Corporate Records Submission Handlers
  const handleAdminFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAdminResolutionFiles((prev) => [...prev, ...files]);
    }
  };

  const removeAdminFile = (index: number) => {
    setAdminResolutionFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdminSubmitResolutions = async () => {
    if (!adminResolutionTitle.trim()) {
      setAdminResolutionError("Please enter a title for the secretary record");
      return;
    }

    if (adminResolutionFiles.length === 0) {
      setAdminResolutionError("Please select at least one document to upload");
      return;
    }

    setUploadingAdminResolution(true);
    setAdminResolutionError("");

    try {
      console.log(
        "🔧 Admin submitting secretary records for customer:",
        selectedCompany._id,
      );

      // Upload files to file storage
      const uploadedFiles = [];
      for (const file of adminResolutionFiles) {
        console.log("📁 Uploading file to file storage:", file.name);
        const uploadResult = await fileUploadClient.uploadFile(
          file,
          `admin_resolution_${selectedCompany._id}`,
        );

        if (!uploadResult.success) {
          throw new Error(
            uploadResult.error || `Failed to upload file: ${file.name}`,
          );
        }

        uploadedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: uploadResult.file?.url,
          filePath: uploadResult.file?.filePath,
          id: uploadResult.file?.id,
          uploadedAt: uploadResult.file?.uploadedAt,
        });
      }

      // Prepare the admin resolution data
      const adminResolutionData = {
        title: adminResolutionTitle,
        description: adminResolutionDescription,
        documents: uploadedFiles,
        signRequired: adminIsSignRequired,
        submittedBy: "admin", // Mark as admin submission
        uploadedAt: new Date().toISOString(),
      };

      // Get current admin resolutions from company data
      const currentAdminResolutions =
        selectedCompany.admin_resolution_doc || [];

      // Add new admin resolution to the list
      const updatedAdminResolutions = [
        ...currentAdminResolutions,
        adminResolutionData,
      ];

      // Update company data in the database
      const updatedCompany = {
        ...selectedCompany,
        admin_resolution_doc: updatedAdminResolutions,
      };

      console.log("💾 Saving admin secretary records to database...");

      // Save to database
      const response = await fetch(
        `/api/registrations/${selectedCompany._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedCompany),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save admin secretary records");
      }

      // Update local state
      setSelectedCompany(updatedCompany);

      // Dispatch event to notify customer UI
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            companyId: selectedCompany._id,
            type: "admin-secretary-records-submitted",
          },
        }),
      );

      // Reset form
      setAdminResolutionTitle("");
      setAdminResolutionDescription("");
      setAdminResolutionFiles([]);
      setAdminIsSignRequired(true);
      setShowAdminCorporateRecordsDialog(false);

      // Show success message
      toast({
        title: "Success",
        description: "Secretary records submitted successfully for customer",
        variant: "default",
      });

      console.log("✅ Admin secretary records submitted successfully");

      // Send email notification to customer (using user's registered email)
      try {
        console.log(
          "📧 Sending secretary records submitted email to customer...",
        );
        const emailResponse = await fetch(
          "/api/notifications/secretary-records-submitted",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              registrationId: selectedCompany._id,
              companyName: selectedCompany.companyNameEnglish,
            }),
          },
        );

        if (emailResponse.ok) {
          console.log(
            "✅ Secretary records submitted email sent successfully to user's registered email",
          );
        } else {
          console.error(
            "❌ Failed to send secretary records submitted email:",
            await emailResponse.text(),
          );
        }
      } catch (emailError) {
        console.error(
          "❌ Error sending secretary records submitted email:",
          emailError,
        );
        // Don't block the flow if email fails
      }
    } catch (error) {
      console.error("❌ Error submitting admin secretary records:", error);
      setAdminResolutionError(
        error instanceof Error
          ? error.message
          : "Failed to submit secretary records",
      );

      toast({
        title: "Error",
        description: "Failed to submit secretary records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAdminResolution(false);
    }
  };

  // Function to handle admin signed document upload
  const handleAdminSignedDocumentUpload = async (
    resolutionIndex: number,
    file: File,
  ) => {
    if (!file || !selectedCompany._id) {
      console.error("❌ Missing file or company ID");
      return;
    }

    setUploadingSignedResolution(true);
    setCurrentResolutionIndex(resolutionIndex);

    try {
      console.log(
        "🔧 Admin uploading signed document for resolution:",
        resolutionIndex,
      );

      // Upload file to file storage
      console.log("📁 Uploading signed document to file storage:", file.name);
      const uploadResult = await fileUploadClient.uploadFile(
        file,
        `admin_signed_resolution_${selectedCompany._id}`,
      );

      if (!uploadResult.success) {
        throw new Error(
          uploadResult.error ||
          `Failed to upload signed document: ${file.name}`,
        );
      }

      const signedDocument = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadResult.file?.url,
        filePath: uploadResult.file?.filePath,
        id: uploadResult.file?.id,
        uploadedAt: uploadResult.file?.uploadedAt,
        uploadedBy: "admin",
      };

      // Get current registration from database
      const response = await fetch(`/api/registrations/${selectedCompany._id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch registration data");
      }

      const currentRegistration = await response.json();
      const currentResolutions = currentRegistration.resolutions_docs || [];

      // Check if the resolution exists
      if (resolutionIndex < 0 || resolutionIndex >= currentResolutions.length) {
        throw new Error("Resolution not found");
      }

      // Add signed document to the resolution
      const currentResolution = currentResolutions[resolutionIndex];
      const existingSignedDocs = currentResolution.signedDocuments || [];
      const updatedSignedDocs = [...existingSignedDocs, signedDocument];

      const updatedResolution = {
        ...currentResolution,
        signedDocuments: updatedSignedDocs,
      };

      const updatedResolutions = [...currentResolutions];
      updatedResolutions[resolutionIndex] = updatedResolution;

      console.log("💾 Saving signed document to database...");
      console.log("📊 Data being sent to API:", {
        companyId: selectedCompany._id,
        resolutionIndex,
        updatedResolutions: updatedResolutions.length,
        currentResolution: updatedResolution,
      });

      // Update MySQL database
      const updateResponse = await fetch(
        `/api/registrations/${selectedCompany._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...currentRegistration,
            resolutions_docs: updatedResolutions,
            updatedAt: new Date().toISOString(),
          }),
        },
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("❌ API Error Response:", {
          status: updateResponse.status,
          statusText: updateResponse.statusText,
          body: errorText,
        });
        throw new Error(
          `Failed to save signed document: ${updateResponse.status} ${updateResponse.statusText}`,
        );
      }

      // Update local state
      setSelectedCompany((prev: any) => ({
        ...prev,
        resolutions_docs: updatedResolutions,
      }));

      // Dispatch event to notify customer UI
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            companyId: selectedCompany._id,
            type: "admin-signed-document-uploaded",
          },
        }),
      );

      // Reset form
      setSignedResolutionFile(null);
      setCurrentResolutionIndex(null);

      // Show success message
      toast({
        title: "Success",
        description: "Signed document uploaded successfully",
        variant: "default",
      });

      console.log("✅ Admin signed document uploaded successfully");

      // Send email notification to customer (using user's registered email)
      try {
        console.log("📧 Sending signed secretary records email to customer...");
        const emailResponse = await fetch(
          "/api/notifications/signed-secretary-records",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              registrationId: selectedCompany._id,
              companyName: selectedCompany.companyNameEnglish,
            }),
          },
        );

        if (emailResponse.ok) {
          console.log(
            "✅ Signed secretary records email sent successfully to user's registered email",
          );
        } else {
          console.error(
            "❌ Failed to send signed secretary records email:",
            await emailResponse.text(),
          );
        }
      } catch (emailError) {
        console.error(
          "❌ Error sending signed secretary records email:",
          emailError,
        );
        // Don't block the flow if email fails
      }
    } catch (error) {
      console.error("❌ Error uploading signed document:", error);
      toast({
        title: "Error",
        description: "Failed to upload signed document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingSignedResolution(false);
    }
  };

  // Function to remove admin corporate record
  const handleRemoveAdminCorporateRecord = async (
    companyId: string,
    resolutionIndex: number,
  ) => {
    try {
      console.log(
        `🗑️ handleRemoveAdminCorporateRecord called with resolutionIndex: ${resolutionIndex}`,
      );

      // Get current registration from database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        toast({
          title: "Error",
          description: "Failed to fetch registration data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const currentRegistration = await response.json();
      console.log(
        "📝 Admin - Current registration from database:",
        currentRegistration,
      );

      // Get current admin resolutions
      const currentAdminResolutions =
        currentRegistration.admin_resolution_doc || [];

      // Check if the resolution exists
      if (
        resolutionIndex < 0 ||
        resolutionIndex >= currentAdminResolutions.length
      ) {
        console.error("❌ Resolution index out of bounds");
        toast({
          title: "Error",
          description: "Resolution not found.",
          variant: "destructive",
        });
        return;
      }

      // Remove the resolution at the specified index
      const updatedAdminResolutions = currentAdminResolutions.filter(
        (_: any, index: number) => index !== resolutionIndex,
      );

      console.log("💾 Saving updated admin resolutions to database...");

      // Update MySQL database
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentRegistration,
          admin_resolution_doc: updatedAdminResolutions,
          signed_admin_resolution: updatedAdminResolutions,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!updateResponse.ok) {
        console.error(
          "❌ Failed to update registration in database:",
          updateResponse.status,
          updateResponse.statusText,
        );
        toast({
          title: "Error",
          description: "Failed to delete secretary record. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log(
        "✅ Admin resolution deleted from MySQL database successfully",
      );

      // Update local state
      setSelectedCompany((prev: any) => ({
        ...prev,
        admin_resolution_doc: updatedAdminResolutions,
        signed_admin_resolution: updatedAdminResolutions,
      }));

      // Dispatch event to notify customer UI
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            companyId: companyId,
            type: "admin-secretary-record-deleted",
          },
        }),
      );

      // Show success message
      toast({
        title: "Success",
        description: "Secretary record deleted successfully",
        variant: "default",
      });

      console.log(
        `✅ Admin resolution deleted successfully: index ${resolutionIndex}`,
      );
    } catch (error) {
      console.error("❌ Error deleting admin resolution:", error);
      toast({
        title: "Error",
        description: "Failed to delete secretary record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle expire date update
  const handleUpdateExpireDate = async () => {
    if (!registerStartDate || !expireDays) {
      toast({
        title: "Error",
        description: "Please fill in both start date and expire days.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingExpireDate(true);
    try {
      // Calculate expire date
      const startDate = new Date(registerStartDate);
      const expireDate = new Date(startDate);
      expireDate.setDate(expireDate.getDate() + parseInt(expireDays));

      // Update the registration
      const response = await fetch(
        `/api/registrations/${selectedCompany._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...selectedCompany,
            registerStartDate: registerStartDate,
            expireDays: parseInt(expireDays),
            expireDate: expireDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
            secretaryPeriodYear: secretaryPeriodYear || null,
            isExpired: false, // Reset expired status when updating
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to update expire date. Server response:", errorText);
        throw new Error(`Failed to update expire date: ${response.status} ${response.statusText}`);
      }

      const updatedRegistration = await response.json();
      setSelectedCompany(updatedRegistration);

      toast({
        title: "Success",
        description: "Expire date updated successfully!",
      });
    } catch (error) {
      console.error("Error updating expire date:", error);
      toast({
        title: "Error",
        description: "Failed to update expire date. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingExpireDate(false);
    }
  };

  // Function to remove step 4 additional document
  const handleRemoveStep4AdditionalDocument = async (
    companyId: string,
    documentIndex: number,
  ) => {
    try {
      console.log(
        `🗑️ handleRemoveStep4AdditionalDocument called with documentIndex: ${documentIndex}`,
      );

      // Get current registration from database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        toast({
          title: "Error",
          description: "Failed to fetch registration data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const currentRegistration = await response.json();
      const currentStep4Documents =
        currentRegistration.step4FinalAdditionalDoc || [];

      if (documentIndex >= currentStep4Documents.length) {
        console.error("❌ Document index out of range:", documentIndex);
        toast({
          title: "Error",
          description: "Document not found. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Get the document to be deleted
      const documentToDelete = currentStep4Documents[documentIndex];
      console.log("📄 Document to delete:", documentToDelete);

      // Delete file from file storage
      console.log("🗑️ Deleting file from file storage...");
      try {
        const { fileUploadClient } = await import("@/lib/file-upload-client");

        if (documentToDelete.filePath) {
          const deleteResult = await fileUploadClient.deleteFile(
            documentToDelete.filePath,
          );
          if (deleteResult.success) {
            console.log("✅ File deleted from file storage successfully");
          } else {
            console.warn(
              "⚠️ Failed to delete file from file storage:",
              deleteResult.error,
            );
            // Continue with database deletion even if file deletion fails
          }
        } else {
          console.warn(
            "⚠️ No filePath found for document, skipping file deletion",
          );
        }
      } catch (fileError) {
        console.warn("⚠️ Error deleting file from storage:", fileError);
        // Continue with database deletion even if file deletion fails
      }

      // Remove document from array
      const updatedStep4Documents = currentStep4Documents.filter(
        (_: any, index: number) => index !== documentIndex,
      );
      console.log(
        "📄 Updated step4FinalAdditionalDoc array:",
        updatedStep4Documents,
      );

      // Update MySQL database
      console.log("📝 Updating database...");
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentRegistration,
          step4FinalAdditionalDoc: updatedStep4Documents,
          updatedAt: new Date().toISOString(),
        }),
      });

      console.log("📥 Update response status:", updateResponse.status);

      if (!updateResponse.ok) {
        console.error(
          "❌ Failed to remove step 4 document from database:",
          updateResponse.status,
          updateResponse.statusText,
        );
        const errorText = await updateResponse.text();
        console.error("Error details:", errorText);
        toast({
          title: "Error",
          description:
            "Failed to remove document from database. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const updateResult = await updateResponse.json();
      console.log("✅ Update result:", updateResult);
      console.log(
        "✅ Step 4 additional document removed from MySQL database successfully",
      );

      // Update local state
      setSelectedCompany((prev: any) => {
        console.log("🔄 Updating local state after step 4 document removal");
        const updated = {
          ...prev,
          step4FinalAdditionalDoc: updatedStep4Documents,
        };
        console.log("🔄 Updated selectedCompany:", updated);
        return updated;
      });

      // Show success message
      toast({
        title: "Success",
        description: "Document removed successfully!",
      });

      console.log(
        "✅ handleRemoveStep4AdditionalDocument completed successfully",
      );
    } catch (error) {
      console.error("Error removing step 4 additional document:", error);
      toast({
        title: "Error",
        description: "Failed to remove document. Please try again.",
        variant: "destructive",
      });
    }
  };
  // Function to delete admin signed document
  const handleDeleteAdminSignedDocument = async (
    companyId: string,
    resolutionIndex: number,
    documentIndex: number,
  ) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this admin signed document? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      console.log(
        `🗑️ handleDeleteAdminSignedDocument called with companyId: ${companyId}, resolutionIndex: ${resolutionIndex}, documentIndex: ${documentIndex}`,
      );

      // Get current registration from database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        toast({
          title: "Error",
          description: "Failed to fetch registration data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const registration = await response.json();
      console.log("📄 Current registration data:", registration);

      // Get current resolutions (customer submitted documents)
      const currentResolutions = registration.resolutions_docs || [];

      if (resolutionIndex < 0 || resolutionIndex >= currentResolutions.length) {
        console.error("❌ Resolution index out of bounds:", resolutionIndex);
        toast({
          title: "Error",
          description: "Resolution not found.",
          variant: "destructive",
        });
        return;
      }

      const currentResolution = currentResolutions[resolutionIndex];
      const currentSignedDocuments = currentResolution.signedDocuments || [];

      if (documentIndex < 0 || documentIndex >= currentSignedDocuments.length) {
        console.error(
          "❌ Document index out of bounds:",
          documentIndex,
          "Array length:",
          currentSignedDocuments.length,
        );
        toast({
          title: "Error",
          description: "Signed document not found.",
          variant: "destructive",
        });
        return;
      }

      const documentToDelete = currentSignedDocuments[documentIndex];
      console.log("🗑️ Document to delete:", documentToDelete);

      // Delete file from file storage
      console.log("🗑️ Deleting admin signed document from file storage...");
      try {
        const { fileUploadClient } = await import("@/lib/file-upload-client");

        if (documentToDelete.id) {
          const deleteResult = await fileUploadClient.deleteFileById(
            documentToDelete.id,
          );
          if (deleteResult.success) {
            console.log(
              `✅ Admin signed document file deleted from storage: ${documentToDelete.name}`,
            );
          } else {
            console.warn(
              `⚠️ Failed to delete admin signed document file from storage: ${documentToDelete.name}`,
              deleteResult.error,
            );
          }
        } else if (documentToDelete.filePath) {
          const deleteResult = await fileUploadClient.deleteFile(
            documentToDelete.filePath,
          );
          if (deleteResult.success) {
            console.log(
              `✅ Admin signed document file deleted from storage: ${documentToDelete.name}`,
            );
          } else {
            console.warn(
              `⚠️ Failed to delete admin signed document file from storage: ${documentToDelete.name}`,
              deleteResult.error,
            );
          }
        }
      } catch (fileError) {
        console.warn(
          "⚠️ Error deleting admin signed document file from storage:",
          fileError,
        );
        // Continue with database deletion even if file deletion fails
      }

      // Remove document from signed documents array
      const updatedSignedDocuments = currentSignedDocuments.filter(
        (_: any, index: number) => index !== documentIndex,
      );

      // Update the specific resolution
      const updatedResolutions = [...currentResolutions];
      updatedResolutions[resolutionIndex] = {
        ...currentResolution,
        signedDocuments: updatedSignedDocuments,
      };

      // Update company data in the database
      const updatedCompany = {
        ...registration,
        resolutions_docs: updatedResolutions,
      };

      // Save to database
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCompany),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to delete admin signed document");
      }

      // Update local state
      setSelectedCompany((prev: any) => {
        const updated = {
          ...prev,
          resolutions_docs: updatedResolutions,
        };
        return updated;
      });

      // Dispatch event to notify customer UI
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            companyId: companyId,
            type: "admin-signed-document-deleted",
          },
        }),
      );

      toast({
        title: "Success",
        description: "Admin signed document deleted successfully!",
      });

      console.log("✅ Admin signed document deleted successfully");
    } catch (error) {
      console.error("Error deleting admin signed document:", error);
      toast({
        title: "Error",
        description:
          "Failed to delete admin signed document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to remove corporate record document from corporate records
  const handleRemoveCorporateRecordDocument = async (
    companyId: string,
    resolutionIndex: number,
    documentIndex: number,
  ) => {
    // UI only - no backend functionality
    alert("Remove document functionality removed - UI only");
    return;

    // Get current registration from database
    const response = await fetch(`/api/registrations/${companyId}`);
    if (!response.ok) {
      console.error(
        "❌ Failed to fetch registration from database:",
        response.status,
        response.statusText,
      );
      toast({
        title: "Error",
        description: "Failed to fetch registration data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const currentRegistration = await response.json();
    const currentResolutions = currentRegistration.resolutions_docs || [];

    if (resolutionIndex >= currentResolutions.length) {
      console.error("❌ Resolution index out of range:", resolutionIndex);
      toast({
        title: "Error",
        description: "Resolution not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const currentResolution = currentResolutions[resolutionIndex];
    const currentDocuments = currentResolution.documents || [];

    if (documentIndex >= currentDocuments.length) {
      console.error("❌ Document index out of range:", documentIndex);
      toast({
        title: "Error",
        description: "Document not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Get the document to be deleted
    const documentToDelete = currentDocuments[documentIndex];
    console.log("📄 Document to delete:", documentToDelete);

    // Delete file from file storage
    console.log("🗑️ Deleting file from file storage...");
    try {
      const { fileUploadClient } = await import("@/lib/file-upload-client");

      if (documentToDelete.filePath) {
        const deleteResult = await fileUploadClient.deleteFile(
          documentToDelete.filePath,
        );
        if (deleteResult.success) {
          console.log("✅ File deleted from file storage successfully");
        } else {
          console.warn(
            "⚠️ Failed to delete file from file storage:",
            deleteResult.error,
          );
          // Continue with database deletion even if file deletion fails
        }
      } else {
        console.warn(
          "⚠️ No filePath found for document, skipping file deletion",
        );
      }
    } catch (fileError) {
      console.warn("⚠️ Error deleting file from storage:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Remove document from array
    const updatedDocuments = currentDocuments.filter(
      (_: any, index: number) => index !== documentIndex,
    );
    console.log("📄 Updated documents array:", updatedDocuments);

    // Update the resolution with the updated documents
    const updatedResolution = {
      ...currentResolution,
      documents: updatedDocuments,
    };

    // Update the resolutions array
    const updatedResolutions = [...currentResolutions];
    updatedResolutions[resolutionIndex] = updatedResolution;

    // Update MySQL database
    console.log("📝 Updating database...");
    const updateResponse = await fetch(`/api/registrations/${companyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...currentRegistration,
        resolutions_docs: updatedResolutions,
        updatedAt: new Date().toISOString(),
      }),
    });

    console.log("📥 Update response status:", updateResponse.status);

    if (!updateResponse.ok) {
      console.error(
        "❌ Failed to remove corporate record document from database:",
        updateResponse.status,
        updateResponse.statusText,
      );
      const errorText = await updateResponse.text();
      console.error("Error details:", errorText);
      toast({
        title: "Error",
        description:
          "Failed to remove document from database. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const updateResult = await updateResponse.json();
    console.log("✅ Update result:", updateResult);
    console.log(
      "✅ Corporate record document removed from MySQL database successfully",
    );

    // Update local state
    setSelectedCompany((prev: any) => {
      console.log(
        "🔄 Updating local state after corporate record document removal",
      );
      const updatedResolutions = [...(prev.resolutions_docs || [])];
      if (updatedResolutions[resolutionIndex]) {
        updatedResolutions[resolutionIndex] = {
          ...updatedResolutions[resolutionIndex],
          documents: updatedDocuments,
        };
      }
      const updated = {
        ...prev,
        resolutions_docs: updatedResolutions,
      };
      console.log("🔄 Updated selectedCompany:", updated);
      return updated;
    });

    // Show success message
    toast({
      title: "Success",
      description: "Corporate record document removed successfully!",
    });
  };

  // Function to handle add document dialog submit
  const handleAddDocumentSubmit = async () => {
    if (additionalDocumentTitle.trim() && additionalDocumentFile) {
      console.log("🔍 handleAddDocumentSubmit - Debug info:");
      console.log("  - selectedCompany._id:", selectedCompany._id);
      console.log(
        "  - selectedCompany.currentStep:",
        selectedCompany.currentStep,
      );
      console.log("  - selectedCompany.status:", selectedCompany.status);
      console.log(
        "  - additionalDocumentTitle:",
        additionalDocumentTitle.trim(),
      );
      console.log(
        "  - additionalDocumentFile.name:",
        additionalDocumentFile.name,
      );

      // Check if we're in step 4 (incorporation step)
      const isStep4 =
        selectedCompany.currentStep === "incorporate" ||
        selectedCompany.status === "incorporation-processing";
      console.log("  - Is Step 4?", isStep4);

      if (isStep4) {
        console.log(
          "📁 handleAddDocumentSubmit - Calling handleStep4AdditionalDocumentUpload for step 4",
        );
        // For step 4, immediately save to file storage and database
        const success = await handleStep4AdditionalDocumentUpload(
          selectedCompany._id,
          additionalDocumentTitle.trim(),
          additionalDocumentFile,
        );
        if (!success) {
          console.error("❌ handleStep4AdditionalDocumentUpload failed");
          toast({
            title: "Error",
            description:
              "Failed to save document to database. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else {
        console.log(
          "📁 handleAddDocumentSubmit - Calling handleAdditionalDocumentUpload for step 3",
        );
        // For step 3, use the existing temporary storage approach
        handleAdditionalDocumentUpload(
          selectedCompany._id,
          additionalDocumentTitle.trim(),
          additionalDocumentFile,
        );
      }
      setAdditionalDocumentTitle("");
      setAdditionalDocumentFile(null);
      setShowAddDocumentDialog(false);
    }
  };

  // Function to handle new document file selection for Step 3
  const handleNewDocumentFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewDocument((prev) => ({ ...prev, file }));
    }
  };

  // Function to handle adding new document in Step 3
  const handleAddNewDocument = async () => {
    if (!newDocument.title.trim() || !newDocument.file) {
      return;
    }

    setIsUploadingNewDocument(true);
    setNewDocumentUploadProgress(0);

    // Clear any existing interval for new document upload
    if (progressIntervals.current["newDocument"]) {
      clearInterval(progressIntervals.current["newDocument"]);
    }

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setNewDocumentUploadProgress((prev) => {
        if (prev < 90) {
          return prev + 10;
        }
        clearInterval(progressInterval);
        delete progressIntervals.current["newDocument"];
        return prev;
      });
    }, 200);

    // Store the interval reference
    progressIntervals.current["newDocument"] = progressInterval;

    try {
      console.log(
        "📝 Admin - Starting immediate save of additional document...",
      );

      // Import the file upload client
      const { fileUploadClient } = await import("@/lib/file-upload-client");

      // Get current registration from MySQL database
      const response = await fetch(`/api/registrations/${selectedCompany._id}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        toast({
          title: "Error",
          description: "Failed to fetch registration data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const currentRegistration = await response.json();
      console.log(
        "📝 Admin - Current registration from database:",
        currentRegistration,
      );

      // Upload the file immediately
      console.log("📁 Uploading file to file storage...");
      const uploadResult = await fileUploadClient.uploadFile(
        newDocument.file,
        selectedCompany._id,
      );
      if (!uploadResult.success || !uploadResult.file) {
        console.error("❌ Failed to upload file to file storage");
        toast({
          title: "Error",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ File uploaded to file storage successfully");

      // Create the document object
      const newDocumentData = {
        name: newDocument.file.name,
        type: newDocument.file.type,
        size: newDocument.file.size,
        title: newDocument.title.trim(),
        signRequired: isSignRequired,
        uploadedAt: new Date().toISOString(),
        url: uploadResult.file.url,
        filePath: uploadResult.file.filePath,
        id: uploadResult.file.id,
      };

      // Add to existing step3 documents
      const existingStep3Documents =
        currentRegistration.step3AdditionalDoc || [];
      const updatedStep3Documents = [
        ...existingStep3Documents,
        newDocumentData,
      ];

      console.log("📝 Saving document to MySQL database...");

      // Update MySQL database immediately
      const updateResponse = await fetch(
        `/api/registrations/${selectedCompany._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...currentRegistration,
            step3AdditionalDoc: updatedStep3Documents,
            updatedAt: new Date().toISOString(),
          }),
        },
      );

      if (!updateResponse.ok) {
        console.error(
          "❌ Failed to save document to MySQL database:",
          updateResponse.status,
          updateResponse.statusText,
        );
        toast({
          title: "Error",
          description: "Failed to save document to database. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Document saved to MySQL database successfully");

      // Update local state
      setSelectedCompany((prev: any) => ({
        ...prev,
        step3AdditionalDoc: updatedStep3Documents,
      }));

      // Reset form
      setNewDocument({
        title: "",
        file: null,
      });
      setIsSignRequired(true); // Add this line to reset the sign required state
      setIsAddDocumentDialogOpen(false);

      // Show success message
      console.log(
        "✅ Step3 additional document added and saved to database successfully",
      );
      toast({
        title: "Success",
        description: "Document uploaded and saved successfully!",
      });
    } catch (error) {
      console.error("Error adding new document:", error);
      toast({
        title: "Error",
        description: "Error adding document. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Clear the interval if it still exists
      if (progressIntervals.current["newDocument"]) {
        clearInterval(progressIntervals.current["newDocument"]);
        delete progressIntervals.current["newDocument"];
      }
      setTimeout(() => {
        setIsUploadingNewDocument(false);
        setNewDocumentUploadProgress(0);
      }, 500);
    }
  };

  // Function to handle replacing additional document
  const handleReplaceAdditionalDocument = async (
    companyId: string,
    documentIndex: number,
    file: File,
  ) => {
    try {
      // Set upload state for this specific document
      setIsUploadingStep3AdditionalDoc((prev) => ({
        ...prev,
        [documentIndex]: true,
      }));
      setStep3AdditionalDocUploadProgress((prev) => ({
        ...prev,
        [documentIndex]: 0,
      }));

      // First check if it's a pending document
      const pendingDocuments = pendingStep3Documents.step3AdditionalDoc || [];
      if (pendingDocuments.length > 0) {
        // Replace in pending documents
        const existingDoc = pendingDocuments[documentIndex];
        if (!existingDoc) {
          console.error("Pending step 3 document not found for replacement");
          return;
        }

        // Create new document with same title but new file
        const newDocument = {
          ...existingDoc,
          name: file.name,
          type: file.type,
          size: file.size,
          file: file,
          uploadedAt: new Date().toISOString(),
        };

        // Update pending documents
        const updatedPendingDocuments = [...pendingDocuments];
        updatedPendingDocuments[documentIndex] = newDocument;

        setPendingStep3Documents((prev: any) => ({
          ...prev,
          step3AdditionalDoc: updatedPendingDocuments,
        }));

        console.log(
          `✅ Pending step 3 additional document replaced: ${file.name}`,
        );

        // Reset upload state for pending document
        setIsUploadingStep3AdditionalDoc((prev) => ({
          ...prev,
          [documentIndex]: false,
        }));
        setStep3AdditionalDocUploadProgress((prev) => ({
          ...prev,
          [documentIndex]: 0,
        }));
        return;
      }

      // If not pending, replace existing document in MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        return;
      }

      const currentRegistration = await response.json();
      const existingDocuments = currentRegistration.step3AdditionalDoc || [];
      const existingDoc = existingDocuments[documentIndex];

      if (!existingDoc) {
        console.error("Step 3 document not found for replacement");
        return;
      }

      // Import the file upload client
      const { fileUploadClient } = await import("@/lib/file-upload-client");

      // Upload the new file
      const uploadResult = await fileUploadClient.uploadFile(file, companyId);
      if (!uploadResult.success || !uploadResult.file) {
        console.error("❌ Failed to upload replacement file");
        return;
      }

      // Create new document with uploaded file data
      const newDocument = {
        ...existingDoc,
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadResult.file.url,
        filePath: uploadResult.file.filePath,
        id: uploadResult.file.id,
        uploadedAt: new Date().toISOString(),
      };

      // Update the document in the array
      const updatedDocuments = [...existingDocuments];
      updatedDocuments[documentIndex] = newDocument;

      // Update MySQL database
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentRegistration,
          step3AdditionalDoc: updatedDocuments,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (updateResponse.ok) {
        console.log(
          "✅ Step3 additional document replaced in MySQL database successfully",
        );

        // Update local state
        setSelectedCompany((prev: any) => ({
          ...prev,
          step3AdditionalDoc: updatedDocuments,
        }));
      } else {
        console.error(
          "❌ Failed to replace step3 document in database:",
          updateResponse.status,
          updateResponse.statusText,
        );
      }
    } catch (error) {
      console.error("Error replacing step 3 additional document:", error);
    } finally {
      // Reset upload state
      setIsUploadingStep3AdditionalDoc((prev) => ({
        ...prev,
        [documentIndex]: false,
      }));
      setStep3AdditionalDocUploadProgress((prev) => ({
        ...prev,
        [documentIndex]: 0,
      }));
    }
  };
  // Function to publish documents to customer
  const publishDocumentsToCustomer = async (companyId: string) => {
    try {
      console.log("📝 Admin - Publishing documents to customer...");

      // Import the file upload client
      const { fileUploadClient } = await import("@/lib/file-upload-client");

      // Get current registration from MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch registration from database:",
          response.status,
          response.statusText,
        );
        return;
      }

      const currentRegistration = await response.json();
      console.log(
        "📝 Admin - Current registration from database:",
        currentRegistration,
      );

      // Process pending documents and save files to storage
      let updatedRegistration = { ...currentRegistration };

      // Process form1
      if (pendingDocuments.form1 && pendingDocuments.form1.file) {
        const uploadResult = await fileUploadClient.uploadFile(
          pendingDocuments.form1.file,
          companyId,
        );
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.form1 = {
            ...pendingDocuments.form1,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined, // Remove the file object
          };
        }
      }

      // Process form19
      if (pendingDocuments.form19 && pendingDocuments.form19.file) {
        const uploadResult = await fileUploadClient.uploadFile(
          pendingDocuments.form19.file,
          companyId,
        );
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.form19 = {
            ...pendingDocuments.form19,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined, // Remove the file object
          };
        }
      }

      // Process aoa
      if (pendingDocuments.aoa && pendingDocuments.aoa.file) {
        const uploadResult = await fileUploadClient.uploadFile(
          pendingDocuments.aoa.file,
          companyId,
        );
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.aoa = {
            ...pendingDocuments.aoa,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined, // Remove the file object
          };
        }
      }

      // Process form18 array
      if (pendingDocuments.form18 && Array.isArray(pendingDocuments.form18)) {
        const processedForm18 = [];
        for (let i = 0; i < pendingDocuments.form18.length; i++) {
          const doc = pendingDocuments.form18[i];
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(
              doc.file,
              companyId,
            );
            if (uploadResult.success && uploadResult.file) {
              processedForm18.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined, // Remove the file object
              });
            }
          } else if (doc) {
            processedForm18.push(doc);
          } else {
            processedForm18.push(null);
          }
        }
        updatedRegistration.form18 = processedForm18;
      }

      // Process additional documents
      if (
        pendingStep4Documents.additionalDocuments &&
        Array.isArray(pendingStep4Documents.additionalDocuments)
      ) {
        const processedAdditionalDocuments = [];
        for (const doc of pendingStep4Documents.additionalDocuments) {
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(
              doc.file,
              companyId,
            );
            if (uploadResult.success && uploadResult.file) {
              processedAdditionalDocuments.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined, // Remove the file object
              });
            }
          } else if (doc) {
            processedAdditionalDocuments.push(doc);
          }
        }

        // Merge with existing additional documents
        const existingAdditionalDocuments =
          updatedRegistration.additionalDocuments || [];
        updatedRegistration.additionalDocuments = [
          ...existingAdditionalDocuments,
          ...processedAdditionalDocuments,
        ];
      }

      // Process step 3 additional documents
      if (
        pendingStep3Documents.step3AdditionalDoc &&
        Array.isArray(pendingStep3Documents.step3AdditionalDoc)
      ) {
        const processedStep3Documents = [];
        for (const doc of pendingStep3Documents.step3AdditionalDoc) {
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(
              doc.file,
              companyId,
            );
            if (uploadResult.success && uploadResult.file) {
              processedStep3Documents.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined, // Remove the file object
              });
            }
          } else if (doc) {
            processedStep3Documents.push(doc);
          }
        }

        // Merge with existing step 3 additional documents
        const existingStep3Documents =
          updatedRegistration.step3AdditionalDoc || [];
        updatedRegistration.step3AdditionalDoc = [
          ...existingStep3Documents,
          ...processedStep3Documents,
        ];
      }

      updatedRegistration.documentsPublished = true;
      updatedRegistration.documentsPublishedAt = new Date().toISOString();
      updatedRegistration.status = "documents-published"; // Set status to allow customer to see documents
      updatedRegistration.updatedAt = new Date().toISOString();

      // Save to MySQL database
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedRegistration),
      });

      if (updateResponse.ok) {
        console.log(
          "✅ Documents published to customer and saved to MySQL database successfully",
        );

        // Send email notification to customer (using user's registered email)
        try {
          console.log("📧 Sending documents published email to customer...");
          const emailResponse = await fetch(
            "/api/notifications/send-documents-published",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                registrationId: selectedCompany._id,
                companyName: selectedCompany.companyNameEnglish,
              }),
            },
          );

          if (emailResponse.ok) {
            console.log(
              "✅ Documents published email sent successfully to user's registered email",
            );
          } else {
            console.error(
              "❌ Failed to send documents published email to user's registered email:",
              await emailResponse.text(),
            );
          }
        } catch (emailError) {
          console.error(
            "❌ Error sending documents published email:",
            emailError,
          );
          // Don't block the flow if email fails
        }

        // Update the selected company in state
        setSelectedCompany({
          ...updatedRegistration,
        });

        // Reset documentsChanged and pendingDocuments after publishing
        setDocumentsChanged(false);
        setPendingDocuments({});
        setPendingStep4Documents({}); // Reset pending additional documents
        setPendingStep3Documents({}); // Reset pending step 3 documents

        // Show success message
        setShowPublishSuccess(true);
        setTimeout(() => {
          setShowPublishSuccess(false);
        }, 3000); // Hide after 3 seconds
      } else {
        console.error(
          "❌ Failed to publish documents to database:",
          updateResponse.status,
          updateResponse.statusText,
        );
        toast({
          title: "Error",
          description: "Failed to publish documents. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error publishing documents:", error);
      toast({
        title: "Error",
        description: "Error publishing documents. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get role badge for user
  const getRoleBadge = () => {
    if (!user) return null; // Add null check for user

    if (isAdmin(user)) {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 ml-2"
        >
          <ShieldAlert className="h-3 w-3" /> Admin
        </Badge>
      );
    }
    return null;
  };

  // Function to handle balance payment receipt approval/rejection
  // Handle admin fee adjustment
  const handleApplyAdjustment = async () => {
    if (!adjustmentAmount || !adjustmentReason.trim()) {
      toast({
        title: "Error",
        description:
          "Please provide both amount and reason for the adjustment.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount === 0) {
      toast({
        title: "Error",
        description: "Please enter a valid non-zero amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current registration data
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch registration data");
      }
      const currentRegistration = await response.json();

      // Update additionalFees with admin adjustment
      const updatedAdditionalFees = {
        ...currentRegistration.additionalFees,
        adminAdjustment: {
          amount: amount,
          reason: adjustmentReason.trim(),
          adjustedAt: new Date().toISOString(),
          adjustedBy: user?.name || user?.email || "Admin",
        },
      };

      // Save to database
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentRegistration,
          additionalFees: updatedAdditionalFees,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to save adjustment");
      }

      // Dispatch update event
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "admin-adjustment-applied",
            registrationId: companyId,
            adjustment: {
              amount,
              reason: adjustmentReason.trim(),
            },
          },
        }),
      );

      // Clear form
      setAdjustmentAmount("");
      setAdjustmentReason("");

      toast({
        title: "Success",
        description: `Admin adjustment of Rs. ${amount.toLocaleString()} applied successfully.`,
      });

      console.log("✅ Admin adjustment applied successfully:", {
        amount,
        reason: adjustmentReason.trim(),
        companyId,
      });
    } catch (error) {
      console.error("Error applying admin adjustment:", error);
      toast({
        title: "Error",
        description: "Failed to apply adjustment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBalancePaymentApproval = async (
    companyId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      console.log(
        `📝 Admin - Updating balance payment status to ${status} for company ${companyId}`,
      );

      // First, get the current registration from MySQL database
      try {
        const response = await fetch(`/api/registrations/${companyId}`);
        if (!response.ok) {
          console.error(
            "❌ Failed to fetch registration from database:",
            response.status,
            response.statusText,
          );
          return;
        }

        const currentRegistration = await response.json();
        console.log(
          "📝 Admin - Current registration from database:",
          currentRegistration,
        );

        // Update the balance payment receipt status
        const updatedBalancePaymentReceipt = {
          ...currentRegistration.balancePaymentReceipt,
          status: status,
          reviewedAt: new Date().toISOString(),
          reviewedBy: user?.name || "Admin",
        };

        console.log(
          "📝 Admin - Updated balance payment receipt:",
          updatedBalancePaymentReceipt,
        );

        // Update MySQL database
        console.log("📝 Admin - Updating balance payment status in database");
        const updateResponse = await fetch(
          `/api/registrations/${companyId}/balance-payment`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              balancePaymentReceipt: updatedBalancePaymentReceipt,
            }),
          },
        );

        if (updateResponse.ok) {
          console.log(
            "✅ Balance payment status updated in database successfully",
          );

          // Update the selected company state with the new data
          const updatedCompany = {
            ...currentRegistration,
            balancePaymentReceipt: updatedBalancePaymentReceipt,
            // If rejected, redirect customer to step 3 (documentation)
            currentStep:
              status === "rejected"
                ? "documentation"
                : currentRegistration.currentStep,
          };

          setSelectedCompany(updatedCompany);
          setBalancePaymentApproved(status === "approved");

          // Dispatch event to notify of update
          window.dispatchEvent(
            new CustomEvent("registration-updated", {
              detail: {
                type: `balance-payment-${status}`,
                companyId: companyId,
                redirectToStep:
                  status === "rejected" ? "documentation" : undefined,
                preventNavigation: true, // Prevent admin from being redirected
              },
            }),
          );

          console.log(
            `✅ Balance payment receipt ${status} for company ${companyId}`,
          );

          // Send email notification for balance payment approval/rejection
          if (status === 'approved') {
            try {
              console.log("📧 Admin - Sending balance payment approval email for company:", companyId);
              console.log("📧 Admin - Email data:", {
                registrationId: companyId,
                companyName: currentRegistration.companyNameEnglish || currentRegistration.companyName,
                packageName: currentRegistration.selectedPackage
              });
              const emailResponse = await fetch('/api/notifications/payment-approval', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  registrationId: companyId,
                  companyName: currentRegistration.companyNameEnglish || currentRegistration.companyName,
                  packageName: currentRegistration.selectedPackage
                })
              })

              if (emailResponse.ok) {
                const responseData = await emailResponse.json();
                console.log('✅ Balance payment approval email sent successfully', responseData);
                if (!responseData.data?.emailSent) {
                  console.warn('⚠️ Email was not sent, but API returned success. Details:', responseData.data);
                }
              } else {
                console.error('Failed to send balance payment approval email:', await emailResponse.text())
              }
            } catch (emailError) {
              console.error('Error sending balance payment approval email:', emailError)
              // Don't fail the balance payment approval if email fails
            }
          } else if (status === 'rejected') {
            try {
              console.log("📧 Admin - Sending balance payment rejection email for company:", companyId);
              console.log("📧 Admin - Email data:", {
                registrationId: companyId,
                companyName: currentRegistration.companyNameEnglish || currentRegistration.companyName,
                packageName: currentRegistration.selectedPackage
              });
              const emailResponse = await fetch('/api/notifications/payment-rejection', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  registrationId: companyId,
                  packageName: currentRegistration.selectedPackage,
                  companyName: currentRegistration.companyNameEnglish || currentRegistration.companyName,
                  rejectionReason: 'Balance payment details require review. Please check your payment receipt and ensure all information is correct.'
                })
              })

              if (emailResponse.ok) {
                const responseData = await emailResponse.json();
                console.log('✅ Balance payment rejection email sent successfully', responseData);
                if (!responseData.data?.emailSent) {
                  console.warn('⚠️ Email was not sent, but API returned success. Details:', responseData.data);
                }
              } else {
                console.error('Failed to send balance payment rejection email:', await emailResponse.text())
              }
            } catch (emailError) {
              console.error('Error sending balance payment rejection email:', emailError)
              // Don't fail the balance payment rejection if email fails
            }
          }

        } else {
          console.error(
            "❌ Failed to update balance payment status in database:",
            updateResponse.status,
            updateResponse.statusText,
          );
        }
      } catch (dbError) {
        console.error(
          "❌ Error updating balance payment status in database:",
          dbError,
        );
      }
    } catch (error) {
      console.error("Error updating balance payment receipt status:", error);
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      console.log(
        "🎉 Admin - Completing registration for company:",
        selectedCompany._id,
      );

      // Get the most current registration from database
      const registration = await LocalStorageService.getRegistrationById(
        selectedCompany._id,
      );
      if (!registration) {
        console.error("Registration not found in database");
        return;
      }

      // Prepare the updated registration with completion data
      const updatedRegistration = {
        ...registration,
        status: "completed", // Mark registration as completed
        documentsSubmittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Include admin uploaded documents for customer access
        incorporationCertificate: selectedCompany.incorporationCertificate,
        additionalDocuments: selectedCompany.additionalDocuments || [],
      };

      // Save to database
      await LocalStorageService.saveRegistration(updatedRegistration);

      // Update localStorage as fallback
      const savedRegistrations = localStorage.getItem("registrations");
      let currentRegistrations = savedRegistrations
        ? JSON.parse(savedRegistrations)
        : [];

      currentRegistrations = currentRegistrations.map((reg: any) => {
        if (reg._id === selectedCompany._id) {
          return updatedRegistration;
        }
        return reg;
      });

      localStorage.setItem(
        "registrations",
        JSON.stringify(currentRegistrations),
      );

      // Update the selected company in state
      setSelectedCompany(updatedRegistration);

      // Set registration completed state to hide the button
      setRegistrationCompleted(true);

      console.log(
        "✅ Registration completed successfully:",
        updatedRegistration,
      );
      console.log(
        '📋 Status set to "completed" - Customer should now have access to step 4',
      );

      // Send email notification to customer (using user's registered email)
      try {
        console.log("📧 Sending registration completed email to customer...");
        const emailResponse = await fetch(
          "/api/notifications/registration-completed",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              registrationId: selectedCompany._id,
              companyName: selectedCompany.companyNameEnglish,
            }),
          },
        );

        if (emailResponse.ok) {
          console.log(
            "✅ Registration completed email sent successfully to user's registered email",
          );
        } else {
          console.error(
            "❌ Failed to send registration completed email to user's registered email",
          );
        }
      } catch (emailError) {
        console.error(
          "❌ Error sending registration completed email:",
          emailError,
        );
        // Don't block the flow if email fails
      }

      // Dispatch event to notify of update and allow customer access to step 4
      console.log(
        "📡 Dispatching registration-updated event for customer access...",
      );
      console.log("📡 Company ID:", selectedCompany._id);
      console.log("📡 Event type: registration-completed");

      const event = new CustomEvent("registration-updated", {
        detail: {
          type: "registration-completed",
          companyId: selectedCompany._id,
        },
      });

      // Dispatch the event
      window.dispatchEvent(event);
      console.log("📡 Event dispatched successfully:", event.detail);

      // Also dispatch a global event for testing
      const globalEvent = new CustomEvent("admin-complete-registration", {
        detail: {
          companyId: selectedCompany._id,
          status: "completed",
        },
      });
      window.dispatchEvent(globalEvent);
      console.log("📡 Global event also dispatched for testing");

      // Show success message
      toast({
        title: "Success",
        description:
          "Registration completed successfully! Customer can now access step 4.",
      });

      // Navigate back to admin dashboard after showing the message
      setTimeout(() => {
        navigateTo("adminDashboard");
      }, 2000); // Wait 2 seconds before redirecting
    } catch (error) {
      console.error("Error completing registration:", error);
      toast({
        title: "Error",
        description: "Error completing registration. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!selectedCompany) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">Company not found</p>
          <Button onClick={() => navigateTo("adminDashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-4 px-4 sm:py-8 sm:px-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigateTo("adminDashboard")}
          className="self-start sm:mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-1 gap-2">
          <h1 className="text-xl sm:text-2xl font-bold break-words">
            {selectedCompany.companyNameEnglish}
          </h1>
          <div className="flex items-center gap-2 self-start sm:ml-auto">
            {getStatusBadge(selectedCompany.status)}
          </div>
        </div>
      </div>

      <div className="mb-6 bg-white rounded-lg border p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setViewStep(1)}
              className="p-0 bg-transparent border-0 cursor-pointer"
              aria-label="Go to Step 1"
            >
              {renderStepStatus(1, viewStep, selectedCompany.status)}
            </button>
            <div className="h-0.5 w-8 sm:w-12 bg-muted"></div>
            <button
              type="button"
              onClick={() => setViewStep(2)}
              disabled={!selectedCompany.paymentApproved}
              className="p-0 bg-transparent border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to Step 2"
            >
              {renderStepStatus(2, viewStep, selectedCompany.status)}
            </button>
            <div className="h-0.5 w-8 sm:w-12 bg-muted"></div>
            <button
              type="button"
              onClick={() => setViewStep(3)}
              disabled={!selectedCompany.detailsApproved}
              className="p-0 bg-transparent border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to Step 3"
            >
              {renderStepStatus(3, viewStep, selectedCompany.status)}
            </button>
            <div className="h-0.5 w-8 sm:w-12 bg-muted"></div>
            <button
              type="button"
              onClick={() => setViewStep(4)}
              disabled={!selectedCompany.documentsApproved}
              className="p-0 bg-transparent border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to Step 4"
            >
              {renderStepStatus(4, viewStep, selectedCompany.status)}
            </button>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewStep(1)}
              className={viewStep === 1 ? "bg-muted" : ""}
            >
              Contact
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewStep(2)}
              className={viewStep === 2 ? "bg-muted" : ""}
              disabled={!selectedCompany.paymentApproved}
            >
              Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewStep(3)}
              className={viewStep === 3 ? "bg-muted" : ""}
              disabled={!selectedCompany.detailsApproved}
            >
              Documents
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewStep(4)}
              className={viewStep === 4 ? "bg-muted" : ""}
              disabled={!selectedCompany.documentsApproved}
            >
              Incorporate
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-3 sm:p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-1 sm:gap-0">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              Created on{" "}
              {new Date(selectedCompany.createdAt).toLocaleDateString()}
            </div>
            <span className="hidden sm:inline mx-2">•</span>
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Last updated{" "}
              {new Date(
                selectedCompany.updatedAt || selectedCompany.createdAt,
              ).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Step 1: Contact Details */}
          {viewStep === 1 && (
            <div className="space-y-6 pb-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Package Information Card */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Package Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          Package
                        </h3>
                        {/* Enhanced package display with price information */}
                        {(() => {
                          const packageName =
                            selectedCompany.selectedPackage ||
                            selectedCompany.package?.name;
                          const pkgObj = getPackageInfo(packageName);

                          return (
                            <div>
                              {/* Package Price Details */}
                              {pkgObj && (
                                <div className="mt-1 space-y-1">
                                  {pkgObj.type === "advance-balance" ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                          Advance Payment:
                                        </span>
                                        <span className="font-semibold text-blue-700">
                                          {pkgObj.advanceAmount
                                            ? `Rs. ${pkgObj.advanceAmount.toLocaleString()}`
                                            : "Rs. 0"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                          Balance Payment:
                                        </span>
                                        <span className="font-semibold text-orange-700">
                                          {pkgObj.balanceAmount
                                            ? `Rs. ${pkgObj.balanceAmount.toLocaleString()}`
                                            : "Rs. 0"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                          Total Package:
                                        </span>
                                        <span className="font-semibold text-green-700">
                                          {pkgObj.price
                                            ? `Rs. ${pkgObj.price.toLocaleString()}`
                                            : "Rs. 0"}
                                        </span>
                                      </div>
                                      <div className="mt-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          Advance + Balance Payment
                                        </span>
                                      </div>
                                    </>
                                  ) : pkgObj.type === "one-time" ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                          Total Fee:
                                        </span>
                                        <span className="font-semibold text-green-700">
                                          {pkgObj.price
                                            ? `Rs. ${pkgObj.price.toLocaleString()}`
                                            : "Rs. 0"}
                                        </span>
                                      </div>
                                      <div className="mt-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          One-Time Payment
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">
                                        Price:
                                      </span>
                                      <span className="font-semibold text-gray-700">
                                        {pkgObj.price
                                          ? `Rs. ${pkgObj.price.toLocaleString()}`
                                          : "Not specified"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          Company Name
                        </h3>
                        {/* Display only English company name */}
                        {selectedCompany?.companyNameEnglish && (
                          <p className="font-bold text-lg text-primary bg-primary/10 p-2 rounded-md">
                            {selectedCompany?.companyNameEnglish}
                          </p>
                        )}
                        {/* Display Sinhala company name if available */}
                        {selectedCompany?.companyNameSinhala && (
                          <p className="font-bold text-lg text-primary bg-primary/10 p-2 rounded-md mt-2">
                            {selectedCompany?.companyNameSinhala}
                          </p>
                        )}
                        {/* Fallback if no company name is available */}
                        {!selectedCompany?.companyNameEnglish &&
                          !selectedCompany?.companyName &&
                          !selectedCompany?.companyNameSinhala && (
                            <p className="font-bold text-lg text-primary bg-primary/10 p-2 rounded-md">
                              Company name not provided
                            </p>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                  {/* User Profile Card - Aligned with Package Information Card */}
                  {(selectedCompany.userName || selectedCompany.userEmail) && (
                    <Card className="bg-blue-50 border-blue-100">
                      <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                          <User className="h-4 w-4" />
                          User Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        {selectedCompany.userName && (
                          <div className="flex items-start gap-2 mb-1">
                            <User className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-blue-500 uppercase font-medium">Name</p>
                              <p className="text-sm font-medium text-blue-700 truncate">{selectedCompany.userName}</p>
                            </div>
                          </div>
                        )}
                        {selectedCompany.userEmail && (
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-blue-500 uppercase font-medium">Email</p>
                              <p className="text-sm font-medium text-blue-700 truncate">{selectedCompany.userEmail}</p>
                            </div>
                          </div>
                        )}
                        {selectedCompany.userPassword && (
                          <div className="flex items-start gap-2 mt-1">
                            <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-blue-500 uppercase font-medium">Password</p>
                              <p className="text-sm font-medium text-blue-700 truncate">{selectedCompany.userPassword}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {/* Contact Information - Same Line */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Contact Person
                        </h3>
                        <p className="font-medium">
                          {selectedCompany.contactPersonName}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Email
                        </h3>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">
                            {selectedCompany.contactPersonEmail}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Phone
                        </h3>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">
                            {selectedCompany.contactPersonPhone}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Payment Method
                        </h3>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium capitalize">
                            {selectedCompany.paymentMethod
                              ? selectedCompany.paymentMethod
                                .replace(/([A-Z])/g, " $1")
                                .trim()
                              : "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Payment Receipt</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCompany.paymentReceipt ? (
                    <PaymentReceiptViewer
                      receipt={selectedCompany.paymentReceipt}
                    />
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No payment receipt uploaded</p>
                    </div>
                  )}
                </CardContent>
                {selectedCompany.status === "payment-processing" &&
                  canManage && (
                    <CardFooter className="flex justify-end gap-3 pt-0">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRejectPayment(selectedCompany._id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Reject Payment
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onApprovePayment(selectedCompany._id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve Payment
                      </Button>
                    </CardFooter>
                  )}
              </Card>
            </div>
          )}

          {/* Step 2: Company Details */}
          {viewStep === 2 && (
            <div className="space-y-6">
              {selectedCompany.companyNameEnglish ||
                selectedCompany.businessAddressNumber ||
                selectedCompany.shareholders ||
                selectedCompany.directors ? (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {selectedCompany.companyEntity && (
                        <div className="col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              Company Entity
                            </h3>
                            {!isEditingStep2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() =>
                                  handleCopy(
                                    "Company Entity",
                                    selectedCompany.companyEntity,
                                  )
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {isEditingStep2 ? (
                            <Input
                              value={editedCompanyData.companyEntity || ""}
                              onChange={(e) =>
                                setEditedCompanyData({
                                  ...editedCompanyData,
                                  companyEntity: e.target.value,
                                })
                              }
                              className="w-full"
                            />
                          ) : (
                            <p className="text-primary bg-primary/10 p-2 rounded-md">
                              {selectedCompany.companyEntity}
                            </p>
                          )}
                        </div>
                      )}
                      {(selectedCompany.companyNameEnglish ||
                        selectedCompany.companyNameSinhala) && (
                          <div className="col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {selectedCompany.companyNameEnglish && (
                              <div className="col-span-2 lg:col-span-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-medium text-muted-foreground">
                                    Company Name (English)
                                  </h3>
                                  {!isEditingStep2 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() =>
                                        handleCopy(
                                          "Company Name (English)",
                                          selectedCompany.companyNameEnglish,
                                        )
                                      }
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                {isEditingStep2 ? (
                                  <Input
                                    value={editedCompanyData.companyNameEnglish || ""}
                                    onChange={(e) =>
                                      setEditedCompanyData({
                                        ...editedCompanyData,
                                        companyNameEnglish: e.target.value,
                                      })
                                    }
                                    className="w-full"
                                  />
                                ) : (
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {selectedCompany.companyNameEnglish}
                                  </p>
                                )}
                              </div>
                            )}
                            {selectedCompany.companyNameSinhala && (
                              <div className="col-span-2 lg:col-span-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-medium text-muted-foreground">
                                    Company Name (Sinhala)
                                  </h3>
                                  {!isEditingStep2 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() =>
                                        handleCopy(
                                          "Company Name (Sinhala)",
                                          selectedCompany.companyNameSinhala,
                                        )
                                      }
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                {isEditingStep2 ? (
                                  <Input
                                    value={editedCompanyData.companyNameSinhala || ""}
                                    onChange={(e) =>
                                      setEditedCompanyData({
                                        ...editedCompanyData,
                                        companyNameSinhala: e.target.value,
                                      })
                                    }
                                    className="w-full"
                                  />
                                ) : (
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {selectedCompany.companyNameSinhala}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                      {/* Action Buttons Card - positioned after company names */}
                      <div className="col-span-2">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">
                              Company Details Actions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col sm:flex-row gap-3">
                              {/* Edit button - only visible to admins when not in edit mode */}
                              {canManage && !isEditingStep2 && (
                                <Button
                                  variant="outline"
                                  className="flex items-center gap-2 w-full sm:w-auto"
                                  onClick={() => {
                                    // Initialize edited data with current company data
                                    setEditedCompanyData({ ...selectedCompany });
                                    setIsEditingStep2(true);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                  Edit Details
                                </Button>
                              )}
                              
                              {/* Cancel edit button - only visible when in edit mode */}
                              {isEditingStep2 && (
                                <Button
                                  variant="outline"
                                  className="flex items-center gap-2 w-full sm:w-auto"
                                  onClick={() => {
                                    setIsEditingStep2(false);
                                    setEditedCompanyData({});
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                  Cancel Edit
                                </Button>
                              )}
                              
                              {/* Save edit button - only visible when in edit mode */}
                              {isEditingStep2 && (
                                <Button
                                  variant="default"
                                  className="flex items-center gap-2 w-full sm:w-auto bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    try {
                                      // Update database
                                      const response = await fetch(
                                        `/api/registrations/${selectedCompany._id}`,
                                        {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            ...editedCompanyData,
                                            updatedAt: new Date().toISOString(),
                                          }),
                                        },
                                      );

                                      if (response.ok) {
                                        const responseData = await response.json();
                                        console.log("✅ Database response:", responseData);

                                        // Update local state
                                        setSelectedCompany(editedCompanyData);
                                        setIsEditingStep2(false);

                                        toast({
                                          title: "Success",
                                          description: "Company details updated successfully",
                                        });

                                        // Notify customer UI
                                        window.dispatchEvent(
                                          new CustomEvent("registration-updated", {
                                            detail: {
                                              companyId: selectedCompany._id,
                                              type: "company-details-updated",
                                            },
                                          }),
                                        );
                                      } else {
                                        const errorText = await response.text();
                                        console.error(
                                          "❌ Database update failed:",
                                          response.status,
                                          errorText,
                                        );
                                        throw new Error("Failed to update company details");
                                      }
                                    } catch (error) {
                                      console.error("❌ Error updating company details:", error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to update company details. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Save Changes
                                </Button>
                              )}

                              {/* Lock and Reject buttons - hide when approved or in edit mode */}
                              {!isCompanyDetailsApproved && !isEditingStep2 && (
                                <>
                                  <Button
                                    variant="outline"
                                    className="flex items-center gap-2 w-full sm:w-auto"
                                    onClick={async () => {
                                      try {
                                        const newLockStatus =
                                          !isCompanyDetailsLocked;
                                        console.log(
                                          "🔒 Current lock status:",
                                          isCompanyDetailsLocked,
                                          "-> New status:",
                                          newLockStatus,
                                        );

                                        // Update database
                                        const response = await fetch(
                                          `/api/registrations/${selectedCompany._id}`,
                                          {
                                            method: "PUT",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              ...selectedCompany,
                                              companyDetailsLocked:
                                                newLockStatus,
                                              updatedAt:
                                                new Date().toISOString(),
                                            }),
                                          },
                                        );

                                        if (response.ok) {
                                          const responseData =
                                            await response.json();
                                          console.log(
                                            "🔒 Database response:",
                                            responseData,
                                          );

                                          // Update local state
                                          setIsCompanyDetailsLocked(
                                            newLockStatus,
                                          );
                                          setSelectedCompany((prev: any) => ({
                                            ...prev,
                                            companyDetailsLocked: newLockStatus,
                                          }));

                                          console.log(
                                            "🔒 Local state updated to:",
                                            newLockStatus,
                                          );

                                          toast({
                                            title: "Success",
                                            description: newLockStatus
                                              ? "Company details booked successfully"
                                              : "Company details unbooked successfully",
                                          });

                                          // Notify customer UI
                                          console.log(
                                            "🔒 Admin dispatching lock change event:",
                                            {
                                              companyId: selectedCompany._id,
                                              type: "company-details-lock-changed",
                                              locked: newLockStatus,
                                            },
                                          );
                                          window.dispatchEvent(
                                            new CustomEvent(
                                              "registration-updated",
                                              {
                                                detail: {
                                                  companyId:
                                                    selectedCompany._id,
                                                  type: "company-details-lock-changed",
                                                  locked: newLockStatus,
                                                },
                                              },
                                            ),
                                          );
                                        } else {
                                          const errorText =
                                            await response.text();
                                          console.error(
                                            "🔒 Database update failed:",
                                            response.status,
                                            errorText,
                                          );
                                          throw new Error(
                                            "Failed to update lock status",
                                          );
                                        }
                                      } catch (error) {
                                        console.error(
                                          "🔒 Error updating lock status:",
                                          error,
                                        );
                                        toast({
                                          title: "Error",
                                          description:
                                            "Failed to update book status. Please try again.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    <Shield className="h-4 w-4" />
                                    {isCompanyDetailsLocked ? "Unbook" : "Book"}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                    onClick={async () => {
                                      try {
                                        console.log(
                                          "❌ Rejecting company details...",
                                        );

                                        // Update database
                                        const response = await fetch(
                                          `/api/registrations/${selectedCompany._id}`,
                                          {
                                            method: "PUT",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              ...selectedCompany,
                                              companyDetailsRejected: true,
                                              companyDetailsLocked: false, // Unlock fields so customer can enter new name
                                              updatedAt:
                                                new Date().toISOString(),
                                            }),
                                          },
                                        );

                                        if (response.ok) {
                                          const responseData =
                                            await response.json();
                                          console.log(
                                            "❌ Database response:",
                                            responseData,
                                          );

                                          // Update local state
                                          setIsCompanyDetailsRejected(true);
                                          setIsCompanyDetailsLocked(false); // Unlock the fields
                                          setSelectedCompany((prev: any) => ({
                                            ...prev,
                                            companyDetailsRejected: true,
                                            companyDetailsLocked: false,
                                          }));

                                          console.log(
                                            "❌ Local state updated to rejected and unlocked",
                                          );

                                          toast({
                                            title: "Success",
                                            description:
                                              "Company details rejected. Fields unlocked for new name entry.",
                                          });

                                          // Notify customer UI
                                          console.log(
                                            "❌ Admin dispatching rejection event:",
                                            {
                                              companyId: selectedCompany._id,
                                              type: "company-details-rejected",
                                              rejected: true,
                                              locked: false,
                                            },
                                          );
                                          window.dispatchEvent(
                                            new CustomEvent(
                                              "registration-updated",
                                              {
                                                detail: {
                                                  companyId:
                                                    selectedCompany._id,
                                                  type: "company-details-rejected",
                                                  rejected: true,
                                                  locked: false,
                                                },
                                              },
                                            ),
                                          );
                                          // Send name rejection email after successful DB update
                                          try {
                                            const emailResponse = await fetch(
                                              "/api/notifications/name-rejection",
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  registrationId:
                                                    selectedCompany._id,
                                                  companyName:
                                                    selectedCompany.companyNameEnglish,
                                                  name: selectedCompany.contactPersonName,
                                                }),
                                              },
                                            );

                                            if (emailResponse.ok) {
                                              console.log(
                                                "📧 Name rejection email sent successfully",
                                              );
                                            } else {
                                              console.error(
                                                "❌ Failed to send name rejection email:",
                                                await emailResponse.text(),
                                              );
                                            }
                                          } catch (emailError) {
                                            console.error(
                                              "❌ Error sending name rejection email:",
                                              emailError,
                                            );
                                            // Do not block rejection flow on email failure
                                          }
                                        } else {
                                          const errorText =
                                            await response.text();
                                          console.error(
                                            "❌ Database update failed:",
                                            response.status,
                                            errorText,
                                          );
                                          throw new Error(
                                            "Failed to update rejection status",
                                          );
                                        }
                                      } catch (error) {
                                        console.error(
                                          "❌ Error updating rejection status:",
                                          error,
                                        );
                                        toast({
                                          title: "Error",
                                          description:
                                            "Failed to reject company details. Please try again.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    {isCompanyDetailsRejected
                                      ? "Reject Again"
                                      : "Reject"}
                                  </Button>
                                </>
                              )}
                              {/* Approve button - always visible, but hide when in edit mode */}
                              {!isEditingStep2 && (
                                <Button
                                  variant="default"
                                  className={`flex items-center gap-2 w-full sm:w-auto ${isCompanyDetailsApproved
                                    ? "bg-green-800 hover:bg-green-900 cursor-default"
                                    : "bg-green-600 hover:bg-green-700"
                                    }`}
                                  onClick={async () => {
                                    if (isCompanyDetailsApproved) return; // Don't allow clicking if already approved

                                    try {
                                      console.log(
                                        "✅ Approving company details...",
                                      );

                                      // Update database
                                      const response = await fetch(
                                        `/api/registrations/${selectedCompany._id}`,
                                        {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            ...selectedCompany,
                                            companyDetailsApproved: true,
                                            updatedAt: new Date().toISOString(),
                                          }),
                                        },
                                      );

                                      if (response.ok) {
                                        const responseData =
                                          await response.json();
                                        console.log(
                                          "✅ Database response:",
                                          responseData,
                                        );

                                        // Update local state
                                        setIsCompanyDetailsApproved(true);
                                        setIsCompanyDetailsLocked(false); // Reset lock state when approved
                                        setIsCompanyDetailsRejected(false); // Reset rejection state when approved
                                        setSelectedCompany((prev: any) => ({
                                          ...prev,
                                          companyDetailsApproved: true,
                                          companyDetailsLocked: false,
                                          companyDetailsRejected: false,
                                        }));

                                        console.log(
                                          "✅ Local state updated to approved",
                                        );

                                        toast({
                                          title: "Success",
                                          description:
                                            "Company details approved successfully",
                                        });

                                        // Notify customer UI
                                        console.log(
                                          "✅ Admin dispatching approval event:",
                                          {
                                            companyId: selectedCompany._id,
                                            type: "company-details-approved",
                                            approved: true,
                                          },
                                        );
                                        window.dispatchEvent(
                                          new CustomEvent(
                                            "registration-updated",
                                            {
                                              detail: {
                                                companyId: selectedCompany._id,
                                                type: "company-details-approved",
                                                approved: true,
                                              },
                                            },
                                          ),
                                        );
                                        // Send name approval email after successful DB update
                                        try {
                                          const emailResponse = await fetch(
                                            "/api/notifications/name-approval",
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                registrationId:
                                                  selectedCompany._id,
                                                companyName:
                                                  selectedCompany.companyNameEnglish,
                                                name: selectedCompany.contactPersonName,
                                              }),
                                            },
                                          );

                                          if (emailResponse.ok) {
                                            console.log(
                                              "📧 Name approval email sent successfully",
                                            );
                                          } else {
                                            console.error(
                                              "❌ Failed to send name approval email:",
                                              await emailResponse.text(),
                                            );
                                          }
                                        } catch (emailError) {
                                          console.error(
                                            "❌ Error sending name approval email:",
                                            emailError,
                                          );
                                        }
                                      } else {
                                        const errorText = await response.text();
                                        console.error(
                                          "✅ Database update failed:",
                                          response.status,
                                          errorText,
                                        );
                                        throw new Error(
                                          "Failed to update approval status",
                                        );
                                      }
                                    } catch (error) {
                                      console.error(
                                        "✅ Error updating approval status:",
                                        error,
                                      );
                                      toast({
                                        title: "Error",
                                        description:
                                          "Failed to approve company details. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  disabled={isCompanyDetailsApproved}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  {isCompanyDetailsApproved
                                    ? "Approved"
                                    : "Approve"}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {selectedCompany.sharePrice && (
                        <div className="col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              Outstanding shares
                            </h3>
                            {!isEditingStep2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() =>
                                  handleCopy(
                                    "Outstanding shares",
                                    typeof selectedCompany.sharePrice === "number"
                                      ? `${selectedCompany.sharePrice.toFixed(2)} LKR`
                                      : selectedCompany.sharePrice,
                                  )
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {isEditingStep2 ? (
                            <Input
                              value={editedCompanyData.sharePrice || ""}
                              onChange={(e) =>
                                setEditedCompanyData({
                                  ...editedCompanyData,
                                  sharePrice: e.target.value,
                                })
                              }
                              className="w-full"
                            />
                          ) : (
                            <p className="text-primary bg-primary/10 p-2 rounded-md">
                              {typeof selectedCompany.sharePrice === "number"
                                ? `${selectedCompany.sharePrice.toFixed(2)} LKR`
                                : selectedCompany.sharePrice}
                            </p>
                          )}
                        </div>
                      )}

                      {selectedCompany.isForeignOwned && (
                        <div className="col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              Foreign Owned
                            </h3>
                            {!isEditingStep2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() =>
                                  handleCopy(
                                    "Foreign Owned",
                                    String(selectedCompany.isForeignOwned),
                                  )
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {isEditingStep2 ? (
                            <Select
                              value={editedCompanyData.isForeignOwned || "no"}
                              onValueChange={(value: string) =>
                                setEditedCompanyData({
                                  ...editedCompanyData,
                                  isForeignOwned: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-primary bg-primary/10 p-2 rounded-md">
                              {selectedCompany.isForeignOwned}
                            </p>
                          )}
                        </div>
                      )}

                      {selectedCompany.makeSimpleBooksSecretary && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              Company Secretary
                            </h3>
                            {!isEditingStep2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() =>
                                  handleCopy(
                                    "Company Secretary",
                                    selectedCompany.makeSimpleBooksSecretary ===
                                      "yes"
                                      ? `${appTitle} acts as company secretary`
                                      : "Customer declined company secretary service",
                                  )
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {isEditingStep2 ? (
                            <Select
                              value={editedCompanyData.makeSimpleBooksSecretary || "yes"}
                              onValueChange={(value: string) =>
                                setEditedCompanyData({
                                  ...editedCompanyData,
                                  makeSimpleBooksSecretary: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-primary bg-primary/10 p-2 rounded-md">
                              {selectedCompany.makeSimpleBooksSecretary === "yes"
                                ? `${appTitle} acts as company secretary`
                                : "Customer declined company secretary service"}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Company Activities Field */}
                      {selectedCompany.companyActivities && (
                        <div className="col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              Company Activities
                            </h3>
                            {!isEditingStep2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() =>
                                  handleCopy(
                                    "Company Activities",
                                    selectedCompany.companyActivities,
                                  )
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {isEditingStep2 ? (
                            <Textarea
                              value={editedCompanyData.companyActivities || ""}
                              onChange={(e) =>
                                setEditedCompanyData({
                                  ...editedCompanyData,
                                  companyActivities: e.target.value,
                                })
                              }
                              className="w-full min-h-[100px]"
                            />
                          ) : (
                            <div className="text-primary bg-primary/10 p-3 rounded-md min-h-[100px] whitespace-pre-wrap break-words">
                              {selectedCompany.companyActivities}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Company Secretary Information */}
                      {(selectedCompany.companySecretary !== undefined ||
                        selectedCompany.isSimpleBooksSecretary !== undefined ||
                        selectedCompany.secretaryService !== undefined) && (
                          <div className="col-span-2 mt-2 pt-4 border-t">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-medium">
                                Company Secretary Information
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() =>
                                  handleCopy(
                                    "Company Secretary Information",
                                    selectedCompany.companySecretary === true ||
                                      selectedCompany.isSimpleBooksSecretary ===
                                      true ||
                                      selectedCompany.secretaryService === true ||
                                      selectedCompany.makeSimpleBooksSecretary ===
                                      "yes"
                                      ? `${appTitle} selected as company secretary`
                                      : "Customer declined company secretary service",
                                  )
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="bg-blue-50/50 rounded-md p-3">
                              <p className="text-primary bg-primary/10 p-2 rounded-md">
                                {selectedCompany.companySecretary === true ||
                                  selectedCompany.isSimpleBooksSecretary === true ||
                                  selectedCompany.secretaryService === true ||
                                  selectedCompany.makeSimpleBooksSecretary === "yes"
                                  ? `${appTitle} selected as company secretary`
                                  : "Customer declined company secretary service"}
                              </p>
                              {(selectedCompany.secretaryNotes ||
                                selectedCompany.secretaryDetails) && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {selectedCompany.secretaryNotes ||
                                      selectedCompany.secretaryDetails}
                                  </p>
                                )}
                            </div>
                          </div>
                        )}

                      {/* Natural Person Secretary Details (when customer selected No) */}
                      {selectedCompany.noSecretary && (
                        <div className="col-span-2 mt-2 pt-4 border-t">
                          <h3 className="text-sm font-medium mb-3">
                            Natural Person Secretary Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldWithCopy
                              label="First Name"
                              value={selectedCompany.noSecretary.firstName || "N/A"}
                            />
                            <FieldWithCopy
                              label="Last Name"
                              value={selectedCompany.noSecretary.lastName || "N/A"}
                            />
                            <FieldWithCopy
                              label="Date of Birth"
                              value={selectedCompany.noSecretary.dateOfBirth || "N/A"}
                            />
                            <FieldWithCopy
                              label="Designation"
                              value={selectedCompany.noSecretary.designation || "N/A"}
                            />
                            <FieldWithCopy
                              label="Secretary's Email"
                              value={selectedCompany.noSecretary.email || "N/A"}
                            />
                            <FieldWithCopy
                              label="Secretary's Contact Number"
                              value={selectedCompany.noSecretary.contactNumber || "N/A"}
                            />
                            <FieldWithCopy
                              label="Occupation"
                              value={selectedCompany.noSecretary.occupation || "N/A"}
                            />
                            <FieldWithCopy
                              label="Secretary Registration No"
                              value={selectedCompany.noSecretary.registrationNo || "N/A"}
                            />

                            {/* Address Details of Secretary */}
                            {(selectedCompany.noSecretary.address?.line1 ||
                              selectedCompany.noSecretary.address?.province ||
                              selectedCompany.noSecretary.address?.district ||
                              selectedCompany.noSecretary.address?.divisionalSecretariat ||
                              selectedCompany.noSecretary.address?.postalCode) && (
                              <div className="md:col-span-2 mt-2">
                                <h5 className="text-sm font-medium mb-3 text-muted-foreground">
                                  Address Details of Secretary
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {selectedCompany.noSecretary.address?.line1 && (
                                    <FieldWithCopy
                                      label="Address"
                                      value={selectedCompany.noSecretary.address.line1}
                                    />
                                  )}
                                  {selectedCompany.noSecretary.address?.province && (
                                    <FieldWithCopy
                                      label="Province"
                                      value={selectedCompany.noSecretary.address.province}
                                    />
                                  )}
                                  {selectedCompany.noSecretary.address?.district && (
                                    <FieldWithCopy
                                      label="District"
                                      value={selectedCompany.noSecretary.address.district}
                                    />
                                  )}
                                  {selectedCompany.noSecretary.address?.divisionalSecretariat && (
                                    <FieldWithCopy
                                      label="Divisional Secretariat"
                                      value={selectedCompany.noSecretary.address.divisionalSecretariat}
                                    />
                                  )}
                                  {selectedCompany.noSecretary.address?.postalCode && (
                                    <FieldWithCopy
                                      label="Postal Code"
                                      value={selectedCompany.noSecretary.address.postalCode}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                            {selectedCompany.noSecretary.nicAttachment && selectedCompany.noSecretary.nicAttachment.length > 0 && (
                              <div className="md:col-span-2 mt-2">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-muted-foreground">
                                    NIC Attachment
                                  </h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => handleCopy("NIC Attachment", selectedCompany.noSecretary.nicAttachment[0].name)}
                                    title="Copy filename"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md">
                                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                  <span className="text-sm text-primary flex-grow truncate">{selectedCompany.noSecretary.nicAttachment[0].name}</span>
                                  <Dialog open={isNicAttachmentViewerOpen} onOpenChange={setIsNicAttachmentViewerOpen}>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs flex-shrink-0"
                                        onClick={() => setIsNicAttachmentViewerOpen(true)}
                                      >
                                        <Eye className="h-3 w-3 mr-1" /> View
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl">
                                      <DialogHeader>
                                        <DialogTitle>NIC Attachment</DialogTitle>
                                      </DialogHeader>
                                      <div className="mt-4">
                                        <div className="flex items-center justify-between mb-4">
                                          <div>
                                            <p className="text-sm font-medium">
                                              {selectedCompany.noSecretary.nicAttachment[0].name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {selectedCompany.noSecretary.nicAttachment[0].type}
                                            </p>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const link = document.createElement('a');
                                              link.href = selectedCompany.noSecretary.nicAttachment[0].url;
                                              link.download = selectedCompany.noSecretary.nicAttachment[0].name;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }}
                                          >
                                            <Download className="h-4 w-4 mr-1" /> Download
                                          </Button>
                                        </div>
                                        <div className="border rounded-md p-2 bg-muted/20">
                                          {selectedCompany.noSecretary.nicAttachment[0].type?.startsWith('image/') ? (
                                            <img
                                              src={selectedCompany.noSecretary.nicAttachment[0].url || "/placeholder.svg"}
                                              alt="NIC Attachment"
                                              className="max-w-full h-auto mx-auto"
                                              style={{ maxHeight: "70vh" }}
                                            />
                                          ) : selectedCompany.noSecretary.nicAttachment[0].type === 'application/pdf' ? (
                                            <div className="aspect-video">
                                              <iframe src={selectedCompany.noSecretary.nicAttachment[0].url} className="w-full h-full" title="PDF Viewer"></iframe>
                                            </div>
                                          ) : (
                                            <div className="p-8 text-center">
                                              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                              <p>This file type cannot be previewed. Please download to view.</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs flex-shrink-0"
                                    onClick={() => {
                                      const fileUrl = selectedCompany.noSecretary.nicAttachment[0].url;
                                      if (fileUrl) {
                                        const link = document.createElement('a');
                                        link.href = fileUrl;
                                        link.download = selectedCompany.noSecretary.nicAttachment[0].name;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }
                                    }}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Separator for Location Information */}
                      {(selectedCompany.businessAddressNumber ||
                        selectedCompany.businessAddressStreet ||
                        selectedCompany.businessAddressCity ||
                        selectedCompany.postalCode ||
                        selectedCompany.province ||
                        selectedCompany.district ||
                        selectedCompany.divisionalSecretariat ||
                        selectedCompany.gramaNiladhari) && (
                          <div className="col-span-2">
                            <div className="relative my-4">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                              </div>
                              <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-4 text-gray-500 font-medium">
                                  Company Address Information
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Business Address within Location Information */}
                      {(selectedCompany.businessAddressNumber ||
                        selectedCompany.businessAddressStreet ||
                        selectedCompany.businessAddressCity) && (
                          <div className="col-span-2">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-medium text-muted-foreground">
                                Company Address
                              </h3>
                              {!isEditingStep2 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() =>
                                    handleCopy(
                                      "Company Address",
                                      `${selectedCompany.businessAddressNumber || ""} ${selectedCompany.businessAddressStreet || ""}, ${selectedCompany.businessAddressCity || ""} ${selectedCompany.postalCode ? `- ${selectedCompany.postalCode}` : ""}`.trim(),
                                    )
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            {isEditingStep2 ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Input
                                  placeholder="Address Number"
                                  value={editedCompanyData.businessAddressNumber || ""}
                                  onChange={(e) =>
                                    setEditedCompanyData({
                                      ...editedCompanyData,
                                      businessAddressNumber: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  placeholder="Street"
                                  value={editedCompanyData.businessAddressStreet || ""}
                                  onChange={(e) =>
                                    setEditedCompanyData({
                                      ...editedCompanyData,
                                      businessAddressStreet: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  placeholder="City"
                                  value={editedCompanyData.businessAddressCity || ""}
                                  onChange={(e) =>
                                    setEditedCompanyData({
                                      ...editedCompanyData,
                                      businessAddressCity: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="space-y-1">
                                  <p className="text-primary bg-primary/10 p-2 rounded-md">
                                    {selectedCompany.businessAddressNumber || ""} {" "}
                                    {selectedCompany.businessAddressStreet || ""}
                                    {", "}
                                    {selectedCompany.businessAddressCity || ""} {" "}
                                    {selectedCompany.postalCode
                                      ? `- ${selectedCompany.postalCode}`
                                      : ""}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Administrative Location Information - Separate Fields */}
                      {(selectedCompany.province ||
                        selectedCompany.district ||
                        selectedCompany.divisionalSecretariat ||
                        selectedCompany.gramaNiladhari) && (
                          <div className="col-span-2">
                            {isEditingStep2 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Province</Label>
                                  <Input
                                    value={editedCompanyData.province || ""}
                                    onChange={(e) =>
                                      setEditedCompanyData({
                                        ...editedCompanyData,
                                        province: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">District</Label>
                                  <Input
                                    value={editedCompanyData.district || ""}
                                    onChange={(e) =>
                                      setEditedCompanyData({
                                        ...editedCompanyData,
                                        district: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Divisional Secretariat</Label>
                                  <Input
                                    value={editedCompanyData.divisionalSecretariat || ""}
                                    onChange={(e) =>
                                      setEditedCompanyData({
                                        ...editedCompanyData,
                                        divisionalSecretariat: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground mb-1">Grama Niladhari Division</Label>
                                  <Input
                                    value={editedCompanyData.gramaNiladhari || ""}
                                    onChange={(e) =>
                                      setEditedCompanyData({
                                        ...editedCompanyData,
                                        gramaNiladhari: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {selectedCompany.province && (
                                  <FieldWithCopy
                                    label="Province"
                                    value={getProvinceName(
                                      selectedCompany.province,
                                    )}
                                  />
                                )}
                                {selectedCompany.district && (
                                  <FieldWithCopy
                                    label="District"
                                    value={getDistrictName(
                                      selectedCompany.district,
                                      selectedCompany.province,
                                    )}
                                  />
                                )}
                                {selectedCompany.divisionalSecretariat && (
                                  <FieldWithCopy
                                    label="Divisional Secretariat"
                                    value={selectedCompany.divisionalSecretariat}
                                  />
                                )}
                                {selectedCompany.gramaNiladhari && (
                                  <FieldWithCopy
                                    label="Grama Niladhari Division"
                                    value={selectedCompany.gramaNiladhari}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                      {/* Separator for Business Contact Information */}
                      {(selectedCompany.businessEmail ||
                        selectedCompany.businessContactNumber) && (
                          <div className="col-span-2">
                            <div className="relative my-4">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                              </div>
                              <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-4 text-gray-500 font-medium">
                                  Company Contact Information
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Company Email and Contact Number Fields - Mobile Responsive */}
                      <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {selectedCompany.businessEmail && (
                          <div className="col-span-2 sm:col-span-1">
                            {isEditingStep2 ? (
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground mb-1">Company Email</Label>
                                <Input
                                  value={editedCompanyData.businessEmail || ""}
                                  onChange={(e) =>
                                    setEditedCompanyData({
                                      ...editedCompanyData,
                                      businessEmail: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            ) : (
                              <FieldWithCopy
                                label="Company Email"
                                value={selectedCompany.businessEmail}
                              />
                            )}
                          </div>
                        )}
                        {selectedCompany.businessContactNumber && (
                          <div className="col-span-2 sm:col-span-1">
                            {isEditingStep2 ? (
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground mb-1">Company Contact Number</Label>
                                <Input
                                  value={editedCompanyData.businessContactNumber || ""}
                                  onChange={(e) =>
                                    setEditedCompanyData({
                                      ...editedCompanyData,
                                      businessContactNumber: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            ) : (
                              <FieldWithCopy
                                label="Company Contact Number"
                                value={selectedCompany.businessContactNumber}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shareholders Section */}
                  {selectedCompany.shareholders &&
                    selectedCompany.shareholders.length > 0 && (
                      <div>
                        <h2 className="text-lg font-medium mb-3 flex items-center">
                          <User className="h-5 w-5 mr-2 text-primary" />
                          Shareholders ({selectedCompany.shareholders.length})
                        </h2>
                        <div className="space-y-4">
                          {selectedCompany.shareholders.map(
                            (shareholder: any, index: number) =>
                              isEditingStep2
                                ? renderEditableShareholderInfo(shareholder, index)
                                : renderShareholderInfo(shareholder, index),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Directors Section */}
                  {selectedCompany.directors &&
                    selectedCompany.directors.length > 0 && (
                      <div>
                        <h2 className="text-lg font-medium mb-3 flex items-center">
                          <Briefcase className="h-5 w-5 mr-2 text-primary" />
                          Directors ({selectedCompany.directors.length})
                        </h2>
                        <div className="space-y-4">
                          {selectedCompany.directors.map(
                            (director: any, index: number) =>
                              isEditingStep2
                                ? renderEditableDirectorInfo(director, index)
                                : renderDirectorInfo(director, index),
                          )}
                        </div>
                      </div>
                    )}


                  {/* Company Activities Section */}
                  {(selectedCompany.importExportStatus ||
                    selectedCompany.importsToAdd ||
                    selectedCompany.exportsToAdd ||
                    selectedCompany.otherBusinessActivities) && (
                      <Card className="mt-6">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            Company Activities
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedCompany.importExportStatus && (
                            <FieldWithCopy
                              label="Import/Export Status"
                              value={selectedCompany.importExportStatus.replace(
                                /-/g,
                                " ",
                              )}
                            />
                          )}

                          {selectedCompany.importsToAdd && (
                            <FieldWithCopy
                              label="Imports"
                              value={selectedCompany.importsToAdd}
                            />
                          )}

                          {selectedCompany.exportsToAdd && (
                            <FieldWithCopy
                              label="Exports"
                              value={selectedCompany.exportsToAdd}
                            />
                          )}

                          {selectedCompany.otherBusinessActivities && (
                            <div className="col-span-2">
                              <FieldWithCopy
                                label="Other Business Activities"
                                value={selectedCompany.otherBusinessActivities}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                  {canManage && (
                    <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3">
                      <Button
                        variant="destructive"
                        disabled={
                          !!selectedCompany?.erocRegistered || isMarkingEroc
                        }
                        onClick={async () => {
                          try {
                            if (selectedCompany?.erocRegistered) {
                              return;
                            }
                            setIsMarkingEroc(true);
                            console.log("EROC Registered button clicked");
                            console.log("Company ID:", selectedCompany._id);

                            // Get current registration from database
                            const response = await fetch(
                              `/api/registrations/${selectedCompany._id}`,
                            );
                            if (!response.ok) {
                              console.error(
                                "❌ Failed to fetch registration from database:",
                                response.status,
                                response.statusText,
                              );
                              toast({
                                title: "Error",
                                description: `Failed to fetch registration: ${response.status} ${response.statusText}`,
                                variant: "destructive",
                              });
                              return;
                            }

                            const currentRegistration = await response.json();
                            console.log(
                              "Current registration data:",
                              currentRegistration,
                            );

                            // Update the registration with EROC registered status
                            const updatedRegistration = {
                              ...currentRegistration,
                              erocRegistered: true,
                              updatedAt: new Date().toISOString(),
                            };

                            console.log("Sending update request with data:", {
                              erocRegistered:
                                updatedRegistration.erocRegistered,
                              id: updatedRegistration._id,
                            });

                            // Save to database
                            const updateResponse = await fetch(
                              `/api/registrations/${selectedCompany._id}`,
                              {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify(updatedRegistration),
                              },
                            );

                            console.log(
                              "Update response status:",
                              updateResponse.status,
                            );
                            console.log(
                              "Update response ok:",
                              updateResponse.ok,
                            );

                            if (updateResponse.ok) {
                              const result = await updateResponse.json();
                              console.log(
                                "✅ EROC registration status updated in database successfully:",
                                result,
                              );

                              // Update local state immediately
                              setSelectedCompany((prev: any) => ({
                                ...prev,
                                erocRegistered: true,
                              }));

                              // Dispatch event to notify customer UI immediately
                              window.dispatchEvent(
                                new CustomEvent("registration-updated", {
                                  detail: {
                                    type: "eroc-registered",
                                    companyId: selectedCompany._id,
                                  },
                                }),
                              );

                              toast({
                                title: "Success",
                                description:
                                  "Company marked as EROC registered successfully!",
                              });
                            } else {
                              const errorText = await updateResponse.text();
                              console.error(
                                "❌ Failed to update EROC registration status in database:",
                                updateResponse.status,
                                updateResponse.statusText,
                                errorText,
                              );
                              toast({
                                title: "Error",
                                description: `Failed to update EROC registration status: ${updateResponse.status} ${updateResponse.statusText}. ${errorText}`,
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            console.error(
                              "Error updating EROC registration status:",
                              error,
                            );
                            toast({
                              title: "Error",
                              description: `Error updating EROC registration status: ${error instanceof Error ? error.message : "Unknown error"}`,
                              variant: "destructive",
                            });
                          } finally {
                            setIsMarkingEroc(false);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />{" "}
                        {selectedCompany?.erocRegistered
                          ? "EROC Registered"
                          : isMarkingEroc
                            ? "Marking…"
                            : "EROC Registered"}
                      </Button>
                      {selectedCompany.status === "documentation-processing" &&
                        !selectedCompany.detailsApproved && (
                          <Button
                            onClick={() =>
                              onApproveDetails(selectedCompany._id)
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                            Company Details
                          </Button>
                        )}
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center py-6">
                    <div className="bg-blue-50 p-2 rounded-full mr-3">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium mb-1">
                        Waiting for Customer Information
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The customer has not yet submitted their company
                        details.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Documentation */}
          {viewStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Document Management
                      </CardTitle>
                      <CardDescription>
                        Upload and manage registration documents for the
                        customer
                      </CardDescription>
                    </div>
                    {isAnyUploadInProgress && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">
                          Upload in progress...
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUploadCard
                      title="FORM 1"
                      description="Application for incorporation"
                      document={pendingDocuments.form1 || selectedCompany.form1}
                      onUpload={(file: File) =>
                        handleDocumentUpload(selectedCompany._id, "form1", file)
                      }
                      disabled={!canManage}
                      showReplace={canManage}
                      isUploading={isUploadingForm1}
                      uploadProgress={form1UploadProgress}
                      isAnyUploadInProgress={isAnyUploadInProgress}
                    />

                    <DocumentUploadCard
                      title="FORM 19"
                      description="Consent and Certificate of Secretary"
                      document={
                        pendingDocuments.form19 || selectedCompany.form19
                      }
                      onUpload={(file: File) =>
                        handleDocumentUpload(
                          selectedCompany._id,
                          "form19",
                          file,
                        )
                      }
                      disabled={!canManage}
                      showReplace={canManage}
                      isUploading={isUploadingForm19}
                      uploadProgress={form19UploadProgress}
                      isAnyUploadInProgress={isAnyUploadInProgress}
                    />

                    <DocumentUploadCard
                      title="Articles of Association (AOA)"
                      description="Company's constitution document"
                      document={pendingDocuments.aoa || selectedCompany.aoa}
                      onUpload={(file: File) =>
                        handleDocumentUpload(selectedCompany._id, "aoa", file)
                      }
                      disabled={!canManage}
                      showReplace={canManage}
                      isUploading={isUploadingAoa}
                      uploadProgress={aoaUploadProgress}
                      isAnyUploadInProgress={isAnyUploadInProgress}
                    />

                    {/* Render Form 18 upload cards for each director */}
                    {Array.isArray(selectedCompany.directors) &&
                      selectedCompany.directors.length > 0 &&
                      selectedCompany.directors.map(
                        (director: any, idx: number) => (
                          <DocumentUploadCard
                            key={idx}
                            title={`FORM 18 - ${(director &&
                              typeof director === "object" &&
                              (director.name || director.fullName)) ||
                              `Director ${idx + 1}`
                              }`}
                            description={`Consent to act as director (${(director &&
                              typeof director === "object" &&
                              (director.name || director.fullName)) ||
                              `Director ${idx + 1}`
                              })`}
                            document={
                              Array.isArray(pendingDocuments.form18)
                                ? pendingDocuments.form18[idx]
                                : Array.isArray(selectedCompany.form18)
                                  ? selectedCompany.form18[idx]
                                  : null
                            }
                            onUpload={(file: File) =>
                              handleDocumentUpload(
                                selectedCompany._id,
                                "form18",
                                file,
                                idx,
                              )
                            }
                            disabled={!canManage}
                            showReplace={canManage}
                            isUploading={isUploadingForm18[idx]}
                            uploadProgress={form18UploadProgress[idx]}
                            isAnyUploadInProgress={isAnyUploadInProgress}
                          />
                        ),
                      )}

                    {/* Render Step 3 Additional Documents as individual cards */}
                    {/* Show pending step 3 additional documents first */}
                    {pendingStep3Documents.step3AdditionalDoc &&
                      pendingStep3Documents.step3AdditionalDoc.map(
                        (doc: any, index: number) => (
                          <DocumentUploadCard
                            key={`pending-step3-additional-${index}`}
                            title={doc.title}
                            description="Step 3 Additional document"
                            document={doc}
                            onUpload={(file: File) =>
                              handleReplaceAdditionalDocument(
                                selectedCompany._id,
                                index,
                                file,
                              )
                            }
                            onDelete={() =>
                              handleRemovePendingStep3AdditionalDocument(index)
                            }
                            disabled={!canManage}
                            showReplace={canManage}
                            isUploading={isUploadingStep3AdditionalDoc[index]}
                            uploadProgress={
                              step3AdditionalDocUploadProgress[index]
                            }
                            isAnyUploadInProgress={isAnyUploadInProgress}
                          />
                        ),
                      )}

                    {/* Show existing step 3 additional documents */}
                    {selectedCompany.step3AdditionalDoc &&
                      selectedCompany.step3AdditionalDoc.map(
                        (doc: any, index: number) => (
                          <DocumentUploadCard
                            key={`existing-step3-additional-${index}`}
                            title={doc.title}
                            description="Step 3 Additional document"
                            document={doc}
                            onUpload={(file: File) =>
                              handleReplaceAdditionalDocument(
                                selectedCompany._id,
                                index,
                                file,
                              )
                            }
                            onDelete={() =>
                              handleRemoveExistingStep3AdditionalDocument(
                                selectedCompany._id,
                                index,
                              )
                            }
                            disabled={!canManage}
                            showReplace={canManage}
                            isUploading={isUploadingStep3AdditionalDoc[index]}
                            uploadProgress={
                              step3AdditionalDocUploadProgress[index]
                            }
                            isAnyUploadInProgress={isAnyUploadInProgress}
                          />
                        ),
                      )}

                    {/* Add Document Button */}
                    {canManage && (
                      <div className="col-span-full">
                        <Dialog
                          open={isAddDocumentDialogOpen}
                          onOpenChange={setIsAddDocumentDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full h-20 border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 ${isAnyUploadInProgress ? "opacity-50 cursor-not-allowed" : ""}`}
                              disabled={isAnyUploadInProgress}
                            >
                              <Plus className="h-6 w-6 mr-2" />
                              Add Additional Document
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Add Additional Document</DialogTitle>
                              <DialogDescription>
                                Upload an additional document for the customer
                                with a custom name.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Document Title */}
                              <div>
                                <Label htmlFor="document-title">
                                  Document Title *
                                </Label>
                                <Input
                                  id="document-title"
                                  placeholder="e.g., Business License, Tax Certificate"
                                  value={newDocument.title}
                                  onChange={(e) =>
                                    setNewDocument((prev: any) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                />
                              </div>

                              {/* Sign Required Toggle */}
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label htmlFor="sign-required">
                                    Signature Required
                                  </Label>
                                  <p className="text-sm text-muted-foreground">
                                    Customer must sign this document before
                                    submission
                                  </p>
                                </div>
                                <Switch
                                  id="sign-required"
                                  checked={isSignRequired}
                                  onCheckedChange={setIsSignRequired}
                                />
                              </div>

                              {/* File Upload */}
                              <div>
                                <Label htmlFor="document-file">
                                  Document File *
                                </Label>
                                <Input
                                  id="document-file"
                                  type="file"
                                  onChange={handleNewDocumentFileSelect}
                                  accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
                                />
                                {newDocument.file && (
                                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-green-600" />
                                      <span className="text-sm text-green-800">
                                        {newDocument.file.name}
                                      </span>
                                      <span className="text-xs text-green-600">
                                        (
                                        {(newDocument.file.size / 1024).toFixed(
                                          1,
                                        )}{" "}
                                        KB)
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsAddDocumentDialogOpen(false);
                                  // Reset sign required state when closing dialog
                                  setIsSignRequired(true);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAddNewDocument}
                                disabled={
                                  !newDocument.title.trim() ||
                                  !newDocument.file ||
                                  isUploadingNewDocument
                                }
                              >
                                {isUploadingNewDocument ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  "Add Document"
                                )}
                              </Button>

                              {/* Progress Bar */}
                              {isUploadingNewDocument && (
                                <div className="mt-2 w-full">
                                  <Progress
                                    value={newDocumentUploadProgress}
                                    className="h-2"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {Math.round(newDocumentUploadProgress)}%
                                    complete
                                  </p>
                                </div>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardContent>
                {canManage && (
                  <CardFooter className="flex justify-end gap-3">
                    {showPublishSuccess && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm animate-in slide-in-from-left duration-300">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          Documents successfully submitted to customer
                        </span>
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        publishDocumentsToCustomer(selectedCompany._id);
                      }}
                      disabled={
                        !(pendingDocuments.form1 || selectedCompany.form1) ||
                        !(pendingDocuments.form19 || selectedCompany.form19) ||
                        !(pendingDocuments.aoa || selectedCompany.aoa) ||
                        !Array.isArray(
                          pendingDocuments.form18 || selectedCompany.form18,
                        ) ||
                        (pendingDocuments.form18 || selectedCompany.form18)
                          ?.length !==
                        (selectedCompany.directors?.length || 0) ||
                        (
                          pendingDocuments.form18 || selectedCompany.form18
                        )?.some((doc: any) => !doc) ||
                        (!documentsChanged &&
                          selectedCompany.documentsPublished) ||
                        // Check if there are any pending additional documents that need to be processed
                        (pendingStep4Documents.additionalDocuments &&
                          pendingStep4Documents.additionalDocuments.length >
                          0 &&
                          pendingStep4Documents.additionalDocuments.some(
                            (doc: any) => !doc.file,
                          ))
                      }
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      {selectedCompany.documentsPublished
                        ? documentsChanged
                          ? "Resubmit to Customer"
                          : "Documents Published"
                        : "Publish to Customer"}
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* Balance Payment Receipt Management */}
              {(() => {
                // Check if this is an advance+balance package
                const selectedPackage = availablePackages.find(
                  (pkg) =>
                    pkg.id === selectedCompany.selectedPackage ||
                    pkg.name === selectedCompany.selectedPackage,
                );
                const isAdvanceBalancePackage =
                  selectedPackage?.type === "advance-balance";

                console.log(
                  "🔍 Admin Step 3 - Balance payment section check:",
                  {
                    selectedPackageId: selectedCompany.selectedPackage,
                    selectedPackage: selectedPackage,
                    isAdvanceBalancePackage: isAdvanceBalancePackage,
                    hasBalancePaymentReceipt:
                      !!selectedCompany.balancePaymentReceipt,
                    balancePaymentReceipt:
                      selectedCompany.balancePaymentReceipt,
                  },
                );

                // Show balance payment section for advance+balance packages, regardless of receipt status
                return (
                  isAdvanceBalancePackage ||
                  selectedCompany.balancePaymentReceipt
                );
              })() && (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Balance Payment Receipt
                      </CardTitle>
                      <CardDescription>
                        Review and approve/reject the customer's balance payment
                        receipt
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Admin Fee Adjustment Section */}
                      {canManage && (
                        <div className="mb-4 p-4 border rounded-md bg-gray-50">
                          <Label className="text-sm font-medium">
                            Admin Fee Adjustment (Optional)
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <div>
                              <Input
                                type="number"
                                placeholder="Amount (+ to add, - to deduct)"
                                value={adjustmentAmount}
                                onChange={(e) =>
                                  setAdjustmentAmount(e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Input
                                placeholder="Reason for adjustment"
                                value={adjustmentReason}
                                onChange={(e) =>
                                  setAdjustmentReason(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleApplyAdjustment}
                            className="mt-2"
                            disabled={
                              !adjustmentAmount || !adjustmentReason.trim()
                            }
                          >
                            Apply Adjustment
                          </Button>
                        </div>
                      )}

                      {(() => {
                        try {
                          // Get package information
                          const selectedPackage = availablePackages.find(
                            (pkg) =>
                              pkg.id === selectedCompany.selectedPackage ||
                              pkg.name === selectedCompany.selectedPackage,
                          );
                          const packageBalanceAmount =
                            selectedPackage?.balanceAmount || 0;

                          // Get additional fees
                          const additional = (selectedCompany as any)
                            .additionalFees;
                          const directorsTotal = Number(
                            additional?.directors?.total || 0,
                          );
                          const shareholdersTotal = Number(
                            additional?.shareholders?.total || 0,
                          );
                          const additionalFeesTotal = Number(
                            additional?.total || 0,
                          );
                          const adminAdjustmentAmount = Number(
                            additional?.adminAdjustment?.amount || 0,
                          );
                          const adminAdjustment = additional?.adminAdjustment;

                          // Debug logging
                          console.log("🔍 Admin Balance Payment Debug:", {
                            selectedCompany: selectedCompany._id,
                            additionalFees: additional,
                            directorsTotal,
                            shareholdersTotal,
                            additionalFeesTotal,
                            packageBalanceAmount,
                            adminAdjustmentAmount,
                            adminAdjustment,
                          });

                          // Calculate total balance payment
                          const totalBalancePayment =
                            packageBalanceAmount +
                            additionalFeesTotal +
                            adminAdjustmentAmount;

                          return (
                            <div className="p-4 rounded-md bg-blue-50 border border-blue-200 text-blue-900 mb-4">
                              <div className="font-semibold mb-3 text-lg">
                                Balance Payment Calculation
                              </div>

                              {/* Package Balance Amount */}
                              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                                <span className="text-sm font-medium">
                                  Package Balance Amount:
                                </span>
                                <span className="text-sm font-semibold">
                                  Rs. {packageBalanceAmount.toLocaleString()}
                                </span>
                              </div>

                              {/* Directors Charges */}
                              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                                <span className="text-sm font-medium">
                                  Directors Charges:
                                </span>
                                <span className="text-sm font-semibold">
                                  Rs. {directorsTotal.toLocaleString()}
                                </span>
                              </div>

                              {/* Shareholders Charges */}
                              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                                <span className="text-sm font-medium">
                                  Shareholders Charges:
                                </span>
                                <span className="text-sm font-semibold">
                                  Rs. {shareholdersTotal.toLocaleString()}
                                </span>
                              </div>

                              {/* Admin Adjustment */}
                              {adminAdjustment && (
                                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                                  <span className="text-sm font-medium">
                                    Admin Adjustment ({adminAdjustment.reason}):
                                  </span>
                                  <span
                                    className={`text-sm font-semibold ${adminAdjustment.amount >= 0 ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {adminAdjustment.amount >= 0 ? "+" : ""}Rs.{" "}
                                    {adminAdjustment.amount.toLocaleString()}
                                  </span>
                                </div>
                              )}

                              {/* Total Balance Payment */}
                              <div className="flex justify-between items-center py-2 mt-2">
                                <span className="text-base font-bold">
                                  Total Balance Payment:
                                </span>
                                <span className="text-base font-bold text-blue-700">
                                  Rs. {totalBalancePayment.toLocaleString()}
                                </span>
                              </div>

                              {null}
                            </div>
                          );
                        } catch (error) {
                          console.error(
                            "Error calculating balance payment:",
                            error,
                          );
                          return null;
                        }
                      })()}
                      {selectedCompany.balancePaymentReceipt ? (
                        <div
                          className={`p-4 border rounded-md ${selectedCompany.balancePaymentReceipt.status ===
                            "approved"
                            ? "bg-green-50/30 border-green-200"
                            : selectedCompany.balancePaymentReceipt.status ===
                              "rejected"
                              ? "bg-red-50/30 border-red-200"
                              : "bg-yellow-50/30 border-yellow-200"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <FileText
                                className={`h-5 w-5 mr-3 ${selectedCompany.balancePaymentReceipt.status ===
                                  "approved"
                                  ? "text-green-600"
                                  : selectedCompany.balancePaymentReceipt
                                    .status === "rejected"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                                  }`}
                              />
                              <div>
                                <h3 className="font-medium">
                                  Balance Payment Receipt
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {selectedCompany.balancePaymentReceipt.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted:{" "}
                                  {new Date(
                                    selectedCompany.balancePaymentReceipt.submittedAt,
                                  ).toLocaleDateString()}
                                </p>
                                {(() => {
                                  // Calculate total balance payment amount
                                  const selectedPackage = availablePackages.find(
                                    (pkg) =>
                                      pkg.id === selectedCompany.selectedPackage,
                                  );
                                  const packageBalanceAmount =
                                    selectedPackage?.balanceAmount || 0;
                                  const additional = (selectedCompany as any)
                                    .additionalFees;
                                  const additionalFeesTotal = Number(
                                    additional?.total || 0,
                                  );
                                  const adminAdjustmentAmount = Number(
                                    additional?.adminAdjustment?.amount || 0,
                                  );
                                  const totalBalancePayment =
                                    packageBalanceAmount +
                                    additionalFeesTotal +
                                    adminAdjustmentAmount;

                                  return (
                                    <div className="mt-1">
                                      <p className="text-sm font-medium text-blue-600">
                                        💰 Total Balance Payment: Rs{" "}
                                        {totalBalancePayment.toLocaleString()}
                                      </p>
                                      {packageBalanceAmount > 0 && (
                                        <p className="text-xs text-gray-600">
                                          (Package: Rs{" "}
                                          {packageBalanceAmount.toLocaleString()}
                                          {additionalFeesTotal > 0
                                            ? ` + Additional Fees: Rs ${additionalFeesTotal.toLocaleString()}`
                                            : ""}
                                          )
                                        </p>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  selectedCompany.balancePaymentReceipt.status ===
                                    "approved"
                                    ? "default"
                                    : selectedCompany.balancePaymentReceipt
                                      .status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {selectedCompany.balancePaymentReceipt.status
                                  .charAt(0)
                                  .toUpperCase() +
                                  selectedCompany.balancePaymentReceipt.status.slice(
                                    1,
                                  )}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                              <span className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[150px]">
                                {selectedCompany.balancePaymentReceipt.name}
                              </span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              {selectedCompany.balancePaymentReceipt.type?.startsWith(
                                "image/",
                              ) ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 flex-1 sm:flex-none"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      <span className="text-xs sm:text-sm">
                                        View
                                      </span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="w-[95vw] max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Balance Payment Receipt Viewer
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">
                                      <div className="flex items-center justify-between mb-4">
                                        <div>
                                          <h3 className="font-medium">
                                            Balance Payment Receipt
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                            {
                                              selectedCompany
                                                .balancePaymentReceipt.name
                                            }
                                          </p>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const link =
                                              window.document.createElement("a");
                                            link.href =
                                              selectedCompany.balancePaymentReceipt.url;
                                            link.download =
                                              selectedCompany.balancePaymentReceipt.name;
                                            window.document.body.appendChild(link);
                                            link.click();
                                            window.document.body.removeChild(link);
                                          }}
                                        >
                                          <Download className="h-3.5 w-3.5 mr-1" />{" "}
                                          Download
                                        </Button>
                                      </div>
                                      <div className="border rounded-md h-96">
                                        <img
                                          src={
                                            selectedCompany.balancePaymentReceipt
                                              .url || "/placeholder.svg"
                                          }
                                          alt={
                                            selectedCompany.balancePaymentReceipt
                                              .name
                                          }
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : selectedCompany.balancePaymentReceipt.type ===
                                "application/pdf" ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 flex-1 sm:flex-none"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      <span className="text-xs sm:text-sm">
                                        View
                                      </span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="w-[95vw] max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Balance Payment Receipt Viewer
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">
                                      <div className="flex items-center justify-between mb-4">
                                        <div>
                                          <h3 className="font-medium">
                                            Balance Payment Receipt
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                            {
                                              selectedCompany
                                                .balancePaymentReceipt.name
                                            }
                                          </p>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const link =
                                              window.document.createElement("a");
                                            link.href =
                                              selectedCompany.balancePaymentReceipt.url;
                                            link.download =
                                              selectedCompany.balancePaymentReceipt.name;
                                            window.document.body.appendChild(link);
                                            link.click();
                                            window.document.body.removeChild(link);
                                          }}
                                        >
                                          <Download className="h-3.5 w-3.5 mr-1" />{" "}
                                          Download
                                        </Button>
                                      </div>
                                      <div className="border rounded-md h-96">
                                        <iframe
                                          src={
                                            selectedCompany.balancePaymentReceipt
                                              .url || ""
                                          }
                                          className="w-full h-full"
                                          title="PDF Viewer"
                                        ></iframe>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : null}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 flex-1 sm:flex-none"
                                onClick={() => {
                                  const link = window.document.createElement("a");
                                  link.href =
                                    selectedCompany.balancePaymentReceipt.url;
                                  link.download =
                                    selectedCompany.balancePaymentReceipt.name;
                                  window.document.body.appendChild(link);
                                  link.click();
                                  window.document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" /> Download
                              </Button>
                            </div>
                          </div>

                          {canManage &&
                            selectedCompany.balancePaymentReceipt.status ===
                            "pending" && (
                              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    handleBalancePaymentApproval(
                                      selectedCompany._id,
                                      "approved",
                                    )
                                  }
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />{" "}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleBalancePaymentApproval(
                                      selectedCompany._id,
                                      "rejected",
                                    )
                                  }
                                >
                                  <X className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              </div>
                            )}
                        </div>
                      ) : (
                        // No balance payment receipt submitted yet
                        <div className="p-4 border rounded-md bg-blue-50/30 border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 mr-3 text-blue-600" />
                              <div>
                                <h3 className="font-medium">
                                  Balance Payment Pending
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Customer has not submitted balance payment
                                  receipt yet
                                </p>
                                {(() => {
                                  // Calculate total required balance payment amount
                                  const selectedPackage = availablePackages.find(
                                    (pkg) =>
                                      pkg.id ===
                                      selectedCompany.selectedPackage ||
                                      pkg.name ===
                                      selectedCompany.selectedPackage,
                                  );
                                  const packageBalanceAmount =
                                    selectedPackage?.balanceAmount || 0;
                                  const additional = (selectedCompany as any)
                                    .additionalFees;
                                  const additionalFeesTotal = Number(
                                    additional?.total || 0,
                                  );
                                  const adminAdjustmentAmount = Number(
                                    additional?.adminAdjustment?.amount || 0,
                                  );
                                  const totalBalancePayment =
                                    packageBalanceAmount +
                                    additionalFeesTotal +
                                    adminAdjustmentAmount;

                                  return (
                                    <div className="mt-1">
                                      <p className="text-sm font-medium text-blue-600">
                                        💰 Required Balance Payment: Rs{" "}
                                        {totalBalancePayment.toLocaleString()}
                                      </p>
                                      {packageBalanceAmount > 0 && (
                                        <p className="text-xs text-gray-600">
                                          (Package: Rs{" "}
                                          {packageBalanceAmount.toLocaleString()}
                                          {additionalFeesTotal > 0
                                            ? ` + Additional Fees: Rs ${additionalFeesTotal.toLocaleString()}`
                                            : ""}
                                          )
                                        </p>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Pending</Badge>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-700">
                              <strong>Note:</strong> The customer needs to submit
                              the balance payment receipt before you can proceed
                              to incorporation. The total balance payment amount
                              is Rs{" "}
                              {(() => {
                                const selectedPackage = availablePackages.find(
                                  (pkg) =>
                                    pkg.id === selectedCompany.selectedPackage ||
                                    pkg.name === selectedCompany.selectedPackage,
                                );
                                const packageBalanceAmount =
                                  selectedPackage?.balanceAmount || 0;
                                const additional = (selectedCompany as any)
                                  .additionalFees;
                                const additionalFeesTotal = Number(
                                  additional?.total || 0,
                                );
                                const adminAdjustmentAmount = Number(
                                  additional?.adminAdjustment?.amount || 0,
                                );
                                const totalBalancePayment =
                                  packageBalanceAmount +
                                  additionalFeesTotal +
                                  adminAdjustmentAmount;
                                return totalBalancePayment.toLocaleString();
                              })()}
                              .
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Customer Submitted Documents */}
              {(() => {
                // Check if customer has submitted any documents
                const customerDocuments =
                  selectedCompany.customerDocuments || {};
                const hasCustomerDocuments =
                  Object.keys(customerDocuments).length > 0;
                const hasStep3SignedAdditionalDocs =
                  selectedCompany.step3SignedAdditionalDoc &&
                  Object.keys(selectedCompany.step3SignedAdditionalDoc).length >
                  0;

                if (!hasCustomerDocuments && !hasStep3SignedAdditionalDocs) {
                  return (
                    <Card className="mt-6">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                          Customer Submitted Documents
                        </CardTitle>
                        <CardDescription>
                          Documents uploaded by the customer after reviewing
                          your documents
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-6 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p>No customer documents submitted yet</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // Separate documents by type for better organization
                const normalDocs = Object.entries(customerDocuments).filter(
                  ([key, doc]: [string, any]) =>
                    key !== "form18" &&
                    key !== "addressProof" &&
                    key !== "additionalDocuments" &&
                    key !== "step3SignedAdditionalDoc",
                );
                const form18Docs = customerDocuments.form18 || [];
                const addressProofDoc = customerDocuments.addressProof
                  ? ["addressProof", customerDocuments.addressProof]
                  : null;

                // Handle additional documents
                const additionalDocs = customerDocuments.additionalDocuments
                  ? Object.entries(customerDocuments.additionalDocuments)
                  : [];

                // Handle step 3 signed additional documents
                const step3SignedAdditionalDocs =
                  selectedCompany.step3SignedAdditionalDoc
                    ? Object.entries(selectedCompany.step3SignedAdditionalDoc)
                    : [];

                const renderDocumentCard = (
                  [key, doc]: [string, any],
                  isForm18 = false,
                ) => {
                  return (
                    <Card key={key} className="border-dashed">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">
                              {doc.title || key}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {doc.size
                                ? `${(doc.size / 1024).toFixed(2)} KB`
                                : ""}{" "}
                              • {doc.type || "Unknown type"}
                            </p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-500 hidden sm:block" />
                        </div>

                        <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[150px]">
                              {doc.name}
                            </span>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 flex-1 sm:flex-none"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  <span className="text-xs sm:text-sm">
                                    View
                                  </span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[95vw] max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Document Viewer - {doc.title || key}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <h3 className="font-medium">
                                        {doc.title || key}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        {doc.name}
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (doc.url) {
                                          const link =
                                            window.document.createElement("a");
                                          link.href = doc.url;
                                          link.download = doc.name;
                                          window.document.body.appendChild(link);
                                          link.click();
                                          window.document.body.removeChild(link);
                                        } else if (doc.data) {
                                          const blob = new Blob([doc.data], {
                                            type:
                                              doc.type ||
                                              "application/octet-stream",
                                          });
                                          const url = URL.createObjectURL(blob);
                                          const link =
                                            window.document.createElement("a");
                                          link.href = url;
                                          link.download = doc.name;
                                          window.document.body.appendChild(link);
                                          link.click();
                                          window.document.body.removeChild(link);
                                          URL.revokeObjectURL(url);
                                        }
                                      }}
                                    >
                                      <Download className="h-3.5 w-3.5 mr-1" />{" "}
                                      Download
                                    </Button>
                                  </div>
                                  <div className="border rounded-md h-96">
                                    {doc.type?.startsWith("image/") ? (
                                      <img
                                        src={
                                          doc.url ||
                                          (doc.data
                                            ? URL.createObjectURL(
                                              new Blob([doc.data], {
                                                type: doc.type,
                                              }),
                                            )
                                            : "/placeholder.svg")
                                        }
                                        alt={doc.name}
                                        className="w-full h-full object-contain"
                                      />
                                    ) : doc.type === "application/pdf" ? (
                                      <iframe
                                        src={
                                          doc.url ||
                                          (doc.data
                                            ? URL.createObjectURL(
                                              new Blob([doc.data], {
                                                type: doc.type,
                                              }),
                                            )
                                            : "")
                                        }
                                        className="w-full h-full"
                                        title="PDF Viewer"
                                      ></iframe>
                                    ) : (
                                      <div className="p-8 text-center">
                                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                        <p>
                                          This file type cannot be previewed.
                                          Please download to view.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 flex-1 sm:flex-none"
                              onClick={() => {
                                if (doc.url) {
                                  const link = window.document.createElement("a");
                                  link.href = doc.url;
                                  link.download = doc.name;
                                  window.document.body.appendChild(link);
                                  link.click();
                                  window.document.body.removeChild(link);
                                } else if (doc.data) {
                                  const blob = new Blob([doc.data], {
                                    type:
                                      doc.type || "application/octet-stream",
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const link = window.document.createElement("a");
                                  link.href = url;
                                  link.download = doc.name;
                                  window.document.body.appendChild(link);
                                  link.click();
                                  window.document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                }
                              }}
                            >
                              <Download className="h-3.5 w-3.5 mr-1" /> Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                };

                return (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Customer Submitted Documents
                      </CardTitle>
                      <CardDescription>
                        Documents uploaded by the customer after reviewing your
                        documents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Render normal docs first */}
                        {normalDocs.map((doc) => renderDocumentCard(doc))}

                        {/* Then render Form 18 docs with director names (supports foreign directors) */}
                        {form18Docs.map((doc: any, index: number) => {
                          const director = Array.isArray(
                            selectedCompany.directors,
                          )
                            ? selectedCompany.directors[index]
                            : undefined;
                          const directorName =
                            director && typeof director === "object"
                              ? director.name || director.fullName
                              : "";
                          const title = `FORM 18 - ${directorName || `Director ${index + 1}`}`;
                          return renderDocumentCard(
                            [`form18-${index}`, { ...doc, title }],
                            true,
                          );
                        })}

                        {/* Finally render address proof if it exists */}
                        {addressProofDoc &&
                          renderDocumentCard(addressProofDoc as [string, any])}

                        {/* Render additional documents */}
                        {additionalDocs.length > 0 && (
                          <>
                            <div className="col-span-full mt-4 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Additional Documents
                              </h3>
                              <p className="text-sm text-gray-600">
                                Signed additional documents submitted by the
                                customer
                              </p>
                            </div>
                            {additionalDocs.map(
                              ([title, doc]: [string, any], index: number) =>
                                renderDocumentCard([
                                  `additional-${index}`,
                                  { ...doc, title: `Signed ${title}` },
                                ]),
                            )}
                          </>
                        )}

                        {/* Render step 3 signed additional documents */}
                        {step3SignedAdditionalDocs.length > 0 && (
                          <>
                            <div className="col-span-full mt-4 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Step 3 Additional Documents
                              </h3>
                              <p className="text-sm text-gray-600">
                                Signed step 3 additional documents submitted by
                                the customer
                              </p>
                            </div>
                            {step3SignedAdditionalDocs.map(
                              ([title, doc]: [string, any], index: number) =>
                                renderDocumentCard([
                                  `step3-additional-${index}`,
                                  { ...doc, title: `Signed ${title}` },
                                ]),
                            )}
                          </>
                        )}
                      </div>

                      {/* Continue to Incorporation button at the bottom */}
                      {canManage &&
                        !hideContinueToIncorporation &&
                        !isContinueHiddenPersisted && (
                          <div className="flex justify-end mt-6 pt-4 border-t">
                            <Button
                              onClick={() => {
                                setHideContinueToIncorporation(true);
                                onApproveDocuments(selectedCompany._id);
                                try {
                                  if (typeof window !== "undefined") {
                                    localStorage.setItem(
                                      `hide-continue-incorporation:${selectedCompany._id}`,
                                      "1",
                                    );
                                  }
                                } catch (e) { }
                              }}
                              className="gap-2"
                              disabled={(() => {
                                // Get the selected package
                                const selectedPackage = availablePackages.find(
                                  (pkg) =>
                                    pkg.id === selectedCompany.selectedPackage,
                                );

                                // Check if this is an advance+balance package that requires balance payment approval
                                const requiresBalancePayment =
                                  selectedPackage?.type === "advance-balance";

                                // Check if customer has submitted documents
                                const hasCustomerDocuments =
                                  selectedCompany.customerDocuments &&
                                  Object.keys(selectedCompany.customerDocuments)
                                    .length > 0;

                                // For one-time packages: Enable if customer has submitted documents
                                if (!requiresBalancePayment) {
                                  return !hasCustomerDocuments; // Only disable if no documents submitted
                                }

                                // For advance+balance packages: Enable only if balance payment is approved AND documents submitted
                                if (requiresBalancePayment) {
                                  return (
                                    !balancePaymentApproved ||
                                    !hasCustomerDocuments
                                  );
                                }

                                return true; // Default to disabled
                              })()}
                            >
                              <CheckCircle className="h-4 w-4" /> Continue to
                              Incorporation
                            </Button>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}
          {/* Step 4: Incorporation */}
          {viewStep === 4 && (
            <div className="space-y-6">
              <Card className="overflow-hidden border bg-card text-card-foreground shadow-sm relative">
                {selectedCompany.status === "completed" ? (
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8">
                    <div className="absolute transform rotate-45 bg-green-50/50 w-full h-full"></div>
                  </div>
                ) : (
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8">
                    <div className="absolute transform rotate-45 bg-indigo-50/50 w-full h-full"></div>
                  </div>
                )}

                <CardHeader className="pb-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Incorporation Status
                      </CardTitle>
                      <CardDescription>
                        Registration process status
                      </CardDescription>
                    </div>
                    {selectedCompany.status === "completed" ? (
                      <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        <span>In Progress</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pb-6 relative z-10">
                  {selectedCompany.status === "completed" ? (
                    <div className="flex items-start space-x-4 mt-4">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium mb-1">
                          Successfully Incorporated
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          All documents have been processed and the company has
                          been officially registered.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-4 mt-4">
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium mb-1">
                          Processing Registration
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Documents approved and incorporation is being
                          processed by the registrar.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        Incorporation Certificate & Documents
                      </CardTitle>
                      <CardDescription>
                        Upload the official incorporation certificate and
                        additional documents for the customer
                      </CardDescription>
                    </div>
                    {canManage && (
                      <Button
                        onClick={() => setShowAddDocumentDialog(true)}
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4" /> Add Document
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Incorporation Certificate */}
                  <div>
                    <h4 className="font-medium text-sm mb-3">
                      Incorporation Certificate
                    </h4>
                    <DocumentUploadCard
                      title="Incorporation Certificate"
                      description="Official certificate of incorporation"
                      document={
                        pendingStep4Documents.incorporationCertificate ||
                        selectedCompany.incorporationCertificate
                      }
                      onUpload={(file: File) =>
                        handleDocumentUpload(
                          selectedCompany._id,
                          "incorporationCertificate",
                          file,
                        )
                      }
                      disabled={!canManage}
                      showReplace={canManage}
                      isUploading={isUploadingIncorporationCertificate}
                      uploadProgress={incorporationCertificateUploadProgress}
                    />
                    {/* Display upload timestamp if available */}
                    {(
                      pendingStep4Documents.incorporationCertificate ||
                      selectedCompany.incorporationCertificate
                    )?.uploadedAt && (
                        <p className="text-xs text-muted-foreground mt-2 ml-1">
                          Uploaded:{" "}
                          {new Date(
                            (
                              pendingStep4Documents.incorporationCertificate ||
                              selectedCompany.incorporationCertificate
                            ).uploadedAt,
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            (
                              pendingStep4Documents.incorporationCertificate ||
                              selectedCompany.incorporationCertificate
                            ).uploadedAt,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                  </div>

                  {/* Expire Date Configuration */}
                  {canManage && (
                    <div>
                      <h4 className="font-medium text-sm mb-3">
                        Company Card Expire Date Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                        <div>
                          <Label
                            htmlFor="registerStartDate"
                            className="text-sm font-medium"
                          >
                            Register Start Date
                          </Label>
                          <Input
                            id="registerStartDate"
                            type="date"
                            value={registerStartDate}
                            onChange={(e) =>
                              setRegisterStartDate(e.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="expireDays"
                            className="text-sm font-medium"
                          >
                            Expire Days
                          </Label>
                          <Input
                            id="expireDays"
                            type="number"
                            placeholder="e.g., 365"
                            value={expireDays}
                            onChange={(e) => setExpireDays(e.target.value)}
                            className="mt-1"
                            min="1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="secretaryPeriodYear"
                            className="text-sm font-medium"
                          >
                            Secretary Period (Years)
                          </Label>
                          <Input
                            id="secretaryPeriodYear"
                            type="number"
                            placeholder="e.g., 1, 2, 3"
                            value={secretaryPeriodYear}
                            onChange={(e) =>
                              setSecretaryPeriodYear(e.target.value)
                            }
                            className="mt-1"
                            min="1"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={handleUpdateExpireDate}
                            disabled={
                              isUpdatingExpireDate ||
                              !registerStartDate ||
                              !expireDays
                            }
                            className="w-full"
                          >
                            {isUpdatingExpireDate ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Calendar className="h-4 w-4 mr-2" />
                                Set Expire Date
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      {(selectedCompany.expireDate ||
                        selectedCompany.secretaryPeriodYear) && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              {selectedCompany.expireDate && (
                                <>
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium text-blue-800">
                                    Expire Date:{" "}
                                    {new Date(
                                      selectedCompany.expireDate,
                                    ).toLocaleDateString()}
                                  </span>
                                  {selectedCompany.isExpired && (
                                    <Badge variant="destructive" className="ml-2">
                                      Expired
                                    </Badge>
                                  )}
                                </>
                              )}
                              {selectedCompany.secretaryPeriodYear && (
                                <>
                                  {selectedCompany.expireDate && (
                                    <span className="text-blue-400">|</span>
                                  )}
                                  <span className="font-medium text-blue-800">
                                    Secretary Period:{" "}
                                    {selectedCompany.secretaryPeriodYear}{" "}
                                    {selectedCompany.secretaryPeriodYear === "1"
                                      ? "Year"
                                      : "Years"}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Additional Documents */}
                  <div>
                    <h4 className="font-medium text-sm mb-3">
                      Additional Documents
                    </h4>
                    {(() => {
                      console.log(
                        "🔍 Debug - Additional Documents Display Logic:",
                      );
                      console.log(
                        "  - pendingStep4Documents.additionalDocuments:",
                        pendingStep4Documents.additionalDocuments,
                      );
                      console.log(
                        "  - selectedCompany.step4FinalAdditionalDoc:",
                        selectedCompany.step4FinalAdditionalDoc,
                      );
                      console.log(
                        "  - Condition result:",
                        (pendingStep4Documents.additionalDocuments &&
                          pendingStep4Documents.additionalDocuments.length >
                          0) ||
                        (selectedCompany.step4FinalAdditionalDoc &&
                          selectedCompany.step4FinalAdditionalDoc.length > 0),
                      );
                      return (
                        (pendingStep4Documents.additionalDocuments &&
                          pendingStep4Documents.additionalDocuments.length >
                          0) ||
                        (selectedCompany.step4FinalAdditionalDoc &&
                          selectedCompany.step4FinalAdditionalDoc.length > 0)
                      );
                    })() ? (
                      <div className="space-y-3">
                        {/* Show pending additional documents first */}
                        {pendingStep4Documents.additionalDocuments &&
                          pendingStep4Documents.additionalDocuments.map(
                            (doc: any, index: number) => (
                              <div
                                key={`pending-${index}`}
                                className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-sm">
                                      {doc.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {doc.name} (Pending)
                                    </p>
                                    {/* Display upload timestamp if available for pending documents */}
                                    {doc.uploadedAt && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Uploaded:{" "}
                                        {new Date(
                                          doc.uploadedAt,
                                        ).toLocaleDateString()}{" "}
                                        at{" "}
                                        {new Date(
                                          doc.uploadedAt,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-blue-600"
                                  >
                                    <Clock className="h-3.5 w-3.5 mr-1" />{" "}
                                    Pending
                                  </Button>
                                </div>
                              </div>
                            ),
                          )}
                        {/* Show existing step 4 additional documents */}
                        {(() => {
                          console.log(
                            "🔍 Debug - Mapping step4FinalAdditionalDoc:",
                          );
                          console.log(
                            "  - selectedCompany.step4FinalAdditionalDoc:",
                            selectedCompany.step4FinalAdditionalDoc,
                          );
                          console.log(
                            "  - Array length:",
                            selectedCompany.step4FinalAdditionalDoc
                              ? selectedCompany.step4FinalAdditionalDoc.length
                              : 0,
                          );
                          return (
                            selectedCompany.step4FinalAdditionalDoc &&
                            selectedCompany.step4FinalAdditionalDoc.map(
                              (doc: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <div>
                                      <p className="font-medium text-sm">
                                        {doc.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {doc.name}
                                      </p>
                                      {/* Display upload timestamp if available */}
                                      {doc.uploadedAt && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Uploaded:{" "}
                                          {new Date(
                                            doc.uploadedAt,
                                          ).toLocaleDateString()}{" "}
                                          at{" "}
                                          {new Date(
                                            doc.uploadedAt,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2"
                                        >
                                          <Eye className="h-3.5 w-3.5 mr-1" />{" "}
                                          View
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl">
                                        <DialogHeader>
                                          <DialogTitle>
                                            Document Viewer - {doc.title}
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4">
                                          <div className="flex items-center justify-between mb-4">
                                            <div>
                                              <p className="text-sm font-medium">
                                                <FileText className="h-4 w-4 inline mr-1" />
                                                {doc.name}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {doc.size
                                                  ? `${(doc.size / 1024).toFixed(2)} KB`
                                                  : ""}{" "}
                                                • {doc.type || "Unknown type"}
                                              </p>
                                              {/* Display upload timestamp in dialog if available */}
                                              {doc.uploadedAt && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  Uploaded:{" "}
                                                  {new Date(
                                                    doc.uploadedAt,
                                                  ).toLocaleDateString()}{" "}
                                                  at{" "}
                                                  {new Date(
                                                    doc.uploadedAt,
                                                  ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                  })}
                                                </p>
                                              )}
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                if (doc.url) {
                                                  const link =
                                                    window.document.createElement("a");
                                                  link.href = doc.url;
                                                  link.download = doc.name;
                                                  window.document.body.appendChild(
                                                    link,
                                                  );
                                                  link.click();
                                                  window.document.body.removeChild(
                                                    link,
                                                  );
                                                } else if (doc.data) {
                                                  const blob = new Blob(
                                                    [doc.data],
                                                    {
                                                      type:
                                                        doc.type ||
                                                        "application/octet-stream",
                                                    },
                                                  );
                                                  const url =
                                                    URL.createObjectURL(blob);
                                                  const link =
                                                    window.document.createElement("a");
                                                  link.href = url;
                                                  link.download = doc.name;
                                                  window.document.body.appendChild(
                                                    link,
                                                  );
                                                  link.click();
                                                  window.document.body.removeChild(
                                                    link,
                                                  );
                                                  URL.revokeObjectURL(url);
                                                }
                                              }}
                                            >
                                              <Download className="h-4 w-4 mr-1" />{" "}
                                              Download
                                            </Button>
                                          </div>
                                          <div className="border rounded-md p-2 bg-muted/20">
                                            {doc.type?.startsWith("image/") ? (
                                              <img
                                                src={
                                                  doc.url ||
                                                  (doc.data
                                                    ? URL.createObjectURL(
                                                      new Blob([doc.data], {
                                                        type: doc.type,
                                                      }),
                                                    )
                                                    : "/placeholder.svg")
                                                }
                                                alt={doc.name}
                                                className="max-w-full h-auto mx-auto"
                                                style={{ maxHeight: "70vh" }}
                                              />
                                            ) : doc.type ===
                                              "application/pdf" ? (
                                              <div className="aspect-video">
                                                <iframe
                                                  src={
                                                    doc.url ||
                                                    (doc.data
                                                      ? URL.createObjectURL(
                                                        new Blob([doc.data], {
                                                          type: doc.type,
                                                        }),
                                                      )
                                                      : "")
                                                  }
                                                  className="w-full h-full"
                                                  title="PDF Viewer"
                                                ></iframe>
                                              </div>
                                            ) : (
                                              <div className="p-8 text-center">
                                                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                <p>
                                                  This file type cannot be
                                                  previewed. Please download to
                                                  view.
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    {canManage && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-destructive hover:text-destructive"
                                        onClick={() =>
                                          handleRemoveAdditionalDocument(
                                            selectedCompany._id,
                                            index,
                                          )
                                        }
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ),
                            )
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                        <FileText className="h-6 w-6 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">
                          No additional documents added yet
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                {canManage && !registrationCompleted && (
                  <CardFooter className="flex justify-between gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setIsAccessSharingDialogOpen(true)}
                    >
                      <User className="h-4 w-4" />
                      Access Sharing
                    </Button>
                    <Button
                      onClick={handleCompleteRegistration}
                      className="gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={
                        !(
                          pendingStep4Documents.incorporationCertificate ||
                          selectedCompany.incorporationCertificate
                        )
                      }
                      title={
                        !(
                          pendingStep4Documents.incorporationCertificate ||
                          selectedCompany.incorporationCertificate
                        )
                          ? "Upload the incorporation certificate to enable"
                          : undefined
                      }
                    >
                      <CheckCircle className="h-4 w-4" /> Complete Registration
                    </Button>
                  </CardFooter>
                )}
                {canManage && registrationCompleted && (
                  <CardFooter className="flex justify-between gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setIsAccessSharingDialogOpen(true)}
                    >
                      <User className="h-4 w-4" />
                      Access Sharing
                    </Button>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Registration Completed
                      </span>
                    </div>
                  </CardFooter>
                )}
              </Card>
              {/* Secretary Records Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Secretary Records
                      </CardTitle>
                      <CardDescription>
                        View and manage secretary records for the customer
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex gap-2">
                        <Button
                          variant={
                            corporateRecordsView === "customer"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="h-8 px-3 flex-1 sm:flex-none"
                          onClick={() => setCorporateRecordsView("customer")}
                        >
                          Customer Submitted
                        </Button>
                        <Button
                          variant={
                            corporateRecordsView === "admin"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="h-8 px-3 flex-1 sm:flex-none"
                          onClick={() => setCorporateRecordsView("admin")}
                        >
                          Secretary Submitted
                        </Button>
                      </div>
                      {canManage && (
                        <Button
                          onClick={() =>
                            setShowAdminCorporateRecordsDialog(true)
                          }
                          variant="outline"
                          size="sm"
                          className="gap-2 w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4" /> Submit for Customer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(selectedCompany.resolutions_docs &&
                    selectedCompany.resolutions_docs.length > 0) ||
                    (selectedCompany.admin_resolution_doc &&
                      selectedCompany.admin_resolution_doc.length > 0) ? (
                    <div className="space-y-6">
                      {/* Customer Submitted */}
                      {corporateRecordsView === "customer" && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Customer Submitted
                          </h4>
                          <div className="space-y-4">
                            {selectedCompany.resolutions_docs &&
                              selectedCompany.resolutions_docs.length > 0 ? (
                              selectedCompany.resolutions_docs
                                .map(
                                  (resolution: any, originalIndex: number) => ({
                                    resolution,
                                    originalIndex,
                                  }),
                                )
                                .filter(
                                  (r: any) =>
                                    r.resolution.submittedBy !== "admin",
                                )
                                .sort(
                                  (a: any, b: any) =>
                                    new Date(
                                      b.resolution.uploadedAt,
                                    ).getTime() -
                                    new Date(a.resolution.uploadedAt).getTime(),
                                )
                                .map(({ resolution, originalIndex }: any) => (
                                  <div
                                    key={originalIndex}
                                    className="border rounded-lg"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 rounded-t gap-3">
                                      <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                          <h3 className="font-medium text-sm">
                                            {resolution.title}
                                          </h3>
                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium self-start">
                                            Submitted by Customer
                                          </span>
                                        </div>
                                        {resolution.description && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {resolution.description}
                                          </p>
                                        )}
                                        {resolution.signRequired && (
                                          <div className="flex items-center mt-1">
                                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                                              Signature required
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 self-start sm:self-center">
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(
                                            resolution.uploadedAt,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>

                                    {resolution.documents &&
                                      resolution.documents.length > 0 && (
                                        <div className="px-4 pb-4 space-y-2">
                                          <h4 className="text-xs font-medium text-muted-foreground">
                                            Documents:
                                          </h4>
                                          <div className="space-y-2">
                                            {resolution.documents.map(
                                              (doc: any, docIndex: number) => (
                                                <div
                                                  key={docIndex}
                                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted rounded gap-3"
                                                >
                                                  <div className="flex items-center gap-2 flex-1">
                                                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                      <p className="text-sm truncate">
                                                        {doc.name}
                                                      </p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {doc.size
                                                          ? `${(doc.size / 1024).toFixed(1)} KB`
                                                          : ""}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                    <Dialog>
                                                      <DialogTrigger asChild>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-7 px-2 w-full sm:w-auto"
                                                        >
                                                          <Eye className="h-3.5 w-3.5 mr-1" />
                                                          <span className="text-xs sm:text-sm">
                                                            View
                                                          </span>
                                                        </Button>
                                                      </DialogTrigger>
                                                      <DialogContent className="max-w-3xl">
                                                        <DialogHeader>
                                                          <DialogTitle>
                                                            Document Viewer
                                                          </DialogTitle>
                                                          <DialogDescription>
                                                            {doc.name}
                                                          </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="mt-4">
                                                          <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                              <p className="text-sm font-medium">
                                                                {doc.name}
                                                              </p>
                                                              <p className="text-xs text-muted-foreground">
                                                                {doc.size
                                                                  ? `${(doc.size / 1024).toFixed(2)} KB`
                                                                  : ""}{" "}
                                                                •{" "}
                                                                {doc.type ||
                                                                  "Unknown type"}
                                                              </p>
                                                            </div>
                                                          </div>
                                                          <div className="border rounded-md p-2 bg-muted/20">
                                                            {doc.type?.startsWith(
                                                              "image/",
                                                            ) ? (
                                                              <img
                                                                src={
                                                                  doc.url ||
                                                                  (doc.data
                                                                    ? URL.createObjectURL(
                                                                      new Blob(
                                                                        [
                                                                          doc.data,
                                                                        ],
                                                                        {
                                                                          type: doc.type,
                                                                        },
                                                                      ),
                                                                    )
                                                                    : "/placeholder.svg")
                                                                }
                                                                alt={doc.name}
                                                                className="max-w-full h-auto mx-auto"
                                                                style={{
                                                                  maxHeight:
                                                                    "70vh",
                                                                }}
                                                              />
                                                            ) : doc.type ===
                                                              "application/pdf" ? (
                                                              <div className="aspect-video">
                                                                <iframe
                                                                  src={
                                                                    doc.url ||
                                                                    (doc.data
                                                                      ? URL.createObjectURL(
                                                                        new Blob(
                                                                          [
                                                                            doc.data,
                                                                          ],
                                                                          {
                                                                            type: doc.type,
                                                                          },
                                                                        ),
                                                                      )
                                                                      : "")
                                                                  }
                                                                  className="w-full h-full"
                                                                  title="PDF Viewer"
                                                                ></iframe>
                                                              </div>
                                                            ) : (
                                                              <div className="p-8 text-center">
                                                                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                                <p className="text-sm">
                                                                  This file type
                                                                  cannot be
                                                                  previewed.
                                                                  Please
                                                                  download to
                                                                  view.
                                                                </p>
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </DialogContent>
                                                    </Dialog>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-7 px-2 w-full sm:w-auto"
                                                      onClick={() => {
                                                        if (doc.url) {
                                                          const link =
                                                            window.document.createElement(
                                                              "a",
                                                            );
                                                          link.href = doc.url;
                                                          link.download =
                                                            doc.name ||
                                                            "document";
                                                          window.document.body.appendChild(
                                                            link,
                                                          );
                                                          link.click();
                                                          window.document.body.removeChild(
                                                            link,
                                                          );
                                                        } else if (doc.data) {
                                                          const blob = new Blob(
                                                            [doc.data],
                                                            {
                                                              type:
                                                                doc.type ||
                                                                "application/octet-stream",
                                                            },
                                                          );
                                                          const url =
                                                            URL.createObjectURL(
                                                              blob,
                                                            );
                                                          const link =
                                                            window.document.createElement(
                                                              "a",
                                                            );
                                                          link.href = url;
                                                          link.download =
                                                            doc.name ||
                                                            "document";
                                                          window.document.body.appendChild(
                                                            link,
                                                          );
                                                          link.click();
                                                          window.document.body.removeChild(
                                                            link,
                                                          );
                                                          URL.revokeObjectURL(
                                                            url,
                                                          );
                                                        }
                                                      }}
                                                      title="Download"
                                                    >
                                                      <Download className="h-3.5 w-3.5 mr-1" />
                                                      <span className="text-xs sm:text-sm">
                                                        Download
                                                      </span>
                                                    </Button>
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Signed documents prompt (customer) */}
                                    {resolution.signRequired && (
                                      <div className="mx-4 mb-4 border border-blue-200 rounded-lg p-4 bg-blue-50">
                                        {/* Only show upload section if no signed documents exist yet */}
                                        {(!resolution.signedDocuments ||
                                          resolution.signedDocuments.length ===
                                          0) && (
                                            <div className="mb-3">
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <h4 className="text-sm font-medium text-blue-800">
                                                    Submit Signed Document
                                                  </h4>
                                                  <p className="text-xs text-blue-700 mt-1">
                                                    Upload the customer-signed
                                                    version of this board
                                                    resolution
                                                  </p>
                                                </div>
                                                <div className="border-2 border-dashed border-blue-200 rounded p-2 bg-white shadow-sm">
                                                  <input
                                                    type="file"
                                                    id={`signed-resolution-${originalIndex}`}
                                                    className="hidden"
                                                    onChange={(e) => {
                                                      const file =
                                                        e.target.files?.[0];
                                                      if (file) {
                                                        setSignedResolutionFile(
                                                          file,
                                                        );
                                                        setCurrentResolutionIndex(
                                                          originalIndex,
                                                        );
                                                      }
                                                    }}
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                  />
                                                  <label
                                                    htmlFor={`signed-resolution-${originalIndex}`}
                                                    className="flex items-center gap-1 cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                                                  >
                                                    <Upload className="h-4 w-4 text-blue-500" />
                                                    <span className="text-xs text-blue-700 font-medium">
                                                      Upload
                                                    </span>
                                                  </label>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                        {/* Admin signed documents display - per resolution */}
                                        {resolution.signedDocuments &&
                                          resolution.signedDocuments.length >
                                          0 && (
                                            <div className="mb-4">
                                              <h5 className="text-xs font-medium text-blue-800 mb-2">
                                                Admin Signed Documents:
                                              </h5>
                                              <div className="space-y-2">
                                                {resolution.signedDocuments.map(
                                                  (
                                                    doc: any,
                                                    docIndex: number,
                                                  ) => (
                                                    <div
                                                      key={docIndex}
                                                      className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                                                    >
                                                      <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                        <div>
                                                          <p className="text-sm">
                                                            {doc.name}
                                                          </p>
                                                          <p className="text-xs text-muted-foreground">
                                                            {doc.size
                                                              ? `${(doc.size / 1024).toFixed(1)} KB`
                                                              : ""}
                                                          </p>
                                                        </div>
                                                      </div>
                                                      <div className="flex gap-2">
                                                        <Dialog>
                                                          <DialogTrigger
                                                            asChild
                                                          >
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              className="h-7 px-2"
                                                            >
                                                              <Eye className="h-3.5 w-3.5 mr-1" />
                                                              <span className="text-xs">
                                                                View
                                                              </span>
                                                            </Button>
                                                          </DialogTrigger>
                                                          <DialogContent className="max-w-3xl">
                                                            <DialogHeader>
                                                              <DialogTitle>
                                                                Admin Signed
                                                                Document -{" "}
                                                                {doc.name}
                                                              </DialogTitle>
                                                            </DialogHeader>
                                                            <div className="mt-4">
                                                              <div className="flex items-center justify-between mb-4">
                                                                <div>
                                                                  <p className="text-sm font-medium">
                                                                    <FileText className="h-4 w-4 inline mr-1" />
                                                                    {doc.name}
                                                                  </p>
                                                                  <p className="text-xs text-muted-foreground">
                                                                    {doc.size
                                                                      ? `${(doc.size / 1024).toFixed(2)} KB`
                                                                      : ""}{" "}
                                                                    •{" "}
                                                                    {doc.type ||
                                                                      "Unknown type"}
                                                                  </p>
                                                                </div>
                                                              </div>
                                                              <div className="border rounded-md p-2 bg-muted/20">
                                                                {doc.type?.startsWith(
                                                                  "image/",
                                                                ) ? (
                                                                  <img
                                                                    src={
                                                                      doc.url ||
                                                                      "/placeholder.svg"
                                                                    }
                                                                    alt={
                                                                      doc.name
                                                                    }
                                                                    className="max-w-full h-auto mx-auto"
                                                                    style={{
                                                                      maxHeight:
                                                                        "70vh",
                                                                    }}
                                                                  />
                                                                ) : doc.type ===
                                                                  "application/pdf" ? (
                                                                  <div className="aspect-video">
                                                                    <iframe
                                                                      src={
                                                                        doc.url ||
                                                                        ""
                                                                      }
                                                                      className="w-full h-full"
                                                                      title="PDF Viewer"
                                                                    ></iframe>
                                                                  </div>
                                                                ) : (
                                                                  <div className="p-8 text-center">
                                                                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                                    <p>
                                                                      This file
                                                                      type
                                                                      cannot be
                                                                      previewed.
                                                                      Please
                                                                      download
                                                                      to view.
                                                                    </p>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </div>
                                                          </DialogContent>
                                                        </Dialog>
                                                        {canManage && (
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() =>
                                                              handleDeleteAdminSignedDocument(
                                                                selectedCompany._id,
                                                                originalIndex,
                                                                docIndex,
                                                              )
                                                            }
                                                            title="Delete signed document"
                                                          >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                          </Button>
                                                        )}
                                                      </div>
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          )}

                                        {/* Customer signed documents display for admin submissions */}
                                        {resolution.signRequired &&
                                          resolution.signedDocuments &&
                                          resolution.signedDocuments.some(
                                            (doc: any) => doc.signedByCustomer,
                                          ) && (
                                            <div className="mb-4">
                                              <h5 className="text-xs font-medium text-green-800 mb-2">
                                                Customer Signed Documents:
                                              </h5>
                                              <div className="space-y-2">
                                                {resolution.signedDocuments
                                                  .filter(
                                                    (doc: any) =>
                                                      doc.signedByCustomer,
                                                  )
                                                  .map(
                                                    (
                                                      doc: any,
                                                      docIndex: number,
                                                    ) => (
                                                      <div
                                                        key={docIndex}
                                                        className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                                                      >
                                                        <div className="flex items-center gap-2">
                                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                                          <div>
                                                            <p className="text-sm font-medium text-green-800">
                                                              {doc.name}
                                                            </p>
                                                            <p className="text-xs text-green-700">
                                                              {doc.size
                                                                ? `${(doc.size / 1024).toFixed(1)} KB`
                                                                : ""}
                                                            </p>
                                                            <p className="text-xs text-green-600">
                                                              Signed by customer
                                                              on{" "}
                                                              {new Date(
                                                                doc.submittedAt ||
                                                                doc.uploadedAt,
                                                              ).toLocaleDateString()}
                                                            </p>
                                                          </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                          <Dialog>
                                                            <DialogTrigger
                                                              asChild
                                                            >
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2"
                                                              >
                                                                <Eye className="h-3.5 w-3.5 mr-1" />
                                                                <span className="text-xs">
                                                                  View
                                                                </span>
                                                              </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-3xl">
                                                              <DialogHeader>
                                                                <DialogTitle>
                                                                  Customer
                                                                  Signed
                                                                  Document -{" "}
                                                                  {doc.name}
                                                                </DialogTitle>
                                                              </DialogHeader>
                                                              <div className="mt-4">
                                                                <div className="flex items-center justify-between mb-4">
                                                                  <div>
                                                                    <p className="text-sm font-medium">
                                                                      <FileText className="h-4 w-4 inline mr-1" />
                                                                      {doc.name}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                      {doc.size
                                                                        ? `${(doc.size / 1024).toFixed(2)} KB`
                                                                        : ""}{" "}
                                                                      •{" "}
                                                                      {doc.type ||
                                                                        "Unknown type"}
                                                                    </p>
                                                                    <p className="text-xs text-green-600 mt-1">
                                                                      Signed by
                                                                      customer
                                                                      on{" "}
                                                                      {new Date(
                                                                        doc.submittedAt ||
                                                                        doc.uploadedAt,
                                                                      ).toLocaleDateString()}
                                                                    </p>
                                                                  </div>
                                                                </div>
                                                                <div className="border rounded-md p-2 bg-muted/20">
                                                                  {doc.type?.startsWith(
                                                                    "image/",
                                                                  ) ? (
                                                                    <img
                                                                      src={
                                                                        doc.url ||
                                                                        "/placeholder.svg"
                                                                      }
                                                                      alt={
                                                                        doc.name
                                                                      }
                                                                      className="max-w-full h-auto mx-auto"
                                                                      style={{
                                                                        maxHeight:
                                                                          "70vh",
                                                                      }}
                                                                    />
                                                                  ) : doc.type ===
                                                                    "application/pdf" ? (
                                                                    <div className="aspect-video">
                                                                      <iframe
                                                                        src={
                                                                          doc.url ||
                                                                          ""
                                                                        }
                                                                        className="w-full h-full"
                                                                        title="PDF Viewer"
                                                                      ></iframe>
                                                                    </div>
                                                                  ) : (
                                                                    <div className="p-8 text-center">
                                                                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                                      <p className="text-sm">
                                                                        This
                                                                        file
                                                                        type
                                                                        cannot
                                                                        be
                                                                        previewed.
                                                                        Please
                                                                        download
                                                                        to view.
                                                                      </p>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              </div>
                                                            </DialogContent>
                                                          </Dialog>
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2"
                                                            onClick={() => {
                                                              if (doc.url) {
                                                                const link =
                                                                  window.document.createElement(
                                                                    "a",
                                                                  );
                                                                link.href =
                                                                  doc.url;
                                                                link.download =
                                                                  doc.name ||
                                                                  "customer-signed-document";
                                                                window.document.body.appendChild(
                                                                  link,
                                                                );
                                                                link.click();
                                                                window.document.body.removeChild(
                                                                  link,
                                                                );
                                                              }
                                                            }}
                                                            title="Download customer signed document"
                                                          >
                                                            <Download className="h-3.5 w-3.5 mr-1" />
                                                            <span className="text-xs">
                                                              Download
                                                            </span>
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    ),
                                                  )}
                                              </div>
                                            </div>
                                          )}

                                        {/* Selected file display and submit section - only show if no signed documents exist */}
                                        {currentResolutionIndex ===
                                          originalIndex &&
                                          signedResolutionFile &&
                                          (!resolution.signedDocuments ||
                                            resolution.signedDocuments
                                              .length === 0) && (
                                            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <FileText className="h-4 w-4 text-blue-500" />
                                                  <div>
                                                    <p className="text-sm font-medium">
                                                      {
                                                        signedResolutionFile.name
                                                      }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                      {(
                                                        signedResolutionFile.size /
                                                        1024
                                                      ).toFixed(1)}{" "}
                                                      KB
                                                    </p>
                                                  </div>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    setSignedResolutionFile(
                                                      null,
                                                    );
                                                    setCurrentResolutionIndex(
                                                      null,
                                                    );
                                                  }}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>

                                              {/* Submit button */}
                                              <div className="mt-3 flex justify-end">
                                                <Button
                                                  size="sm"
                                                  className="bg-blue-600 hover:bg-blue-700"
                                                  disabled={
                                                    uploadingSignedResolution
                                                  }
                                                  onClick={() => {
                                                    if (
                                                      signedResolutionFile &&
                                                      currentResolutionIndex !==
                                                      null
                                                    ) {
                                                      handleAdminSignedDocumentUpload(
                                                        currentResolutionIndex,
                                                        signedResolutionFile,
                                                      );
                                                    }
                                                  }}
                                                >
                                                  {uploadingSignedResolution ? (
                                                    <>
                                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                      Uploading...
                                                    </>
                                                  ) : (
                                                    "Submit Document"
                                                  )}
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                                <FileText className="h-6 w-6 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">
                                  No secretary records submitted by the customer
                                  yet
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Submitted */}
                      {corporateRecordsView === "admin" && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Secretary Submitted
                          </h4>
                          <div className="space-y-4">
                            {selectedCompany.admin_resolution_doc &&
                              selectedCompany.admin_resolution_doc.length > 0 ? (
                              selectedCompany.admin_resolution_doc
                                .map(
                                  (resolution: any, originalIndex: number) => ({
                                    resolution,
                                    originalIndex,
                                  }),
                                )
                                .sort(
                                  (a: any, b: any) =>
                                    new Date(
                                      b.resolution.uploadedAt,
                                    ).getTime() -
                                    new Date(a.resolution.uploadedAt).getTime(),
                                )
                                .map(({ resolution, originalIndex }: any) => (
                                  <div
                                    key={originalIndex}
                                    className="border rounded-lg"
                                  >
                                    <div className="flex items-start justify-between p-4 rounded-t">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-medium text-sm">
                                            {resolution.title}
                                          </h3>
                                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                                            Submitted by Secretary
                                          </span>
                                        </div>
                                        {resolution.description && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {resolution.description}
                                          </p>
                                        )}
                                        {/* Signature required badge intentionally hidden in admin-submitted view */}

                                        {/* Message for admin about waiting for customer signature */}
                                        {resolution.signRequired &&
                                          (!resolution.signedDocuments ||
                                            resolution.signedDocuments
                                              .length === 0) && (
                                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                              <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-amber-600" />
                                                <p className="text-xs text-amber-700 font-medium">
                                                  Waiting for customer to submit
                                                  signed document
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(
                                            resolution.uploadedAt,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>

                                    {resolution.documents &&
                                      resolution.documents.length > 0 && (
                                        <div className="px-4 pb-4 space-y-2">
                                          <h4 className="text-xs font-medium text-muted-foreground">
                                            Documents:
                                          </h4>
                                          <div className="space-y-2">
                                            {resolution.documents.map(
                                              (doc: any, docIndex: number) => (
                                                <div
                                                  key={docIndex}
                                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted rounded gap-3"
                                                >
                                                  <div className="flex items-center gap-2 flex-1">
                                                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                      <p className="text-sm truncate">
                                                        {doc.name}
                                                      </p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {doc.size
                                                          ? `${(doc.size / 1024).toFixed(1)} KB`
                                                          : ""}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                    <Dialog>
                                                      <DialogTrigger asChild>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-7 px-2 w-full sm:w-auto"
                                                        >
                                                          <Eye className="h-3.5 w-3.5 mr-1" />
                                                          <span className="text-xs sm:text-sm">
                                                            View
                                                          </span>
                                                        </Button>
                                                      </DialogTrigger>
                                                      <DialogContent className="max-w-3xl">
                                                        <DialogHeader>
                                                          <DialogTitle>
                                                            Document Viewer
                                                          </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="mt-4">
                                                          <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                              <p className="text-sm font-medium">
                                                                {doc.name}
                                                              </p>
                                                              <p className="text-xs text-muted-foreground">
                                                                {doc.size
                                                                  ? `${(doc.size / 1024).toFixed(2)} KB`
                                                                  : ""}{" "}
                                                                •{" "}
                                                                {doc.type ||
                                                                  "Unknown type"}
                                                              </p>
                                                            </div>
                                                          </div>
                                                          <div className="border rounded-md p-2 bg-muted/20">
                                                            {doc.type?.startsWith(
                                                              "image/",
                                                            ) ? (
                                                              <img
                                                                src={
                                                                  doc.url ||
                                                                  (doc.data
                                                                    ? URL.createObjectURL(
                                                                      new Blob(
                                                                        [
                                                                          doc.data,
                                                                        ],
                                                                        {
                                                                          type: doc.type,
                                                                        },
                                                                      ),
                                                                    )
                                                                    : "/placeholder.svg")
                                                                }
                                                                alt={doc.name}
                                                                className="max-w-full h-auto mx-auto"
                                                                style={{
                                                                  maxHeight:
                                                                    "70vh",
                                                                }}
                                                              />
                                                            ) : doc.type ===
                                                              "application/pdf" ? (
                                                              <div className="aspect-video">
                                                                <iframe
                                                                  src={
                                                                    doc.url ||
                                                                    (doc.data
                                                                      ? URL.createObjectURL(
                                                                        new Blob(
                                                                          [
                                                                            doc.data,
                                                                          ],
                                                                          {
                                                                            type: doc.type,
                                                                          },
                                                                        ),
                                                                      )
                                                                      : "")
                                                                  }
                                                                  className="w-full h-full"
                                                                  title="PDF Viewer"
                                                                ></iframe>
                                                              </div>
                                                            ) : (
                                                              <div className="p-8 text-center">
                                                                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                                <p className="text-sm">
                                                                  This file type
                                                                  cannot be
                                                                  previewed.
                                                                  Please
                                                                  download to
                                                                  view.
                                                                </p>
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </DialogContent>
                                                    </Dialog>
                                                    {canManage &&
                                                      resolution.submittedBy ===
                                                      "admin" &&
                                                      docIndex === 0 && (
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                          onClick={() =>
                                                            handleRemoveAdminCorporateRecord(
                                                              selectedCompany._id,
                                                              originalIndex,
                                                            )
                                                          }
                                                          title="Delete secretary record"
                                                        >
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                      )}
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Customer signed documents section */}
                                    {resolution.signRequired &&
                                      resolution.signedDocuments &&
                                      resolution.signedDocuments.length > 0 && (
                                        <div className="px-4 pb-4 space-y-2">
                                          <h4 className="text-xs font-medium text-muted-foreground">
                                            Customer Signed Documents:
                                          </h4>
                                          <div className="space-y-2">
                                            {resolution.signedDocuments.map(
                                              (doc: any, docIndex: number) => (
                                                <div
                                                  key={docIndex}
                                                  className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-green-600" />
                                                    <div>
                                                      <p className="text-sm font-medium">
                                                        {doc.name}
                                                      </p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {doc.size
                                                          ? `${(doc.size / 1024).toFixed(1)} KB`
                                                          : ""}{" "}
                                                        •{" "}
                                                        {doc.uploadedBy ===
                                                          "customer"
                                                          ? "Signed by Customer"
                                                          : "Signed by Admin"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                    <Dialog>
                                                      <DialogTrigger asChild>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-7 px-2 w-full sm:w-auto"
                                                        >
                                                          <Eye className="h-3.5 w-3.5 mr-1" />
                                                          <span className="text-xs sm:text-sm">
                                                            View
                                                          </span>
                                                        </Button>
                                                      </DialogTrigger>
                                                      <DialogContent className="max-w-3xl">
                                                        <DialogHeader>
                                                          <DialogTitle>
                                                            Customer Signed
                                                            Document -{" "}
                                                            {doc.name}
                                                          </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="mt-4">
                                                          <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                              <p className="text-sm font-medium">
                                                                <FileText className="h-4 w-4 inline mr-1" />
                                                                {doc.name}
                                                              </p>
                                                              <p className="text-xs text-muted-foreground">
                                                                {doc.size
                                                                  ? `${(doc.size / 1024).toFixed(2)} KB`
                                                                  : ""}{" "}
                                                                •{" "}
                                                                {doc.type ||
                                                                  "Unknown type"}
                                                              </p>
                                                              {doc.uploadedBy ===
                                                                "customer" && (
                                                                  <p className="text-xs text-green-600 font-medium mt-1">
                                                                    ✓ Signed by
                                                                    Customer
                                                                  </p>
                                                                )}
                                                            </div>
                                                          </div>
                                                          <div className="border rounded-md p-2 bg-muted/20">
                                                            {doc.type?.startsWith(
                                                              "image/",
                                                            ) ? (
                                                              <img
                                                                src={
                                                                  doc.url ||
                                                                  "/placeholder.svg"
                                                                }
                                                                alt={doc.name}
                                                                className="max-w-full h-auto mx-auto"
                                                                style={{
                                                                  maxHeight:
                                                                    "70vh",
                                                                }}
                                                              />
                                                            ) : doc.type ===
                                                              "application/pdf" ? (
                                                              <div className="aspect-video">
                                                                <iframe
                                                                  src={
                                                                    doc.url ||
                                                                    ""
                                                                  }
                                                                  className="w-full h-full"
                                                                  title="PDF Viewer"
                                                                ></iframe>
                                                              </div>
                                                            ) : (
                                                              <div className="p-8 text-center">
                                                                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                                <p>
                                                                  This file type
                                                                  cannot be
                                                                  previewed.
                                                                  Please
                                                                  download to
                                                                  view.
                                                                </p>
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </DialogContent>
                                                    </Dialog>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-7 px-2 w-full sm:w-auto"
                                                      onClick={() => {
                                                        if (doc.url) {
                                                          const link =
                                                            window.document.createElement(
                                                              "a",
                                                            );
                                                          link.href = doc.url;
                                                          link.download =
                                                            doc.name ||
                                                            "customer-signed-document";
                                                          window.document.body.appendChild(
                                                            link,
                                                          );
                                                          link.click();
                                                          window.document.body.removeChild(
                                                            link,
                                                          );
                                                        }
                                                      }}
                                                      title="Download customer signed document"
                                                    >
                                                      <Download className="h-3.5 w-3.5 mr-1" />
                                                      <span className="text-xs">
                                                        Download
                                                      </span>
                                                    </Button>
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                ))
                            ) : (
                              <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                                <FileText className="h-6 w-6 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">
                                  No secretary records submitted by admin yet
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Customer Submitted */}
                      {corporateRecordsView === "customer" && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Customer Submitted
                          </h4>
                          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                            <FileText className="h-6 w-6 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">
                              No secretary records submitted by the customer yet
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Admin Submitted */}
                      {corporateRecordsView === "admin" && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Secretary Submitted
                          </h4>
                          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                            <FileText className="h-6 w-6 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">
                              No secretary records submitted by admin yet
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Document Dialog */}
              <Dialog
                open={showAddDocumentDialog}
                onOpenChange={setShowAddDocumentDialog}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Additional Document</DialogTitle>
                    <DialogDescription>
                      Add a new document for the customer to download
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="document-title">Document Title</Label>
                      <Input
                        id="document-title"
                        value={additionalDocumentTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAdditionalDocumentTitle(e.target.value)
                        }
                        placeholder="Enter document title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="document-file">Document File</Label>
                      <Input
                        id="document-file"
                        type="file"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (e.target.files && e.target.files[0]) {
                            setAdditionalDocumentFile(e.target.files[0]);
                          }
                        }}
                      />
                      {additionalDocumentFile && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Selected: {additionalDocumentFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDocumentDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddDocumentSubmit}
                      disabled={
                        !additionalDocumentTitle.trim() ||
                        !additionalDocumentFile ||
                        isUploadingStep4Document
                      }
                      className="gap-2"
                    >
                      {isUploadingStep4Document ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Add Document"
                      )}
                    </Button>
                  </DialogFooter>
                  {isUploadingStep4Document && (
                    <div className="mt-4">
                      <Progress
                        value={step4DocumentUploadProgress}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        {step4DocumentUploadProgress}% Complete
                      </p>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              {/* Admin Secretary Records Dialog */}
              <Dialog
                open={showAdminCorporateRecordsDialog}
                onOpenChange={setShowAdminCorporateRecordsDialog}
              >
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Submit Secretary Records for Customer
                    </DialogTitle>
                    <DialogDescription>
                      Submit secretary records and documents on behalf of the
                      customer. These will appear in the customer's secretary
                      records section.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    {adminResolutionError && (
                      <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {adminResolutionError}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="admin-resolution-title">Title *</Label>
                      <Input
                        id="admin-resolution-title"
                        placeholder="Enter resolution title"
                        value={adminResolutionTitle}
                        onChange={(e) =>
                          setAdminResolutionTitle(e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-resolution-description">
                        Description
                      </Label>
                      <Textarea
                        id="admin-resolution-description"
                        placeholder="Enter resolution description (optional)"
                        value={adminResolutionDescription}
                        onChange={(e) =>
                          setAdminResolutionDescription(e.target.value)
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-resolution-files">
                        Documents *
                      </Label>
                      <div className="border-2 border-dashed rounded-md p-4">
                        <Input
                          type="file"
                          multiple
                          onChange={handleAdminFileChange}
                          className="hidden"
                          id="admin-resolution-files"
                        />
                        <label
                          htmlFor="admin-resolution-files"
                          className="flex flex-col items-center justify-center gap-2 py-4 cursor-pointer"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop documents
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              document
                                .getElementById("admin-resolution-files")
                                ?.click();
                            }}
                          >
                            Select Files
                          </Button>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-sign-required">
                        Customer Signature Required
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="admin-sign-required"
                          checked={adminIsSignRequired}
                          onCheckedChange={setAdminIsSignRequired}
                        />
                        <Label
                          htmlFor="admin-sign-required"
                          className="text-sm text-muted-foreground"
                        >
                          Require customer signature on this document
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When enabled, the customer will need to sign this
                        document and you will be able to upload the signed
                        version
                      </p>

                      {adminResolutionFiles.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm font-medium">
                            Selected Documents:
                          </p>
                          <div className="space-y-2">
                            {adminResolutionFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 border rounded-md"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{file.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAdminFile(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setShowAdminCorporateRecordsDialog(false)
                        }
                        disabled={uploadingAdminResolution}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAdminSubmitResolutions}
                        disabled={uploadingAdminResolution}
                      >
                        {uploadingAdminResolution ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Submit for Customer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {showSuccess && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-green-600 text-white px-6 py-3 rounded shadow-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Incorporation
                    certificate and documents have been successfully submitted
                    to customer
                  </div>
                </div>
              )}

              {/* Access Sharing Dialog */}
              <AccessSharingDialog
                isOpen={isAccessSharingDialogOpen}
                onOpenChange={setIsAccessSharingDialogOpen}
                companyId={selectedCompany?._id}
                initialSharedEmails={selectedCompany?.sharedWithEmails || []}
                isAdmin={canManage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
