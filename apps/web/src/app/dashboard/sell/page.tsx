'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useAuth } from '@/hooks/useAuth';
import { useCreateCarMutation } from '@/store/services/carsApi';
import { useUpdateRoleMutation } from '@/store/services/usersApi';
import {
  CarCondition,
  BodyType,
  Transmission,
  FuelType,
} from '@car-auction/shared';
import { ArrowLeft, PlusCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [createCarMutation, { isLoading: isCreating }] = useCreateCarMutation();
  const [updateRole, { isLoading: isUpgrading }] = useUpdateRoleMutation();

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    condition: 'Used' as CarCondition,
    bodyType: 'Sedan' as BodyType,
    mileage: 15000,
    transmission: 'Automatic' as Transmission,
    fuelType: 'Petrol' as FuelType,
    color: '',
    startingBid: 10000,
    reservePrice: 12000,
    description: '',
    auctionDurationDays: 7,
  });

  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
  ]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  const handleUpgradeRole = async () => {
    try {
      await updateRole({ role: 'seller' }).unwrap();
      window.location.reload();
    } catch {
      setErrorMsg('Failed to upgrade account role');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.make || !formData.model || !formData.description) {
      setErrorMsg('Make, model, and description are required fields');
      return;
    }

    if (images.length === 0) {
      setErrorMsg('Please add at least one vehicle image');
      return;
    }

    try {
      const newCar = await createCarMutation({
        ...formData,
        images,
      }).unwrap();

      setSuccessMsg('Auction listing created successfully!');
      setTimeout(() => {
        router.push(`/car/${newCar._id}`);
      }, 1200);
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      setErrorMsg(message || 'Failed to create listing');
    }
  };

  if (!isSeller) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-16 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold">Seller Account Required</h1>
          <p className="text-sm text-muted-foreground">
            You are currently registered with a Buyer account. Upgrade your account to Seller status to list vehicles for auction!
          </p>

          <button
            type="button"
            onClick={handleUpgradeRole}
            disabled={isUpgrading}
            className="w-full rounded-2xl bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
          >
            {isUpgrading ? 'Upgrading Account…' : 'Upgrade to Seller Account (Free Instant Upgrade)'}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Create Vehicle Auction Listing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fill out vehicle specifications, starting bid price, and photos to launch a live auction room.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Core Details */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold border-b border-border pb-3">1. Vehicle Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                label="Make / Brand"
                placeholder="e.g. BMW, Porsche, Ford"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                required
              />
              <FormField
                label="Model"
                placeholder="e.g. M4 Competition, 911 GT3"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
              <FormField
                label="Model Year"
                type="number"
                min={1950}
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* Section 2: Technical Specifications */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold border-b border-border pb-3">2. Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Condition"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as CarCondition })}
                options={[
                  { label: 'Used', value: 'Used' },
                  { label: 'New', value: 'New' },
                  { label: 'Certified Pre-Owned', value: 'Certified Pre-Owned' },
                ]}
              />
              <Select
                label="Body Type"
                value={formData.bodyType}
                onChange={(e) => setFormData({ ...formData, bodyType: e.target.value as BodyType })}
                options={[
                  { label: 'Sedan', value: 'Sedan' },
                  { label: 'SUV', value: 'SUV' },
                  { label: 'Coupe', value: 'Coupe' },
                  { label: 'Truck', value: 'Truck' },
                  { label: 'Hatchback', value: 'Hatchback' },
                  { label: 'Convertible', value: 'Convertible' },
                  { label: 'Wagon', value: 'Wagon' },
                ]}
              />
              <FormField
                label="Mileage (miles)"
                type="number"
                min={0}
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                required
              />
              <Select
                label="Transmission"
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value as Transmission })}
                options={[
                  { label: 'Automatic', value: 'Automatic' },
                  { label: 'Manual', value: 'Manual' },
                ]}
              />
              <Select
                label="Fuel Type"
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
                options={[
                  { label: 'Petrol', value: 'Petrol' },
                  { label: 'Diesel', value: 'Diesel' },
                  { label: 'Electric', value: 'Electric' },
                  { label: 'Hybrid', value: 'Hybrid' },
                ]}
              />
              <FormField
                label="Color"
                placeholder="e.g. Isle of Man Green"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>

          {/* Section 3: Pricing & Auction Setup */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold border-b border-border pb-3">3. Auction & Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                label="Starting Bid ($)"
                type="number"
                min={100}
                value={formData.startingBid}
                onChange={(e) => setFormData({ ...formData, startingBid: Number(e.target.value) })}
                required
              />
              <FormField
                label="Reserve Price ($ - Optional)"
                type="number"
                min={0}
                value={formData.reservePrice}
                onChange={(e) => setFormData({ ...formData, reservePrice: Number(e.target.value) })}
              />
              <Select
                label="Auction Duration"
                value={formData.auctionDurationDays}
                onChange={(e) => setFormData({ ...formData, auctionDurationDays: Number(e.target.value) })}
                options={[
                  { label: '3 Days', value: 3 },
                  { label: '5 Days', value: 5 },
                  { label: '7 Days (Recommended)', value: 7 },
                  { label: '10 Days', value: 10 },
                ]}
              />
            </div>

            <div className="space-y-1.5 pt-2">
              <label htmlFor="description" className="block text-xs font-bold text-foreground">
                Seller Description & Vehicle Notes
              </label>
              <textarea
                id="description"
                rows={4}
                required
                placeholder="Provide details on maintenance history, modifications, condition notes, and features…"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-2xl border border-input bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Section 4: Image Upload Gallery Stub */}
          <ImageUploader images={images} onChange={setImages} />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-extrabold text-primary-foreground shadow-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <PlusCircle className="h-5 w-5" />
            {isCreating ? 'Publishing Auction Listing…' : 'Publish Vehicle Auction Now'}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
