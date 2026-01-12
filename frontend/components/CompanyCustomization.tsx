'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { employerAPI, type Employer } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Edit, Save, X, Calendar, Mail, DollarSign, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { toast } from '@/components/ui/toaster';
import { formatOrdinal } from '@/lib/utils';

interface CompanyCustomizationProps {
  employer: Employer | null;
  onUpdate: () => void;
}

export function CompanyCustomization({ employer, onUpdate }: CompanyCustomizationProps) {
  const router = useRouter();
  const { setEmployer } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    companyName: employer?.companyName || '',
    email: employer?.email || '',
    profileImage: employer?.profileImage || '',
    payrollDay: employer?.payrollDay || 28,
    monthlyBudget: employer?.monthlyBudget ? Number(employer.monthlyBudget) : 0,
  });

  const handleEdit = () => {
    setFormData({
      companyName: employer?.companyName || '',
      email: employer?.email || '',
      profileImage: employer?.profileImage || '',
      payrollDay: employer?.payrollDay || 28,
      monthlyBudget: employer?.monthlyBudget ? Number(employer.monthlyBudget) : 0,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      companyName: employer?.companyName || '',
      email: employer?.email || '',
      profileImage: employer?.profileImage || '',
      payrollDay: employer?.payrollDay || 28,
      monthlyBudget: employer?.monthlyBudget ? Number(employer.monthlyBudget) : 0,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Image Upload] Handler triggered - START');

    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();

    const file = e.target.files?.[0];
    if (!file) {
      console.log('[Image Upload] No file selected');
      return;
    }

    console.log('[Image Upload] File selected:', file.name, 'Size:', file.size, 'bytes', 'Type:', file.type);

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.log('[Image Upload] File too large');
      alert('Image size must be less than 2MB');
      return;
    }

    console.log('[Image Upload] Starting FileReader conversion...');
    setUploadingImage(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadstart = () => {
      console.log('[Image Upload] FileReader started reading...');
    };
    reader.onloadend = () => {
      const base64String = reader.result as string;
      console.log('[Image Upload] Converted to base64, length:', base64String.length);
      console.log('[Image Upload] Setting form data...');
      setFormData(prev => ({ ...prev, profileImage: base64String }));
      setUploadingImage(false);
      console.log('[Image Upload] Form data set - COMPLETE');
    };
    reader.onerror = (error) => {
      console.error('[Image Upload] FileReader error:', error);
      alert('Failed to read image file');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);

    console.log('[Image Upload] FileReader.readAsDataURL called');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employer) return;

    console.log('[Save] Starting save process...');
    setSaving(true);
    try {
      console.log('[Save] Calling API to update employer with data:', {
        companyName: formData.companyName,
        hasProfileImage: !!formData.profileImage,
        profileImageLength: formData.profileImage?.length,
        payrollDay: formData.payrollDay,
        monthlyBudget: formData.monthlyBudget,
      });

      await employerAPI.update(employer.id, {
        companyName: formData.companyName,
        email: formData.email || undefined,
        profileImage: formData.profileImage || undefined,
        payrollDay: formData.payrollDay,
        monthlyBudget: formData.monthlyBudget > 0 ? formData.monthlyBudget : undefined,
      });

      console.log('[Save] Update API call successful, fetching updated data...');

      // Fetch updated employer data
      const response = await employerAPI.get(employer.walletAddress);
      const updatedEmployer = response.data.data;

      console.log('[Save] Fetched updated employer:', {
        hasProfileImage: !!updatedEmployer.profileImage,
        profileImageLength: updatedEmployer.profileImage?.length,
        companyName: updatedEmployer.companyName
      });
      console.log('[Save] Updating store...');

      // Update the store with new employer data
      setEmployer(updatedEmployer);

      console.log('[Save] Store updated, completing save...');

      setIsEditing(false);
      onUpdate();

      console.log('[Save] Save completed successfully!');
    } catch (error: any) {
      console.error('[Save] Failed to update company:', error);
      alert(error.response?.data?.message || 'Failed to update company settings');
    } finally {
      console.log('[Save] Setting saving to false...');
      setSaving(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!employer) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${employer.companyName}"?\n\n` +
      'This action cannot be undone. The company will be permanently disabled and cannot be accessed again.'
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await employerAPI.delete(employer.id);

      toast.success('Company Deleted', `${employer.companyName} has been successfully deleted.`);

      // Clear employer from store and redirect to company selection
      setEmployer(null);
      router.push('/select-company');
    } catch (error: any) {
      console.error('[Delete] Failed to delete company:', error);
      toast.error('Delete Failed', error.response?.data?.message || 'Failed to delete company. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!employer) return null;

  return (
    <Card className="shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Company Settings</CardTitle>
          </div>
          {!isEditing && (
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
        <CardDescription className="text-gray-300">Manage your company information and payroll settings</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-white/20">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-400/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="Company logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-16 w-16 text-purple-300" />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <label className={`cursor-pointer ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <div className="px-4 py-2 bg-white/10 border border-purple-400/30 text-purple-300 rounded-lg hover:bg-white/20 transition-all flex items-center gap-2">
                    {uploadingImage ? (
                      <>
                        <div className="h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </>
                    )}
                  </div>
                </label>
                <p className="text-xs text-gray-400">Max 2MB, JPG/PNG</p>
                {formData.profileImage && !uploadingImage && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, profileImage: '' })}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all text-white placeholder-gray-400"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Company Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all text-white placeholder-gray-400"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="company@example.com"
                />
              </div>

              {/* Payroll Day - Calendar Style */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Payroll Day of Month *
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Select the day when employees receive their monthly salary
                </p>

                {/* Calendar Grid for Day Selection */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400/30 rounded-lg p-5 shadow-sm">
                  {/* Info Banner */}
                  <div className="mb-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                    <p className="text-xs text-blue-200 leading-relaxed">
                      <span className="font-semibold">Safe for all months:</span> Days 1-28 are available in every month.
                      Avoid 29-31 as some months (February, April, June, September, November) don't have these days.
                    </p>
                  </div>

                  {/* Days 1-14 */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-300 mb-2 px-1">Early Month (1-14)</div>
                    <div className="grid grid-cols-7 gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => {
                        const isSelected = formData.payrollDay === day;
                        const isPopular = [1, 15].includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setFormData({ ...formData, payrollDay: day })}
                            className={`
                              relative h-10 rounded-lg font-medium text-sm transition-all
                              ${isSelected
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105 ring-2 ring-blue-400'
                                : isPopular
                                  ? 'bg-white/20 text-blue-300 border-2 border-blue-400/50 hover:border-blue-400 hover:bg-white/30 shadow-sm'
                                  : 'bg-white/10 text-gray-300 border border-white/20 hover:border-blue-400/50 hover:bg-white/20'
                              }
                              cursor-pointer
                            `}
                          >
                            {day}
                            {isPopular && !isSelected && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Days 15-28 */}
                  <div>
                    <div className="text-xs font-semibold text-gray-300 mb-2 px-1">Mid to Late Month (15-28)</div>
                    <div className="grid grid-cols-7 gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      {Array.from({ length: 14 }, (_, i) => i + 15).map((day) => {
                        const isSelected = formData.payrollDay === day;
                        const isPopular = [15, 28].includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setFormData({ ...formData, payrollDay: day })}
                            className={`
                              relative h-10 rounded-lg font-medium text-sm transition-all
                              ${isSelected
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105 ring-2 ring-blue-400'
                                : isPopular
                                  ? 'bg-white/20 text-blue-300 border-2 border-blue-400/50 hover:border-blue-400 hover:bg-white/30 shadow-sm'
                                  : 'bg-white/10 text-gray-300 border border-white/20 hover:border-blue-400/50 hover:bg-white/20'
                              }
                              cursor-pointer
                            `}
                          >
                            {day}
                            {isPopular && !isSelected && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Day Display */}
                  <div className="mt-5 pt-4 border-t-2 border-purple-400/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 font-medium">Selected Day:</span>
                      <span className="text-lg font-bold text-blue-300">
                        {formatOrdinal(formData.payrollDay)} of each month
                      </span>
                    </div>
                    {[1, 15, 28].includes(formData.payrollDay) && (
                      <p className="text-xs text-blue-300 mt-2 flex items-center gap-1.5 bg-blue-500/10 px-2 py-1.5 rounded">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                        Popular choice - commonly used by many companies
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Budget */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Monthly Budget (MNEE)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all text-white placeholder-gray-400"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-400 mt-1">Optional spending cap for monthly payroll</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/20">
              <Button
                type="submit"
                disabled={saving || uploadingImage}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : uploadingImage ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing image...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Profile Image Display */}
            <div className="flex flex-col items-center gap-3 pb-6 border-b border-white/20">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-400/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shadow-lg">
                {employer.profileImage ? (
                  <img
                    src={employer.profileImage}
                    alt={`${employer.companyName} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="h-16 w-16 text-purple-400" />
                )}
              </div>
              <p className="text-sm text-gray-300">Company Logo</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Company Name Display */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
                <label className="text-sm font-medium text-gray-300 mb-1 block">Company Name</label>
                <p className="text-lg font-semibold text-white">{employer.companyName}</p>
              </div>

              {/* Email Display */}
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-400/30">
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Company Email
                </label>
                <p className="text-lg font-semibold text-white">
                  {employer.email || <span className="text-gray-400 text-base">Not set</span>}
                </p>
              </div>

              {/* Payroll Day Display */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Payroll Day
                </label>
                <p className="text-lg font-semibold text-white">
                  {employer.payrollDay}
                  <span className="text-sm font-normal text-gray-300"> of each month</span>
                </p>
              </div>

              {/* Monthly Budget Display */}
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-4 border border-amber-400/30">
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Monthly Budget
                </label>
                <p className="text-lg font-semibold text-white">
                  {employer.monthlyBudget ? (
                    <>{Number(employer.monthlyBudget).toFixed(2)} MNEE</>
                  ) : (
                    <span className="text-gray-400 text-base">Not set</span>
                  )}
                </p>
              </div>
            </div>

            {/* Wallet Address (Read-only) */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-4 border border-white/20">
              <label className="text-sm font-medium text-gray-300 mb-2 block">Wallet Address (Read-only)</label>
              <p className="text-sm font-mono text-gray-200 break-all bg-white/5 px-3 py-2 rounded border border-white/20">
                {employer.walletAddress}
              </p>
              <p className="text-xs text-gray-400 mt-2">This is your company's unique wallet identifier</p>
            </div>

            {/* Danger Zone - Delete Company */}
            <div className="mt-8 pt-6 border-t border-red-400/30">
              <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-300 mb-1">Delete Company</h3>
                    <p className="text-sm text-red-200 mb-4">
                      This will permanently disable the company. You won't be able to access it anymore.
                    </p>
                    <Button
                      onClick={handleDeleteCompany}
                      disabled={deleting}
                      variant="outline"
                      className="bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 hover:text-white"
                    >
                      {deleting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete This Company
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
