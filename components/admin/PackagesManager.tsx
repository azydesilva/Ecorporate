"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LocalStorageService } from "@/lib/database-service"

// Types for package plans
export type PackageType = "one-time" | "advance-balance"

export type PackagePlan = {
    id: string
    name: string
    // description: string  // Removed description field
    price: number
    type: PackageType
    advanceAmount?: number
    balanceAmount?: number
}

export default function PackagesManager({
    onPackagesChange,
    initialPackages = [],
}: {
    onPackagesChange?: (pkgs: PackagePlan[]) => void
    initialPackages?: PackagePlan[]
}) {
    const [tab, setTab] = useState<PackageType>("one-time")
    const [packages, setPackages] = useState<PackagePlan[]>(initialPackages)
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState<Partial<PackagePlan>>({ type: "one-time" })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [packageToDelete, setPackageToDelete] = useState<PackagePlan | null>(null)

    // Load packages from database on mount
    useEffect(() => {
        const loadPackages = async () => {
            try {
                const dbPackages = await LocalStorageService.getPackages();
                if (dbPackages && Array.isArray(dbPackages)) {
                    setPackages(dbPackages);
                }
            } catch (error) {
                console.error('Error loading packages:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPackages();
    }, []);

    const resetForm = () => setForm({ type: tab })

    // Save packages to database and localStorage
    const savePackages = async (pkgs: PackagePlan[]) => {
        try {
            await LocalStorageService.savePackages(pkgs);
            // Dispatch custom event for real-time updates in other tabs/components
            window.dispatchEvent(new CustomEvent("packages-updated", { detail: { packages: pkgs } }));
            onPackagesChange?.(pkgs);
        } catch (error) {
            console.error('Error saving packages:', error);
        }
    };

    // Always keep localStorage in sync if packages state changes (for external changes)
    // This ensures that if packages are updated elsewhere, this component stays in sync
    // (Optional: can be removed if not needed)
    // useEffect(() => {
    //     saveToLocalStorage(packages);
    // }, [packages]);

    const handleAddOrUpdate = () => {
        if (!form.name || form.price === undefined || isNaN(Number(form.price))) return;
        if (tab === "advance-balance" && (isNaN(Number(form.advanceAmount)) || isNaN(Number(form.balanceAmount)))) return;

        let updated: PackagePlan[];

        if (editingId) {
            updated = packages.map((p) =>
                p.id === editingId
                    ? { ...form, id: editingId, type: tab, price: Number(form.price), advanceAmount: Number(form.advanceAmount), balanceAmount: Number(form.balanceAmount) } as PackagePlan
                    : p
            );
            setEditingId(null);
        } else {
            updated = [
                ...packages,
                {
                    ...form,
                    id: Math.random().toString(36).slice(2),
                    type: tab,
                    price: Number(form.price),
                    advanceAmount: tab === "advance-balance" ? Number(form.advanceAmount) : undefined,
                    balanceAmount: tab === "advance-balance" ? Number(form.balanceAmount) : undefined,
                } as PackagePlan,
            ];
        }

        setPackages(updated);
        savePackages(updated);
        resetForm();
    }

    const handleEdit = (pkg: PackagePlan) => {
        setForm(pkg)
        setEditingId(pkg.id)
        setTab(pkg.type)
    }

    const handleDeleteClick = (pkg: PackagePlan) => {
        setPackageToDelete(pkg);
        setDeleteDialogOpen(true);
    }

    const handleConfirmDelete = async () => {
        if (!packageToDelete) return;

        const updated = packages.filter((p) => p.id !== packageToDelete.id);
        setPackages(updated);
        savePackages(updated);

        if (editingId === packageToDelete.id) {
            resetForm();
            setEditingId(null);
        }

        setDeleteDialogOpen(false);
        setPackageToDelete(null);
    }

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setPackageToDelete(null);
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Packages Management</CardTitle>
                <CardDescription>
                    Create and manage packages. Choose between One-Time or Advance+Balance payment types.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={tab} onValueChange={(v) => { setTab(v as PackageType); resetForm() }} className="mb-4">
                    <div className="overflow-x-auto">
                        <TabsList className="inline-flex border border-gray-200 rounded-lg bg-white whitespace-nowrap w-max">
                            <TabsTrigger
                                value="one-time"
                                className="px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r border-gray-200 first:rounded-l-lg last:rounded-r-lg data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-black"
                            >
                                One-Time Packages
                            </TabsTrigger>
                            <TabsTrigger
                                value="advance-balance"
                                className="px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r-0 border-gray-200 first:rounded-l-lg last:rounded-r-lg data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-black"
                            >
                                Advance + Balance Packages
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </Tabs>
                <form
                    onSubmit={e => {
                        e.preventDefault()
                        handleAddOrUpdate()
                    }}
                    className="space-y-4 mb-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            placeholder="Package Name"
                            value={form.name || ""}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            required
                        />
                        <Input
                            placeholder="Price"
                            type="number"
                            value={form.price ?? ""}
                            onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                            required={tab === "one-time"}
                            min={0}
                        />
                        {tab === "advance-balance" && (
                            <>
                                <Input
                                    placeholder="Advance Payment"
                                    type="number"
                                    value={form.advanceAmount ?? ""}
                                    onChange={e => {
                                        const adv = Number(e.target.value) || 0;
                                        setForm(f => {
                                            const price = Number(f.price) || 0;
                                            const balance = price - adv >= 0 ? price - adv : 0;
                                            return { ...f, advanceAmount: adv, balanceAmount: balance };
                                        });
                                    }}
                                    min={0}
                                    required
                                />
                                <Input
                                    placeholder="Balance Payment"
                                    type="number"
                                    value={(() => {
                                        const price = Number(form.price) || 0;
                                        const advance = Number(form.advanceAmount) || 0;
                                        return price - advance >= 0 ? price - advance : "";
                                    })()}
                                    readOnly
                                    min={0}
                                    required
                                />
                            </>
                        )}
                    </div>
                    {/* Removed description Textarea */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                            {editingId ? "Update Package" : "Add Package"}
                        </Button>
                        {editingId && (
                            <Button type="button" variant="secondary" onClick={resetForm} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
                <div>
                    <h4 className="font-semibold mb-2">Current Packages</h4>
                    {packages.length === 0 && <div className="text-muted-foreground">No packages added yet.</div>}
                    <div className="space-y-2">
                        {packages.map(pkg => (
                            <Card key={pkg.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="font-medium">{pkg.name}</div>
                                    <div className="text-xs text-muted-foreground mb-1">{pkg.type === "one-time" ? "One-Time" : "Advance + Balance"}</div>
                                    {/* Removed description display */}
                                    {pkg.type === "one-time" ? (
                                        <div className="text-sm font-semibold mt-1">Price: Rs. {pkg.price}</div>
                                    ) : (
                                        <div className="text-sm font-semibold mt-1">Advance: Rs. {pkg.advanceAmount} | Balance: Rs. {pkg.balanceAmount}</div>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0 w-full md:w-auto">
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(pkg)} className="w-full sm:w-auto">
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(pkg)} className="w-full sm:w-auto">
                                        Delete
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </CardContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Package</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the package "{packageToDelete?.name}"?
                            This action cannot be undone and will remove the package from all customers who have purchased it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelDelete}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Package
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}