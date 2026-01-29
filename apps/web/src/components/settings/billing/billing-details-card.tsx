'use client';

/**
 * Billing Details Card
 * 
 * Form for billing address and contact info.
 */

import { useState, useEffect } from 'react';
import { MapPin, Save, Loader2 } from 'lucide-react';
import { useBillingDetails, useUpdateBillingDetails, type BillingDetails } from '@/lib/query/billing';

export function BillingDetailsCard() {
  const { data: billingDetails, isLoading } = useBillingDetails();
  const updateBilling = useUpdateBillingDetails();
  
  const [formData, setFormData] = useState<BillingDetails>({
    name: '',
    email: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });

  useEffect(() => {
    if (billingDetails) {
      setFormData({
        name: billingDetails.name || '',
        email: billingDetails.email || '',
        address: {
          line1: billingDetails.address?.line1 || '',
          line2: billingDetails.address?.line2 || '',
          city: billingDetails.address?.city || '',
          state: billingDetails.address?.state || '',
          postalCode: billingDetails.address?.postalCode || '',
          country: billingDetails.address?.country || '',
        },
      });
    }
  }, [billingDetails]);

  const handleSave = async () => {
    await updateBilling.mutateAsync(formData);
  };

  const updateField = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-teal-100 rounded-lg">
          <MapPin className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Billing Details</h2>
          <p className="text-sm text-slate-600">Invoice and billing address</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Billing Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              value={formData.address?.line1}
              onChange={(e) => updateField('address.line1', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.address?.line2}
              onChange={(e) => updateField('address.line2', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.address?.city}
                onChange={(e) => updateField('address.city', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.address?.state}
                onChange={(e) => updateField('address.state', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.address?.postalCode}
                onChange={(e) => updateField('address.postalCode', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={formData.address?.country}
                onChange={(e) => updateField('address.country', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={updateBilling.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {updateBilling.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Details
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
