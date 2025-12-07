"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DirectorsShareholderCharges from "./DirectorsShareholderCharges"
import BankDetailsSettings from "./BankDetailsSettings"

export default function PaymentSettings() {
  return (
    <div className="space-y-6">
      <DirectorsShareholderCharges />
      <BankDetailsSettings />
    </div>
  )
}