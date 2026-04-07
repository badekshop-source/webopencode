'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FEATURES_OPTIONS = [
  '4G/5G Speed',
  'Hotspot Support',
  '30 Days Validity',
  'Free Airport Pickup',
  'Priority Support',
  'Free SIM Tool',
  'Unlimited Data',
  'Local Number',
];

const BADGE_OPTIONS = [
  { value: '', label: 'None', color: 'gray' },
  { value: 'popular', label: 'Most Popular', color: 'orange' },
  { value: 'best_value', label: 'Best Value', color: 'green' },
  { value: 'new', label: 'New Arrival', color: 'blue' },
  { value: 'limited', label: 'Limited Edition', color: 'purple' },
] as const;

const DATA_OPTIONS = [
  '',
  'Unlimited',
  '1GB',
  '3GB',
  '5GB',
  '10GB',
  '20GB',
  '50GB',
  '100GB',
];

export default function AdminNewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'esim' as 'esim' | 'sim_card',
    duration: '',
    size: '' as '' | 'nano' | 'micro' | 'standard',
    price: '',
    stock: '0',
    data: '',
    features: [] as string[],
    isActive: true,
    badge: '' as '' | 'popular' | 'best_value' | 'new' | 'limited',
    discountPercentage: '',
    discountStart: '',
    discountEnd: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        size: formData.category === 'sim_card' && formData.size ? formData.size : undefined,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock) || 0,
        features: formData.features,
        isActive: formData.isActive,
        data: formData.data || undefined,
        badge: formData.badge || undefined,
        discountPercentage: formData.discountPercentage ? parseInt(formData.discountPercentage) : 0,
        discountStart: formData.discountStart || undefined,
        discountEnd: formData.discountEnd || undefined,
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create product');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Created!</h2>
            <p className="text-gray-500">Redirecting to products list...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new eSIM or SIM card package</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Bali Unlimited 7 Days"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value as 'esim' | 'sim_card' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="esim">eSIM</SelectItem>
                        <SelectItem value="sim_card">SIM Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 7"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Allowance
                    </label>
                    <Select
                      value={formData.data || ''}
                      onValueChange={(value) => setFormData({ ...formData, data: value || '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select data allowance" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option || 'Not specified'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      e.g., Unlimited, 5GB, 10GB (shown on product card)
                    </p>
                  </div>
                </div>

                {formData.category === 'sim_card' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SIM Size
                    </label>
                    <Select
                      value={formData.size}
                      onValueChange={(value) =>
                        setFormData({ ...formData, size: value as '' | 'nano' | 'micro' | 'standard' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nano">Nano SIM</SelectItem>
                        <SelectItem value="micro">Micro SIM</SelectItem>
                        <SelectItem value="standard">Standard SIM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing & Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (Rp) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g., 300000"
                    required
                  />
                  {formData.price && (
                    <p className="text-xs text-gray-500 mt-1">
                      Rp {parseInt(formData.price).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="e.g., 100"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Discount Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                    placeholder="e.g., 10"
                  />
                  {formData.discountPercentage && formData.price && (
                    <p className="text-xs text-green-600 mt-1">
                      Discounted: Rp {(parseInt(formData.price) * (1 - parseInt(formData.discountPercentage) / 100)).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.discountStart}
                      onChange={(e) => setFormData({ ...formData, discountStart: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={formData.discountEnd}
                      onChange={(e) => setFormData({ ...formData, discountEnd: e.target.value })}
                      min={formData.discountStart || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {formData.discountPercentage && (!formData.discountStart || !formData.discountEnd) && (
                  <p className="text-xs text-amber-600">
                    Leave dates empty for permanent discount, or set both for scheduled discount
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product Badge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge (Optional)
                  </label>
                  <Select
                    value={formData.badge || undefined}
                    onValueChange={(value) =>
                      setFormData({ ...formData, badge: value as typeof formData.badge })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select badge" />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            {option.value && (
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  option.color === 'orange' ? 'bg-orange-500' :
                                  option.color === 'green' ? 'bg-green-500' :
                                  option.color === 'blue' ? 'bg-blue-500' :
                                  option.color === 'purple' ? 'bg-purple-500' :
                                  'bg-gray-300'
                                }`}
                              />
                            )}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.badge && (
                    <p className="text-xs text-gray-500 mt-1">
                      Badge shows on product card to highlight this product.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-3">
                  Select features for this product
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES_OPTIONS.map((feature) => (
                    <label
                      key={feature}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                        formData.features.includes(feature)
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature)}
                        onChange={() => toggleFeature(feature)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {feature}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading || !formData.name || !formData.price}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Product'
                    )}
                  </Button>
                  <Link href="/admin/products">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
