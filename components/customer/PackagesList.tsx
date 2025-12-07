"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import type { PackagePlan } from "../admin/PackagesManager"

export default function PackagesList({ packages = [] }: { packages: PackagePlan[] }) {
    if (!packages.length) {
        return <div className="text-muted-foreground">No packages available.</div>
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
                <Card key={pkg.id} className="h-full">
                    <CardHeader>
                        <CardTitle>{pkg.name}</CardTitle>
                        <CardDescription>{pkg.type === "one-time" ? "One-Time Payment" : "Advance + Balance Payment"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* pkg.description removed: not present on PackagePlan */}
                        {pkg.type === "one-time" ? (
                            <div className="font-bold text-lg text-primary">Rs {pkg.price}</div>
                        ) : (
                            <div className="space-y-1">
                                <div className="font-semibold text-primary">Advance: Rs {pkg.advanceAmount}</div>
                                <div className="font-semibold text-primary">Balance: Rs {pkg.balanceAmount}</div>
                                <div className="font-bold text-lg text-primary mt-2">Total: Rs {Number(pkg.advanceAmount) + Number(pkg.balanceAmount)}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
